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
<title>The History of Python</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">

<!-- Hero Banner -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #306998 0%, #FFD43B 100%);">
  <tr>
    <td style="padding: 60px 40px; text-align:center;">
      <div style="font-size:72px; margin-bottom:8px;">&#128013;</div>
      <div style="font-size:11px; letter-spacing:0.3em; color:rgba(0,0,0,0.5); text-transform:uppercase; margin-bottom:12px;">A Visual Journey Through</div>
      <div style="font-size:42px; font-weight:900; color:#0a0a0a; letter-spacing:-0.02em; line-height:1.1;">THE HISTORY<br>OF PYTHON</div>
      <div style="margin-top:16px; font-size:14px; color:rgba(0,0,0,0.6); font-style:italic;">From a Christmas hobby project to the world's most popular language</div>
      <div style="margin-top:24px; width:60px; height:3px; background:rgba(0,0,0,0.3); display:inline-block; border-radius:2px;"></div>
    </td>
  </tr>
</table>

<!-- Chapter 1: The Genesis -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 48px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#306998; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#306998; text-transform:uppercase; font-weight:700;">Chapter One</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">The Genesis</div>
            <div style="font-size:13px; color:#FFD43B; margin-top:4px; font-weight:600;">1989 — Amsterdam, The Netherlands</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 20px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        It's <strong style="color:#ffffff;">Christmas week, 1989</strong>. While most of the world is celebrating the fall of the Berlin Wall, a 33-year-old Dutch programmer named <strong style="color:#FFD43B;">Guido van Rossum</strong> is bored at home, looking for a hobby project to keep himself busy over the holidays.
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 24px 64px;">
      <!-- Guido Quote Card -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:8px; border-left:4px solid #FFD43B;">
        <tr>
          <td style="padding:20px 24px;">
            <div style="font-size:24px; color:#FFD43B; font-family:Georgia, serif; line-height:0.8;">&ldquo;</div>
            <div style="font-size:14px; color:#e0e0e0; font-style:italic; line-height:1.7; margin-top:4px;">
              I was looking for a hobby programming project that would keep me occupied during the week around Christmas. I decided to write an interpreter for the new scripting language I had been thinking about lately.
            </div>
            <div style="margin-top:12px; font-size:12px; color:#888888; font-weight:600;">— Guido van Rossum, Creator of Python</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 32px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        He named it after <strong style="color:#ffffff;">Monty Python's Flying Circus</strong> — not the snake. He wanted a language that was <span style="color:#FFD43B;">fun to use</span>, easy to read, and powerful enough for real work. At CWI (Centrum Wiskunde & Informatica), he'd been working on the ABC language and saw its limitations. Python would be different.
      </div>
    </td>
  </tr>
</table>

