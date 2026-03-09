/**
 * NAVADA Incident FBI Agent (Lambda)
 * Second-tier autonomous investigator for infrastructure incidents.
 * Uses Bedrock Claude to reason about failures and execute fixes.
 *
 * Invoked by EC2 health monitor when a service fails.
 * Flow: Analyse → Investigate → Fix → Log → Escalate if unresolved.
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';

const REGION = 'eu-west-2';
const bedrock = new BedrockRuntimeClient({ region: REGION });
const dynamo = new DynamoDBClient({ region: REGION });
const cw = new CloudWatchClient({ region: REGION });

const TABLE = 'navada-incidents';
const MODEL_ID = 'anthropic.claude-sonnet-4-6-20250514-v1:0';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_OWNER_ID = process.env.TELEGRAM_OWNER_ID;

// Node SSH details (for context, not direct SSH from Lambda)
const NODES = {
  HP: { ip: '100.121.187.67', role: 'Production Server', os: 'Windows 11 Pro', services: ['telegram-bot', 'navada-flix', 'hp-cloudwatch-metrics', 'cloudflare-metrics', 'cloudwatch-logs'] },
  Oracle: { ip: '100.77.206.9', role: 'Docker Host', os: 'Ubuntu', services: ['navada-proxy', 'navada-tunnel', 'navada-grafana', 'navada-prometheus', 'navada-portainer', 'cloudbeaver'] },
  EC2: { ip: '100.98.118.33', role: 'Health Monitor + Dashboards', os: 'Ubuntu', services: ['ec2-health-monitor', 'worldmonitor', 'worldview-monitor', 'navada-dashboard', 'cloudwatch-dashboard-updater'] },
};

// Known fix patterns
const FIX_PATTERNS = {
  'Timeout': { severity: 'low', action: 'monitor', description: 'Transient timeout - likely network blip or momentary load spike' },
  'Ping failed': { severity: 'high', action: 'investigate', description: 'Node unreachable - possible network or power issue' },
  'HTTP 502': { severity: 'medium', action: 'restart', description: 'Bad gateway - upstream service crashed or not responding' },
  'HTTP 503': { severity: 'medium', action: 'restart', description: 'Service unavailable - process likely down' },
  'HTTP 500': { severity: 'medium', action: 'investigate', description: 'Internal server error - application bug or resource exhaustion' },
  'ECONNREFUSED': { severity: 'high', action: 'restart', description: 'Connection refused - service not running' },
  'ECONNRESET': { severity: 'low', action: 'monitor', description: 'Connection reset - transient network issue' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getRecentMetrics(namespace, metricName, minutes = 30) {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - minutes * 60 * 1000);
    const res = await cw.send(new GetMetricStatisticsCommand({
      Namespace: namespace,
      MetricName: metricName,
      StartTime: start,
      EndTime: end,
      Period: 300,
      Statistics: ['Average', 'Maximum'],
    }));
    return res.Datapoints?.sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp)) || [];
  } catch { return []; }
}

async function getRecentIncidents(node, hours = 24) {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const res = await dynamo.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'pk = :pk AND sk > :sk',
      ExpressionAttributeValues: {
        ':pk': { S: `NODE#${node}` },
        ':sk': { S: `INC#${since}` },
      },
      ScanIndexForward: false,
      Limit: 10,
    }));
    return res.Items?.map(i => ({
      time: i.sk?.S?.replace('INC#', '').split('#')[0],
      service: i.service?.S,
      error: i.error?.S,
      severity: i.severity?.S,
      action: i.action?.S,
      resolution: i.resolution?.S,
      status: i.status?.S,
    })) || [];
  } catch { return []; }
}

async function askClaude(prompt) {
  try {
    const res = await bedrock.send(new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        system: `You are the NAVADA FBI Agent - an autonomous infrastructure investigator. You analyse service failures and recommend precise fixes. Be concise and actionable. Respond in JSON format: { "severity": "low|medium|high|critical", "diagnosis": "brief diagnosis", "rootCause": "likely root cause", "action": "monitor|restart|investigate|failover|escalate", "fixCommand": "exact command to run or null", "fixNode": "HP|Oracle|EC2 or null", "confidence": 0.0-1.0, "escalate": true/false, "reason": "why escalate or not" }`,
      }),
    }));
    const body = JSON.parse(new TextDecoder().decode(res.body));
    const text = body.content?.[0]?.text || '{}';
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { action: 'escalate', diagnosis: 'Could not parse response', escalate: true };
  } catch (err) {
    console.error('Bedrock error:', err.message);
    return { action: 'escalate', diagnosis: `Bedrock error: ${err.message}`, escalate: true, severity: 'medium' };
  }
}

async function logIncident(incident) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ttl = Math.floor(Date.now() / 1000) + 90 * 86400; // 90 days
  const item = {
    pk: { S: `NODE#${incident.node}` },
    sk: { S: `INC#${incident.timestamp}#${id}` },
    service: { S: incident.service },
    error: { S: incident.error },
    severity: { S: incident.severity || 'unknown' },
    action: { S: incident.action || 'none' },
    diagnosis: { S: incident.diagnosis || '' },
    rootCause: { S: incident.rootCause || '' },
    fixCommand: { S: incident.fixCommand || '' },
    fixNode: { S: incident.fixNode || '' },
    resolution: { S: incident.resolution || 'pending' },
    status: { S: incident.status || 'open' },
    confidence: { N: String(incident.confidence || 0) },
    ttl: { N: String(ttl) },
  };
  await dynamo.send(new PutItemCommand({ TableName: TABLE, Item: item }));
  return id;
}

async function sendTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_OWNER_ID) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_OWNER_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    const data = await res.json();
    if (!data.ok) console.error('Telegram error:', data.description);
  } catch (err) {
    console.error('Telegram send failed:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Main Investigation Handler
// ---------------------------------------------------------------------------
export async function handler(event) {
  console.log('FBI Agent invoked:', JSON.stringify(event));

  const incidents = Array.isArray(event.incidents) ? event.incidents : [event];
  const results = [];

  for (const inc of incidents) {
    const { node, service, error, group, timestamp, consecutiveFails } = inc;
    console.log(`\nInvestigating: ${service} (${node}) - ${error}`);

    // 1. Quick pattern match
    const pattern = Object.entries(FIX_PATTERNS).find(([key]) => error?.includes(key));
    const quickMatch = pattern ? pattern[1] : null;

    // 2. Check if this is a repeat incident (same service failed recently)
    const recentIncidents = await getRecentIncidents(node, 4);
    const sameServiceRecent = recentIncidents.filter(i => i.service === service);
    const isRepeat = sameServiceRecent.length > 0;
    const repeatCount = sameServiceRecent.length;

    // 3. Gather context for Claude
    let metricsContext = '';
    if (node === 'HP') {
      const cpu = await getRecentMetrics('NAVADA/HP', 'SystemCPU');
      const mem = await getRecentMetrics('NAVADA/HP', 'SystemMemoryPercent');
      if (cpu.length) metricsContext += `HP CPU (last 30min): avg=${cpu.map(d => d.Average?.toFixed(1)).join(', ')}%\n`;
      if (mem.length) metricsContext += `HP Memory (last 30min): avg=${mem.map(d => d.Average?.toFixed(1)).join(', ')}%\n`;
    } else if (node === 'Oracle') {
      const cpu = await getRecentMetrics('NAVADA/Oracle', 'HostCPU');
      const mem = await getRecentMetrics('NAVADA/Oracle', 'HostMemoryPercent');
      if (cpu.length) metricsContext += `Oracle CPU (last 30min): avg=${cpu.map(d => d.Average?.toFixed(1)).join(', ')}%\n`;
      if (mem.length) metricsContext += `Oracle Memory (last 30min): avg=${mem.map(d => d.Average?.toFixed(1)).join(', ')}%\n`;
    }

    // 4. If transient timeout with low consecutive fails, auto-resolve
    if (quickMatch?.action === 'monitor' && (consecutiveFails || 1) <= 1) {
      const result = {
        node, service, error, timestamp: timestamp || new Date().toISOString(),
        severity: 'low', action: 'monitor', diagnosis: quickMatch.description,
        rootCause: 'Transient', fixCommand: '', fixNode: '',
        resolution: 'auto-resolved (transient)', status: 'resolved', confidence: 0.9,
      };
      await logIncident(result);
      results.push(result);
      console.log(`  → Auto-resolved: ${quickMatch.description}`);
      continue;
    }

    // 5. Ask Claude for deep investigation
    const prompt = `NAVADA Infrastructure Incident:
- Service: ${service}
- Node: ${node} (${NODES[node]?.role || 'unknown'}, ${NODES[node]?.os || 'unknown'})
- Error: ${error}
- Consecutive failures: ${consecutiveFails || 'unknown'}
- Time: ${timestamp || new Date().toISOString()}
- Is repeat incident: ${isRepeat} (${repeatCount} times in last 4 hours)
${metricsContext ? `\nRecent Metrics:\n${metricsContext}` : ''}
${sameServiceRecent.length ? `\nPrevious incidents for this service:\n${sameServiceRecent.map(i => `  ${i.time}: ${i.error} → ${i.action} → ${i.resolution}`).join('\n')}` : ''}

Node services: ${JSON.stringify(NODES[node]?.services || [])}

Known services on ${node}: ${node === 'HP' ? 'PM2 managed (pm2 restart <name>)' : node === 'Oracle' ? 'Docker containers (docker restart <name>)' : 'PM2 managed'}

Investigate this failure. Consider: Is it transient? Resource exhaustion? Service crash? Network issue? What is the precise fix?`;

    const analysis = await askClaude(prompt);
    console.log(`  → Claude analysis:`, JSON.stringify(analysis));

    // 6. Execute fix if confidence is high enough and action is clear
    let resolution = 'pending';
    if (analysis.confidence >= 0.7 && analysis.fixCommand && analysis.fixNode) {
      // We log the recommended fix but DON'T execute from Lambda (no SSH access)
      // Instead, we write a fix file that EC2 picks up and executes
      resolution = `fix-queued: ${analysis.fixCommand}`;
    } else if (analysis.action === 'monitor') {
      resolution = 'monitoring - no action needed';
    } else {
      resolution = 'needs-investigation';
    }

    const shouldEscalate = analysis.escalate ||
      analysis.severity === 'critical' ||
      (repeatCount >= 3 && analysis.action !== 'monitor');

    const result = {
      node, service, error, timestamp: timestamp || new Date().toISOString(),
      severity: analysis.severity || 'medium',
      action: analysis.action || 'investigate',
      diagnosis: analysis.diagnosis || '',
      rootCause: analysis.rootCause || '',
      fixCommand: analysis.fixCommand || '',
      fixNode: analysis.fixNode || '',
      resolution,
      status: shouldEscalate ? 'escalated' : (resolution.includes('auto') || resolution.includes('monitor')) ? 'resolved' : 'fix-queued',
      confidence: analysis.confidence || 0,
    };

    await logIncident(result);
    results.push(result);

    // 7. Only escalate to Lee if truly needed
    if (shouldEscalate) {
      await sendTelegram(
        `<b>FBI ESCALATION</b>\n\n` +
        `<b>Service:</b> ${service} (${node})\n` +
        `<b>Error:</b> ${error}\n` +
        `<b>Severity:</b> ${analysis.severity?.toUpperCase()}\n` +
        `<b>Diagnosis:</b> ${analysis.diagnosis}\n` +
        `<b>Root Cause:</b> ${analysis.rootCause}\n` +
        `<b>Recommended Fix:</b> ${analysis.fixCommand || 'Manual investigation needed'}\n` +
        `<b>Repeat Count:</b> ${repeatCount}x in 4hrs\n` +
        `<b>Reason for Escalation:</b> ${analysis.reason || 'High severity or repeated failure'}\n\n` +
        `<i>FBI Agent could not auto-resolve this. Please investigate.</i>`
      );
    }
  }

  // Return fix commands for EC2 to execute
  const fixes = results
    .filter(r => r.status === 'fix-queued' && r.fixCommand)
    .map(r => ({ node: r.fixNode, command: r.fixCommand, service: r.service, incidentId: r.timestamp }));

  return {
    statusCode: 200,
    body: {
      investigated: results.length,
      resolved: results.filter(r => r.status === 'resolved').length,
      fixQueued: fixes.length,
      escalated: results.filter(r => r.status === 'escalated').length,
      fixes,
      results,
    },
  };
}
