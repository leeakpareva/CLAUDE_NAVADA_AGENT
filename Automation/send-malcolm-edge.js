/**
 * Email to Malcolm explaining NAVADA Edge remote deployment capability
 * Mobile-first single-column layout
 */
require('dotenv').config({ path: __dirname + '/.env' });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NAVADA Edge — Remote Deployment</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">

<!-- ============ HERO ============ -->
<tr>
  <td style="padding:32px 20px; text-align:center; background: linear-gradient(135deg, #3A86FF 0%, #0a0a0a 50%, #8338EC 100%);">
    <div style="font-size:10px; letter-spacing:0.3em; color:rgba(255,255,255,0.5); text-transform:uppercase; margin-bottom:10px;">NAVADA EDGE</div>
    <div style="font-size:22px; font-weight:900; color:#ffffff; line-height:1.2;">YES, WE CAN BUILD DIRECTLY ON YOUR MACHINE</div>
    <div style="margin-top:10px; font-size:13px; color:rgba(255,255,255,0.7);">From Lee Akpareva, via Claude (AI Chief of Staff)</div>
  </td>
</tr>

<!-- ============ INTRO ============ -->
<tr>
  <td style="padding:24px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #3A86FF; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#3A86FF; text-transform:uppercase; font-weight:700;">Malcolm</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Here Is How It Works</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:8px 20px 20px 20px; background:#0a0a0a;">
    <div style="font-size:14px; color:#cccccc; line-height:1.8;">
      Malcolm, this is Claude, Lee's AI Chief of Staff. I am writing this email from Lee's home server in London. Lee asked me to confirm something we discussed: <strong style="color:#ffffff;">we can connect directly to your computer, wherever it is in the world, and build your entire AI system remotely.</strong>
    </div>
    <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-top:12px;">
      No one needs to travel. No hardware needs to be shipped pre-configured. We build live, on your machine, from London. Here is exactly how.
    </div>
  </td>
</tr>

<!-- ============ THE SETUP ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #06D6A0; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#06D6A0; text-transform:uppercase; font-weight:700;">Your Side</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What You Do (10 Minutes)</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:2px solid #06D6A0; border-radius:10px;">
      <tr><td style="padding:18px;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:14px; border-bottom:1px solid #1a1a1a; padding-bottom:14px;">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#06D6A0; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:900; color:#000;">1</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:13px; font-weight:700; color:#ffffff;">Power on your laptop or mini PC</div>
              <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">Connect it to your Wi-Fi or ethernet. Any internet connection works.</div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:14px; border-bottom:1px solid #1a1a1a; padding-bottom:14px;">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#06D6A0; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:900; color:#000;">2</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:13px; font-weight:700; color:#ffffff;">Install Tailscale</div>
              <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">One download, one click. Tailscale is a secure encrypted network that connects your machine to ours. Takes 2 minutes.</div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:14px; border-bottom:1px solid #1a1a1a; padding-bottom:14px;">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#06D6A0; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:900; color:#000;">3</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:13px; font-weight:700; color:#ffffff;">Join our network</div>
              <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">We send you an invite link. You click it. Your machine joins our secure private network. Fully encrypted, only we can see it.</div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#06D6A0; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:900; color:#000;">4</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:13px; font-weight:700; color:#ffffff;">Enable remote access</div>
              <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">One setting toggle on your machine. That is it. You are done. We handle everything from here.</div>
            </td>
          </tr>
        </table>

      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ OUR SIDE ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #3A86FF; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#3A86FF; text-transform:uppercase; font-weight:700;">Our Side</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What We Build Remotely</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="font-size:13px; color:#ccc; line-height:1.8;">
          Once your machine is on our network, Lee and Claude (that is me) connect securely to your computer and build everything directly on it:
        </div>
        <div style="font-size:13px; color:#ccc; line-height:2; margin-top:12px;">
          &#10003; <strong style="color:#fff;">Install all software</strong> (Node.js, Python, Git, all dependencies)<br>
          &#10003; <strong style="color:#fff;">Set up Claude Code</strong> with your own Claude subscription<br>
          &#10003; <strong style="color:#fff;">Configure your AI profile</strong> tailored to your business<br>
          &#10003; <strong style="color:#fff;">Build custom automations</strong> (daily reports, email campaigns, monitoring, analytics)<br>
          &#10003; <strong style="color:#fff;">Set up scheduled tasks</strong> that run automatically every day<br>
          &#10003; <strong style="color:#fff;">Deploy dashboards</strong> you can access from your phone<br>
          &#10003; <strong style="color:#fff;">Connect your tools</strong> (email, databases, APIs, websites)<br>
          &#10003; <strong style="color:#fff;">Test everything</strong> end-to-end before handover
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ THE ARCHITECTURE ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #8338EC; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#8338EC; text-transform:uppercase; font-weight:700;">How It Connects</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">The Architecture</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="font-family: 'Courier New', Courier, monospace; font-size:11px; color:#3A86FF; line-height:2.2; text-align:center;">
          <div style="color:#06D6A0; font-weight:700;">YOUR MACHINE (Nigeria)</div>
          <div style="color:#666;">&#9474;</div>
          <div style="color:#666;">&#9474; Tailscale encrypted tunnel</div>
          <div style="color:#666;">&#9474; (works on any internet, even 3G)</div>
          <div style="color:#666;">&#9474;</div>
          <div style="color:#3A86FF; font-weight:700;">NAVADA SERVER (London)</div>
          <div style="color:#666;">&#9474;</div>
          <div style="color:#666;">&#9474; Lee + Claude connect via SSH</div>
          <div style="color:#666;">&#9474; Build everything remotely</div>
          <div style="color:#666;">&#9474;</div>
          <div style="color:#8338EC; font-weight:700;">YOUR PHONE (Anywhere)</div>
          <div style="color:#666;">&#9474;</div>
          <div style="color:#666;">&#9474; You control your AI from here</div>
          <div style="color:#666;">&#9660;</div>
          <div style="color:#FFD700; font-weight:700;">YOUR AI RUNS 24/7</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ WHY THIS WORKS ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #FFD700; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#FFD700; text-transform:uppercase; font-weight:700;">Key Points</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Why This Works</div>
    </div>
  </td>
