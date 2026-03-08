/**
 * NAVADA Inbox Auto-Responder v2
 * Continuously monitors claude.navada@zohomail.eu via IMAP
 * Engages in human-like threaded conversations (2+ cycles)
 * Routes enquiries to Lee Akpareva
 * Adds realistic delays so replies don't feel instant/bot-like
 *
 * Runs as PM2 daemon — always listening.
 */

require('dotenv').config({ path: __dirname + '/.env' });
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { sendEmail, p, callout } = require('./email-service');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const { parseApproval, executeApproved } = require('./self-improve');

const PROCESSED_FILE = path.join(__dirname, 'kb', 'inbox-processed.json');
const THREADS_FILE = path.join(__dirname, 'kb', 'inbox-threads.json');
const LOG_FILE = path.join(__dirname, 'logs', 'inbox-responder.log');
const CC_ADDRESS = 'leeakpareva@gmail.com';
const POLL_INTERVAL = 60 * 1000; // 60 seconds

// Human-like reply delay: 45-120 seconds (feels like someone read and typed)
const MIN_DELAY_MS = 45 * 1000;
const MAX_DELAY_MS = 120 * 1000;

// Max conversation cycles before handing off entirely to Lee
const MAX_CYCLES = 3;

// Emails to ignore
const IGNORE_FROM = ['noreply', 'no-reply', 'mailer-daemon', 'postmaster', 'welcome@zoho', 'notifications@', 'updates@', 'leeakpareva@gmail.com', 'claude@navada-edge-server.uk'];
const IGNORE_SUBJECTS = ['undeliverable', 'delivery failed', 'delivery status', 'mail delivery', 'failure notice', 'returned mail', 'out of office', 'auto-reply', 'automatic reply', '[inbox]', '[action]'];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) { /* ignore */ }
}

// ============================================================
// Processed UIDs (dedup)
// ============================================================
function getProcessed() {
  try {
    return JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));
  } catch (e) {
    return { uids: [], lastCheck: null };
  }
}

function saveProcessed(data) {
  data.uids = data.uids.slice(-500);
  data.lastCheck = new Date().toISOString();
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(data, null, 2));
}

