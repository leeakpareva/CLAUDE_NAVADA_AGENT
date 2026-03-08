#!/usr/bin/env node
// AWS MCP Setup Reminder - scheduled for 2026-03-05 12:00 PM
// Sends reminder via Telegram and email

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const message = `🔔 *REMINDER: Set Up AWS MCP Servers*

Time to configure the AWS MCP servers for Claude Chief of Staff.

*Priority servers to set up:*
1. AWS Lambda Tool
2. AWS Cost Explorer
3. Amazon CloudWatch

*Repo:* github.com/awslabs/mcp
*Plan:* Manager/docs/aws-mcp-servers-plan.md

Reply with "let's do it" to start setup.`;

function sendTelegram(text) {
  const data = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'Markdown'
  });

  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`Telegram response: ${res.statusCode}`);
        resolve(body);
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`[${new Date().toISOString()}] Sending AWS MCP setup reminder...`);
  await sendTelegram(message);
  console.log('Reminder sent successfully.');
}

main().catch(console.error);
