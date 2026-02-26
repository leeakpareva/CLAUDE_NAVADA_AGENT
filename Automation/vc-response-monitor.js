/**
 * NAVADA VC Response Monitor
 * Polls IMAP inbox for replies from Tim & Uncle Patrick
 * Sends Lee an alert email when either responds
 * Runs via PM2 — polls every 2 minutes
 */

require('dotenv').config({ path: __dirname + '/.env' });
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { sendEmail, p, callout } = require('./email-service');
const fs = require('fs');
const path = require('path');

const MONITOR_FILE = path.join(__dirname, 'kb', 'vc-response-monitor.json');
const LOG_FILE = path.join(__dirname, 'logs', 'vc-monitor.log');
const POLL_INTERVAL = 2 * 60 * 1000; // 2 minutes

const WATCHED_EMAILS = [
  { name: 'Tim', email: 'tim_akpareva@yahoo.co.uk' },
  { name: 'Uncle Patrick', email: 'patakpareva@gmail.com' },
];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) { /* ignore */ }
}

function getMonitorData() {
  try {
    return JSON.parse(fs.readFileSync(MONITOR_FILE, 'utf8'));
  } catch (e) {
    return null;
  }
}

function saveMonitorData(data) {
  fs.writeFileSync(MONITOR_FILE, JSON.stringify(data, null, 2));
}

function checkInbox() {
  const monitor = getMonitorData();
  if (!monitor || monitor.status === 'all_responded') {
    log('All responses received or no monitor data. Exiting.');
    process.exit(0);
    return;
  }

  const imap = new Imap({
    user: process.env.ZOHO_USER,
    password: process.env.ZOHO_APP_PASSWORD,
    host: 'imap.zoho.eu',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  imap.once('ready', () => {
    imap.openBox('INBOX', true, (err, box) => {
      if (err) {
        log(`IMAP error: ${err.message}`);
        imap.end();
        return;
      }

      // Search for recent emails (last 7 days)
      const since = new Date();
      since.setDate(since.getDate() - 7);

      imap.search(['ALL', ['SINCE', since]], (err, results) => {
        if (err || !results || results.length === 0) {
          log('No recent emails found');
          imap.end();
          return;
        }

        const fetch = imap.fetch(results, { bodies: '', struct: true });
        const emails = [];

        fetch.on('message', (msg) => {
          msg.on('body', (stream) => {
            let buffer = '';
            stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
            stream.on('end', () => emails.push(buffer));
          });
        });

        fetch.once('end', async () => {
          imap.end();

          for (const raw of emails) {
            try {
              const parsed = await simpleParser(raw);
              const fromAddr = parsed.from?.value?.[0]?.address?.toLowerCase() || '';
              const subject = (parsed.subject || '').toLowerCase();

              // Check if this is from one of our watched recipients
              for (const recipient of monitor.recipients) {
                if (recipient.responded) continue;

                if (fromAddr === recipient.email.toLowerCase() &&
                    (subject.includes('vc') || subject.includes('investment') || subject.includes('akpareva') || subject.includes('re:'))) {

                  log(`Response detected from ${recipient.name} (${recipient.email})`);
                  recipient.responded = true;
                  recipient.respondedAt = new Date().toISOString();
                  recipient.responseSubject = parsed.subject;
                  recipient.responsePreview = (parsed.text || '').substring(0, 500);

                  // Send alert to Lee
                  await sendEmail({
                    to: 'leeakpareva@gmail.com',
                    subject: `VC Response Alert: ${recipient.name} has replied`,
                    heading: 'VC Initiative — Response Received',
                    body: `
                      ${p(`<strong>${recipient.name}</strong> (${recipient.email}) has responded to the Akpareva Family VC initiative email.`)}
                      ${callout(`
                        <strong>Subject:</strong> ${parsed.subject}<br><br>
                        <strong>Preview:</strong><br>${(parsed.text || '').substring(0, 500).replace(/\n/g, '<br>')}
                      `, 'info')}
                      ${p('Check your inbox for the full reply. The response has been logged.')}
                    `,
                    type: 'alert',
                    fromName: 'Claude | NAVADA',
                    preheader: `${recipient.name} responded to the VC initiative email`,
                  });

                  log(`Alert sent to Lee about ${recipient.name}'s response`);
                }
              }
            } catch (e) {
              log(`Parse error: ${e.message}`);
            }
          }

          // Check if all have responded
          const allResponded = monitor.recipients.every(r => r.responded);
          if (allResponded) {
            monitor.status = 'all_responded';
            log('All recipients have responded. Monitor complete.');

            await sendEmail({
              to: 'leeakpareva@gmail.com',
              subject: 'VC Initiative — All Responses Received',
              heading: 'All Responses In',
              body: `
                ${p('Both <strong>Tim</strong> and <strong>Uncle Patrick</strong> have now responded to the VC initiative email.')}
                ${callout('Time to schedule the group call and formalise the structure. Check your inbox for their individual responses.', 'info')}
              `,
              type: 'alert',
              fromName: 'Claude | NAVADA',
              preheader: 'Both Tim and Uncle Patrick have replied — time for next steps',
            });
          }

          saveMonitorData(monitor);
        });
      });
    });
  });

  imap.once('error', (err) => {
    log(`IMAP connection error: ${err.message}`);
  });

  imap.connect();
}

// Run immediately, then poll
log('VC Response Monitor started');
checkInbox();
setInterval(checkInbox, POLL_INTERVAL);