// ============================================================
// Conversation Threads (memory across email exchanges)
// ============================================================
function getThreads() {
  try {
    return JSON.parse(fs.readFileSync(THREADS_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveThreads(threads) {
  // Prune threads older than 7 days
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const key of Object.keys(threads)) {
    if (new Date(threads[key].lastActivity).getTime() < cutoff) {
      delete threads[key];
    }
  }
  fs.writeFileSync(THREADS_FILE, JSON.stringify(threads, null, 2));
}

function getThreadKey(from, subject) {
  // Normalise: strip Re:/Fwd: prefixes, lowercase, combine with sender
  const cleanSubject = (subject || '').replace(/^(re:|fwd?:)\s*/gi, '').trim().toLowerCase();
  const senderAddr = (from || '').match(/<([^>]+)>/)?.[1]?.toLowerCase() || from.toLowerCase();
  return `${senderAddr}::${cleanSubject}`;
}

// ============================================================
// Human-like delay
// ============================================================
function humanDelay() {
  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  log(`  Waiting ${Math.round(delay / 1000)}s before replying (human-like delay)...`);
  return new Promise(resolve => setTimeout(resolve, delay));
}

// ============================================================
// Ignore logic
// ============================================================
function shouldIgnore(from, subject) {
  const fromLower = (from || '').toLowerCase();
  const subjectLower = (subject || '').toLowerCase();
  if (IGNORE_FROM.some(f => fromLower.includes(f))) return true;
  if (IGNORE_SUBJECTS.some(s => subjectLower.includes(s))) return true;
  if (fromLower.includes('claude.navada@zohomail.eu')) return true;
  return false;
}

// ============================================================
// Extract fresh reply text (strip quoted chains)
// ============================================================
function extractReplyText(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const fresh = [];
  for (const line of lines) {
    if (line.trim().startsWith('>')) break;
    if (line.trim().startsWith('On ') && line.includes(' wrote:')) break;
    if (line.trim() === '---') break;
    if (line.includes('Original Message')) break;
    if (line.includes('---------- Forwarded message')) break;
    fresh.push(line);
  }
  return fresh.join('\n').trim();
}

// ============================================================
// Generate reply with conversation context
// ============================================================
async function generateReply(from, subject, text, thread) {
  const senderName = from.split('<')[0].trim().split(' ')[0] || 'there';
  const cleanText = extractReplyText(text);
  const cycle = thread ? thread.cycle : 0;

  // Build conversation history for GPT context
  let conversationContext = '';
  if (thread && thread.messages.length > 0) {
    conversationContext = '\n\nPrevious conversation:\n' +
      thread.messages.slice(-4).map(m =>
        `[${m.role === 'them' ? m.name : 'Claude'}]: ${m.text.substring(0, 300)}`
      ).join('\n');
  }

  // Adapt system prompt based on conversation cycle
  let cycleGuidance = '';
  if (cycle === 0) {
    cycleGuidance = `This is the FIRST email from this person. Warmly acknowledge what they said, respond naturally, and mention that you've looped in Lee Akpareva who can follow up directly. If they're asking about services, share brief relevant info about NAVADA's AI consulting work.`;
  } else if (cycle === 1) {
    cycleGuidance = `This is a FOLLOW-UP reply (2nd email in the thread). They've replied to your earlier message. Continue the conversation naturally — reference what was discussed before. If they have specific questions, answer what you can about NAVADA. Gently guide towards scheduling a call or meeting with Lee if it's getting detailed.`;
  } else {
    cycleGuidance = `This is the ${cycle + 1}th email in the thread. You've been chatting back and forth. At this point, be warm but steer towards connecting them directly with Lee Akpareva for next steps. Suggest they email Lee at leeakpareva@gmail.com or that Lee will reach out shortly.`;
  }

  try {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      max_tokens: 250,
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content: `You are Claude, working at NAVADA — an AI engineering and consulting firm founded by Lee Akpareva. Lee is a Principal AI Consultant with 17+ years in digital transformation across insurance, finance, healthcare, aviation, and e-commerce. NAVADA specialises in enterprise AI solutions, multi-agent architectures, computer vision, and ML engineering.

You're replying to an email sent to claude.navada@zohomail.eu. Write like a real human colleague — not a bot.

${cycleGuidance}

Style rules:
- Write 2-4 sentences MAX. Short and punchy like a real person texting from their phone
- Sound natural and warm — like a friendly colleague, not corporate
- Use casual language where appropriate ("Yeah definitely", "That sounds great", "Totally get that")
- Address them by first name
- Do NOT use bullet points, numbered lists, or formal headers
- Do NOT say "I hope this email finds you well" or any cliché opener
- Do NOT start with "Thank you for reaching out" or similar bot phrases
- NEVER mention you are an AI, bot, or automated system
- NEVER use exclamation marks more than once
- Vary your sign-offs (Cheers, Best, Speak soon, Talk soon, All the best)
- Occasionally use contractions (I'm, we're, that's, don't)
- If you don't know something specific, say "let me check with Lee" rather than making it up
- Lee's email for direct contact: leeakpareva@gmail.com${conversationContext}`
        },
        {
          role: 'user',
          content: `From: ${from}\nSubject: ${subject}\n\n${cleanText.substring(0, 600)}`
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const reply = res.data.choices[0].message.content.trim();
    const htmlReply = reply.split('\n').filter(l => l.trim()).map(l => p(l)).join('');
    return { html: htmlReply, plain: reply };

  } catch (e) {
    log(`  OpenAI error: ${e.message} — using fallback reply`);
    const fallback = `Hi ${senderName},\n\nThanks for getting in touch. I've flagged this with Lee and he'll get back to you shortly. If it's urgent, drop him a line at leeakpareva@gmail.com.\n\nCheers,`;
    return {
      html: `
        ${p(`Hi ${senderName},`)}
        ${p('Thanks for getting in touch. I\'ve flagged this with Lee and he\'ll get back to you shortly. If it\'s urgent, drop him a line at <a href="mailto:leeakpareva@gmail.com" style="color:#1971c2;">leeakpareva@gmail.com</a>.')}
        ${p('Cheers,')}
      `,
      plain: fallback,
    };
  }
}

// ============================================================
// Process new emails
// ============================================================
async function processNewEmails(imap) {
  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) return reject(err);

      const processed = getProcessed();
      const threads = getThreads();

      imap.search(['UNSEEN'], (err, uids) => {
        if (err) return reject(err);

        const newUids = uids.filter(uid => !processed.uids.includes(uid));

        if (newUids.length === 0) {
          return resolve(0);
        }

        log(`Found ${newUids.length} new unread email(s).`);

        const fetch = imap.fetch(newUids, { bodies: '', markSeen: true });
        const emails = [];

        fetch.on('message', (msg) => {
          let rawBody = '';
          let uid = null;

          msg.on('body', (stream) => {
            stream.on('data', c => rawBody += c.toString());
          });

          msg.on('attributes', (attrs) => {
            uid = attrs.uid;
          });

          msg.on('end', () => {
            emails.push({ rawBody, uid });
          });
        });

        fetch.on('end', async () => {
          let replied = 0;

          for (const { rawBody, uid } of emails) {
            try {
              const parsed = await simpleParser(rawBody);
              const from = parsed.from?.text || 'Unknown';
              const subject = parsed.subject || '(no subject)';
              const text = parsed.text || '';
              const replyTo = parsed.replyTo?.text || parsed.from?.value?.[0]?.address || '';
              const senderAddr = (parsed.from?.value?.[0]?.address || '').toLowerCase();
              const messageId = parsed.messageId || '';

              log(`Processing: "${subject}" from ${from}`);

              if (shouldIgnore(from, subject)) {
                log(`  Skipping (ignored sender/subject)`);
                processed.uids.push(uid);
                continue;
              }

              // Check if this is an approval reply from Lee (self-improve system)
              const isFromLee = senderAddr.includes('leeakpareva') || senderAddr.includes('lee@navada');
              const isImprovementReply = (subject || '').toLowerCase().includes('improvement report') ||
                                          (subject || '').toLowerCase().includes('improvements executed');

              if (isFromLee && isImprovementReply) {
                log(`  Detected improvement approval reply from Lee`);
                const approval = parseApproval(text);
                if (approval.action === 'approve' && approval.ids.length > 0) {
                  log(`  Approved items: ${approval.ids.join(', ')}`);
                  executeApproved(approval.ids).catch(e => log(`  Execution error: ${e.message}`));
                  await humanDelay();
                  await sendEmail({
                    to: senderAddr,
                    subject: `Re: ${subject}`,
                    heading: 'Approval Received',
                    body: `${p('Got it — executing items ' + approval.ids.join(', ') + ' now.')}${p('I\'ll send a confirmation email when everything is done.')}`,
                    type: 'update',
                    footerNote: 'NAVADA Self-Improvement System',
                  });
                  processed.uids.push(uid);
                  continue;
                } else if (approval.action === 'skip') {
                  log(`  Lee skipped all improvements this week`);
                  processed.uids.push(uid);
                  continue;
                }
              }

              // --- Conversation Threading ---
              const threadKey = getThreadKey(from, subject);
              const senderName = from.split('<')[0].trim().split(' ')[0] || 'there';

              if (!threads[threadKey]) {
                threads[threadKey] = {
                  sender: from,
                  senderAddr,
                  senderName,
                  subject: subject.replace(/^(re:|fwd?:)\s*/gi, '').trim(),
                  cycle: 0,
                  messages: [],
                  firstContact: new Date().toISOString(),
                  lastActivity: new Date().toISOString(),
                };
              }

              const thread = threads[threadKey];
              const cleanText = extractReplyText(text);

              // Store their message in thread
              thread.messages.push({
                role: 'them',
                name: senderName,
                text: cleanText.substring(0, 500),
                date: new Date().toISOString(),
                messageId,
              });

              // Check if we've exceeded max cycles — hand off entirely
              if (thread.cycle >= MAX_CYCLES) {
                log(`  Thread ${threadKey} at cycle ${thread.cycle} — handing off to Lee`);
                await humanDelay();
                const handoffReply = `
                  ${p(`Hey ${senderName},`)}
                  ${p('I\'m going to get Lee on this directly — he\'s best placed to take it from here. He\'ll be in touch shortly.')}
                  ${p('Cheers,')}
                `;
                const toAddress = replyTo || senderAddr;
                await sendEmail({
                  to: toAddress,
                  subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
                  heading: subject.replace(/^Re:\s*/i, ''),
                  body: handoffReply,
                  type: 'general',
                  footerNote: 'Claude | NAVADA',
                });
                // Alert Lee
                await sendEmail({
                  to: CC_ADDRESS,
                  subject: `[ACTION] ${thread.subject} — ${from} (${thread.cycle + 1} emails deep)`,
                  heading: 'Needs Your Attention',
                  body: `
                    ${p(`<strong>${senderName}</strong> has exchanged ${thread.cycle + 1} emails. They need you directly now.`)}
                    ${p(`<strong>Subject:</strong> ${thread.subject}`)}
                    ${p(`<strong>Their latest:</strong>`)}
                    ${callout(cleanText.substring(0, 500))}
                    ${p(`<strong>Full thread (${thread.messages.length} messages):</strong>`)}
                    ${thread.messages.map(m => `<div style="margin:4px 0;font-size:12px;color:${m.role === 'them' ? '#333' : '#888'}"><strong>${m.role === 'them' ? m.name : 'Claude'}:</strong> ${m.text.substring(0, 200)}</div>`).join('')}
                    ${p(`<br>Reply to: <a href="mailto:${senderAddr}">${senderAddr}</a>`)}
                  `,
                  type: 'alert',
                  footerNote: 'Inbox auto-responder — handoff after ' + MAX_CYCLES + ' cycles',
                });
                thread.cycle++;
                thread.lastActivity = new Date().toISOString();
                processed.uids.push(uid);
                saveThreads(threads);
                replied++;
                continue;
              }

              // Generate contextual reply
              const { html: replyBody, plain: replyPlain } = await generateReply(from, subject, text, thread);
              const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
              const toAddress = replyTo || senderAddr;

              if (!toAddress) {
                log(`  No reply address found, skipping`);
                processed.uids.push(uid);
                continue;
              }

              // Human-like delay before sending
              await humanDelay();

              await sendEmail({
                to: toAddress,
                subject: replySubject,
                heading: replySubject.replace(/^Re:\s*/i, ''),
                body: replyBody,
                type: 'general',
                footerNote: 'Claude | NAVADA',
              });

              // Store our reply in thread
              thread.messages.push({
                role: 'claude',
                text: replyPlain.substring(0, 500),
                date: new Date().toISOString(),
              });
              thread.cycle++;
              thread.lastActivity = new Date().toISOString();

              // CC Lee with thread context
              const cycleLabel = thread.cycle === 1 ? '1st reply' : `${thread.cycle}th reply (${thread.messages.length} msgs total)`;
              await sendEmail({
                to: CC_ADDRESS,
                subject: `[INBOX] ${replySubject} — ${cycleLabel}`,
                heading: 'Inbox Activity',
                body: `
                  ${p(`<strong>From:</strong> ${from}`)}
                  ${p(`<strong>Subject:</strong> ${subject}`)}
                  ${p(`<strong>Cycle:</strong> ${thread.cycle} of ${MAX_CYCLES} (auto-handoff after ${MAX_CYCLES})`)}
                  ${p(`<strong>Their message:</strong>`)}
                  ${callout(cleanText.substring(0, 500))}
                  ${p(`<strong>My reply:</strong>`)}
                  ${callout(replyPlain.substring(0, 500))}
                `,
                type: 'update',
                footerNote: 'Inbox auto-responder — claude.navada@zohomail.eu',
              });

              log(`  Replied to ${toAddress} (cycle ${thread.cycle}/${MAX_CYCLES}), CC'd Lee`);
              replied++;
              processed.uids.push(uid);
              saveThreads(threads);

            } catch (e) {
              log(`  Error processing email: ${e.message}`);
              processed.uids.push(uid);
            }
          }

          saveProcessed(processed);
          resolve(replied);
        });

        fetch.on('error', reject);
      });
    });
  });
}

