/**
 * Dr. Maureen — NAVADA Edge + Digital Product Platform + AI Marketing brief
 * Option B: Phased payments (£2,500 → £2,500 → £2,000)
 * Mobile-first single-column layout
 */
require('dotenv').config({ path: __dirname + '/.env' });
const nodemailer = require('nodemailer');

const TO_EMAIL = process.argv[2];
if (!TO_EMAIL) {
  console.error('Usage: node send-dr-maureen-brief.js <email>');
  process.exit(1);
}

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
<title>NAVADA Edge — Your Digital Product Platform</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">

<!-- ============ HERO ============ -->
<tr>
  <td style="padding:32px 20px; text-align:center; background: linear-gradient(135deg, #8338EC 0%, #0a0a0a 50%, #FF006E 100%);">
    <div style="font-size:10px; letter-spacing:0.3em; color:rgba(255,255,255,0.5); text-transform:uppercase; margin-bottom:10px;">NAVADA EDGE</div>
    <div style="font-size:22px; font-weight:900; color:#ffffff; line-height:1.2;">YOUR AI-POWERED DIGITAL PRODUCT PLATFORM</div>
    <div style="margin-top:10px; font-size:13px; color:rgba(255,255,255,0.7);">Project Brief for Dr. Maureen</div>
    <div style="margin-top:4px; font-size:11px; color:rgba(255,255,255,0.4);">From Lee Akpareva, via Claude (AI Chief of Staff)</div>
  </td>
</tr>

<!-- ============ WHAT WE DISCUSSED ============ -->
<tr>
  <td style="padding:24px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #8338EC; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#8338EC; text-transform:uppercase; font-weight:700;">Dr. Maureen</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Here Is What We Are Building</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:8px 20px 20px 20px; background:#0a0a0a;">
    <div style="font-size:14px; color:#cccccc; line-height:1.8;">
      You identified the gap perfectly: <strong style="color:#ffffff;">building a digital product is not the hard part. Marketing it consistently across multiple platforms every single day is.</strong> That is where everyone drops off.
    </div>
    <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-top:12px;">
      We are building you a system that combines the best of Stan.store (selling digital products) with the best of Blaze.ai (AI marketing automation), running on your own AI home server. No monthly platform fees. No manual marketing. AI agents handle it all.
    </div>
  </td>
</tr>

<!-- ============ THE THREE LAYERS ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #FF006E; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#FF006E; text-transform:uppercase; font-weight:700;">The Build</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Three Layers, One System</div>
    </div>
  </td>
</tr>

<!-- Layer 1 -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:2px solid #8338EC; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="text-align:center;">
          <div style="font-size:10px; letter-spacing:0.2em; color:#8338EC; text-transform:uppercase; font-weight:700;">Layer 1</div>
          <div style="font-size:16px; font-weight:800; color:#ffffff; margin-top:4px;">NAVADA Edge (Your AI Server)</div>
        </div>
        <div style="margin-top:12px; border-top:1px solid #222; padding-top:12px;">
          <div style="font-size:12px; color:#999; line-height:1.8;">
            &#10003; A mini PC at your home, always on, always connected<br>
            &#10003; Claude (AI) installed with full access to your tools<br>
            &#10003; Controlled from your phone, anywhere<br>
            &#10003; Tailscale encrypted connection (secure, works on any network)<br>
            &#10003; Scheduled tasks run daily without you<br>
            &#10003; Morning briefing: sales, traffic, social stats, priorities
          </div>
        </div>
        <div style="margin-top:10px; padding:8px; background:#150a20; border-radius:6px; text-align:center;">
          <div style="font-size:11px; color:#8338EC; font-weight:700;">The foundation. Everything runs on this.</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- Layer 2 -->
