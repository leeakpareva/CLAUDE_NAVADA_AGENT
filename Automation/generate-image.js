const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR);

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateImage(prompt, filename) {
  console.log(`Generating: "${prompt}"...`);

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  });

  const imageUrl = response.data[0].url;
  const revisedPrompt = response.data[0].revised_prompt;
  const outName = filename || `image-${Date.now()}.png`;
  const outPath = path.join(SCREENSHOTS_DIR, outName);

  await new Promise((resolve, reject) => {
    https.get(imageUrl, (res) => {
      const stream = fs.createWriteStream(outPath);
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(); });
    }).on('error', reject);
  });

  console.log(`Saved: ${outPath}`);
  console.log(`Revised prompt: ${revisedPrompt}`);
  return outPath;
}

const prompt = process.argv.slice(2).join(' ') || 'a red lion with wings';
generateImage(prompt).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
