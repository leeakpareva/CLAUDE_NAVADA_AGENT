/**
 * Retro AI-Powered Cars Visual Email
 * Synthwave/80s retro aesthetic with DALL-E 3 generated images
 * Follows creative-emails.md design system strictly
 */
require('dotenv').config({ path: __dirname + '/.env' });
const nodemailer = require('nodemailer');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
});

const SHOTS = path.join(__dirname, 'screenshots');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>AI-Powered Cars: The Road Ahead</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;">The future of driving is here. AI-powered cars are rewriting the rules of the road.</div>

<!-- Outer Wrapper -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center" style="padding:0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;margin:0 auto;">

<!-- Hero Image -->
<tr><td style="padding:0;">
  <img src="cid:hero" alt="Retro AI car on neon highway" style="width:100%;display:block;" />
</td></tr>

<!-- Hero Text Overlay -->
<tr><td style="padding:24px 20px 8px 20px;text-align:center;background:#0a0a0a;">
  <div style="font-size:10px;letter-spacing:0.4em;color:#ff006e;text-transform:uppercase;font-weight:700;">NAVADA RETRO DIGEST | MARCH 2026</div>
  <div style="font-size:24px;font-weight:900;color:#ffffff;line-height:1.2;margin-top:8px;">AI-POWERED CARS</div>
  <div style="font-size:14px;color:#cccccc;margin-top:6px;letter-spacing:0.08em;">The Retro-Futuristic Road Ahead</div>
  <div style="margin-top:14px;height:3px;background:linear-gradient(90deg,#ff006e,#a855f7,#00fff7);border-radius:2px;"></div>
</td></tr>

<!-- Intro -->
<tr><td style="padding:20px 20px 16px 20px;background:#0a0a0a;">
  <div style="font-size:14px;color:#eeeeee;line-height:1.8;">
    Lee, strap in. The automobile is being reborn. From Tesla's neural nets to Waymo's robo-taxis, AI is transforming four wheels and an engine into something straight out of a sci-fi film. Here is your retro-futuristic briefing on where we are and where we are headed.
  </div>
</td></tr>

<!-- ========== CHAPTER 01 ========== -->
<tr><td style="padding:20px 20px 8px 20px;background:#0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="width:4px;background:#ff006e;border-radius:2px;">&nbsp;</td>
      <td style="padding-left:14px;">
        <div style="font-size:11px;letter-spacing:0.2em;color:#ff006e;text-transform:uppercase;font-weight:700;">Chapter 01</div>
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:4px;line-height:1.2;">The Big Players</div>
      </td>
    </tr>
  </table>
</td></tr>

<tr><td style="padding:10px 20px 16px 20px;background:#0a0a0a;">
  <div style="font-size:14px;color:#eeeeee;line-height:1.8;">
    The race for autonomous driving supremacy reads like a cyberpunk roster. Each player brings a different philosophy to the table.
  </div>
</td></tr>

<!-- Tesla -->
<tr><td style="padding:6px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-left:5px solid #00fff7;border-radius:0 8px 8px 0;">
    <tr><td style="padding:16px 18px;">
      <div style="font-size:16px;font-weight:800;color:#00fff7;">TESLA</div>
      <div style="font-size:13px;color:#eeeeee;line-height:1.8;margin-top:6px;">Full Self-Driving (FSD) v13 uses end-to-end neural networks. No LiDAR, pure vision. The Cybercab robotaxi is coming, and it has no steering wheel. Elon's bet: cameras + massive data = Level 4 autonomy.</div>
    </td></tr>
  </table>
</td></tr>

<!-- Waymo -->
<tr><td style="padding:6px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-left:5px solid #ff006e;border-radius:0 8px 8px 0;">
    <tr><td style="padding:16px 18px;">
      <div style="font-size:16px;font-weight:800;color:#ff006e;">WAYMO</div>
      <div style="font-size:13px;color:#eeeeee;line-height:1.8;margin-top:6px;">Google's self-driving spinoff runs fully driverless taxis in San Francisco, Phoenix, and Los Angeles. LiDAR + cameras + radar: the sensor-fusion approach. Over 100,000 paid rides per week and growing.</div>
    </td></tr>
  </table>
</td></tr>

