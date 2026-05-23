import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Recolor the brand symbol (public/brand/symbol.png — navy + red book) into a
 * gold silhouette, composite onto a warm brown gradient, and emit favicons at
 * the sizes Next.js / iOS / Android expect.
 *
 * Pipeline (high-res first, downscale per output to preserve crispness):
 *   1. Load symbol.png and use its alpha as a mask.
 *   2. Composite a gold gradient INTO that mask (blend: 'dest-in') → solid
 *      gold book shape.
 *   3. Composite the gold shape ONTO a brown-gradient rounded square.
 *   4. Resize the master image to each output size.
 *
 * Run with:  pnpm dlx tsx scripts/generate-favicons.mjs
 *            (or: node --experimental-modules scripts/generate-favicons.mjs)
 */

const SOURCE = "public/brand/symbol.png";
const MASTER_SIZE = 1024;
const BOOK_INSET = 0.16; // 16% padding around the book inside the rounded square

const OUTPUTS = [
  { path: "app/icon.png", size: 64 },
  { path: "app/apple-icon.png", size: 180 },
  { path: "public/icon-192.png", size: 192 },
  { path: "public/icon-512.png", size: 512 },
];

function brownGradientSvg(size) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs>
        <linearGradient id="g" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#3d2e20"/>
          <stop offset="100%" stop-color="#1a1108"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#g)"/>
    </svg>
  `);
}

function goldGradientSvg(size) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f1c64a"/>
          <stop offset="50%" stop-color="#d4a017"/>
          <stop offset="100%" stop-color="#a07410"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#g)"/>
    </svg>
  `);
}

async function buildMaster() {
  const bookSize = Math.round(MASTER_SIZE * (1 - BOOK_INSET * 2));
  const offset = Math.round((MASTER_SIZE - bookSize) / 2);

  // 1. Get the symbol resized to bookSize (transparent background preserved).
  const symbolResized = await sharp(SOURCE)
    .resize(bookSize, bookSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // 2. Composite gold gradient INTO the symbol's alpha shape (dest-in keeps
  //    gold pixels only where the symbol's alpha is non-zero).
  const goldGradient = await sharp(goldGradientSvg(bookSize)).png().toBuffer();
  const goldBook = await sharp(goldGradient)
    .composite([{ input: symbolResized, blend: "dest-in" }])
    .png()
    .toBuffer();

  // 3. Composite gold book onto brown gradient rounded square.
  const bg = await sharp(brownGradientSvg(MASTER_SIZE)).png().toBuffer();
  const master = await sharp(bg)
    .composite([{ input: goldBook, top: offset, left: offset }])
    .png()
    .toBuffer();

  return master;
}

async function main() {
  const master = await buildMaster();
  for (const { path, size } of OUTPUTS) {
    mkdirSync(dirname(path), { recursive: true });
    await sharp(master).resize(size, size).png({ compressionLevel: 9 }).toFile(path);
    console.log(`✓ ${path} (${size}×${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
