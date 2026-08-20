/**
 * Rebuilds the quiz scene art in public/images/quiz/ from the originals in ../images/tests/
 * (untracked). Run from site/:  node scripts/build-quiz-sprites.mjs
 *
 * Provenance of the three sources, none of which is usable as downloaded:
 *  - doctor  — Freepik preview. Its "transparency" is a checkerboard painted into the
 *              pixels, and an orange brand wedge covers the bottom-right corner.
 *  - student — PngTree PNG. Real alpha, but faint watermark text over the margins.
 *  - ward    — 4032px render of a low-res scene; far too large to ship as-is.
 */
import sharp from 'sharp';

const SRC = '../images/tests';
const OUT = 'public/images/quiz';

/* ---------- doctor ---------- */
{
  const CUT = 463;   // the brand wedge runs along x + y = 468, in source coordinates
  const CROP = { left: 44, top: 34, width: 208, height: 215 };
  const file = `${SRC}/pixel-art-female-doctor_1284356-1975.png`;
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const out = Buffer.from(data);
  const alpha = (p) => out[p * c + 3];

  // Both the painted checkerboard and the wedge are reachable from the border, and the
  // sprite is walled in by its own dark outline, so one flood fill clears them without
  // touching the white coat inside.
  const isBg = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
    const checker = mn >= 220 && mx - mn <= 12;
    const wedge = r > 225 && g > 130 && g < 210 && b < 80;
    return checker || wedge;
  };
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, x + (h - 1) * w);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p] || !isBg(p * c)) continue;
    seen[p] = 1;
    out[p * c + 3] = 0;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }

  // The wedge is anti-aliased, so its edge blends orange into the checker over a few
  // pixels, matches neither test above, and survives the fill as a pale diagonal beside
  // the coat. Cutting the half-plane a few pixels early takes the blend with it and costs
  // only the outermost pixels of the coat.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) if (x + y >= CUT) out[(y * w + x) * c + 3] = 0;
  }

  // Higher up the same blend leaves loose specks. The sprite is one connected blob, so
  // anything not attached to it is leftover brand mark.
  const label = new Int32Array(w * h).fill(-1);
  let best = -1, bestSize = 0;
  for (let s = 0; s < w * h; s++) {
    if (label[s] !== -1 || alpha(s) <= 8) continue;
    let size = 0;
    const q = [s];
    label[s] = s;
    while (q.length) {
      const p = q.pop();
      size++;
      const x = p % w, y = (p / w) | 0;
      const ns = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const n of ns) if (n >= 0 && label[n] === -1 && alpha(n) > 8) { label[n] = s; q.push(n); }
    }
    if (size > bestSize) { bestSize = size; best = s; }
  }
  let specks = 0;
  for (let p = 0; p < w * h; p++) if (alpha(p) > 8 && label[p] !== best) { out[p * c + 3] = 0; specks++; }

  // What is left is a pale halo: the pixels where the checkerboard was blended into the
  // sprite's edge. They are too light to be checker and too checker-ish to be sprite, so
  // neither pass caught them. Erode inwards while the boundary is still light — the sprite
  // is drawn with a dark outline, which stops the erosion at the artwork.
  let halo = 0;
  for (let pass = 0; pass < 3; pass++) {
    const doomed = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (alpha(p) <= 8) continue;
        const i = p * c;
        if (Math.min(out[i], out[i + 1], out[i + 2]) <= 150) continue;
        const edge =
          (x > 0 && alpha(p - 1) <= 8) || (x < w - 1 && alpha(p + 1) <= 8) ||
          (y > 0 && alpha(p - w) <= 8) || (y < h - 1 && alpha(p + w) <= 8);
        if (edge) doomed.push(p);
      }
    }
    if (!doomed.length) break;
    for (const p of doomed) out[p * c + 3] = 0;
    halo += doomed.length;
  }

  // Bust crop: wide enough for the whole hairline, stopping above the row where the wedge
  // starts biting into the coat.
  await sharp(out, { raw: { width: w, height: h, channels: c } })
    .extract(CROP)
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/doctor.png`);
  console.log(`doctor.png ${CROP.width}x${CROP.height} (blob ${bestSize}px, ${specks} specks, ${halo} halo pixels dropped)`);
}

/* ---------- student ---------- */
{
  const file = `${SRC}/pngtree-cute-pixel-hero-student-style-transparent-alpha-channel-png-image_19157187.png`;
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const out = Buffer.from(data);
  // The watermark is faint text over the transparent margins. Pixel art has hard edges,
  // so snapping alpha to 0/255 erases it without touching the sprite.
  let faint = 0;
  for (let p = 0; p < w * h; p++) {
    const a = data[p * c + 3];
    if (a >= 200) out[p * c + 3] = 255;
    else { if (a > 0) faint++; out[p * c + 3] = 0; }
  }
  const buf = await sharp(out, { raw: { width: w, height: h, channels: c } }).png().toBuffer();
  await sharp(buf).trim({ threshold: 0 }).png({ compressionLevel: 9 }).toFile(`${OUT}/student.png`);
  const m = await sharp(`${OUT}/student.png`).metadata();
  console.log(`student.png ${m.width}x${m.height} (${faint} watermark pixels removed)`);
}

/* ---------- ward backdrop ---------- */
{
  // Downscaled to a real low-res grid; the page upscales it with image-rendering: pixelated
  // so the backdrop stays genuinely 8-bit instead of a blurred photo-sized JPEG.
  await sharp(`${SRC}/8-bit-graphics-pixels-scene-with-nurse-hospital.jpg`)
    .resize({ width: 480, kernel: 'lanczos3' })
    .png({ compressionLevel: 9, palette: true, colours: 64 })
    .toFile(`${OUT}/ward.png`);
  const m = await sharp(`${OUT}/ward.png`).metadata();
  console.log(`ward.png ${m.width}x${m.height}`);
}