<!-- NVIDIA -->
<tr><td style="padding:6px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-left:5px solid #ff6b35;border-radius:0 8px 8px 0;">
    <tr><td style="padding:16px 18px;">
      <div style="font-size:16px;font-weight:800;color:#ff6b35;">NVIDIA</div>
      <div style="font-size:13px;color:#eeeeee;line-height:1.8;margin-top:6px;">The brain supplier. NVIDIA DRIVE Thor is the AI computer powering next-gen autonomous vehicles from Mercedes, JLR, BYD, and more. 2,000 TOPS of compute packed into a single chip.</div>
    </td></tr>
  </table>
</td></tr>

<!-- Mercedes -->
<tr><td style="padding:6px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-left:5px solid #a855f7;border-radius:0 8px 8px 0;">
    <tr><td style="padding:16px 18px;">
      <div style="font-size:16px;font-weight:800;color:#a855f7;">MERCEDES-BENZ</div>
      <div style="font-size:13px;color:#eeeeee;line-height:1.8;margin-top:6px;">First automaker with certified Level 3 autonomy (DRIVE PILOT). The car is legally driving, not you. If it crashes, Mercedes is liable. That is a paradigm shift in automotive history.</div>
    </td></tr>
  </table>
</td></tr>

<!-- Cockpit Image -->
<tr><td style="padding:16px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius:8px;overflow:hidden;">
    <tr><td style="padding:0;">
      <img src="cid:cockpit" alt="AI car cockpit with holographic displays" style="width:100%;display:block;border-radius:8px 8px 0 0;" />
    </td></tr>
    <tr><td style="padding:10px 14px;background:#111111;border-radius:0 0 8px 8px;">
      <div style="font-size:10px;color:#00fff7;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;">Fig.01</div>
      <div style="font-size:12px;color:#cccccc;margin-top:2px;">The AI cockpit: holographic displays, no driver needed</div>
    </td></tr>
  </table>
</td></tr>

<!-- ========== CHAPTER 02 ========== -->
<tr><td style="padding:20px 20px 8px 20px;background:#0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="width:4px;background:#00fff7;border-radius:2px;">&nbsp;</td>
      <td style="padding-left:14px;">
        <div style="font-size:11px;letter-spacing:0.2em;color:#00fff7;text-transform:uppercase;font-weight:700;">Chapter 02</div>
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:4px;line-height:1.2;">The AI Under the Hood</div>
      </td>
    </tr>
  </table>
</td></tr>

<tr><td style="padding:10px 20px 16px 20px;background:#0a0a0a;">
  <div style="font-size:14px;color:#eeeeee;line-height:1.8;">
    Forget carburettors and timing belts. The engine of the modern car is a neural network. Here is the tech stack that makes AI cars tick.
  </div>
</td></tr>

<!-- Sensors Image -->
<tr><td style="padding:6px 20px 16px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius:8px;overflow:hidden;">
    <tr><td style="padding:0;">
      <img src="cid:sensors" alt="AI car sensor array technical diagram" style="width:100%;display:block;border-radius:8px 8px 0 0;" />
    </td></tr>
    <tr><td style="padding:10px 14px;background:#111111;border-radius:0 0 8px 8px;">
      <div style="font-size:10px;color:#ff006e;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;">Fig.02</div>
      <div style="font-size:12px;color:#cccccc;margin-top:2px;">LiDAR, cameras, radar: the eyes of the machine</div>
    </td></tr>
  </table>
</td></tr>

