// One-off PWA icon generation from the committed source artwork.
// Usage: node scripts/generate-icons.mjs  (run from app/)
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'public/source.png';
const OUT = 'public/icons';

// Solid backdrop for the maskable variant — the app's indigo accent
// (--color-indigo in src/index.css).
const THEME_COLOR = '#3A4A9F';

await mkdir(OUT, { recursive: true });

const meta = await sharp(SRC).metadata();
if (!meta.width || !meta.height) throw new Error(`Could not read dimensions of ${SRC}`);
const shorter = Math.min(meta.width, meta.height);
console.log(`source: ${meta.width}×${meta.height} ${meta.format}${shorter < 512 ? '  (WARNING: shorter side < 512, icons will be upscaled)' : ''}`);

// fit: 'cover' + position 'centre' square-crops the longer dimension — never stretches.
const squared = (size) => sharp(SRC).resize(size, size, { fit: 'cover', position: 'centre' }).png();

await squared(192).toFile(`${OUT}/icon-192.png`);
await squared(512).toFile(`${OUT}/icon-512.png`);

// Maskable: artwork at ~80% centered on a full-bleed theme-color square, so
// Android's circular/squircle mask can't clip it.
const art = await squared(410).toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: THEME_COLOR } })
  .composite([{ input: art, gravity: 'centre' }])
  .png()
  .toFile(`${OUT}/icon-512-maskable.png`);

// Read every output back and assert its real pixel dimensions.
const expected = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-512-maskable.png', 512],
];
for (const [name, size] of expected) {
  const m = await sharp(`${OUT}/${name}`).metadata();
  const ok = m.width === size && m.height === size && m.format === 'png';
  console.log(`${OUT}/${name}: ${m.width}×${m.height} ${m.format} ${ok ? 'OK' : 'MISMATCH'}`);
  if (!ok) process.exitCode = 1;
}