// ============================================================
// Main monitor loop
// ============================================================
function startMonitor() {
  log('=== NAVADA Inbox Auto-Responder v2 Starting ===');
  log(`Monitoring: ${process.env.ZOHO_USER}`);
  log(`CC replies to: ${CC_ADDRESS}`);
  log(`Max cycles before handoff: ${MAX_CYCLES}`);
  log(`Reply delay: ${MIN_DELAY_MS / 1000}-${MAX_DELAY_MS / 1000}s`);
  log(`Poll interval: ${POLL_INTERVAL / 1000}s`);

  function poll() {
    const imap = new Imap({
      user: process.env.ZOHO_USER,
      password: process.env.ZOHO_APP_PASSWORD,
      host: 'imap.zoho.eu',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
    });

    imap.once('ready', async () => {
      try {
        const count = await processNewEmails(imap);
        if (count > 0) log(`Replied to ${count} email(s).`);
      } catch (e) {
        log(`Error: ${e.message}`);
      } finally {
        try { imap.end(); } catch (e) { /* ignore */ }
      }
    });

    imap.once('error', (e) => {
      log(`IMAP error: ${e.message}`);
    });

    imap.connect();
  }

  poll();
  setInterval(poll, POLL_INTERVAL);
  log('Auto-responder v2 running.');
}

if (require.main === module) {
  startMonitor();
}

module.exports = { processNewEmails, startMonitor };
