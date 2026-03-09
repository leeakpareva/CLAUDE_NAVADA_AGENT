#!/usr/bin/env node
/**
 * CloudWatch Logs Pusher — Replaces ELK Stack
 * Reads PM2 logs + telegram interaction logs and pushes to CloudWatch Logs.
 * Runs on HP, pushes every 60s.
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand, DescribeLogStreamsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const fs = require('fs');
const path = require('path');

const REGION = 'eu-west-2';
const INTERVAL = 60_000;
const client = new CloudWatchLogsClient({ region: REGION });

const LOG_GROUPS = {
  telegram: 'navada-telegram',
  automation: 'navada-automation',
  pm2: 'navada-pm2',
  system: 'navada-system',
};

const TELEGRAM_LOG = path.join(__dirname, 'logs', 'telegram-interactions.jsonl');
const INBOX_LOG = path.join(__dirname, 'logs', 'inbox-responder.log');

const positions = {};

function getDate() { return new Date().toISOString().split('T')[0]; }

async function ensureStream(group, stream) {
  try {
    await client.send(new CreateLogStreamCommand({ logGroupName: group, logStreamName: stream }));
  } catch (e) {
    if (!e.name?.includes('AlreadyExists')) throw e;
  }
}

async function pushLogs(group, stream, events) {
  if (!events.length) return;
  try {
    await ensureStream(group, stream);
    const desc = await client.send(new DescribeLogStreamsCommand({
      logGroupName: group, logStreamNamePrefix: stream, limit: 1,
    }));
    const token = desc.logStreams?.[0]?.uploadSequenceToken;
    const params = {
      logGroupName: group, logStreamName: stream,
      logEvents: events.slice(0, 1000).map(e => ({
        timestamp: e.timestamp || Date.now(),
        message: typeof e.message === 'string' ? e.message : JSON.stringify(e.message),
      })).sort((a, b) => a.timestamp - b.timestamp),
    };
    if (token) params.sequenceToken = token;
    await client.send(new PutLogEventsCommand(params));
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Push error (${group}/${stream}): ${e.message?.substring(0, 100)}`);
  }
}

function readNewLines(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const stat = fs.statSync(filePath);
    const prevPos = positions[filePath] || 0;
    if (stat.size <= prevPos) {
      if (stat.size < prevPos) positions[filePath] = 0;
      return [];
    }
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(Math.min(stat.size - prevPos, 512_000));
    fs.readSync(fd, buf, 0, buf.length, prevPos);
    fs.closeSync(fd);
    positions[filePath] = prevPos + buf.length;
    return buf.toString('utf8').split('\n').filter(l => l.trim());
  } catch { return []; }
}

async function collect() {
  const ts = new Date().toISOString();
  const date = getDate();

  const telegramLines = readNewLines(TELEGRAM_LOG);
  if (telegramLines.length) {
    const events = telegramLines.map(line => {
      try { const o = JSON.parse(line); return { timestamp: new Date(o.timestamp || ts).getTime(), message: line }; }
      catch { return { timestamp: Date.now(), message: line }; }
    });
    await pushLogs(LOG_GROUPS.telegram, `hp-${date}`, events);
    console.log(`[${ts}] Telegram: ${events.length} events`);
  }

  const inboxLines = readNewLines(INBOX_LOG);
  if (inboxLines.length) {
    const events = inboxLines.map(line => ({ timestamp: Date.now(), message: line }));
    await pushLogs(LOG_GROUPS.automation, `inbox-${date}`, events);
    console.log(`[${ts}] Inbox: ${events.length} events`);
  }

  try {
    const pm2LogDir = path.join(process.env.HOME || process.env.USERPROFILE, '.pm2', 'logs');
    const files = fs.readdirSync(pm2LogDir).filter(f => f.endsWith('-out.log') || f.endsWith('-error.log'));
    let total = 0;
    for (const file of files) {
      const lines = readNewLines(path.join(pm2LogDir, file));
      if (lines.length) {
        const proc = file.replace(/-out\.log$/, '').replace(/-error\.log$/, '-err');
        await pushLogs(LOG_GROUPS.pm2, `${proc}-${date}`, lines.map(l => ({ timestamp: Date.now(), message: l })));
        total += lines.length;
      }
    }
    if (total) console.log(`[${ts}] PM2: ${total} lines`);
  } catch (e) {
    console.error(`[${ts}] PM2 logs error: ${e.message?.substring(0, 80)}`);
  }
}

console.log(`[${new Date().toISOString()}] CloudWatch Logs pusher started (every ${INTERVAL / 1000}s)`);
console.log(`Groups: ${Object.values(LOG_GROUPS).join(', ')}`);
collect();
setInterval(collect, INTERVAL);
