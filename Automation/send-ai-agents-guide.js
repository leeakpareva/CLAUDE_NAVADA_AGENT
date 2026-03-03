/**
 * Send "How AI Agents Work in 2026" visual guide to Lee
 */
require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmail, p, callout } = require('./email-service');

async function send() {
  const subject = "How AI Agents Work in 2026 | Visual Guide";

  const body = `
    ${callout('How AI Agents Work in 2026', 'info')}

    ${p('Lee,')}

    ${p('Here is the visual explainer on how AI agents work, written for a non-technical audience, plus the NAVADA Edge Chief of Staff flow.')}

    <hr style="border:none; border-top:2px solid #000; margin:24px 0;">

    <h2 style="font-size:20px; font-weight:800; margin:24px 0 12px;">1. What Is an AI Agent?</h2>

    ${p('Think of an AI agent like a very capable employee who never sleeps. You give it instructions in plain English, and it figures out <em>how</em> to complete the task by itself, using whatever tools it needs.')}

    <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:14px;">
      <tr>
        <th style="background:#000; color:#fff; padding:10px 14px; text-align:left;">Chatbot (e.g. ChatGPT)</th>
        <th style="background:#000; color:#fff; padding:10px 14px; text-align:left;">AI Agent (e.g. Claude Agent)</th>
      </tr>
      <tr><td style="padding:10px 14px; border-bottom:1px solid #eee;">You ask a question, it answers</td><td style="padding:10px 14px; border-bottom:1px solid #eee;">You give a goal, it completes it</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:10px 14px; border-bottom:1px solid #eee;">One response at a time</td><td style="padding:10px 14px; border-bottom:1px solid #eee;">Takes multiple steps automatically</td></tr>
      <tr><td style="padding:10px 14px; border-bottom:1px solid #eee;">No access to your systems</td><td style="padding:10px 14px; border-bottom:1px solid #eee;">Connected to email, files, databases, APIs</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:10px 14px; border-bottom:1px solid #eee;">Forgets between conversations</td><td style="padding:10px 14px; border-bottom:1px solid #eee;">Has persistent memory across sessions</td></tr>
      <tr><td style="padding:10px 14px; border-bottom:1px solid #eee;">You do the work, it advises</td><td style="padding:10px 14px; border-bottom:1px solid #eee;">It does the work, you approve</td></tr>
    </table>

    <hr style="border:none; border-top:1px solid #ddd; margin:24px 0;">

    <h2 style="font-size:20px; font-weight:800; margin:24px 0 12px;">2. The Agentic Loop (How an Agent Thinks)</h2>

    ${p('When you give an agent a task, it follows this loop:')}

    <div style="text-align:center; margin:24px 0;">
      <div style="display:inline-block; background:#000; color:#fff; padding:12px 24px; border-radius:10px; font-weight:600; font-size:14px; margin:4px;">YOU: Give a task</div>
      <div style="font-size:22px; margin:6px 0;">&#8595;</div>
      <div style="display:inline-block; background:#f0f7ff; border:2px solid #0066cc; padding:12px 24px; border-radius:10px; font-weight:600; font-size:14px; margin:4px;">UNDERSTAND: Break it into steps</div>
      <div style="font-size:22px; margin:6px 0;">&#8595;</div>
      <div style="display:inline-block; background:#f0f7ff; border:2px solid #0066cc; padding:12px 24px; border-radius:10px; font-weight:600; font-size:14px; margin:4px;">PLAN: Choose the right tools</div>
      <div style="font-size:22px; margin:6px 0;">&#8595;</div>
      <div style="display:inline-block; background:#f0f7ff; border:2px solid #0066cc; padding:12px 24px; border-radius:10px; font-weight:600; font-size:14px; margin:4px;">ACT: Execute each step</div>
      <div style="font-size:22px; margin:6px 0;">&#8595;</div>
      <div style="display:inline-block; background:#f0f7ff; border:2px solid #0066cc; padding:12px 24px; border-radius:10px; font-weight:600; font-size:14px; margin:4px;">CHECK: Did it work? If not, retry</div>
      <div style="font-size:22px; margin:6px 0;">&#8595;</div>
      <div style="display:inline-block; background:#f0fff0; border:2px solid #228B22; padding:12px 24px; border-radius:10px; font-weight:600; font-size:14px; margin:4px;">DONE: Task complete + remembered</div>
    </div>

    ${callout('The Core Principle: Understand > Plan > Act > Check > Repeat. Agents keep working until the job is finished, not just one response.', 'info')}

    <hr style="border:none; border-top:1px solid #ddd; margin:24px 0;">

    <h2 style="font-size:20px; font-weight:800; margin:24px 0 12px;">3. Tools an Agent Can Use</h2>

    ${p('An agent on its own is just a brain. Connect it to tools and it becomes powerful:')}

    <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:14px;">
      <tr><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600; width:30%;">Read & Write Files</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Open documents, create reports, edit data</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">Send Emails</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Compose, send, read inbox, auto-reply</td></tr>
      <tr><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">Browse the Web</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Search, read websites, scrape data</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">Use Databases</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Store/retrieve records, track everything</td></tr>
      <tr><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">Call APIs</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Connect to Slack, LinkedIn, CRMs, any service</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">Generate Images</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Create visuals, diagrams, social graphics</td></tr>
      <tr><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">Manage Servers</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Deploy apps, monitor health, restart services</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">Schedule Tasks</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Automate daily/weekly jobs without being asked</td></tr>
    </table>

    <hr style="border:none; border-top:1px solid #ddd; margin:24px 0;">

    <h2 style="font-size:20px; font-weight:800; margin:24px 0 12px;">4. Real Example: The Agentic Loop in Action</h2>

    ${p('<strong>Task:</strong> "Find 10 AI companies in London and email me a summary"')}

    <div style="text-align:center; margin:24px 0;">
      <div style="display:inline-block; background:#000; color:#fff; padding:10px 20px; border-radius:8px; font-weight:600; font-size:13px; margin:4px;">User Request</div>
      <div style="font-size:20px; margin:4px 0;">&#8595;</div>
      <div style="display:inline-block; background:#f8f8f8; border:2px solid #000; padding:10px 20px; border-radius:8px; font-weight:600; font-size:13px; margin:4px;">Claude reads + plans 4 steps</div>
      <div style="font-size:20px; margin:4px 0;">&#8595;</div>

      <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin:8px 0;">
        <div style="background:#f0fff0; border:2px solid #228B22; padding:8px 14px; border-radius:8px; font-size:12px; font-weight:600;">1. Web Search</div>
        <div style="background:#f0fff0; border:2px solid #228B22; padding:8px 14px; border-radius:8px; font-size:12px; font-weight:600;">2. Scrape Sites</div>
        <div style="background:#f0fff0; border:2px solid #228B22; padding:8px 14px; border-radius:8px; font-size:12px; font-weight:600;">3. Write Report</div>
        <div style="background:#f0fff0; border:2px solid #228B22; padding:8px 14px; border-radius:8px; font-size:12px; font-weight:600;">4. Send Email</div>
      </div>

      <div style="font-size:20px; margin:4px 0;">&#8595;</div>
      <div style="display:inline-block; background:#f0f7ff; border:2px solid #0066cc; padding:10px 20px; border-radius:8px; font-weight:600; font-size:13px; margin:4px;">Self-check: All 4 steps passed</div>
      <div style="font-size:20px; margin:4px 0;">&#8595;</div>
      <div style="display:inline-block; background:#000; color:#fff; padding:10px 20px; border-radius:8px; font-weight:600; font-size:13px; margin:4px;">Email delivered with 10 companies</div>
    </div>

    <hr style="border:none; border-top:2px solid #000; margin:32px 0;">

    <h2 style="font-size:22px; font-weight:800; margin:24px 0 12px;">5. NAVADA Edge: Claude as Chief of Staff</h2>

    ${p('NAVADA takes this agent concept and turns it into a full-time Chief of Staff that runs 24/7 on a dedicated server.')}

    <div style="background:#f8f8f8; border:2px solid #000; border-radius:12px; padding:24px; margin:24px 0;">

      <h3 style="text-align:center; font-size:16px; margin-bottom:16px;">The NAVADA Edge Architecture</h3>

      <div style="text-align:center; margin:16px 0;">
        <div style="display:inline-block; background:#000; color:#fff; padding:12px 28px; border-radius:10px; font-weight:700; font-size:15px;">
          LEE (iPhone / Laptop)
        </div>
        <div style="font-size:12px; color:#666; margin-top:4px;">Commands via Telegram, voice, or terminal</div>
      </div>

      <div style="text-align:center; font-size:22px; margin:8px 0;">&#8595;</div>

      <div style="text-align:center; margin:8px 0; font-size:13px; font-weight:600;">3 Input Channels:</div>

      <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap; margin:8px 0;">
        <div style="background:#fff; border:2px solid #000; padding:10px 16px; border-radius:8px; font-size:13px; font-weight:600; text-align:center;">Telegram Bot<br><span style="font-weight:400; font-size:11px;">42+ commands</span></div>
        <div style="background:#fff; border:2px solid #000; padding:10px 16px; border-radius:8px; font-size:13px; font-weight:600; text-align:center;">Voice Control<br><span style="font-weight:400; font-size:11px;">"Hey Claude..."</span></div>
        <div style="background:#fff; border:2px solid #000; padding:10px 16px; border-radius:8px; font-size:13px; font-weight:600; text-align:center;">Claude Code<br><span style="font-weight:400; font-size:11px;">Direct terminal</span></div>
      </div>

      <div style="text-align:center; font-size:22px; margin:8px 0;">&#8595;</div>

      <div style="text-align:center; margin:16px 0;">
        <div style="display:inline-block; background:#000; color:#fff; padding:14px 32px; border-radius:10px; font-weight:700; font-size:15px;">
          CLAUDE (AI Brain)
        </div>
        <div style="font-size:12px; color:#666; margin-top:4px;">23 connected tools (MCP servers) | Persistent memory | Self-correcting</div>
      </div>

      <div style="text-align:center; font-size:22px; margin:8px 0;">&#8595;</div>

      <div style="text-align:center; margin:8px 0; font-size:13px; font-weight:600;">Claude manages all of these:</div>

      <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin:8px 0;">
        <div style="background:#f0fff0; border:1px solid #228B22; padding:8px 12px; border-radius:6px; font-size:12px; font-weight:600;">Email (Zoho)</div>
        <div style="background:#f0fff0; border:1px solid #228B22; padding:8px 12px; border-radius:6px; font-size:12px; font-weight:600;">LinkedIn</div>
        <div style="background:#f0fff0; border:1px solid #228B22; padding:8px 12px; border-radius:6px; font-size:12px; font-weight:600;">Files</div>
        <div style="background:#f0fff0; border:1px solid #228B22; padding:8px 12px; border-radius:6px; font-size:12px; font-weight:600;">Databases</div>
      </div>
      <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin:8px 0;">
        <div style="background:#f0fff0; border:1px solid #228B22; padding:8px 12px; border-radius:6px; font-size:12px; font-weight:600;">Web Scraping</div>
        <div style="background:#f0fff0; border:1px solid #228B22; padding:8px 12px; border-radius:6px; font-size:12px; font-weight:600;">DALL-E Images</div>
        <div style="background:#f0fff0; border:1px solid #228B22; padding:8px 12px; border-radius:6px; font-size:12px; font-weight:600;">Deployments</div>
        <div style="background:#f0fff0; border:1px solid #228B22; padding:8px 12px; border-radius:6px; font-size:12px; font-weight:600;">Server Monitoring</div>
      </div>

      <div style="text-align:center; font-size:22px; margin:8px 0;">&#8595;</div>

      <div style="text-align:center; margin:16px 0;">
        <div style="display:inline-block; background:#f0f7ff; border:2px solid #0066cc; padding:12px 24px; border-radius:10px; font-weight:700; font-size:14px;">
          18 SCHEDULED AUTOMATIONS
        </div>
        <div style="font-size:12px; color:#666; margin-top:4px;">Morning briefing | AI news | Job hunting | Lead pipeline | Trading | Reports</div>
      </div>

    </div>

    <hr style="border:none; border-top:1px solid #ddd; margin:24px 0;">

    <h2 style="font-size:20px; font-weight:800; margin:24px 0 12px;">6. A Day in the Life of Claude at NAVADA</h2>

    <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:14px;">
      <tr><th style="background:#000; color:#fff; padding:10px 14px; text-align:left; width:100px;">Time</th><th style="background:#000; color:#fff; padding:10px 14px; text-align:left;">What Claude Does</th></tr>
      <tr><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">6:30 AM</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Morning briefing: weather, calendar, priorities</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">7:00 AM</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Scans AI news, writes digest, emails it</td></tr>
      <tr><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">8:00 AM</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">UK/US economy report (Mondays)</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">8:30 AM</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Lead pipeline: find prospects, verify emails, send outreach</td></tr>
      <tr><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">9:00 AM</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Job hunting: find AI roles matching profile</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">All Day</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Monitors inbox every 2 hours, auto-replies</td></tr>
      <tr><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">2:15 PM</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Pre-market trading scan</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">3:45 PM</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Execute trades (paper trading)</td></tr>
      <tr><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">6:00 PM</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Market intelligence analysis</td></tr>
      <tr style="background:#f8f8f8;"><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">9:00 PM</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Daily operations summary report</td></tr>
      <tr><td style="padding:8px 14px; border-bottom:1px solid #eee; font-weight:600;">Any Time</td><td style="padding:8px 14px; border-bottom:1px solid #eee;">Responds to Telegram commands within seconds</td></tr>
    </table>

    <hr style="border:none; border-top:1px solid #ddd; margin:24px 0;">

    <h2 style="font-size:20px; font-weight:800; margin:24px 0 12px;">7. Why This Matters</h2>

    ${callout('The shift: In 2024, people used AI to get answers. In 2026, people use AI agents to get things done. The agent does not just tell you what to do. It does it for you, checks its own work, and reports back.', 'info')}

    ${p('<strong>For individuals:</strong> An AI agent is like hiring a full-time assistant who works 24/7, never takes holidays, and costs a fraction of a human salary.')}

    ${p('<strong>For businesses:</strong> AI agents handle repetitive operational work (emails, reports, data entry, monitoring) so your team focuses on strategy, relationships, and creative work.')}

    ${p('<strong>What NAVADA Edge offers:</strong> We deploy this exact setup for clients. A dedicated server running Claude as your Chief of Staff, customised to your business, with your tools connected, your automations scheduled, and your Telegram as the remote control.')}

    <div style="margin-top:32px; padding:16px; border-top:1px solid #ddd; font-size:12px; color:#999; text-align:center;">
      Full HTML version saved to Manager/docs/How-AI-Agents-Work-2026.html
    </div>
  `;

  try {
    await sendEmail({ to: process.env.RECIPIENT_EMAIL, subject, body });
    console.log('Sent: How AI Agents Work in 2026');
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

send();
