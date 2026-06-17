const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const indexFile = path.join(distDir, 'index.html');
const fallbackFile = path.join(distDir, '404.html');

if (!fs.existsSync(indexFile)) {
  console.error('Build output not found: frontend/dist/index.html');
  process.exit(1);
}

fs.copyFileSync(indexFile, fallbackFile);
console.log('Copied index.html to 404.html for SPA fallback.');