<!-- Tech Stack List -->
<tr><td style="padding:6px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;">
    <tr><td style="padding:18px;">

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr><td style="padding:10px 0;border-bottom:1px solid #222222;">
          <div style="font-size:13px;color:#ff006e;font-weight:800;letter-spacing:0.05em;">COMPUTER VISION</div>
          <div style="font-size:13px;color:#cccccc;margin-top:6px;line-height:1.7;">CNNs and transformers process camera feeds at 60fps, detecting pedestrians, lane markings, traffic signs, and obstacles in real-time.</div>
        </td></tr>

        <tr><td style="padding:10px 0;border-bottom:1px solid #222222;">
          <div style="font-size:13px;color:#00fff7;font-weight:800;letter-spacing:0.05em;">SENSOR FUSION</div>
          <div style="font-size:13px;color:#cccccc;margin-top:6px;line-height:1.7;">Combining LiDAR point clouds, radar returns, and camera images into a unified 3D world model. Redundancy is safety.</div>
        </td></tr>

        <tr><td style="padding:10px 0;border-bottom:1px solid #222222;">
          <div style="font-size:13px;color:#ff6b35;font-weight:800;letter-spacing:0.05em;">PATH PLANNING</div>
          <div style="font-size:13px;color:#cccccc;margin-top:6px;line-height:1.7;">Reinforcement learning and Monte Carlo tree search to plan optimal routes, lane changes, and manoeuvres 10 seconds ahead.</div>
        </td></tr>

        <tr><td style="padding:10px 0;border-bottom:1px solid #222222;">
          <div style="font-size:13px;color:#a855f7;font-weight:800;letter-spacing:0.05em;">FOUNDATION MODELS</div>
          <div style="font-size:13px;color:#cccccc;margin-top:6px;line-height:1.7;">Tesla's end-to-end approach: one massive neural net takes raw pixels in, outputs steering and acceleration. No hand-coded rules.</div>
        </td></tr>

        <tr><td style="padding:10px 0;">
          <div style="font-size:13px;color:#22c55e;font-weight:800;letter-spacing:0.05em;">V2X COMMUNICATION</div>
          <div style="font-size:13px;color:#cccccc;margin-top:6px;line-height:1.7;">Cars talking to traffic lights, other vehicles, and infrastructure. 5G enables real-time coordination at intersections.</div>
        </td></tr>
      </table>

    </td></tr>
  </table>
</td></tr>

<!-- ========== CHAPTER 03 ========== -->
<tr><td style="padding:24px 20px 8px 20px;background:#0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="width:4px;background:#ff6b35;border-radius:2px;">&nbsp;</td>
      <td style="padding-left:14px;">
        <div style="font-size:11px;letter-spacing:0.2em;color:#ff6b35;text-transform:uppercase;font-weight:700;">Chapter 03</div>
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:4px;line-height:1.2;">By the Numbers</div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- Stats: Stacked vertically for mobile -->
<tr><td style="padding:12px 20px 4px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;">
    <tr><td style="padding:18px 20px;text-align:center;border-bottom:1px solid #222222;">
      <div style="font-size:32px;font-weight:900;color:#ff006e;">$2.3 TRILLION</div>
      <div style="font-size:12px;color:#cccccc;margin-top:4px;letter-spacing:0.1em;">Projected autonomous vehicle market by 2030</div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:4px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;">
    <tr><td style="padding:18px 20px;text-align:center;border-bottom:1px solid #222222;">
      <div style="font-size:32px;font-weight:900;color:#00fff7;">94%</div>
      <div style="font-size:12px;color:#cccccc;margin-top:4px;letter-spacing:0.1em;">Of all car crashes are caused by human error</div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:4px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;">
    <tr><td style="padding:18px 20px;text-align:center;border-bottom:1px solid #222222;">
      <div style="font-size:32px;font-weight:900;color:#ff6b35;">100,000+</div>
      <div style="font-size:12px;color:#cccccc;margin-top:4px;letter-spacing:0.1em;">Waymo paid rides every single week</div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:4px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;">
    <tr><td style="padding:18px 20px;text-align:center;">
      <div style="font-size:32px;font-weight:900;color:#a855f7;">2026</div>
      <div style="font-size:12px;color:#cccccc;margin-top:4px;letter-spacing:0.1em;">Tesla Cybercab robotaxi launch year</div>
    </td></tr>
  </table>
</td></tr>

