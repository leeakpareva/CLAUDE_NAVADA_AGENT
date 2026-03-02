/**
 * Detailed explainer for Sabo on the NAVADA home server model
 * Why it works for individuals AND businesses, and how INVADE can roll it out
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
<title>NAVADA x INVADE — The Home Server Model Explained</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">

<!-- Hero -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #009639 0%, #0a0a0a 40%, #8338EC 100%);">
  <tr>
    <td style="padding: 50px 40px; text-align:center;">
      <div style="font-size:11px; letter-spacing:0.3em; color:rgba(255,255,255,0.5); text-transform:uppercase; margin-bottom:14px;">NAVADA x INVADE</div>
      <div style="font-size:36px; font-weight:900; color:#ffffff; letter-spacing:-0.02em; line-height:1.15;">WHY THE HOME SERVER<br>IS THE OPTIMAL MODEL</div>
      <div style="margin-top:16px; font-size:14px; color:rgba(255,255,255,0.7);">For individuals. For businesses. For Nigeria.</div>
    </td>
  </tr>
</table>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- THE CORE CONCEPT -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 40px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#009639; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#009639; text-transform:uppercase; font-weight:700;">The Core Idea</div>
            <div style="font-size:26px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Sabo, Let Me Break This Down Simply</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 16px 64px;">
      <div style="font-size:15px; color:#cccccc; line-height:1.9;">
        Right now, most people use AI like this: they open ChatGPT in a browser, type a question, get an answer, copy-paste it somewhere, and repeat. That is like using a supercomputer as a calculator.
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 32px 64px;">
      <div style="font-size:15px; color:#cccccc; line-height:1.9;">
        <strong style="color:#ffffff;">The NAVADA model is fundamentally different.</strong> We give Claude (the AI) a <strong style="color:#009639;">permanent home</strong>: a laptop or mini PC that is always on, always connected, with <strong style="color:#009639;">full access</strong> to the owner's files, email, databases, websites, and business tools. The owner then controls their AI from their phone, anywhere in the world. Claude does not just answer questions. Claude <strong style="color:#FFD700;">runs things</strong>.
      </div>
    </td>
  </tr>
</table>

<!-- THE KEY DIFFERENCE - Visual Comparison -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="12" cellpadding="0">
        <tr>
          <!-- How most people use AI -->
          <td style="width:50%; background:#1a0a0a; border:1px solid #441111; border-radius:12px; padding:24px; vertical-align:top;">
            <div style="text-align:center; margin-bottom:16px;">
              <div style="font-size:32px;">&#128546;</div>
              <div style="font-size:13px; font-weight:800; color:#ff4444; letter-spacing:0.1em; margin-top:6px;">HOW MOST PEOPLE USE AI</div>
            </div>
            <div style="font-size:13px; color:#999; line-height:2;">
              &#10007; Open browser, type question<br>
              &#10007; Get answer, copy-paste somewhere<br>
              &#10007; AI forgets everything next session<br>
              &#10007; Cannot access your files or systems<br>
              &#10007; Cannot send emails for you<br>
              &#10007; Cannot run scheduled tasks<br>
              &#10007; Cannot deploy websites<br>
              &#10007; Cannot manage your database<br>
              &#10007; Cannot work while you sleep<br>
              &#10007; You do the work, AI just advises
            </div>
            <div style="text-align:center; margin-top:16px; padding:10px; background:#220000; border-radius:6px;">
              <div style="font-size:12px; font-weight:700; color:#ff4444;">AI as a search engine</div>
            </div>
          </td>
          <!-- NAVADA model -->
          <td style="width:50%; background:#0a1a0a; border:2px solid #009639; border-radius:12px; padding:24px; vertical-align:top;">
            <div style="text-align:center; margin-bottom:16px;">
              <div style="font-size:32px;">&#128640;</div>
              <div style="font-size:13px; font-weight:800; color:#009639; letter-spacing:0.1em; margin-top:6px;">THE NAVADA MODEL</div>
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
            <div style="text-align:center; margin-top:16px; padding:10px; background:#002200; border-radius:6px;">
              <div style="font-size:12px; font-weight:700; color:#009639;">AI as an employee</div>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- HOW IT ACTUALLY WORKS - Step by step -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#FFD700; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#FFD700; text-transform:uppercase; font-weight:700;">How It Works</div>
            <div style="font-size:26px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">The Day-to-Day Reality</div>
            <div style="font-size:13px; color:#888; margin-top:4px;">What the customer actually experiences</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:1px solid #222; border-radius:12px;">
        <tr>
          <td style="padding:28px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <!-- Step 1 -->
              <tr>
                <td style="padding:12px 0; border-bottom:1px solid #1a1a1a;">
                  <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:48px; vertical-align:top;">
                      <div style="width:36px; height:36px; background:#009639; border-radius:50%; text-align:center; line-height:36px; font-size:14px; font-weight:900; color:#fff;">1</div>
                    </td>
                    <td style="padding-left:12px;">
                      <div style="font-size:14px; font-weight:700; color:#ffffff;">Customer picks up their phone</div>
                      <div style="font-size:12px; color:#999; margin-top:4px;">Opens Claude Code on iPhone or Android. Connected to their home server via Tailscale (secure, encrypted, works over any network, even 4G/5G in Lagos).</div>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <!-- Step 2 -->
              <tr>
                <td style="padding:12px 0; border-bottom:1px solid #1a1a1a;">
                  <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:48px; vertical-align:top;">
                      <div style="width:36px; height:36px; background:#00cc55; border-radius:50%; text-align:center; line-height:36px; font-size:14px; font-weight:900; color:#fff;">2</div>
                    </td>
                    <td style="padding-left:12px;">
                      <div style="font-size:14px; font-weight:700; color:#ffffff;">They tell Claude what to do</div>
                      <div style="font-size:12px; color:#999; margin-top:4px;">Natural language. "Send the quarterly report to all clients." "Check my pipeline and follow up with anyone who hasn't replied in 5 days." "Deploy the new website." "Scrape competitor prices and put them in a spreadsheet."</div>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <!-- Step 3 -->
              <tr>
                <td style="padding:12px 0; border-bottom:1px solid #1a1a1a;">
                  <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:48px; vertical-align:top;">
                      <div style="width:36px; height:36px; background:#33dd77; border-radius:50%; text-align:center; line-height:36px; font-size:14px; font-weight:900; color:#fff;">3</div>
                    </td>
                    <td style="padding-left:12px;">
                      <div style="font-size:14px; font-weight:700; color:#ffffff;">Claude executes on the server</div>
                      <div style="font-size:12px; color:#999; margin-top:4px;">Claude accesses the files, queries the database, composes the emails, builds the report, deploys the site. All happening on the customer's own laptop/server at their home or office. Not in the cloud. On their machine.</div>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <!-- Step 4 -->
              <tr>
                <td style="padding:12px 0; border-bottom:1px solid #1a1a1a;">
                  <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:48px; vertical-align:top;">
                      <div style="width:36px; height:36px; background:#FFD700; border-radius:50%; text-align:center; line-height:36px; font-size:14px; font-weight:900; color:#000;">4</div>
                    </td>
                    <td style="padding-left:12px;">
                      <div style="font-size:14px; font-weight:700; color:#ffffff;">Customer approves or adjusts</div>
                      <div style="font-size:12px; color:#999; margin-top:4px;">Claude shows the draft email, the generated report, the deployment preview. Customer says "send it" or "change this part." Full control, zero effort.</div>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <!-- Step 5 -->
              <tr>
                <td style="padding:12px 0;">
                  <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:48px; vertical-align:top;">
                      <div style="width:36px; height:36px; background:#8338EC; border-radius:50%; text-align:center; line-height:36px; font-size:14px; font-weight:900; color:#fff;">5</div>
                    </td>
                    <td style="padding-left:12px;">
                      <div style="font-size:14px; font-weight:700; color:#ffffff;">Automated tasks run without them</div>
                      <div style="font-size:12px; color:#999; margin-top:4px;">Every morning, scheduled tasks run automatically: news digests, lead pipeline, monitoring, reports. The customer wakes up to results, not work. The server never sleeps.</div>
                    </td>
                  </tr></table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- FOR INDIVIDUALS -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#00aaff; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#00aaff; text-transform:uppercase; font-weight:700;">Use Case A</div>
            <div style="font-size:26px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">For Individuals</div>
            <div style="font-size:13px; color:#00aaff; margin-top:4px; font-weight:600;">Entrepreneurs, executives, professionals, content creators</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="6" cellpadding="0">
        <tr>
          <td style="width:50%; background:#111; border:1px solid #222; border-radius:8px; padding:18px; vertical-align:top;">
            <div style="font-size:13px; font-weight:800; color:#00aaff; margin-bottom:10px;">&#128188; The Lagos Entrepreneur</div>
            <div style="font-size:12px; color:#999; line-height:1.7;">
              "Claude, check my emails for any client replies. Draft responses for anything urgent. Then check my Shopify orders from yesterday and send me a summary."<br><br>
              <strong style="color:#ccc;">Result:</strong> Email handled, orders summarised, report on phone by breakfast. Zero time spent.
            </div>
          </td>
          <td style="width:50%; background:#111; border:1px solid #222; border-radius:8px; padding:18px; vertical-align:top;">
            <div style="font-size:13px; font-weight:800; color:#00aaff; margin-bottom:10px;">&#127891; The Consultant</div>
            <div style="font-size:12px; color:#999; line-height:1.7;">
              "Claude, research the top 20 fintechs in Nigeria by funding raised, put it in a table, and draft a LinkedIn post about the findings."<br><br>
              <strong style="color:#ccc;">Result:</strong> Research done, data tabled, LinkedIn draft ready for approval. 30 minutes of work done in 2 minutes.
            </div>
          </td>
        </tr>
        <tr>
          <td style="width:50%; background:#111; border:1px solid #222; border-radius:8px; padding:18px; vertical-align:top;">
            <div style="font-size:13px; font-weight:800; color:#00aaff; margin-bottom:10px;">&#128200; The Investor</div>
            <div style="font-size:12px; color:#999; line-height:1.7;">
              Server runs a live dashboard tracking NGX stocks, crypto, global markets, and news. Every morning at 7 AM, Claude sends a personalised market briefing to their phone. Trading signals included.<br><br>
              <strong style="color:#ccc;">Result:</strong> Better informed than analysts at major banks. From a laptop.
            </div>
          </td>
          <td style="width:50%; background:#111; border:1px solid #222; border-radius:8px; padding:18px; vertical-align:top;">
            <div style="font-size:13px; font-weight:800; color:#00aaff; margin-bottom:10px;">&#127912; The Content Creator</div>
            <div style="font-size:12px; color:#999; line-height:1.7;">
              "Claude, generate 5 Instagram captions for my new product line. Create a visual email campaign for my mailing list. Schedule the LinkedIn posts for the week."<br><br>
              <strong style="color:#ccc;">Result:</strong> Content pipeline running on autopilot. Creator focuses on creating, not managing.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- FOR BUSINESSES -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#8338EC; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#8338EC; text-transform:uppercase; font-weight:700;">Use Case B</div>
            <div style="font-size:26px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">For Businesses</div>
            <div style="font-size:13px; color:#8338EC; margin-top:4px; font-weight:600;">SMEs, corporates, banks, fintechs, law firms, agencies</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="6" cellpadding="0">
        <tr>
          <td style="width:50%; background:#111; border:1px solid #222; border-radius:8px; padding:18px; vertical-align:top;">
            <div style="font-size:13px; font-weight:800; color:#8338EC; margin-bottom:10px;">&#127974; A Bank in Abuja</div>
            <div style="font-size:12px; color:#999; line-height:1.7;">
              NAVADA server sits in the IT room. Claude monitors regulatory feeds, flags compliance changes, drafts internal memos, manages the customer feedback pipeline, and generates weekly board reports.<br><br>
              <strong style="color:#ccc;">All data stays on-premise.</strong> No sensitive banking data ever leaves the building. CBN compliance maintained.
            </div>
          </td>
          <td style="width:50%; background:#111; border:1px solid #222; border-radius:8px; padding:18px; vertical-align:top;">
            <div style="font-size:13px; font-weight:800; color:#8338EC; margin-bottom:10px;">&#128176; A Fintech in Lagos</div>
            <div style="font-size:12px; color:#999; line-height:1.7;">
              Claude handles customer support ticket analysis, competitor monitoring, daily KPI dashboards, automated investor updates, and deployment of product updates to production.<br><br>
              <strong style="color:#ccc;">Replaces 3 roles:</strong> data analyst, devops engineer, and executive assistant. One server, one AI.
            </div>
          </td>
        </tr>
        <tr>
          <td style="width:50%; background:#111; border:1px solid #222; border-radius:8px; padding:18px; vertical-align:top;">
            <div style="font-size:13px; font-weight:800; color:#8338EC; margin-bottom:10px;">&#9878; A Law Firm</div>
            <div style="font-size:12px; color:#999; line-height:1.7;">
              Claude reads case documents, summarises briefs, drafts correspondence, manages the client pipeline, sends billing reminders, and tracks court dates.<br><br>
              <strong style="color:#ccc;">Partner-level productivity</strong> for every associate. All documents stay on the firm's own machine. Client confidentiality guaranteed.
            </div>
          </td>
          <td style="width:50%; background:#111; border:1px solid #222; border-radius:8px; padding:18px; vertical-align:top;">
            <div style="font-size:13px; font-weight:800; color:#8338EC; margin-bottom:10px;">&#9981; An Oil &amp; Gas Company</div>
            <div style="font-size:12px; color:#999; line-height:1.7;">
              Server monitors global crude prices, OPEC news, shipping routes, sanctions, and supply chain disruptions in real-time. Automated daily briefing to the CEO and trading desk.<br><br>
              <strong style="color:#ccc;">Like having a Bloomberg Terminal</strong> and an intelligence analyst for the price of a laptop.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- WHY NOT JUST USE CLOUD? -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#ff006e; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#ff006e; text-transform:uppercase; font-weight:700;">The Obvious Question</div>
            <div style="font-size:26px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Why Not Just Use the Cloud?</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="6" cellpadding="0">
        <tr>
          <td style="background:#111; border-left:3px solid #009639; border-radius:0 6px 6px 0; padding:16px;">
            <div style="font-size:13px; font-weight:700; color:#009639;">&#127475;&#127468; Nigeria's Internet Reality</div>
            <div style="font-size:12px; color:#999; margin-top:6px; line-height:1.7;">Cloud services need stable, fast internet. Nigerian bandwidth is expensive and unreliable. A home server runs locally. Claude works even on poor connections. Only the phone-to-server link needs to be live, and Tailscale handles that beautifully on even 3G.</div>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-left:3px solid #FFD700; border-radius:0 6px 6px 0; padding:16px;">
            <div style="font-size:13px; font-weight:700; color:#FFD700;">&#128176; Cost Structure</div>
            <div style="font-size:12px; color:#999; margin-top:6px; line-height:1.7;">AWS Lagos region costs $200-500/month minimum for a comparable setup. A NAVADA server costs $0/month in hosting. Power consumption is about 15-30 watts (less than a lightbulb). Runs on solar, generator, or mains. The economics are overwhelming for Nigeria.</div>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-left:3px solid #ff006e; border-radius:0 6px 6px 0; padding:16px;">
            <div style="font-size:13px; font-weight:700; color:#ff006e;">&#128274; Data Sovereignty</div>
            <div style="font-size:12px; color:#999; margin-top:6px; line-height:1.7;">Nigerian banks and government agencies face strict data residency requirements under NDPA (Nigeria Data Protection Act 2023). With NAVADA, data literally never leaves the building. No cloud provider can offer this guarantee. This alone makes it the winning pitch for regulated sectors.</div>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-left:3px solid #8338EC; border-radius:0 6px 6px 0; padding:16px;">
            <div style="font-size:13px; font-weight:700; color:#8338EC;">&#128272; Ownership</div>
            <div style="font-size:12px; color:#999; margin-top:6px; line-height:1.7;">The customer owns the machine. They own the data. They own the automations. If they stop paying the retainer, the server keeps running. No vendor lock-in. No data hostage situations. This is not SaaS. This is ownership.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- INVADE'S ROLE -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#FFD700; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#FFD700; text-transform:uppercase; font-weight:700;">INVADE's Role</div>
            <div style="font-size:26px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">How INVADE Rolls This Out</div>
            <div style="font-size:13px; color:#FFD700; margin-top:4px; font-weight:600;">Your cloud business becomes an AI deployment business</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 16px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.9;">
        Sabo, INVADE already has the relationships, the credibility, and the infrastructure knowledge. Here is how we structure this:
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:2px solid #FFD700; border-radius:12px;">
        <tr>
          <td style="padding:28px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #1a1a1a;">
                  <div style="font-size:14px; font-weight:800; color:#FFD700;">1. NAVADA provides the platform</div>
                  <div style="font-size:12px; color:#999; margin-top:4px;">The full NAVADA stack: server config, AI setup, tool integrations, automation templates, dashboard deployment. We build the product.</div>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #1a1a1a;">
                  <div style="font-size:14px; font-weight:800; color:#FFD700;">2. INVADE deploys in Nigeria</div>
                  <div style="font-size:12px; color:#999; margin-top:4px;">Hardware sourcing, on-site installation, client onboarding, local support, training workshops. INVADE is the face to the customer. You are the trusted local partner.</div>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #1a1a1a;">
                  <div style="font-size:14px; font-weight:800; color:#FFD700;">3. Revenue split on every deployment</div>
                  <div style="font-size:12px; color:#999; margin-top:4px;">Setup fees + monthly retainers split between NAVADA and INVADE. INVADE keeps the local margin. Both sides grow with scale. The more clients INVADE deploys, the more revenue both sides earn.</div>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #1a1a1a;">
                  <div style="font-size:14px; font-weight:800; color:#FFD700;">4. INVADE upsells customisation</div>
                  <div style="font-size:12px; color:#999; margin-top:4px;">Custom dashboards, industry-specific automations, bespoke integrations. Each client's server becomes unique to their business. This is where the big margins are.</div>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;">
                  <div style="font-size:14px; font-weight:800; color:#FFD700;">5. Training academy</div>
                  <div style="font-size:12px; color:#999; margin-top:4px;">INVADE runs "AI Ops" training workshops for corporate clients. Teach their staff how to command Claude effectively. Another revenue stream. Positions INVADE as the AI enablement leader in Nigeria.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- WHAT INVADE BECOMES -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border-left:4px solid #009639; border-radius:0 8px 8px 0;">
        <tr>
          <td style="padding:24px 28px;">
            <div style="font-size:36px; color:#009639; line-height:1; margin-bottom:8px;">&#8220;</div>
            <div style="font-size:16px; color:#ffffff; font-style:italic; line-height:1.6;">
              INVADE goes from selling cloud infrastructure to selling AI-powered business transformation. Every client gets their own AI employee that never sleeps, never calls in sick, and runs their operations 24/7. That is not a cloud service. That is a revolution.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- CTA -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:2px solid #009639; border-radius:12px;">
        <tr>
          <td style="padding:28px; text-align:center;">
            <div style="font-size:22px; margin-bottom:8px;">&#129309;</div>
            <div style="font-size:20px; font-weight:800; color:#ffffff; margin-bottom:12px;">NAVADA x INVADE</div>
            <div style="font-size:14px; color:#cccccc; line-height:1.7;">
              Sabo, this is the play. I've built the platform. You have the market access.<br>
              Let's make INVADE the first company in Nigeria to deploy AI home servers at scale.<br><br>
              <strong style="color:#009639;">See it live:</strong> <a href="https://navada-world-view.xyz" style="color:#009639; text-decoration:underline;">navada-world-view.xyz</a><br><br>
              <span style="font-size:12px; color:#888;">I'm on the phone. Let's finish this conversation.</span>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Footer -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #009639 0%, #0a0a0a 50%, #8338EC 100%);">
  <tr>
    <td style="padding: 28px 40px; text-align:center;">
      <div style="font-size:18px; font-weight:900; color:#ffffff; letter-spacing:0.15em;">NAVADA</div>
      <div style="font-size:10px; color:rgba(255,255,255,0.5); margin-top:6px;">AI Engineering &amp; Consulting | London &amp; Abuja</div>
      <div style="font-size:9px; color:rgba(255,255,255,0.3); margin-top:10px;">This email was composed, designed, and sent by Claude (AI Chief of Staff) running on the NAVADA Home Server, on behalf of Lee Akpareva. This is exactly what your clients' AI will do for them.</div>
    </td>
  </tr>
</table>

</body>
</html>`;

async function main() {
  await transporter.sendMail({
    from: `"Lee Akpareva | NAVADA" <${process.env.ZOHO_USER}>`,
    to: 'Sabo.adesina@gmail.com',
    cc: 'leeakpareva@gmail.com',
    subject: 'Sabo — This Is Why the Home Server Model Wins | NAVADA x INVADE',
    html,
  });
  console.log('Clarity email sent to Sabo!');
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
