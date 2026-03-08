#!/usr/bin/env node
// edge-logger.js - NAVADA Edge real-time event logging to DynamoDB
// Table: navada-edge-logs (pk, sk, eventType GSI) in eu-west-2
// Usage: require('./edge-logger') or run directly with CLI flags

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  BatchWriteCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

// ── Config ──────────────────────────────────────────────────────────────────

const TABLE_NAME = 'navada-edge-logs';
const REGION = 'eu-west-2';
const TTL_SECONDS = 2592000; // 30 days
const BATCH_MAX = 25;
const GSI_NAME = 'eventType-index';

const VALID_LEVELS = new Set(['info', 'warn', 'error', 'critical']);
const VALID_NODES = new Set(['HP', 'Oracle', 'EC2', 'ASUS']);

// ── DynamoDB Client ─────────────────────────────────────────────────────────

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

// ── ANSI Colors ─────────────────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
};

const LEVEL_COLOR = {
  info: C.green,
  warn: C.yellow,
  error: C.red,
  critical: `${C.bgRed}${C.white}${C.bold}`,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function shortUuid() {
  return crypto.randomUUID().split('-')[0];
}

function makePk(node) {
  return `NODE#${node}`;
}

function makeSk(timestamp) {
  return `EVENT#${timestamp}#${shortUuid()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function ttlEpoch() {
  return Math.floor(Date.now() / 1000) + TTL_SECONDS;
}

function formatTimestamp(iso) {
  const d = new Date(iso);
  const date = d.toISOString().slice(0, 10);
  const time = d.toISOString().slice(11, 19);
  return `${C.dim}${date} ${time}${C.reset}`;
}

function formatLevel(level) {
  const color = LEVEL_COLOR[level] || C.white;
  return `${color}${level.toUpperCase().padEnd(8)}${C.reset}`;
}

function formatLogEntry(item) {
  const ts = formatTimestamp(item.timestamp);
  const lvl = formatLevel(item.level || 'info');
  const node = `${C.cyan}${(item.node || '?').padEnd(6)}${C.reset}`;
  const svc = item.service ? `${C.magenta}[${item.service}]${C.reset} ` : '';
  const evt = `${C.blue}${item.eventType || ''}${C.reset}`;
  const msg = item.message || '';
  return `${ts} ${lvl} ${node} ${svc}${evt} ${msg}`;
}

// ── Core: log() ─────────────────────────────────────────────────────────────

async function log(entry) {
  try {
    const timestamp = entry.timestamp || nowIso();
    const node = entry.node || 'HP';
    const level = VALID_LEVELS.has(entry.level) ? entry.level : 'info';

    const item = {
      pk: makePk(node),
      sk: makeSk(timestamp),
      eventType: entry.eventType || 'info',
      node,
      service: entry.service || undefined,
      message: entry.message || '',
      level,
      metadata: entry.metadata || undefined,
      timestamp,
      ttl: ttlEpoch(),
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));

    return item;
  } catch (err) {
    console.error(`[edge-logger] log() failed: ${err.message}`);
    return null;
  }
}

// ── Core: batchLog() ────────────────────────────────────────────────────────

async function batchLog(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return [];

  const results = [];

  // Split into chunks of 25
  for (let i = 0; i < entries.length; i += BATCH_MAX) {
    const chunk = entries.slice(i, i + BATCH_MAX);
    const requests = chunk.map((entry) => {
      const timestamp = entry.timestamp || nowIso();
      const node = entry.node || 'HP';
      const level = VALID_LEVELS.has(entry.level) ? entry.level : 'info';

      return {
        PutRequest: {
          Item: {
            pk: makePk(node),
            sk: makeSk(timestamp),
            eventType: entry.eventType || 'info',
            node,
            service: entry.service || undefined,
            message: entry.message || '',
            level,
            metadata: entry.metadata || undefined,
            timestamp,
            ttl: ttlEpoch(),
          },
        },
      };
    });

    try {
      let unprocessed = requests;
      let retries = 0;

      while (unprocessed.length > 0 && retries < 3) {
        const resp = await docClient.send(new BatchWriteCommand({
          RequestItems: { [TABLE_NAME]: unprocessed },
        }));

        const failed = resp.UnprocessedItems?.[TABLE_NAME];
        if (failed && failed.length > 0) {
          unprocessed = failed;
          retries++;
          // Exponential backoff
          await new Promise((r) => setTimeout(r, 100 * Math.pow(2, retries)));
        } else {
          unprocessed = [];
        }
      }

      results.push(...chunk.map((e) => e.message || e.eventType));
    } catch (err) {
      console.error(`[edge-logger] batchLog() chunk failed: ${err.message}`);
    }
  }

  return results;
}

// ── Core: query() - by node ─────────────────────────────────────────────────

async function query({ node, limit = 50, startTime, endTime } = {}) {
  try {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': makePk(node) },
      ScanIndexForward: false, // newest first
      Limit: limit,
    };

    if (startTime || endTime) {
      const start = startTime || '2020-01-01T00:00:00.000Z';
      const end = endTime || '2099-12-31T23:59:59.999Z';
      params.KeyConditionExpression += ' AND sk BETWEEN :skStart AND :skEnd';
      params.ExpressionAttributeValues[':skStart'] = `EVENT#${start}`;
      params.ExpressionAttributeValues[':skEnd'] = `EVENT#${end}~`;
    }

    const resp = await docClient.send(new QueryCommand(params));
    return resp.Items || [];
  } catch (err) {
    console.error(`[edge-logger] query() failed: ${err.message}`);
    return [];
  }
}