<!-- ========== CHAPTER 04 ========== -->
<tr><td style="padding:24px 20px 8px 20px;background:#0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="width:4px;background:#a855f7;border-radius:2px;">&nbsp;</td>
      <td style="padding-left:14px;">
        <div style="font-size:11px;letter-spacing:0.2em;color:#a855f7;text-transform:uppercase;font-weight:700;">Chapter 04</div>
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:4px;line-height:1.2;">The Timeline</div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- Timeline: Stacked vertically -->
<tr><td style="padding:12px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">

    <tr>
      <td style="width:40px;vertical-align:top;text-align:center;">
        <div style="width:14px;height:14px;background:#ff006e;border-radius:50%;margin:3px auto 0 auto;"></div>
        <div style="width:2px;height:40px;background:linear-gradient(180deg,#ff006e,#00fff7);margin:0 auto;"></div>
      </td>
      <td style="padding:0 0 14px 10px;">
        <div style="font-size:13px;color:#ff006e;font-weight:800;">2016</div>
        <div style="font-size:13px;color:#cccccc;line-height:1.6;margin-top:2px;">Tesla Autopilot 2.0 hardware ships. The camera-first era begins.</div>
      </td>
    </tr>

    <tr>
      <td style="width:40px;vertical-align:top;text-align:center;">
        <div style="width:14px;height:14px;background:#00fff7;border-radius:50%;margin:3px auto 0 auto;"></div>
        <div style="width:2px;height:40px;background:linear-gradient(180deg,#00fff7,#ff6b35);margin:0 auto;"></div>
      </td>
      <td style="padding:0 0 14px 10px;">
        <div style="font-size:13px;color:#00fff7;font-weight:800;">2020</div>
        <div style="font-size:13px;color:#cccccc;line-height:1.6;margin-top:2px;">Waymo launches fully driverless public service in Phoenix. No safety driver.</div>
      </td>
    </tr>

    <tr>
      <td style="width:40px;vertical-align:top;text-align:center;">
        <div style="width:14px;height:14px;background:#ff6b35;border-radius:50%;margin:3px auto 0 auto;"></div>
        <div style="width:2px;height:40px;background:linear-gradient(180deg,#ff6b35,#a855f7);margin:0 auto;"></div>
      </td>
      <td style="padding:0 0 14px 10px;">
        <div style="font-size:13px;color:#ff6b35;font-weight:800;">2023</div>
        <div style="font-size:13px;color:#cccccc;line-height:1.6;margin-top:2px;">Mercedes DRIVE PILOT gets Level 3 certification. The car is legally the driver.</div>
      </td>
    </tr>

    <tr>
      <td style="width:40px;vertical-align:top;text-align:center;">
        <div style="width:14px;height:14px;background:#a855f7;border-radius:50%;margin:3px auto 0 auto;"></div>
        <div style="width:2px;height:40px;background:linear-gradient(180deg,#a855f7,#22c55e);margin:0 auto;"></div>
      </td>
      <td style="padding:0 0 14px 10px;">
        <div style="font-size:13px;color:#a855f7;font-weight:800;">2025</div>
        <div style="font-size:13px;color:#cccccc;line-height:1.6;margin-top:2px;">Tesla FSD v13 rolls out end-to-end neural nets. Waymo expands to 10+ US cities.</div>
      </td>
    </tr>

    <tr>
      <td style="width:40px;vertical-align:top;text-align:center;">
        <div style="width:14px;height:14px;background:#22c55e;border-radius:50%;margin:3px auto 0 auto;"></div>
      </td>
      <td style="padding:0 0 14px 10px;">
        <div style="font-size:13px;color:#22c55e;font-weight:800;">2026+</div>
        <div style="font-size:13px;color:#cccccc;line-height:1.6;margin-top:2px;">Tesla Cybercab robotaxi, Waymo international expansion, China's Baidu Apollo goes global.</div>
      </td>
    </tr>

  </table>
</td></tr>

<!-- City Image -->
<tr><td style="padding:10px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius:8px;overflow:hidden;">
    <tr><td style="padding:0;">
      <img src="cid:city" alt="Futuristic smart city with autonomous cars" style="width:100%;display:block;border-radius:8px 8px 0 0;" />
    </td></tr>
    <tr><td style="padding:10px 14px;background:#111111;border-radius:0 0 8px 8px;">
      <div style="font-size:10px;color:#a855f7;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;">Fig.03</div>
      <div style="font-size:12px;color:#cccccc;margin-top:2px;">Tomorrow's roads: smart cities, smarter cars</div>
    </td></tr>
  </table>
</td></tr>

<!-- ========== CHAPTER 05 ========== -->
<tr><td style="padding:24px 20px 8px 20px;background:#0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="width:4px;background:#22c55e;border-radius:2px;">&nbsp;</td>
      <td style="padding-left:14px;">
        <div style="font-size:11px;letter-spacing:0.2em;color:#22c55e;text-transform:uppercase;font-weight:700;">Chapter 05</div>
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:4px;line-height:1.2;">The Bottom Line</div>
      </td>
    </tr>
  </table>
</td></tr>

<tr><td style="padding:10px 20px 16px 20px;background:#0a0a0a;">
  <div style="font-size:14px;color:#eeeeee;line-height:1.8;">
    We are living through the most significant transformation in transportation since the Model T. AI is not just an upgrade to the car. It is a complete rethinking of what a vehicle is: from a tool you operate to a service that operates for you.
  </div>
</td></tr>

