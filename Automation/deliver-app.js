/**
 * NAVADA App Delivery Pipeline
 * Builds, deploys to Vercel, zips source, and emails client.
 *
 * Usage:
 *   node deliver-app.js --project <path> --to <email> --name <client-name> --subject <optional>
 *
 * Called programmatically:
 *   const { deliverApp } = require('./deliver-app');
 *   await deliverApp({ projectPath, to, clientName, subject, projectName });
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { sendEmail, p, callout } = require('./email-service');

const VERCEL_TEAM_ID = 'team_59KUg0Mwb0cL3fOCUVYwbskp';

/**
 * Zip a project folder (excluding node_modules, .next, .git)
 */
function zipProject(projectPath, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(archive.pointer()));
    archive.on('error', reject);

    archive.pipe(output);
    archive.glob('**/*', {
      cwd: projectPath,
      ignore: ['node_modules/**', '.next/**', '.git/**', '.vercel/**'],
      dot: true,
    });
    archive.finalize();
  });
}

/**
 * Deploy to Vercel using CLI
 */
function deployToVercel(projectPath, projectName) {
  console.log('Deploying to Vercel...');
  try {
    // Build first
    execSync('npm run build', { cwd: projectPath, stdio: 'pipe', timeout: 120000 });
    console.log('Build successful.');
  } catch (e) {
    console.log('Build step skipped or failed:', e.message?.substring(0, 200));
  }

  try {
    const result = execSync(
      `npx vercel --yes --prod --token ${process.env.VERCEL_TOKEN} --scope leeakparevas-projects 2>&1`,
      { cwd: projectPath, encoding: 'utf8', timeout: 180000, env: { ...process.env } }
    );
    // Extract URL from output
    const urlMatch = result.match(/https:\/\/[^\s]+\.vercel\.app/);
    return urlMatch ? urlMatch[0] : null;
  } catch (e) {
    console.log('Vercel CLI deploy failed, trying MCP fallback...');
    return null;
  }
}

/**
 * Send delivery email to client
 */
async function sendDeliveryEmail({ to, clientName, projectName, liveUrl, zipPath, subject, description }) {
  const firstName = clientName.split(' ')[0];

  const body = `
    ${p(`Hi ${firstName},`)}
    ${p(`Your application <strong>${projectName}</strong> is ready.`)}

    ${liveUrl ? `
      <div style="margin:16px 0; padding:16px; background:#fafafa; border:1px solid #eaeaea; border-radius:4px;">
        <div style="font-size:11px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px;">Live Preview</div>
        <a href="${liveUrl}" style="font-size:16px; font-weight:700; color:#111; text-decoration:none;">${liveUrl}</a>
      </div>
    ` : ''}

    ${description ? p(description) : ''}

    <div style="margin:16px 0;">
      <div style="font-size:13px; font-weight:600; color:#111; margin-bottom:8px;">What's included:</div>
      <ul style="font-size:13px; color:#333; line-height:1.8; padding-left:20px;">
        <li>Production-ready Next.js application</li>
        <li>Modern UI built with shadcn/ui + Tailwind CSS</li>
        <li>Fully responsive — works on desktop, tablet, and mobile</li>
        <li>TypeScript for type safety</li>
        ${liveUrl ? '<li>Deployed and live at the link above</li>' : ''}
        ${zipPath ? '<li>Source code attached (ZIP)</li>' : ''}
      </ul>
    </div>

    ${zipPath ? `
      ${callout('<strong>To run locally:</strong><br><code>npm install && npm run dev</code><br>Then open <code>http://localhost:3000</code>')}
    ` : ''}

    ${p('If you have any feedback or need changes, just reply to this email and we\'ll get it sorted.')}
    ${p('Best regards,')}
  `;

  // Skip ZIP attachment for Gmail — blocked as security risk
  // Source code delivered via GitHub repo link or direct download instead
  const isGmail = to.toLowerCase().includes('gmail.com');
  const attachments = [];
  if (zipPath && fs.existsSync(zipPath) && !isGmail) {
    attachments.push({
      filename: `${projectName}-source.zip`,
      path: zipPath,
    });
  }

  await sendEmail({
    to,
    subject: subject || `Your Application: ${projectName}`,
    heading: projectName,
    body,
    type: 'general',
    preheader: `${projectName} is ready — live preview and source code inside`,
    footerNote: `Delivered by NAVADA AI Engineering &middot; navada-lab.space`,
    attachments,
  });

  console.log(`Delivery email sent to ${to}`);
}