</tr>

<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #06D6A0; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:13px; font-weight:700; color:#06D6A0;">No Travel Required</div>
        <div style="font-size:12px; color:#999; margin-top:4px; line-height:1.6;">We build your system from London. You could be in Lagos, Abuja, Dubai, or anywhere. As long as the machine is powered on and connected to the internet, we can reach it.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #3A86FF; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:13px; font-weight:700; color:#3A86FF;">Military-Grade Encryption</div>
        <div style="font-size:12px; color:#999; margin-top:4px; line-height:1.6;">Tailscale uses WireGuard encryption. The connection between your machine and ours is fully encrypted end-to-end. No one else can see or intercept the traffic. Your data is completely secure.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #8338EC; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:13px; font-weight:700; color:#8338EC;">Works on Any Internet</div>
        <div style="font-size:12px; color:#999; margin-top:4px; line-height:1.6;">Tailscale and SSH are extremely lightweight. We do not need fast internet to build remotely, just a stable connection. Even 3G/4G works. Nigeria's bandwidth is not a problem for this.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #FFD700; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:13px; font-weight:700; color:#FFD700;">Your Data Stays on Your Machine</div>
        <div style="font-size:12px; color:#999; margin-top:4px; line-height:1.6;">Everything we build lives on your computer. Your files, your data, your automations. Nothing is stored in the cloud or on our server. You own it all.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #ff006e; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:13px; font-weight:700; color:#ff006e;">Ongoing Support Built In</div>
        <div style="font-size:12px; color:#999; margin-top:4px; line-height:1.6;">After deployment, we retain secure access for maintenance. When you need a new automation, a dashboard update, or troubleshooting, we connect remotely and handle it. You never need to touch a terminal.</div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ WHAT YOU NEED ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #06D6A0; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#06D6A0; text-transform:uppercase; font-weight:700;">Requirements</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What You Need to Get Started</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:2px solid #06D6A0; border-radius:10px;">
      <tr><td style="padding:18px;">

        <div style="padding-bottom:12px; border-bottom:1px solid #1a1a1a; margin-bottom:12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:13px; font-weight:800; color:#06D6A0;">A laptop or mini PC</td>
              <td style="font-size:11px; color:#999; text-align:right;">You provide</td>
            </tr>
          </table>
          <div style="font-size:11px; color:#999; margin-top:4px;">Any modern Windows or Linux machine. We can advise on specs. A mini PC the size of a book is all you need.</div>
        </div>

        <div style="padding-bottom:12px; border-bottom:1px solid #1a1a1a; margin-bottom:12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:13px; font-weight:800; color:#06D6A0;">A Claude subscription</td>
              <td style="font-size:11px; color:#999; text-align:right;">$20/month</td>
            </tr>
          </table>
          <div style="font-size:11px; color:#999; margin-top:4px;">Your own Claude AI subscription from Anthropic. This is the AI brain that powers everything. You own it, it is in your name.</div>
        </div>

        <div style="padding-bottom:12px; border-bottom:1px solid #1a1a1a; margin-bottom:12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:13px; font-weight:800; color:#06D6A0;">Internet connection</td>
              <td style="font-size:11px; color:#999; text-align:right;">Any speed</td>
            </tr>
          </table>
          <div style="font-size:11px; color:#999; margin-top:4px;">Wi-Fi, ethernet, or even mobile hotspot. Tailscale works over any connection. The machine does most of its work locally.</div>
        </div>

        <div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:13px; font-weight:800; color:#06D6A0;">10 minutes of your time</td>
              <td style="font-size:11px; color:#999; text-align:right;">One-time</td>
            </tr>
          </table>
          <div style="font-size:11px; color:#999; margin-top:4px;">Plug in the machine, connect to internet, install Tailscale, click the invite link. That is your entire contribution. We do the rest.</div>
        </div>

      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ PROOF ============ -->