<tr>
  <td style="padding:6px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:2px solid #FF006E; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="text-align:center;">
          <div style="font-size:10px; letter-spacing:0.2em; color:#FF006E; text-transform:uppercase; font-weight:700;">Layer 2</div>
          <div style="font-size:16px; font-weight:800; color:#ffffff; margin-top:4px;">Digital Product Storefront</div>
        </div>
        <div style="margin-top:12px; border-top:1px solid #222; padding-top:12px;">
          <div style="font-size:12px; color:#999; line-height:1.8;">
            &#10003; Beautiful, mobile-first product store (your brand, your domain)<br>
            &#10003; Sell ebooks, courses, templates, guides, coaching<br>
            &#10003; Stripe payments (cards, Apple Pay, Google Pay)<br>
            &#10003; Online course builder with modules and lessons<br>
            &#10003; Subscription / membership billing<br>
            &#10003; Email list collection and lead magnets<br>
            &#10003; Customer dashboard (buyers access their products)<br>
            &#10003; Sales analytics and revenue tracking<br>
            &#10003; Link-in-bio page for Instagram, TikTok, YouTube
          </div>
        </div>
        <div style="margin-top:10px; padding:8px; background:#200a15; border-radius:6px; text-align:center;">
          <div style="font-size:11px; color:#FF006E; font-weight:700;">Better than Stan.store. Zero monthly platform fees. You own it.</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- Layer 3 -->
<tr>
  <td style="padding:6px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:2px solid #06D6A0; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="text-align:center;">
          <div style="font-size:10px; letter-spacing:0.2em; color:#06D6A0; text-transform:uppercase; font-weight:700;">Layer 3</div>
          <div style="font-size:16px; font-weight:800; color:#ffffff; margin-top:4px;">AI Marketing Agents</div>
        </div>
        <div style="margin-top:12px; border-top:1px solid #222; padding-top:12px;">
          <div style="font-size:12px; color:#999; line-height:1.8;">
            &#10003; <strong style="color:#ccc;">Pinterest</strong>: auto-generates pins + descriptions, schedules 5-10/day, SEO optimised<br>
            &#10003; <strong style="color:#ccc;">YouTube</strong>: video scripts, titles, descriptions, tags, Shorts scripts, community posts<br>
            &#10003; <strong style="color:#ccc;">Instagram</strong>: captions, carousel ideas, Reels scripts, hashtag strategies, auto-DM<br>
            &#10003; <strong style="color:#ccc;">Facebook</strong>: page posts, group content, event listings for launches<br>
            &#10003; <strong style="color:#ccc;">Twitter/X</strong>: tweet threads, daily scheduling, engagement strategies<br>
            &#10003; <strong style="color:#ccc;">Email</strong>: campaigns, welcome sequences, launch emails, newsletters<br>
            &#10003; <strong style="color:#ccc;">Blog/SEO</strong>: articles that drive organic Google traffic to your store
          </div>
        </div>
        <div style="margin-top:10px; padding:8px; background:#0a1a15; border-radius:6px; text-align:center;">
          <div style="font-size:11px; color:#06D6A0; font-weight:700;">Better than Blaze.ai. Agents work 24/7. You approve from your phone.</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ HOW IT WORKS DAILY ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #FFD700; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#FFD700; text-transform:uppercase; font-weight:700;">Your Daily Experience</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">How It Works Day to Day</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:18px;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:12px; border-bottom:1px solid #1a1a1a; padding-bottom:12px;">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#8338EC; border-radius:50%; text-align:center; line-height:28px; font-size:10px; font-weight:900; color:#fff;">SUN</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:12px; color:#ccc; line-height:1.6;"><strong style="color:#fff;">Sunday night, while you sleep:</strong> Claude generates your full content calendar for the week. Pinterest pins, Instagram captions, tweets, email copy, blog post drafts. All in your brand voice.</div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:12px; border-bottom:1px solid #1a1a1a; padding-bottom:12px;">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#FF006E; border-radius:50%; text-align:center; line-height:28px; font-size:10px; font-weight:900; color:#fff;">MON</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:12px; color:#ccc; line-height:1.6;"><strong style="color:#fff;">Monday morning, on your phone:</strong> You review the week's content. Edit anything you want. Tap approve. Claude schedules and posts across all platforms throughout the week.</div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:12px; border-bottom:1px solid #1a1a1a; padding-bottom:12px;">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#06D6A0; border-radius:50%; text-align:center; line-height:28px; font-size:10px; font-weight:900; color:#fff;">DAY</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:12px; color:#ccc; line-height:1.6;"><strong style="color:#fff;">Every day, automatically:</strong> Pins go out on Pinterest. Posts go up on Instagram. Tweets publish on schedule. Emails send to your list. Blog posts go live. Traffic flows to your store.</div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#FFD700; border-radius:50%; text-align:center; line-height:28px; font-size:10px; font-weight:900; color:#000;">7AM</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:12px; color:#ccc; line-height:1.6;"><strong style="color:#fff;">Every morning, your briefing:</strong> Claude sends you yesterday's numbers. Sales, revenue, which platform drove the most traffic, which product is trending, what to focus on today.</div>
            </td>
          </tr>
        </table>

      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ WHAT YOU REPLACE ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #FF006E; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#FF006E; text-transform:uppercase; font-weight:700;">The Value</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What This Replaces</div>
    </div>
  </td>
