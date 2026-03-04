/**
 * NAVADA Multi-Channel Push Notification Service
 * Send alerts to Lee via Telegram, SMS, and WhatsApp simultaneously.
 *
 * Usage as module:
 *   const { notify } = require('./notify');
 *   await notify('Server restarted successfully');
 *
 * Usage as CLI:
 *   node notify.js "Your message here"
 *   node notify.js "Message" --sms-only
 *   node notify.js "Message" --telegram-only
 */

require('dotenv').config({ path: __dirname + '/.env' });
const twilio = require('twilio');
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_ID = process.env.TELEGRAM_OWNER_ID;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER || '+447446994961';
const LEE_MOBILE = process.env.LEE_MOBILE || '+447935237704';
const WA_TO = process.env.WHATSAPP_SANDBOX_TO || 'whatsapp:+447935237704';
const WA_FROM = process.env.WHATSAPP_SANDBOX_FROM || 'whatsapp:+14155238886';

const SMS_SIGNATURE = '\n\n— Claude, Chief of Staff\nNAVADA AI Engineering & Consulting\n+447446994961';

const twilioClient = TWILIO_SID && TWILIO_AUTH ? twilio(TWILIO_SID, TWILIO_AUTH) : null;

function sendTelegram(message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ chat_id: OWNER_ID, text: message, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(res.statusCode === 200 ? 'sent' : `failed: ${body}`));
    });
    req.on('error', e => reject(e));
    req.write(data);
    req.end();
  });
}

/**
 * Send push notification to Lee via all channels
 * @param {string} message - Notification text
 * @param {Object} opts - { telegram: true, sms: true, whatsapp: true }
 */
async function notify(message, opts = {}) {
  const { telegram = true, sms = true, whatsapp = true } = opts;
  const results = { telegram: null, sms: null, whatsapp: null };

  if (telegram && TELEGRAM_BOT_TOKEN && OWNER_ID) {
    try { results.telegram = await sendTelegram(message); }
    catch (e) { results.telegram = `failed: ${e.message}`; }
  }

  if (sms && twilioClient) {
    try {
      await twilioClient.messages.create({
        body: message.replace(/<[^>]+>/g, '') + SMS_SIGNATURE,
        from: TWILIO_FROM,
        to: LEE_MOBILE,
      });
      results.sms = 'sent';
    } catch (e) { results.sms = `failed: ${e.message}`; }
  }

  if (whatsapp && twilioClient) {
    try {
      await twilioClient.messages.create({
        body: message.replace(/<[^>]+>/g, ''),
        from: WA_FROM,
        to: WA_TO,
        statusCallback: 'https://api.navada-edge-server.uk/twilio/status',
      });
      results.whatsapp = 'sent';
    } catch (e) { results.whatsapp = `failed: ${e.message}`; }
  }

  console.log('[notify]', JSON.stringify(results));
  return results;
}

module.exports = { notify };

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const message = args.filter(a => !a.startsWith('--')).join(' ');
  if (!message) {
    console.log('Usage: node notify.js "Your message" [--sms-only] [--telegram-only] [--whatsapp-only]');
    process.exit(0);
  }
  const opts = {
    telegram: !args.includes('--sms-only') && !args.includes('--whatsapp-only'),
    sms: !args.includes('--telegram-only') && !args.includes('--whatsapp-only'),
    whatsapp: !args.includes('--sms-only') && !args.includes('--telegram-only'),
  };
  notify(message, opts).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