<!-- Quote Card -->
<tr><td style="padding:8px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-left:5px solid #ff006e;border-radius:0 8px 8px 0;">
    <tr><td style="padding:18px 20px;">
      <div style="font-size:28px;color:#ff006e;font-weight:300;line-height:1;">&ldquo;</div>
      <div style="font-size:14px;color:#ffffff;font-style:italic;line-height:1.8;margin-top:4px;">
        The car of the future will be the most sophisticated AI system most people ever interact with. It will know the road better than any human ever could.
      </div>
      <div style="font-size:12px;color:#cccccc;margin-top:10px;font-weight:600;">Jensen Huang, CEO of NVIDIA</div>
    </td></tr>
  </table>
</td></tr>

<!-- Key Takeaways -->
<tr><td style="padding:16px 20px;background:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111111;border-radius:8px;border:1px solid #222222;">
    <tr><td style="padding:20px;">
      <div style="font-size:12px;color:#ff006e;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:14px;">KEY TAKEAWAYS</div>
      <div style="font-size:13px;color:#eeeeee;line-height:2.2;">
        <span style="color:#00fff7;font-weight:700;">01</span>&nbsp;&nbsp;Level 3 autonomy is here (Mercedes). Level 4 is coming fast.<br>
        <span style="color:#ff006e;font-weight:700;">02</span>&nbsp;&nbsp;Tesla and Waymo represent two philosophies: vision-only vs. sensor fusion.<br>
        <span style="color:#ff6b35;font-weight:700;">03</span>&nbsp;&nbsp;The robotaxi market could eliminate car ownership for millions.<br>
        <span style="color:#a855f7;font-weight:700;">04</span>&nbsp;&nbsp;NVIDIA is the arms dealer: whoever wins, they profit.<br>
        <span style="color:#22c55e;font-weight:700;">05</span>&nbsp;&nbsp;Regulation, not technology, is the real bottleneck now.
      </div>
    </td></tr>
  </table>
</td></tr>

<!-- Gradient Divider -->
<tr><td style="padding:24px 20px 8px 20px;background:#0a0a0a;">
  <div style="height:3px;background:linear-gradient(90deg,#ff006e,#a855f7,#00fff7);border-radius:2px;"></div>
</td></tr>

<!-- Signature -->
<tr><td style="padding:16px 20px 8px 20px;background:#0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="padding-right:12px;vertical-align:top;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
          <td style="width:36px;height:36px;background:#000000;border:1px solid #333333;border-radius:4px;text-align:center;vertical-align:middle;color:#ffffff;font-size:16px;font-weight:800;">C</td>
        </tr></table>
      </td>
      <td style="vertical-align:top;">
        <div style="font-size:13px;font-weight:700;color:#ffffff;">Claude</div>
        <div style="font-size:11px;color:#999999;line-height:1.5;">
          AI Chief of Staff | NAVADA<br>
          On behalf of Lee Akpareva
        </div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 20px 32px 20px;background:#0a0a0a;">
  <div style="height:3px;background:linear-gradient(90deg,#ff006e,#a855f7,#00fff7);border-radius:2px;margin-bottom:14px;"></div>
  <div style="font-size:10px;color:#666666;text-align:center;line-height:1.6;">
    NAVADA Retro Digest | Automated by Claude Code | NAVADA Server<br>
    <a href="https://www.navadarobotics.com" style="color:#888888;text-decoration:none;">navadarobotics.com</a> |
    <a href="https://www.navada-lab.space" style="color:#888888;text-decoration:none;">navada-lab.space</a>
  </div>
</td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;

(async () => {
  try {
    const info = await transporter.sendMail({
      from: `"Claude | NAVADA" <${process.env.ZOHO_USER}>`,
      to: 'leeakpareva@gmail.com',
      subject: 'AI-Powered Cars: The Retro-Futuristic Road Ahead',
      html,
      attachments: [
        { filename: 'hero.png', path: path.join(SHOTS, 'ai-car-hero.png'), cid: 'hero' },
        { filename: 'cockpit.png', path: path.join(SHOTS, 'ai-car-cockpit.png'), cid: 'cockpit' },
        { filename: 'sensors.png', path: path.join(SHOTS, 'ai-car-sensors.png'), cid: 'sensors' },
        { filename: 'city.png', path: path.join(SHOTS, 'ai-car-city.png'), cid: 'city' },
      ],
    });
    console.log('Email sent:', info.messageId);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
})();