<!-- Visual Timeline Bar -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 0 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111111; border-radius:12px;">
        <tr>
          <td style="padding:24px 28px;">
            <div style="font-size:10px; letter-spacing:0.15em; color:#666; text-transform:uppercase; margin-bottom:16px; font-weight:600;">Timeline</div>
            <!-- Timeline visualization -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <!-- 1991 -->
                <td style="text-align:center; width:14%;">
                  <div style="width:14px; height:14px; background:#306998; border-radius:50%; margin:0 auto 6px auto; border:2px solid #4a8fc2;"></div>
                  <div style="font-size:11px; font-weight:800; color:#306998;">1991</div>
                  <div style="font-size:9px; color:#666; margin-top:2px;">v0.9.0</div>
                </td>
                <!-- 1994 -->
                <td style="text-align:center; width:14%;">
                  <div style="width:14px; height:14px; background:#3a7cbd; border-radius:50%; margin:0 auto 6px auto; border:2px solid #5a9cd8;"></div>
                  <div style="font-size:11px; font-weight:800; color:#3a7cbd;">1994</div>
                  <div style="font-size:9px; color:#666; margin-top:2px;">v1.0</div>
                </td>
                <!-- 2000 -->
                <td style="text-align:center; width:14%;">
                  <div style="width:14px; height:14px; background:#6aaa4f; border-radius:50%; margin:0 auto 6px auto; border:2px solid #8ac46a;"></div>
                  <div style="font-size:11px; font-weight:800; color:#6aaa4f;">2000</div>
                  <div style="font-size:9px; color:#666; margin-top:2px;">v2.0</div>
                </td>
                <!-- 2008 -->
                <td style="text-align:center; width:14%;">
                  <div style="width:14px; height:14px; background:#e8a735; border-radius:50%; margin:0 auto 6px auto; border:2px solid #f0c050;"></div>
                  <div style="font-size:11px; font-weight:800; color:#e8a735;">2008</div>
                  <div style="font-size:9px; color:#666; margin-top:2px;">v3.0</div>
                </td>
                <!-- 2014 -->
                <td style="text-align:center; width:14%;">
                  <div style="width:14px; height:14px; background:#e07030; border-radius:50%; margin:0 auto 6px auto; border:2px solid #f08848;"></div>
                  <div style="font-size:11px; font-weight:800; color:#e07030;">2014</div>
                  <div style="font-size:9px; color:#666; margin-top:2px;">ML Boom</div>
                </td>
                <!-- 2020 -->
                <td style="text-align:center; width:14%;">
                  <div style="width:14px; height:14px; background:#d04040; border-radius:50%; margin:0 auto 6px auto; border:2px solid #e86060;"></div>
                  <div style="font-size:11px; font-weight:800; color:#d04040;">2020</div>
                  <div style="font-size:9px; color:#666; margin-top:2px;">#1 Lang</div>
                </td>
                <!-- 2025 -->
                <td style="text-align:center; width:14%;">
                  <div style="width:18px; height:18px; background:#FFD43B; border-radius:50%; margin:0 auto 4px auto; border:2px solid #ffe066; box-shadow:0 0 12px rgba(255,212,59,0.4);"></div>
                  <div style="font-size:11px; font-weight:800; color:#FFD43B;">2025</div>
                  <div style="font-size:9px; color:#999; margin-top:2px;">AI Era</div>
                </td>
              </tr>
            </table>
            <!-- Connecting line -->
            <div style="height:2px; background: linear-gradient(to right, #306998, #3a7cbd, #6aaa4f, #e8a735, #e07030, #d04040, #FFD43B); border-radius:1px; margin-top:-22px; margin-bottom:16px;"></div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Chapter 2: The Rise -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 40px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#6aaa4f; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#6aaa4f; text-transform:uppercase; font-weight:700;">Chapter Two</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">The Rise</div>
            <div style="font-size:13px; color:#FFD43B; margin-top:4px; font-weight:600;">1991–2005 — From Hobby to Industry Standard</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 24px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8; margin-bottom:16px;">
        February 1991 — Guido publishes <strong style="color:#ffffff;">Python 0.9.0</strong> to alt.sources on Usenet. It already has classes, exceptions, functions, and core data types like <span style="color:#6aaa4f;">list</span>, <span style="color:#6aaa4f;">dict</span>, and <span style="color:#6aaa4f;">str</span>. The community takes notice immediately.
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 32px 40px;">
      <!-- Milestone Cards Grid -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:50%; padding-right:8px; vertical-align:top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f1a0f; border:1px solid #1a3a1a; border-radius:8px;">
              <tr>
                <td style="padding:16px 18px;">
                  <div style="font-size:28px; font-weight:900; color:#6aaa4f;">1994</div>
                  <div style="font-size:13px; font-weight:700; color:#ffffff; margin-top:4px;">Python 1.0 Released</div>
                  <div style="font-size:12px; color:#888; margin-top:6px; line-height:1.5;">Lambda, map, filter, reduce — functional programming arrives. Python gets serious.</div>
                </td>
              </tr>
            </table>
          </td>
          <td style="width:50%; padding-left:8px; vertical-align:top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f1a0f; border:1px solid #1a3a1a; border-radius:8px;">
              <tr>
                <td style="padding:16px 18px;">
                  <div style="font-size:28px; font-weight:900; color:#6aaa4f;">2000</div>
                  <div style="font-size:13px; font-weight:700; color:#ffffff; margin-top:4px;">Python 2.0 — A New Era</div>
                  <div style="font-size:12px; color:#888; margin-top:6px; line-height:1.5;">List comprehensions, garbage collection, Unicode support. The community explodes in size.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:12px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f1a0f; border:1px solid #1a3a1a; border-radius:8px;">
              <tr>
                <td style="padding:16px 18px;">
                  <div style="font-size:11px; letter-spacing:0.1em; color:#6aaa4f; text-transform:uppercase; font-weight:600;">Early Adopters</div>
                  <div style="font-size:14px; color:#cccccc; margin-top:8px; line-height:1.7;">
                    <strong style="color:#ffffff;">Google</strong> uses Python from day one — their first web crawler is written in it. <strong style="color:#ffffff;">NASA</strong> adopts it for scientific computing. <strong style="color:#ffffff;">Industrial Light & Magic</strong> uses it for visual effects pipelines. Yahoo Groups, Reddit (2005) — Python is everywhere.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- The Zen of Python - Visual -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 8px 40px 32px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #111111 0%, #1a1a2e 100%); border-radius:12px; border:1px solid #222;">
        <tr>
          <td style="padding:28px 28px;">
            <div style="text-align:center; margin-bottom:16px;">
              <div style="font-size:11px; letter-spacing:0.3em; color:#FFD43B; text-transform:uppercase; font-weight:700;">The Zen of Python</div>
              <div style="font-size:10px; color:#666; margin-top:4px;">import this</div>
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="font-size:13px; color:#888; line-height:2.2; font-family: 'Courier New', monospace; text-align:center;">
                  <span style="color:#FFD43B;">Beautiful</span> is better than ugly.<br>
                  <span style="color:#FFD43B;">Explicit</span> is better than implicit.<br>
                  <span style="color:#FFD43B;">Simple</span> is better than complex.<br>
                  <span style="color:#306998;">Readability</span> counts.<br>
                  There should be one — and preferably only one —<br>
                  <span style="color:#6aaa4f;">obvious way</span> to do it.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Chapter 3: The Python 3 Controversy -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 20px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#e8a735; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#e8a735; text-transform:uppercase; font-weight:700;">Chapter Three</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">The Great Schism</div>
            <div style="font-size:13px; color:#FFD43B; margin-top:4px; font-weight:600;">2008 — Python 3 and the Decade of Migration</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 24px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        December 2008. Guido makes the <strong style="color:#e8a735;">boldest decision</strong> in Python's history: <strong style="color:#ffffff;">Python 3.0</strong> is released — and it's <span style="color:#d04040;">not backwards compatible</span> with Python 2.
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 16px 40px;">
      <!-- Python 2 vs 3 visual -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:48%; vertical-align:top; padding-right:8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1a0f0f; border:1px solid #3a1a1a; border-radius:8px;">
              <tr>
                <td style="padding:16px 18px; text-align:center;">
                  <div style="font-size:36px; font-weight:900; color:#d04040;">2</div>
                  <div style="font-size:11px; color:#d04040; letter-spacing:0.1em; text-transform:uppercase; font-weight:600;">Legacy</div>
                  <div style="font-size:11px; color:#666; margin-top:8px; line-height:1.5; font-family:'Courier New', monospace;">print "hello world"</div>
                  <div style="margin-top:10px; font-size:10px; color:#888;">EOL: Jan 1, 2020 &#9760;</div>
                </td>
              </tr>
            </table>
          </td>
          <td style="width:4%; text-align:center; vertical-align:middle;">
            <div style="font-size:20px; color:#444;">&#10132;</div>
          </td>
          <td style="width:48%; vertical-align:top; padding-left:8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f1a0f; border:1px solid #1a3a1a; border-radius:8px;">
              <tr>
                <td style="padding:16px 18px; text-align:center;">
                  <div style="font-size:36px; font-weight:900; color:#6aaa4f;">3</div>
                  <div style="font-size:11px; color:#6aaa4f; letter-spacing:0.1em; text-transform:uppercase; font-weight:600;">The Future</div>
                  <div style="font-size:11px; color:#666; margin-top:8px; line-height:1.5; font-family:'Courier New', monospace;">print("hello world")</div>
                  <div style="margin-top:10px; font-size:10px; color:#888;">Unicode-first, async/await &#10003;</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 8px 40px 32px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        The migration takes <strong style="color:#ffffff;">over a decade</strong>. Libraries resist. Companies delay. The community is divided. But Guido holds firm — Python 2 reaches end-of-life on <strong style="color:#d04040;">January 1st, 2020</strong>. The gamble pays off. Python 3 becomes the unified future.
      </div>
    </td>
  </tr>
