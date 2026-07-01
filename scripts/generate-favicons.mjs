import sharp from "sharp";
import pngToIco from "png-to-ico";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Brand favicon (docs/brand): the off-white symbol on a navy rounded square.
 * No gold, no brown — matches the new manual.
 *
 * Run with:  pnpm dlx tsx scripts/generate-favicons.mjs
 */

const SOURCE = "public/brand/symbol-offwhite.svg";
const MASTER_SIZE = 1024;
const BOOK_INSET = 0.2; // padding around the symbol inside the rounded square

const OUTPUTS = [
  { path: "app/icon.png", size: 64 },
  { path: "app/apple-icon.png", size: 180 },
  { path: "public/icon-192.png", size: 192 },
  { path: "public/icon-512.png", size: 512 },
];

function navyGradientSvg(size) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs>
        <linearGradient id="g" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#24395c"/>
          <stop offset="100%" stop-color="#14243d"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#g)"/>
    </svg>
  `);
}

async function buildMaster() {
  const bookSize = Math.round(MASTER_SIZE * (1 - BOOK_INSET * 2));
  const offset = Math.round((MASTER_SIZE - bookSize) / 2);

  // 1. Rasterize the off-white symbol SVG at high density (transparent bg).
  const symbolResized = await sharp(readFileSync(SOURCE), { density: 400 })
    .resize(bookSize, bookSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // 2. Composite the symbol onto the navy rounded square.
  const bg = await sharp(navyGradientSvg(MASTER_SIZE)).png().toBuffer();
  const master = await sharp(bg)
    .composite([{ input: symbolResized, top: offset, left: offset }])
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

  const icoBuffers = await Promise.all(
    [16, 32, 48].map((s) => sharp(master).resize(s, s).png().toBuffer()),
  );
  const ico = await pngToIco(icoBuffers);
  writeFileSync("app/favicon.ico", ico);
  console.log("✓ app/favicon.ico (16 + 32 + 48)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
