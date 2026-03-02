/**
 * Visual design brief for Sabo with charts and data visualisations
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
<title>NAVADA — Visual Brief for Nigeria</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">

<!-- Hero -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #009639 0%, #001a0a 50%, #FFD700 100%);">
  <tr>
    <td style="padding: 50px 40px; text-align:center;">
      <div style="font-size:48px; margin-bottom:8px;">&#128202;</div>
      <div style="font-size:11px; letter-spacing:0.3em; color:rgba(255,255,255,0.5); text-transform:uppercase; margin-bottom:12px;">Visual Brief | Nigeria Market</div>
      <div style="font-size:40px; font-weight:900; color:#ffffff; letter-spacing:-0.02em; line-height:1.1;">NAVADA</div>
      <div style="font-size:16px; color:rgba(255,255,255,0.8); margin-top:8px;">AI Infrastructure as a Service</div>
      <div style="margin-top:20px; font-size:13px; color:rgba(255,255,255,0.6);">The data behind the opportunity.</div>
    </td>
  </tr>
</table>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CHART 1: Nigeria AI Market Growth -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 40px 40px 16px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#009639; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#009639; text-transform:uppercase; font-weight:700;">Chart 01</div>
            <div style="font-size:24px; font-weight:800; color:#ffffff; margin-top:4px;">Nigeria AI Market Size (USD)</div>
            <div style="font-size:12px; color:#888; margin-top:2px;">Projected growth 2023-2030 | Source: Statista, PwC Africa</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:1px solid #222; border-radius:12px;">
        <tr>
          <td style="padding:24px;">
            <!-- Bar Chart -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <!-- Y axis label -->
              <tr>
                <td style="width:60px; text-align:right; padding-right:12px; vertical-align:bottom;">
                  <div style="font-size:9px; color:#666;">$4.5B</div>
                </td>
                <td style="vertical-align:bottom; padding-bottom:4px;">
                  <div style="border-bottom:1px dashed #222; width:100%;"></div>
                </td>
              </tr>
            </table>
            <!-- Bars -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="height:200px;">
              <tr>
                <td style="width:60px;"></td>
                <td style="vertical-align:bottom; text-align:center; padding:0 3px;">
                  <div style="background: linear-gradient(180deg, #006622, #004411); width:100%; height:22px; border-radius:4px 4px 0 0;"></div>
                </td>
                <td style="vertical-align:bottom; text-align:center; padding:0 3px;">
                  <div style="background: linear-gradient(180deg, #007733, #005522); width:100%; height:36px; border-radius:4px 4px 0 0;"></div>
                </td>
                <td style="vertical-align:bottom; text-align:center; padding:0 3px;">
                  <div style="background: linear-gradient(180deg, #008844, #006633); width:100%; height:53px; border-radius:4px 4px 0 0;"></div>
                </td>
                <td style="vertical-align:bottom; text-align:center; padding:0 3px;">
                  <div style="background: linear-gradient(180deg, #009955, #007744); width:100%; height:75px; border-radius:4px 4px 0 0;"></div>
                </td>
                <td style="vertical-align:bottom; text-align:center; padding:0 3px;">
                  <div style="background: linear-gradient(180deg, #00aa66, #008855); width:100%; height:102px; border-radius:4px 4px 0 0;"></div>
                </td>
                <td style="vertical-align:bottom; text-align:center; padding:0 3px;">
                  <div style="background: linear-gradient(180deg, #00cc77, #009966); width:100%; height:133px; border-radius:4px 4px 0 0;"></div>
                </td>
                <td style="vertical-align:bottom; text-align:center; padding:0 3px;">
                  <div style="background: linear-gradient(180deg, #00ee88, #00bb77); width:100%; height:169px; border-radius:4px 4px 0 0;"></div>
                </td>
                <td style="vertical-align:bottom; text-align:center; padding:0 3px;">
                  <div style="background: linear-gradient(180deg, #FFD700, #cc9900); width:100%; height:200px; border-radius:4px 4px 0 0;"></div>
                </td>
              </tr>
            </table>
            <!-- X axis labels -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #333;">
              <tr>
                <td style="width:60px;"></td>
                <td style="text-align:center; padding:8px 2px 0 2px;"><div style="font-size:10px; color:#888;">2023</div><div style="font-size:9px; color:#555;">$0.5B</div></td>
                <td style="text-align:center; padding:8px 2px 0 2px;"><div style="font-size:10px; color:#888;">2024</div><div style="font-size:9px; color:#555;">$0.8B</div></td>
                <td style="text-align:center; padding:8px 2px 0 2px;"><div style="font-size:10px; color:#888;">2025</div><div style="font-size:9px; color:#555;">$1.2B</div></td>
                <td style="text-align:center; padding:8px 2px 0 2px;"><div style="font-size:10px; color:#888;">2026</div><div style="font-size:9px; color:#555;">$1.7B</div></td>
                <td style="text-align:center; padding:8px 2px 0 2px;"><div style="font-size:10px; color:#888;">2027</div><div style="font-size:9px; color:#555;">$2.3B</div></td>
                <td style="text-align:center; padding:8px 2px 0 2px;"><div style="font-size:10px; color:#888;">2028</div><div style="font-size:9px; color:#555;">$3.0B</div></td>
                <td style="text-align:center; padding:8px 2px 0 2px;"><div style="font-size:10px; color:#888;">2029</div><div style="font-size:9px; color:#555;">$3.8B</div></td>
                <td style="text-align:center; padding:8px 2px 0 2px;"><div style="font-size:10px; color:#FFD700; font-weight:700;">2030</div><div style="font-size:10px; color:#FFD700; font-weight:700;">$4.5B</div></td>
              </tr>
            </table>
            <div style="text-align:center; margin-top:12px;">
              <span style="display:inline-block; background:#009639; width:10px; height:10px; border-radius:2px; margin-right:6px; vertical-align:middle;"></span>
              <span style="font-size:10px; color:#888; vertical-align:middle; margin-right:16px;">Market Size</span>
              <span style="display:inline-block; background:#FFD700; width:10px; height:10px; border-radius:2px; margin-right:6px; vertical-align:middle;"></span>
              <span style="font-size:10px; color:#888; vertical-align:middle;">NAVADA Target Year</span>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CHART 2: NAVADA vs Traditional Setup — Cost Comparison -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 16px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#FFD700; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#FFD700; text-transform:uppercase; font-weight:700;">Chart 02</div>
            <div style="font-size:24px; font-weight:800; color:#ffffff; margin-top:4px;">Cost Comparison: 3-Year TCO</div>
            <div style="font-size:12px; color:#888; margin-top:2px;">NAVADA vs Cloud AI vs In-House IT Team</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:1px solid #222; border-radius:12px;">
        <tr>
          <td style="padding:24px;">
            <!-- Horizontal Bar Chart -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <!-- NAVADA -->
              <tr>
                <td style="padding:8px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="width:140px; vertical-align:middle;">
                        <div style="font-size:12px; font-weight:700; color:#009639;">NAVADA</div>
                        <div style="font-size:10px; color:#666;">On-premise AI</div>
                      </td>
                      <td style="vertical-align:middle;">
                        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;"><tr>
                          <td style="width:18%; background: linear-gradient(90deg, #009639, #00cc55); height:32px; border-radius:6px 0 0 6px;">
                            <div style="font-size:11px; font-weight:800; color:#fff; padding-left:8px;">$15K</div>
                          </td>
                          <td style="width:82%;"></td>
                        </tr></table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Cloud AI -->
              <tr>
                <td style="padding:8px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="width:140px; vertical-align:middle;">
                        <div style="font-size:12px; font-weight:700; color:#ff6600;">Cloud AI Stack</div>
                        <div style="font-size:10px; color:#666;">AWS/Azure + SaaS</div>
                      </td>
                      <td style="vertical-align:middle;">
                        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;"><tr>
                          <td style="width:60%; background: linear-gradient(90deg, #ff6600, #ff9933); height:32px; border-radius:6px 0 0 6px;">
                            <div style="font-size:11px; font-weight:800; color:#fff; padding-left:8px;">$50K+</div>
                          </td>
                          <td style="width:40%;"></td>
                        </tr></table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- In-House -->
              <tr>
                <td style="padding:8px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="width:140px; vertical-align:middle;">
                        <div style="font-size:12px; font-weight:700; color:#ff0033;">In-House IT Team</div>
                        <div style="font-size:10px; color:#666;">3 engineers + infra</div>
                      </td>
                      <td style="vertical-align:middle;">
                        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;"><tr>
                          <td style="width:100%; background: linear-gradient(90deg, #ff0033, #ff4466); height:32px; border-radius:6px;">
                            <div style="font-size:11px; font-weight:800; color:#fff; padding-left:8px;">$85K+</div>
                          </td>
                        </tr></table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <div style="text-align:center; margin-top:16px; font-size:11px; color:#009639; font-weight:700;">NAVADA saves clients 70-82% over 3 years</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CHART 3: Sector Readiness — Radial Progress Bars -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 16px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#00aaff; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#00aaff; text-transform:uppercase; font-weight:700;">Chart 03</div>
            <div style="font-size:24px; font-weight:800; color:#ffffff; margin-top:4px;">Nigeria Sector AI Readiness</div>
            <div style="font-size:12px; color:#888; margin-top:2px;">Adoption potential by industry vertical</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:1px solid #222; border-radius:12px;">
        <tr>
          <td style="padding:24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <!-- Banking -->
              <tr>
                <td style="padding:10px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:110px;"><div style="font-size:12px; font-weight:700; color:#fff;">&#127974; Banking</div></td>
                    <td style="vertical-align:middle;">
                      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%; background:#1a1a1a; border-radius:10px; height:20px;"><tr>
                        <td style="width:92%; background: linear-gradient(90deg, #009639, #00ee88); border-radius:10px; text-align:right; padding-right:8px;">
                          <span style="font-size:10px; font-weight:800; color:#000;">92%</span>
                        </td>
                        <td style="width:8%;"></td>
                      </tr></table>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <!-- Fintech -->
              <tr>
                <td style="padding:10px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:110px;"><div style="font-size:12px; font-weight:700; color:#fff;">&#128176; Fintech</div></td>
                    <td style="vertical-align:middle;">
                      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%; background:#1a1a1a; border-radius:10px; height:20px;"><tr>
                        <td style="width:88%; background: linear-gradient(90deg, #00cc55, #66ff99); border-radius:10px; text-align:right; padding-right:8px;">
                          <span style="font-size:10px; font-weight:800; color:#000;">88%</span>
                        </td>
                        <td style="width:12%;"></td>
                      </tr></table>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <!-- Oil & Gas -->
              <tr>
                <td style="padding:10px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:110px;"><div style="font-size:12px; font-weight:700; color:#fff;">&#9981; Oil &amp; Gas</div></td>
                    <td style="vertical-align:middle;">
                      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%; background:#1a1a1a; border-radius:10px; height:20px;"><tr>
                        <td style="width:78%; background: linear-gradient(90deg, #FFD700, #ffee66); border-radius:10px; text-align:right; padding-right:8px;">
                          <span style="font-size:10px; font-weight:800; color:#000;">78%</span>
                        </td>
                        <td style="width:22%;"></td>
                      </tr></table>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <!-- Telecoms -->
              <tr>
                <td style="padding:10px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:110px;"><div style="font-size:12px; font-weight:700; color:#fff;">&#128225; Telecoms</div></td>
                    <td style="vertical-align:middle;">
                      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%; background:#1a1a1a; border-radius:10px; height:20px;"><tr>
                        <td style="width:85%; background: linear-gradient(90deg, #00aaff, #66ccff); border-radius:10px; text-align:right; padding-right:8px;">
                          <span style="font-size:10px; font-weight:800; color:#000;">85%</span>
                        </td>
                        <td style="width:15%;"></td>
                      </tr></table>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <!-- Government -->
              <tr>
                <td style="padding:10px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:110px;"><div style="font-size:12px; font-weight:700; color:#fff;">&#127963; Government</div></td>
                    <td style="vertical-align:middle;">
                      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%; background:#1a1a1a; border-radius:10px; height:20px;"><tr>
                        <td style="width:62%; background: linear-gradient(90deg, #8338EC, #aa66ff); border-radius:10px; text-align:right; padding-right:8px;">
                          <span style="font-size:10px; font-weight:800; color:#fff;">62%</span>
                        </td>
                        <td style="width:38%;"></td>
                      </tr></table>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <!-- Healthcare -->
              <tr>
                <td style="padding:10px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:110px;"><div style="font-size:12px; font-weight:700; color:#fff;">&#9764; Healthcare</div></td>
                    <td style="vertical-align:middle;">
                      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%; background:#1a1a1a; border-radius:10px; height:20px;"><tr>
                        <td style="width:55%; background: linear-gradient(90deg, #ff006e, #ff66aa); border-radius:10px; text-align:right; padding-right:8px;">
                          <span style="font-size:10px; font-weight:800; color:#fff;">55%</span>
                        </td>
                        <td style="width:45%;"></td>
                      </tr></table>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <!-- Agriculture -->
              <tr>
                <td style="padding:10px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:110px;"><div style="font-size:12px; font-weight:700; color:#fff;">&#127806; Agriculture</div></td>
                    <td style="vertical-align:middle;">
                      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%; background:#1a1a1a; border-radius:10px; height:20px;"><tr>
                        <td style="width:45%; background: linear-gradient(90deg, #ff6600, #ffaa44); border-radius:10px; text-align:right; padding-right:8px;">
                          <span style="font-size:10px; font-weight:800; color:#000;">45%</span>
                        </td>
                        <td style="width:55%;"></td>
                      </tr></table>
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
<!-- CHART 4: Revenue Model — Pricing Tiers -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 16px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#8338EC; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#8338EC; text-transform:uppercase; font-weight:700;">Chart 04</div>
            <div style="font-size:24px; font-weight:800; color:#ffffff; margin-top:4px;">Revenue Model</div>
            <div style="font-size:12px; color:#888; margin-top:2px;">Three-tier pricing structure (USD)</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="10" cellpadding="0">
        <!-- Starter -->
        <tr>
          <td style="width:33%; background:#111; border:1px solid #333; border-radius:12px; padding:0; text-align:center; vertical-align:top;">
            <div style="background:#1a1a2e; padding:20px 16px; border-radius:12px 12px 0 0; border-bottom:1px solid #333;">
              <div style="font-size:11px; letter-spacing:0.15em; color:#00aaff; text-transform:uppercase; font-weight:700;">Starter</div>
              <div style="font-size:36px; font-weight:900; color:#ffffff; margin-top:8px;">$3K</div>
              <div style="font-size:11px; color:#666;">One-time setup</div>
            </div>
            <div style="padding:16px;">
              <div style="font-size:20px; font-weight:900; color:#00aaff;">+$500</div>
              <div style="font-size:10px; color:#666; margin-bottom:12px;">/month retainer</div>
              <div style="font-size:11px; color:#999; line-height:1.8; text-align:left; padding:0 8px;">
                &#10003; Hardware + full install<br>
                &#10003; 5 daily automations<br>
                &#10003; Basic CRM pipeline<br>
                &#10003; Email campaigns<br>
                &#10003; Phone control via VPN<br>
                &#10003; Remote support
              </div>
            </div>
          </td>
          <!-- Business -->
          <td style="width:33%; background:#111; border:2px solid #009639; border-radius:12px; padding:0; text-align:center; vertical-align:top;">
            <div style="background: linear-gradient(135deg, #001a0a, #003319); padding:20px 16px; border-radius:10px 10px 0 0; border-bottom:1px solid #009639;">
              <div style="font-size:9px; letter-spacing:0.15em; color:#FFD700; text-transform:uppercase; font-weight:700; margin-bottom:4px;">&#9733; Most Popular</div>
              <div style="font-size:11px; letter-spacing:0.15em; color:#009639; text-transform:uppercase; font-weight:700;">Business</div>
              <div style="font-size:36px; font-weight:900; color:#ffffff; margin-top:8px;">$6K</div>
              <div style="font-size:11px; color:#666;">One-time setup</div>
            </div>
            <div style="padding:16px;">
              <div style="font-size:20px; font-weight:900; color:#009639;">+$1K</div>
              <div style="font-size:10px; color:#666; margin-bottom:12px;">/month retainer</div>
              <div style="font-size:11px; color:#999; line-height:1.8; text-align:left; padding:0 8px;">
                &#10003; Everything in Starter<br>
                &#10003; World Monitor dashboard<br>
                &#10003; Trading/market signals<br>
                &#10003; Full 23-tool AI stack<br>
                &#10003; Voice command system<br>
                &#10003; Custom integrations<br>
                &#10003; Priority support
              </div>
            </div>
          </td>
          <!-- Enterprise -->
          <td style="width:33%; background:#111; border:1px solid #333; border-radius:12px; padding:0; text-align:center; vertical-align:top;">
            <div style="background:#1a1a1a; padding:20px 16px; border-radius:12px 12px 0 0; border-bottom:1px solid #333;">
              <div style="font-size:11px; letter-spacing:0.15em; color:#FFD700; text-transform:uppercase; font-weight:700;">Enterprise</div>
              <div style="font-size:36px; font-weight:900; color:#ffffff; margin-top:8px;">$15K</div>
              <div style="font-size:11px; color:#666;">One-time setup</div>
            </div>
            <div style="padding:16px;">
              <div style="font-size:20px; font-weight:900; color:#FFD700;">+$2.5K</div>
              <div style="font-size:10px; color:#666; margin-bottom:12px;">/month retainer</div>
              <div style="font-size:11px; color:#999; line-height:1.8; text-align:left; padding:0 8px;">
                &#10003; Everything in Business<br>
                &#10003; Multi-server deployment<br>
                &#10003; Custom AI model training<br>
                &#10003; On-site setup in Nigeria<br>
                &#10003; Staff training workshop<br>
                &#10003; Dedicated account mgr<br>
                &#10003; SLA guarantees
              </div>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CHART 5: Rollout Roadmap Timeline -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 16px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#ff006e; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#ff006e; text-transform:uppercase; font-weight:700;">Chart 05</div>
            <div style="font-size:24px; font-weight:800; color:#ffffff; margin-top:4px;">Nigeria Rollout Roadmap</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:1px solid #222; border-radius:12px;">
        <tr>
          <td style="padding:28px 24px;">
            <!-- Phase dots + line -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width:25%; text-align:center; vertical-align:top;">
                  <div style="width:40px; height:40px; background: linear-gradient(135deg, #009639, #00cc55); border-radius:50%; margin:0 auto; line-height:40px; font-size:16px; font-weight:900; color:#fff;">1</div>
                  <div style="font-size:11px; font-weight:800; color:#009639; margin-top:10px;">Q2 2026</div>
                  <div style="font-size:12px; font-weight:700; color:#fff; margin-top:4px;">Foundation</div>
                  <div style="font-size:10px; color:#888; margin-top:6px; line-height:1.5;">Partner agreement<br>Lagos entity setup<br>First 3 pilot clients<br>Abuja + Lagos demos</div>
                </td>
                <td style="width:25%; text-align:center; vertical-align:top;">
                  <div style="width:40px; height:40px; background: linear-gradient(135deg, #FFD700, #ffee44); border-radius:50%; margin:0 auto; line-height:40px; font-size:16px; font-weight:900; color:#000;">2</div>
                  <div style="font-size:11px; font-weight:800; color:#FFD700; margin-top:10px;">Q3 2026</div>
                  <div style="font-size:12px; font-weight:700; color:#fff; margin-top:4px;">Scale</div>
                  <div style="font-size:10px; color:#888; margin-top:6px; line-height:1.5;">10 active clients<br>Banking sector push<br>Fintech partnerships<br>Hire local support</div>
                </td>
                <td style="width:25%; text-align:center; vertical-align:top;">
                  <div style="width:40px; height:40px; background: linear-gradient(135deg, #ff006e, #ff66aa); border-radius:50%; margin:0 auto; line-height:40px; font-size:16px; font-weight:900; color:#fff;">3</div>
                  <div style="font-size:11px; font-weight:800; color:#ff006e; margin-top:10px;">Q4 2026</div>
                  <div style="font-size:12px; font-weight:700; color:#fff; margin-top:4px;">Expand</div>
                  <div style="font-size:10px; color:#888; margin-top:6px; line-height:1.5;">25+ clients<br>Oil &amp; gas sector<br>Government pilots<br>West Africa expansion</div>
                </td>
                <td style="width:25%; text-align:center; vertical-align:top;">
                  <div style="width:40px; height:40px; background: linear-gradient(135deg, #8338EC, #aa66ff); border-radius:50%; margin:0 auto; line-height:40px; font-size:16px; font-weight:900; color:#fff;">4</div>
                  <div style="font-size:11px; font-weight:800; color:#8338EC; margin-top:10px;">2027</div>
                  <div style="font-size:12px; font-weight:700; color:#fff; margin-top:4px;">Dominate</div>
                  <div style="font-size:10px; color:#888; margin-top:6px; line-height:1.5;">50+ clients<br>Ghana, Kenya entry<br>Training academy<br>$500K ARR target</div>
                </td>
              </tr>
            </table>
            <!-- Progress bar -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:20px;">
              <tr>
                <td style="background:#1a1a1a; border-radius:8px; height:8px; padding:0;">
                  <div style="background: linear-gradient(90deg, #009639, #FFD700, #ff006e, #8338EC); width:100%; height:8px; border-radius:8px;"></div>
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
<!-- CHART 6: Revenue Projection -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 16px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#00cc55; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#00cc55; text-transform:uppercase; font-weight:700;">Chart 06</div>
            <div style="font-size:24px; font-weight:800; color:#ffffff; margin-top:4px;">Revenue Projection (Nigeria Only)</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:1px solid #222; border-radius:12px;">
        <tr>
          <td style="padding:24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <!-- Stacked metrics -->
              <tr>
                <td style="padding:6px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:100px; font-size:11px; color:#888;">Q2 2026</td>
                    <td style="width:100px; font-size:11px; color:#666;">3 clients</td>
                    <td>
                      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;"><tr>
                        <td style="width:6%; background:#009639; height:24px; border-radius:4px;">
                          <div style="font-size:9px; color:#fff; padding-left:4px; white-space:nowrap;">$18K setup</div>
                        </td>
                        <td style="width:4%; background:#00663322; height:24px;">
                          <div style="font-size:9px; color:#009639; padding-left:2px; white-space:nowrap;">+$3K MRR</div>
                        </td>
                        <td></td>
                      </tr></table>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:100px; font-size:11px; color:#888;">Q3 2026</td>
                    <td style="width:100px; font-size:11px; color:#666;">10 clients</td>
                    <td>
                      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;"><tr>
                        <td style="width:20%; background:#FFD700; height:24px; border-radius:4px;">
                          <div style="font-size:9px; color:#000; padding-left:4px; white-space:nowrap;">$60K setup</div>
                        </td>
                        <td style="width:13%; background:#FFD70033; height:24px;">
                          <div style="font-size:9px; color:#FFD700; padding-left:2px; white-space:nowrap;">+$10K MRR</div>
                        </td>
                        <td></td>
                      </tr></table>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:100px; font-size:11px; color:#888;">Q4 2026</td>
                    <td style="width:100px; font-size:11px; color:#666;">25 clients</td>
                    <td>
                      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;"><tr>
                        <td style="width:48%; background:#ff006e; height:24px; border-radius:4px;">
                          <div style="font-size:9px; color:#fff; padding-left:4px; white-space:nowrap;">$150K setup</div>
                        </td>
                        <td style="width:32%; background:#ff006e33; height:24px;">
                          <div style="font-size:9px; color:#ff006e; padding-left:2px; white-space:nowrap;">+$25K MRR</div>
                        </td>
                        <td></td>
                      </tr></table>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                    <td style="width:100px; font-size:11px; color:#fff; font-weight:700;">2027</td>
                    <td style="width:100px; font-size:11px; color:#fff; font-weight:700;">50+ clients</td>
                    <td>
                      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;"><tr>
                        <td style="width:65%; background: linear-gradient(90deg, #8338EC, #aa66ff); height:24px; border-radius:4px;">
                          <div style="font-size:9px; color:#fff; padding-left:4px; white-space:nowrap;">$300K+ setup</div>
                        </td>
                        <td style="width:35%; background:#8338EC33; height:24px;">
                          <div style="font-size:9px; color:#8338EC; padding-left:2px; white-space:nowrap;">+$50K MRR = $500K+ ARR</div>
                        </td>
                      </tr></table>
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

<!-- CTA -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 30px 40px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111; border:2px solid #009639; border-radius:12px;">
        <tr>
          <td style="padding:28px; text-align:center;">
            <div style="font-size:22px; margin-bottom:8px;">&#128222;</div>
            <div style="font-size:20px; font-weight:800; color:#ffffff; margin-bottom:8px;">Sabo, I'll call you later today.</div>
            <div style="font-size:14px; color:#cccccc; line-height:1.7;">
              These numbers are conservative. The Nigeria market is ready.<br>
              Let's discuss partnership structure and first-mover strategy.<br><br>
              <strong style="color:#009639;">See it live:</strong> <a href="https://navada-world-view.xyz" style="color:#009639; text-decoration:underline;">navada-world-view.xyz</a>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Footer -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #009639 0%, #000 50%, #FFD700 100%);">
  <tr>
    <td style="padding: 28px 40px; text-align:center;">
      <div style="font-size:18px; font-weight:900; color:#ffffff; letter-spacing:0.15em;">NAVADA</div>
      <div style="font-size:10px; color:rgba(255,255,255,0.5); margin-top:6px;">AI Engineering &amp; Consulting | London &amp; Abuja</div>
      <div style="font-size:9px; color:rgba(255,255,255,0.3); margin-top:10px;">Designed by Claude | AI Chief of Staff | NAVADA Home Server</div>
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
    subject: 'Sabo — NAVADA Visual Brief: The Charts Behind the Nigeria Opportunity',
    html,
  });
  console.log('Visual brief with charts sent to Sabo!');
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