// ── Core: queryByType() - via GSI ───────────────────────────────────────────

async function queryByType({ eventType, limit = 50, startTime, endTime } = {}) {
  try {
    const params = {
      TableName: TABLE_NAME,
      IndexName: GSI_NAME,
      KeyConditionExpression: 'eventType = :et',
      ExpressionAttributeValues: { ':et': eventType },
      ScanIndexForward: false,
      Limit: limit,
    };

    if (startTime || endTime) {
      const start = startTime || '2020-01-01T00:00:00.000Z';
      const end = endTime || '2099-12-31T23:59:59.999Z';
      params.KeyConditionExpression += ' AND sk BETWEEN :skStart AND :skEnd';
      params.ExpressionAttributeValues[':skStart'] = `EVENT#${start}`;
      params.ExpressionAttributeValues[':skEnd'] = `EVENT#${end}~`;
    }

    const resp = await docClient.send(new QueryCommand(params));
    return resp.Items || [];
  } catch (err) {
    console.error(`[edge-logger] queryByType() failed: ${err.message}`);
    return [];
  }
}

// ── Stats: count by eventType via Scan ──────────────────────────────────────

async function stats() {
  try {
    const counts = {};
    let lastKey = undefined;

    do {
      const resp = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        ProjectionExpression: 'eventType, #lvl',
        ExpressionAttributeNames: { '#lvl': 'level' },
        ExclusiveStartKey: lastKey,
      }));

      for (const item of resp.Items || []) {
        const et = item.eventType || 'unknown';
        if (!counts[et]) counts[et] = { total: 0, info: 0, warn: 0, error: 0, critical: 0 };
        counts[et].total++;
        const lvl = item.level || 'info';
        if (counts[et][lvl] !== undefined) counts[et][lvl]++;
      }

      lastKey = resp.LastEvaluatedKey;
    } while (lastKey);

    return counts;
  } catch (err) {
    console.error(`[edge-logger] stats() failed: ${err.message}`);
    return {};
  }
}

// ── Module Exports ──────────────────────────────────────────────────────────

module.exports = { log, batchLog, query, queryByType, stats };

