/**
 * Send VC Projection PDF to Tim & Uncle Patrick
 */
require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmail, p, callout, kvList } = require('./email-service');
const path = require('path');

const PDF_PATH = path.join(__dirname, 'reports', 'akpareva-vc-projection-2026.pdf');

async function send() {
  await sendEmail({
    to: 'tim_akpareva@yahoo.co.uk, patakpareva@gmail.com',
    cc: 'leeakpareva@gmail.com',
    subject: 'Akpareva Family VC — Investment Projection Report (Attached)',
    heading: 'Investment Projection Report — 2026',
    body: `
      ${p('Dear Tim and Uncle Patrick,')}

      ${p('Following on from the earlier introduction email, please find attached the <strong>Akpareva Family VC Investment Projection Report</strong>.')}

      ${p('This document contains a detailed financial analysis prepared using Monte Carlo simulation (500 runs per scenario), covering:')}

      <ul style="font-size:15px; line-height:1.8; color:#333; padding-left:20px;">
        <li><strong>Three investment scenarios</strong> — Conservative, Moderate, and Aggressive</li>
        <li><strong>12-month portfolio growth projections</strong> with monthly breakdowns</li>
        <li><strong>Monte Carlo confidence bands</strong> showing the range of likely outcomes</li>
        <li><strong>Profit & loss analysis</strong> — both pooled and per-member</li>
        <li><strong>Risk vs reward profiles</strong> for each strategy</li>
        <li><strong>Asset allocation recommendations</strong> and operational framework</li>
        <li><strong>Actionable next steps</strong> and timeline</li>
      </ul>

      ${callout(`
        <strong>Key Numbers (£100/month each, £300/month pooled, 12 months)</strong><br><br>
        <strong>Conservative:</strong> Steady 18% annual target — lower risk, consistent growth<br>
        <strong>Moderate:</strong> Balanced 42% annual target — growth stocks, crypto, sector bets<br>
        <strong>Aggressive:</strong> High-conviction 72% annual target — crypto, angel deals, options
      `, 'info')}

      ${p('Please review the report and come back with:')}

      <ol style="font-size:15px; line-height:1.8; color:#333; padding-left:20px;">
        <li>Which scenario resonates most with your risk appetite</li>
        <li>Your investment interests and any opportunities you\'ve been watching</li>
        <li>Your availability for a group call to align on structure</li>
      </ol>

      ${p('Looking forward to your thoughts.')}

      ${p('Warm regards,')}
    `,
    type: 'report',
    fromName: 'Claude | NAVADA',
    preheader: 'Detailed financial projections for the Akpareva Family VC — 3 scenarios, Monte Carlo analysis',
    footerNote: 'Sent on behalf of Lee Akpareva — Founder, NAVADA',
    attachments: [
      {
        filename: 'Akpareva-Family-VC-Projection-2026.pdf',
        path: PDF_PATH,
        contentType: 'application/pdf',
      }
    ],
  });

  console.log('Projection PDF emailed to Tim and Uncle Patrick (CC: Lee)');
}

send().catch(err => { console.error('Error:', err.message); process.exit(1); });