</tr>

<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#1a0a0a; border:1px solid #441111; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:12px; font-weight:700; color:#ff4444; margin-bottom:10px;">WHAT YOU WOULD PAY OTHERWISE (PER YEAR)</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr><td style="font-size:12px; color:#999; padding:4px 0;">Stan.store (Creator Pro)</td><td style="font-size:12px; color:#fff; text-align:right;">&#163;948/yr</td></tr>
          <tr><td style="font-size:12px; color:#999; padding:4px 0;">Blaze.ai (Autopilot)</td><td style="font-size:12px; color:#fff; text-align:right;">&#163;948/yr</td></tr>
          <tr><td style="font-size:12px; color:#999; padding:4px 0;">Freelance social media manager</td><td style="font-size:12px; color:#fff; text-align:right;">&#163;18,000/yr</td></tr>
          <tr><td style="font-size:12px; color:#999; padding:4px 0;">Email marketing platform</td><td style="font-size:12px; color:#fff; text-align:right;">&#163;1,200/yr</td></tr>
          <tr><td style="font-size:13px; font-weight:800; color:#ff4444; padding:8px 0 0 0; border-top:1px solid #331111;">Total annual cost</td><td style="font-size:13px; font-weight:800; color:#ff4444; text-align:right; padding:8px 0 0 0; border-top:1px solid #331111;">&#163;21,000+/yr</td></tr>
        </table>
      </td></tr>
    </table>
  </td>
</tr>

