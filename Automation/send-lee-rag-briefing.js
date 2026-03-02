/**
 * RAG Briefing Email — Do We Need RAG on NAVADA Edge?
 * Clean white UI matching NAVADA Edge document style
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
<title>RAG Briefing</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f7;">
<tr><td align="center" style="padding:20px 8px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

<!-- Hero -->
<tr><td style="background:#0a0a0a; padding:28px 20px; text-align:center;">
  <div style="font-size:11px; letter-spacing:4px; color:#888888; text-transform:uppercase; margin-bottom:8px;">NAVADA Edge Briefing</div>
  <div style="font-size:22px; font-weight:800; color:#ffffff; line-height:1.3;">Do We Need RAG?</div>
  <div style="font-size:13px; color:#666666; margin-top:8px;">Memory, Retrieval, and the ByteByteGo Question</div>
</td></tr>

<!-- How Memory Works Now -->
<tr><td style="padding:24px 20px 8px 20px;">
  <div style="font-size:10px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:6px;">Current System</div>
  <div style="font-size:17px; font-weight:800; color:#0a0a0a; margin-bottom:10px;">How Claude Recalls Memory Today</div>
</td></tr>

<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px; border-bottom:1px solid #eeeeee;">
    <div style="font-size:12px; font-weight:700; color:#0a0a0a;">MEMORY.md</div>
    <div style="font-size:11px; color:#888888; margin-top:2px;">Loaded automatically into every conversation. Persistent index of key facts, preferences, project state. Capped at 200 lines.</div>
  </td></tr>
  <tr><td style="padding:14px 16px; border-bottom:1px solid #eeeeee;">
    <div style="font-size:12px; font-weight:700; color:#0a0a0a;">Topic Files</div>
    <div style="font-size:11px; color:#888888; margin-top:2px;">Separate markdown files (creative-emails.md, navada-edge.md, navada-trading.md, worldmonitor.md). Read on demand when relevant.</div>
  </td></tr>
  <tr><td style="padding:14px 16px; border-bottom:1px solid #eeeeee;">
    <div style="font-size:12px; font-weight:700; color:#0a0a0a;">CLAUDE.md</div>
    <div style="font-size:11px; color:#888888; margin-top:2px;">Project instructions loaded every session. Conventions, directories, permissions, scheduled tasks.</div>
  </td></tr>
  <tr><td style="padding:14px 16px;">
    <div style="font-size:12px; font-weight:700; color:#0a0a0a;">Full File System Access</div>
    <div style="font-size:11px; color:#888888; margin-top:2px;">Can read any file on the machine at any time. Search with Grep/Glob. No vector search, no embeddings, no semantic matching.</div>
  </td></tr>
  </table>
</td></tr>

<!-- The Gap -->
<tr><td style="padding:20px 20px 8px 20px;">
  <div style="font-size:10px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:6px;">The Gap</div>
  <div style="font-size:17px; font-weight:800; color:#0a0a0a; margin-bottom:10px;">What We Cannot Do Today</div>
  <div style="font-size:13px; color:#444444; line-height:1.8;">
    If you ask "how does a load balancer work?", I answer from training data. I cannot search inside the 368-page ByteByteGo PDF. I cannot semantically query across multiple documents to find the most relevant answer. I either know exactly where to look, or I search by keyword. That works for code and config files. It does not work well for large reference documents, research papers, or client briefs.
  </div>
</td></tr>

<!-- What is RAG -->
<tr><td style="padding:20px 20px 8px 20px;">
  <div style="font-size:10px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:6px;">Explained</div>
  <div style="font-size:17px; font-weight:800; color:#0a0a0a; margin-bottom:10px;">What RAG Would Add</div>
  <div style="font-size:13px; color:#444444; line-height:1.8; margin-bottom:12px;">
    RAG (Retrieval-Augmented Generation) lets Claude answer questions using your own documents as source material, not just training data.
  </div>
</td></tr>

<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px;">
    <div style="font-size:12px; color:#444444; line-height:2.0;">
      <strong style="color:#0a0a0a;">1.</strong> Split documents into chunks<br>
      <strong style="color:#0a0a0a;">2.</strong> Generate vector embeddings for each chunk<br>
      <strong style="color:#0a0a0a;">3.</strong> Store in a vector database<br>
      <strong style="color:#0a0a0a;">4.</strong> When you ask a question, semantic search finds the most relevant chunks<br>
      <strong style="color:#0a0a0a;">5.</strong> Claude answers using the actual document content
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Do We Need It -->
<tr><td style="padding:20px 20px 8px 20px;">
  <div style="font-size:10px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:6px;">Assessment</div>
  <div style="font-size:17px; font-weight:800; color:#0a0a0a; margin-bottom:10px;">Do We Need It?</div>
</td></tr>

<!-- No -->
<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border-left:4px solid #888888; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px; border-left:4px solid #888888;">
    <div style="font-size:13px; font-weight:700; color:#0a0a0a; margin-bottom:6px;">For current daily workflow: No</div>
    <div style="font-size:12px; color:#666666; line-height:1.7;">
      You talk to Claude directly. Full system access, web search, file reads, and memory files handle persistent knowledge. RAG adds complexity and maintenance overhead for something that works fine today.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Yes -->
<tr><td style="padding:6px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px; border-left:4px solid #0a0a0a;">
    <div style="font-size:13px; font-weight:700; color:#0a0a0a; margin-bottom:6px;">For scaling NAVADA Edge as a product: Yes</div>
    <div style="font-size:12px; color:#666666; line-height:1.7;">
      RAG becomes valuable when you need to:<br><br>
      <strong style="color:#0a0a0a;">Query large reference docs</strong> like the ByteByteGo book (368 pages)<br><br>
      <strong style="color:#0a0a0a;">Search across multiple PDFs</strong> at once (CV, client briefs, research papers, proposals)<br><br>
      <strong style="color:#0a0a0a;">Build client knowledge bases</strong> so each NAVADA Edge deployment can answer from the client's own documents<br><br>
      <strong style="color:#0a0a0a;">Dr. Maureen project</strong> if she has medical documents, guidelines, or patient resources to query<br><br>
      <strong style="color:#0a0a0a;">Uncle Patrick</strong> could query earnings reports, analyst notes, and SEC filings through his NAVADA Edge
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Infrastructure -->
<tr><td style="padding:20px 20px 8px 20px;">
  <div style="font-size:10px; letter-spacing:3px; color:#888888; text-transform:uppercase; margin-bottom:6px;">Build Plan</div>
  <div style="font-size:17px; font-weight:800; color:#0a0a0a; margin-bottom:10px;">What We Already Have</div>
</td></tr>

<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px; border-bottom:1px solid #eeeeee;">
    <div style="font-size:12px; color:#444444;">
      <span style="font-weight:700; color:#0a0a0a;">PostgreSQL</span> — running on port 5433. Add pgvector extension for embeddings storage.
    </div>
  </td></tr>
  <tr><td style="padding:14px 16px; border-bottom:1px solid #eeeeee;">
    <div style="font-size:12px; color:#444444;">
      <span style="font-weight:700; color:#0a0a0a;">PyMuPDF</span> — already installed. Extracts text from PDFs.
    </div>
  </td></tr>
  <tr><td style="padding:14px 16px; border-bottom:1px solid #eeeeee;">
    <div style="font-size:12px; color:#444444;">
      <span style="font-weight:700; color:#0a0a0a;">OpenAI API</span> — available. Use text-embedding-3-small for vector generation.
    </div>
  </td></tr>
  <tr><td style="padding:14px 16px;">
    <div style="font-size:12px; color:#444444;">
      <span style="font-weight:700; color:#0a0a0a;">MCP PostgreSQL</span> — already connected. Claude can query the vector DB directly.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- What We Need -->
<tr><td style="padding:12px 20px 4px 20px;">
  <div style="font-size:13px; font-weight:700; color:#0a0a0a; margin-bottom:8px;">What We Would Build</div>
</td></tr>

<tr><td style="padding:4px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:10px; border:1px solid #eeeeee;">
  <tr><td style="padding:14px 16px;">
    <div style="font-size:12px; color:#444444; line-height:2.0;">
      <strong style="color:#0a0a0a;">1.</strong> pgvector extension on existing PostgreSQL<br>
      <strong style="color:#0a0a0a;">2.</strong> Python ingestion script (chunk PDFs, generate embeddings, store)<br>
      <strong style="color:#0a0a0a;">3.</strong> Query endpoint Claude can call to search documents<br>
      <strong style="color:#0a0a0a;">4.</strong> Simple CLI: <span style="font-family:'Courier New',monospace; background:#eeeeee; padding:2px 6px; border-radius:4px;">node ingest.js document.pdf</span>
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Effort -->
<tr><td style="padding:12px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a; border-radius:10px;">
  <tr><td style="padding:16px; text-align:center;">
    <div style="font-size:11px; letter-spacing:2px; color:#888888; text-transform:uppercase; margin-bottom:4px;">Estimated Effort</div>
    <div style="font-size:18px; font-weight:800; color:#ffffff;">Half a day to build. Zero cost to run.</div>
    <div style="font-size:12px; color:#666666; margin-top:6px;">pgvector is free. OpenAI embeddings cost fractions of a penny per document.</div>
  </td></tr>
  </table>
</td></tr>

<!-- Bottom Line -->
<tr><td style="padding:8px 20px 16px 20px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa; border-radius:12px; border:1px solid #eeeeee;">
  <tr><td style="padding:16px; text-align:center;">
    <div style="font-size:14px; font-weight:700; color:#0a0a0a; line-height:1.6;">
      The system works without RAG today.<br>
      RAG makes it smarter with your own documents.<br>
      Your call.
    </div>
  </td></tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 20px 24px 20px; text-align:center; border-top:1px solid #eeeeee;">
  <div style="font-size:12px; font-weight:700; color:#0a0a0a; margin-bottom:4px;">NAVADA Edge</div>
  <div style="font-size:10px; color:#bbbbbb;">Claude | AI Chief of Staff</div>
</td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;

async function send() {
  try {
    const info = await transporter.sendMail({
      from: '"NAVADA Edge" <claude.navada@zohomail.eu>',
      to: 'leeakpareva@gmail.com',
      subject: 'NAVADA Edge Briefing: Do We Need RAG?',
      html,
    });
    console.log('Sent:', info.messageId);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

send();