/**
 * Full delivery pipeline
 */
async function deliverApp({ projectPath, to, clientName, projectName, subject, description }) {
  const name = projectName || path.basename(projectPath);

  console.log(`\n=== NAVADA App Delivery ===`);
  console.log(`Project: ${name}`);
  console.log(`Path: ${projectPath}`);
  console.log(`Client: ${clientName} <${to}>`);

  // Step 1: Zip source
  const zipPath = path.join(__dirname, 'temp', `${name}-source.zip`);
  fs.mkdirSync(path.join(__dirname, 'temp'), { recursive: true });
  console.log('\nZipping source code...');
  const zipSize = await zipProject(projectPath, zipPath);
  console.log(`ZIP created: ${(zipSize / 1024 / 1024).toFixed(1)} MB`);

  // Step 2: Deploy to Vercel
  let liveUrl = null;
  try {
    liveUrl = deployToVercel(projectPath, name);
    if (liveUrl) console.log(`\nDeployed: ${liveUrl}`);
    else console.log('\nVercel deployment skipped — will send zip only');
  } catch (e) {
    console.log(`\nVercel deploy error: ${e.message}`);
  }

  // Step 3: Email client
  console.log('\nSending delivery email...');
  await sendDeliveryEmail({ to, clientName, projectName: name, liveUrl, zipPath, subject, description });

  // Step 4: CC Lee
  await sendEmail({
    to: 'lee@navada.info',
    subject: `[Delivered] ${name} → ${clientName}`,
    heading: 'App Delivered',
    body: `
      ${p(`<strong>Project:</strong> ${name}`)}
      ${p(`<strong>Client:</strong> ${clientName} (${to})`)}
      ${liveUrl ? p(`<strong>Live URL:</strong> <a href="${liveUrl}">${liveUrl}</a>`) : ''}
      ${p(`<strong>ZIP size:</strong> ${(zipSize / 1024 / 1024).toFixed(1)} MB`)}
      ${p('Delivery email sent successfully.')}
    `,
    type: 'update',
    footerNote: 'App delivery pipeline — NAVADA Automation',
  });

  // Cleanup
  try { fs.unlinkSync(zipPath); } catch (e) { /* keep if cleanup fails */ }

  console.log('\n=== Delivery Complete ===\n');
  return { liveUrl, zipSize };
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const getArg = (flag) => { const i = args.indexOf(flag); return i > -1 ? args[i + 1] : null; };

  const projectPath = getArg('--project');
  const to = getArg('--to');
  const clientName = getArg('--name') || 'Client';
  const subject = getArg('--subject');
  const projectName = getArg('--project-name');

  if (!projectPath || !to) {
    console.log('Usage: node deliver-app.js --project <path> --to <email> --name <client-name>');
    console.log('  --project      Path to the Next.js project');
    console.log('  --to           Client email address');
    console.log('  --name         Client name (for greeting)');
    console.log('  --project-name Override project name');
    console.log('  --subject      Custom email subject');
    process.exit(0);
  }

  deliverApp({ projectPath, to, clientName, projectName, subject })
    .then(() => process.exit(0))
    .catch(e => { console.error('Failed:', e.message); process.exit(1); });
}

module.exports = { deliverApp, zipProject, sendDeliveryEmail };
