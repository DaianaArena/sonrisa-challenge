const https = require('https');
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(process.cwd(), 'public', 'models');

const MODEL_FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

async function downloadFile(filename) {
  const filePath = path.join(modelsDir, filename);
  const file = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    https.get(`${BASE_URL}/${filename}`, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

async function downloadModels() {
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  for (const file of MODEL_FILES) {
    await downloadFile(file);
  }
}

downloadModels().catch(console.error); 