<tr>
  <td style="padding:6px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a1a0a; border:2px solid #06D6A0; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:12px; font-weight:700; color:#06D6A0; margin-bottom:10px;">WHAT YOU PAY WITH NAVADA EDGE</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr><td style="font-size:12px; color:#999; padding:4px 0;">Build fee (one-time)</td><td style="font-size:12px; color:#fff; text-align:right;">&#163;7,000</td></tr>
          <tr><td style="font-size:12px; color:#999; padding:4px 0;">Claude subscription</td><td style="font-size:12px; color:#fff; text-align:right;">&#163;16/month</td></tr>
          <tr><td style="font-size:12px; color:#999; padding:4px 0;">Platform fees (Stan, Blaze, etc.)</td><td style="font-size:12px; color:#06D6A0; text-align:right;">&#163;0</td></tr>
          <tr><td style="font-size:13px; font-weight:800; color:#06D6A0; padding:8px 0 0 0; border-top:1px solid #002200;">Year 1 total</td><td style="font-size:13px; font-weight:800; color:#06D6A0; text-align:right; padding:8px 0 0 0; border-top:1px solid #002200;">&#163;7,192</td></tr>
          <tr><td style="font-size:13px; font-weight:800; color:#06D6A0; padding:4px 0;">Year 2 onwards</td><td style="font-size:13px; font-weight:800; color:#06D6A0; text-align:right;">&#163;192/yr</td></tr>
        </table>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ PAYMENT PLAN ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #FFD700; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#FFD700; text-transform:uppercase; font-weight:700;">Investment</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Payment Plan</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:2px solid #FFD700; border-radius:10px;">
      <tr><td style="padding:18px;">

        <div style="padding-bottom:14px; border-bottom:1px solid #1a1a1a; margin-bottom:14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align:top;">
                <div style="width:28px; height:28px; background:#FFD700; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:900; color:#000;">1</div>
              </td>
              <td style="padding-left:12px;">
                <div style="font-size:14px; font-weight:800; color:#FFD700;">Deposit: &#163;2,500</div>
                <div style="font-size:11px; color:#999; margin-top:3px;">Paid to start. We begin building your NAVADA Edge server and storefront immediately.</div>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding-bottom:14px; border-bottom:1px solid #1a1a1a; margin-bottom:14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align:top;">
                <div style="width:28px; height:28px; background:#FFD700; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:900; color:#000;">2</div>
              </td>
              <td style="padding-left:12px;">
                <div style="font-size:14px; font-weight:800; color:#FFD700;">Milestone: &#163;2,500</div>
                <div style="font-size:11px; color:#999; margin-top:3px;">Due when your NAVADA Edge server is live and your digital product storefront is deployed (Week 2-3).</div>
              </td>
            </tr>
          </table>
        </div>

        <div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align:top;">
                <div style="width:28px; height:28px; background:#FFD700; border-radius:50%; text-align:center; line-height:28px; font-size:13px; font-weight:900; color:#000;">3</div>
              </td>
              <td style="padding-left:12px;">
                <div style="font-size:14px; font-weight:800; color:#FFD700;">Completion: &#163;2,000</div>
                <div style="font-size:11px; color:#999; margin-top:3px;">Due when the full AI marketing automation suite is live, tested, and you are trained on the system (Week 4-5).</div>
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-top:16px; padding:10px; background:#1a1a00; border-radius:6px; text-align:center;">
          <div style="font-size:14px; font-weight:800; color:#FFD700;">Total: &#163;7,000</div>
          <div style="font-size:10px; color:#999; margin-top:2px;">Paid across 3 milestones over 5 weeks</div>
        </div>

      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ WHAT YOU NEED ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #06D6A0; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#06D6A0; text-transform:uppercase; font-weight:700;">Your Requirements</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What You Need to Provide</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:18px;">

        <div style="padding-bottom:10px; border-bottom:1px solid #1a1a1a; margin-bottom:10px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:13px; font-weight:700; color:#06D6A0;">A laptop or mini PC</td>
              <td style="font-size:11px; color:#999; text-align:right;">&#163;300-500 one-time</td>
            </tr>
          </table>
          <div style="font-size:11px; color:#999; margin-top:3px;">For your AI server. We advise on specs. Or use an existing machine.</div>
        </div>

        <div style="padding-bottom:10px; border-bottom:1px solid #1a1a1a; margin-bottom:10px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:13px; font-weight:700; color:#06D6A0;">Claude subscription</td>
              <td style="font-size:11px; color:#999; text-align:right;">&#163;16/month</td>
            </tr>
          </table>
          <div style="font-size:11px; color:#999; margin-top:3px;">Your own Claude AI subscription from Anthropic. The AI brain that powers everything.</div>
        </div>

        <div style="padding-bottom:10px; border-bottom:1px solid #1a1a1a; margin-bottom:10px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:13px; font-weight:700; color:#06D6A0;">A domain name</td>
              <td style="font-size:11px; color:#999; text-align:right;">~&#163;10/year</td>
            </tr>
          </table>
          <div style="font-size:11px; color:#999; margin-top:3px;">For your storefront (e.g. yourbrand.com). We handle the setup.</div>
        </div>

        <div style="padding-bottom:10px; border-bottom:1px solid #1a1a1a; margin-bottom:10px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:13px; font-weight:700; color:#06D6A0;">Social media accounts</td>
              <td style="font-size:11px; color:#999; text-align:right;">Free</td>
            </tr>
          </table>
          <div style="font-size:11px; color:#999; margin-top:3px;">Pinterest, YouTube, Instagram, Facebook, Twitter/X. You likely already have these.</div>
        </div>

        <div style="padding-bottom:10px; border-bottom:1px solid #1a1a1a; margin-bottom:10px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:13px; font-weight:700; color:#06D6A0;">Your digital products</td>
              <td style="font-size:11px; color:#999; text-align:right;">You provide</td>
            </tr>
          </table>
          <div style="font-size:11px; color:#999; margin-top:3px;">The products you want to sell: ebooks, courses, templates, guides. You create them, we sell them.</div>
        </div>

        <div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:13px; font-weight:700; color:#06D6A0;">Brand assets</td>
              <td style="font-size:11px; color:#999; text-align:right;">You provide</td>
            </tr>
          </table>
          <div style="font-size:11px; color:#999; margin-top:3px;">Logo, brand colours, fonts, and brand voice guidelines. Or Claude helps you create them.</div>
        </div>

      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ TIMELINE ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #8338EC; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#8338EC; text-transform:uppercase; font-weight:700;">Timeline</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">5 Weeks to Launch</div>
    </div>
  </td>
