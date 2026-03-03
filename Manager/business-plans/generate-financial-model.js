#!/usr/bin/env node
/**
 * NAVADA Edge Financial Model Generator v2
 * Three-tier model:
 *   Tier 1: Hosted SaaS (£300/mo)
 *   Tier 2: Self-Hosted Edge Network (£1K one-off)
 *   Tier 3: Edge Franchise (£5K one-off + 5-day training)
 * Includes: churn modelling, SLA sheet, infrastructure capex
 * Managed by Claude (Chief of Staff) + Lee Akpareva (Founder)
 */

const ExcelJS = require('exceljs');
const path = require('path');

const OUTPUT = path.join(__dirname, 'NAVADA-EDGE-FINANCIAL-MODEL.xlsx');

// ── Colour palette ──
const WHITE = { argb: 'FFFFFFFF' };
const NAVY = { argb: 'FF1B2A4A' };
const BLUE = { argb: 'FF2563EB' };
const LIGHT_BLUE = { argb: 'FFDBEAFE' };
const LIGHT_GREY = { argb: 'FFF8F9FA' };
const GREY_BORDER = { argb: 'FFE5E7EB' };
const GREEN = { argb: 'FF059669' };
const RED = { argb: 'FFDC2626' };
const AMBER = { argb: 'FFD97706' };
const PURPLE = { argb: 'FF7C3AED' };

const thinBorder = {
  top: { style: 'thin', color: GREY_BORDER },
  bottom: { style: 'thin', color: GREY_BORDER },
  left: { style: 'thin', color: GREY_BORDER },
  right: { style: 'thin', color: GREY_BORDER },
};

const headerFont = { name: 'Calibri', size: 11, bold: true, color: WHITE };
const titleFont = { name: 'Calibri', size: 14, bold: true, color: NAVY };
const sectionFont = { name: 'Calibri', size: 12, bold: true, color: NAVY };
const dataFont = { name: 'Calibri', size: 10 };
const currencyFmt = '£#,##0';
const percentFmt = '0%';
const percent1Fmt = '0.0%';
const numberFmt = '#,##0';

// ── Pricing constants ──
const HOSTED_SETUP = 2000;
const HOSTED_MONTHLY = 300;
const SELF_HOSTED_SETUP = 1000;
const SUPPORT_RATE = 50;
const FRANCHISE_PRICE = 5000;
const API_COST_PER_CLIENT = 20;
const HOSTED_CHURN_RATE = 0.05; // 5% monthly churn for hosted
const SELF_HOSTED_SUPPORT_ATTRITION = 0.15; // 15% per quarter support attrition
const FIXED_OPEX_MONTHLY = 80; // updated: £12 electricity + rest
const INFRA_CAPEX = 3000; // Edge infrastructure upgrade (dedicated server hardware)
const ELECTRICITY_MONTHLY = 12;

function styleHeaderRow(row, cols) {
  for (let c = 1; c <= cols; c++) {
    const cell = row.getCell(c);
    cell.font = headerFont;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: NAVY };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  }
  row.height = 30;
}

function styleDataRow(row, cols, isAlt) {
  for (let c = 1; c <= cols; c++) {
    const cell = row.getCell(c);
    cell.font = dataFont;
    cell.border = thinBorder;
    if (isAlt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: LIGHT_GREY };
  }
}

function addSectionTitle(ws, row, text, cols) {
  const r = ws.getRow(row);
  r.getCell(1).value = text;
  r.getCell(1).font = sectionFont;
  ws.mergeCells(row, 1, row, cols);
  r.height = 24;
  return row + 1;
}

function addNote(ws, row, text, cols) {
  const r = ws.getRow(row);
  r.getCell(1).value = text;
  r.getCell(1).font = { ...dataFont, italic: true, color: { argb: 'FF888888' } };
  r.getCell(1).alignment = { wrapText: true };
  ws.mergeCells(row, 1, row, cols);
  r.height = 32;
  return row + 1;
}

