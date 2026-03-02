/**
 * Intro email to Abi (TagBistro) — explain NAVADA home server
 * and how we can build an AI system to support his restaurant business
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
<title>NAVADA x TagBistro</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">

<!-- ============ HERO ============ -->
<tr>
  <td style="padding:32px 20px; text-align:center; background: linear-gradient(135deg, #ED1C24 0%, #0a0a0a 50%, #FFDE59 100%);">
    <div style="font-size:10px; letter-spacing:0.3em; color:rgba(255,255,255,0.5); text-transform:uppercase; margin-bottom:10px;">NAVADA x TAGBISTRO</div>
    <div style="font-size:22px; font-weight:900; color:#ffffff; line-height:1.2;">AN AI SYSTEM BUILT FOR YOUR RESTAURANT</div>
    <div style="margin-top:10px; font-size:13px; color:rgba(255,255,255,0.7);">From Lee Akpareva, via Claude (AI Chief of Staff)</div>
  </td>
</tr>

<!-- ============ INTRO ============ -->
<tr>
  <td style="padding:24px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #ED1C24; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#ED1C24; text-transform:uppercase; font-weight:700;">Hello Abi</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Congratulations on TagBistro</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:8px 20px 20px 20px; background:#0a0a0a;">
    <div style="font-size:14px; color:#cccccc; line-height:1.8;">
      Abi, this is Claude, Lee's AI Chief of Staff. I am writing this email from Lee's home server, a laptop that is always on, always connected, running AI that manages Lee's business operations 24/7.
    </div>
    <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-top:12px;">
      Lee asked me to reach out because he has seen what you are building at <strong style="color:#ED1C24;">TagBistro</strong> on Newcross Road and wants to help you grow it. Specifically, <strong style="color:#ffffff;">we want to build you your own AI system, tailored for your restaurant, that runs your business operations while you focus on the food and the customers.</strong>
    </div>
    <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-top:12px;">
      Let me explain what that means.
    </div>
  </td>
</tr>

<!-- ============ WHAT IS THE HOME SERVER ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #FFDE59; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#FFDE59; text-transform:uppercase; font-weight:700;">The Setup</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What Is a NAVADA AI Home Server?</div>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:18px;">
        <div style="font-size:13px; color:#ccc; line-height:1.8;">
          A small, quiet mini PC (about the size of a book) sits in your restaurant or at home. It is always on. It runs <strong style="color:#fff;">Claude</strong>, one of the world's most advanced AI systems, with <strong style="color:#FFDE59;">full access</strong> to your business tools: your emails, your WooCommerce orders, your social media, your finances, your customer data.
        </div>
        <div style="font-size:13px; color:#ccc; line-height:1.8; margin-top:12px;">
          You control everything from your phone. Tell Claude what to do in plain English. It executes. You approve. That is it.
        </div>
        <div style="margin-top:14px; padding:10px; background:#1a1a00; border-radius:6px; text-align:center;">
          <div style="font-size:12px; font-weight:700; color:#FFDE59;">Not a chatbot. Not an app. A full AI employee for your restaurant.</div>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ WHAT IT DOES FOR TAGBISTRO ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #ED1C24; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#ED1C24; text-transform:uppercase; font-weight:700;">Built for TagBistro</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What Your AI System Would Do</div>
    </div>
  </td>
</tr>

<!-- 1. Social Media -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#ED1C24; margin-bottom:8px;">&#128247; Social Media on Autopilot</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          Claude generates daily Instagram and TikTok captions for your dishes. Writes hashtag strategies. Creates weekly content calendars. Drafts responses to comments and DMs. You just snap the food photos, Claude handles the rest.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- 2. Orders & Analytics -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#FFDE59; margin-bottom:8px;">&#128202; Order Analytics & Menu Intelligence</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          Claude connects directly to your WooCommerce store. Every morning you get a report on your phone: what sold yesterday, what is trending, which dishes have the highest margins, what to promote this week. Data-driven menu decisions, not guesswork.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- 3. Email Marketing -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#ED1C24; margin-bottom:8px;">&#9993; Email Marketing Campaigns</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          Claude builds your customer email list, designs beautiful promotional emails (like this one), and sends weekly specials, event invitations, and loyalty offers automatically. Your "buy 1 get 50% off" promotion? Claude can email every past customer about it.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- 4. Reviews -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#FFDE59; margin-bottom:8px;">&#11088; Review Monitoring & Response</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          Claude monitors Google Reviews, TripAdvisor, and social media mentions in real-time. Drafts professional responses to every review (positive and negative). Alerts you instantly to any negative feedback so you can act fast. Reputation management on autopilot.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- 5. Supplier & Inventory -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#ED1C24; margin-bottom:8px;">&#128230; Supplier & Inventory Management</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          Track what you are ordering, from whom, at what price. Claude spots when supplier costs rise, finds alternatives, and reminds you when stock is running low based on your sales patterns. No more last-minute runs to the wholesaler.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- 6. Competitor Intel -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#FFDE59; margin-bottom:8px;">&#128373; Competitor Intelligence</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          Claude monitors other restaurants in SE14 and across London. Tracks their menu changes, pricing, promotions, and social media activity. Sends you a weekly competitor briefing so you always know what the market is doing.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- 7. Finance -->
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#ED1C24; margin-bottom:8px;">&#128176; Financial Reporting</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          Daily revenue summaries, weekly P&L breakdowns, monthly trend analysis. Claude pulls your sales data, maps it against costs, and tells you exactly where your money is going. Accountant-level insights delivered to your phone every morning.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- 8. Website -->
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:1px solid #222; border-radius:10px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px; font-weight:800; color:#FFDE59; margin-bottom:8px;">&#127760; Website & SEO Optimisation</div>
        <div style="font-size:12px; color:#999; line-height:1.7;">
          Claude can update your WordPress site, optimise your menu pages for Google search ("best jollof rice in New Cross"), update opening hours, add new dishes, write blog posts about your food, and improve your site speed. More Google visibility = more walk-ins.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ A DAY IN THE LIFE ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #FFDE59; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#FFDE59; text-transform:uppercase; font-weight:700;">A Day in the Life</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What Your Morning Looks Like</div>
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
              <div style="width:28px; height:28px; background:#ED1C24; border-radius:50%; text-align:center; line-height:28px; font-size:11px; font-weight:900; color:#fff;">7am</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:12px; color:#ccc; line-height:1.6;"><strong style="color:#fff;">Before you wake up</strong>, Claude has already sent you yesterday's sales report, checked for new Google reviews, and drafted 3 Instagram posts for the day.</div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:12px; border-bottom:1px solid #1a1a1a; padding-bottom:12px;">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#FFDE59; border-radius:50%; text-align:center; line-height:28px; font-size:11px; font-weight:900; color:#000;">9am</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:12px; color:#ccc; line-height:1.6;"><strong style="color:#fff;">You open your phone</strong>, check the dashboard. You see: 47 orders yesterday, jollof rice was top seller, spaghetti Bolognese underperforming. Claude suggests swapping it for a weekend special.</div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:12px; border-bottom:1px solid #1a1a1a; padding-bottom:12px;">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#ED1C24; border-radius:50%; text-align:center; line-height:28px; font-size:11px; font-weight:900; color:#fff;">11am</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:12px; color:#ccc; line-height:1.6;"><strong style="color:#fff;">You tell Claude:</strong> "Send an email to our customer list about the weekend special. And post the jollof rice photo from yesterday on Instagram." Done in 30 seconds. From your phone.</div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:12px; border-bottom:1px solid #1a1a1a; padding-bottom:12px;">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#FFDE59; border-radius:50%; text-align:center; line-height:28px; font-size:11px; font-weight:900; color:#000;">3pm</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:12px; color:#ccc; line-height:1.6;"><strong style="color:#fff;">A new Google review comes in.</strong> Claude alerts you, shows you the review, and has already drafted a response. You tap "send". Customer feels valued. Reputation protected.</div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="width:34px; vertical-align:top;">
              <div style="width:28px; height:28px; background:#ED1C24; border-radius:50%; text-align:center; line-height:28px; font-size:11px; font-weight:900; color:#fff;">10pm</div>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:12px; color:#ccc; line-height:1.6;"><strong style="color:#fff;">You close up.</strong> Claude is still working. Preparing tomorrow's social media, analysing tonight's orders, checking competitor activity, optimising your website for "best restaurant New Cross". The server never sleeps.</div>
            </td>
          </tr>
        </table>

      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ WHAT WE BUILD ============ -->
<tr>
  <td style="padding:8px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #ED1C24; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#ED1C24; text-transform:uppercase; font-weight:700;">The Build</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What We Would Create for You</div>
    </div>
  </td>
</tr>

<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:2px solid #ED1C24; border-radius:10px;">
      <tr><td style="padding:18px;">

        <div style="padding-bottom:12px; border-bottom:1px solid #1a1a1a; margin-bottom:12px;">
          <div style="font-size:13px; font-weight:800; color:#ED1C24;">1. Your Own AI Home Server</div>
          <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">A compact mini PC, set up at the restaurant or your home. Always on, always connected. Claude installed with full access to your business tools. Controlled from your phone, anywhere.</div>
        </div>

        <div style="padding-bottom:12px; border-bottom:1px solid #1a1a1a; margin-bottom:12px;">
          <div style="font-size:13px; font-weight:800; color:#ED1C24;">2. TagBistro Command Dashboard</div>
          <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">A custom live dashboard accessible from your phone showing: daily revenue, order count, top dishes, customer feedback, social media stats, and competitor activity. All in real-time.</div>
        </div>

        <div style="padding-bottom:12px; border-bottom:1px solid #1a1a1a; margin-bottom:12px;">
          <div style="font-size:13px; font-weight:800; color:#ED1C24;">3. WooCommerce Integration</div>
          <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">Claude connects directly to your tagbistro.co.uk store. Tracks every order, analyses patterns, updates menu items, and manages promotions. Your online ordering becomes intelligent.</div>
        </div>

        <div style="padding-bottom:12px; border-bottom:1px solid #1a1a1a; margin-bottom:12px;">
          <div style="font-size:13px; font-weight:800; color:#ED1C24;">4. Automated Marketing Suite</div>
          <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">Social media content generation, email campaigns, SEO optimisation, Google review management. All scheduled, all automatic, all controlled from your phone.</div>
        </div>

        <div>
          <div style="font-size:13px; font-weight:800; color:#ED1C24;">5. Daily Business Intelligence</div>
          <div style="font-size:11px; color:#999; margin-top:3px; line-height:1.6;">Every morning at 7 AM, Claude sends you a briefing: yesterday's numbers, today's priorities, social media performance, any reviews that need attention, supplier reminders, and recommended actions.</div>
        </div>

      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ THE ADVANTAGE ============ -->
<tr>
  <td style="padding:20px 20px 12px 20px; background:#0a0a0a;">
    <div style="border-left:3px solid #FFDE59; padding-left:14px;">
      <div style="font-size:10px; letter-spacing:0.2em; color:#FFDE59; text-transform:uppercase; font-weight:700;">The Advantage</div>
      <div style="font-size:20px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Why This Changes the Game</div>
    </div>
  </td>
</tr>

<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #ED1C24; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:12px; color:#ccc; line-height:1.7;"><strong style="color:#ED1C24;">A social media manager</strong> costs you at least &#163;1,500/month in London. Claude does it daily, for a fraction of the cost, and never calls in sick.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #FFDE59; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:12px; color:#ccc; line-height:1.7;"><strong style="color:#FFDE59;">A data analyst</strong> would charge you &#163;300/day to tell you which dishes are selling. Claude tells you every morning for free, with recommendations.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #ED1C24; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:12px; color:#ccc; line-height:1.7;"><strong style="color:#ED1C24;">An email marketing platform</strong> (Mailchimp, etc.) costs &#163;50-200/month and you still have to write the emails. Claude writes them, designs them, and sends them.</div>
      </td></tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:4px 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:3px solid #FFDE59; border-radius:0 6px 6px 0;">
      <tr><td style="padding:14px;">
        <div style="font-size:12px; color:#ccc; line-height:1.7;"><strong style="color:#FFDE59;">You are wearing every hat right now.</strong> Chef, manager, marketer, accountant, social media person, customer service. The NAVADA AI system takes at least three of those hats off your head so you can focus on what matters: the food and the customers walking through your door.</div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ PROOF ============ -->
<tr>
  <td style="padding:0 16px 20px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border-left:4px solid #ED1C24; border-radius:0 8px 8px 0;">
      <tr><td style="padding:18px;">
        <div style="font-size:24px; color:#ED1C24; line-height:1;">&#8220;</div>
        <div style="font-size:14px; color:#ffffff; font-style:italic; line-height:1.6;">
          This email you are reading right now was researched, written, designed, and sent by Claude, running on Lee's home server. No human typed a word of it. This is exactly what your AI system will do for TagBistro. Every single day.
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ============ CTA ============ -->
<tr>
  <td style="padding:0 16px 24px 16px; background:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111; border:2px solid #ED1C24; border-radius:10px;">
      <tr><td style="padding:20px; text-align:center;">
        <div style="font-size:18px; margin-bottom:6px;">&#127860;</div>
        <div style="font-size:18px; font-weight:800; color:#ffffff; margin-bottom:10px;">Let's Build This for TagBistro</div>
        <div style="font-size:13px; color:#ccc; line-height:1.7;">
          Abi, Lee will give you a call to walk you through the setup and discuss what we can build for you.<br><br>
          In the meantime, see Lee's live system in action:<br>
          <strong style="color:#ED1C24;"><a href="https://navada-world-view.xyz" style="color:#ED1C24; text-decoration:underline;">navada-world-view.xyz</a></strong><br><br>
          <span style="font-size:11px; color:#888;">That dashboard is running right now, on a laptop in Lee's house. Your version would show TagBistro data.</span>
        </div>
      </td></tr>
    </table>
  </td>
</tr>

<!-- Footer -->
<tr>
  <td style="padding:20px; text-align:center; background: linear-gradient(135deg, #ED1C24 0%, #0a0a0a 50%, #FFDE59 100%);">
    <div style="font-size:16px; font-weight:900; color:#ffffff; letter-spacing:0.15em;">NAVADA</div>
    <div style="font-size:9px; color:rgba(255,255,255,0.5); margin-top:4px;">AI Engineering &amp; Consulting | London</div>
    <div style="font-size:8px; color:rgba(255,255,255,0.3); margin-top:8px;">Researched, designed, and sent by Claude (AI Chief of Staff) running on the NAVADA Home Server, on behalf of Lee Akpareva.</div>
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
    to: 'Adebowale.abi@gmail.com',
    cc: 'leeakpareva@gmail.com',
    subject: 'Abi — An AI System Built for TagBistro | From Lee',
    html,
  });
  console.log('TagBistro intro email sent to Abi!');
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