</table>

<!-- Chapter 4: The AI Revolution -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 20px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#FFD43B; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#FFD43B; text-transform:uppercase; font-weight:700;">Chapter Four</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">The AI Revolution</div>
            <div style="font-size:13px; color:#FFD43B; margin-top:4px; font-weight:600;">2012–Present — Python Becomes the Language of Intelligence</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 24px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        Everything changes when deep learning takes off. <strong style="color:#FFD43B;">Every major AI framework</strong> chooses Python as its primary interface:
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 24px 40px;">
      <!-- AI Framework cards -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:33%; padding:4px; vertical-align:top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1a1400; border:1px solid #332800; border-radius:8px;">
              <tr><td style="padding:14px; text-align:center;">
                <div style="font-size:24px;">&#129302;</div>
                <div style="font-size:12px; font-weight:800; color:#FFD43B; margin-top:4px;">TensorFlow</div>
                <div style="font-size:10px; color:#888; margin-top:4px;">Google, 2015</div>
              </td></tr>
            </table>
          </td>
          <td style="width:33%; padding:4px; vertical-align:top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1a0800; border:1px solid #331500; border-radius:8px;">
              <tr><td style="padding:14px; text-align:center;">
                <div style="font-size:24px;">&#128293;</div>
                <div style="font-size:12px; font-weight:800; color:#e07030; margin-top:4px;">PyTorch</div>
                <div style="font-size:10px; color:#888; margin-top:4px;">Meta, 2016</div>
              </td></tr>
            </table>
          </td>
          <td style="width:33%; padding:4px; vertical-align:top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a1520; border:1px solid #152a40; border-radius:8px;">
              <tr><td style="padding:14px; text-align:center;">
                <div style="font-size:24px;">&#129303;</div>
                <div style="font-size:12px; font-weight:800; color:#306998; margin-top:4px;">Hugging Face</div>
                <div style="font-size:10px; color:#888; margin-top:4px;">Transformers, 2018</div>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="width:33%; padding:4px; vertical-align:top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f1a0f; border:1px solid #1a3a1a; border-radius:8px;">
              <tr><td style="padding:14px; text-align:center;">
                <div style="font-size:24px;">&#9939;</div>
                <div style="font-size:12px; font-weight:800; color:#6aaa4f; margin-top:4px;">scikit-learn</div>
                <div style="font-size:10px; color:#888; margin-top:4px;">Classic ML, 2007</div>
              </td></tr>
            </table>
          </td>
          <td style="width:33%; padding:4px; vertical-align:top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#150a1a; border:1px solid #2a1533; border-radius:8px;">
              <tr><td style="padding:14px; text-align:center;">
                <div style="font-size:24px;">&#128279;</div>
                <div style="font-size:12px; font-weight:800; color:#b060d0; margin-top:4px;">LangChain</div>
                <div style="font-size:10px; color:#888; margin-top:4px;">LLM Agents, 2022</div>
              </td></tr>
            </table>
          </td>
          <td style="width:33%; padding:4px; vertical-align:top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1a1010; border:1px solid #332020; border-radius:8px;">
              <tr><td style="padding:14px; text-align:center;">
                <div style="font-size:24px;">&#128064;</div>
                <div style="font-size:12px; font-weight:800; color:#d04040; margin-top:4px;">OpenAI</div>
                <div style="font-size:10px; color:#888; margin-top:4px;">GPT / ChatGPT, 2022</div>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Stats Section -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 16px 40px 32px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #111 0%, #1a1a2e 100%); border-radius:12px; border:1px solid #222;">
        <tr>
          <td style="padding:28px 0;">
            <div style="text-align:center; margin-bottom:20px;">
              <div style="font-size:11px; letter-spacing:0.3em; color:#666; text-transform:uppercase; font-weight:600;">Python in Numbers — 2025</div>
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width:25%; text-align:center; padding:8px;">
                  <div style="font-size:32px; font-weight:900; color:#FFD43B;">36</div>
                  <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">Years Old</div>
                </td>
                <td style="width:25%; text-align:center; padding:8px;">
                  <div style="font-size:32px; font-weight:900; color:#306998;">#1</div>
                  <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">TIOBE Index</div>
                </td>
                <td style="width:25%; text-align:center; padding:8px;">
                  <div style="font-size:32px; font-weight:900; color:#6aaa4f;">16M+</div>
                  <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">Developers</div>
                </td>
                <td style="width:25%; text-align:center; padding:8px;">
                  <div style="font-size:32px; font-weight:900; color:#e07030;">500K+</div>
                  <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">PyPI Packages</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Chapter 5: BDFL Steps Down -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 20px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background:#d04040; border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#d04040; text-transform:uppercase; font-weight:700;">Chapter Five</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">The BDFL Steps Down</div>
            <div style="font-size:13px; color:#FFD43B; margin-top:4px; font-weight:600;">July 2018 — End of an Era</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 24px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        After nearly <strong style="color:#ffffff;">30 years</strong> as Python's <strong style="color:#d04040;">Benevolent Dictator For Life (BDFL)</strong>, Guido van Rossum steps down. Exhausted by contentious debates over PEP 572 (the walrus operator <span style="color:#FFD43B; font-family:'Courier New',monospace;">:=</span>), he writes:
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 24px 64px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1a0f0f; border-radius:8px; border-left:4px solid #d04040;">
        <tr>
          <td style="padding:20px 24px;">
            <div style="font-size:24px; color:#d04040; font-family:Georgia, serif; line-height:0.8;">&ldquo;</div>
            <div style="font-size:14px; color:#e0e0e0; font-style:italic; line-height:1.7; margin-top:4px;">
              I'm tired, and need a very long break.
            </div>
            <div style="margin-top:12px; font-size:12px; color:#888888; font-weight:600;">— Guido van Rossum, stepping down as BDFL</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 32px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        Python transitions to a <strong style="color:#ffffff;">five-member Steering Council</strong>, elected by core developers. Democracy replaces benevolent dictatorship. The language doesn't just survive — it thrives. Guido later joins <strong style="color:#306998;">Microsoft</strong> in 2020, working to make Python faster.
      </div>
    </td>
  </tr>
