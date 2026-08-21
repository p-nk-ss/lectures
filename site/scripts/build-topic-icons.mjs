/**
 * Draws the thematic title-slide sprites into public/icons/icon-<name>.png.
 *
 * The sprites are authored here as pixel grids rather than kept as opaque PNGs: at this
 * size every pixel is a design decision, and a grid is the only form in which one can be
 * changed later. Each cell becomes a SCALE×SCALE block — nearest-neighbour, so the output
 * is true pixel art and stays crisp under the `.px` (`image-rendering: pixelated`) rule.
 *
 * Palette letters are shared across sprites so the set reads as one family: `k` is always
 * the 1px ink outline, and every body colour has a base / shadow / highlight triple.
 *
 * Run: node scripts/build-topic-icons.mjs
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
const SCALE = 6;

/** Shared with the design tokens in global.css: --ink, --ok, --danger, --accent. */
const INK = '#0f1020';

const PALETTES = {
  bone: { k: INK, w: '#e8e4d9', s: '#a9a496', d: '#6f6b60', h: '#fffdf5' },
  acid: { k: INK, g: '#cfd8e8', s: '#8f9bb5', h: '#ffffff', a: '#5ee9a0', d: '#2f9c6a', c: '#ffd23e' },
  lung: { k: INK, w: '#e8e4d9', s: '#a9a496', a: '#ff8a94', d: '#c9414f', h: '#ffc2c7' },
  brain: { k: INK, a: '#ff8fbe', d: '#c24d82', h: '#ffd0e4', s: '#8f3a60' },
  blood: { k: INK, a: '#ff5f6b', d: '#b32734', h: '#ffb3b8' },
};

/*
 * Skull — topic 08. The classic poison mark: a reader knows what the slide is about
 * before reading the title.
 */
const SKULL = `
.....kkkkkkkkkk.....
...kkwwwwwwwwwwkk...
..kwwwwwwwwwwwwwwk..
.kwwwwwwwwwwwwwwwwk.
kwwwwwwwwwwwwwwwwwwk
kwwwwwwwwwwwwwwwwwsk
kwwkkkkwwwwwwkkkkwsk
kwkkkkkkwwwwkkkkkksk
kwkkkkkkwwwwkkkkkksk
kwwkkkkwwwwwwkkkkwsk
kwwwwwwwwkkwwwwwwwsk
.kwwwwwwwkkwwwwwwsk.
.kwwwwwwwwkkwwwwwsk.
..kwwwwwwwwwwwwwsk..
...kwwwwwwwwwwwwsk..
....kwkwkwkwkwkwsk..
....kwkwkwkwkwkwsk..
....kkkkkkkkkkkkkk..
`;

/*
 * Test tube of acid — topic 08. Drawn tilted with a drop leaving the lip, because an
 * upright tube of green liquid reads as a potion; the drop is what makes it a hazard.
 */
const FLASK = `
..kkkkkkkkkk..
..kgggggggsk..
...kghggggsk..
...kghggggsk..
...kghggggsk..
...kghggggsk..
...kghaaaask..
...kgaaadask..
...kgahaaask..
...kgaaaaask..
...kgaadaask..
...kgahaaask..
...kgaaaadsk..
...kgaaaaask..
...kgadaaask..
...kgaaaaask..
....kaaaask...
.....kkkkk....
`;

/* Lungs with the trachea — topic 05. */
const LUNGS = `
........kkk........
........kwk........
........kwk........
........kwk........
....kkkkkwkkkkk....
...kaaaakwkaaaak...
..kaaaaakwkaaaaak..
.khaaaaakwkaaaaahk.
.kaaaaaaakaaaaaaak.
.kadaaaaakaaaaadak.
.kaadaaaakaaaadaak.
.kaaadaaakaaadaaak.
.kaaaadaakaadaaaak.
.kaaaaadakadaaaaak.
..kaaaaaakaaaaaak..
..kaaaaaakaaaaaak..
...kaaaaakaaaaak...
....kaaaakaaaak....
.....kkkkkkkkk.....
`;

/* Brain — topic 07. */
const BRAIN = `
.....kkkkkkkk.....
...kkhaaaaaakk....
..khaaddaaddaaak..
.khaadaadaadaaaak.
.kaaddaaddaaddaak.
kaaaadaaaadaaddaak
kaddaaaddaaaaaadak
kaaddaaaadaaddaaak
kaaaadddaaaaadaaak
kaddaaaaaddaaaddak
.kaaaddaaaaddaaak.
.kaaaaaaddaaaaaak.
..kaaddaaaaddaak..
...kaaaaaaaaaak...
....ksssssssk.....
.....kkkkkkk......
`;

/* Blood drop — topic 06. */
const DROP = `
......kk......
.....kaak.....
.....kaak.....
....kahaak....
....kahaak....
...kahaaadk...
...kahaaadk...
..kahaaaaadk..
..kahaaaaadk..
.kahaaaaaaadk.
.kaaaaaaaaadk.
.kaaaaaaaaadk.
..kaaaaaaadk..
..kaaaaaaadk..
...kaaaaadk...
....kkkkkk....
`;

const SPRITES = [
  { name: 'skull', grid: SKULL, palette: PALETTES.bone },
  { name: 'flask', grid: FLASK, palette: PALETTES.acid },
  { name: 'lungs', grid: LUNGS, palette: PALETTES.lung },
  { name: 'brain', grid: BRAIN, palette: PALETTES.brain },
  { name: 'drop', grid: DROP, palette: PALETTES.blood },
];

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Grid text → RGBA buffer, one cell per pixel; '.' is transparent. */
function render(grid, palette) {
  const rows = grid.trim().split('\n').map((r) => r.replace(/\s+$/, ''));
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const buf = Buffer.alloc(w * h * 4, 0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x] ?? '.';
      if (ch === '.') continue;
      const hex = palette[ch];
      if (!hex) throw new Error(`unknown palette letter '${ch}' at ${x},${y}`);
      const [r, g, b] = rgb(hex);
      const i = (y * w + x) * 4;
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
    }
  }
  return { buf, w, h };
}

for (const { name, grid, palette } of SPRITES) {
  const { buf, w, h } = render(grid, palette);
  const file = join(OUT, `icon-${name}.png`);
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .resize({ width: w * SCALE, height: h * SCALE, kernel: 'nearest' })
    .png()
    .toFile(file);
  console.log(`icon-${name}.png  ${w}x${h} cells -> ${w * SCALE}x${h * SCALE}`);
}