async function build() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Claude | NAVADA Chief of Staff';
  wb.created = new Date();

  // ════════════════════════════════════════════════════════════
  // SHEET 1: EXECUTIVE SUMMARY
  // ════════════════════════════════════════════════════════════
  const ws1 = wb.addWorksheet('Executive Summary', { properties: { tabColor: { argb: '1B2A4A' } } });
  ws1.columns = [{ width: 32 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }];

  let r = 1;
  ws1.getRow(r).getCell(1).value = 'NAVADA EDGE';
  ws1.getRow(r).getCell(1).font = { name: 'Calibri', size: 22, bold: true, color: NAVY };
  ws1.mergeCells(r, 1, r, 6); r++;
  ws1.getRow(r).getCell(1).value = 'Business Operating Model & Financial Forecast v2 | FINAL PRICING';
  ws1.getRow(r).getCell(1).font = { name: 'Calibri', size: 14, color: BLUE };
  ws1.mergeCells(r, 1, r, 6); r++;
  ws1.getRow(r).getCell(1).value = 'Prepared by Claude (AI Chief of Staff) for Lee Akpareva (Founder) | March 2026';
  ws1.getRow(r).getCell(1).font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF888888' } };
  ws1.mergeCells(r, 1, r, 6); r += 2;

  // Business overview
  r = addSectionTitle(ws1, r, 'BUSINESS OVERVIEW', 6);
  const overview = [
    ['Company', 'NAVADA'],
    ['Founder', 'Lee Akpareva (Principal AI Consultant, Developer)'],
    ['AI Chief of Staff', 'Claude (Anthropic Opus 4 / Sonnet 4)'],
    ['Product', 'NAVADA Edge: Managed AI Agent Service + Self-Hosted Edge Network + Edge Franchise'],
    ['Market', 'Executives, founders, SMEs, agencies, consultants needing 24/7 AI agents'],
    ['Geography', 'UK (primary) + Nigeria (INVADE) + Global Remote'],
    ['Competitive Moat', 'On-prem AI with full system access, custom agents, 60-second onboarding, proprietary learning methodology'],
    ['Opex Model', 'Near-zero: Lee (developer) + Claude (AI) = the entire delivery team'],
    ['Payments', 'Stripe (checkout, subscriptions, invoices, payment links)'],
  ];
  for (const [k, v] of overview) {
    const row = ws1.getRow(r);
    row.getCell(1).value = k; row.getCell(1).font = { ...dataFont, bold: true };
    row.getCell(2).value = v; row.getCell(2).font = dataFont;
    ws1.mergeCells(r, 2, r, 6);
    styleDataRow(row, 6, false);
    r++;
  }
  r += 2;

  // ── NAVADA Learning Methodology ──
  r = addSectionTitle(ws1, r, 'NAVADA LEARNING METHODOLOGY', 6);
  r = addNote(ws1, r, 'NAVADA Edge is not just software. It is a production-proven system built and refined over months by Lee Akpareva and Claude working together daily. Every automation, integration, agent pattern, and operational workflow has been battle-tested on a live home server running 18+ scheduled tasks, 8+ PM2 services, and 23 MCP integrations.', 6);
  r = addNote(ws1, r, 'CLIENT BENEFIT: Clients receive a system that already works, not a prototype. The architecture, CLAUDE.md conventions, Telegram bot framework, email automation, and deployment pipeline are all proven in production. This eliminates months of trial-and-error.', 6);
  r = addNote(ws1, r, 'FRANCHISE BENEFIT (Tier 3): Buyers get the entire playbook, not just software. The 5-day face-to-face training transfers the full E2E process: architecture design, Claude setup, Telegram bot configuration, MCP server integration, client onboarding, pricing strategy, Stripe setup, and support workflow. This is NAVADA\'s proprietary knowledge, distilled from real-world operation.', 6);
  r += 1;

  // ── Pricing structure ──
  r = addSectionTitle(ws1, r, 'FINAL PRICING STRUCTURE', 6);
  const p1Header = ws1.getRow(r);
  p1Header.values = ['', 'Tier 1: Hosted on NAVADA (SaaS)', '', '', 'Tier 2: Self-Hosted Edge Network', ''];
  styleHeaderRow(p1Header, 6); r++;

  const pricingRows = [
    ['Setup Fee', '£2,000', '(agent build, skills, brand tuning, onboarding, docs)', '£1,000', '(Edge setup, deployment & consulting)', ''],
    ['Monthly Fee', '£300/mo', '(hosting, management, maintenance by NAVADA)', '£0', '(client covers own Anthropic API subscription)', ''],
    ['Support', 'Included', '(part of the SaaS subscription)', '£50/hr', '(2hr minimum booking, £50 non-refundable deposit)', ''],
    ['Turnaround', '2 days', '', '2 days', '', ''],
    ['Cancellation', 'Anytime', '(7-day grace on missed payment, then disconnected)', 'N/A', '(client owns their setup)', ''],
    ['Payments', 'Stripe', '(checkout + recurring subscription)', 'Stripe', '(invoice + payment links for support)', ''],
  ];
  pricingRows.forEach((d, i) => {
    const row = ws1.getRow(r + i);
    row.getCell(1).value = d[0]; row.getCell(1).font = { ...dataFont, bold: true };
    row.getCell(2).value = d[1]; row.getCell(2).font = { ...dataFont, bold: true, color: BLUE };
    row.getCell(3).value = d[2]; row.getCell(3).font = { ...dataFont, color: { argb: 'FF888888' } };
    row.getCell(4).value = d[3]; row.getCell(4).font = { ...dataFont, bold: true, color: GREEN };
    row.getCell(5).value = d[4]; row.getCell(5).font = { ...dataFont, color: { argb: 'FF888888' } };
    styleDataRow(row, 6, i % 2 === 1);
  });
  r += pricingRows.length + 1;

  // Tier 3 Franchise
  r = addSectionTitle(ws1, r, 'TIER 3: EDGE FRANCHISE PACKAGE', 6);
  const franchiseRows = [
    ['Price', '£5,000 one-off', '', '', '', ''],
    ['Includes', 'Full NAVADA Edge architecture, all assets & materials, financial model template, deployment scripts, CLAUDE.md templates, client management tools', '', '', '', ''],
    ['Training', '5-day face-to-face with Lee (E2E process: architecture design, Claude setup, Telegram bot, MCP servers, client onboarding, pricing, Stripe, support workflow)', '', '', '', ''],
    ['Target', 'Developers, consultants, agencies who want to run their own NAVADA Edge managed service for their own clients', '', '', '', ''],
    ['Margin', '~95%+ (Lee\'s time is the only cost: 5 days)', '', '', '', ''],
    ['Support', 'Post-training email support for 30 days. Additional consulting at £75/hr.', '', '', '', ''],
  ];
  franchiseRows.forEach((d, i) => {
    const row = ws1.getRow(r + i);
    row.getCell(1).value = d[0]; row.getCell(1).font = { ...dataFont, bold: true };
    row.getCell(2).value = d[1]; row.getCell(2).font = { ...dataFont, bold: true, color: PURPLE };
    ws1.mergeCells(r + i, 2, r + i, 6);
    styleDataRow(row, 6, i % 2 === 1);
  });
  r += franchiseRows.length + 1;

  // Value prop
  r = addSectionTitle(ws1, r, 'CLIENT VALUE PROPOSITION', 6);
  r = addNote(ws1, r, 'Hosted (SaaS): "Want us to handle everything? £300/mo." Zero hassle, support included, agent managed 24/7 by NAVADA.', 6);
  r = addNote(ws1, r, 'Self-Hosted: "Want to own it? £1,000 one-off." Full independence, NAVADA helps when needed at £50/hr.', 6);
  r = addNote(ws1, r, 'Edge Franchise: "Want to run your own AI managed service? £5,000." Get the full playbook, 5 days of training, and launch your own business.', 6);
  r = addNote(ws1, r, 'Most clients will choose hosted. Easier sell, better recurring revenue. Self-hosted adds upfront cash flow. Franchise is high-margin knowledge transfer.', 6);
  r += 1;

  // Revenue streams
  r = addSectionTitle(ws1, r, 'REVENUE STREAMS', 6);
  const streams = ws1.getRow(r);
  streams.values = ['Stream', 'Type', 'Price', 'Margin', 'Scalability', 'Status'];
  styleHeaderRow(streams, 6); r++;
  const streamData = [
    ['Hosted SaaS (setup)', 'One-time', '£2,000', '95%+', 'High (2 days build)', 'Ready'],
    ['Hosted SaaS (monthly)', 'Recurring', '£300/mo', '93% (after API)', 'High (multi-tenant)', 'Ready'],
    ['Self-Hosted (setup)', 'One-time', '£1,000', '90%+', 'Medium (2 days)', 'Ready'],
    ['Self-Hosted Support', 'Hourly', '£50/hr (2hr min)', '100%', 'Time-bound', 'Ready'],
    ['Edge Franchise (Tier 3)', 'One-time', '£5,000', '95%+', 'Low (5-day training)', 'Ready'],
    ['INVADE Partnership', 'Revenue share', '50/50 on all tiers', '~50%', 'High (local partner)', 'In discussion'],
  ];
  streamData.forEach((d, i) => {
    const row = ws1.getRow(r + i);
    row.values = d;
    styleDataRow(row, 6, i % 2 === 1);
  });

  // ════════════════════════════════════════════════════════════
  // SHEET 2: UNIT ECONOMICS
  // ════════════════════════════════════════════════════════════
  const ws2 = wb.addWorksheet('Unit Economics', { properties: { tabColor: { argb: '2563EB' } } });
  ws2.columns = [{ width: 30 }, { width: 18 }, { width: 18 }, { width: 30 }];

  r = 1;
  ws2.getRow(r).getCell(1).value = 'UNIT ECONOMICS';
  ws2.getRow(r).getCell(1).font = titleFont;
  ws2.mergeCells(r, 1, r, 4); r += 2;

  // ── Hosted SaaS ──
  r = addSectionTitle(ws2, r, 'TIER 1: HOSTED ON NAVADA (SaaS)', 4);
  const h1 = ws2.getRow(r);
  h1.values = ['Item', 'Amount', 'Frequency', 'Notes'];
  styleHeaderRow(h1, 4); r++;
  const hostedEcon = [
    ['Setup fee (revenue)', HOSTED_SETUP, 'One-time', 'Agent build, skills, brand tuning, onboarding, docs'],
    ['Monthly fee (revenue)', HOSTED_MONTHLY, 'Monthly', 'Hosting, management, maintenance'],
    ['API cost per client', -API_COST_PER_CLIENT, 'Monthly', 'Anthropic + OpenAI (avg usage)'],
    ['Net monthly per client', HOSTED_MONTHLY - API_COST_PER_CLIENT, 'Monthly', `£${HOSTED_MONTHLY} - £${API_COST_PER_CLIENT} API cost`],
    ['Monthly margin %', (HOSTED_MONTHLY - API_COST_PER_CLIENT) / HOSTED_MONTHLY, '', `${Math.round(((HOSTED_MONTHLY - API_COST_PER_CLIENT) / HOSTED_MONTHLY) * 100)}% margin on recurring`],
    ['Monthly churn rate', HOSTED_CHURN_RATE, '', '~5% monthly (~46% annual retention, realistic for SMB SaaS)'],
    ['', '', '', ''],
    ['PAYBACK ANALYSIS', '', '', ''],
    ['Build time (Claude)', 4, '', '4 hours of Claude implementation'],
    ['Build cost (API)', -5, '', 'Approximate API cost for 4hr Claude session'],
    ['Lee time (consult + review)', 2, '', '2 hours architecture + review'],
    ['Net setup revenue', HOSTED_SETUP - 5, 'One-time', `£${HOSTED_SETUP} - £5 API build cost`],
    ['', '', '', ''],
    ['CLIENT LIFETIME VALUE', '', '', ''],
    ['Average client lifetime', 20, 'Months', `1 / ${HOSTED_CHURN_RATE * 100}% churn = 20 months expected`],
    ['Lifetime recurring revenue', 20 * HOSTED_MONTHLY, '', `20 x £${HOSTED_MONTHLY}`],
    ['Lifetime API cost', -(20 * API_COST_PER_CLIENT), '', `20 x £${API_COST_PER_CLIENT}`],
    ['Total LTV (incl setup)', HOSTED_SETUP + (20 * HOSTED_MONTHLY) - (20 * API_COST_PER_CLIENT), '', `£${HOSTED_SETUP} setup + £${20 * HOSTED_MONTHLY} recurring - £${20 * API_COST_PER_CLIENT} API`],
    ['LTV : CAC ratio', 'Infinite', '', 'CAC is effectively £0 (organic / referral)'],
  ];
  hostedEcon.forEach((d, i) => {
    const row = ws2.getRow(r + i);
    row.getCell(1).value = d[0];
    if (typeof d[1] === 'number') {
      row.getCell(2).value = d[1];
      row.getCell(2).numFmt = d[0].includes('%') || d[0].includes('churn') ? percentFmt : d[0].includes('time') || d[0].includes('lifetime') ? numberFmt : currencyFmt;
      if (d[1] < 0) row.getCell(2).font = { ...dataFont, color: RED };
      if (d[0].includes('LTV') || d[0].includes('Net setup') || d[0].includes('Net monthly')) row.getCell(2).font = { ...dataFont, bold: true, color: GREEN };
    } else {
      row.getCell(2).value = d[1];
    }
    row.getCell(3).value = d[2];
    row.getCell(4).value = d[3];
    const isSectionLabel = d[0] === 'PAYBACK ANALYSIS' || d[0] === 'CLIENT LIFETIME VALUE';
    if (isSectionLabel) { row.getCell(1).font = { ...dataFont, bold: true, color: NAVY }; }
    else if (d[0] !== '') styleDataRow(row, 4, i % 2 === 1);
  });
  r += hostedEcon.length + 2;

  // ── Self-Hosted ──
  r = addSectionTitle(ws2, r, 'TIER 2: SELF-HOSTED EDGE NETWORK', 4);
  const s1 = ws2.getRow(r);
  s1.values = ['Item', 'Amount', 'Frequency', 'Notes'];
  styleHeaderRow(s1, 4); r++;
  const selfEcon = [
    ['Agent build (revenue)', 2000, 'One-time', 'Same as hosted: custom agent, skills, brand'],
    ['Edge setup + consulting', 1000, 'One-time', 'Hardware config, Tailscale, CLAUDE.md, training'],
    ['Total upfront revenue', 3000, 'One-time', ''],
    ['Build cost (API)', -5, 'One-time', 'Claude build session'],
    ['Net setup revenue', 995, 'One-time', '£1,000 - £5 API'],
    ['', '', '', ''],
    ['SUPPORT REVENUE', '', '', ''],
    ['Troubleshooting rate', 50, 'Per hour', ''],
    ['Minimum booking', 100, 'Per session', '2 hours minimum'],
    ['Non-refundable deposit', 50, 'Per booking', 'Deducted from final invoice'],
    ['Avg support hours/client/mo', 2, 'Monthly', 'Conservative estimate (declines over time)'],
    ['Avg support revenue/client/mo', 100, 'Monthly', '2 hours x £50/hr'],
    ['Support attrition', 0.15, 'Per quarter', '~15% reduction per quarter as clients learn'],
    ['Support cost', 0, '', 'Lee + Claude via TeamViewer/Tailscale. Zero cost.'],
    ['Support margin %', 1.00, '', '100% margin (no cost beyond Lee\'s time)'],
  ];
  selfEcon.forEach((d, i) => {
    const row = ws2.getRow(r + i);
    row.getCell(1).value = d[0];
    if (typeof d[1] === 'number') {
      row.getCell(2).value = d[1];
      row.getCell(2).numFmt = d[0].includes('%') || d[0].includes('attrition') ? percentFmt : currencyFmt;
      if (d[1] < 0) row.getCell(2).font = { ...dataFont, color: RED };
      if (d[0].includes('Net') || d[0].includes('Total upfront')) row.getCell(2).font = { ...dataFont, bold: true, color: GREEN };
    } else {
      row.getCell(2).value = d[1];
    }
    row.getCell(3).value = d[2];
    row.getCell(4).value = d[3];
    const isSectionLabel = d[0] === 'SUPPORT REVENUE';
    if (isSectionLabel) { row.getCell(1).font = { ...dataFont, bold: true, color: NAVY }; }
    else if (d[0] !== '') styleDataRow(row, 4, i % 2 === 1);
  });
  r += selfEcon.length + 2;

  // ── Edge Franchise ──
  r = addSectionTitle(ws2, r, 'TIER 3: EDGE FRANCHISE PACKAGE', 4);
  const f1 = ws2.getRow(r);
  f1.values = ['Item', 'Amount', 'Frequency', 'Notes'];
  styleHeaderRow(f1, 4); r++;
  const franchiseEcon = [
    ['Franchise fee (revenue)', FRANCHISE_PRICE, 'One-time', 'Full architecture, assets, materials, financial model, scripts, templates'],
    ['Training delivery', 5, 'Days', '5-day face-to-face with Lee (E2E process)'],
    ['Lee\'s time cost (5 days)', -250, 'One-time', '5 days x ~£50/day opportunity cost (conservative)'],
    ['Materials & prep cost', -50, 'One-time', 'Documentation, templates, USB/digital delivery'],
    ['Net franchise revenue', FRANCHISE_PRICE - 300, 'One-time', `£${FRANCHISE_PRICE} - £300 costs`],
    ['Franchise margin %', (FRANCHISE_PRICE - 300) / FRANCHISE_PRICE, '', `${Math.round(((FRANCHISE_PRICE - 300) / FRANCHISE_PRICE) * 100)}% margin`],
    ['', '', '', ''],
    ['SCENARIO PROJECTIONS', '', '', ''],
    ['Conservative (1/year)', FRANCHISE_PRICE, 'Annual', '1 franchise sale per year'],
    ['Moderate (2/year)', FRANCHISE_PRICE * 2, 'Annual', '2 franchise sales per year'],
    ['Optimistic (4/year)', FRANCHISE_PRICE * 4, 'Annual', '4 franchise sales per year'],
  ];
  franchiseEcon.forEach((d, i) => {
    const row = ws2.getRow(r + i);
    row.getCell(1).value = d[0];
    if (typeof d[1] === 'number') {
      row.getCell(2).value = d[1];
      row.getCell(2).numFmt = d[0].includes('%') ? percentFmt : d[0].includes('days') || d[0].includes('Training') ? numberFmt : currencyFmt;
      if (d[1] < 0) row.getCell(2).font = { ...dataFont, color: RED };
      if (d[0].includes('Net franchise') || d[0].includes('Optimistic')) row.getCell(2).font = { ...dataFont, bold: true, color: GREEN };
    } else {
      row.getCell(2).value = d[1];
    }
    row.getCell(3).value = d[2];
    row.getCell(4).value = d[3];
    const isSectionLabel = d[0] === 'SCENARIO PROJECTIONS';
    if (isSectionLabel) { row.getCell(1).font = { ...dataFont, bold: true, color: NAVY }; }
    else if (d[0] !== '') styleDataRow(row, 4, i % 2 === 1);
  });

  // ════════════════════════════════════════════════════════════
  // SHEET 3: 18-MONTH FORECAST (3 scenarios) — WITH CHURN
  // ════════════════════════════════════════════════════════════
  const ws3 = wb.addWorksheet('18-Month Forecast', { properties: { tabColor: { argb: '059669' } } });
  const months = ['Apr-26','May-26','Jun-26','Jul-26','Aug-26','Sep-26','Oct-26','Nov-26','Dec-26','Jan-27','Feb-27','Mar-27','Apr-27','May-27','Jun-27','Jul-27','Aug-27','Sep-27'];
  ws3.columns = [{ width: 36 }, ...months.map(() => ({ width: 11 }))];

  r = 1;
  ws3.getRow(r).getCell(1).value = '18-MONTH REVENUE FORECAST (WITH CHURN)';
  ws3.getRow(r).getCell(1).font = titleFont;
  ws3.mergeCells(r, 1, r, 19); r++;
  r = addNote(ws3, r, `Hosted churn: ${HOSTED_CHURN_RATE * 100}% monthly (~${Math.round((1 - Math.pow(1 - HOSTED_CHURN_RATE, 12)) * 100)}% annual). Self-hosted support attrition: ${SELF_HOSTED_SUPPORT_ATTRITION * 100}% per quarter. Franchise: separate line item.`, 19);
  r++;

  function addForecast(label, hosted, selfHosted, supportHrsPerSelfHosted, franchisePerYear, startRow) {
    let cr = startRow;
    cr = addSectionTitle(ws3, cr, label, 19);

    // Header
    const hdr = ws3.getRow(cr);
    hdr.values = ['Metric', ...months];
    styleHeaderRow(hdr, 19); cr++;

    // ── CLIENT COUNTS WITH CHURN ──
    const newHostedLabel = ws3.getRow(cr);
    newHostedLabel.getCell(1).value = 'New Hosted Clients (this month)';
    newHostedLabel.getCell(1).font = { ...dataFont, bold: true };
    hosted.forEach((v, j) => { newHostedLabel.getCell(j + 2).value = v; newHostedLabel.getCell(j + 2).numFmt = numberFmt; });
    styleDataRow(newHostedLabel, 19, false); cr++;

    // Churned clients
    const churnedRow = ws3.getRow(cr);
    churnedRow.getCell(1).value = `Churned Hosted (${HOSTED_CHURN_RATE * 100}% monthly)`;
    churnedRow.getCell(1).font = { ...dataFont, bold: true, color: RED };
    const churnedVals = [];
    const cumHosted = [];
    // First pass: compute cumulative with churn
    let prevCum = 0;
    hosted.forEach((v, j) => {
      const churned = Math.floor(prevCum * HOSTED_CHURN_RATE);
      churnedVals.push(churned);
      const cum = prevCum + v - churned;
      cumHosted.push(cum);
      prevCum = cum;
    });
    churnedVals.forEach((v, j) => {
      churnedRow.getCell(j + 2).value = -v;
      churnedRow.getCell(j + 2).numFmt = numberFmt;
      churnedRow.getCell(j + 2).font = { ...dataFont, color: RED };
    });
    styleDataRow(churnedRow, 19, true); cr++;

    // Net hosted (after churn)
    const cumHostedRow = ws3.getRow(cr);
    cumHostedRow.getCell(1).value = 'Active Hosted Clients (after churn)';
    cumHostedRow.getCell(1).font = { ...dataFont, bold: true, color: BLUE };
    cumHosted.forEach((v, j) => {
      cumHostedRow.getCell(j + 2).value = v;
      cumHostedRow.getCell(j + 2).numFmt = numberFmt;
      cumHostedRow.getCell(j + 2).font = { ...dataFont, bold: true, color: BLUE };
    });
    styleDataRow(cumHostedRow, 19, false); cr++;

    const newSelfLabel = ws3.getRow(cr);
    newSelfLabel.getCell(1).value = 'New Self-Hosted Clients (this month)';
    newSelfLabel.getCell(1).font = { ...dataFont, bold: true };
    selfHosted.forEach((v, j) => { newSelfLabel.getCell(j + 2).value = v; newSelfLabel.getCell(j + 2).numFmt = numberFmt; });
    styleDataRow(newSelfLabel, 19, false); cr++;

    const cumSelf = [];
    const cumSelfRow = ws3.getRow(cr);
    cumSelfRow.getCell(1).value = 'Cumulative Self-Hosted Clients';
    cumSelfRow.getCell(1).font = { ...dataFont, bold: true };
    selfHosted.forEach((v, j) => {
      const cum = selfHosted.slice(0, j + 1).reduce((a, b) => a + b, 0);
      cumSelf.push(cum);
      cumSelfRow.getCell(j + 2).value = cum;
      cumSelfRow.getCell(j + 2).numFmt = numberFmt;
    });
    styleDataRow(cumSelfRow, 19, true); cr++;

    const totalClientsRow = ws3.getRow(cr);
    totalClientsRow.getCell(1).value = 'TOTAL ACTIVE CLIENTS';
    totalClientsRow.getCell(1).font = { ...dataFont, bold: true, color: BLUE };
    months.forEach((_, j) => {
      totalClientsRow.getCell(j + 2).value = cumHosted[j] + cumSelf[j];
      totalClientsRow.getCell(j + 2).numFmt = numberFmt;
      totalClientsRow.getCell(j + 2).font = { ...dataFont, bold: true, color: BLUE };
    });
    styleDataRow(totalClientsRow, 19, false); cr += 2;

    // ── REVENUE ──
    cr = addSectionTitle(ws3, cr, 'REVENUE BREAKDOWN', 19);
    const revHdr = ws3.getRow(cr);
    revHdr.values = ['Revenue Line', ...months];
    styleHeaderRow(revHdr, 19); cr++;

    // Hosted setup fees
    const hostedSetupRow = ws3.getRow(cr);
    hostedSetupRow.getCell(1).value = `Hosted Setup Fees (£${(HOSTED_SETUP/1000).toFixed(0)}K each)`;
    const hostedSetupVals = [];
    hosted.forEach((v, j) => { const val = v * HOSTED_SETUP; hostedSetupVals.push(val); hostedSetupRow.getCell(j + 2).value = val; hostedSetupRow.getCell(j + 2).numFmt = currencyFmt; });
    styleDataRow(hostedSetupRow, 19, false); cr++;

    // Hosted MRR (churn-adjusted)
    const hostedMRRRow = ws3.getRow(cr);
    hostedMRRRow.getCell(1).value = `Hosted MRR (£${HOSTED_MONTHLY}/client/mo)`;
    const hostedMRRVals = [];
    cumHosted.forEach((v, j) => { const val = v * HOSTED_MONTHLY; hostedMRRVals.push(val); hostedMRRRow.getCell(j + 2).value = val; hostedMRRRow.getCell(j + 2).numFmt = currencyFmt; });
    styleDataRow(hostedMRRRow, 19, true); cr++;

    // Churn impact row
    const churnImpactRow = ws3.getRow(cr);
    churnImpactRow.getCell(1).value = 'Lost MRR from Churn';
    churnImpactRow.getCell(1).font = { ...dataFont, color: RED };
    churnedVals.forEach((v, j) => {
      churnImpactRow.getCell(j + 2).value = -(v * HOSTED_MONTHLY);
      churnImpactRow.getCell(j + 2).numFmt = currencyFmt;
      churnImpactRow.getCell(j + 2).font = { ...dataFont, color: RED };
    });
    styleDataRow(churnImpactRow, 19, false); cr++;

    // Self-hosted setup fees
    const selfSetupRow = ws3.getRow(cr);
    selfSetupRow.getCell(1).value = `Self-Hosted Setup Fees (£${(SELF_HOSTED_SETUP/1000).toFixed(0)}K each)`;
    const selfSetupVals = [];
    selfHosted.forEach((v, j) => { const val = v * SELF_HOSTED_SETUP; selfSetupVals.push(val); selfSetupRow.getCell(j + 2).value = val; selfSetupRow.getCell(j + 2).numFmt = currencyFmt; });
    styleDataRow(selfSetupRow, 19, true); cr++;

    // Support revenue (with attrition)
    const supportRow = ws3.getRow(cr);
    supportRow.getCell(1).value = `Support Revenue (${supportHrsPerSelfHosted}hrs x £${SUPPORT_RATE}/client/mo, with attrition)`;
    const supportVals = [];
    cumSelf.forEach((v, j) => {
      // Attrition: reduce support hours by 15% per quarter
      const quarter = Math.floor(j / 3);
      const attritionMultiplier = Math.pow(1 - SELF_HOSTED_SUPPORT_ATTRITION, quarter);
      const val = Math.round(v * supportHrsPerSelfHosted * SUPPORT_RATE * attritionMultiplier);
      supportVals.push(val);
      supportRow.getCell(j + 2).value = val;
      supportRow.getCell(j + 2).numFmt = currencyFmt;
    });
    styleDataRow(supportRow, 19, false); cr++;

    // Franchise revenue
    const franchiseRow = ws3.getRow(cr);
    franchiseRow.getCell(1).value = `Franchise Revenue (£${(FRANCHISE_PRICE/1000).toFixed(0)}K each)`;
    franchiseRow.getCell(1).font = { ...dataFont, bold: true, color: PURPLE };
    const franchiseVals = [];
    // Spread franchise sales across the year
    const franchiseSchedule = new Array(18).fill(0);
    if (franchisePerYear >= 1) franchiseSchedule[5] = 1; // Sep
    if (franchisePerYear >= 2) franchiseSchedule[11] = 1; // Mar
    if (franchisePerYear >= 3) franchiseSchedule[14] = 1; // Jun Y2
    if (franchisePerYear >= 4) franchiseSchedule[17] = 1; // Sep Y2
    months.forEach((_, j) => {
      const val = franchiseSchedule[j] * FRANCHISE_PRICE;
      franchiseVals.push(val);
      franchiseRow.getCell(j + 2).value = val;
      franchiseRow.getCell(j + 2).numFmt = currencyFmt;
      if (val > 0) franchiseRow.getCell(j + 2).font = { ...dataFont, bold: true, color: PURPLE };
    });
    styleDataRow(franchiseRow, 19, true); cr++;

    // Total Revenue
    const totalRevRow = ws3.getRow(cr);
    totalRevRow.getCell(1).value = 'TOTAL REVENUE';
    totalRevRow.getCell(1).font = { name: 'Calibri', size: 11, bold: true, color: WHITE };
    for (let c = 1; c <= 19; c++) { totalRevRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: GREEN }; }
    const totalRevVals = [];
    months.forEach((_, j) => {
      const val = hostedSetupVals[j] + hostedMRRVals[j] + selfSetupVals[j] + supportVals[j] + franchiseVals[j];
      totalRevVals.push(val);
      totalRevRow.getCell(j + 2).value = val;
      totalRevRow.getCell(j + 2).numFmt = currencyFmt;
      totalRevRow.getCell(j + 2).font = { name: 'Calibri', size: 11, bold: true, color: WHITE };
    });
    cr += 2;

    // ── COSTS ──
    const apiRow = ws3.getRow(cr);
    apiRow.getCell(1).value = 'API Costs (Anthropic + OpenAI)';
    apiRow.getCell(1).font = { ...dataFont, bold: true, color: RED };
    const apiVals = [];
    cumHosted.forEach((v, j) => {
      const val = v * API_COST_PER_CLIENT;
      apiVals.push(val);
      apiRow.getCell(j + 2).value = -val;
      apiRow.getCell(j + 2).numFmt = currencyFmt;
      apiRow.getCell(j + 2).font = { ...dataFont, color: RED };
    });
    styleDataRow(apiRow, 19, false); cr++;

    const fixedRow = ws3.getRow(cr);
    fixedRow.getCell(1).value = 'Fixed Opex (electricity, domains, tools)';
    fixedRow.getCell(1).font = { ...dataFont, color: RED };
    months.forEach((_, j) => {
      fixedRow.getCell(j + 2).value = -FIXED_OPEX_MONTHLY;
      fixedRow.getCell(j + 2).numFmt = currencyFmt;
      fixedRow.getCell(j + 2).font = { ...dataFont, color: RED };
    });
    styleDataRow(fixedRow, 19, true); cr++;

    // Infrastructure capex (month 3, one-time)
    const capexRow = ws3.getRow(cr);
    capexRow.getCell(1).value = 'Infrastructure Capex (one-time, Month 3)';
    capexRow.getCell(1).font = { ...dataFont, bold: true, color: RED };
    const capexVals = new Array(18).fill(0);
    capexVals[2] = INFRA_CAPEX; // Month 3 (Jun-26)
    months.forEach((_, j) => {
      if (capexVals[j] > 0) {
        capexRow.getCell(j + 2).value = -capexVals[j];
        capexRow.getCell(j + 2).numFmt = currencyFmt;
        capexRow.getCell(j + 2).font = { ...dataFont, bold: true, color: RED };
      }
    });
    styleDataRow(capexRow, 19, false); cr++;

    // Net Profit
    const profitRow = ws3.getRow(cr);
    profitRow.getCell(1).value = 'NET PROFIT';
    profitRow.getCell(1).font = { name: 'Calibri', size: 11, bold: true, color: NAVY };
    for (let c = 1; c <= 19; c++) { profitRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: LIGHT_BLUE }; }
    const profitVals = [];
    months.forEach((_, j) => {
      const val = totalRevVals[j] - apiVals[j] - FIXED_OPEX_MONTHLY - capexVals[j];
      profitVals.push(val);
      profitRow.getCell(j + 2).value = val;
      profitRow.getCell(j + 2).numFmt = currencyFmt;
      profitRow.getCell(j + 2).font = { name: 'Calibri', size: 11, bold: true, color: val >= 0 ? GREEN : RED };
    });
    cr += 2;

    // Cumulative profit
    const cumProfitRow = ws3.getRow(cr);
    cumProfitRow.getCell(1).value = 'CUMULATIVE NET PROFIT';
    cumProfitRow.getCell(1).font = { ...dataFont, bold: true, color: GREEN };
    let cumProfit = 0;
    months.forEach((_, j) => {
      cumProfit += profitVals[j];
      cumProfitRow.getCell(j + 2).value = cumProfit;
      cumProfitRow.getCell(j + 2).numFmt = currencyFmt;
      cumProfitRow.getCell(j + 2).font = { ...dataFont, bold: true, color: cumProfit >= 0 ? GREEN : RED };
    });
    styleDataRow(cumProfitRow, 19, false); cr += 2;

    // ── ANNUAL SUMMARY ──
    cr = addSectionTitle(ws3, cr, 'ANNUAL SUMMARY (CHURN-ADJUSTED)', 19);

    const y1Rev = totalRevVals.slice(0, 12).reduce((a, b) => a + b, 0);
    const y1Api = apiVals.slice(0, 12).reduce((a, b) => a + b, 0);
    const y1Capex = capexVals.slice(0, 12).reduce((a, b) => a + b, 0);
    const y1Profit = profitVals.slice(0, 12).reduce((a, b) => a + b, 0);
    const totalChurned = churnedVals.slice(0, 12).reduce((a, b) => a + b, 0);

    const summaryItems = [
      ['Year 1 Total Revenue (12 months)', y1Rev],
      ['Year 1 Total API Costs', -y1Api],
      ['Year 1 Fixed Opex', -(FIXED_OPEX_MONTHLY * 12)],
      ['Year 1 Infrastructure Capex', -y1Capex],
      ['Year 1 Net Profit', y1Profit],
      ['', ''],
      ['Year 1 Active Hosted Clients (end)', cumHosted[11]],
      ['Year 1 Total Churned Hosted Clients', totalChurned],
      ['Year 1 Self-Hosted Clients (end)', cumSelf[11]],
      ['Year 1 Total Active Clients (end)', cumHosted[11] + cumSelf[11]],
      ['', ''],
      ['Month 12 MRR (hosted only)', hostedMRRVals[11]],
      ['Month 12 MRR + Support', hostedMRRVals[11] + supportVals[11]],
      ['Month 18 MRR + Support', hostedMRRVals[17] + supportVals[17]],
      ['Annualized Run Rate (Month 18 x 12)', (hostedMRRVals[17] + supportVals[17]) * 12],
    ];

    summaryItems.forEach((d, i) => {
      if (d[0] === '') { cr++; return; }
      const row = ws3.getRow(cr);
      row.getCell(1).value = d[0];
      row.getCell(1).font = { ...dataFont, bold: true };
      if (typeof d[1] === 'number') {
        row.getCell(2).value = d[1];
        row.getCell(2).numFmt = d[0].includes('Clients') || d[0].includes('Churned') ? numberFmt : currencyFmt;
        const isProfit = d[0].includes('Net Profit') || d[0].includes('Annualized');
        const isCost = d[1] < 0;
        const isChurn = d[0].includes('Churned');
        row.getCell(2).font = { ...dataFont, bold: true, color: isProfit ? GREEN : isCost ? RED : isChurn ? AMBER : BLUE };
      }
      ws3.mergeCells(cr, 2, cr, 5);
      styleDataRow(row, 5, i % 2 === 1);
      cr++;
    });

    cr += 3;
    return cr;
  }

  // ── SCENARIO A: CONSERVATIVE ──
  r = addForecast('SCENARIO A: CONSERVATIVE (6 clients Y1: 4 Hosted + 2 Self-Hosted + 1 Franchise)',
    [0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    2, 1, r);

  // ── SCENARIO B: MODERATE ──
  r = addForecast('SCENARIO B: MODERATE (12 clients Y1: 8 Hosted + 4 Self-Hosted + 2 Franchise)',
    [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1],
    2, 2, r);

  // ── SCENARIO C: OPTIMISTIC ──
  r = addForecast('SCENARIO C: OPTIMISTIC (24 clients Y1: 16 Hosted + 8 Self-Hosted + 4 Franchise)',
    [1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 2, 2, 2, 2, 3],
    [0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 2],
    2, 4, r);

  // ════════════════════════════════════════════════════════════
  // SHEET 4: OPERATING COSTS (OPEX)
  // ════════════════════════════════════════════════════════════
  const ws4 = wb.addWorksheet('Operating Costs', { properties: { tabColor: { argb: 'DC2626' } } });
  ws4.columns = [{ width: 35 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 35 }];

  r = 1;
  ws4.getRow(r).getCell(1).value = 'NAVADA EDGE OPERATING COSTS';
  ws4.getRow(r).getCell(1).font = titleFont;
  ws4.mergeCells(r, 1, r, 5); r += 2;

  r = addSectionTitle(ws4, r, 'WHY OPEX IS NEAR-ZERO', 5);
  r = addNote(ws4, r, 'Lee is the developer and architect. Claude is the AI Chief of Staff and builder. Together they ARE the delivery team. No salaries, no office, no employees. The only costs are API usage, electricity, and domains.', 5);
  r += 1;

  r = addSectionTitle(ws4, r, 'FIXED MONTHLY COSTS', 5);
  const fixedHeader = ws4.getRow(r);
  fixedHeader.values = ['Cost Item', 'Monthly', 'Annual', 'Essential?', 'Notes'];
  styleHeaderRow(fixedHeader, 5); r++;
  const fixedCosts = [
    ['Anthropic API (base: automations + bot)', 50, 600, 'Yes', 'NAVADA\'s own usage. Client API costs separate.'],
    ['OpenAI API (DALL-E, TTS)', 15, 180, 'Yes', 'Image generation + voice notes for Lee\'s ops.'],
    ['Electricity (Edge Server 24/7)', ELECTRICITY_MONTHLY, ELECTRICITY_MONTHLY * 12, 'Yes', 'Dedicated Edge server, always on.'],
    ['Domain (navada-lab.space)', 3, 36, 'Yes', 'Annual renewal.'],
    ['Zoho Mail', 0, 0, 'Yes', 'Free tier.'],
    ['Cloudflare (Tunnel + DNS)', 0, 0, 'Yes', 'Free tier.'],
    ['Tailscale (up to 100 devices)', 0, 0, 'Yes', 'Free tier. More than enough for client network.'],
    ['GitHub', 0, 0, 'Yes', 'Free tier.'],
    ['PM2 / Node.js / Docker', 0, 0, 'Yes', 'All free / open source.'],
    ['Windows 11 Pro', 0, 0, 'Yes', 'Already licensed.'],
    ['Stripe', 0, 0, 'Yes', `Free to use. 1.4% + 20p per transaction (deducted from revenue).`],
  ];
  let totalFixed = 0;
  fixedCosts.forEach((d, i) => {
    const row = ws4.getRow(r + i);
    row.getCell(1).value = d[0];
    row.getCell(2).value = d[1]; row.getCell(2).numFmt = currencyFmt;
    row.getCell(3).value = d[2]; row.getCell(3).numFmt = currencyFmt;
    row.getCell(4).value = d[3];
    row.getCell(5).value = d[4];
    styleDataRow(row, 5, i % 2 === 1);
    totalFixed += d[1];
  });
  r += fixedCosts.length;

  const totalFixedRow = ws4.getRow(r);
  totalFixedRow.getCell(1).value = 'TOTAL FIXED MONTHLY OPEX';
  totalFixedRow.getCell(1).font = { ...dataFont, bold: true, color: RED };
  totalFixedRow.getCell(2).value = totalFixed; totalFixedRow.getCell(2).numFmt = currencyFmt;
  totalFixedRow.getCell(2).font = { ...dataFont, bold: true, color: RED };
  totalFixedRow.getCell(3).value = totalFixed * 12; totalFixedRow.getCell(3).numFmt = currencyFmt;
  totalFixedRow.getCell(3).font = { ...dataFont, bold: true, color: RED };
  totalFixedRow.getCell(5).value = 'This is the entire fixed operating cost.';
  totalFixedRow.getCell(5).font = { ...dataFont, bold: true };
  r += 3;

  // ── ONE-TIME CAPEX ──
  r = addSectionTitle(ws4, r, 'ONE-TIME CAPITAL EXPENDITURE', 5);
  const capexHeader = ws4.getRow(r);
  capexHeader.values = ['Item', 'Cost', 'Timing', '', 'Notes'];
  styleHeaderRow(capexHeader, 5); r++;
  const capexItems = [
    ['Edge Server Hardware', INFRA_CAPEX, 'Month 3 (Jun 2026)', '', 'Dedicated server for multi-client hosting'],
  ];
  capexItems.forEach((d, i) => {
    const row = ws4.getRow(r + i);
    row.getCell(1).value = d[0];
    row.getCell(2).value = d[1]; row.getCell(2).numFmt = currencyFmt;
    row.getCell(2).font = { ...dataFont, bold: true, color: RED };
    row.getCell(3).value = d[2];
    row.getCell(5).value = d[4];
    styleDataRow(row, 5, i % 2 === 1);
  });
  r += capexItems.length + 2;

  r = addSectionTitle(ws4, r, 'VARIABLE COSTS PER HOSTED CLIENT', 5);
  const varHeader = ws4.getRow(r);
  varHeader.values = ['Cost Item', 'Per Client/mo', 'At 8 Clients', 'At 16 Clients', 'Notes'];
  styleHeaderRow(varHeader, 5); r++;
  const stripeFee = Math.round(HOSTED_MONTHLY * 0.014 + 0.20);
  const varCosts = [
    ['Anthropic API (Claude)', 15, 120, 240, 'Average. Heavy Opus users cost more.'],
    ['OpenAI API (DALL-E, TTS)', 5, 40, 80, 'Not all clients use image gen / voice.'],
    ['Total variable per client', 20, 160, 320, ''],
    [`Stripe fees (1.4% + 20p on £${HOSTED_MONTHLY})`, stripeFee, stripeFee * 8, stripeFee * 16, 'Payment processing.'],
  ];
  varCosts.forEach((d, i) => {
    const row = ws4.getRow(r + i);
    row.getCell(1).value = d[0];
    row.getCell(2).value = d[1]; row.getCell(2).numFmt = currencyFmt;
    row.getCell(3).value = d[2]; row.getCell(3).numFmt = currencyFmt;
    row.getCell(4).value = d[3]; row.getCell(4).numFmt = currencyFmt;
    row.getCell(5).value = d[4];
    styleDataRow(row, 5, i % 2 === 1);
  });
  r += varCosts.length + 2;

  r = addSectionTitle(ws4, r, 'COST COMPARISON: NAVADA vs TRADITIONAL AI STARTUP', 5);
  const compHeader = ws4.getRow(r);
  compHeader.values = ['Cost Item', 'Traditional', 'NAVADA', 'Savings', ''];
  styleHeaderRow(compHeader, 5); r++;
  const compCosts = [
    ['Developer salary (1 FTE)', 5000, 0, 5000],
    ['Cloud hosting (AWS/Azure)', 500, 0, 500],
    ['Office space', 1500, 0, 1500],
    ['SaaS tools', 200, 0, 200],
    ['Marketing', 500, 0, 500],
    ['API costs', 200, FIXED_OPEX_MONTHLY, 200 - FIXED_OPEX_MONTHLY],
    ['Hardware (electricity)', 0, ELECTRICITY_MONTHLY, -ELECTRICITY_MONTHLY],
    ['TOTAL MONTHLY', 7900, FIXED_OPEX_MONTHLY + ELECTRICITY_MONTHLY, 7900 - FIXED_OPEX_MONTHLY - ELECTRICITY_MONTHLY],
  ];
  compCosts.forEach((d, i) => {
    const row = ws4.getRow(r + i);
    row.getCell(1).value = d[0];
    row.getCell(2).value = d[1]; row.getCell(2).numFmt = currencyFmt;
    row.getCell(3).value = d[2]; row.getCell(3).numFmt = currencyFmt;
    row.getCell(4).value = d[3]; row.getCell(4).numFmt = currencyFmt;
    if (d[0] === 'TOTAL MONTHLY') {
      row.getCell(1).font = { ...dataFont, bold: true };
      row.getCell(4).font = { ...dataFont, bold: true, color: GREEN };
    }
    styleDataRow(row, 5, i % 2 === 1);
  });

  // ════════════════════════════════════════════════════════════
  // SHEET 5: P&L STATEMENT (UPDATED WITH CHURN, FRANCHISE, GPU)
  // ════════════════════════════════════════════════════════════
  const ws5 = wb.addWorksheet('P&L Statement', { properties: { tabColor: { argb: 'D97706' } } });
  ws5.columns = [{ width: 42 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 35 }];

  r = 1;
  ws5.getRow(r).getCell(1).value = 'PROFIT & LOSS STATEMENT';
  ws5.getRow(r).getCell(1).font = titleFont;
  ws5.mergeCells(r, 1, r, 5); r++;
  ws5.getRow(r).getCell(1).value = 'NAVADA Edge | Scenario B (Moderate) | Churn-Adjusted with Franchise Revenue';
  ws5.getRow(r).getCell(1).font = { ...dataFont, italic: true, color: { argb: 'FF888888' } };
  ws5.mergeCells(r, 1, r, 5); r += 2;

  const plHeader = ws5.getRow(r);
  plHeader.values = ['Line Item', 'Year 1', 'Year 2 (proj)', 'Year 3 (proj)', 'Notes'];
  styleHeaderRow(plHeader, 5); r++;

  // P&L with churn-adjusted numbers
  // Y1: 8H new, ~6 active after churn, 4S, 2 franchise
  // Y2: +10H new, ~12 active after churn, +4S (8 total), 2 franchise
  // Y3: +14H new, ~20 active after churn, +6S (14 total), 3 franchise
  const plData = [
    ['REVENUE', '', '', '', ''],
    [`Hosted: Setup Fees (£${(HOSTED_SETUP/1000).toFixed(0)}K each)`, 16000, 20000, 28000, '8 new Y1, 10 Y2, 14 Y3'],
    [`Hosted: Monthly Subscriptions (£${HOSTED_MONTHLY}/mo)`, 14400, 43200, 72000, 'Churn-adjusted active base (~5% monthly churn)'],
    [`Self-Hosted: Setup Fees (£${SELF_HOSTED_SETUP.toLocaleString()} each)`, 4000, 4000, 6000, '4 new Y1, 4 Y2, 6 Y3'],
    [`Self-Hosted: Support Revenue (£${SUPPORT_RATE}/hr)`, 4200, 7200, 10800, 'Avg 2hrs/client/mo, with quarterly attrition'],
    [`Edge Franchise (£${(FRANCHISE_PRICE/1000).toFixed(0)}K each)`, 10000, 10000, 15000, '2 Y1, 2 Y2, 3 Y3'],
    ['TOTAL REVENUE', 56600, 92400, 143800, ''],
    ['', '', '', '', ''],
    ['COST OF REVENUE', '', '', '', ''],
    ['Anthropic API (hosted clients)', 1800, 5400, 9600, '£15/mo avg per active hosted client (after churn)'],
    ['OpenAI API (hosted clients)', 600, 1800, 3200, '£5/mo avg per active hosted client'],
    [`Stripe Fees (~1.6% of revenue)`, 906, 1478, 2301, `1.4% + 20p per transaction on £${HOSTED_MONTHLY} subscriptions + setup fees`],
    ['TOTAL COGS', 3306, 8678, 15101, ''],
    ['', '', '', '', ''],
    ['GROSS PROFIT', 53294, 83722, 128699, ''],
    ['Gross Margin %', 0.942, 0.906, 0.895, ''],
    ['', '', '', '', ''],
    ['OPERATING EXPENSES', '', '', '', ''],
    ['Base API (NAVADA ops)', 600, 600, 600, 'Lee\'s own automations + bot'],
    ['OpenAI (NAVADA ops)', 180, 180, 180, 'Lee\'s image gen + voice notes'],
    ['Electricity (Edge Server)', ELECTRICITY_MONTHLY * 12, ELECTRICITY_MONTHLY * 12, ELECTRICITY_MONTHLY * 12, 'Edge server always-on'],
    ['Domains', 36, 72, 108, ''],
    ['Edge Server (one-time capex)', INFRA_CAPEX, 0, 0, '£3,000 one-time in Month 3'],
    ['Stripe subscription fee', 0, 0, 0, 'No monthly Stripe fee on standard plan'],
    ['Marketing (optional)', 0, 600, 1200, 'LinkedIn, content. Organic first.'],
    ['Hardware (second server)', 0, 0, 300, 'Mini PC one-time if needed Y3'],
    ['TOTAL OPEX', 3960, 1596, 2532, 'Y1 includes £3K infrastructure capex'],
    ['', '', '', '', ''],
    ['NET PROFIT BEFORE TAX', 49334, 82126, 126167, ''],
    ['Corporation Tax (19%)', 9373, 15604, 23972, 'UK small company rate'],
    ['', '', '', '', ''],
    ['NET PROFIT AFTER TAX', 39961, 66522, 102195, ''],
    ['Net Margin %', 0.706, 0.720, 0.711, ''],
    ['', '', '', '', ''],
    ['CUMULATIVE NET PROFIT (after tax)', 39961, 106483, 208678, '3-year total profit'],
  ];

  plData.forEach((d, i) => {
    const row = ws5.getRow(r + i);
    row.getCell(1).value = d[0];
    const isSectionHeader = ['REVENUE', 'COST OF REVENUE', 'OPERATING EXPENSES'].includes(d[0]);
    const isTotal = d[0].startsWith('TOTAL') || d[0].startsWith('GROSS') || d[0].startsWith('NET PROFIT') || d[0].startsWith('CUMULATIVE');
    const isMargin = d[0].includes('Margin');

    if (isSectionHeader) {
      row.getCell(1).font = { ...dataFont, bold: true, color: NAVY };
    } else if (isTotal) {
      row.getCell(1).font = { ...dataFont, bold: true };
      for (let c = 2; c <= 4; c++) {
        row.getCell(c).value = d[c - 1];
        row.getCell(c).numFmt = currencyFmt;
        const isBad = d[0].includes('COGS') || d[0].includes('OPEX') || d[0].includes('Tax');
        row.getCell(c).font = { ...dataFont, bold: true, color: isBad ? RED : GREEN };
      }
    } else if (isMargin) {
      row.getCell(1).font = { ...dataFont, italic: true };
      for (let c = 2; c <= 4; c++) {
        row.getCell(c).value = d[c - 1]; row.getCell(c).numFmt = percentFmt;
        row.getCell(c).font = { ...dataFont, italic: true, color: BLUE };
      }
    } else if (d[1] !== '') {
      for (let c = 2; c <= 4; c++) {
        row.getCell(c).value = d[c - 1]; row.getCell(c).numFmt = currencyFmt;
      }
    }
    row.getCell(5).value = d[4];
    row.getCell(5).font = { ...dataFont, color: { argb: 'FF888888' }, italic: true };
    if (!isSectionHeader && d[0] !== '') styleDataRow(row, 5, i % 2 === 1);
  });

  // ════════════════════════════════════════════════════════════
  // SHEET 6: SUPPORT RULES & STRIPE
  // ════════════════════════════════════════════════════════════
  const ws6 = wb.addWorksheet('Support & Payments', { properties: { tabColor: { argb: '7C3AED' } } });
  ws6.columns = [{ width: 28 }, { width: 28 }, { width: 28 }, { width: 28 }];

  r = 1;
  ws6.getRow(r).getCell(1).value = 'SUPPORT RULES & PAYMENT FLOW';
  ws6.getRow(r).getCell(1).font = titleFont;
  ws6.mergeCells(r, 1, r, 4); r += 2;

  r = addSectionTitle(ws6, r, 'SUPPORT COMPARISON', 4);
  const supHdr = ws6.getRow(r);
  supHdr.values = ['', 'Hosted (SaaS)', 'Self-Hosted', 'Notes'];
  styleHeaderRow(supHdr, 4); r++;
  const supData = [
    ['Rate', `Free (included in £${HOSTED_MONTHLY}/mo)`, '£50/hr', ''],
    ['Minimum booking', 'N/A', '2 hours (£100)', 'Ensures meaningful sessions'],
    ['Deposit', 'N/A', '£50 non-refundable', 'Deducted from final invoice'],
    ['Method', 'TeamViewer + Tailscale', 'TeamViewer + Tailscale', 'Remote access for both tiers'],
    ['Response time', 'Within 24hrs', 'Within 48hrs', 'SaaS clients get priority'],
    ['Scope', 'Agent behaviour, bugs, updates', 'Troubleshooting, config, updates', ''],
  ];
  supData.forEach((d, i) => {
    const row = ws6.getRow(r + i);
    row.values = d;
    row.getCell(1).font = { ...dataFont, bold: true };
    styleDataRow(row, 4, i % 2 === 1);
  });
  r += supData.length + 2;

  r = addSectionTitle(ws6, r, 'STRIPE PAYMENT FLOW: HOSTED (SaaS)', 4);
  const stripeHdr1 = ws6.getRow(r);
  stripeHdr1.values = ['Step', 'Action', 'Stripe Product', 'Amount'];
  styleHeaderRow(stripeHdr1, 4); r++;
  const stripe1 = [
    ['1. Onboarding', 'Client pays setup fee', 'Stripe Checkout / Invoice', `£${HOSTED_SETUP.toLocaleString()} one-time`],
    ['2. Subscription', 'Monthly billing starts', 'Stripe Subscriptions', `£${HOSTED_MONTHLY}/mo recurring`],
    ['3. Failed payment', 'Auto-retry (Stripe Smart Retries)', 'Built-in', 'Auto'],
    ['4. 7 days unpaid', 'Webhook triggers agent disconnect', 'Stripe Webhook -> server', 'pm2 stop client-bot'],
    ['5. Reactivation', 'Client pays outstanding balance', 'Stripe Invoice', 'Outstanding amount'],
  ];
  stripe1.forEach((d, i) => {
    const row = ws6.getRow(r + i);
    row.values = d;
    styleDataRow(row, 4, i % 2 === 1);
  });
  r += stripe1.length + 2;

  r = addSectionTitle(ws6, r, 'STRIPE PAYMENT FLOW: SELF-HOSTED', 4);
  const stripeHdr2 = ws6.getRow(r);
  stripeHdr2.values = ['Step', 'Action', 'Stripe Product', 'Amount'];
  styleHeaderRow(stripeHdr2, 4); r++;
  const stripe2 = [
    ['1. Setup', 'Client pays full upfront', 'Stripe Invoice', `£${SELF_HOSTED_SETUP.toLocaleString()} one-time`],
    ['2. Support booking', 'Client pays deposit', 'Stripe Payment Link', '£50 non-refundable'],
    ['3. After session', 'Invoice for remaining hours', 'Stripe Invoice', '£50/hr x hours - £50 deposit'],
  ];
  stripe2.forEach((d, i) => {
    const row = ws6.getRow(r + i);
    row.values = d;
    styleDataRow(row, 4, i % 2 === 1);
  });
  r += stripe2.length + 2;

  r = addSectionTitle(ws6, r, 'STRIPE PAYMENT FLOW: EDGE FRANCHISE', 4);
  const stripeHdr3 = ws6.getRow(r);
  stripeHdr3.values = ['Step', 'Action', 'Stripe Product', 'Amount'];
  styleHeaderRow(stripeHdr3, 4); r++;
  const stripe3 = [
    ['1. Agreement', 'Client signs franchise agreement', 'Stripe Invoice', `£${FRANCHISE_PRICE.toLocaleString()} one-time`],
    ['2. Payment', '50% upfront, 50% on training day 1', 'Stripe Invoice (2 parts)', `£${FRANCHISE_PRICE/2} + £${FRANCHISE_PRICE/2}`],
    ['3. Post-training support', 'Optional consulting', 'Stripe Invoice', '£75/hr as needed'],
  ];
  stripe3.forEach((d, i) => {
    const row = ws6.getRow(r + i);
    row.values = d;
    styleDataRow(row, 4, i % 2 === 1);
  });
  r += stripe3.length + 2;

  // Cancellation
  r = addSectionTitle(ws6, r, 'CANCELLATION & DISCONNECTION POLICY', 4);
  const cancData = [
    ['Hosted: Cancel anytime', 'No contract, no lock-in. 7-day grace on missed payment.', '', ''],
    ['Hosted: After 7 days unpaid', 'Agent disconnected. Client data retained for 30 days.', '', ''],
    ['Self-Hosted: No cancellation', 'Client owns their setup. No ongoing obligation.', '', ''],
    ['Self-Hosted: Support optional', 'Support is pay-as-you-go, not mandatory.', '', ''],
    ['Franchise: No refund', 'Knowledge transfer is complete. No recurring obligation.', '', ''],
  ];
  cancData.forEach((d, i) => {
    const row = ws6.getRow(r + i);
    row.getCell(1).value = d[0]; row.getCell(1).font = { ...dataFont, bold: true };
    row.getCell(2).value = d[1];
    ws6.mergeCells(r + i, 2, r + i, 4);
    styleDataRow(row, 4, i % 2 === 1);
  });

  // ════════════════════════════════════════════════════════════
  // SHEET 7: TEAM & OPERATIONS
  // ════════════════════════════════════════════════════════════
  const ws7 = wb.addWorksheet('Team & Operations', { properties: { tabColor: { argb: '059669' } } });
  ws7.columns = [{ width: 25 }, { width: 25 }, { width: 32 }, { width: 28 }];

  r = 1;
  ws7.getRow(r).getCell(1).value = 'TEAM & OPERATIONS MODEL';
  ws7.getRow(r).getCell(1).font = titleFont;
  ws7.mergeCells(r, 1, r, 4); r += 2;

  r = addSectionTitle(ws7, r, 'THE TEAM (1 HUMAN + 1 AI)', 4);
  const teamHdr = ws7.getRow(r);
  teamHdr.values = ['Role', 'Who', 'Responsibilities', 'Cost'];
  styleHeaderRow(teamHdr, 4); r++;
  const team = [
    ['Founder / Developer', 'Lee Akpareva', 'Architecture, client consults, code review, approvals, strategy, franchise training', '£0 (equity owner)'],
    ['AI Chief of Staff', 'Claude (Anthropic)', 'Agent builds, automations, Telegram, email, monitoring, reports', `~£${FIXED_OPEX_MONTHLY}/mo API`],
    ['Nigeria Partner', 'Sabo Adesina (INVADE)', 'Local deployments, client acquisition, support', 'Revenue share'],
  ];
  team.forEach((d, i) => {
    const row = ws7.getRow(r + i);
    row.values = d;
    styleDataRow(row, 4, i % 2 === 1);
    row.getCell(3).alignment = { wrapText: true };
  });
  r += team.length + 2;

  r = addSectionTitle(ws7, r, 'CLIENT DELIVERY PROCESS', 4);
  const delHdr = ws7.getRow(r);
  delHdr.values = ['Step', 'Action', 'Owner', 'Time'];
  styleHeaderRow(delHdr, 4); r++;
  const delivery = [
    ['1. Discovery', 'LinkedIn outreach, referral, or inbound enquiry', 'Lee', 'Ongoing'],
    ['2. Free Demo', '/grant <userId> 7 (7-day Telegram access)', 'Lee via Telegram', '60 seconds'],
    ['3. Consult', 'Understand client workflow, define agent skills', 'Lee', '1-2 hours'],
    ['4. Payment', 'Stripe Checkout for setup fee', 'Client', 'Instant'],
    ['5. Agent Build', 'Custom agent: skills, brand, behaviour, docs', 'Claude', '4 hours (within 2 days)'],
    ['6. Onboarding', 'Walk client through Telegram commands', 'Lee', '30 minutes'],
    ['7. Go Live', 'Agent running 24/7, subscription starts', 'Automated', 'Day 2'],
    ['8. Ongoing', 'Claude monitors, maintains, improves agent', 'Claude (automated)', 'Ongoing'],
    ['9. Support', `Included (hosted) or £${SUPPORT_RATE}/hr (self-hosted)`, 'Lee + Claude', 'As needed'],
    ['10. Franchise', '5-day face-to-face training for Tier 3 buyers', 'Lee', '5 days'],
  ];
  delivery.forEach((d, i) => {
    const row = ws7.getRow(r + i);
    row.values = d;
    styleDataRow(row, 4, i % 2 === 1);
  });
  r += delivery.length + 2;

  r = addSectionTitle(ws7, r, 'DAILY AUTOMATED OPERATIONS (18 TASKS)', 4);
  const opsHdr = ws7.getRow(r);
  opsHdr.values = ['Time', 'Task', 'Owner', 'Status'];
  styleHeaderRow(opsHdr, 4); r++;
  const ops = [
    ['6:30 AM', 'Morning Briefing', 'Claude (automated)', 'Live'],
    ['7:00 AM', 'AI News Digest', 'Claude (automated)', 'Live'],
    ['8:30 AM', 'Lead Pipeline scan', 'Claude (automated)', 'Live'],
    ['9:30 AM', 'Prospect Pipeline (outreach)', 'Claude (automated)', 'Live'],
    ['All day', 'Telegram bot (all clients + admin)', 'Claude (24/7)', 'Live'],
    ['All day', 'Inbox monitoring (every 2hrs)', 'Claude (automated)', 'Live'],
    ['9:00 PM', 'Daily Ops Report', 'Claude (automated)', 'Live'],
    ['On demand', 'Client agent builds', 'Claude (directed by Lee)', 'Ready'],
    ['On demand', 'Self-hosted Edge deployments', 'Lee + Claude', 'Active'],
    ['On demand', 'Support sessions', 'Lee + Claude via Tailscale', 'Active'],
  ];
  ops.forEach((d, i) => {
    const row = ws7.getRow(r + i);
    row.values = d;
    styleDataRow(row, 4, i % 2 === 1);
  });

  // ════════════════════════════════════════════════════════════
  // SHEET 8: SLA & UPTIME
  // ════════════════════════════════════════════════════════════
  const ws8 = wb.addWorksheet('SLA & Uptime', { properties: { tabColor: { argb: '2563EB' } } });
  ws8.columns = [{ width: 32 }, { width: 24 }, { width: 24 }, { width: 32 }];

  r = 1;
  ws8.getRow(r).getCell(1).value = 'SERVICE LEVEL AGREEMENT (SLA)';
  ws8.getRow(r).getCell(1).font = titleFont;
  ws8.mergeCells(r, 1, r, 4); r++;
  ws8.getRow(r).getCell(1).value = 'NAVADA Edge | Uptime & Support Guarantees';
  ws8.getRow(r).getCell(1).font = { ...dataFont, italic: true, color: { argb: 'FF888888' } };
  ws8.mergeCells(r, 1, r, 4); r += 2;

  // ── Hosted SLA ──
  r = addSectionTitle(ws8, r, 'TIER 1: HOSTED (SaaS) SLA', 4);
  const slaHdr1 = ws8.getRow(r);
  slaHdr1.values = ['Metric', 'Target', 'Details', 'Notes'];
  styleHeaderRow(slaHdr1, 4); r++;
  const hostedSLA = [
    ['Uptime Target', '99.5%', 'Allows ~3.6 hours/month maintenance window', 'Measured monthly, excluding scheduled maintenance'],
    ['Planned Maintenance', 'Weekdays 2-4 AM', '30-minute maintenance window', 'Clients notified 24hrs in advance via Telegram'],
    ['', '', '', ''],
    ['RESPONSE TIMES', '', '', ''],
    ['Critical (service down)', '2 hours', 'Agent completely offline', 'Priority restoration'],
    ['High (major feature broken)', '8 hours', 'Core functionality impaired', 'Fix or workaround within 8hrs'],
    ['Medium (minor issue)', '24 hours', 'Non-critical feature affected', 'Scheduled fix'],
    ['Low (enhancement request)', '48 hours', 'Feature request, cosmetic', 'Added to backlog'],
    ['', '', '', ''],
    ['CREDIT POLICY', '', '', ''],
    ['Uptime credit', '5% per 0.1% below SLA', 'Applied as credit to next month', 'Max credit: 50% of monthly fee'],
    ['Example: 99.0% uptime', '£75 credit', `5 x 5% = 25% of £${HOSTED_MONTHLY}`, 'Automatically calculated and applied'],
    ['Example: 98.0% uptime', '£150 credit', `15 x 5% = 75%, capped at 50% = £${HOSTED_MONTHLY / 2}`, 'Cap prevents credit exceeding 50%'],
    ['', '', '', ''],
    ['EXCLUSIONS', '', '', ''],
    ['Client\'s internet connection', 'Not covered', 'Client-side ISP outages', ''],
    ['Anthropic API outages', 'Not covered', 'Third-party provider downtime', 'NAVADA will communicate status'],
    ['Scheduled maintenance', 'Not covered', 'Pre-announced 2-4 AM window', '30-min max, weekdays only'],
    ['Force majeure', 'Not covered', 'Natural disasters, power grid failures', ''],
  ];
  hostedSLA.forEach((d, i) => {
    const row = ws8.getRow(r + i);
    row.getCell(1).value = d[0];
    row.getCell(2).value = d[1];
    row.getCell(3).value = d[2];
    row.getCell(4).value = d[3];
    const isSectionLabel = ['RESPONSE TIMES', 'CREDIT POLICY', 'EXCLUSIONS'].includes(d[0]);
    if (isSectionLabel) {
      row.getCell(1).font = { ...dataFont, bold: true, color: NAVY };
    } else if (d[0] !== '') {
      row.getCell(1).font = { ...dataFont, bold: true };
      styleDataRow(row, 4, i % 2 === 1);
    }
    // Highlight the uptime target
    if (d[0] === 'Uptime Target') {
      row.getCell(2).font = { ...dataFont, bold: true, color: GREEN };
    }
  });
  r += hostedSLA.length + 2;

  // ── Self-Hosted SLA ──
  r = addSectionTitle(ws8, r, 'TIER 2: SELF-HOSTED SLA', 4);
  const slaHdr2 = ws8.getRow(r);
  slaHdr2.values = ['Metric', 'Target', 'Details', 'Notes'];
  styleHeaderRow(slaHdr2, 4); r++;
  const selfSLA = [
    ['Uptime Guarantee', 'None', 'Client manages their own hardware', 'NAVADA not responsible for client uptime'],
    ['Support Response', 'Within 48 hours', 'Standard email/Telegram support', 'Best effort, not guaranteed'],
    ['Emergency Support', 'Available at premium rate', '£75/hr (no minimum)', 'For urgent issues requiring immediate help'],
    ['Remote Access', 'Via Tailscale / TeamViewer', 'Client grants access when needed', 'NAVADA does not maintain persistent access'],
    ['Software Updates', 'Quarterly recommendations', 'Claude.md updates, security patches', 'Client applies updates themselves'],
  ];
  selfSLA.forEach((d, i) => {
    const row = ws8.getRow(r + i);
    row.getCell(1).value = d[0]; row.getCell(1).font = { ...dataFont, bold: true };
    row.getCell(2).value = d[1];
    row.getCell(3).value = d[2];
    row.getCell(4).value = d[3];
    styleDataRow(row, 4, i % 2 === 1);
    if (d[0] === 'Uptime Guarantee') {
      row.getCell(2).font = { ...dataFont, bold: true, color: AMBER };
    }
  });
  r += selfSLA.length + 2;

  // ── Franchise SLA ──
  r = addSectionTitle(ws8, r, 'TIER 3: EDGE FRANCHISE SLA', 4);
  const slaHdr3 = ws8.getRow(r);
  slaHdr3.values = ['Metric', 'Target', 'Details', 'Notes'];
  styleHeaderRow(slaHdr3, 4); r++;
  const franchiseSLA = [
    ['Training Delivery', '5 consecutive days', 'Face-to-face with Lee', 'Scheduled within 30 days of payment'],
    ['Post-Training Support', '30 days email support', 'Questions, troubleshooting, guidance', 'Included in franchise fee'],
    ['Additional Consulting', '£75/hr', 'Beyond 30-day support window', 'Optional, booked via Stripe'],
    ['Software Updates', '12 months access', 'Updates to templates, scripts, docs', 'After 12 months: renewal at £500/yr'],
    ['Uptime Guarantee', 'None', 'Franchise buyer manages their own infra', 'NAVADA provides knowledge, not hosting'],
  ];
  franchiseSLA.forEach((d, i) => {
    const row = ws8.getRow(r + i);
    row.getCell(1).value = d[0]; row.getCell(1).font = { ...dataFont, bold: true };
    row.getCell(2).value = d[1];
    row.getCell(3).value = d[2];
    row.getCell(4).value = d[3];
    styleDataRow(row, 4, i % 2 === 1);
  });
  r += franchiseSLA.length + 2;

  // ── Uptime calculation table ──
  r = addSectionTitle(ws8, r, 'UPTIME REFERENCE TABLE', 4);
  const uptimeHdr = ws8.getRow(r);
  uptimeHdr.values = ['SLA Level', 'Monthly Downtime', 'Annual Downtime', 'Suitable For'];
  styleHeaderRow(uptimeHdr, 4); r++;
  const uptimeData = [
    ['99.0%', '~7.3 hours', '~3.65 days', 'Basic availability'],
    ['99.5% (NAVADA target)', '~3.6 hours', '~1.83 days', 'SMB SaaS standard'],
    ['99.9%', '~43 minutes', '~8.77 hours', 'Enterprise (not targeted)'],
    ['99.99%', '~4.3 minutes', '~52.6 minutes', 'Critical infra (not targeted)'],
  ];
  uptimeData.forEach((d, i) => {
    const row = ws8.getRow(r + i);
    row.values = d;
    row.getCell(1).font = { ...dataFont, bold: true };
    styleDataRow(row, 4, i % 2 === 1);
    if (d[0].includes('NAVADA')) {
      row.getCell(1).font = { ...dataFont, bold: true, color: GREEN };
      row.getCell(4).font = { ...dataFont, bold: true, color: GREEN };
    }
  });

  // ════════════════════════════════════════════════════════════
  // WRITE
  // ════════════════════════════════════════════════════════════
  await wb.xlsx.writeFile(OUTPUT);
  console.log(`Financial model saved: ${OUTPUT}`);
  console.log(`Sheets: ${wb.worksheets.map(s => s.name).join(', ')}`);
}

build().catch(err => { console.error('Failed:', err.message); process.exit(1); });