</tr>

<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #8338EC; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:12px; font-weight:700; color:#8338EC;">Week 1: NAVADA Edge Setup</div>
        <div style="font-size:11px; color:#999; margin-top:3px;">Hardware configured, Claude installed, Tailscale connected, daily briefing live, email system ready.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #FF006E; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:12px; font-weight:700; color:#FF006E;">Week 2-3: Storefront Build</div>
        <div style="font-size:11px; color:#999; margin-top:3px;">Product listings, Stripe payments, course builder, subscriptions, customer dashboard, analytics. Mobile-first. Your brand.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #06D6A0; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:12px; font-weight:700; color:#06D6A0;">Week 4: AI Marketing Agents</div>
        <div style="font-size:11px; color:#999; margin-top:3px;">Pinterest, Instagram, Twitter/X, Facebook, email campaigns. All automated. Content calendar generation. Approval flow from your phone.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #FFD700; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:12px; font-weight:700; color:#FFD700;">Week 5: YouTube, Blog/SEO + Handover</div>
        <div style="font-size:11px; color:#999; margin-top:3px;">YouTube automation, SEO blog engine, full system testing, training session. You are live and independent.</div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ PROOF ============ -->
<tr>
  <td style="padding:0 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:4px solid #8338EC; border-radius:0 8px 8px 0;">
      <tr><td style="padding:18px;">
        <div style="font-size:24px; color:#8338EC; line-height:1;">&#8220;</div>
        <div style="font-size:14px; color:#ffffff; font-style:italic; line-height:1.6;">
          This email was researched, designed, and sent by Claude running on Lee's NAVADA Edge server. No human typed it. No template was used. This is the same AI that will be marketing your digital products across 7 platforms every single day.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ CTA ============ -->
<tr>
  <td style="padding:0 16px 24px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:2px solid #8338EC; border-radius:10px;">
      <tr><td style="padding:20px; text-align:center;">
        <div style="font-size:18px; margin-bottom:6px;">&#128640;</div>
        <div style="font-size:18px; font-weight:800; color:#ffffff; margin-bottom:10px;">Ready to Build?</div>
        <div style="font-size:13px; color:#ccc; line-height:1.7;">
          Dr. Maureen, the system is designed and ready to go.<br><br>
          <strong style="color:#FFD700;">Next step:</strong> Confirm the deposit (&#163;2,500) and we start building in Week 1.<br><br>
          <strong style="color:#8338EC;">See Lee's live system:</strong> <a href="https://navada-world-view.xyz" style="color:#8338EC; text-decoration:underline;">navada-world-view.xyz</a><br>
          <span style="font-size:10px; color:#888;">Running right now on Lee's NAVADA Edge server. Your version will be tailored to your brand and products.</span>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- Footer -->
<tr>
  <td style="padding:20px; text-align:center; background: linear-gradient(135deg, #8338EC 0%, #0a0a0a 50%, #FF006E 100%);">
    <div style="font-size:16px; font-weight:900; color:#ffffff; letter-spacing:0.15em;">NAVADA EDGE</div>
    <div style="font-size:9px; color:rgba(255,255,255,0.5); margin-top:4px;">AI Engineering &amp; Consulting | London</div>
    <div style="font-size:8px; color:rgba(255,255,255,0.3); margin-top:8px;">Designed and sent by Claude (AI Chief of Staff) running on the NAVADA Edge Server, on behalf of Lee Akpareva.</div>
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
    to: TO_EMAIL,
    cc: 'leeakpareva@gmail.com',
    subject: 'Dr. Maureen — Your AI-Powered Digital Product Platform | NAVADA Edge Brief',
    html,
  });
  console.log(`Brief sent to ${TO_EMAIL}!`);
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
