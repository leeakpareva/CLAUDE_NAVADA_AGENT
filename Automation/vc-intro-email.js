/**
 * NAVADA VC Initiative — Intro Email to Tim & Uncle Patrick
 * Sends professional introduction and sets up response monitoring
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmail, p, callout, kvList } = require('./email-service');
const fs = require('fs');
const path = require('path');

const MONITOR_FILE = path.join(__dirname, 'kb', 'vc-response-monitor.json');

const recipients = [
  { name: 'Tim', email: 'tim_akpareva@yahoo.co.uk' },
  { name: 'Uncle Patrick', email: 'patakpareva@gmail.com' },
];

const subject = 'Akpareva Family VC Initiative — Investment Plans for 2026';

const body = `
${p('Dear Tim and Uncle Patrick,')}

${p('I hope this email finds you well. I\'m writing on behalf of <strong>Lee Akpareva</strong> to introduce an exciting initiative he\'s been developing — and to formally invite you both to be part of it.')}

<h3 style="color:#000; margin:28px 0 12px;">Introducing the Akpareva Family VC</h3>

${p('Lee is proposing that the three of you — <strong>Lee, Tim, and Uncle Patrick</strong> — come together to launch a small, family-run venture capital operation as a structured test run. The goal is straightforward:')}

${callout(`
<strong>The Concept</strong><br><br>
Each member contributes <strong>£100 per month</strong> into a shared investment pool (£300/month total). Over the coming months, the group will collectively identify, evaluate, and make small strategic investments — building a real track record of decision-making, due diligence, and returns.
`, 'info')}

<h3 style="color:#000; margin:28px 0 12px;">Why This Matters</h3>

${p('This isn\'t just about the money — it\'s about <strong>proving the knowledge</strong>. Between the three of you, there is deep expertise across technology, business, and finance. This test phase will:')}

<ul style="font-size:15px; line-height:1.8; color:#333; padding-left:20px;">
  <li>Demonstrate that the Akpareva family can operate a disciplined investment vehicle</li>
  <li>Build a documented track record of investment decisions and outcomes</li>
  <li>Establish governance, processes, and decision-making frameworks at low risk</li>
  <li>Create a foundation that can be scaled up once the model is validated</li>
</ul>

<h3 style="color:#000; margin:28px 0 12px;">The Plan</h3>

${kvList([
  ['Monthly Contribution', '£100 per person (£300/month pooled)'],
  ['Duration', 'Initial test phase — a few months, then review'],
  ['Review Point', 'Assess performance, refine strategy, decide on next steps'],
  ['Decision Making', 'Collaborative — all three members have equal input'],
  ['Support', 'Lee has AI-powered research and analysis tools (NAVADA) to assist with due diligence, market analysis, and portfolio tracking'],
])}

<h3 style="color:#000; margin:28px 0 12px;">What We Need From You</h3>

${p('To get this started, Lee would like to hear from each of you on the following:')}

<ol style="font-size:15px; line-height:1.8; color:#333; padding-left:20px;">
  <li><strong>Your investment interests for 2026</strong> — what sectors, asset classes, or opportunities are you most drawn to? (e.g., tech stocks, crypto, property, startups, index funds)</li>
  <li><strong>Your risk appetite</strong> — conservative, moderate, or aggressive?</li>
  <li><strong>Any specific opportunities</strong> you\'ve been researching or watching</li>
  <li><strong>Your availability</strong> for an initial group call to align on structure and strategy</li>
</ol>

${p('Please reply to this email with your thoughts. There\'s no pressure to have all the answers now — this is the start of a conversation.')}

${callout(`
<strong>Next Steps</strong><br><br>
Once we hear back from both of you, Lee will compile your input and schedule a group discussion to formalise the structure, agree on investment criteria, and set up the operational framework. NAVADA\'s AI capabilities will be available throughout to support research, analysis, and reporting.
`, 'info')}

${p('Looking forward to hearing from you both.')}

${p('Warm regards,')}
`;

async function sendIntroEmails() {
  try {
    // Send to both recipients, CC Lee
    const result = await sendEmail({
      to: recipients.map(r => r.email).join(', '),
      cc: 'leeakpareva@gmail.com',
      subject,
      heading: 'Akpareva Family VC Initiative',
      body,
      type: 'general',
      fromName: 'Claude | NAVADA',
      preheader: 'Lee Akpareva invites you to join a family venture capital test run — £100/month each',
      footerNote: 'Sent on behalf of Lee Akpareva — Founder, NAVADA',
    });

    console.log('Intro emails sent successfully to Tim and Uncle Patrick');
    console.log('CC: leeakpareva@gmail.com');

    // Save monitor config for response tracking
    const monitorData = {
      created: new Date().toISOString(),
      subject,
      recipients: recipients.map(r => ({ ...r, responded: false, respondedAt: null })),
      alertEmail: 'leeakpareva@gmail.com',
      status: 'awaiting_responses',
    };

    fs.writeFileSync(MONITOR_FILE, JSON.stringify(monitorData, null, 2));
    console.log('Response monitor saved to:', MONITOR_FILE);

    return result;
  } catch (err) {
    console.error('Failed to send emails:', err.message);
    throw err;
  }
}

sendIntroEmails();