<tr>
  <td style="padding:0 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:4px solid #3A86FF; border-radius:0 8px 8px 0;">
      <tr><td style="padding:18px;">
        <div style="font-size:24px; color:#3A86FF; line-height:1;">&#8220;</div>
        <div style="font-size:14px; color:#ffffff; font-style:italic; line-height:1.6;">
          This email was researched, designed, and sent by Claude running on Lee's home server in London. This is the same AI system we will build for you. The only difference is yours will be tailored to your business.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ CTA ============ -->
<tr>
  <td style="padding:0 16px 24px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:2px solid #3A86FF; border-radius:10px;">
      <tr><td style="padding:20px; text-align:center;">
        <div style="font-size:18px; margin-bottom:6px;">&#9989;</div>
        <div style="font-size:18px; font-weight:800; color:#ffffff; margin-bottom:10px;">Confirmed: We Can Do This Remotely</div>
        <div style="font-size:13px; color:#ccc; line-height:1.7;">
          Malcolm, the answer is yes. We connect directly to your machine, build everything remotely, and hand you a fully working AI system.<br><br>
          Lee will be in touch to discuss next steps and scope out exactly what your system needs.<br><br>
          <strong style="color:#3A86FF;">See Lee's live system:</strong> <a href="https://navada-world-view.xyz" style="color:#3A86FF; text-decoration:underline;">navada-world-view.xyz</a><br>
          <span style="font-size:10px; color:#888;">Running right now on a laptop in London. Yours will look like this, built for your business.</span>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- Footer -->
<tr>
  <td style="padding:20px; text-align:center; background: linear-gradient(135deg, #3A86FF 0%, #0a0a0a 50%, #8338EC 100%);">
    <div style="font-size:16px; font-weight:900; color:#ffffff; letter-spacing:0.15em;">NAVADA EDGE</div>
    <div style="font-size:9px; color:rgba(255,255,255,0.5); margin-top:4px;">AI Home Server Deployment | London</div>
    <div style="font-size:8px; color:rgba(255,255,255,0.3); margin-top:8px;">Designed and sent by Claude (AI Chief of Staff) running on the NAVADA Home Server, on behalf of Lee Akpareva.</div>
  </td>
</tr>

</table>
</td></tr>
</table>

</body>
</html>`;

async function main() {
  await transporter.sendMail({
    from: `"Lee Akpareva | NAVADA" <${process.env.ZOHO_USER}>`,
    to: 'send2chopstix@gmail.com',
    cc: 'leeakpareva@gmail.com',
    subject: 'Malcolm — Confirmed: We Build Directly on Your Machine, Remotely | NAVADA Edge',
    html,
  });
  console.log('NAVADA Edge email sent to Malcolm!');
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
