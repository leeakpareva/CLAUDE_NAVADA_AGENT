#!/usr/bin/env node
/**
 * Dr Maureen Emeagi — NAVADA Edge Marketing Agent Proposal
 * Tailored autonomous marketing agent for digital health products
 * 3 tier options: Hosted, Self-Hosted, Edge Franchise
 *
 * STEP 1: Send to Lee for approval
 * STEP 2: Lee forwards to Maureen (memeagi@gmail.com)
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const SEND_TO_LEE = true; // Set to false when Lee approves and wants to send to Maureen
const LEE_EMAIL = 'leeakpareva@gmail.com';
const MAUREEN_EMAIL = 'memeagi@gmail.com';
const PROPOSAL_PATH = path.join(__dirname, '..', 'Manager', 'Clients', 'Dr Maureen', 'proposal-email.html');

const transport = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: { user: process.env.ZOHO_USER, pass: process.env.ZOHO_PASS },
});

const recipient = SEND_TO_LEE ? LEE_EMAIL : MAUREEN_EMAIL;

// Read the latest proposal HTML from the client folder
const html = fs.readFileSync(PROPOSAL_PATH, 'utf8');

async function send() {
  const target = SEND_TO_LEE ? 'Lee (for approval)' : 'Dr Maureen Emeagi';
  console.log(`Sending proposal to ${target} at ${recipient}...`);

  const subject = SEND_TO_LEE
    ? '[FOR APPROVAL] Dr Maureen Proposal — NAVADA Edge Marketing Agent (3 Options)'
    : 'Your Autonomous Marketing Agent — NAVADA Edge';

  await transport.sendMail({
    from: `"Lee Akpareva | NAVADA" <${process.env.ZOHO_USER}>`,
    to: recipient,
    subject,
    html,
  });

  console.log(`Sent to ${target} at ${recipient}`);
}

send().catch(err => { console.error('Failed:', err.message); process.exit(1); });
