/**
 * Test email for Lee from Claude
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmail, p, callout } = require('./email-service');

async function sendTestEmail() {
  const subject = "Test Email from Claude - NAVADA AI Command Centre";
  
  const body = `
    ${callout('✅ Email System Online', 'success')}
    
    ${p('Hey Lee,')}
    
    ${p('This is your test email from Claude, your AI Chief of Staff running on the NAVADA HP server.')}
    
    ${p('Email capabilities confirmed:')}
    ${p('• ✅ SMTP connection working')}
    ${p('• ✅ Authentication verified')}
    ${p('• ✅ Template rendering functional')}
    ${p('• ✅ Delivery pipeline operational')}
    
    ${p('All daily automations use this same email infrastructure for:')}
    ${p('• Daily AI News Digest (7 AM)')}
    ${p('• Job Hunter alerts (9 AM)')}
    ${p('• Economy reports (Monday 8 AM)')}
    ${p('• Prospect outreach campaigns')}
    
    ${p('System status: All green. Ready for whatever you need next.')}
    
    ${callout('Server Details: NAVADA HP | Tailscale: 100.121.187.67', 'info')}
  `;

  try {
    await sendEmail(process.env.LEE_EMAIL, subject, body);
    console.log('✅ Test email sent successfully to Lee');
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
  }
}

sendTestEmail();