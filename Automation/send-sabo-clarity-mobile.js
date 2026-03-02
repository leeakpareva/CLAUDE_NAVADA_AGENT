/**
 * Mobile-optimised clarity email for Sabo
 * Single-column layout, no side-by-side tables, tight padding
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
<title>NAVADA x INVADE</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<!-- Wrapper -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">

<!-- Hero -->
<tr>
  <td style="padding:32px 20px; text-align:center; background: linear-gradient(135deg, #009639 0%, #0a0a0a 40%, #8338EC 100%);">
    <div style="font-size:10px; letter-spacing:0.3em; color:rgba(255,255,255,0.5); text-transform:uppercase; margin-bottom:10px;">NAVADA x INVADE</div>
    <div style="font-size:24px; font-weight:900; color:#ffffff; line-height:1.2;">WHY THE HOME SERVER IS THE OPTIMAL MODEL</div>
    <div style="margin-top:10px; font-size:13px; color:rgba(255,255,255,0.7);">For individuals. For businesses. For Nigeria.</div>
  </td>
</tr>

<!-- Core Concept -->
<tr>
  <td style="padding:24px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #009639; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#009639; text-transform:uppercase; font-weight:700;">The Core Idea</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Sabo, Let Me Break This Down</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:8px 20px 20px 20px; background:#0a0a0a;">
    <div style="font-size:14px; color:#cccccc; line-height:1.8;">
      Right now, most people use AI like this: open ChatGPT, type a question, get an answer, copy-paste it. That is using a supercomputer as a calculator.
    </div>
    <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-top:12px;">
      <strong style="color:#ffffff;">The NAVADA model is different.</strong> Claude gets a <strong style="color:#009639;">permanent home</strong>: a laptop that is always on, with <strong style="color:#009639;">full access</strong> to the owner's files, email, databases, and tools. The owner controls it from their phone. Claude does not just answer questions. Claude <strong style="color:#FFD700;">runs things</strong>.
    </div>
  </td>
</tr>

<!-- ===== COMPARISON ===== -->

<!-- Old way -->
<tr>
  <td style="padding:8px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#1a0a0a; border:1px solid #441111; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="text-align:center; margin-bottom:12px;">
          <span style="font-size:28px;">&#128546;</span>
          <div style="font-size:12px; font-weight:800; color:#ff4444; letter-spacing:0.1em; margin-top:4px;">HOW MOST PEOPLE USE AI</div>
        </div>
        <div style="font-size:13px; color:#999; line-height:2;">
          &#10007; Open browser, type question<br>
          &#10007; Get answer, copy-paste somewhere<br>
          &#10007; AI forgets everything next session<br>
          &#10007; Cannot access your files or systems<br>
          &#10007; Cannot send emails for you<br>
          &#10007; Cannot run scheduled tasks<br>
          &#10007; Cannot deploy websites<br>
          &#10007; Cannot work while you sleep<br>
          &#10007; You do the work, AI just advises
        </div>
        <div style="text-align:center; margin-top:14px; padding:8px; background:#220000; border-radius:6px;">
          <div style="font-size:12px; font-weight:700; color:#ff4444;">AI as a search engine</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- VS divider -->
<tr>
  <td style="padding:8px 0; text-align:center; background:#0a0a0a;">
    <div style="font-size:16px; font-weight:900; color:#666;">VS</div>
  </td>
</tr>

<!-- NAVADA way -->
<tr>
  <td style="padding:0 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a1a0a; border:2px solid #009639; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="text-align:center; margin-bottom:12px;">
          <span style="font-size:28px;">&#128640;</span>
          <div style="font-size:12px; font-weight:800; color:#009639; letter-spacing:0.1em; margin-top:4px;">THE NAVADA MODEL</div>
        </div>
        <div style="font-size:13px; color:#ccc; line-height:2;">
          &#10003; AI lives on a machine you own<br>
          &#10003; Full access to your files and tools<br>
          &#10003; Remembers everything across sessions<br>
          &#10003; Sends emails on your behalf<br>
          &#10003; Runs tasks every morning automatically<br>
          &#10003; Deploys and manages your websites<br>
          &#10003; Queries your databases directly<br>
          &#10003; Monitors markets and news 24/7<br>
          &#10003; Works while you sleep<br>
          &#10003; <strong style="color:#fff;">AI does the work. You approve.</strong>
        </div>
        <div style="text-align:center; margin-top:14px; padding:8px; background:#002200; border-radius:6px;">
          <div style="font-size:12px; font-weight:700; color:#009639;">AI as an employee</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ===== HOW IT WORKS ===== -->
<tr>
  <td style="padding:20px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #FFD700; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#FFD700; text-transform:uppercase; font-weight:700;">How It Works</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">The Day-to-Day Reality</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:8px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:20px;">

        <!-- Step 1 -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:14px; border-bottom:1px solid #1a1a1a; padding-bottom:14px;">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#009639; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:900; color:#fff;">1</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:13px; font-weight:700; color:#ffffff;">Pick up your phone</div>
              <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">Open Claude Code on iPhone or Android. Connected to the home server via Tailscale (encrypted, works on 3G/4G/5G).</div>
            </td>
          </tr>
        </table>

        <!-- Step 2 -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:14px; border-bottom:1px solid #1a1a1a; padding-bottom:14px;">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#00cc55; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:900; color:#fff;">2</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:13px; font-weight:700; color:#ffffff;">Tell Claude what to do</div>
              <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">"Send the quarterly report to all clients." "Follow up with anyone who hasn't replied in 5 days." "Deploy the new website."</div>
            </td>
          </tr>
        </table>

        <!-- Step 3 -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:14px; border-bottom:1px solid #1a1a1a; padding-bottom:14px;">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#33dd77; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:900; color:#fff;">3</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:13px; font-weight:700; color:#ffffff;">Claude executes on the server</div>
              <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">Accesses files, queries the database, composes emails, builds reports, deploys sites. All on the customer's own machine. Not in the cloud.</div>
            </td>
          </tr>
        </table>

        <!-- Step 4 -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:14px; border-bottom:1px solid #1a1a1a; padding-bottom:14px;">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#FFD700; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:900; color:#000;">4</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:13px; font-weight:700; color:#ffffff;">You approve or adjust</div>
              <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">Claude shows the draft. You say "send it" or "change this part." Full control, zero effort.</div>
            </td>
          </tr>
        </table>

        <!-- Step 5 -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#8338EC; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:900; color:#fff;">5</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:13px; font-weight:700; color:#ffffff;">Tasks run without you</div>
              <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">Every morning, automated tasks run: news digests, lead pipeline, monitoring, reports. You wake up to results, not work.</div>
            </td>
          </tr>
        </table>

      </td></tr>
    </table>
  </td>
</tr>

<!-- ===== FOR INDIVIDUALS ===== -->
<tr>
  <td style="padding:20px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #00aaff; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#00aaff; text-transform:uppercase; font-weight:700;">Use Case A</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">For Individuals</div>
    </div>
  </td>
</tr>

<!-- Individual 1 -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:8px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#00aaff; margin-bottom:8px;">&#128188; The Lagos Entrepreneur</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          "Claude, check my emails for client replies. Draft responses for anything urgent. Check my Shopify orders and send me a summary."<br><br>
          <strong style="color:#ccc;">Result:</strong> Email handled, orders summarised, report on phone by breakfast. Zero time spent.
        </div>
      </td></tr>
    </table>
  </td>
</tr>
<!-- Individual 2 -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:8px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#00aaff; margin-bottom:8px;">&#127891; The Consultant</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          "Claude, research the top 20 fintechs in Nigeria by funding, put it in a table, and draft a LinkedIn post."<br><br>
          <strong style="color:#ccc;">Result:</strong> Research done, data tabled, LinkedIn draft ready. 30 minutes of work done in 2 minutes.
        </div>
      </td></tr>
    </table>
  </td>
</tr>
<!-- Individual 3 -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:8px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#00aaff; margin-bottom:8px;">&#128200; The Investor</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          Server runs a live dashboard tracking NGX stocks, crypto, global markets, news. Every morning at 7 AM, Claude sends a personalised market briefing. Trading signals included.<br><br>
          <strong style="color:#ccc;">Result:</strong> Better informed than analysts at major banks. From a laptop.
        </div>
      </td></tr>
    </table>
  </td>
</tr>
<!-- Individual 4 -->
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:8px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#00aaff; margin-bottom:8px;">&#127912; The Content Creator</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          "Claude, generate 5 Instagram captions. Create a visual email campaign. Schedule LinkedIn posts for the week."<br><br>
          <strong style="color:#ccc;">Result:</strong> Content pipeline on autopilot. Creator focuses on creating, not managing.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ===== FOR BUSINESSES ===== -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #8338EC; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#8338EC; text-transform:uppercase; font-weight:700;">Use Case B</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">For Businesses</div>
    </div>
  </td>
</tr>

<!-- Business 1 -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:8px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#8338EC; margin-bottom:8px;">&#127974; A Bank in Abuja</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          Server sits in the IT room. Claude monitors regulatory feeds, flags compliance changes, drafts memos, manages customer feedback, generates board reports.<br><br>
          <strong style="color:#ccc;">All data stays on-premise.</strong> No banking data ever leaves the building. CBN compliance maintained.
        </div>
      </td></tr>
    </table>
  </td>
</tr>
<!-- Business 2 -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:8px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#8338EC; margin-bottom:8px;">&#128176; A Fintech in Lagos</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          Claude handles support ticket analysis, competitor monitoring, KPI dashboards, investor updates, and product deployments.<br><br>
          <strong style="color:#ccc;">Replaces 3 roles:</strong> data analyst, devops engineer, executive assistant. One server, one AI.
        </div>
      </td></tr>
    </table>
  </td>
</tr>
<!-- Business 3 -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:8px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#8338EC; margin-bottom:8px;">&#9878; A Law Firm</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          Claude reads case docs, summarises briefs, drafts correspondence, manages the client pipeline, sends billing reminders, tracks court dates.<br><br>
          <strong style="color:#ccc;">Partner-level productivity</strong> for every associate. All documents stay on the firm's machine.
        </div>
      </td></tr>
    </table>
  </td>
</tr>
<!-- Business 4 -->
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:8px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#8338EC; margin-bottom:8px;">&#9981; Oil &amp; Gas Company</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          Monitors crude prices, OPEC news, shipping routes, sanctions, supply chain disruptions. Daily briefing to CEO and trading desk.<br><br>
          <strong style="color:#ccc;">Bloomberg Terminal + intelligence analyst</strong> for the price of a laptop.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ===== WHY NOT CLOUD ===== -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #ff006e; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#ff006e; text-transform:uppercase; font-weight:700;">The Obvious Question</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Why Not Just Use the Cloud?</div>
    </div>
  </td>
</tr>

<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #009639; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:13px; font-weight:700; color:#009639;">&#127475;&#127468; Nigeria's Internet Reality</div>
        <div style="font-size:12px; color:#999; margin-top:4px; line-height:1.6;">Cloud needs stable, fast internet. Nigerian bandwidth is expensive and unreliable. A home server runs locally. Only the phone-to-server link needs to be live, and Tailscale handles that on even 3G.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #FFD700; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:13px; font-weight:700; color:#FFD700;">&#128176; Cost Structure</div>
        <div style="font-size:12px; color:#999; margin-top:4px; line-height:1.6;">AWS Lagos: $200-500/month minimum. NAVADA server: $0/month hosting. Power: 15-30 watts (less than a lightbulb). Runs on solar, generator, or mains. The economics are overwhelming.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #ff006e; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:13px; font-weight:700; color:#ff006e;">&#128274; Data Sovereignty</div>
        <div style="font-size:12px; color:#999; margin-top:4px; line-height:1.6;">Nigerian banks face strict data residency under NDPA 2023. With NAVADA, data literally never leaves the building. No cloud provider matches this. The winning pitch for regulated sectors.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #8338EC; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:13px; font-weight:700; color:#8338EC;">&#128272; Ownership</div>
        <div style="font-size:12px; color:#999; margin-top:4px; line-height:1.6;">Customer owns the machine, the data, the automations. If they stop paying, the server keeps running. No vendor lock-in. Not SaaS. Ownership.</div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ===== INVADE'S ROLE ===== -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #FFD700; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#FFD700; text-transform:uppercase; font-weight:700;">INVADE's Role</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">How INVADE Rolls This Out</div>
      <div style="font-size:12px; color:#FFD700; margin-top:4px; font-weight:600;">Your cloud business becomes an AI deployment business</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 8px 16px; background:#0a0a0a;">
    <div style="font-size:13px; color:#cccccc; line-height:1.7;">
      Sabo, INVADE already has the relationships, credibility, and infrastructure knowledge. Here is the structure:
    </div>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:2px solid #FFD700; border-radius:10px;">
      <tr><td style="padding:18px;">

        <div style="padding-bottom:12px; border-bottom:1px solid #1a1a1a; margin-bottom:12px;">
          <div style="font-size:13px; font-weight:800; color:#FFD700;">1. NAVADA provides the platform</div>
          <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">Full stack: server config, AI setup, tool integrations, automation templates, dashboards. We build the product.</div>
        </div>

        <div style="padding-bottom:12px; border-bottom:1px solid #1a1a1a; margin-bottom:12px;">
          <div style="font-size:13px; font-weight:800; color:#FFD700;">2. INVADE deploys in Nigeria</div>
          <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">Hardware sourcing, on-site install, client onboarding, local support, training. You are the trusted local partner.</div>
        </div>

        <div style="padding-bottom:12px; border-bottom:1px solid #1a1a1a; margin-bottom:12px;">
          <div style="font-size:13px; font-weight:800; color:#FFD700;">3. Revenue split on every deployment</div>
          <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">Setup fees + monthly retainers split. INVADE keeps the local margin. More clients = more revenue for both.</div>
        </div>

        <div style="padding-bottom:12px; border-bottom:1px solid #1a1a1a; margin-bottom:12px;">
          <div style="font-size:13px; font-weight:800; color:#FFD700;">4. INVADE upsells customisation</div>
          <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">Custom dashboards, industry automations, bespoke integrations. Each server unique to the business. Big margins here.</div>
        </div>

        <div>
          <div style="font-size:13px; font-weight:800; color:#FFD700;">5. Training academy</div>
          <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">Run "AI Ops" workshops for corporate clients. Another revenue stream. Positions INVADE as the AI enablement leader in Nigeria.</div>
        </div>

      </td></tr>
    </table>
  </td>
</tr>

<!-- Quote -->
<tr>
  <td style="padding:0 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:4px solid #009639; border-radius:0 8px 8px 0;">
      <tr><td style="padding:18px;">
        <div style="font-size:24px; color:#009639; line-height:1;">&#8220;</div>
        <div style="font-size:14px; color:#ffffff; font-style:italic; line-height:1.6;">
          INVADE goes from selling cloud infrastructure to selling AI-powered business transformation. Every client gets their own AI employee that never sleeps and runs their operations 24/7. That is not a cloud service. That is a revolution.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- CTA -->
<tr>
  <td style="padding:0 16px 24px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:2px solid #009639; border-radius:10px;">
      <tr><td style="padding:20px; text-align:center;">
        <div style="font-size:20px; margin-bottom:6px;">&#129309;</div>
        <div style="font-size:18px; font-weight:800; color:#ffffff; margin-bottom:10px;">NAVADA x INVADE</div>
        <div style="font-size:13px; color:#cccccc; line-height:1.7;">
          Sabo, this is the play. I've built the platform. You have the market access.<br><br>
          Let's make INVADE the first company in Nigeria to deploy AI home servers at scale.<br><br>
          <strong style="color:#009639;">See it live:</strong> <a href="https://navada-world-view.xyz" style="color:#009639; text-decoration:underline;">navada-world-view.xyz</a>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- Footer -->
<tr>
  <td style="padding:20px; text-align:center; background: linear-gradient(135deg, #009639 0%, #0a0a0a 50%, #8338EC 100%);">
    <div style="font-size:16px; font-weight:900; color:#ffffff; letter-spacing:0.15em;">NAVADA</div>
    <div style="font-size:9px; color:rgba(255,255,255,0.5); margin-top:4px;">AI Engineering &amp; Consulting | London &amp; Abuja</div>
    <div style="font-size:8px; color:rgba(255,255,255,0.3); margin-top:8px;">Composed, designed, and sent by Claude (AI) running on the NAVADA Home Server. This is exactly what your clients' AI will do for them.</div>
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
    subject: 'Sabo — Mobile Version | NAVADA x INVADE Explained',
    html,
  });
  console.log('Mobile-optimised clarity email sent to Sabo!');
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
