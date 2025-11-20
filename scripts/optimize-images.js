/*
 Image optimization script.
 Converts large PNG/JPG assets in public/assets to WebP and AVIF, skipping existing small files.
 Usage: yarn img:optimize
*/

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = path.join(process.cwd(), 'public', 'assets');
const OUT_DIR = path.join(SRC_DIR, 'optimized');
const SIZE_THRESHOLD = 120 * 1024; // Only optimize >120KB
const TARGETS = ['.png', '.jpg', '.jpeg'];

if (!fs.existsSync(SRC_DIR)) {
  console.error('Source directory not found:', SRC_DIR);
  process.exit(1);
}
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

function getFiles(dir) {
  return fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isFile());
}

(async () => {
  const files = getFiles(SRC_DIR).filter(f => TARGETS.includes(path.extname(f).toLowerCase()));
  const report = [];
  for (const file of files) {
    const full = path.join(SRC_DIR, file);
    const stat = fs.statSync(full);
    if (stat.size < SIZE_THRESHOLD) continue; // Skip small files
    const base = path.parse(file).name;

    const buf = fs.readFileSync(full);

    // WebP
    const webpOut = path.join(OUT_DIR, base + '.webp');
    try {
      await sharp(buf).webp({ quality: 72 }).toFile(webpOut);
    } catch (e) {
      console.warn('WebP failed for', file, e.message);
    }

    // AVIF
    const avifOut = path.join(OUT_DIR, base + '.avif');
    try {
      await sharp(buf).avif({ quality: 50 }).toFile(avifOut);
    } catch (e) {
      console.warn('AVIF failed for', file, e.message);
    }

    const webpSize = fs.existsSync(webpOut) ? fs.statSync(webpOut).size : 0;
    const avifSize = fs.existsSync(avifOut) ? fs.statSync(avifOut).size : 0;
    report.push({ file, originalKB: (stat.size/1024).toFixed(1), webpKB: (webpSize/1024).toFixed(1), avifKB: (avifSize/1024).toFixed(1) });
  }

  console.table(report);
  console.log('Optimized files written to', OUT_DIR);
  console.log('Next step: update imports / <Image> components to use .webp or .avif where supported, with fallback to original.');
})();
