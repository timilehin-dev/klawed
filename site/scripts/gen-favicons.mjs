import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svg = readFileSync(join(publicDir, 'favicon.svg'));

// 512px PNG favicon
const buf512 = await sharp(svg, { density: 300 })
  .resize(512, 512)
  .png()
  .toBuffer();
writeFileSync(join(publicDir, 'favicon-512.png'), buf512);

// 180px apple-touch-icon
const buf180 = await sharp(svg, { density: 300 })
  .resize(180, 180)
  .png()
  .toBuffer();
writeFileSync(join(publicDir, 'apple-touch-icon.png'), buf180);

console.log('Generated favicon-512.png and apple-touch-icon.png');