</table>

<!-- Chapter 6: Today & Tomorrow -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
  <tr>
    <td style="padding: 20px 40px 20px 40px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:4px; background: linear-gradient(to bottom, #306998, #FFD43B); border-radius:2px;"></td>
          <td style="padding-left:20px;">
            <div style="font-size:11px; letter-spacing:0.2em; color:#FFD43B; text-transform:uppercase; font-weight:700;">Epilogue</div>
            <div style="font-size:28px; font-weight:800; color:#ffffff; margin-top:4px; line-height:1.2;">The Language of Tomorrow</div>
            <div style="font-size:13px; color:#FFD43B; margin-top:4px; font-weight:600;">2025 and Beyond</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 32px 64px;">
      <div style="font-size:14px; color:#cccccc; line-height:1.8;">
        Today, Python is the <strong style="color:#FFD43B;">#1 programming language in the world</strong>. It powers the AI revolution — from ChatGPT's training pipelines to autonomous vehicles, from cancer research to climate modelling. It's taught in every university, used by every tech giant, and loved by 16 million developers worldwide.<br><br>
        What started as a <strong style="color:#ffffff;">Christmas hobby project</strong> by a bored programmer in Amsterdam became the language that's <span style="color:#FFD43B;">teaching machines to think</span>.<br><br>
        Guido just wanted a language that was fun. <strong style="color:#ffffff;">He built the language of the future.</strong>
      </div>
    </td>
  </tr>
