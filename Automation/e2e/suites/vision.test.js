/**
 * Suite E: Vision Pipeline Tests — YOLO + annotate + Vision API
 * Schedule: every 6 hours
 */

const { request } = require('../lib/http');
const { assertOk, assertStatusCode } = require('../lib/assert');
const config = require('../config');

// 1x1 transparent PNG for minimal test payloads
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==', 'base64');

async function run() {
  const results = [];
  const start = Date.now();
  const BASE = config.compute.baseUrl;
  const KEY = config.compute.apiKey;

  // 1. Vision API Lambda status
  const visionStatus = await request('https://xxqtcilmzi.execute-api.eu-west-2.amazonaws.com/vision/status', { timeout: 15000 });
  results.push({ test: 'Vision Lambda reachable', ...assertOk(visionStatus.status > 0, `Vision API HTTP ${visionStatus.status}`) });

  // 2. EC2 /yolo endpoint reachable
  const yoloCheck = await request(`${BASE}/yolo`, {
    method: 'POST',
    headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: TINY_PNG.toString('base64'), chatId: '0' }),
    timeout: 15000,
  });
  results.push({ test: '/yolo endpoint reachable', ...assertOk(yoloCheck.status > 0, `/yolo HTTP ${yoloCheck.status}`) });

  // 3. EC2 /annotate endpoint reachable
  const annotateCheck = await request(`${BASE}/annotate`, {
    method: 'POST',
    headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: TINY_PNG.toString('base64'), detections: [] }),
    timeout: 10000,
  });
  results.push({ test: '/annotate endpoint reachable', ...assertOk(annotateCheck.status > 0, `/annotate HTTP ${annotateCheck.status}`) });

  // 4. SageMaker endpoint (warm check via Lambda)
  const sagemakerCheck = await request('https://xxqtcilmzi.execute-api.eu-west-2.amazonaws.com/vision/detect', {
    method: 'POST',
    body: JSON.stringify({ image: TINY_PNG.toString('base64'), type: 'yolo' }),
    timeout: 90000,  // SageMaker cold start can take 60s
  });
  results.push({ test: 'SageMaker YOLO responds', ...assertOk(sagemakerCheck.status > 0, `SageMaker HTTP ${sagemakerCheck.status}`), latencyMs: sagemakerCheck.latencyMs });

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const errors = results.filter(r => !r.pass).map(r => ({ test: r.test, error: r.error, latencyMs: r.latencyMs || 0 }));

  return { suite: 'vision', total: results.length, passed, failed, errors, duration: Date.now() - start };
}

module.exports = { run };