// ── CLI Mode ────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);

  function getArg(flag) {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
  }

  function hasFlag(flag) {
    return args.includes(flag);
  }

  async function runCli() {
    // --test: insert a test log entry
    if (hasFlag('--test')) {
      console.log(`${C.cyan}Inserting test log entry...${C.reset}`);
      const result = await log({
        node: 'HP',
        eventType: 'test',
        service: 'edge-logger',
        level: 'info',
        message: 'Test log entry from CLI',
        metadata: { cli: true, timestamp: nowIso() },
      });
      if (result) {
        console.log(`${C.green}OK${C.reset} pk=${result.pk} sk=${result.sk}`);
        console.log(formatLogEntry(result));
      } else {
        console.log(`${C.red}FAILED${C.reset} - check AWS credentials and table exists`);
        process.exit(1);
      }
      return;
    }

    // --tail <node>: show last 20 logs for a node
    const tailNode = getArg('--tail');
    if (tailNode) {
      const node = tailNode.toUpperCase();
      console.log(`${C.cyan}Last 20 logs for ${node}:${C.reset}\n`);
      const logs = await query({ node, limit: 20 });
      if (logs.length === 0) {
        console.log(`${C.dim}No logs found for ${node}${C.reset}`);
      } else {
        logs.reverse().forEach((item) => console.log(formatLogEntry(item)));
      }
      return;
    }

    // --tail-all: show last 50 across all nodes
    if (hasFlag('--tail-all')) {
      console.log(`${C.cyan}Last 50 logs across all nodes:${C.reset}\n`);
      const allLogs = [];
      for (const node of VALID_NODES) {
        const nodeLogs = await query({ node, limit: 50 });
        allLogs.push(...nodeLogs);
      }
      allLogs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      const top = allLogs.slice(0, 50);
      if (top.length === 0) {
        console.log(`${C.dim}No logs found${C.reset}`);
      } else {
        top.reverse().forEach((item) => console.log(formatLogEntry(item)));
      }
      return;
    }

    // --type <eventType> [--limit N]
    const eventType = getArg('--type');
    if (eventType) {
      const limit = parseInt(getArg('--limit') || '20', 10);
      console.log(`${C.cyan}Last ${limit} logs of type "${eventType}":${C.reset}\n`);
      const logs = await queryByType({ eventType, limit });
      if (logs.length === 0) {
        console.log(`${C.dim}No logs found for type "${eventType}"${C.reset}`);
      } else {
        logs.reverse().forEach((item) => console.log(formatLogEntry(item)));
      }
      return;
    }

    // --stats: show counts by eventType
    if (hasFlag('--stats')) {
      console.log(`${C.cyan}Event type statistics:${C.reset}\n`);
      const s = await stats();
      const types = Object.keys(s).sort((a, b) => s[b].total - s[a].total);
      if (types.length === 0) {
        console.log(`${C.dim}No logs in table${C.reset}`);
      } else {
        console.log(`${'Event Type'.padEnd(24)} ${'Total'.padStart(6)} ${'Info'.padStart(6)} ${'Warn'.padStart(6)} ${'Error'.padStart(6)} ${'Crit'.padStart(6)}`);
        console.log(`${C.dim}${'─'.repeat(60)}${C.reset}`);
        for (const t of types) {
          const r = s[t];
          const warnC = r.warn > 0 ? C.yellow : '';
          const errC = r.error > 0 ? C.red : '';
          const critC = r.critical > 0 ? `${C.bgRed}${C.white}` : '';
          console.log(
            `${C.blue}${t.padEnd(24)}${C.reset}` +
            ` ${String(r.total).padStart(6)}` +
            ` ${C.green}${String(r.info).padStart(6)}${C.reset}` +
            ` ${warnC}${String(r.warn).padStart(6)}${C.reset}` +
            ` ${errC}${String(r.error).padStart(6)}${C.reset}` +
            ` ${critC}${String(r.critical).padStart(6)}${C.reset}`
          );
        }
        const totals = types.reduce(
          (acc, t) => {
            acc.total += s[t].total;
            acc.info += s[t].info;
            acc.warn += s[t].warn;
            acc.error += s[t].error;
            acc.critical += s[t].critical;
            return acc;
          },
          { total: 0, info: 0, warn: 0, error: 0, critical: 0 }
        );
        console.log(`${C.dim}${'─'.repeat(60)}${C.reset}`);
        console.log(
          `${C.bold}${'TOTAL'.padEnd(24)}${C.reset}` +
          ` ${C.bold}${String(totals.total).padStart(6)}${C.reset}` +
          ` ${C.green}${String(totals.info).padStart(6)}${C.reset}` +
          ` ${C.yellow}${String(totals.warn).padStart(6)}${C.reset}` +
          ` ${C.red}${String(totals.error).padStart(6)}${C.reset}` +
          ` ${LEVEL_COLOR.critical}${String(totals.critical).padStart(6)}${C.reset}`
        );
      }
      return;
    }

    // No valid flag - show usage
    console.log(`${C.bold}NAVADA Edge Logger${C.reset} - DynamoDB event logging\n`);
    console.log('Usage:');
    console.log('  node edge-logger.js --test                  Insert a test log entry');
    console.log('  node edge-logger.js --tail HP               Last 20 logs for HP');
    console.log('  node edge-logger.js --tail-all              Last 50 across all nodes');
    console.log('  node edge-logger.js --type error --limit 10 Query by event type');
    console.log('  node edge-logger.js --stats                 Counts by event type');
    console.log('\nModule usage:');
    console.log("  const logger = require('./edge-logger');");
    console.log("  await logger.log({ node: 'HP', eventType: 'pm2.restart', ... });");
  }

  runCli().catch((err) => {
    console.error(`${C.red}Fatal: ${err.message}${C.reset}`);
    process.exit(1);
  });
}
