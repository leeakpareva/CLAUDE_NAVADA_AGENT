#!/usr/bin/env node
require('dotenv').config({ path: __dirname + '/.env' });
const fs = require('fs');
const https = require('https');
const nodemailer = require('nodemailer');

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const R2_PUBLIC = 'https://pub-60e73a76c6ae44e0a73e6617ada8f376.r2.dev';
const filePath = 'C:/Users/leeak/navada-outputs/videos/NAVADA-Edge-Marketing.mp4';
const r2Key = 'media/NAVADA-Edge-Marketing.mp4';

async function run() {
  const fileBuffer = fs.readFileSync(filePath);
  const sizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);
  console.log(`Uploading ${sizeMB} MB to R2...`);

  await new Promise((resolve, reject) => {
    const url = new URL(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/navada-assets/objects/${r2Key}`);
    const req = https.request({
      hostname: url.hostname, path: url.pathname, method: 'PUT',
      headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'video/mp4', 'Content-Length': fileBuffer.length }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { const j = JSON.parse(d); j.success ? resolve() : reject(new Error(d)); });
    });
    req.on('error', reject);
    req.write(fileBuffer);
    req.end();
  });

  const publicUrl = `${R2_PUBLIC}/${r2Key}`;
  console.log(`Uploaded: ${publicUrl}`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.eu', port: 465, secure: true,
    auth: { user: process.env.ZOHO_USER, pass: process.env.ZOHO_APP_PASSWORD }
  });

  const html = `
<div style="font-family:system-ui;max-width:650px;margin:0 auto;background:#080C22;color:#e0e0e0;padding:40px;border-radius:16px;border:1px solid #C9A84C33">
<div style="text-align:center">
<h1 style="color:#C9A84C;margin:0;font-size:36px;letter-spacing:6px">NAVADA EDGE</h1>
<p style="color:#E8D5A0;letter-spacing:4px;font-size:14px;margin-top:8px">MARKETING VIDEO</p>
<div style="width:300px;height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:20px auto"></div>
</div>

<p style="color:#aaa;line-height:1.8;margin-top:20px">Your 60-second cinematic marketing video has been rendered and is ready.</p>

<h3 style="color:#C9A84C;margin-top:30px">5 Scenes</h3>
<table style="width:100%;border-collapse:collapse;font-size:14px">
<tr style="border-bottom:1px solid #1A2550"><td style="padding:8px;color:#C9A84C">0-12s</td><td>Logo reveal with particle effects and cinematic zoom</td></tr>
<tr style="border-bottom:1px solid #1A2550"><td style="padding:8px;color:#C9A84C">12-24s</td><td>Feature cards: Security, Hybrid Cloud, AI Chief of Staff, Mobile Control</td></tr>
<tr style="border-bottom:1px solid #1A2550"><td style="padding:8px;color:#C9A84C">24-36s</td><td>Architecture diagram: iPhone to Cloudflare to Nginx to 3 cloud nodes</td></tr>
<tr style="border-bottom:1px solid #1A2550"><td style="padding:8px;color:#C9A84C">36-48s</td><td>Stats: 23 MCP Servers, 12 PM2 Services, 48+ Commands, 28 APIs</td></tr>
<tr style="border-bottom:1px solid #1A2550"><td style="padding:8px;color:#C9A84C">48-60s</td><td>CTA: Your AI. Your Server. Your Rules. + navada-edge-server.uk</td></tr>
</table>

<div style="text-align:center;margin-top:30px">
<a href="${publicUrl}" style="background:#C9A84C;color:#080C22;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;letter-spacing:2px">WATCH VIDEO</a>
</div>

<p style="color:#666;margin-top:30px;font-size:12px;text-align:center">${sizeMB} MB | 1920x1080 | 30fps | H.264 | Hosted on Cloudflare R2</p>
<p style="color:#444;font-size:11px;text-align:center">Rendered with Remotion by Claude, Chief of Staff</p>
</div>`;

  await transporter.sendMail({
    from: process.env.ZOHO_USER,
    to: 'leeakpareva@gmail.com',
    subject: 'NAVADA Edge Marketing Video (60s cinematic)',
    html
  });
  console.log('Email sent to leeakpareva@gmail.com');
}
run();
