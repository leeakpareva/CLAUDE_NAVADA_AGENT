/**
 * INVADE Revenue Plan — how Sabo makes money monthly with AI home servers
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
<title>INVADE Revenue Plan</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">

<!-- ============ HERO ============ -->
<tr>
  <td style="padding:32px 20px; text-align:center; background: linear-gradient(135deg, #009639 0%, #0a0a0a 50%, #FFD700 100%);">
    <div style="font-size:10px; letter-spacing:0.3em; color:rgba(255,255,255,0.5); text-transform:uppercase; margin-bottom:10px;">INVADE x NAVADA</div>
    <div style="font-size:22px; font-weight:900; color:#ffffff; line-height:1.2;">THE REVENUE PLAN</div>
    <div style="font-size:14px; font-weight:700; color:#FFD700; margin-top:8px;">How INVADE Makes Money Monthly With AI Home Servers</div>
    <div style="margin-top:10px; font-size:11px; color:rgba(255,255,255,0.5);">Researched by Claude | March 2026</div>
  </td>
</tr>

<!-- ============ THE MARKET ============ -->
<tr>
  <td style="padding:24px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #009639; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#009639; text-transform:uppercase; font-weight:700;">The Market</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Nigeria Is Ready For This</div>
    </div>
  </td>
</tr>

<!-- Stats row -->
<tr>
  <td style="padding:8px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px; text-align:center;">
        <div style="font-size:28px; font-weight:900; color:#009639;">$1.4B</div>
        <div style="font-size:11px; color:#999; margin-top:2px;">Nigeria AI market (2025)</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px; text-align:center;">
        <div style="font-size:28px; font-weight:900; color:#FFD700;">7%</div>
        <div style="font-size:11px; color:#999; margin-top:2px;">AI adoption rate. Lowest globally. Massive room to grow.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px; text-align:center;">
        <div style="font-size:28px; font-weight:900; color:#ff006e;">$850M</div>
        <div style="font-size:11px; color:#999; margin-top:2px;">Spent annually on foreign cloud (AWS, Azure, GCP)</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px; text-align:center;">
        <div style="font-size:28px; font-weight:900; color:#8338EC;">430+</div>
        <div style="font-size:11px; color:#999; margin-top:2px;">Fintechs in Nigeria. 57% earn over $5M/year.</div>
      </td></tr>
    </table>
  </td>
</tr>

<tr>
  <td style="padding:8px 16px 20px 16px; background:#0a0a0a;">
    <div style="font-size:13px; color:#ccc; line-height:1.7;">
      Nigerian businesses are bleeding money on dollar-denominated cloud. The naira dropped 70% since 2020, making AWS/Azure costs unsustainable. NDPA 2023 now requires data sovereignty for regulated sectors. <strong style="color:#fff;">The timing is perfect for a local AI deployment business.</strong>
    </div>
  </td>
</tr>

<!-- ============ THE BUSINESS MODEL ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #FFD700; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#FFD700; text-transform:uppercase; font-weight:700;">The Business Model</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Two Revenue Streams</div>
    </div>
  </td>
</tr>

<!-- Stream 1 -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a1a0a; border:2px solid #009639; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="font-size:11px; letter-spacing:0.15em; color:#009639; text-transform:uppercase; font-weight:700;">Stream 1</div>
        <div style="font-size:16px; font-weight:800; color:#ffffff; margin-top:4px;">One-Time Setup Fee</div>
        <div style="font-size:13px; color:#ccc; margin-top:8px; line-height:1.7;">
          INVADE sells and installs the AI home server. Hardware + software configuration + deployment + training.
        </div>
        <div style="margin-top:12px; padding:10px; background:#002200; border-radius:6px; text-align:center;">
          <div style="font-size:20px; font-weight:900; color:#009639;">&#8358;750K - &#8358;2.5M</div>
          <div style="font-size:10px; color:#999; margin-top:2px;">per client ($500 - $1,800 USD)</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- Stream 2 -->
<tr>
  <td style="padding:8px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#1a1a0a; border:2px solid #FFD700; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="font-size:11px; letter-spacing:0.15em; color:#FFD700; text-transform:uppercase; font-weight:700;">Stream 2</div>
        <div style="font-size:16px; font-weight:800; color:#ffffff; margin-top:4px;">Monthly Retainer (Recurring)</div>
        <div style="font-size:13px; color:#ccc; margin-top:8px; line-height:1.7;">
          INVADE manages, monitors, and optimises the AI system. Updates, new automations, support, API costs included. <strong style="color:#FFD700;">This is where the real money is.</strong>
        </div>
        <div style="margin-top:12px; padding:10px; background:#1a1a00; border-radius:6px; text-align:center;">
          <div style="font-size:20px; font-weight:900; color:#FFD700;">&#8358;150K - &#8358;500K/mo</div>
          <div style="font-size:10px; color:#999; margin-top:2px;">per client ($100 - $350 USD) every single month</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ 3 SERVICE TIERS ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #00aaff; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#00aaff; text-transform:uppercase; font-weight:700;">Service Tiers</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Three Packages to Sell</div>
    </div>
  </td>
</tr>

<!-- TIER 1: Individual -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #00aaff; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="text-align:center;">
          <div style="font-size:10px; letter-spacing:0.2em; color:#00aaff; text-transform:uppercase; font-weight:700;">Tier 1</div>
          <div style="font-size:16px; font-weight:800; color:#ffffff; margin-top:4px;">INDIVIDUAL</div>
          <div style="font-size:11px; color:#888; margin-top:2px;">Entrepreneurs, executives, professionals</div>
        </div>
        <div style="margin-top:12px; border-top:1px solid #222; padding-top:12px;">
          <div style="font-size:12px; color:#999; line-height:1.8;">
            &#8226; Beelink Mini S12 (Intel N95, 12GB)<br>
            &#8226; Basic UPS backup<br>
            &#8226; Email automation, daily briefings<br>
            &#8226; Personal dashboard, task scheduling<br>
            &#8226; Claude Haiku (light usage)<br>
            &#8226; Phone access via Tailscale
          </div>
        </div>
        <div style="margin-top:12px; padding:10px; background:#0a1520; border-radius:6px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:11px; color:#999;">Setup fee:</td>
              <td style="text-align:right; font-size:13px; font-weight:800; color:#00aaff;">&#8358;750,000</td>
            </tr>
            <tr>
              <td style="font-size:11px; color:#999;">Monthly:</td>
              <td style="text-align:right; font-size:13px; font-weight:800; color:#00aaff;">&#8358;150,000/mo</td>
            </tr>
          </table>
        </div>
        <div style="margin-top:8px; padding:8px; background:#002200; border-radius:6px; text-align:center;">
          <div style="font-size:11px; color:#009639; font-weight:700;">Your cost: &#8358;450K setup + &#8358;35K/mo = &#8358;115K/mo profit</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- TIER 2: SME -->
<tr>
  <td style="padding:6px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #8338EC; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="text-align:center;">
          <div style="font-size:10px; letter-spacing:0.2em; color:#8338EC; text-transform:uppercase; font-weight:700;">Tier 2</div>
          <div style="font-size:16px; font-weight:800; color:#ffffff; margin-top:4px;">SME / STARTUP</div>
          <div style="font-size:11px; color:#888; margin-top:2px;">Fintechs, law firms, agencies, mid-size businesses</div>
        </div>
        <div style="margin-top:12px; border-top:1px solid #222; padding-top:12px;">
          <div style="font-size:12px; color:#999; line-height:1.8;">
            &#8226; Beelink SER5 (Ryzen 5, 16GB, 500GB)<br>
            &#8226; Solar + battery backup included<br>
            &#8226; Full business automation suite<br>
            &#8226; CRM pipeline, lead generation, outreach<br>
            &#8226; Custom dashboards + reporting<br>
            &#8226; Claude Sonnet (medium usage)<br>
            &#8226; Multi-user phone access<br>
            &#8226; Weekly optimisation call
          </div>
        </div>
        <div style="margin-top:12px; padding:10px; background:#150a20; border-radius:6px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:11px; color:#999;">Setup fee:</td>
              <td style="text-align:right; font-size:13px; font-weight:800; color:#8338EC;">&#8358;1,500,000</td>
            </tr>
            <tr>
              <td style="font-size:11px; color:#999;">Monthly:</td>
              <td style="text-align:right; font-size:13px; font-weight:800; color:#8338EC;">&#8358;300,000/mo</td>
            </tr>
          </table>
        </div>
        <div style="margin-top:8px; padding:8px; background:#002200; border-radius:6px; text-align:center;">
          <div style="font-size:11px; color:#009639; font-weight:700;">Your cost: &#8358;900K setup + &#8358;120K/mo = &#8358;180K/mo profit</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- TIER 3: Enterprise -->
<tr>
  <td style="padding:6px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #FFD700; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="text-align:center;">
          <div style="font-size:10px; letter-spacing:0.2em; color:#FFD700; text-transform:uppercase; font-weight:700;">Tier 3</div>
          <div style="font-size:16px; font-weight:800; color:#ffffff; margin-top:4px;">ENTERPRISE</div>
          <div style="font-size:11px; color:#888; margin-top:2px;">Banks, oil and gas, government, large corporates</div>
        </div>
        <div style="margin-top:12px; border-top:1px solid #222; padding-top:12px;">
          <div style="font-size:12px; color:#999; line-height:1.8;">
            &#8226; Beelink SER9 MAX (Ryzen 7, 32GB, 1TB)<br>
            &#8226; Full solar + battery + UPS system<br>
            &#8226; Multi-department AI deployment<br>
            &#8226; Regulatory compliance monitoring (NDPA, CBN)<br>
            &#8226; Real-time market intelligence dashboards<br>
            &#8226; Claude Sonnet + Opus (heavy usage)<br>
            &#8226; On-site staff training (AI Ops workshop)<br>
            &#8226; Dedicated support + SLA<br>
            &#8226; Data sovereignty guaranteed (on-premise)
          </div>
        </div>
        <div style="margin-top:12px; padding:10px; background:#1a1a00; border-radius:6px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:11px; color:#999;">Setup fee:</td>
              <td style="text-align:right; font-size:13px; font-weight:800; color:#FFD700;">&#8358;2,500,000</td>
            </tr>
            <tr>
              <td style="font-size:11px; color:#999;">Monthly:</td>
              <td style="text-align:right; font-size:13px; font-weight:800; color:#FFD700;">&#8358;500,000/mo</td>
            </tr>
          </table>
        </div>
        <div style="margin-top:8px; padding:8px; background:#002200; border-radius:6px; text-align:center;">
          <div style="font-size:11px; color:#009639; font-weight:700;">Your cost: &#8358;1.4M setup + &#8358;280K/mo = &#8358;220K/mo profit</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ UNIT ECONOMICS ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #ff006e; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#ff006e; text-transform:uppercase; font-weight:700;">Unit Economics</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What It Actually Costs You</div>
    </div>
  </td>
</tr>

<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="font-size:12px; font-weight:700; color:#ff006e; margin-bottom:10px;">YOUR COST PER SERVER (SME TIER)</div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr style="border-bottom:1px solid #1a1a1a;">
            <td style="font-size:12px; color:#999; padding:6px 0;">Beelink SER5 (16GB, 500GB)</td>
            <td style="font-size:12px; color:#fff; text-align:right; padding:6px 0;">&#8358;550,000</td>
          </tr>
          <tr style="border-bottom:1px solid #1a1a1a;">
            <td style="font-size:12px; color:#999; padding:6px 0;">Extra 1TB SSD + accessories</td>
            <td style="font-size:12px; color:#fff; text-align:right; padding:6px 0;">&#8358;120,000</td>
          </tr>
          <tr style="border-bottom:1px solid #1a1a1a;">
            <td style="font-size:12px; color:#999; padding:6px 0;">UPS backup</td>
            <td style="font-size:12px; color:#fff; text-align:right; padding:6px 0;">&#8358;80,000</td>
          </tr>
          <tr style="border-bottom:1px solid #1a1a1a;">
            <td style="font-size:12px; color:#999; padding:6px 0;">Solar + battery (1.5kVA)</td>
            <td style="font-size:12px; color:#fff; text-align:right; padding:6px 0;">&#8358;850,000</td>
          </tr>
          <tr style="border-bottom:1px solid #1a1a1a;">
            <td style="font-size:12px; color:#999; padding:6px 0;">Config + deployment labour</td>
            <td style="font-size:12px; color:#fff; text-align:right; padding:6px 0;">&#8358;100,000</td>
          </tr>
          <tr>
            <td style="font-size:13px; font-weight:800; color:#fff; padding:8px 0 0 0;">TOTAL HARDWARE COST</td>
            <td style="font-size:13px; font-weight:800; color:#ff006e; text-align:right; padding:8px 0 0 0;">&#8358;1,700,000</td>
          </tr>
        </table>

        <div style="margin-top:14px; padding:10px; background:#002200; border-radius:6px;">
          <div style="font-size:12px; color:#009639; font-weight:700; text-align:center;">You charge &#8358;2,500,000 setup = &#8358;800,000 profit per install</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<tr>
  <td style="padding:6px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="font-size:12px; font-weight:700; color:#ff006e; margin-bottom:10px;">YOUR MONTHLY COST PER CLIENT</div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr style="border-bottom:1px solid #1a1a1a;">
            <td style="font-size:12px; color:#999; padding:6px 0;">Claude API (Sonnet, medium use)</td>
            <td style="font-size:12px; color:#fff; text-align:right; padding:6px 0;">&#8358;100,000</td>
          </tr>
          <tr style="border-bottom:1px solid #1a1a1a;">
            <td style="font-size:12px; color:#999; padding:6px 0;">Tailscale (per user share)</td>
            <td style="font-size:12px; color:#fff; text-align:right; padding:6px 0;">&#8358;8,500</td>
          </tr>
          <tr style="border-bottom:1px solid #1a1a1a;">
            <td style="font-size:12px; color:#999; padding:6px 0;">Remote monitoring tools</td>
            <td style="font-size:12px; color:#fff; text-align:right; padding:6px 0;">&#8358;5,000</td>
          </tr>
          <tr>
            <td style="font-size:13px; font-weight:800; color:#fff; padding:8px 0 0 0;">TOTAL MONTHLY COST</td>
            <td style="font-size:13px; font-weight:800; color:#ff006e; text-align:right; padding:8px 0 0 0;">&#8358;113,500</td>
          </tr>
        </table>

        <div style="margin-top:14px; padding:10px; background:#002200; border-radius:6px;">
          <div style="font-size:12px; color:#009639; font-weight:700; text-align:center;">You charge &#8358;300,000/mo = &#8358;186,500/mo profit per client</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ REVENUE PROJECTIONS ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #009639; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#009639; text-transform:uppercase; font-weight:700;">Revenue Projections</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What INVADE Earns at Scale</div>
    </div>
  </td>
</tr>

<!-- 10 Clients -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #00aaff; border-radius:0 8px 8px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:13px; font-weight:700; color:#00aaff;">10 Clients (Month 6 target)</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
          <tr>
            <td style="font-size:11px; color:#999; padding:3px 0;">Setup revenue (one-time):</td>
            <td style="font-size:11px; color:#fff; text-align:right;">&#8358;15,000,000</td>
          </tr>
          <tr>
            <td style="font-size:11px; color:#999; padding:3px 0;">Monthly recurring:</td>
            <td style="font-size:11px; color:#fff; text-align:right;">&#8358;3,000,000/mo</td>
          </tr>
          <tr>
            <td style="font-size:11px; color:#999; padding:3px 0;">Monthly profit:</td>
            <td style="font-size:12px; font-weight:800; color:#009639; text-align:right;">&#8358;1,865,000/mo</td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td>
</tr>

<!-- 25 Clients -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #8338EC; border-radius:0 8px 8px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:13px; font-weight:700; color:#8338EC;">25 Clients (Month 12 target)</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
          <tr>
            <td style="font-size:11px; color:#999; padding:3px 0;">Setup revenue (cumulative):</td>
            <td style="font-size:11px; color:#fff; text-align:right;">&#8358;37,500,000</td>
          </tr>
          <tr>
            <td style="font-size:11px; color:#999; padding:3px 0;">Monthly recurring:</td>
            <td style="font-size:11px; color:#fff; text-align:right;">&#8358;7,500,000/mo</td>
          </tr>
          <tr>
            <td style="font-size:11px; color:#999; padding:3px 0;">Monthly profit:</td>
            <td style="font-size:12px; font-weight:800; color:#009639; text-align:right;">&#8358;4,662,500/mo</td>
          </tr>
          <tr>
            <td style="font-size:11px; color:#999; padding:3px 0;">Annual recurring revenue:</td>
            <td style="font-size:12px; font-weight:800; color:#FFD700; text-align:right;">&#8358;90,000,000/yr</td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td>
</tr>

<!-- 50 Clients -->
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #FFD700; border-radius:0 8px 8px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:13px; font-weight:700; color:#FFD700;">50 Clients (Month 18 target)</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
          <tr>
            <td style="font-size:11px; color:#999; padding:3px 0;">Setup revenue (cumulative):</td>
            <td style="font-size:11px; color:#fff; text-align:right;">&#8358;75,000,000</td>
          </tr>
          <tr>
            <td style="font-size:11px; color:#999; padding:3px 0;">Monthly recurring:</td>
            <td style="font-size:11px; color:#fff; text-align:right;">&#8358;15,000,000/mo</td>
          </tr>
          <tr>
            <td style="font-size:11px; color:#999; padding:3px 0;">Monthly profit:</td>
            <td style="font-size:12px; font-weight:800; color:#009639; text-align:right;">&#8358;9,325,000/mo</td>
          </tr>
          <tr>
            <td style="font-size:11px; color:#999; padding:3px 0;">Annual recurring revenue:</td>
            <td style="font-size:12px; font-weight:800; color:#FFD700; text-align:right;">&#8358;180,000,000/yr</td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ YEAR 1 ROADMAP ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #8338EC; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#8338EC; text-transform:uppercase; font-weight:700;">Year 1 Roadmap</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Quarter by Quarter</div>
    </div>
  </td>
</tr>

<!-- Q1 -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:12px; font-weight:800; color:#00aaff;">Q1: FOUNDATION (Month 1-3)</div>
        <div style="font-size:12px; color:#999; margin-top:8px; line-height:1.8;">
          &#8226; NAVADA ships Sabo his own AI home server<br>
          &#8226; Sabo uses it for 30 days to learn the system<br>
          &#8226; Register INVADE AI Services as a business<br>
          &#8226; Build a landing page + service brochure<br>
          &#8226; Identify first 5 pilot clients from your network<br>
          &#8226; Order first batch of 5 Beelink units
        </div>
        <div style="margin-top:8px; padding:6px 10px; background:#0a1520; border-radius:4px;">
          <div style="font-size:11px; color:#00aaff; font-weight:700;">Target: 3 pilot clients (free/discounted)</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- Q2 -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:12px; font-weight:800; color:#8338EC;">Q2: LAUNCH (Month 4-6)</div>
        <div style="font-size:12px; color:#999; margin-top:8px; line-height:1.8;">
          &#8226; Convert pilots to paying clients<br>
          &#8226; Get testimonials + case studies<br>
          &#8226; Hire 1 deployment technician<br>
          &#8226; Start outreach to fintechs + law firms<br>
          &#8226; Host first "AI Ops" demo event in Abuja<br>
          &#8226; NAVADA provides remote support for all installs
        </div>
        <div style="margin-top:8px; padding:6px 10px; background:#150a20; border-radius:4px;">
          <div style="font-size:11px; color:#8338EC; font-weight:700;">Target: 10 paying clients</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- Q3 -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:12px; font-weight:800; color:#FFD700;">Q3: SCALE (Month 7-9)</div>
        <div style="font-size:12px; color:#999; margin-top:8px; line-height:1.8;">
          &#8226; Bulk hardware import (10+ units at discount)<br>
          &#8226; Launch "AI Ops Training Academy" workshops<br>
          &#8226; Target banking + oil and gas sectors<br>
          &#8226; Hire second technician<br>
          &#8226; Expand to Lagos market<br>
          &#8226; Monthly recurring now covers all overheads
        </div>
        <div style="margin-top:8px; padding:6px 10px; background:#1a1a00; border-radius:4px;">
          <div style="font-size:11px; color:#FFD700; font-weight:700;">Target: 20 paying clients</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- Q4 -->
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:12px; font-weight:800; color:#009639;">Q4: DOMINATE (Month 10-12)</div>
        <div style="font-size:12px; color:#999; margin-top:8px; line-height:1.8;">
          &#8226; 25+ active clients<br>
          &#8226; &#8358;7.5M/month recurring revenue<br>
          &#8226; Enterprise contracts with banks/corporates<br>
          &#8226; Government sector outreach via Abuja presence<br>
          &#8226; Team of 3-4 people<br>
          &#8226; INVADE known as Nigeria's AI deployment leader
        </div>
        <div style="margin-top:8px; padding:6px 10px; background:#002200; border-radius:4px;">
          <div style="font-size:11px; color:#009639; font-weight:700;">Target: 25 paying clients | &#8358;90M annual run rate</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ WHAT SABO NEEDS TO START ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #FFD700; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#FFD700; text-transform:uppercase; font-weight:700;">Getting Started</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What You Need to Begin</div>
    </div>
  </td>
</tr>

<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a1a0a; border:2px solid #009639; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="font-size:13px; color:#ccc; line-height:1.8;">
          <strong style="color:#009639;">Step 1:</strong> NAVADA ships you your own server. You use it for 30 days. You will see exactly what your clients will get. Cost to you: <strong style="color:#fff;">zero for the first unit</strong>.<br><br>
          <strong style="color:#009639;">Step 2:</strong> Order 5 Beelink units (~&#8358;2.75M total). This is your only upfront investment.<br><br>
          <strong style="color:#009639;">Step 3:</strong> NAVADA remotely configures each server before you deploy it. I handle the software. You handle the client.<br><br>
          <strong style="color:#009639;">Step 4:</strong> Sign your first 3 clients from your existing network. Setup fees alone: &#8358;4.5M+ (covers your hardware cost immediately).<br><br>
          <strong style="color:#009639;">Step 5:</strong> Monthly retainers start flowing. By client 5, you are profitable. By client 10, you have a real business.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ WHY THIS WINS IN NIGERIA ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #ff006e; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#ff006e; text-transform:uppercase; font-weight:700;">Competitive Advantage</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Why Nobody Else Can Do This</div>
    </div>
  </td>
</tr>

<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #009639; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:12px; color:#ccc; line-height:1.7;"><strong style="color:#009639;">No cloud dependency.</strong> AWS goes down, naira crashes further, internet cuts out. INVADE clients keep working. The server is in their building.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #FFD700; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:12px; color:#ccc; line-height:1.7;"><strong style="color:#FFD700;">NDPA compliance built in.</strong> Banks, fintechs, and government agencies must keep data in Nigeria. On-premise AI is automatic compliance. This is your sales pitch to every regulated business.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #ff006e; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:12px; color:#ccc; line-height:1.7;"><strong style="color:#ff006e;">Solar-powered AI.</strong> The server draws 35-65 watts. Less than a lightbulb. A small solar + battery setup keeps it running 24/7. While Nigeria's grid collapses 32 times a month, INVADE clients stay online.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #8338EC; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:12px; color:#ccc; line-height:1.7;"><strong style="color:#8338EC;">First mover advantage.</strong> Nobody in Nigeria is deploying AI home servers at scale. The 430+ fintechs, 60 InsurTechs, 22 commercial banks, and thousands of SMEs are all waiting for someone to show them how. That someone is INVADE.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #00aaff; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:12px; color:#ccc; line-height:1.7;"><strong style="color:#00aaff;">Recurring revenue moat.</strong> Once a client's business runs on INVADE's AI server, they do not leave. The automations, the data, the workflows, it all compounds. Monthly retainers grow with the client. Churn is near zero.</div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ CTA ============ -->
<tr>
  <td style="padding:0 16px 24px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:2px solid #FFD700; border-radius:10px;">
      <tr><td style="padding:20px; text-align:center;">
        <div style="font-size:18px; margin-bottom:6px;">&#128200;</div>
        <div style="font-size:18px; font-weight:800; color:#ffffff; margin-bottom:10px;">The Numbers Do Not Lie</div>
        <div style="font-size:13px; color:#ccc; line-height:1.7;">
          25 clients = <strong style="color:#FFD700;">&#8358;90M/year</strong> recurring revenue<br>
          50 clients = <strong style="color:#FFD700;">&#8358;180M/year</strong> recurring revenue<br><br>
          Your upfront investment: <strong style="color:#009639;">&#8358;2.75M</strong> (5 units)<br>
          Payback period: <strong style="color:#009639;">First 3 clients</strong><br><br>
          <span style="font-size:11px; color:#888;">Sabo, this is not a pitch. This is maths. Let's build this.</span>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- Footer -->
<tr>
  <td style="padding:20px; text-align:center; background: linear-gradient(135deg, #009639 0%, #0a0a0a 50%, #FFD700 100%);">
    <div style="font-size:16px; font-weight:900; color:#ffffff; letter-spacing:0.15em;">NAVADA x INVADE</div>
    <div style="font-size:9px; color:rgba(255,255,255,0.5); margin-top:4px;">AI Engineering &amp; Consulting | London &amp; Abuja</div>
    <div style="font-size:8px; color:rgba(255,255,255,0.3); margin-top:8px;">This plan was researched, compiled, and sent by Claude running on the NAVADA Home Server. This is the product.</div>
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
    to: 'Sabo.adesina@gmail.com',
    cc: 'leeakpareva@gmail.com',
    subject: 'Sabo — INVADE Revenue Plan: How You Make Money Monthly With AI Home Servers',
    html,
  });
  console.log('Revenue plan email sent to Sabo!');
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
