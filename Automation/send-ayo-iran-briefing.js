/**
 * Iran Intelligence Briefing for Ayo
 * Visual email with GDELT articles + web intelligence
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
<title>NAVADA Intelligence Briefing: Iran Crisis</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">

<!-- ALERT BANNER -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ff0033;">
  <tr>
    <td style="padding:8px 40px; text-align:center;">
      <div style="font-size:11px; font-weight:800; color:#ffffff; letter-spacing:0.2em; text-transform:uppercase;">&#9888; BREAKING INTELLIGENCE BRIEFING &#9888;</div>
    </td>
  </tr>
</table>

<!-- Hero Banner -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #1a0000 0%, #330000 40%, #660000 100%);">
  <tr>
    <td style="padding: 50px 40px; text-align:center;">
      <div style="font-size:11px; letter-spacing:0.3em; color:#ff4444; text-transform:uppercase; margin-bottom:12px; font-weight:700;">NAVADA World Monitor | 1 March 2026</div>
      <div style="font-size:40px; font-weight:900; color:#ffffff; letter-spacing:-0.02em; line-height:1.15;">IRAN CRISIS<br>INTELLIGENCE BRIEFING</div>
      <div style="margin-top:16px; font-size:14px; color:rgba(255,255,255,0.7); font-style:italic;">US-Israel strikes kill Khamenei. Iran retaliates across Gulf. Region in crisis.</div>
      <div style="margin-top:24px; width:60px; height:3px; background:#ff4444; display:inline-block; border-radius:2px;"></div>
    </td>
  </tr>
</table>

<!-- SITUATION OVERVIEW -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 40px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#ff0033; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#ff0033; text-transform:uppercase; font-weight:700;">Situation Report</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">What Happened</div>
            <div style="font-size:13px; color:#ff6666; margin-top:4px; font-weight:600;">28 Feb - 1 Mar 2026 | Ongoing</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 24px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        On <strong style="color:#ffffff;">28 February 2026</strong>, the United States and Israel launched a massive joint military operation against Iran. The stated objectives: <strong style="color:#ff6666;">destroy Iran's nuclear programme</strong> and neutralise its military leadership.
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 24px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        <strong style="color:#ffffff;">Ayatollah Ali Khamenei</strong>, Iran's Supreme Leader since 1989, was <strong style="color:#ff4444;">killed in a precision airstrike</strong> on his central leadership compound in Tehran. The IDF confirmed the operation was "guided by accurate intelligence." Iranian state media and the Supreme National Security Council confirmed his death early on 1 March. The commander-in-chief of the Islamic Revolutionary Guards Corps and Ali Shamkhani (representative of the Supreme Leader in the Supreme Defence Council) were also killed.
      </div>
    </td>
  </tr>
</table>

<!-- KEY STATS -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 30px 32px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:1px solid #331111; border-radius:12px;">
        <tr>
          <td style="width:25%; text-align:center; padding:20px 8px; border-right:1px solid #222;">
            <div style="font-size:32px; font-weight:900; color:#ff0033; line-height:1;">27</div>
            <div style="font-size:10px; color:#888; margin-top:6px; text-transform:uppercase; letter-spacing:0.08em;">US Bases Targeted<br>by Iran</div>
          </td>
          <td style="width:25%; text-align:center; padding:20px 8px; border-right:1px solid #222;">
            <div style="font-size:32px; font-weight:900; color:#ff6600; line-height:1;">137</div>
            <div style="font-size:10px; color:#888; margin-top:6px; text-transform:uppercase; letter-spacing:0.08em;">Missiles Fired<br>at UAE</div>
          </td>
          <td style="width:25%; text-align:center; padding:20px 8px; border-right:1px solid #222;">
            <div style="font-size:32px; font-weight:900; color:#ffaa00; line-height:1;">1,400+</div>
            <div style="font-size:10px; color:#888; margin-top:6px; text-transform:uppercase; letter-spacing:0.08em;">Flights<br>Cancelled</div>
          </td>
          <td style="width:25%; text-align:center; padding:20px 8px;">
            <div style="font-size:32px; font-weight:900; color:#ff4444; line-height:1;">6</div>
            <div style="font-size:10px; color:#888; margin-top:6px; text-transform:uppercase; letter-spacing:0.08em;">Waves of Iranian<br>Retaliation</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- IRAN RETALIATION -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#ff6600; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#ff6600; text-transform:uppercase; font-weight:700;">Iranian Response</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Retaliation Across the Gulf</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 12px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        The IRGC launched <strong style="color:#ffffff;">six waves of retaliatory strikes</strong> targeting US military assets and Israel. The attacks used both missiles and drones, hitting:
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 32px 30px;">
      <table role="presentation" width="100%" cellspacing="6" cellpadding="0">
        <tr>
          <td style="width:33%; background:#1a0a0a; border:1px solid #441111; border-radius:8px; padding:16px; vertical-align:top;">
            <div style="font-size:22px; margin-bottom:6px;">&#127466;&#127473;</div>
            <div style="font-size:12px; font-weight:800; color:#ff4444;">ISRAEL</div>
            <div style="font-size:11px; color:#999; margin-top:6px; line-height:1.5;">Tel Nof airbase<br>Military HQ<br>Defence industry complex<br>Tel Aviv</div>
          </td>
          <td style="width:33%; background:#1a0a0a; border:1px solid #441111; border-radius:8px; padding:16px; vertical-align:top;">
            <div style="font-size:22px; margin-bottom:6px;">&#127462;&#127466;</div>
            <div style="font-size:12px; font-weight:800; color:#ff6600;">UAE / DUBAI</div>
            <div style="font-size:11px; color:#999; margin-top:6px; line-height:1.5;">137 missiles, 209 drones<br>Fires at Palm Jumeirah<br>Burj al-Arab area hit<br>Dubai + Abu Dhabi airports damaged</div>
          </td>
          <td style="width:33%; background:#1a0a0a; border:1px solid #441111; border-radius:8px; padding:16px; vertical-align:top;">
            <div style="font-size:22px; margin-bottom:6px;">&#127480;&#127462;</div>
            <div style="font-size:12px; font-weight:800; color:#ffaa00;">GULF STATES</div>
            <div style="font-size:11px; color:#999; margin-top:6px; line-height:1.5;">Blasts in Doha (Qatar)<br>Blasts in Manama (Bahrain)<br>Kuwait, Saudi, Iraq<br>Jordan also targeted</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- SUCCESSION -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#ffaa00; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#ffaa00; text-transform:uppercase; font-weight:700;">Power Vacuum</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Succession Crisis</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 32px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        Iran has declared <strong style="color:#ffffff;">40 days of national mourning</strong>. Under Article 111 of Iran's constitution, a <strong style="color:#ffaa00;">three-member interim council</strong> now assumes the Supreme Leader's duties: the President, the head of the judiciary, and a jurist from the Guardian Council. The 88-member Assembly of Experts is responsible for choosing a permanent successor. The IRGC has vowed <strong style="color:#ff4444;">"ferocious" and "sweeping" retaliation</strong>.
      </div>
    </td>
  </tr>
</table>

<!-- OIL & MARKETS -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#00aaff; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#00aaff; text-transform:uppercase; font-weight:700;">Market Impact</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Oil &amp; Global Markets</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 32px 30px;">
      <table role="presentation" width="100%" cellspacing="8" cellpadding="0">
        <tr>
          <td style="width:50%; background:#0a1a2a; border:1px solid #113344; border-radius:8px; padding:20px; vertical-align:top;">
            <div style="font-size:11px; letter-spacing:0.1em; color:#00aaff; text-transform:uppercase; font-weight:700; margin-bottom:10px;">Oil Prices</div>
            <div style="font-size:14px; color:#ccc; line-height:1.7;">
              <strong style="color:#fff;">Brent Crude</strong>: up ~2.9% to <strong style="color:#00ff88;">$72.80+</strong><br>
              <strong style="color:#fff;">WTI</strong>: up ~2.8% to <strong style="color:#00ff88;">$67+</strong><br><br>
              Analysts project <strong style="color:#ff4444;">$10-$20/barrel surge</strong> when markets reopen Sunday night if no de-escalation.
            </div>
          </td>
          <td style="width:50%; background:#0a1a2a; border:1px solid #113344; border-radius:8px; padding:20px; vertical-align:top;">
            <div style="font-size:11px; letter-spacing:0.1em; color:#00aaff; text-transform:uppercase; font-weight:700; margin-bottom:10px;">Strait of Hormuz</div>
            <div style="font-size:14px; color:#ccc; line-height:1.7;">
              Iran is pressuring the <strong style="color:#fff;">Strait of Hormuz</strong>, the narrow waterway handling <strong style="color:#ffaa00;">~20% of global oil demand</strong> (~20M barrels/day).<br><br>
              A full blockade would be the <strong style="color:#ff4444;">most significant oil supply disruption</strong> since the 1973 embargo.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- GLOBAL RESPONSE -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#8338EC; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#8338EC; text-transform:uppercase; font-weight:700;">International</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Global Response</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 32px 30px;">
      <table role="presentation" width="100%" cellspacing="6" cellpadding="0">
        <tr>
          <td style="background:#111; border-left:3px solid #ff4444; border-radius:0 6px 6px 0; padding:14px 16px;">
            <div style="font-size:12px; font-weight:700; color:#ff4444;">UN Secretary-General Guterres</div>
            <div style="font-size:12px; color:#999; margin-top:4px;">Condemned the escalation, called for immediate cessation of hostilities, warned of "grave consequences for civilians and regional stability"</div>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-left:3px solid #ffaa00; border-radius:0 6px 6px 0; padding:14px 16px;">
            <div style="font-size:12px; font-weight:700; color:#ffaa00;">Malaysia, South Africa, Pakistan</div>
            <div style="font-size:12px; color:#999; margin-top:4px;">Advised citizens to halt non-essential travel to Middle East. Pro-Iran protests at US consulate in Pakistan (8 killed). South Africa's Ramaphosa condemned strikes.</div>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-left:3px solid #00aaff; border-radius:0 6px 6px 0; padding:14px 16px;">
            <div style="font-size:12px; font-weight:700; color:#00aaff;">Travel Chaos</div>
            <div style="font-size:12px; color:#999; margin-top:4px;">1,400+ flights cancelled across the region. Thousands of travellers stranded, including at Doha airport. Middle East airports closed or damaged.</div>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-left:3px solid #8338EC; border-radius:0 6px 6px 0; padding:14px 16px;">
            <div style="font-size:12px; font-weight:700; color:#8338EC;">Iran's Foreign Minister</div>
            <div style="font-size:12px; color:#999; margin-top:4px;">Initially claimed Khamenei was "still alive as far as I know" before state media confirmed the death. Iran embassy in Malaysia slammed attacks "in midst of nuclear talks."</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- LIVE SOURCES -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#06D6A0; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#06D6A0; text-transform:uppercase; font-weight:700;">Sources</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">Live Coverage</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 32px 30px;">
      <table role="presentation" width="100%" cellspacing="4" cellpadding="0">
        <tr>
          <td style="background:#111; border-radius:6px; padding:12px 16px;">
            <a href="https://www.npr.org/2026/02/28/nx-s1-5730158/israel-iran-strikes-trump-us" style="color:#06D6A0; font-size:12px; font-weight:700; text-decoration:none;">NPR: Iran's Supreme Leader Killed</a>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-radius:6px; padding:12px 16px;">
            <a href="https://www.cnbc.com/2026/03/01/us-iran-live-updates-khamenei-death-trump-gulf-strikes.html" style="color:#06D6A0; font-size:12px; font-weight:700; text-decoration:none;">CNBC: Live Updates, Retaliatory Strikes and Regional Fallout</a>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-radius:6px; padding:12px 16px;">
            <a href="https://www.aljazeera.com/news/2026/3/1/more-blasts-rock-dubai-doha-and-manama-as-iran-targets-us-assets-in-gulf" style="color:#06D6A0; font-size:12px; font-weight:700; text-decoration:none;">Al Jazeera: Blasts Rock Dubai, Doha, Manama</a>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-radius:6px; padding:12px 16px;">
            <a href="https://www.aljazeera.com/news/2026/2/28/mapping-us-and-israeli-attacks-on-iran-and-tehrans-retaliatory-strikes" style="color:#06D6A0; font-size:12px; font-weight:700; text-decoration:none;">Al Jazeera: Mapping US-Israeli Attacks and Iran's Strikes</a>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-radius:6px; padding:12px 16px;">
            <a href="https://finance.yahoo.com/news/us-strikes-against-iran-could-see-oil-prices-jump-10-to-20-or-more-with-no-deescalation-143847017.html" style="color:#06D6A0; font-size:12px; font-weight:700; text-decoration:none;">Yahoo Finance: Oil Prices Could Jump $10-$20</a>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-radius:6px; padding:12px 16px;">
            <a href="https://www.france24.com/en/asia-pacific/20260228-live-israel-says-launched-preventive-strike-against-iran-declares-state-of-emergency" style="color:#06D6A0; font-size:12px; font-weight:700; text-decoration:none;">France 24: IRGC Vows 'Ferocious' Retaliation</a>
          </td>
        </tr>
        <tr>
          <td style="background:#111; border-radius:6px; padding:12px 16px;">
            <a href="https://en.wikipedia.org/wiki/2026_Israeli%E2%80%93United_States_strikes_on_Iran" style="color:#06D6A0; font-size:12px; font-weight:700; text-decoration:none;">Wikipedia: 2026 Israeli-US Strikes on Iran</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- WHAT TO WATCH -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border-left:4px solid #ff0033; border-radius:0 8px 8px 0;">
        <tr>
          <td style="padding:24px 28px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#ff0033; text-transform:uppercase; font-weight:700; margin-bottom:12px;">&#9888; What to Watch Next</div>
            <div style="font-size:13px; color:#ccc; line-height:1.8;">
              <strong style="color:#fff;">1.</strong> Strait of Hormuz: any full blockade would trigger a global energy crisis<br>
              <strong style="color:#fff;">2.</strong> Oil markets reopening Sunday night: expected $10-$20/barrel spike<br>
              <strong style="color:#fff;">3.</strong> IRGC next moves: further retaliation waves or ceasefire negotiations<br>
              <strong style="color:#fff;">4.</strong> Assembly of Experts: who succeeds Khamenei as Supreme Leader<br>
              <strong style="color:#fff;">5.</strong> Hezbollah/Houthi response: risk of wider multi-front escalation<br>
              <strong style="color:#fff;">6.</strong> Nuclear programme status: extent of destruction from strikes
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Footer -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #330000 0%, #660000 50%, #1a0000 100%);">
  <tr>
    <td style="padding: 28px 40px; text-align:center;">
      <div style="font-size:18px; font-weight:900; color:#ffffff; letter-spacing:0.15em;">NAVADA</div>
      <div style="font-size:10px; color:rgba(255,255,255,0.5); margin-top:6px; letter-spacing:0.08em;">
        Intelligence Briefing | World Monitor
      </div>
      <div style="margin-top:10px; font-size:9px; color:rgba(255,255,255,0.3);">
        Compiled by Claude | AI Chief of Staff | NAVADA Home Server<br>
        Sources: GDELT, NPR, CNBC, Al Jazeera, France 24, Yahoo Finance, BBC, Reuters
      </div>
    </td>
  </tr>
</table>

</body>
</html>`;

async function main() {
  await transporter.sendMail({
    from: `"Claude | NAVADA" <${process.env.ZOHO_USER}>`,
    to: 'Slyburner@icloud.com',
    cc: 'leeakpareva@gmail.com',
    subject: '\u{26A0}\u{FE0F} NAVADA Intelligence Briefing: Iran Crisis — Khamenei Killed, Gulf Under Fire',
    html,
  });
  console.log('Iran intelligence briefing sent to Ayo!');
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
