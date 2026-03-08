/**
 * NAVADA Vision Router — API Gateway entry point
 * Routes /vision/* requests to appropriate handlers
 * X-Ray traced, CloudWatch logged
 */

import { RekognitionClient, DetectLabelsCommand, DetectFacesCommand, IndexFacesCommand, SearchFacesByImageCommand, ListFacesCommand, RecognizeCelebritiesCommand } from '@aws-sdk/client-rekognition';
import { DynamoDBClient, PutItemCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { SageMakerRuntimeClient, InvokeEndpointCommand } from '@aws-sdk/client-sagemaker-runtime';

const REGION = 'eu-west-2';
const FACE_COLLECTION = 'navada-faces';
const VISION_BUCKET = 'navada-vision-eu-west-2';
const FACES_TABLE = 'navada-faces';
const VISION_LOG_TABLE = 'navada-vision-log';

const rekognition = new RekognitionClient({ region: REGION });
const dynamo = new DynamoDBClient({ region: REGION });
const s3 = new S3Client({ region: REGION });
const bedrock = new BedrockRuntimeClient({ region: REGION });
const sagemakerRuntime = new SageMakerRuntimeClient({ region: REGION });
const YOLO_ENDPOINT = 'navada-yolov8n';

export const handler = async (event) => {
  const path = event.rawPath || event.path || '';
  const method = event.requestContext?.http?.method || event.httpMethod || 'POST';
  const body = event.body ? (event.isBase64Encoded ? JSON.parse(Buffer.from(event.body, 'base64').toString()) : JSON.parse(event.body)) : {};

  console.log(`[NAVADA Vision] ${method} ${path}`, JSON.stringify({ action: body.action }));

  try {
    // Route based on path
    if (path.includes('/vision/yolo')) {
      return await handleYolo(body);
    } else if (path.includes('/vision/detect')) {
      return await handleDetect(body);
    } else if (path.includes('/vision/faces')) {
      return await handleFaces(body);
    } else if (path.includes('/vision/analyse')) {
      return await handleAnalyse(body);
    } else if (path.includes('/vision/status')) {
      return respond(200, await getStatus());
    } else {
      return respond(200, {
        service: 'NAVADA Vision AI',
        version: '1.0.0',
        endpoints: [
          'POST /vision/yolo — YOLOv8 object detection (SageMaker)',
          'POST /vision/detect — Detect objects + faces in image',
          'POST /vision/faces — Index, search, list faces',
          'POST /vision/analyse — Claude AI scene analysis',
          'GET  /vision/status — Service status + stats',
        ],
      });
    }
  } catch (err) {
    console.error('[NAVADA Vision] Error:', err);
    return respond(500, { error: err.message });
  }
};

// ── Detect objects + faces ──────────────────────────────────────────────────

async function handleDetect(body) {
  const { imageBase64, s3Key, includeLabels = true, includeFaces = true, includeCelebrities = false } = body;

  if (!imageBase64 && !s3Key) {
    return respond(400, { error: 'Provide imageBase64 or s3Key' });
  }

  const imageParam = s3Key
    ? { S3Object: { Bucket: VISION_BUCKET, Name: s3Key } }
    : { Bytes: Buffer.from(imageBase64, 'base64') };

  const results = {};
  const promises = [];

  if (includeLabels) {
    promises.push(
      rekognition.send(new DetectLabelsCommand({
        Image: imageParam,
        MaxLabels: 30,
        MinConfidence: 70,
      })).then(r => { results.labels = r.Labels.map(l => ({ name: l.Name, confidence: Math.round(l.Confidence * 10) / 10, parents: l.Parents?.map(p => p.Name) || [], instances: l.Instances?.length || 0 })); })
    );
  }

  if (includeFaces) {
    promises.push(
      rekognition.send(new DetectFacesCommand({
        Image: imageParam,
        Attributes: ['ALL'],
      })).then(r => { results.faces = r.FaceDetails.map(f => ({ confidence: Math.round(f.Confidence * 10) / 10, ageRange: f.AgeRange, gender: f.Gender, emotions: f.Emotions?.filter(e => e.Confidence > 50).map(e => ({ type: e.Type, confidence: Math.round(e.Confidence) })), smile: f.Smile?.Value, eyeglasses: f.Eyeglasses?.Value, sunglasses: f.Sunglasses?.Value, beard: f.Beard?.Value, mustache: f.Mustache?.Value, eyesOpen: f.EyesOpen?.Value, mouthOpen: f.MouthOpen?.Value, boundingBox: f.BoundingBox })); })
    );
  }

  if (includeCelebrities) {
    promises.push(
      rekognition.send(new RecognizeCelebritiesCommand({
        Image: imageParam,
      })).then(r => { results.celebrities = r.CelebrityFaces?.map(c => ({ name: c.Name, confidence: Math.round(c.MatchConfidence), urls: c.Urls })) || []; })
    );
  }

  await Promise.all(promises);

  // Store in S3 if base64 provided
  let storedKey = s3Key;
  if (imageBase64 && !s3Key) {
    storedKey = `detections/${Date.now()}.jpg`;
    await s3.send(new PutObjectCommand({
      Bucket: VISION_BUCKET,
      Key: storedKey,
      Body: Buffer.from(imageBase64, 'base64'),
      ContentType: 'image/jpeg',
    }));
  }

  // Log to DynamoDB
  const imageId = storedKey || `inline-${Date.now()}`;
  await dynamo.send(new PutItemCommand({
    TableName: VISION_LOG_TABLE,
    Item: {
      imageId: { S: imageId },
      timestamp: { S: new Date().toISOString() },
      type: { S: 'detect' },
      labelCount: { N: String(results.labels?.length || 0) },
      faceCount: { N: String(results.faces?.length || 0) },
      topLabels: { S: JSON.stringify((results.labels || []).slice(0, 5).map(l => l.name)) },
      source: { S: 'api' },
    },
  }));

  results.imageId = imageId;
  results.storedKey = storedKey;
  return respond(200, results);
}

// ── Face operations ─────────────────────────────────────────────────────────

async function handleFaces(body) {
  const { action } = body;

  switch (action) {
    case 'index': return await indexFace(body);
    case 'search': return await searchFace(body);
    case 'list': return await listFaces(body);
    default: return respond(400, { error: 'action must be: index, search, list' });
  }
}

async function indexFace({ imageBase64, s3Key, name, tags }) {
  if (!imageBase64 && !s3Key) return respond(400, { error: 'Provide imageBase64 or s3Key' });
  if (!name) return respond(400, { error: 'Provide name for face' });

  const imageParam = s3Key
    ? { S3Object: { Bucket: VISION_BUCKET, Name: s3Key } }
    : { Bytes: Buffer.from(imageBase64, 'base64') };

  // Store image in S3
  let storedKey = s3Key;
  if (imageBase64 && !s3Key) {
    storedKey = `faces/${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
    await s3.send(new PutObjectCommand({
      Bucket: VISION_BUCKET,
      Key: storedKey,
      Body: Buffer.from(imageBase64, 'base64'),
      ContentType: 'image/jpeg',
    }));
  }

  // Index in Rekognition
  const result = await rekognition.send(new IndexFacesCommand({
    CollectionId: FACE_COLLECTION,
    Image: imageParam,
    ExternalImageId: name.replace(/\s+/g, '_'),
    DetectionAttributes: ['ALL'],
    MaxFaces: 1,
    QualityFilter: 'AUTO',
  }));

  const indexed = result.FaceRecords?.[0];
  if (!indexed) return respond(400, { error: 'No face detected in image' });

  const faceId = indexed.Face.FaceId;

  // Store metadata in DynamoDB
  await dynamo.send(new PutItemCommand({
    TableName: FACES_TABLE,
    Item: {
      faceId: { S: faceId },
      name: { S: name },
      externalImageId: { S: name.replace(/\s+/g, '_') },
      s3Key: { S: storedKey || '' },
      confidence: { N: String(Math.round(indexed.Face.Confidence * 10) / 10) },
      tags: { S: JSON.stringify(tags || []) },
      indexedAt: { S: new Date().toISOString() },
      ageRange: { S: JSON.stringify(indexed.FaceDetail?.AgeRange || {}) },
      gender: { S: indexed.FaceDetail?.Gender?.Value || 'unknown' },
    },
  }));

  // Log
  await dynamo.send(new PutItemCommand({
    TableName: VISION_LOG_TABLE,
    Item: {
      imageId: { S: storedKey || faceId },
      timestamp: { S: new Date().toISOString() },
      type: { S: 'face-index' },
      faceCount: { N: '1' },
      labelCount: { N: '0' },
      topLabels: { S: JSON.stringify([name]) },
      source: { S: 'api' },
    },
  }));

  return respond(200, {
    faceId,
    name,
    confidence: Math.round(indexed.Face.Confidence * 10) / 10,
    s3Key: storedKey,
    ageRange: indexed.FaceDetail?.AgeRange,
    gender: indexed.FaceDetail?.Gender?.Value,
  });
}

async function searchFace({ imageBase64, s3Key, maxResults = 5, threshold = 80 }) {
  if (!imageBase64 && !s3Key) return respond(400, { error: 'Provide imageBase64 or s3Key' });

  const imageParam = s3Key
    ? { S3Object: { Bucket: VISION_BUCKET, Name: s3Key } }
    : { Bytes: Buffer.from(imageBase64, 'base64') };

  const result = await rekognition.send(new SearchFacesByImageCommand({
    CollectionId: FACE_COLLECTION,
    Image: imageParam,
    MaxFaces: maxResults,
    FaceMatchThreshold: threshold,
  }));

  // Enrich with DynamoDB metadata
  const matches = [];
  for (const match of result.FaceMatches || []) {
    const faceId = match.Face.FaceId;
    const meta = await dynamo.send(new QueryCommand({
      TableName: FACES_TABLE,
      KeyConditionExpression: 'faceId = :fid',
      ExpressionAttributeValues: { ':fid': { S: faceId } },
    }));

    const item = meta.Items?.[0];
    matches.push({
      faceId,
      similarity: Math.round(match.Similarity * 10) / 10,
      name: item?.name?.S || match.Face.ExternalImageId || 'unknown',
      tags: item?.tags?.S ? JSON.parse(item.tags.S) : [],
      indexedAt: item?.indexedAt?.S,
      gender: item?.gender?.S,
    });
  }

  return respond(200, {
    searchedFace: result.SearchedFaceBoundingBox,
    matchCount: matches.length,
    matches,
  });
}

async function listFaces({ maxResults = 50 }) {
  const result = await rekognition.send(new ListFacesCommand({
    CollectionId: FACE_COLLECTION,
    MaxResults: maxResults,
  }));

  // Enrich with DynamoDB
  const faces = [];
  for (const face of result.Faces || []) {
    const meta = await dynamo.send(new QueryCommand({
      TableName: FACES_TABLE,
      KeyConditionExpression: 'faceId = :fid',
      ExpressionAttributeValues: { ':fid': { S: face.FaceId } },
    }));
    const item = meta.Items?.[0];
    faces.push({
      faceId: face.FaceId,
      name: item?.name?.S || face.ExternalImageId || 'unknown',
      confidence: Math.round(face.Confidence * 10) / 10,
      indexedAt: item?.indexedAt?.S,
      gender: item?.gender?.S,
      tags: item?.tags?.S ? JSON.parse(item.tags.S) : [],
    });
  }

  return respond(200, { count: faces.length, faces });
}

// ── Claude analysis ─────────────────────────────────────────────────────────

async function handleAnalyse(body) {
  const { imageBase64, s3Key, prompt } = body;

  if (!imageBase64 && !s3Key) return respond(400, { error: 'Provide imageBase64 or s3Key' });

  // If s3Key, fetch the image
  let base64 = imageBase64;
  if (s3Key && !imageBase64) {
    const obj = await s3.send(new GetObjectCommand({ Bucket: VISION_BUCKET, Key: s3Key }));
    const chunks = [];
    for await (const chunk of obj.Body) chunks.push(chunk);
    base64 = Buffer.concat(chunks).toString('base64');
  }

  const userPrompt = prompt || 'Describe this image in detail. Identify all objects, people, text, and notable features. Be concise but thorough.';

  const bedrockBody = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
        { type: 'text', text: userPrompt },
      ],
    }],
  });

  const result = await bedrock.send(new InvokeModelCommand({
    modelId: 'anthropic.claude-sonnet-4-6',
    contentType: 'application/json',
    accept: 'application/json',
    body: bedrockBody,
  }));

  const response = JSON.parse(new TextDecoder().decode(result.body));
  const analysis = response.content?.[0]?.text || '';

  // Log
  const imageId = s3Key || `analyse-${Date.now()}`;
  await dynamo.send(new PutItemCommand({
    TableName: VISION_LOG_TABLE,
    Item: {
      imageId: { S: imageId },
      timestamp: { S: new Date().toISOString() },
      type: { S: 'analyse' },
      labelCount: { N: '0' },
      faceCount: { N: '0' },
      topLabels: { S: JSON.stringify([]) },
      source: { S: 'api' },
    },
  }));

  return respond(200, { analysis, model: 'claude-sonnet-4-6', imageId });
}

// ── YOLO detection ───────────────────────────────────────────────────────────

async function handleYolo(body) {
  const { imageBase64, s3Key, confidence = 0.25, maxDetections = 50 } = body;

  if (!imageBase64 && !s3Key) return respond(400, { error: 'Provide imageBase64 or s3Key' });

  let base64 = imageBase64;
  if (s3Key && !imageBase64) {
    const obj = await s3.send(new GetObjectCommand({ Bucket: VISION_BUCKET, Key: s3Key }));
    const chunks = [];
    for await (const chunk of obj.Body) chunks.push(chunk);
    base64 = Buffer.concat(chunks).toString('base64');
  }

  const payload = JSON.stringify({ imageBase64: base64, confidence, maxDetections });

  const result = await sagemakerRuntime.send(new InvokeEndpointCommand({
    EndpointName: YOLO_ENDPOINT,
    ContentType: 'application/json',
    Body: payload,
  }));

  const response = JSON.parse(new TextDecoder().decode(result.Body));

  // Log to DynamoDB
  const imageId = s3Key || `yolo-${Date.now()}`;
  await dynamo.send(new PutItemCommand({
    TableName: VISION_LOG_TABLE,
    Item: {
      imageId: { S: imageId },
      timestamp: { S: new Date().toISOString() },
      type: { S: 'yolo' },
      labelCount: { N: String(response.detectionCount || 0) },
      faceCount: { N: '0' },
      topLabels: { S: JSON.stringify((response.detections || []).slice(0, 5).map(d => d.class)) },
      source: { S: 'api' },
    },
  }));

  response.imageId = imageId;
  return respond(200, response);
}

// ── Status ──────────────────────────────────────────────────────────────────

async function getStatus() {
  const collectionInfo = await rekognition.send(
    new (await import('@aws-sdk/client-rekognition')).DescribeCollectionCommand({ CollectionId: FACE_COLLECTION })
  ).catch(() => null);

  const logCount = await dynamo.send(new ScanCommand({
    TableName: VISION_LOG_TABLE,
    Select: 'COUNT',
  })).catch(() => ({ Count: 0 }));

  return {
    service: 'NAVADA Vision AI',
    status: 'operational',
    region: REGION,
    faceCollection: FACE_COLLECTION,
    facesIndexed: collectionInfo?.FaceCount || 0,
    imagesProcessed: logCount.Count || 0,
    capabilities: ['object-detection', 'face-detection', 'face-indexing', 'face-search', 'celebrity-recognition', 'scene-analysis', 'yolo-detection'],
    yoloEndpoint: YOLO_ENDPOINT,
    models: ['rekognition-v7', 'claude-sonnet-4-6', 'yolov8n (sagemaker-serverless)'],
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