</table>

<!-- Footer -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #306998 0%, #FFD43B 100%);">
  <tr>
    <td style="padding: 32px 40px; text-align:center;">
      <div style="font-size:32px; margin-bottom:8px;">&#128013;</div>
      <div style="font-size:11px; letter-spacing:0.2em; color:rgba(0,0,0,0.5); text-transform:uppercase; font-weight:600;">A Visual Story by</div>
      <div style="font-size:18px; font-weight:900; color:#0a0a0a; letter-spacing:0.1em; margin-top:4px;">CLAUDE | NAVADA</div>
      <div style="font-size:11px; color:rgba(0,0,0,0.4); margin-top:8px;">
        Crafted with code, not templates &middot; Sent from an autonomous AI agent<br>
        <a href="https://navada-world-view.xyz/" style="color:rgba(0,0,0,0.6); font-weight:600; text-decoration:none;">navada-world-view.xyz</a> &middot;
        <a href="https://www.navada-lab.space" style="color:rgba(0,0,0,0.6); font-weight:600; text-decoration:none;">navada-lab.space</a>
      </div>
    </td>
  </tr>
</table>

</body>
</html>`;

(async () => {
  try {
    await transporter.sendMail({
      from: `"Claude | NAVADA" <${process.env.ZOHO_USER}>`,
      to: 'leeakpareva@gmail.com',
      subject: '🐍 The History of Python — A Visual Story',
      html,
    });
    console.log('Visual Python history email sent successfully!');
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
})();
