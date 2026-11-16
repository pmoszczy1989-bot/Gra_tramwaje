'use strict';
const cv = document.getElementById('game'); let ctx = cv.getContext('2d');
let W = 400, camX = 0, NIGHT = 0;
const EMIT = [];
const LOGO = new Image(); LOGO.src = window.LOGO_DATA || 'ebblo.png';
const LOGOPX = {};
function logoPx(lw) {
  if (LOGOPX[lw]) return LOGOPX[lw];
  const lh = Math.round(lw * LOGO.naturalHeight / LOGO.naturalWidth), c = document.createElement('canvas'); c.width = lw; c.height = lh;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(LOGO, 0, 0, lw, lh);
  try { const d = g.getImageData(0, 0, lw, lh); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 100 ? 255 : 0; g.putImageData(d, 0, 0); } catch (e) { /* file:// – zostaw wygładzone logo */ }
  return LOGOPX[lw] = c;
}

function resize() {
  const a = innerWidth / innerHeight; W = Math.max(300, Math.round(H * a));
  cv.width = W; cv.height = H; ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize); resize();

const sx = wx => Math.round((wx - camX) * PX);
function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function E(fn) { EMIT.push(fn); }

// ===== tekst pikselowy – własne czcionki bitmapowe =====
// duża 5×7 (z małymi literami i polskimi znakami), mała 3×5 (wersaliki). Wiersze: '#' = piksel; offset -2 = akcent nad wersalikiem.
const FBIG = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.', C: '.###.|#...#|#....|#....|#....|#...#|.###.',
  D: '####.|#...#|#...#|#...#|#...#|#...#|####.', E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.####', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#', I: '###|.#.|.#.|.#.|.#.|.#.|###',
  J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..', K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#', O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  P: '####.|#...#|#...#|####.|#....|#....|#....', Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..', U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..', W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  a: '....|....|.###.|....#|.####|#...#|.####', b: '#....|#....|#.##.|##..#|#...#|#...#|####.', c: '....|....|.###|#...|#...|#...|.###',
  d: '....#|....#|.##.#|#..##|#...#|#...#|.####', e: '....|....|.###.|#...#|#####|#....|.###.', f: '..##|.#..|.#..|###.|.#..|.#..|.#..',
  g: '....|....|.####|#...#|#...#|.####|....#|.###.', h: '#....|#....|#.##.|##..#|#...#|#...#|#...#', i: '.#.|...|##.|.#.|.#.|.#.|###',
  j: '..#|...|.##|..#|..#|..#|..#|#.#|.#.', k: '#...|#...|#..#|#.#.|##..|#.#.|#..#', l: '##.|.#.|.#.|.#.|.#.|.#.|###',
  m: '....|....|##.#.|#.#.#|#.#.#|#.#.#|#.#.#', n: '....|....|#.##.|##..#|#...#|#...#|#...#', o: '....|....|.###.|#...#|#...#|#...#|.###.',
  p: '....|....|####.|#...#|#...#|####.|#....|#....', q: '....|....|.####|#...#|#...#|.####|....#|....#', r: '....|....|#.##|##..|#...|#...|#...',
  s: '....|....|.###|#...|.##.|...#|###.', t: '.#..|.#..|###.|.#..|.#..|.#.#|..#.', u: '....|....|#...#|#...#|#...#|#..##|.##.#',
  v: '....|....|#...#|#...#|#...#|.#.#.|..#..', w: '....|....|#...#|#...#|#.#.#|#.#.#|.#.#.', x: '....|....|#...#|.#.#.|..#..|.#.#.|#...#',
  y: '....|....|#...#|#...#|#...#|.####|....#|.###.', z: '....|....|#####|...#.|..#..|.#...|#####',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '.#.|##.|.#.|.#.|.#.|.#.|###', 2: '.###.|#...#|....#|...#.|..#..|.#...|#####',
  3: '####.|....#|....#|.###.|....#|....#|####.', 4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
  6: '..##.|.#...|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...', 8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  9: '.###.|#...#|#...#|.####|....#|...#.|.##..',
  '.': '.|.|.|.|.|.|#', ',': '.|.|.|.|.|.|#|#', ':': '.|.|#|.|.|#|.', ';': '.|.|#|.|.|#|#', '-': '...|...|...|###', '–': '....|....|....|####', '—': '....|....|....|####',
  '/': '....#|...#.|...#.|..#..|.#...|.#...|#....', '(': '.#|#.|#.|#.|#.|#.|.#', ')': '#.|.#|.#|.#|.#|.#|#.', '!': '#|#|#|#|#|.|#',
  '?': '.###.|#...#|....#|...#.|..#..|.....|..#..', '+': '.....|..#..|..#..|#####|..#..|..#..', '·': '.|.|.|#', '|': '#|#|#|#|#|#|#',
  "'": '#|#', '"': '#.#|#.#', '=': '....|....|####|....|####', '_': '....|....|....|....|....|....|####', '%': '##..#|##.#.|...#.|..#..|.#...|.#.##|#..##',
  '>': '#...|.#..|..#.|...#|..#.|.#..|#...', '<': '...#|..#.|.#..|#...|.#..|..#.|...#', '*': '.....|#.#.#|.###.|#####|.###.|#.#.#',
  '→': '.....|..#..|...#.|#####|...#.|..#..', '←': '.....|..#..|.#...|#####|.#...|..#..', '✓': '.....|....#|...#.|#.#..|.#...', '×': '.....|#...#|.#.#.|..#..|.#.#.|#...#',
  '♿': '..#..|.....|..#..|.##..|#.###|#...#|.###.', '°': '.#.|#.#|.#.', '#': '.#.#.|#####|.#.#.|.#.#.|#####|.#.#.', '@': '.###.|#...#|#.###|#.#.#|#.##.|#....|.###.',
};
const FSMALL = {
  A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '.##|#..|#..|#..|.##', D: '##.|#.#|#.#|#.#|##.', E: '###|#..|##.|#..|###', F: '###|#..|##.|#..|#..',
  G: '.##|#..|#.#|#.#|.##', H: '#.#|#.#|###|#.#|#.#', I: '###|.#.|.#.|.#.|###', J: '..#|..#|..#|#.#|.#.', K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###',
  M: '#...#|##.##|#.#.#|#...#|#...#', N: '#..#|##.#|#.##|#..#|#..#', O: '.#.|#.#|#.#|#.#|.#.', P: '##.|#.#|##.|#..|#..', Q: '.#.|#.#|#.#|##.|.##',
  R: '##.|#.#|##.|#.#|#.#', S: '.##|#..|.#.|..#|##.', T: '###|.#.|.#.|.#.|.#.', U: '#.#|#.#|#.#|#.#|###', V: '#.#|#.#|#.#|#.#|.#.',
  W: '#...#|#...#|#.#.#|##.##|#...#', X: '#.#|#.#|.#.|#.#|#.#', Y: '#.#|#.#|.#.|.#.|.#.', Z: '###|..#|.#.|#..|###',
  0: '###|#.#|#.#|#.#|###', 1: '.#.|##.|.#.|.#.|###', 2: '##.|..#|.#.|#..|###', 3: '##.|..#|.#.|..#|##.', 4: '#.#|#.#|###|..#|..#',
  5: '###|#..|##.|..#|##.', 6: '.##|#..|###|#.#|###', 7: '###|..#|.#.|.#.|.#.', 8: '###|#.#|###|#.#|###', 9: '###|#.#|###|..#|##.',
  '.': '.|.|.|.|#', ',': '.|.|.|.|#|#', ':': '.|#|.|#|.', '-': '...|...|###', '–': '...|...|###', '—': '...|...|###', '/': '..#|..#|.#.|#..|#..',
  '·': '.|.|#', '!': '#|#|#|.|#', '?': '##.|..#|.#.|...|.#.', '(': '.#|#.|#.|#.|.#', ')': '#.|.#|.#|.#|#.', '+': '...|.#.|###|.#.', "'": '#|#',
  '>': '#..|.#.|..#|.#.|#..', '<': '..#|.#.|#..|.#.|..#', '=': '...|###|...|###', '%': '#.#|..#|.#.|#..|#.#',
};
const PLDIA = { 'ą': ['a', 'og'], 'ę': ['e', 'og'], 'ć': ['c', 'ac'], 'ń': ['n', 'ac'], 'ó': ['o', 'ac'], 'ś': ['s', 'ac'], 'ź': ['z', 'ac'], 'ż': ['z', 'dot'], 'ł': ['l', 'sl'],
  'Ą': ['A', 'og'], 'Ę': ['E', 'og'], 'Ć': ['C', 'ac'], 'Ń': ['N', 'ac'], 'Ó': ['O', 'ac'], 'Ś': ['S', 'ac'], 'Ź': ['Z', 'ac'], 'Ż': ['Z', 'dot'], 'Ł': ['L', 'sl'],
  'é': ['e', 'ac'], 'É': ['E', 'ac'], 'š': ['s', 'ac'], 'Š': ['S', 'ac'], 'č': ['c', 'ac'], 'Č': ['C', 'ac'], 'ü': ['u', 'dot'], 'ö': ['o', 'dot'], 'ä': ['a', 'dot'] };
const GLYPHS = new Map();
function glyph(ch, small) {
  const key = (small ? 's' : 'b') + ch; if (GLYPHS.has(key)) return GLYPHS.get(key);
  let g = null;
  const parse = str => { const rows = str.split('|'), px = []; let w = 0; rows.forEach((r, y) => { w = Math.max(w, r.length); for (let x = 0; x < r.length; x++) if (r[x] === '#') px.push([x, y]); }); return { w, px }; };
  if (ch === ' ') g = { w: small ? 1 : 2, px: [] };
  else if (PLDIA[ch]) {
    const [base, mark] = PLDIA[ch], up = base === base.toUpperCase() || small, B = glyph(small ? base.toUpperCase() : base, small);
    const px = B.px.slice(), c = Math.floor(B.w / 2), H = small ? 5 : 7;
    if (mark === 'og') { px.push([B.w - 2, H], [B.w - 1, H + 1]); }
    else if (mark === 'ac') { if (small) px.push([c + 1, -1]); else if (up) px.push([c + 1, -2], [c, -1]); else px.push([c + 1, 0], [c, 1]); }
    else if (mark === 'dot') px.push([c, up ? -1 : 0]);
    else if (mark === 'sl') { if (small) px.push([1, 2]); else if (up) px.push([1, 3], [2, 2]); else px.push([2, 3], [0, 4]); }
    g = { w: B.w, px };
  } else {
    let src = small ? (FSMALL[ch] || FSMALL[ch.toUpperCase()]) : FBIG[ch];
    if (!src && small) return glyph(ch, false);
    if (!src && !small) src = FBIG[ch.toUpperCase()] || FBIG['?'];
    g = parse(src);
  }
  GLYPHS.set(key, g); return g;
}
const TXC = new Map();
function ptext(s, x, y, col, size = 8, align = 'left') {
  s = String(s);
  const small = size <= 6, sc = small ? 1 : Math.max(1, Math.round(size / 8)), k = s + '|' + col + '|' + size;
  let c = TXC.get(k);
  if (!c) {
    if (TXC.size > 800) TXC.clear();
    const gs = [...s].map(ch => glyph(ch, small)); let w = 0; for (const g of gs) w += g.w + 1; w = Math.max(1, w - 1);
    const top = 2, hgt = (small ? 9 : 12);
    c = document.createElement('canvas'); c.width = w * sc; c.height = hgt * sc; const g2 = c.getContext('2d'); g2.fillStyle = col;
    let cx = 0; for (const g of gs) { for (const [px, py] of g.px) g2.fillRect((cx + px) * sc, (py + top) * sc, sc, sc); cx += g.w + 1; }
    c.top = top * sc; TXC.set(k, c);
  }
  const dx = align === 'center' ? x - c.width / 2 : align === 'right' ? x - c.width : x;
  ctx.drawImage(c, Math.round(dx), Math.round(y + 1 - c.top)); return c.width;
}

// ===== kolory / pora dnia =====
function hex2(c) { if (c[0] === 'r') return c.slice(4, -1).split(',').map(Number); return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
function mix(a, b, t) { const A = hex2(a), B = hex2(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; }
const SUN = { spring: [5.6, 19.4], summer: [4.6, 21.0], autumn: [6.6, 17.6], winter: [7.5, 15.8] };
function nightOf(t) { const h = (((t % 86400) + 86400) % 86400) / 3600, [sr, ss] = SUN[seasonNow()]; if (h < sr - 1.5) return 1; if (h < sr) return 1 - (h - sr + 1.5) / 1.5; if (h < ss) return 0; if (h < ss + 1.2) return (h - ss) / 1.2; return 1; }
let OV = 0, SEASON = 'summer';

function zoneAt(x) {
  const w = G.world; if (!w || !w.stops.length) return 'centre';
  let best = w.stops[0], bd = 1e9; for (const s of w.stops) { const d = Math.abs(s.x - x); if (d < bd) { bd = d; best = s; } }
  return best.zone;
}


// ===== paleta, wzory i sprite'y (cache) =====
const shade = (c, t) => mix(c, '#1a1020', t), tint = (c, t) => mix(c, '#fff8e8', t);
const PATS = new Map(), SPRS = new Map();
function mkCanvas(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); fn((x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); }, g); return c; }
function pat(key, w, h, fn) { let p = PATS.get(key); if (!p) { p = ctx.createPattern(mkCanvas(w, h, fn), 'repeat'); PATS.set(key, p); } return p; }
function spr(key, w, h, fn) { let c = SPRS.get(key); if (!c) { c = mkCanvas(w, h, fn); SPRS.set(key, c); } return c; }
function fillP(p, x, y, w, h, ox) { p.setTransform(new DOMMatrix([1, 0, 0, 1, ox === undefined ? sx(0) : Math.round(ox), 0])); ctx.fillStyle = p; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
const brickPat = c => pat('br' + c, 12, 6, f => { f(0, 0, 12, 6, c); const m = tint(c, 0.32), d = shade(c, 0.12), l = tint(c, 0.1);
  f(0, 2, 12, 1, m); f(0, 5, 12, 1, m); f(0, 0, 1, 2, m); f(6, 0, 1, 2, m); f(3, 3, 1, 2, m); f(9, 3, 1, 2, m); f(7, 0, 5, 2, d); f(4, 3, 5, 2, l); f(1, 0, 2, 1, l); });
const plasterPat = c => pat('pl' + c, 8, 8, f => { f(0, 0, 8, 8, c); f(1, 2, 1, 1, shade(c, 0.06)); f(5, 6, 1, 1, shade(c, 0.06)); f(6, 1, 1, 1, tint(c, 0.08)); f(2, 5, 1, 1, tint(c, 0.08)); });
const PAVE = () => pat('pave', 8, 7, f => { f(0, 0, 8, 7, '#d9cfba'); f(4, 0, 4, 3, '#cfc4ad'); f(0, 3, 4, 3, '#cfc4ad'); f(0, 6, 8, 1, '#b5a88f'); f(3, 0, 1, 6, '#b5a88f'); f(7, 0, 1, 6, '#b5a88f'); f(0, 0, 3, 1, '#e8dfcc'); f(4, 3, 3, 1, '#e8dfcc'); });
const PLAT = () => pat('plat', 6, 6, f => { f(0, 0, 6, 6, '#e3dac6'); f(0, 5, 6, 1, '#c4b89f'); f(5, 0, 1, 5, '#c4b89f'); f(0, 0, 5, 1, '#f0e9da'); });
const ASPH = () => pat('asph', 16, 12, f => { f(0, 0, 16, 12, '#575a66'); for (let i = 0; i < 22; i++) f((h1(i * 3 + 1) * 16) | 0, (h1(i * 5 + 2) * 12) | 0, 1, 1, i % 2 ? '#626573' : '#4d505b'); });
const SETT = () => pat('sett', 6, 6, f => { f(0, 0, 6, 6, '#6b6559'); f(0, 0, 5, 2, '#8f8676'); f(3, 3, 5, 2, '#857c6c'); f(0, 3, 2, 2, '#857c6c'); f(0, 0, 4, 1, '#a39a88'); f(3, 3, 3, 1, '#9a917f'); });
const GRASS = () => SEASON === 'winter' ? pat('snowg', 16, 12, f => { f(0, 0, 16, 12, '#e8eef4'); for (let i = 0; i < 18; i++) f((h1(i * 7 + 3) * 16) | 0, (h1(i * 11 + 5) * 12) | 0, 1, 1, i % 3 ? '#d2dce8' : '#ffffff'); f(5, 7, 1, 1, '#8a9a6a'); }) : SEASON === 'spring' ? pat('grassS', 16, 12, f => { f(0, 0, 16, 12, '#7cc04a'); for (let i = 0; i < 30; i++) f((h1(i * 7 + 3) * 16) | 0, (h1(i * 11 + 5) * 12) | 0, 1, 1, i % 5 === 0 ? '#f8f0a0' : i % 5 === 1 ? '#f4b6c8' : i % 2 ? '#98d860' : '#64a838'); }) : pat('grass', 16, 12, f => { f(0, 0, 16, 12, '#86ad48'); for (let i = 0; i < 30; i++) { const x = (h1(i * 7 + 3) * 16) | 0, y = (h1(i * 11 + 5) * 12) | 0; f(x, y, 1, 1, i % 3 === 0 ? '#9cc45a' : i % 3 === 1 ? '#749a3c' : '#b2d06a'); } f(3, 4, 1, 2, '#6d9235'); f(11, 9, 1, 2, '#6d9235'); });

// ===== tło =====
function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, 100);
  const dusk = NIGHT > 0 && NIGHT < 1 ? Math.sin(NIGHT * Math.PI) : 0;
  const gr = mix('#8e99a6', '#10141c', NIGHT), o = OV * 0.85;
  g.addColorStop(0, mix(mix(mix('#4f9ee0', '#08122b', NIGHT), '#6a5a8a', dusk * 0.5), gr, o));
  g.addColorStop(0.7, mix(mix(mix('#9fd2f2', '#16234a', NIGHT), '#e89a78', dusk * 0.6), gr, o));
  g.addColorStop(1, mix(mix(mix('#d8f0f8', '#1b2848', NIGHT), '#f6c27a', dusk * 0.7), mix(gr, '#ffffff', 0.15), o));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 100);
  if (NIGHT > 0.6 && OV < 0.5) for (let i = 0; i < 40; i++) { const x = (h1(i * 7) * W) | 0, y = (h1(i * 13) * 60) | 0; R(x, y, 1, 1, `rgba(255,255,255,${(NIGHT - 0.6) * 2 * h1(i)})`); }
  if (OV > 0.6) { }
  else if (NIGHT > 0.5) { R(W * 0.8, 14, 6, 6, '#f4f1d0'); R(W * 0.8 + 1, 15, 2, 2, '#d8d4b0'); }
  else { const sx0 = W * 0.12 | 0; R(sx0 - 1, 15, 10, 10, 'rgba(255,240,170,0.35)'); R(sx0, 16, 8, 8, '#fff1a8'); R(sx0 + 1, 17, 3, 2, '#fffbe0'); }
  // chmury
  const cl = spr('cloud', 34, 12, (f) => { const C = '#ffffff', S = '#d7ecf7', B = '#bcd9ea';
    f(4, 6, 26, 5, C); f(8, 2, 10, 6, C); f(16, 0, 9, 8, C); f(24, 4, 7, 4, C); f(2, 8, 30, 3, S); f(3, 10, 28, 2, B); f(10, 3, 3, 1, '#fff'); });
  const clg = spr('cloudg', 34, 12, (f) => { const C = '#a4adb8', S = '#8a94a0', B = '#6e7884';
    f(4, 6, 26, 5, C); f(8, 2, 10, 6, C); f(16, 0, 9, 8, C); f(24, 4, 7, 4, C); f(2, 8, 30, 3, S); f(3, 10, 28, 2, B); f(10, 3, 3, 1, '#bcc4ce'); });
  ctx.globalAlpha = 1 - NIGHT * 0.75;
  const co = camX * PX * 0.025 + G.clock * (0.3 + OV * 0.9), step = 90 - OV * 45;
  for (let j = Math.floor(co / step) - 1; j < co / step + W / step + 1; j++) { const r = h1(j * 19 + 4); if (r < 0.35 - OV * 0.35) continue; ctx.drawImage(OV > 0.4 ? clg : cl, Math.round(j * step + r * 40 - co), Math.round(4 + h1(j * 7) * (26 - OV * 16))); }
  ctx.globalAlpha = 1;
  // skyline (paralaksa)
  const off = camX * PX * 0.12, bw = 18, j0 = Math.floor(off / bw) - 1;
  const col = mix('#9db3d6', '#1d2740', NIGHT), col2 = mix('#b7c8e2', '#26314e', NIGHT);
  for (let j = j0; j < j0 + W / bw + 3; j++) {
    const r = h1(j * 3 + 11), x = j * bw - off, h = 14 + r * 26;
    R(x, 100 - h, bw + 1, h, col); R(x, 100 - h, bw + 1, 1, col2);
    if (r > 0.85) { R(x + 7, 100 - h - 14, 4, 14, col); R(x + 8, 100 - h - 22, 2, 8, col); }
    if (j % 61 === 0) { R(x + 2, 60, 22, 40, col); R(x + 6, 8, 12, 92, col); R(x + 6, 8, 2, 92, col2); R(x + 8, 4, 8, 4, col); R(x + 11, 0, 2, 4, col); }
    else if (j % 47 === 23) { R(x, 56, 26, 44, col); for (const tx of [x + 2, x + 17]) { R(tx, 30, 7, 26, col); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(tx, 31); ctx.lineTo(tx + 3.5, 8); ctx.lineTo(tx + 7, 31); ctx.fill(); } }
    else if (j % 53 === 40) { for (let t = 0; t < 4; t++) R(x - 8 + t * 5, 70 - t * 7, 40 - t * 10, 30 + t * 7, col); R(x - 14, 20, 1, 80, col); }
    else for (let y = 100 - h + 3; y < 98; y += 4) if (h1(j * 31 + y) < 0.5) R(x + 3 + ((h1(j + y) * 10) | 0), y, 2, 2, col2);
    if (NIGHT > 0.5 && h1(j * 17) > 0.5) E(() => R(x + 4 + (h1(j) * 8 | 0), 100 - h + 4, 1, 1, '#ffd27a'));
  }
}

const FACADES = ['#b4553a', '#e8b860', '#9cc6b0', '#a5482f', '#e5957a', '#f0d9a2', '#c58852', '#a9c4dc', '#d98e9a', '#bf6a45', '#c3d38a', '#efc59a'];
const BRICKY = c => c === '#b4553a' || c === '#a5482f' || c === '#bf6a45' || c === '#c58852';
const SHOPS = [['KAWA', '#2b5d8a'], ['PIEKARZ', '#8a4b2a'], ['APTEKA', '#2c8a4a'], ['ANTYKI', '#24345e'], ['BAR', '#9a2a2a'], ['KWIATY', '#6a3a8a'], ['LODY', '#d0507a'], ['FRYZJER', '#24345e'], ['KIOSK', '#c0392b'], ['PIEROGI', '#8a6a1e'], ['KSIĄŻKI', '#2b5d8a'], ['ZEGARY', '#4a3a2a']];
const AWN = [['#c0392b', '#f4ecd8'], ['#2e7d4a', '#f4ecd8'], ['#2b5d8a', '#f4ecd8'], ['#e0a020', '#fff6d8'], ['#8e44ad', '#f4ecd8']];
function win(x, y, w, h, seed, frame) {
  x = Math.round(x); y = Math.round(y);
  R(x - 1, y - 1, w + 2, h + 2, frame || '#f2ead8'); R(x, y, w, h, '#2e4a6b');
  R(x, y, w, 1, '#1e3350'); R(x + w - 2, y + 1, 1, Math.min(2, h - 1), '#8fb6d8'); if (h > 3) R(x + w - 3, y + 3, 1, 1, '#6f9ac0');
  if (w >= 4 && h >= 5) { R(x + (w >> 1), y, 1, h, frame || '#f2ead8'); }
  R(x - 1, y + h + 1, w + 2, 1, 'rgba(40,20,20,0.35)');
  if (NIGHT > 0.3 && h1(seed) < 0.55) E(() => { R(x, y, w, h, h1(seed * 3) < 0.7 ? '#ffd27a' : '#bfe3ff'); if (w >= 4 && h >= 5) R(x + (w >> 1), y, 1, h, '#6a5030'); });
}
function drawBuildings() {
  const w = G.world, x0 = camX - 12, x1 = camX + W / PX + 12;
  const sp = w ? specials(w) : [];
  const k0 = Math.floor(x0 / 10), k1 = Math.ceil(x1 / 10);
  for (let k = k0; k <= k1; k++) {
    const wx = k * 10; if (sp.some(s => wx + 10 > s.a && wx < s.b)) continue;
    const z = w && w.kind === 'training' ? 'depot' : w && w.kind === 'idle' ? 'mid' : zoneAt(wx);
    const x = sx(wx);
    if (z === 'centre') kamienica(x, k);
    else if (z === 'mid') blok(x, k);
    else if (z === 'out') domek(x, k);
    else hala(x, k);
  }
  for (const s of sp) s.draw();
}
function kamienica(x, k) {
  const r = h1(k), h = 50 + ((r * 5) | 0) * 5, c = FACADES[(h1(k * 5) * FACADES.length) | 0], top = 100 - h, brick = BRICKY(c);
  R(x - 1, top - 6, 32, 6, '#7a3a2c'); for (let i = 1; i < 32; i += 3) R(x - 1 + i, top - 6, 1, 6, '#652e23'); R(x - 1, top - 7, 32, 1, '#9a5240'); R(x - 1, top - 1, 32, 1, '#4a2018');
  if (h1(k * 3) > 0.5) { R(x + 4, top - 11, 4, 5, '#8e4434'); R(x + 3, top - 12, 6, 1, '#5a2a20'); }
  if (r > 0.5) { R(x + 11, top - 11, 9, 6, '#7a3a2c'); R(x + 10, top - 12, 11, 1, '#4a2018'); win(x + 13, top - 9, 4, 3, k * 9); }
  fillP(brick ? brickPat(c) : plasterPat(c), x, top, 30, 86 - top);
  R(x, top, 1, 86 - top, tint(c, 0.18)); R(x + 29, top, 1, 86 - top, shade(c, 0.3));
  R(x - 1, top, 32, 2, brick ? '#e8dcc4' : shade(c, 0.22)); R(x - 1, top + 2, 32, 1, 'rgba(40,20,20,0.3)');
  const fr = brick ? '#efe4cc' : tint(c, 0.55);
  for (let f = 0; top + 7 + f * 11 < 80; f++) {
    if (f > 0) { R(x, top + 4 + f * 11, 30, 1, shade(c, 0.15)); R(x, top + 5 + f * 11, 30, 1, tint(c, 0.12)); }
    for (let c2 = 0; c2 < 3; c2++) win(x + 4 + c2 * 9, top + 7 + f * 11, 4, 6, k * 31 + f * 7 + c2, fr);
    if (f === 1 && h1(k * 13) > 0.6) { R(x + 11, top + 14 + f * 11, 9, 1, '#3a2a2a'); for (let i = 0; i < 9; i += 2) R(x + 11 + i, top + 12 + f * 11, 1, 2, '#3a2a2a'); R(x + 12, top + 11 + f * 11, 2, 2, '#d0402a'); R(x + 16, top + 11 + f * 11, 2, 2, '#e8a020'); }
  }
  const sh = SHOPS[(h1(k * 7) * SHOPS.length) | 0], aw = AWN[(h1(k * 23) * AWN.length) | 0];
  R(x, 80, 30, 20, shade(c, 0.35)); R(x, 80, 30, 1, tint(c, 0.25));
  R(x + 1, 80, 28, 6, sh[1]); R(x + 1, 80, 28, 1, tint(sh[1], 0.35)); R(x + 1, 85, 28, 1, shade(sh[1], 0.4));
  ptext(sh[0], x + 15, 80, '#fff4d0', 5, 'center');
  R(x + 2, 89, 15, 10, '#3d2a20'); R(x + 3, 90, 13, 8, '#36597c'); R(x + 13, 90, 1, 4, '#9cc4e4'); R(x + 12, 91, 1, 2, '#9cc4e4'); R(x + 3, 96, 13, 2, '#5a3a28');
  for (let i = 0; i < 3; i++) R(x + 4 + i * 4, 94, 2, 2, ['#e8c060', '#d06040', '#f0e0c0', '#80b060'][(h1(k * 17 + i) * 4) | 0]);
  R(x + 20, 88, 7, 12, '#3d2a20'); R(x + 21, 89, 5, 11, '#6a3e26'); R(x + 21, 89, 5, 4, '#36597c'); R(x + 25, 94, 1, 1, '#f2c318');
  for (let i = 0; i < 28; i++) { const cc = ((i >> 2) & 1) ? aw[1] : aw[0]; R(x + 1 + i, 86, 1, 2, cc); if (i % 4 < 2) R(x + 1 + i, 88, 1, 1, cc); }
  R(x + 1, 86, 28, 1, 'rgba(255,255,255,0.25)'); R(x + 1, 89, 28, 1, 'rgba(0,0,0,0.18)');
  if (NIGHT > 0.3) E(() => { R(x + 3, 90, 13, 6, 'rgba(255,214,140,0.9)'); R(x + 21, 89, 5, 4, 'rgba(255,214,140,0.8)'); });
}
function blok(x, k) {
  const b = Math.floor(k / 4), r = h1(b * 3), h = 66 + ((r * 4) | 0) * 7, c = ['#e6dcc4', '#cfe0e0', '#f0deae', '#e2cfd8', '#d8e4c0'][(h1(b) * 5) | 0], top = 100 - h;
  const bal = ['#e07a3a', '#3a8ac0', '#d0b030', '#8ac040', '#c04a6a'][(h1(b * 5) * 5) | 0];
  if (h1(b * 9) < 0.18) { tree(x + 8, 100, k); tree(x + 22, 100, k + 3); return; }
  fillP(plasterPat(c), x, top, 30, h);
  if (k % 4 === 0) { R(x, top, 1, h, tint(c, 0.3)); R(x + 1, top, 1, h, tint(c, 0.15)); } if (k % 4 === 3) R(x + 27, top, 3, h, shade(c, 0.22));
  R(x, top, 30, 3, shade(c, 0.3)); R(x, top, 30, 1, tint(c, 0.2));
  for (let f = 0; top + 5 + f * 9 < 90; f++) {
    R(x, top + 3 + f * 9, 30, 1, shade(c, 0.1));
    for (let c2 = 0; c2 < 3; c2++) { win(x + 3 + c2 * 10, top + 5 + f * 9, 5, 4, k * 17 + f * 5 + c2, '#f6f2ea');
      if (c2 === 1) { R(x + 11, top + 10 + f * 9, 8, 2, bal); R(x + 11, top + 10 + f * 9, 8, 1, tint(bal, 0.35)); R(x + 11, top + 12 + f * 9, 8, 1, 'rgba(0,0,0,0.2)'); } }
  }
  R(x, 92, 30, 8, shade(c, 0.2));
  if (k % 4 === 1) { R(x + 9, 90, 12, 10, '#3d2a20'); R(x + 10, 91, 10, 9, '#4a6f8e'); R(x + 14, 91, 1, 9, '#3d2a20'); R(x + 8, 89, 14, 1, '#7a7a7a'); }
  else { R(x + 3, 94, 24, 6, '#5d8a3a'); R(x + 3, 94, 24, 1, '#7aac4a'); for (let i = 4; i < 26; i += 4) R(x + i, 93, 2, 1, '#7aac4a'); }
}
function domek(x, k) {
  const r = h1(k * 2);
  R(x, 92, 30, 8, '#7fa646'); R(x, 92, 30, 1, '#9cc45a');
  if (r < 0.35) { tree(x + 10, 100, k); if (r < 0.15) tree(x + 24, 100, k + 9); fence(x); return; }
  const c = ['#f2e2bc', '#f6ecd8', '#e8cfa0', '#d9e6c4', '#f0d0c0'][(h1(k) * 5) | 0];
  fillP(plasterPat(c), x + 3, 78, 24, 22); R(x + 26, 78, 1, 22, shade(c, 0.25)); R(x + 3, 78, 1, 22, tint(c, 0.3));
  ctx.fillStyle = '#4a1e16'; ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(x + 15, 65); ctx.lineTo(x + 30, 80); ctx.fill();
  ctx.fillStyle = '#b4452e'; ctx.beginPath(); ctx.moveTo(x + 1, 79); ctx.lineTo(x + 15, 66); ctx.lineTo(x + 29, 79); ctx.fill();
  for (let y = 70; y < 79; y += 3) { const hw = (y - 66) * 14 / 13; R(x + 15 - hw, y, hw * 2, 1, '#8e3422'); }
  R(x + 20, 67, 3, 6, '#8e4434');
  win(x + 7, 84, 5, 5, k * 3, '#fff'); win(x + 18, 84, 5, 5, k * 3 + 1, '#fff');
  R(x + 7, 90, 5, 1, '#d04a3a'); R(x + 18, 90, 5, 1, '#e8a020');
  R(x + 13, 90, 4, 10, '#6a3e26'); R(x + 14, 91, 2, 3, '#a87a4a'); R(x + 16, 95, 1, 1, '#f2c318');
  fence(x);
}
function fence(x) { for (let i = 0; i < 30; i += 3) { R(x + i, 95, 1, 5, '#f4ecd8'); R(x + i, 95, 1, 1, '#fff'); } R(x, 96, 30, 1, '#e0d6c0'); R(x, 98, 30, 1, '#c8bca2'); }
function hala(x, k) {
  fillP(brickPat('#a8503a'), x, 56, 30, 44);
  R(x, 54, 30, 3, '#4a2018'); R(x, 54, 30, 1, '#7a3a2c'); R(x, 57, 30, 1, '#e0c8a8');
  if (k % 3 === 0) { R(x + 4, 65, 22, 35, '#e0c8a8'); R(x + 5, 66, 20, 34, '#4a5560'); for (let i = 0; i < 34; i += 3) { R(x + 5, 66 + i, 20, 1, '#5e6a76'); R(x + 5, 67 + i, 20, 1, '#3e4852'); } }
  else { ctx.fillStyle = '#e0c8a8'; ctx.beginPath(); ctx.arc(x + 15, 72, 9, Math.PI, 0); ctx.fill(); R(x + 6, 72, 18, 14, '#e0c8a8'); win(x + 8, 70, 6, 14, k, '#e0c8a8'); win(x + 16, 70, 6, 14, k + 1, '#e0c8a8'); }
  R(x + 29, 56, 1, 44, 'rgba(0,0,0,0.25)');
  if (k % 9 === 0) { R(x + 2, 44, 70, 10, '#1d4f91'); R(x + 2, 44, 70, 1, '#4a7cc0'); R(x + 2, 53, 70, 1, '#0f2a50'); ptext(G.mode === 'tram' ? 'ZAJEZDNIA MPK' : 'BAZA MPK', x + 37, 45, '#ffffff', 7, 'center'); }
}
const TREEPAL = [['#e8a030', '#b8681e', '#f8d070', '#8a4a16'], ['#d8602a', '#a8401e', '#f09050', '#702a12'], ['#7cac3a', '#527e26', '#a8d460', '#3a5a1a'], ['#ecc23a', '#bc8e1c', '#fbe680', '#7a5a10'], ['#5e9a3a', '#3e7228', '#8cc458', '#2a4a1a'], ['#c8502e', '#92361c', '#e8804a', '#5a2010']];
const TREEPAL_S = { summer: [['#5e9a3a', '#3e7228', '#8cc458', '#2a4a1a'], ['#7cac3a', '#527e26', '#a8d460', '#3a5a1a'], ['#4a8a3a', '#2e6424', '#74b450', '#1e3e16']],
  spring: [['#f4b6c8', '#d88aa4', '#fde0ea', '#9a5a6a'], ['#8cd050', '#5ea432', '#b8ec7a', '#3a6a1e'], ['#f8f4f0', '#d8d0d4', '#ffffff', '#8a7a80'], ['#9cd85a', '#6aa83a', '#c8f48a', '#3a6a1e']] };
function tree(x, yb, k) {
  x = Math.round(x); const PAL = SEASON === 'autumn' ? TREEPAL : TREEPAL_S[SEASON];
  if (!PAL) { const s = spr('treeW' + (k % 3), 20, 30, f => { f(9, 12, 2, 18, '#5a3a22'); f(10, 12, 1, 18, '#7a5232'); for (const [bx, by, dx] of [[9, 16, -1], [10, 14, 1], [9, 20, -1], [10, 19, 1], [9, 11, 0]]) for (let i = 0; i < 6; i++) { const px = bx + dx * i, py = by - i; f(px, py, 1, 1, '#5a3a22'); if (i === 5 || (i === 3 && (k % 2))) f(px, py - 1, 1, 1, '#ffffff'); } f(4, 4, 12, 1, '#ffffff'); });
    R(x - 6, yb - 1, 13, 2, 'rgba(30,40,60,0.18)'); ctx.drawImage(s, x - 10, yb - 30); return; }
  const pi = (h1(k * 11) * PAL.length) | 0, big = h1(k * 29) > 0.5;
  const s = spr('tree' + SEASON + pi + big, 20, 30, (f) => {
    const [b, d, l, o] = PAL[pi], cx = 10, cy = big ? 11 : 13, rr = big ? 8 : 6.5;
    f(9, 17, 2, 13, '#5a3a22'); f(10, 17, 1, 13, '#7a5232'); f(8, 22, 1, 1, '#5a3a22');
    const disc = (ox, oy, r, col) => { for (let dy = -Math.ceil(r); dy <= r; dy++) { const hw = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy))); if (hw > 0) f(cx + ox - hw, cy + oy + dy, hw * 2, 1, col); } };
    disc(0, 0, rr + 1, o); disc(0, 0, rr, d); disc(-1, -1, rr - 1.5, b); disc(-2, -3, rr - 4.5, l);
    for (let i = 0; i < 8; i++) { const a = h1(pi * 50 + i) * 6.28, q = h1(pi * 70 + i) * (rr - 2); f(Math.round(cx + Math.cos(a) * q), Math.round(cy + Math.sin(a) * q), 1, 1, i % 2 ? l : d); }
  });
  R(x - 6, yb - 1, 13, 2, 'rgba(30,40,10,0.22)');
  ctx.drawImage(s, x - 10, yb - 30);
}

// specjalne budynki: EBBLO, dworzec, most
function specials(w) {
  const out = [];
  if (w.depot && w.kind === 'line') { const a = w.depot.x - 130, b = w.depot.x + 400; out.push({ a, b, draw: () => drawDepotYard(sx(a), sx(w.depot.x)) }); }
  if (w.ebbloX !== null) {
    const a = w.ebbloX - 40, b = w.ebbloX + 30;
    out.push({ a, b, draw: () => drawEbblo(sx(a), sx(b)) });
  }
  for (const s of w.stops) {
    if (s.station) { const a = s.x - 55, b = s.x + 35; out.push({ a, b, draw: () => drawStation(sx(a), sx(b)) }); }
    if (s.bridge) { const a = s.x + 18, b = s.x + 95, gr = /grunwaldzki/i.test(s.name); out.push({ a, b, draw: () => drawRiver(sx(a), sx(b), gr) }); }
    const lm = LANDMARKS.find(l => l.re.test(s.name));
    if (s.loop && !lm && !s.station && !s.bridge) { const first = s === w.stops[0], a = first ? s.x - 150 : s.x - 25, b = first ? s.x + 5 : s.x + 130; out.push({ a, b, draw: () => drawLoop(sx(a), sx(b), s.name, Math.round(a)) }); }
    if (lm && !s.station) { const a = s.x - 50, b = s.x + (s.bridge ? 16 : 30); out.push({ a, b, draw: () => lm.draw(sx(a), sx(b)) }); }
  }
  return out;
}
// ===== pętla i zajezdnia =====
function parkedVeh(x, yb, len, mode) {
  x = Math.round(x); const h = mode === 'tram' ? 13 : 12, top = yb - h;
  R(x + 1, yb, len, 1, 'rgba(0,0,0,0.25)');
  R(x, top, len, h, '#ececec'); R(x, top, len, 1, '#ffffff'); R(x, top + h - 1, len, 1, '#b8b8b8');
  R(x, yb - 5, len, 2, mode === 'tram' ? '#c8102e' : '#1d4f91');
  for (let i = 3; i < len - 5; i += 7) R(x + i, top + 3, 5, 4, '#2e4a6b');
  R(x + len - 3, top + 2, 3, 5, '#2e4a6b');
  for (const f of mode === 'tram' ? [0.15, 0.5, 0.85] : [0.2, 0.8]) R(Math.round(x + f * len - 2), yb - 1, 4, 2, '#222');
  if (mode === 'tram') { R(Math.round(x + len * 0.45), top - 4, 1, 4, '#333'); R(Math.round(x + len * 0.4), top - 5, Math.round(len * 0.12), 1, '#333'); }
}
function drawLoop(x0, x1, name, seed) {
  const w = x1 - x0, cx = Math.round((x0 + x1) / 2), tram = G.mode === 'tram', rx = Math.min(w / 2 - 30, 130), ry = 11;
  R(x0, 46, w, 54, '#8fb85a'); R(x0, 46, w, 1, '#a8d070');
  for (let i = 0, x = x0 + 8; x < x1 - 6; i++, x += 18) tree(x, 64, seed + i * 7);
  R(x0, 64, w, 36, '#cdbfa4'); for (let y = 67; y < 100; y += 4) R(x0, y, w, 1, '#bcae92'); for (let x = x0 + (seed % 6); x < x1; x += 6) R(x, 64, 1, 36, 'rgba(150,135,110,0.25)');
  ctx.save();
  if (tram) {
    ctx.strokeStyle = '#8a7f70'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(cx, 82, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#4a4a52'; ctx.lineWidth = 1; for (const d of [-2, 2]) { ctx.beginPath(); ctx.ellipse(cx, 82, rx + d, ry + d, 0, 0, Math.PI * 2); ctx.stroke(); }
    R(cx + rx - 3, 82, 6, 18, '#8a7f70'); R(cx + rx - 2, 82, 1, 18, '#4a4a52'); R(cx + rx + 2, 82, 1, 18, '#4a4a52');
  } else {
    ctx.strokeStyle = '#4d4d56'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(cx, 82, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.ellipse(cx, 82, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    R(cx + rx - 4, 82, 8, 18, '#4d4d56');
  }
  ctx.fillStyle = '#6f9a3e'; ctx.beginPath(); ctx.ellipse(cx, 82, rx - 6, ry - 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  for (let i = 0; i < 10; i++) R(Math.round(cx - rx + 14 + h1(seed + i) * (rx * 2 - 28)), 80 + (i % 3), 1, 1, ['#f0d040', '#e04a4a', '#ffffff'][i % 3]);
  parkedVeh(cx - 40, 72, tram ? 70 : 52, G.mode);
  tree(cx + 50, 86, seed + 3);
  // dyspozytornia
  const bx = x0 + 10; R(bx, 78, 30, 22, '#e6dcc4'); R(bx + 29, 78, 1, 22, '#b8ab90'); R(bx - 2, 75, 34, 3, '#3a4a5a'); R(bx - 2, 74, 34, 1, '#5a6a7a');
  R(bx + 4, 82, 10, 7, '#36597c'); R(bx + 5, 83, 3, 2, '#9cc4e4'); R(bx + 19, 85, 7, 15, '#6a3e26'); R(bx + 24, 92, 1, 1, '#f2c318');
  R(bx, 67, 30, 7, '#1d4f91'); ptext('MPK', bx + 15, 68, '#ffffff', 5, 'center');
  if (NIGHT > 0.3) E(() => R(bx + 4, 82, 10, 7, 'rgba(255,214,140,0.95)'));
  // wiata i ławka
  const wx = x1 - 50; R(wx, 76, 34, 2, '#3a4a5a'); R(wx + 1, 78, 1, 22, '#5a6a7a'); R(wx + 32, 78, 1, 22, '#5a6a7a'); R(wx + 2, 78, 30, 14, 'rgba(170,210,235,0.45)'); R(wx + 6, 94, 22, 2, '#8a5a32');
  // tablica PĘTLA
  const tw = ptext(name, -500, -500, '#fff', 7), bw = Math.max(tw, 34) + 12, bxs = Math.round(cx - bw / 2);
  R(bxs + 4, 52, 2, 14, '#555'); R(bxs + bw - 6, 52, 2, 14, '#555');
  R(bxs - 1, 29, bw + 2, 24, '#f2f2f2'); R(bxs, 30, bw, 22, '#1d4f91');
  ptext('PĘTLA', cx, 32, '#f2c318', 7, 'center'); ptext(name, cx, 41, '#ffffff', 7, 'center');
  if (NIGHT > 0.3) E(() => { R(bxs, 30, bw, 1, '#7ab0ff'); });
}
function drawDepotYard(x0, gx) {
  const w = gx - x0; if (w <= 0) return;
  R(x0, 40, w, 60, '#8e8e94'); for (let x = x0 + 10; x < gx; x += 22) R(x, 60, 1, 40, '#a6a6ac');
  for (let i = 0, x = x0 + 8; x + 64 < gx; i++, x += 74) parkedVeh(x, 86 - (i % 2) * 14, 62, G.mode);
  fillP(brickPat('#a8503a'), x0, 90, w, 10); R(x0, 89, w, 1, '#e0c8a8');
  for (let x = x0 + 4; x < gx; x += 30) { R(x, 84, 4, 16, '#8e4030'); R(x, 83, 4, 1, '#e0c8a8'); }
  R(x0 + 14, 70, 40, 10, '#1d4f91'); ptext('WJAZD', x0 + 34, 72, '#ffffff', 6, 'center');
}
function drawDepotFront() {
  const w = G.world; if (!w || !w.depot || w.kind !== 'line') return;
  const gx = sx(w.depot.x); if (gx > W + 20) return;
  const x = Math.max(gx, -10), ww = W - x + 10;
  fillP(brickPat('#a8503a'), x, 0, ww, 112);
  R(x, 0, ww, 6, '#4a2018'); R(x, 6, ww, 2, '#e0c8a8');
  for (let wx2 = gx + 24; wx2 < W; wx2 += 30) if (wx2 > -20) { R(wx2, 24, 14, 30, '#e0c8a8'); R(wx2 + 1, 26, 12, 27, '#4a5560'); R(wx2 + 7, 26, 1, 27, '#e0c8a8'); R(wx2 + 1, 39, 12, 1, '#e0c8a8'); }
  R(x, 104, ww, 8, '#e0c8a8'); R(x, 111, ww, 1, '#6a3020');
  R(x, 112, ww, 86, 'rgba(16,14,22,0.62)');
  for (let lx = gx + 40; lx < W; lx += 70) { R(lx, 113, 10, 2, '#ffe9a0'); R(lx - 6, 115, 22, 6, 'rgba(255,233,160,0.12)'); }
  const tw = ptext(w.depot.name, -500, -500, '#fff', 8), sxp = gx + 24;
  R(sxp - 1, 63, tw + 18, 26, '#f2f2f2'); R(sxp, 64, tw + 16, 24, '#1d4f91'); ptext(w.depot.name, sxp + 8, 67, '#ffffff', 8); ptext('MPK WROCŁAW', sxp + 8, 78, '#f2c318', 6);
  fillP(brickPat('#8e4030'), gx - 7, 96, 8, 102); R(gx - 7, 96, 8, 2, '#e0c8a8');
}
function drawEbblo(x0, x1) {
  const w = x1 - x0, lw = Math.min(w - 12, 150), ok = LOGO.complete && LOGO.naturalWidth;
  const lh = Math.round(lw * (ok ? LOGO.naturalHeight / LOGO.naturalWidth : 0.272)), lx = Math.round(x0 + (w - lw) / 2), ly = 12;
  const top = ly + lh + 5;
  // bryła biurowca
  R(x0, top + 3, w, 100 - top - 3, '#5a6f86');
  for (let y = top + 7; y < 86; y += 6) R(x0, y, w, 1, '#3e5066');
  for (let x = x0 + 4; x < x1 - 2; x += 8) { R(x, top + 3, 1, 86 - top - 3, '#7f97b2'); for (let y = top + 8; y < 85; y += 6) { R(x + 2, y, 5, 4, '#89a9c8'); if (NIGHT > 0.3 && h1(x * 7 + y) < 0.7) { const xx = x, yy = y; E(() => R(xx + 2, yy, 5, 4, '#e8f4ff')); } } }
  R(x0 - 2, top, w + 4, 4, '#2b2a6b'); R(x0 - 2, top + 3, w + 4, 1, '#f2c318');
  // stalowa konstrukcja neonu na dachu
  R(lx - 2, top - 3, lw + 4, 2, '#4a5260');
  for (let x = lx + 4; x < lx + lw - 2; x += 14) { R(x, ly + lh - 4, 1, top - ly - lh + 4, '#4a5260'); R(x + 1, top - 3, 1, 3, '#4a5260'); }
  for (let x = lx + 2; x < lx + lw; x += 7) R(x, top - 4, 3, 1, '#6b7482');
  // logo
  if (ok) { const img = logoPx(lw); ctx.drawImage(img, lx, ly); if (NIGHT > 0.3) E(() => { ctx.globalAlpha = Math.min(1, NIGHT); ctx.drawImage(img, lx, ly); ctx.globalAlpha = 1; R(lx, ly + lh + 1, lw, 1, 'rgba(242,195,24,0.6)'); }); }
  else ptext('ebblo', lx + lw / 2, ly, '#2b2a6b', 16, 'center');
  // parter + wejście
  R(x0, 86, w, 14, '#2c3440'); R(x0 + w / 2 - 8, 88, 16, 12, '#9cc3e6'); R(x0 + w / 2, 88, 1, 12, '#2c3440');
  ptext('EBBLO OFFICE', x0 + 6, 89, '#f2c318', 7);
  R(x0 + w / 2 - 12, 86, 24, 2, '#f2c318');
}
// ===== zabytki Wrocławia =====
function gothWin(x, y, w, h, c) { R(x, y + 2, w, h - 2, c); R(x + 1, y + 1, w - 2, 1, c); if (w > 2) R(x + (w >> 1), y, 1, 1, c); }
function roofTri(x, y, w, h, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w / 2, y - h); ctx.lineTo(x + w, y); ctx.fill(); }
function plaque(txt, cx, y) { const tw = ptext(txt, -200, -200, '#fff', 6); R(cx - tw / 2 - 2, y, tw + 4, 8, '#1d2b3a'); ptext(txt, cx, y, '#f2d21a', 6, 'center'); }
function sideHouses(x0, x1, k) {
  for (let x = x0, i = 0; x < x1; x += 22, i++) {
    const c = FACADES[(h1(k + i * 3) * FACADES.length) | 0], h = 46 + (h1(k + i) * 4 | 0) * 4, w = Math.min(22, x1 - x);
    R(x, 100 - h, w, h, c); for (let st = 0; st < 3; st++) R(x + st * 3, 100 - h - 4 - st * 4, w - st * 6, 4, c);
    for (let f = 0; 100 - h + 6 + f * 10 < 86; f++) for (let c2 = 0; c2 < 2; c2++) win(x + 4 + c2 * 9, 100 - h + 6 + f * 10, 4, 6, k + i * 13 + f * 3 + c2);
    R(x, 86, w, 14, '#6d5a4a'); R(x + 4, 88, 10, 9, '#3b4f63');
  }
}
function drawRatusz(x0, x1) {
  const w = x1 - x0, cx = x0 + w / 2, bw = 112, bx = cx - bw / 2;
  sideHouses(x0, bx - 6, 71); sideHouses(bx + bw + 6, x1, 91);
  R(bx - 6, 96, bw + 12, 4, '#9a8f80');
  R(bx, 50, bw, 50, '#c8a87a'); roofTri(bx - 2, 51, bw + 4, 18, '#4f3b30');
  for (let st = 0; st < 5; st++) R(bx + 30 + st * 4, 34 - st * 5 + 17, 28 - st * 8, 5, '#c8a87a');
  for (let i = 0; i < 8; i++) { gothWin(bx + 6 + i * 13, 60, 6, 12, '#33465a'); gothWin(bx + 6 + i * 13, 78, 6, 12, '#33465a'); }
  for (let i = 0; i < bw; i += 4) R(bx + i, 50, 2, 2, '#e5d2a8');
  const tx = bx + bw - 26; R(tx, 14, 14, 86, '#bfa070'); R(tx - 1, 14, 16, 2, '#8a6a48');
  ctx.fillStyle = '#e8e2cf'; ctx.beginPath(); ctx.arc(tx + 7, 30, 5, 0, 7); ctx.fill(); R(tx + 7, 26, 1, 4, '#222'); R(tx + 7, 30, 3, 1, '#222');
  R(tx + 3, 6, 8, 8, '#3d6b55'); roofTri(tx + 2, 6, 10, 8, '#3d6b55'); R(tx + 6, -4, 2, 4, '#c9a640');
  R(cx - 9, 86, 14, 14, '#4a3020'); gothWin(cx - 8, 86, 12, 14, '#4a3020');
  plaque('RATUSZ · RYNEK', cx, 40);
  if (NIGHT > 0.3) E(() => { ctx.fillStyle = 'rgba(255,220,150,0.18)'; ctx.fillRect(bx, 50, bw, 50); R(tx + 2, 25, 10, 10, 'rgba(255,240,190,0.5)'); });
}
function drawHalaStulecia(x0, x1) {
  const w = x1 - x0, cx = x0 + w / 2 + 14, c = '#d9d3c4', d = '#9a9384';
  R(x0, 92, w, 8, '#7fa05a');
  const tiers = [[150, 74, 26], [118, 62, 12], [88, 52, 10], [60, 44, 8], [34, 38, 6]];
  for (const [tw, ty, th] of tiers) { R(cx - tw / 2, ty, tw, th, c); R(cx - tw / 2, ty, tw, 1, '#f0ece2'); for (let x = cx - tw / 2 + 3; x < cx + tw / 2 - 2; x += 5) R(x, ty + 2, 2, th - 3, d); if (NIGHT > 0.3) E(() => { for (let x = cx - tw / 2 + 3; x < cx + tw / 2 - 2; x += 5) R(x, ty + 2, 2, th - 3, 'rgba(255,230,170,0.6)'); }); }
  roofTri(cx - 17, 38, 34, 4, c);
  R(cx - 10, 86, 20, 14, '#5a5448');
  const ix = x0 + 14; R(ix, 4, 2, 96, '#c9cbcf'); R(ix - 5, 86, 1, 14, '#c9cbcf'); R(ix + 6, 86, 1, 14, '#c9cbcf');
  ctx.strokeStyle = '#c9cbcf'; ctx.beginPath(); ctx.moveTo(ix - 5, 86); ctx.lineTo(ix, 60); ctx.lineTo(ix + 7, 86); ctx.stroke();
  plaque('HALA STULECIA · IGLICA', cx, 24);
}
function drawZoo(x0, x1) {
  const w = x1 - x0; R(x0, 92, w, 8, '#7fa05a');
  for (let i = 0; i < 6; i++) tree(x0 + 10 + i * (w - 20) / 5, 92, i * 7 + 3);
  for (let x = x0; x < x1; x += 3) R(x, 86, 1, 14, '#2d5a2d'); R(x0, 86, w, 1, '#2d5a2d'); R(x0, 92, w, 1, '#2d5a2d');
  const gx = x0 + w / 2 - 30; R(gx, 60, 6, 40, '#8a5a32'); R(gx + 54, 60, 6, 40, '#8a5a32'); R(gx - 4, 54, 68, 10, '#2d5a2d');
  ptext('ZOO WROCŁAW', gx + 30, 55, '#f2d21a', 7, 'center');
  const fx = x0 + w - 40; R(fx, 40, 3, 50, '#e0b050'); R(fx + 6, 40, 3, 50, '#e0b050'); R(fx - 2, 60, 18, 14, '#e0b050'); R(fx + 12, 22, 4, 40, '#e0b050'); R(fx + 12, 18, 9, 6, '#e0b050'); R(fx + 13, 16, 1, 2, '#6a4a2a'); R(fx + 15, 16, 1, 2, '#6a4a2a'); R(fx + 18, 19, 1, 1, '#111');
  for (let i = 0; i < 9; i++) R(fx + (h1(i) * 14 | 0), 42 + (h1(i * 3) * 44 | 0), 3, 3, '#8a5a2a');
  R(x0 + 18, 70, 70, 22, '#3a6a8a'); roofTri(x0 + 14, 70, 78, 10, '#cfd8dc'); plaque('AFRYKARIUM', x0 + 53, 76);
}
function drawKatedra(x0, x1) {
  const w = x1 - x0, cx = x0 + w / 2, bx = cx - 50;
  R(x0, 96, w, 4, '#8a8478');
  for (let x = x0; x < x1; x += 14) { R(x + 6, 82, 1, 14, '#2f3338'); R(x + 4, 80, 5, 3, '#2f3338'); if (NIGHT > 0.1) { const xx = x; E(() => R(xx + 5, 81, 3, 2, '#ffd27a')); } }
  R(bx + 20, 48, 80, 52, '#9b4632'); roofTri(bx + 18, 49, 84, 14, '#4a4a4a');
  for (let i = 0; i < 5; i++) gothWin(bx + 28 + i * 14, 58, 6, 20, '#33465a');
  for (const tx of [bx, bx + 22]) { R(tx, 18, 20, 82, '#a04e38'); R(tx, 18, 20, 2, '#7a3424'); for (let y = 26; y < 90; y += 14) gothWin(tx + 7, y, 6, 9, '#2a3848'); R(tx + 1, 10, 18, 8, '#4f8a72'); roofTri(tx + 1, 10, 18, 26, '#4f8a72'); R(tx + 9, -20, 2, 6, '#c9a640'); }
  ctx.fillStyle = '#33465a'; ctx.beginPath(); ctx.arc(bx + 21, 48, 6, 0, 7); ctx.fill();
  R(bx + 15, 84, 12, 16, '#4a3020');
  plaque('KATEDRA · OSTRÓW TUMSKI', cx + 20, 40);
}
function drawSkyTower(x0, x1) {
  const w = x1 - x0, tx = x0 + w / 2 - 18;
  R(x0 + 6, 64, w - 12, 36, '#8aa2b8'); for (let y = 68; y < 96; y += 5) R(x0 + 6, y, w - 12, 2, '#5a7896');
  R(tx, 4, 36, 96, '#9ab8d2'); R(tx, 4, 4, 96, '#6f8eaa'); R(tx + 32, 4, 4, 96, '#b8d4ea');
  for (let y = 8; y < 98; y += 4) { R(tx + 4, y, 28, 1, '#5f7f9c'); if (NIGHT > 0.3) { const yy = y; E(() => R(tx + 4 + (h1(yy) * 20 | 0), yy + 1, 6, 2, '#e8f4ff')); } }
  R(tx + 6, -2, 24, 6, '#6f8eaa'); R(tx + 17, -10, 2, 8, '#444'); E(() => { if ((G.clock * 1.5 | 0) % 2) R(tx + 17, -10, 2, 2, '#ff3030'); });
  plaque('SKY TOWER', tx + 18, 52);
}
function drawPanorama(x0, x1) {
  const w = x1 - x0, cx = x0 + w / 3;
  R(x0, 94, w, 6, '#7fa05a');
  R(cx - 40, 56, 80, 44, '#b8b0a0'); for (let x = cx - 36; x < cx + 36; x += 9) R(x, 62, 4, 22, '#6f6658');
  ctx.fillStyle = '#4a4a4a'; ctx.beginPath(); ctx.moveTo(cx - 44, 57); ctx.lineTo(cx, 38); ctx.lineTo(cx + 44, 57); ctx.fill();
  R(cx - 6, 84, 12, 16, '#3a3028'); plaque('PANORAMA RACŁAWICKA', cx, 44);
  const gx = cx + 50; R(gx, 46, x1 - gx - 4, 54, '#4f6f8a'); for (let y = 50; y < 96; y += 6) R(gx, y, x1 - gx - 4, 4, '#8fb6d2'); plaque('GALERIA DOMINIKAŃSKA', gx + (x1 - gx) / 2, 38);
}
function drawHalaTargowa(x0, x1) {
  const w = x1 - x0, cx = x0 + w / 2, bw = 150, bx = cx - bw / 2;
  R(bx, 44, bw, 56, '#a8503a'); for (let y = 48; y < 100; y += 3) R(bx, y, bw, 1, 'rgba(0,0,0,0.08)');
  for (let st = 0; st < 4; st++) R(cx - 40 + st * 8, 36 - st * 6, 80 - st * 16, 8, '#a8503a');
  ctx.fillStyle = '#33465a'; ctx.beginPath(); ctx.arc(cx, 66, 22, Math.PI, 0); ctx.fill(); R(cx - 22, 66, 44, 10, '#33465a'); for (let x = cx - 18; x < cx + 20; x += 6) R(x, 46, 1, 30, '#a8503a');
  for (let i = 0; i < 4; i++) { gothWin(bx + 6 + i * 10, 58, 5, 18, '#33465a'); gothWin(bx + bw - 11 - i * 10, 58, 5, 18, '#33465a'); }
  R(cx - 10, 84, 20, 16, '#3a2a20'); plaque('HALA TARGOWA', cx, 78);
  sideHouses(x0, bx - 4, 33); sideHouses(bx + bw + 4, x1, 55);
}
function drawRenoma(x0, x1) {
  const w = x1 - x0, bx = x0 + 20, bw = w - 40;
  R(bx, 26, bw, 74, '#2f3a36'); R(bx, 26, bw, 3, '#c9a640'); R(bx, 84, bw, 2, '#c9a640');
  for (let x = bx + 4; x < bx + bw - 4; x += 10) { R(x, 32, 6, 50, '#1a2420'); R(x + 1, 32, 1, 50, '#c9a640'); if (NIGHT > 0.3) { const xx = x; E(() => R(xx + 2, 34, 3, 46, 'rgba(255,220,150,0.5)')); } }
  R(bx + bw - 30, 14, 30, 14, '#3a8a7a'); plaque('RENOMA', bx + bw / 2, 16);
  R(bx, 86, bw, 14, '#20282a'); for (let x = bx + 8; x < bx + bw - 10; x += 26) R(x, 88, 18, 12, '#9cc3e6');
}
function drawNFM(x0, x1) {
  const w = x1 - x0, bx = x0 + 10, bw = w - 20;
  R(x0, 96, w, 4, '#8a8478');
  R(bx, 30, bw, 70, '#2a2a2e'); R(bx, 30, bw, 2, '#4a4a50');
  for (let x = bx + 3, i = 0; x < bx + bw - 2; x += 4, i++) R(x, 34 + (i % 3) * 4, 2, 50 - (i % 3) * 4, ['#8a5a32', '#a46c3c', '#6e4626'][i % 3]);
  R(bx + bw / 2 - 30, 84, 60, 16, '#e8d8b8'); for (let x = bx + bw / 2 - 26; x < bx + bw / 2 + 26; x += 10) R(x, 86, 6, 14, '#33465a');
  if (NIGHT > 0.3) E(() => { ctx.fillStyle = 'rgba(255,200,120,0.25)'; ctx.fillRect(bx, 34, bw, 50); });
  plaque('NARODOWE FORUM MUZYKI', x0 + w / 2, 20);
}
function drawUniwersytet(x0, x1) {
  const w = x1 - x0, c = '#ead9a6', d = '#c9b27a';
  R(x0, 96, w, 4, '#8a8478');
  R(x0 + 4, 46, w - 8, 54, c); R(x0 + 4, 46, w - 8, 2, '#fff2c8'); roofTri(x0 + 2, 47, w - 4, 10, '#7a4a3a');
  for (let x = x0 + 9; x < x1 - 10; x += 11) for (let y = 52; y < 84; y += 13) { R(x, y, 5, 9, '#3e536a'); R(x - 1, y - 1, 7, 1, d); R(x + 2, y - 3, 1, 2, d); }
  const tx = x0 + w / 2 - 9; R(tx, 18, 18, 30, c); R(tx, 18, 18, 1, '#fff2c8'); win(tx + 6, 26, 6, 10, 5);
  ctx.fillStyle = '#4f8a72'; ctx.beginPath(); ctx.arc(tx + 9, 18, 9, Math.PI, 0); ctx.fill(); R(tx + 8, 2, 2, 8, '#4f8a72'); R(tx + 6, 0, 6, 2, '#c9a640');
  R(x0 + w / 2 - 8, 84, 16, 16, '#5a3a24'); ctx.fillStyle = '#5a3a24'; ctx.beginPath(); ctx.arc(x0 + w / 2, 84, 8, Math.PI, 0); ctx.fill();
  if (NIGHT > 0.3) E(() => { ctx.fillStyle = 'rgba(255,220,150,0.2)'; ctx.fillRect(x0 + 4, 46, w - 8, 54); });
  plaque('UNIWERSYTET · AULA LEOPOLDINA', x0 + w / 2, 36);
}
function drawOgrodJaponski(x0, x1) {
  const w = x1 - x0;
  R(x0, 80, w, 20, '#6f9a44'); R(x0, 80, w, 1, '#9cc45a');
  R(x0 + 14, 88, w - 40, 8, mix('#5aa0c8', '#1a2a48', NIGHT)); for (let x = x0 + 18; x < x1 - 30; x += 9) R(x + ((G.clock * 3 + x) % 4), 91, 3, 1, '#a8d8f0');
  ctx.strokeStyle = '#c8321e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 30, 90); ctx.quadraticCurveTo(x0 + 48, 72, x0 + 66, 90); ctx.stroke(); ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { const x = x0 + 34 + i * 7; R(x, 80 + Math.abs(i - 2) * 2, 1, 6, '#c8321e'); }
  const px = x1 - 46; R(px, 62, 26, 24, '#e8dcc0'); R(px + 3, 66, 20, 18, '#5a3a24'); R(px - 6, 58, 38, 5, '#3a3a3a'); R(px - 2, 54, 30, 4, '#3a3a3a'); R(px + 6, 50, 14, 4, '#3a3a3a'); R(px + 12, 46, 2, 4, '#c9a640');
  for (const [cx, cy] of [[x0 + 10, 78], [x0 + 82, 76], [x1 - 10, 80]]) { R(cx, cy - 6, 2, 10, '#5a3a22'); for (let i = 0; i < 14; i++) R(cx - 6 + (h1(i + cx) * 13 | 0), cy - 16 + (h1(i * 3 + cx) * 10 | 0), 3, 3, i % 3 ? '#f4b6c8' : '#e88aa8'); }
  plaque('OGRÓD JAPOŃSKI', x0 + w / 2, 30);
}
function drawArena(x0, x1) {
  const w = x1 - x0, cx = Math.round(x0 + w / 2), bw = Math.min(w - 10, 220), top = 40, bot = 94;
  R(x0, 92, w, 8, '#7fa05a'); R(x0, 95, w, 5, '#b9b3a6'); for (let x = x0; x < x1; x += 6) R(x, 95, 1, 5, '#a39d90');
  // dach – płaska konstrukcja wysunięta nad elewację, cienkie maszty i liny
  for (const mx of [cx - bw / 2 + 18, cx - bw / 6, cx + bw / 6, cx + bw / 2 - 18]) {
    const m = Math.round(mx); R(m, 18, 2, top - 18, '#e8ecef'); ctx.strokeStyle = '#cfd6db'; ctx.beginPath(); ctx.moveTo(m + 1, 19); ctx.lineTo(m - 16, top); ctx.moveTo(m + 1, 19); ctx.lineTo(m + 18, top); ctx.stroke();
  }
  R(cx - bw / 2 - 6, top - 4, bw + 12, 3, '#f4f6f8'); R(cx - bw / 2 - 6, top - 1, bw + 12, 2, '#9aa4ad');
  // elewacja: półprzezroczysta membrana z włókna szklanego, rozszerzająca się ku górze
  const glow = NIGHT > 0.3, hue = ['#ff8a1e', '#20b060', '#e03030'][(G.clock / 8 | 0) % 3];
  for (let y = top; y < bot - 8; y++) {
    const hw = Math.round(bw / 2 - (y - top) * 0.32), band = (y - top) % 14 < 3;
    R(cx - hw, y, hw * 2, 1, band ? '#7d8790' : '#e6ebef');
  }
  for (let y = top; y < bot - 8; y += 2) { const hw = Math.round(bw / 2 - (y - top) * 0.32); for (let x = cx - hw + 3; x < cx + hw - 2; x += 6) R(x, y, 1, 2, '#c3ccd4'); }
  if (glow) E(() => { for (let y = top; y < bot - 8; y++) { const hw = Math.round(bw / 2 - (y - top) * 0.32); ctx.fillStyle = hue; ctx.globalAlpha = 0.35 + 0.15 * Math.sin(G.clock * 2 + y * 0.2); ctx.fillRect(cx - hw, y, hw * 2, 1); } ctx.globalAlpha = 1; });
  // parter: przeszklone wejścia i bramy
  const gw = Math.round(bw / 2 - (bot - 8 - top) * 0.32);
  R(cx - gw, bot - 8, gw * 2, 9, '#3a434c');
  for (let x = cx - gw + 4; x < cx + gw - 10; x += 16) { R(x, bot - 6, 10, 7, glow ? '#ffd98a' : '#7fb0d6'); R(x + 5, bot - 6, 1, 7, '#3a434c'); }
  // flagi Śląska przed stadionem
  for (let i = 0; i < 3; i++) { const fx = Math.round(x0 + 6 + i * 7); R(fx, 64, 1, 32, '#d0d0d0'); const c = ['#1e8c3a', '#f4f4f4', '#d0202a'][i]; const wv = (G.clock * 4 + i | 0) % 2; R(fx + 1, 64 + wv, 5, 3, c); }
  plaque('TARCZYŃSKI ARENA', cx, 8);
}
const LANDMARKS = [
  { re: /^rynek$/i, draw: drawRatusz },
  { re: /hala stulecia/i, draw: drawHalaStulecia },
  { re: /^zoo$/i, draw: drawZoo },
  { re: /katedra|pl\. bema/i, draw: drawKatedra },
  { re: /^wielka$|sky tower/i, draw: drawSkyTower },
  { re: /galeria dominika|panorama/i, draw: drawPanorama },
  { re: /forum muzyki/i, draw: drawNFM },
  { re: /uniwersytet/i, draw: drawUniwersytet },
  { re: /ogród japoński/i, draw: drawOgrodJaponski },
  { re: /hala targowa/i, draw: drawHalaTargowa },
  { re: /^renoma$/i, draw: drawRenoma },
  { re: /tarczyński arena/i, draw: drawArena },
];

function drawStation(x0, x1) {
  const w = x1 - x0;
  R(x0, 48, w, 52, '#e3d2a8'); R(x0, 46, w, 3, '#9b5e3a');
  for (let i = 0; i < 4; i++) { const tx = x0 + 6 + i * (w - 20) / 3; R(tx, 30, 10, 18, '#e3d2a8'); R(tx - 1, 26, 12, 4, '#9b5e3a'); R(tx + 4, 18, 2, 8, '#9b5e3a'); }
  for (let x = x0 + 4; x < x1 - 8; x += 12) { R(x, 58, 7, 14, '#3e536a'); ctx.fillStyle = '#3e536a'; ctx.beginPath(); ctx.arc(x + 3.5, 58, 3.5, Math.PI, 0); ctx.fill(); if (NIGHT > 0.3) { const xx = x; E(() => R(xx, 58, 7, 14, '#ffd98a')); } }
  R(x0 + w / 2 - 30, 76, 60, 9, '#1d4f91'); ptext('WROCŁAW GŁÓWNY', x0 + w / 2, 76, '#fff', 7, 'center');
  R(x0, 86, w, 14, '#c9b48a'); R(x0 + w / 2 - 10, 88, 20, 12, '#4a3020');
}
function drawRiver(x0, x1, gr) {
  R(x0, 60, x1 - x0, 40, mix('#9fc3dc', '#1a2a48', NIGHT));
  R(x0, 88, x1 - x0, 12, mix('#3e7aa6', '#0e1a33', NIGHT));
  for (let x = x0; x < x1; x += 7) R(x + ((G.clock * 4 + x) % 5), 92 + (x % 3) * 2, 3, 1, '#9fd0f0');
  R(x0, 84, x1 - x0, 3, '#6d6d6d'); for (let x = x0; x < x1; x += 4) R(x, 80, 1, 4, '#4a4a4a'); R(x0, 80, x1 - x0, 1, '#4a4a4a');
  if (gr) {
    const pa = x0 + 30, pb = x1 - 40;
    ctx.strokeStyle = '#3d5a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 - 20, 72); ctx.quadraticCurveTo(pa + 4, 26, pa + 4, 26); ctx.quadraticCurveTo((pa + pb) / 2, 90, pb + 4, 26); ctx.quadraticCurveTo(pb + 4, 26, x1 + 20, 72); ctx.stroke(); ctx.lineWidth = 1;
    for (let x = pa + 12; x < pb - 4; x += 8) { const t = (x - pa) / (pb - pa), y = 26 + 4 * (1 - (2 * t - 1) ** 2) * 28; R(x, y, 1, 80 - y, '#3d5a4a'); }
    for (const px of [pa, pb]) { R(px, 22, 10, 62, '#b8ab90'); R(px - 1, 20, 12, 3, '#8f846c'); R(px + 3, 34, 4, 10, '#5a5040'); ctx.fillStyle = '#5a5040'; ctx.beginPath(); ctx.arc(px + 5, 34, 2, Math.PI, 0); ctx.fill(); }
    plaque('MOST GRUNWALDZKI', (pa + pb) / 2 + 5, 8);
  }
}

// ===== ulica =====
function drawStreet() {
  const w = G.world, tram = G.mode === 'tram';
  // chodnik tylny
  fillP(PAVE(), 0, 100, W, 13); R(0, 100, W, 1, 'rgba(60,30,20,0.25)'); R(0, 112, W, 1, '#efe7d6'); R(0, 113, W, 1, '#8a8070');
  // latarnie co 25 m
  for (let k = Math.floor(camX / 25); k < (camX + W / PX) / 25 + 1; k++) {
    const x = sx(k * 25); R(x - 1, 104, 3, 6, '#24382e'); R(x, 76, 1, 30, '#2f4a3a'); R(x + 1, 76, 1, 30, '#4a6e58'); R(x - 1, 72, 3, 4, '#24382e'); R(x - 2, 71, 5, 1, '#2f4a3a'); R(x, 73, 1, 2, '#fff2c0');
    if (NIGHT > 0.2) E(() => { ctx.fillStyle = 'rgba(255,214,130,0.18)'; ctx.beginPath(); ctx.moveTo(x, 75); ctx.lineTo(x - 9, 113); ctx.lineTo(x + 10, 113); ctx.fill(); R(x - 1, 72, 3, 3, '#ffe7a8'); });
  }
  // krasnale
  if (w) for (const d of w.dwarfs) { const x = sx(d.x); if (x > -10 && x < W + 10) dwarf(x, 108, d.k); }
  // jezdnia dalsza
  fillP(ASPH(), 0, 114, W, 22); R(0, 114, W, 1, '#3e404a'); for (let x = -((camX * PX) % 24); x < W; x += 24) R(x, 124, 10, 1, '#f2eee2');
  for (const c of [...G.far, ...(tram ? [] : G.oppo.filter(o => o.type === 'car'))].sort((a, b) => (a.ly || 133) - (b.ly || 133))) {
    car(sx(c.x), c.ly || 133, c.col, c.v < 0, !!c.brk, c.type === 'car' ? undefined : c.type);
    // kierunkowskaz przed skrętem w ulicę poprzeczną
    if (c.tj && (G.clock * 3 | 0) % 2) { const x = Math.round(sx(c.x)), y = Math.round(c.ly) - 3; E(() => { R(x - 1, y, 1, 2, '#ffb000'); R(x + 13, y, 1, 2, '#ffb000'); }); }
  }
  if (tram) {
    fillP(GRASS(), 0, 136, W, 3); R(0, 136, W, 1, '#d8d0c0');
    track(139, 157); R(0, 157, W, 3, '#b0a690'); R(0, 157, W, 1, '#d4cab4');
  } else {
    R(0, 136, W, 2, '#f2eee2');
    fillP(ASPH(), 0, 138, W, 42);
    for (let x = -((camX * PX) % 24); x < W; x += 24) R(x, 158, 12, 1, '#f2eee2');
    R(0, 177, W, 1, '#f2eee2');
  }
  if (tram) track(160, 180);
  if (w) { for (const t of w.turns) drawTurnX(t, 'up'); for (const r of w.rounds) drawRound(r, 'up'); }
  for (const o of G.oppo) {
    if (tram) { const M = MODELS[o.m]; tramSprite(sx(o.x), sx(o.x + M.len), 155, true, null, M); }
    else if (o.type === 'bus') { const M = MODELS[o.m]; busSprite(sx(o.x), sx(o.x + M.len), 133, true, null, M); }


  }
  if (w) for (const j of w.junctions) drawJunction(j, false);
  if (w) for (const sg of w.signals) if (plainSig(sg)) drawCrossSt(sg, false);
  // przejścia dla pieszych
  if (w) for (const c of w.crossings) { const x = sx(c.x) - 6; if (x > -20 && x < W) for (const [a, b] of [[114, 136], [139, 157], [160, 180]]) for (let y = a + 1; y < b; y += 4) { R(x, y, 15, 2, '#f4f0e4'); R(x, y + 1, 15, 1, '#dcd6c6'); } }
  // liście na torach
  if (w) for (const l of w.leaves) { const a = sx(l.x0), b = sx(l.x1); for (let x = Math.max(a, -5); x < Math.min(b, W + 5); x += 3) { const r = h1(x + Math.round(camX * PX)); if (r < 0.6) R(x, 172 + (r * 9 | 0), 2, 1, l.ice ? (r < 0.3 ? '#dff2ff' : '#a8d4f0') : r < 0.3 ? '#c4572a' : '#e0a83a'); } }
  // roboty drogowe
  if (w) for (const k of w.works) { const a = sx(k.x0), b = sx(k.x1); if (b < -10 || a > W + 10) continue; R(a, 162, b - a, 16, '#6a5a48'); for (let x = a; x < b; x += 10) { R(x, 164, 2, 14, '#ff7a00'); R(x, 167, 2, 2, '#fff'); R(x, 172, 2, 2, '#fff'); } R(a, 158, b - a, 3, '#d03030'); for (let x = a; x < b; x += 6) R(x, 158, 3, 3, '#fff'); R(a + 2, 150, 9, 8, '#f2c318'); ptext('!', a + 6, 150, '#000', 7, 'center'); if (NIGHT > 0.2 && (G.clock * 2 | 0) % 2) E(() => R(a + 4, 148, 3, 2, '#ffb000')); }
  // trakcja
  if (tram) {
    for (let k = Math.floor(camX / 30); k < (camX + W / PX) / 30 + 1; k++) { const x = sx(k * 30 + 5); R(x, 118, 2, 40, '#2f4a3a'); R(x + 1, 118, 1, 40, '#4a6e58'); R(x - 1, 117, 4, 1, '#24382e'); R(x - 8, 122, 18, 1, '#3a4a42'); R(x - 8, 140, 18, 1, '#3a4a42'); }
    R(0, 123, W, 1, '#1e2226'); R(0, 141, W, 1, '#1e2226');
  }
  // sygnalizatory i zwrotnice
  if (w) { for (const s of w.switches) drawSwitch(s); for (const s of w.signals) drawSignal(s); }
}
function track(a, b) {
  fillP(SETT(), 0, a, W, b - a);
  R(0, a, W, 1, 'rgba(0,0,0,0.25)');
  R(0, a + 3, W, 1, '#5a544a'); R(0, a + 4, W, 1, '#c8ccd2'); R(0, a + 5, W, 1, '#7a7a80');
  R(0, b - 5, W, 1, '#5a544a'); R(0, b - 4, W, 1, '#eef0f4'); R(0, b - 3, W, 1, '#a8acb4'); R(0, b - 2, W, 1, '#4a4640');
}
function wheel(cx, cy, ph) {
  R(cx - 3, cy - 2, 6, 5, '#1a1a1a'); R(cx - 2, cy - 3, 4, 1, '#1a1a1a'); R(cx - 2, cy - 1, 4, 3, '#5d6168'); R(cx - 1, cy, 2, 1, '#9a9ea6');
  for (let k = 0; k < 3; k++) { const a = ph + k * 2.094; R(Math.round(cx - 0.5 + Math.cos(a) * 1.4), Math.round(cy + 0.2 + Math.sin(a) * 1.2), 1, 1, '#c8ccd2'); }
}
const wph = (px, r) => -((camX * PX + px) / r);
function zebraV(x, y0, y1, w) { for (let y = y0 + 1; y < y1; y += 4) { R(x, y, w, 2, '#f4f0e4'); R(x, y + 1, w, 1, '#dcd6c6'); } }
function laneArrow(x, y, d) {
  const c = '#f2eee2'; R(x, y, 9, 1, c);
  if (!d) { R(x + 9, y - 1, 1, 3, c); R(x + 10, y, 1, 1, c); R(x + 8, y - 2, 1, 5, c); return; }
  const s = -d; R(x + 8, s < 0 ? y - 4 : y + 1, 1, 4, c); R(x + 7, y + s * 4, 3, 1, c); R(x + 8, y + s * 5, 1, 1, c);
}
function drawTurnX(t, layer) {
  if (t.cut) return;
  const X = sx(t.x), a0 = sx(t.x + 3), a1 = sx(t.x + 23); if (a1 < -80 || X > W + 80) return;
  const tram = G.mode === 'tram', up = layer === 'up', y0 = up ? 100 : 180, y1 = up ? 180 : 225;
  if (up) streetGap(a0, a1 - a0);
  fillP(ASPH(), a0, y0, a1 - a0, y1 - y0);
  R(a0 - 1, y0, 1, up ? 14 : 18, '#7d7a73'); R(a1, y0, 1, up ? 14 : 18, '#7d7a73');
  for (let y = y0 + 2; y < y1; y += 8) R((a0 + a1) >> 1, y, 1, 4, '#f2eee2');
  if (up) {
    zebraV(X, 114, 136, 8); zebraV(a1 + 2, 114, 136, 8);
    if (tram) for (const [a, b] of [[139, 157], [160, 180]]) { R(a0, b - 4, a1 - a0, 2, '#c9cbcf'); R(a0, b - 2, a1 - a0, 1, '#55524c'); R(a0, a + 4, a1 - a0, 1, '#9c9a94'); R(a0, a + 3, a1 - a0, 1, '#5a544a'); }
    else { zebraV(X, 138, 180, 8); zebraV(a1 + 2, 138, 180, 8); laneArrow(X - 40, 148, t.dir > 0 ? 1 : 0); laneArrow(X - 40, 170, t.dir < 0 ? -1 : 0); }
  } else { zebraV(X, 182, 196, 8); }
}
function drawRound(r, layer) {
  const P = RB[G.mode], X = sx(r.x), RX = P.orx * PX; if (X + RX < -10 || X - RX > W + 10) return;
  const tram = G.mode === 'tram', lo = layer === 'low', ya = lo ? 180 : 100, yb2 = lo ? 230 : 180;
  const ell = (rx, ry, fn) => { for (let y = Math.max(ya, Math.ceil(P.Y - ry)); y < Math.min(yb2, P.Y + ry); y++) { const dy = (y + 0.5 - P.Y) / ry, hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy))); if (hw > 0) fn(X - hw, y, 2 * hw); } };
  ell(RX + 2, P.oy + 1, (x, y, w) => R(x, y, w, 1, '#8a8478'));
  ell(RX, P.oy, (x, y, w) => fillP(ASPH(), x, y, w, 1));
  const mx = P.rx * PX; ell(mx + 0.5, P.ry + 0.5, (x, y, w) => { if ((x + y) % 6 < 3) { R(x, y, 1, 1, '#d8d4c8'); R(x + w - 1, y, 1, 1, '#d8d4c8'); } });
  ell(P.irx * PX + 2, P.iy + 2, (x, y, w) => R(x, y, w, 1, (y & 1) ? '#d8d0c0' : '#c0392b'));
  ell(P.irx * PX, P.iy, (x, y, w) => fillP(GRASS(), x, y, w, 1));
  if (tram) { ctx.save(); ctx.beginPath(); ctx.rect(X - RX - 2, lo ? 999 : 139, 2 * RX + 4, 41); ctx.clip(); track(139, 157); track(160, 180); ctx.restore(); }
  if (!lo) {
    const cy = tram ? P.Y - P.iy + 9 : P.Y;
    if (tram) { R(X - 3, cy - 18, 7, 18, '#9aa0a8'); R(X - 2, cy - 22, 5, 4, '#c0c6ce'); R(X - 1, cy - 25, 3, 3, '#f2c318'); R(X - 6, cy - 1, 13, 2, '#6a6e74'); for (let i = 0; i < 10; i++) R(X - 12 + h1(i * 9 + r.x) * 24, cy + 2 + h1(i * 5) * 5, 1, 1, ['#e04a4a', '#f0d040', '#f4b6c8'][i % 3]); }
    else { for (let i = 0; i < 14; i++) R(X - 18 + h1(i * 9 + r.x) * 36, cy - 6 + h1(i * 5) * 12, 2, 1, ['#e04a4a', '#f0d040', '#f4b6c8', '#ffffff'][i % 4]); R(X - 1, cy - 9, 2, 9, '#5a3a22'); R(X - 4, cy - 14, 8, 6, '#4f8a32'); R(X - 3, cy - 15, 5, 2, '#78aa48'); }
    if (!tram) { const tx = sx(r.x - P.orx) - 4; for (const yy of [163, 141]) for (let y = yy; y < yy + 14; y += 4) { R(tx, y, 3, 1, '#f2eee2'); R(tx + 1, y + 1, 1, 1, '#f2eee2'); } }
  } else {
    const px = sx(r.x - P.orx) - 10; R(px + 2, 184, 1, 14, '#555'); ctx.fillStyle = '#1d5fb8'; ctx.beginPath(); ctx.arc(px + 2.5, 181, 4, 0, 7); ctx.fill(); R(px, 181, 5, 1, '#fff'); R(px + 2, 179, 1, 1, '#fff'); R(px + 4, 182, 1, 1, '#fff'); yieldSign(px, 199);
  }
  const split = G.mode === 'bus' && G.veh ? LANE_Y[0] - 22 * G.veh.ly : 178;
  for (const c of r.cars) {
    if (c.xm === undefined || c.ghost) continue;
    if ((c.y >= split - 2) !== lo) continue;
    const s = Math.sin(c.th), x = sx(c.xm);
    if (Math.abs(s) > 0.75) car(x - 7, Math.round(c.y + 3), c.col, s < 0, c.v < c.sp * 0.5, c.type);
    else crossVeh(x, { ...c, dir: -Math.sign(Math.cos(c.th)) || 1 });
    if (c.crash > 0) bubble(x, c.y - 8, '!', '#c0392b');
  }
}
function drawSwitch(s) {
  const x = sx(s.x); if (x < -40 || x > W + 40) return;
  R(x - 2, 174, 4, 4, s.ok ? '#3a8a3a' : '#c03030');
  // wskaźnik zwrotnicy
  R(x - 6, 158, 1, 12, '#333'); R(x - 9, 152, 7, 7, '#111');
  E(() => { if (s.ok) { R(x - 6, 153, 1, 5, '#fff'); } else { R(x - 8, 155, 5, 1, '#fff'); if ((G.clock * 3 | 0) % 2) R(x - 8, 153, 5, 1, '#ff4040'); } });
  if (!s.ok) ptext('W', x - 6, 144, '#ffcc00', 7, 'center');
}
function drawBranch(s) {
  const a = sx(s.x), b = sx(s.x + CURVE_LEN); if (b < -5 || a > W + 5) return;
  for (let px = Math.max(a, -1); px < Math.min(b, W + 1); px++) {
    const o = curveShape(camX + px / PX - s.x), oy = Math.round(o);
    if (oy > 0) { R(px, 180, 1, oy, (px + Math.round(camX * PX)) % 5 ? '#7b7466' : '#6d675a'); }
    R(px, 176 + oy, 1, 2, '#c9cbcf'); R(px, 164 + oy, 1, 1, '#9c9a94');
  }
}
function tramCurved(x0, x1, opts) { vehCurved(x0, x1, 178, opts); }
// pojazd na łuku: sprite rysowany raz bez obrotu, potem przesuwany kolumnami 1 px (ostre piksele, bez rozmycia)
let VCC = null, VCE = null;
function vehCurved(x0, x1, yb, opts) {
  const tram = G.mode === 'tram';
  if (!VCC || VCC.width !== W || VCC.height !== H) { VCC = document.createElement('canvas'); VCE = document.createElement('canvas'); VCC.width = VCE.width = W; VCC.height = VCE.height = H; }
  const g = VCC.getContext('2d'), ge = VCE.getContext('2d'), main = ctx, e0 = EMIT.length;
  g.clearRect(0, 0, W, H); ge.clearRect(0, 0, W, H);
  ctx = g; try { if (tram) tramSprite(x0, x1, yb, false, opts); else busSprite(x0, x1, yb, false, opts); } finally { ctx = main; }
  const em = EMIT.splice(e0);
  ctx = ge; try { for (const f of em) f(); } finally { ctx = main; }
  const a = Math.max(0, Math.floor(x0 - 14)), b = Math.min(W, Math.ceil(x1 + 80)), off = [];
  for (let px = a; px < b; px++) off.push(Math.round(curveOff(camX + clamp(px, x0, x1) / PX)));
  const blit = c => { for (let px = a; px < b; px++) ctx.drawImage(c, px, 0, 1, H, px, off[px - a], 1, H); };
  blit(VCC); E(() => blit(VCE));
}
function drawSignal(sg) {
  const x = sx(sg.x); if (x < -40 || x > W + 40) return;
  const st = sigState(sg), tram = G.mode === 'tram';
  // kierowcy na skrzyżowaniu – ruch poprzeczny
  // linia zatrzymania
  R(x - 2, tram ? 160 : 138, 1, tram ? 20 : 42, '#e9e9e9');
  // słup
  const px = x - 4, top = tram ? 140 : 132;
  R(px, top, 2, 160 - top + 18, '#2f3338');
  R(px - 2, top - 14, 6, 15, '#141414');
  if (tram) {
    E(() => { if (st === 'G') { if (sg.turn) for (let i = 0; i < 6; i++) R(px + (sg.turn > 0 ? 2 - i * 0.6 : -1 + i * 0.6) | 0, top - 12 + i, 2, 1, '#e8f6ff'); else R(px, top - 12, 2, 7, '#e8f6ff'); } else R(px - 1, top - 9, 4, 2, '#e8f6ff'); R(px, top - 3, 2, 2, st === 'Y' ? '#ffb000' : '#333'); });
  } else {
    E(() => { R(px, top - 13, 2, 3, st === 'R' ? '#ff3030' : '#4a1010'); R(px, top - 9, 2, 3, st === 'Y' ? '#ffb000' : '#4a3a10'); R(px, top - 5, 2, 3, st === 'G' ? '#30ff60' : '#103a18'); });
    if (sg.turn) { R(px - 2, top + 2, 6, 6, '#141414'); const c = st === 'G' ? '#30ff60' : '#1c4a26'; E(() => { R(px - 1, top + 4, 4, 1, c); R(sg.turn > 0 ? px - 1 : px + 2, top + 3, 1, 3, c); R(sg.turn > 0 ? px - 1 : px + 2, top + 3, 1, 1, c); }); }
  }
  // sygnalizator dla pieszych/aut z drugiej strony
  R(x + 22, 92, 1, 12, '#2f3338'); R(x + 21, 86, 3, 7, '#141414');
  E(() => R(x + 22, st === 'G' ? 87 : 90, 1, 2, st === 'G' ? '#ff3030' : '#30ff60'));
}
// ulica poprzeczna przy zwykłej sygnalizacji – auta poprzeczne jadą tylko po jezdni
const plainSig = sg => !sg.turn && !sg.noCross;
// prześwit ulicy poprzecznej między budynkami – auta wyjeżdżają z głębi ulicy, a nie ze ściany
const GAP_Y = 62;
function streetGap(x, w) {
  const top = GAP_Y, h = 100 - top, g = ctx.createLinearGradient(0, top, 0, 100);
  g.addColorStop(0, mix('#8a98a6', '#141a2a', NIGHT)); g.addColorStop(0.18, mix('#3a3d45', '#15161c', NIGHT)); g.addColorStop(1, mix('#55575d', '#2a2b30', NIGHT));
  ctx.fillStyle = g; ctx.fillRect(x, top, w, h);
  R(x - 3, top, 3, h, mix('#6e4a3a', '#2a1c18', NIGHT)); R(x + w, top, 3, h, mix('#4a3028', '#1c1210', NIGHT));
  R(x - 3, top, 1, h, 'rgba(0,0,0,0.35)'); R(x + w + 2, top, 1, h, 'rgba(0,0,0,0.35)');
  for (let y = top + 6; y < 100; y += 7) { R(x - 3, y, 3, 1, 'rgba(0,0,0,0.2)'); R(x + w, y, 3, 1, 'rgba(0,0,0,0.2)'); }
  R(x, top + 8, 2, h - 8, mix('#8a8478', '#3a3832', NIGHT)); R(x + w - 2, top + 8, 2, h - 8, mix('#8a8478', '#3a3832', NIGHT));
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, top, w, 4);
}
function clipGap(fn) { ctx.save(); ctx.beginPath(); ctx.rect(-50, GAP_Y + 1, W + 100, H); ctx.clip(); fn(); ctx.restore(); }
// widoczna pozycja auta na ulicy poprzecznej (zgodna z crossPhase, ale wyłania się z głębi ulicy)
function crossY(sg) {
  if (sg.forced) { const p = crossPhase(sg); return p < 0 ? null : GAP_Y + 2 + p * 141; }
  const t = (G.clock + sg.off) % CYCLE; if (t < 15.4) return null;
  return 64 + ((t - 15.4) % 4.5) / 3.2 * 105;
}
function drawCrossSt(sg, lower) {
  const X = sx(sg.x) + 3; if (X < -30 || X > W + 30) return;
  const asph = '#55575d', tram = G.mode === 'tram', j = sigJ(sg);
  if (!lower) {
    if (tram) { R(X, 136, 16, 3, asph); R(X, 157, 16, 3, asph); }
    for (const c of j.cars) if (c.y < 160) crossVeh(X + 8, c);
  } else {
    R(X, 180, 16, 45, asph); R(X - 1, 180, 1, 18, '#7d7a73'); R(X + 16, 180, 1, 18, '#7d7a73');
    for (let y = 186; y < 225; y += 8) R(X + 8, y, 1, 4, '#f2eee2');
    for (let x = X; x < X + 16; x += 3) R(x, 186, 2, 1, '#e9e9e9');
    for (const c of j.cars) if (c.y >= 160) crossVeh(X + 8, c);
  }
}
function drawJunction(j, lower) {
  const X = sx(j.x); if (X < -30 || X > W + 30) return;
  const asph = '#55575d', tram = G.mode === 'tram';
  if (!lower) {
    if (tram) for (const [a, b] of [[139, 157], [160, 180]]) { R(X - 6, a, 14, b - a, asph); R(X - 6, b - 4, 14, 2, '#c9cbcf'); R(X - 6, b - 2, 14, 1, '#55524c'); R(X - 6, a + 4, 14, 1, '#9c9a94'); }
    else R(X - 6, 136, 14, 2, asph);
    for (const c of j.cars) if (c.y < 160) crossVeh(X, c);
  } else {
    R(X - 6, 180, 14, 45, asph); R(X - 7, 180, 1, 18, '#7d7a73'); R(X + 8, 180, 1, 18, '#7d7a73');
    for (let x = X - 6; x < X + 8; x += 3) R(x, 206, 2, 1, '#e9e9e9');
    yieldSign(X - 13, 212);
    for (const c of j.cars) if (c.y >= 160) crossVeh(X, c);
  }
}
// znaki przed robotami drogowymi: A-14 (roboty), A-12b (zwężenie z prawej) + B-33 (30), C-10 (omijaj z lewej)
function triSign(x, yb, pict) {
  R(x + 4, yb - 9, 1, 9, '#666');
  ctx.fillStyle = '#c81e1e'; ctx.beginPath(); ctx.moveTo(x + 4.5, yb - 19); ctx.lineTo(x + 10, yb - 9.5); ctx.lineTo(x - 1, yb - 9.5); ctx.fill();
  ctx.fillStyle = '#f6c818'; ctx.beginPath(); ctx.moveTo(x + 4.5, yb - 17); ctx.lineTo(x + 8.3, yb - 10.5); ctx.lineTo(x + 0.7, yb - 10.5); ctx.fill();
  pict(x, yb);
}
function worksSigns(k) {
  const yb = 212, s = x => sx(x);
  const a = s(k.x0 - 70), b = s(k.x0 - 45), c = s(k.x0 - 3);
  if (a > -15 && a < W + 15) triSign(a, yb, (x, y) => { R(x + 4, y - 15, 1, 1, '#111'); R(x + 3, y - 14, 2, 2, '#111'); R(x + 5, y - 13, 1, 1, '#111'); R(x + 2, y - 12, 1, 1, '#111'); R(x + 5, y - 12, 2, 1, '#111'); });
  if (b > -15 && b < W + 15) {
    triSign(b, yb, (x, y) => { R(x + 3, y - 15, 1, 5, '#111'); R(x + 6, y - 12, 1, 2, '#111'); R(x + 5, y - 13, 1, 1, '#111'); });
    R(b + 13, yb - 9, 1, 9, '#666'); ctx.fillStyle = '#c81e1e'; ctx.beginPath(); ctx.arc(b + 13.5, yb - 13.5, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b + 13.5, yb - 13.5, 3.6, 0, 7); ctx.fill();
    ptext('30', b + 13.5, yb - 16, '#111', 5, 'center');
  }
  if (c > -15 && c < W + 15) {
    R(c + 3, yb - 9, 1, 9, '#666'); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(c + 3.5, yb - 13.5, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#1f5fbf'; ctx.beginPath(); ctx.arc(c + 3.5, yb - 13.5, 4.3, 0, 7); ctx.fill();
    R(c + 4, yb - 17, 1, 1, '#fff'); R(c + 3, yb - 16, 1, 1, '#fff'); R(c + 2, yb - 15, 1, 1, '#fff'); R(c + 1, yb - 14, 1, 1, '#fff'); R(c + 1, yb - 13, 3, 1, '#fff'); R(c + 1, yb - 15, 1, 2, '#fff');
  }
}
function yieldSign(x, yb) {
  R(x + 2, yb - 8, 1, 8, '#555'); ctx.fillStyle = '#d02020'; ctx.beginPath(); ctx.moveTo(x - 1, yb - 14); ctx.lineTo(x + 6, yb - 14); ctx.lineTo(x + 2.5, yb - 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x + 0.8, yb - 13.3); ctx.lineTo(x + 4.2, yb - 13.3); ctx.lineTo(x + 2.5, yb - 10.3); ctx.fill();
}
function crossVeh(X, c) {
  // osobny pas dla każdego kierunku (ruch prawostronny: w dół lewa kolumna, w górę prawa)
  const h = c.len, fwd = c.dir > 0, x = fwd ? X - 5 : X + 1, y = Math.round(c.y - h / 2);
  R(x, y, 6, h, c.col); R(x - 1, y + 2, 1, 3, '#111'); R(x + 6, y + 2, 1, 3, '#111'); R(x - 1, y + h - 5, 1, 3, '#111'); R(x + 6, y + h - 5, 1, 3, '#111');
  if (c.type === 'truck') { R(x, fwd ? y + h - 6 : y, 6, 6, '#2e86c1'); R(x + 1, fwd ? y + h - 4 : y + 1, 4, 2, '#2b3a4a'); R(x + 1, fwd ? y + 1 : y + 7, 4, h - 9, '#cfcfcf'); }
  else { R(x + 1, fwd ? y + h - 6 : y + 2, 4, 4, '#2b3a4a'); if (c.type === 'van') R(x + 1, fwd ? y + 1 : y + 9, 4, h - 11, 'rgba(0,0,0,0.12)'); }
  const fy = fwd ? y + h : y - 1, ry = fwd ? y - 1 : y + h, bc = c.v < c.sp * 0.6 ? '#ff2020' : '#8a1010';
  E(() => { R(x, fy, 2, 1, '#fff6c8'); R(x + 4, fy, 2, 1, '#fff6c8'); R(x, ry, 2, 1, bc); R(x + 4, ry, 2, 1, bc); });
  if (c.bad && !c.halt && !c.ghost) bubble(x + 3, y - 4, '!', '#c0392b');
  if (c.crash > 0) { R(x - 2, y + h / 2 - 1, 10, 1, '#ffcc00'); }
}
function crossCar(x, y, r) {
  const c = SHIRTS[(r * 12) | 0];
  R(x - 3, y - 7, 9, 14, c); R(x - 2, y - 4, 7, 4, '#2b3a4a'); R(x - 4, y - 6, 1, 3, '#111'); R(x + 6, y - 6, 1, 3, '#111'); R(x - 4, y + 3, 1, 3, '#111'); R(x + 6, y + 3, 1, 3, '#111');
  E(() => { R(x - 2, y + 7, 2, 1, '#fff6c8'); R(x + 3, y + 7, 2, 1, '#fff6c8'); });
}
function dwarf(x, yb, k) {
  const c = ['#c0392b', '#2e86c1', '#27ae60', '#8e44ad'][k];
  R(x, yb - 6, 4, 4, '#7d7d7d'); R(x + 1, yb - 2, 1, 2, '#555'); R(x + 3, yb - 2, 1, 2, '#555');
  R(x + 1, yb - 8, 2, 2, '#e8c9a0'); R(x, yb - 10, 4, 2, c); R(x + 1, yb - 11, 2, 1, c); R(x + 1, yb - 6, 2, 1, '#eee');
}

// ===== pojazdy =====
// lekki rzut 3/4: dach i ściana końcowa przesunięte w głąb (w prawo i w górę)
const VDX = 3, VDY = 7;
function vbox(x0, x1, top, bot, dx, dy, roof, end, o = '#1a1418') {
  x0 = Math.round(x0); x1 = Math.round(x1); top = Math.round(top); bot = Math.round(bot);
  const rs = r => Math.min(dx, Math.round(dx * (r + 0.5) / dy)), cs = c => Math.min(dy, Math.round(dy * (c + 0.5) / dx));
  for (let r = 0; r <= dy; r++) R(x0 + rs(r) - 1, top - r - 1, x1 - x0 + 2, 1, o);
  for (let c = 0; c <= dx; c++) R(x1 + c, top - cs(c) - 1, 1, bot - top + 2, o);
  for (let r = 0; r < dy; r++) R(x0 + rs(r), top - r - 1, x1 - x0, 1, r === dy - 1 ? tint(roof, 0.3) : r === 0 ? shade(roof, 0.08) : roof);
  for (let c = 0; c < dx; c++) R(x1 + c, top - cs(c), 1, bot - top, c === dx - 1 ? shade(end, 0.15) : end);
  return cs;
}
function endFace(x1, top, bot, dx, cs, front, glassH, skirtY, skirtCol) {
  x1 = Math.round(x1);
  for (let c = 0; c < dx; c++) {
    const s = cs(c), x = x1 + c;
    if (skirtY !== undefined) R(x, skirtY - s, 1, bot - skirtY, skirtCol);
    if (front) { R(x, top - s + 1, 1, 2, '#111'); if (c === 1) R(x, top - s + 1, 1, 1, '#ffb000'); R(x, top - s + 3, 1, glassH, c === 1 ? '#3d5670' : '#1b2632'); if (c === 1) R(x, top - s + 4, 1, 2, '#9fc3e0'); }
    else R(x, top - s + 4, 1, Math.max(3, glassH - 5), '#2c3c4d');
  }
  E(() => { for (let c = 0; c < dx; c += Math.max(1, dx - 1)) { const s = cs(c); R(x1 + c, bot - s - 5, 1, 1, front ? '#fffbe0' : '#ff2020'); } });
}
function car(x, yb, col, flip, brake, type) {
  const w = type === 'van' ? 15 : 13;
  if (x < -20 || x > W + 20) return;
  x = Math.round(x); yb = Math.round(yb);
  const d = shade(col, 0.35), l = tint(col, 0.35), o = '#1a1418';
  R(x + 1, yb - 1, w + 3, 2, 'rgba(0,0,0,0.25)');
  R(x - 1, yb - 6, w + 1, 5, o);
  vbox(x, x + w, yb - 6, yb - 2, 2, 3, l, d);
  R(x, yb - 6, w, 4, col); R(x, yb - 6, w, 1, l); R(x, yb - 3, w, 1, d);
  const cx = x + (flip ? 4 : 2) + 1, cw = type === 'van' ? w - 5 : w - 6, cX = flip ? cx - 1 : cx;
  R(cX - 1, yb - 10, 1, 3, o);
  const cs = vbox(cX, cX + cw, yb - 10, yb - 7, 1, 2, tint(col, 0.5), d);
  R(cX, yb - 10, cw, 3, col); R(cX, yb - 10, cw, 1, l);
  R(cX + 1, yb - 9, cw - 2, 2, '#9ec8e4'); R(cX + 2, yb - 9, 1, 1, '#e8f6ff'); R(cX + (cw >> 1), yb - 9, 1, 2, col);
  if (!flip) R(cX + cw, yb - 10 - cs(0) + 1, 1, 2, '#6f9ec0');
  R(x + 1, yb - 2, 4, 2, o); R(x + w - 5, yb - 2, 4, 2, o); const hp = ((camX * PX + x) / 2 | 0) & 1; R(x + 2 + hp, yb - 2, 1, 1, '#c8ccd2'); R(x + w - 4 + hp, yb - 2, 1, 1, '#c8ccd2'); R(x + 3 - hp, yb - 1, 1, 1, '#6a6e74'); R(x + w - 3 - hp, yb - 1, 1, 1, '#6a6e74');
  const rear = flip ? x + w - 1 : x, front = flip ? x : x + w - 1;
  E(() => { R(front, yb - 5, 1, 1, '#fff6c8'); R(rear, yb - 5, 1, 2, brake ? '#ff2020' : '#8a1010'); if (brake) R(rear - (flip ? -1 : 1), yb - 5, 1, 2, 'rgba(255,40,40,0.5)'); });
}
function tramSprite(x0, x1, yb, flip, opts, M) {
  M = M || VEH.tram;
  const len = x1 - x0; if (x1 < -10 || x0 > W + 10) return;
  const top = yb - 26, bot = yb - 2, P = (f, w) => flip ? x1 - f * len - w : x0 + f * len;
  const parts = M.coupled ? [[0, .49], [.51, 1]] : [[0, 1]];
  R(x0 + 1, yb - 1, len + VDX + 1, 3, 'rgba(0,0,0,0.28)');
  const ord = parts.map(([a, b]) => [a, b, flip ? x1 - b * len : x0 + a * len]).sort((p, q) => p[2] - q[2]);
  for (const [a, b, cx] of ord) {
    const cl = (b - a) * len, last = cx + cl >= x1 - 1;
    const cs = vbox(cx, cx + cl, top + 1, bot, VDX, VDY, tint(M.roof, 0.12), shade(M.body, 0.22));
    for (let r = 1; r < VDY - 1; r += 3) R(cx + 4 + Math.round(VDX * r / VDY), top - r, cl - 8, 1, shade(M.roof, 0.1));
    endFace(cx + cl, top + 1, bot, VDX, cs, (!flip || M.bidir) && last, 10, M.coupled ? top + 15 : yb - 10, shade(M.skirt, 0.2));
    R(cx + 1, top, cl - 2, 4, '#1a1418'); R(cx - 1, top + 2, cl + 2, bot - top - 1, '#1a1418');
    R(cx + 2, top + 1, cl - 4, 3, M.roof); R(cx + 2, top + 1, cl - 4, 1, tint(M.roof, 0.4));
    R(cx, top + 3, cl, bot - top - 3, M.body); R(cx, top + 3, cl, 1, tint(M.body, 0.35)); R(cx, bot - 1, cl, 1, shade(M.body, 0.35));
    if (M.coupled) R(cx, top + 15, cl, bot - top - 15, M.skirt); else R(cx, yb - 10, cl, 6, M.skirt);
    R(cx + 2, top + 5, cl - 4, 8, M.band);
    for (let x = cx + 2 + M.pillar; x < cx + cl - 3; x += M.pillar) { R(x, top + 5, 1, 8, M.pcol); R(x - 3, top + 6, 1, 2, 'rgba(255,255,255,0.35)'); R(x - 2, top + 6, 1, 1, 'rgba(255,255,255,0.25)'); }
    if (M.stripe) R(cx, top + 14, cl, 1, M.stripe);
    if (M.coupled) { R(cx, top + 3, 1, bot - top - 3, '#8a8a8a'); R(cx + cl - 1, top + 3, 1, bot - top - 3, '#8a8a8a'); }
  }
  if (M.coupled) R(P(.49, 0) - (flip ? 1 : 0), yb - 7, Math.max(2, len * .02), 2, '#222');
  else for (let i = 1; i < M.sec; i++) { const x = P(i / M.sec, 0) - 1; R(x, top + 3, 2, bot - top - 3, '#3a3a3a'); R(x, top + 2, 2, 1, '#777'); for (let r = 0; r < VDY; r++) R(x + Math.round(VDX * (r + 0.5) / VDY), top - r, 2, 1, r % 2 ? '#3a3a3a' : '#5a5a5a'); }
  if (opts && opts.load) for (let i = 0; i < Math.min(opts.load, 20); i++) { const px = x0 + 5 + (h1(i * 7) * (len - 12)); R(px, top + 9, 2, 2, SKINS[i % 4]); R(px, top + 11, 2, 2, SHIRTS[i % 12]); }
  const dw = Math.max(6, Math.min(10, Math.round(len * (M.coupled ? .075 : .09)))), hf = M.low ? 0 : 2;
  for (const f of M.doors) {
    const dx = P(f, dw), dh = bot - top - 4 - hf;
    R(dx, top + 4, dw, dh, M.coupled ? '#d8cfb6' : '#d9dde2'); R(dx, top + 4, dw, 1, '#999'); R(dx + dw / 2 - 1, top + 4, 2, dh, '#9b9b9b');
    R(dx + 1, top + 6, dw / 2 - 2, 9, '#2c3c4d'); R(dx + dw / 2 + 1, top + 6, dw / 2 - 2, 9, '#2c3c4d');
    if (!M.low) { R(dx, bot - 2, dw, 1, '#555'); R(dx + 1, bot - 1, dw - 2, 1, '#444'); }
    if (opts && opts.doors > 0) { const g = Math.round(opts.doors * dw / 2); R(dx + dw / 2 - g, top + 4, g * 2, dh, '#141414'); }
  }
  for (const f of M.bogies) { const bx = Math.round(P(f, 0) - 6); R(bx, yb - 4, 12, 3, '#222'); R(bx + 1, yb - 4, 10, 1, '#3a3a3a'); R(bx + 1, yb - 2, 4, 3, '#111'); R(bx + 7, yb - 2, 4, 3, '#111');
    for (const wx of [bx + 1, bx + 7]) { const q = (((wph(wx, 2) % 6.283) + 6.283) % 6.283) / 1.571 | 0; const [ox, oy] = [[0, 0], [3, 0], [3, 2], [0, 2]][q]; R(wx + 1, yb - 1, 2, 1, '#55595f'); R(wx + ox, yb - 2 + oy, 1, 1, '#a8acb4'); } }
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
  for (const f of M.panto) { const pg = Math.round(P(f, 0) + VDX / 2), pt = top - (VDY >> 1); R(pg - 4, pt - 1, 9, 2, '#4a4f56'); R(pg - 4, pt - 1, 9, 1, '#7a8088'); ctx.beginPath(); ctx.moveTo(pg, pt); ctx.lineTo(pg + 5, pt - 5); ctx.lineTo(pg, pt - 10); ctx.moveTo(pg - 4, pt - 10); ctx.lineTo(pg + 5, pt - 10); ctx.stroke(); }
  // czoło
  const cab = fl => { const fe = fl ? x0 : x1, FX = (o, w) => fl ? fe + o : fe - o - w;
  if (M.front === 'elektra') {
    R(FX(0, 9), top + 3, 9, 13, '#1b2632'); R(FX(0, 3), top + 2, 3, 15, '#1b2632'); R(FX(3, 1), top + 5, 1, 8, '#4d6a86'); R(FX(5, 1), top + 6, 1, 4, '#3d5670');
    R(FX(0, 9), top + 16, 9, bot - top - 16, M.nose); R(FX(0, 2), top + 16, 2, bot - top - 16, shade(M.nose, 0.25)); R(FX(1, 10), top, 10, 3, '#111'); R(FX(0, 1), top + 1, 1, 1, '#000');
  } else if (M.front === 'box') {
    R(FX(0, 2), top + 3, 2, bot - top - 3, M.nose); R(FX(1, 5), top + 5, 5, 8, '#1b2632'); R(FX(1, 8), top, 8, 3, '#111');
  } else if (M.front === 'slope') {
    R(FX(0, 7), top + 3, 7, 13, '#1b2632'); R(FX(0, 2), top + 2, 2, 14, '#1b2632'); R(FX(0, 7), top + 16, 7, bot - top - 16, M.nose);
    R(FX(0, 1), top + 2, 1, 1, '#000'); R(FX(2, 9), top, 9, 3, '#111');
  } else {
    R(FX(0, 6), top + 4, 6, 11, '#1b2632'); R(FX(0, 2), top + 2, 2, bot - top - 2, M.nose); R(FX(1, 8), top + 1, 8, 3, '#111');
  }
  };
  cab(flip); if (M.bidir) cab(!flip);
  const fe = flip ? x0 : x1, s = flip ? 1 : -1, FX = (o, w) => flip ? fe + o : fe - o - w;
  if (opts && opts.line) ptext(opts.line, FX(1, 0) + s * 4, top - 1, '#ffb000', 5, 'center');
  E(() => { const hx = flip ? x0 : x1 - 2; R(hx, yb - 9, 2, 2, '#fffbe0'); R(flip ? x1 - 2 : x0, yb - 9, 2, 2, '#ff2020');
    if (opts && opts.ind && (G.clock * 3 | 0) % 2) { R(hx, yb - 12, 2, 2, '#ffb000'); R(flip ? x1 - 2 : x0, yb - 12, 2, 2, '#ffb000'); R(x0 + len * 0.3, bot - 1, 3, 1, '#ffb000'); }
    if (NIGHT > 0.2) { ctx.fillStyle = 'rgba(255,240,180,0.15)'; ctx.beginPath(); ctx.moveTo(hx + (flip ? 0 : 2), yb - 9); ctx.lineTo(hx + (flip ? -50 : 52), yb - 2); ctx.lineTo(hx + (flip ? -50 : 52), yb + 4); ctx.fill(); }
    if (opts && opts.load && NIGHT > 0.3) R(x0 + 3, top + 5, len - 6, 8, 'rgba(255,240,200,0.25)'); });
}
function busSprite(x0, x1, yb, flip, opts, M) {
  M = M || VEH.bus;
  const len = x1 - x0; if (x1 < -10 || x0 > W + 10) return;
  const kn = opts ? Math.round(opts.kneel * 2) : 0, top = yb - 25 + kn - (M.tall || 0), bot = yb - 3 + kn;
  const P = (f, w) => flip ? x1 - f * len - w : x0 + f * len;
  R(x0 + 1, yb - 1, len + VDX + 1, 2, 'rgba(0,0,0,0.28)');
  const cs = vbox(x0, x1, top, bot + 2, VDX, VDY, tint(M.roof, 0.12), shade(M.body, 0.22));
  for (let r = 1; r < VDY - 1; r += 3) R(x0 + 4 + Math.round(VDX * r / VDY), top - r - 1, len - 8, 1, shade(M.roof, 0.08));
  endFace(x1, top, bot + 2, VDX, cs, !flip, 11, bot - 8, shade(M.stripe, 0.2));
  R(x0 + 1, top - 1, len - 2, 1, '#1a1418'); R(x0 - 1, top + 1, len + 2, bot - top, '#1a1418');
  R(x0, top + 2, len, bot - top - 2, M.body); R(x0 + 2, top, len - 4, 3, M.roof); R(x0 + 2, top, len - 4, 1, tint(M.roof, 0.4)); R(x0, top + 2, len, 1, tint(M.body, 0.3));
  const pod = (px, pw) => { const bx = Math.round(px + 1), by = top - 4; vbox(bx, bx + pw, by, by + 2, 1, 2, '#eef1f4', '#9ea6ae', '#55606a'); R(bx, by, pw, 2, '#c9ced4'); };
  if (M.pods) for (const [f, w] of M.pods) pod(P(f, len * w), Math.round(len * w));
  else pod(P(.3, 10), 10);
  R(x0, bot - 8, len, 4, M.stripe); R(x0, bot - 2, len, 2, '#333');
  if (M.accent) R(x0, bot - 9, len, 1, M.accent);
  R(x0 + 2, top + 4, len - 4, 9, '#22303d'); for (let x = x0 + 2 + M.pillar; x < x1 - 2; x += M.pillar) { R(x, top + 4, 1, 9, M.body); R(x - 3, top + 5, 1, 2, 'rgba(255,255,255,0.3)'); R(x - 2, top + 5, 1, 1, 'rgba(255,255,255,0.22)'); }
  if (M.joint) { const mx = P(M.joint, 3); R(mx, top + 1, 3, bot - top, '#2a2a2a'); for (let y = top + 2; y < bot; y += 2) R(mx, y, 3, 1, '#444'); for (let r = 0; r < VDY; r++) R(mx + Math.round(VDX * (r + 0.5) / VDY), top - r - 1, 3, 1, r % 2 ? '#2a2a2a' : '#444'); }
  if (opts && opts.load) for (let i = 0; i < Math.min(opts.load, 14); i++) { const px = x0 + 4 + h1(i * 7) * (len - 10); R(px, top + 8, 2, 2, SKINS[i % 4]); R(px, top + 10, 2, 3, SHIRTS[i % 12]); }
  for (const f of M.doors) {
    const dx = P(f, 7), dh = bot - top - 4;
    R(dx, top + 3, 7, dh, '#9aa6b2'); R(dx + 1, top + 4, 2, dh - 2, '#2c3c4d'); R(dx + 4, top + 4, 2, dh - 2, '#2c3c4d'); R(dx + 3, top + 3, 1, dh, '#cfd6dd');
    if (opts && opts.doors > 0) { const g = Math.round(opts.doors * 3.5); R(dx + 3.5 - g, top + 3, g * 2, dh, '#141414'); }
  }
  for (const f of M.wheels) { const wx = Math.round(P(f, 0)); R(wx - 5, yb - 7 + kn, 10, 3, '#141414'); wheel(wx, yb - 2, wph(wx, 3)); R(wx - 4, yb - 7 + kn, 8, 1, shade(M.body, 0.45)); }
  const FX = (o, w) => flip ? x0 + o : x1 - o - w;
  if (M.front === 'solaris') { R(FX(0, 5), top + 2, 5, 15, '#14181d'); R(FX(0, 3), bot - 9, 3, 2, '#111'); }
  else if (M.front === 'citaro') { R(FX(0, 5), top + 3, 5, 13, '#1b2632'); R(FX(0, 1), top + 2, 1, 1, M.roof); R(FX(1, 1), bot - 7, 1, 1, '#e0e0e0'); }
  else { R(FX(0, 5), top + 5, 5, 11, '#1b2632'); R(FX(0, 1), top + 2, 1, bot - top - 4, '#bbb'); }
  R(FX(1, 10), top, 10, 3, '#111');
  if (opts && opts.line) ptext(opts.line, FX(6, 0), top - 2, '#ffb000', 5, 'center');
  if (M.electric) R(P(.6, 4), top + 14, 4, 2, M.accent);
  E(() => {
    const hx = flip ? x0 : x1 - 1; R(hx, bot - 6, 1, 2, '#fffbe0'); R(flip ? x1 - 1 : x0, bot - 6, 1, 3, '#ff2020');
    if (opts && opts.ind && (G.clock * 3 | 0) % 2) { R(flip ? x0 : x1 - 1, bot - 9, 1, 2, '#ffb000'); R(flip ? x1 - 1 : x0, bot - 9, 1, 2, '#ffb000'); R(x0 + len * 0.45, bot - 8, 2, 1, '#ffb000'); }
    if (NIGHT > 0.2) { ctx.fillStyle = 'rgba(255,240,180,0.15)'; ctx.beginPath(); ctx.moveTo(hx, bot - 6); ctx.lineTo(hx + (flip ? -45 : 46), yb); ctx.lineTo(hx + (flip ? -45 : 46), yb + 5); ctx.fill(); }
  });
}
function person(x, yb, p, t) {
  x = Math.round(x); yb = Math.round(yb);
  if (p.kind === 'wheel') {
    R(x - 1, yb - 4, 5, 1, '#333'); ctx.strokeStyle = '#222'; ctx.beginPath(); ctx.arc(x + 1.5, yb - 2, 2.2, 0, 7); ctx.stroke();
    R(x, yb - 8, 3, 4, p.col); R(x + 2, yb - 5, 3, 1, '#2b2b2b'); R(x, yb - 10, 2, 2, p.skin); R(x, yb - 11, 2, 1, p.hair); R(x - 1, yb - 9, 1, 5, '#555');
    return;
  }
  R(x - 1, yb, 5, 1, 'rgba(0,0,0,0.2)');
  const step = t !== undefined ? ((t * 6) | 0) % 2 : 0;
  if (p.st === 'fallen') { R(x - 4, yb - 2, 8, 2, p.col); R(x + 4, yb - 2, 2, 2, p.skin); return; }
  R(x, yb - 3, 1, 3, '#2b2b2b'); R(x + 2, yb - 3 + step, 1, 3 - step, '#2b2b2b');
  R(x, yb - 7, 3, 4, p.col); R(x, yb - 9, 2, 2, p.skin); R(x, yb - 10, 2, 1, p.kind === 'old' ? '#d8d8d8' : p.hair);
  if (p.kind === 'old') R(x + 3, yb - 5, 1, 5, '#6a4a2a');
  if (p.kind === 'ebblo') { R(x + 1, yb - 6, 1, 1, '#f2c318'); }
  if (p.kind === 'ctl') { R(x + 1, yb - 6, 1, 2, '#f2c318'); R(x, yb - 7, 3, 1, '#3a4a6a'); }
  if (p.kind === 'svc') { R(x, yb - 5, 3, 1, p.col === '#c81e1e' ? '#f2c318' : p.col === '#e8e8e8' ? '#2fa84f' : '#f2f2f2'); R(x, yb - 11, 2, 1, p.col === '#1d4f91' ? '#1d4f91' : p.hair); }
}
function bubble(x, y, txt, col) { R(x - 4, y - 8, 9, 8, '#fff'); R(x, y, 1, 2, '#fff'); ptext(txt, x + 0.5, y - 9, col, 7, 'center'); }

function drawFx() {
  for (const p of G.fx || []) {
    const a = p.t / p.T, x = sx(p.x);
    if (p.k === 'smoke') { const s = Math.round(2 + (1 - a) * 5); ctx.fillStyle = `rgba(${NIGHT > 0.5 ? '60,62,70' : '110,112,118'},${0.4 * a})`; ctx.fillRect(x - (s >> 1), Math.round(p.y) - (s >> 1), s, s); ctx.fillRect(x - (s >> 1) + 1, Math.round(p.y) - (s >> 1) - 1, s - 2, s + 2); }
    else if (p.k === 'spark') E(() => { R(x, Math.round(p.y), 1, 1, a > 0.5 ? '#fff6c0' : '#ffb030'); });
    else if (p.k === 'arc') E(() => { ctx.fillStyle = 'rgba(150,200,255,0.35)'; ctx.fillRect(x - 6, 133, 13, 11); R(x - 2, 137, 5, 3, '#e8f4ff'); R(x, 136, 1, 5, '#ffffff'); });
  }
}
// ===== przystanki i peron =====
function drawPlatforms() {
  const w = G.world;
  fillP(PAVE(), 0, 180, W, 17); R(0, 180, W, 1, '#8a8070'); R(0, 181, W, 1, '#efe7d6');
  R(0, 197, W, 1, '#8a7a5a');
  if (!w) return;
  const V = VEH[G.mode];
  for (const s of w.stops) {
    const a = sx(s.x - V.len - 6), b = sx(s.x + 6); if (b < -20 || a > W + 20) continue;
    fillP(PLAT(), a, 180, b - a, 17); R(a, 180, b - a, 1, '#8a8070'); R(a, 181, b - a, 2, '#f2d21a'); for (let x = a; x < b; x += 2) R(x, 182, 1, 1, '#c8a80a'); R(a, 196, b - a, 1, '#b0a48c');
    // wiata
    const wx = sx(s.x - 13);
    R(wx, 170, 1, 16, '#2f4a3a'); R(wx + 26, 170, 1, 16, '#2f4a3a'); R(wx - 2, 167, 31, 3, '#2f4a3a'); R(wx - 2, 167, 31, 1, '#5a8a6e');
    ctx.fillStyle = 'rgba(170,220,245,0.35)'; ctx.fillRect(wx + 1, 170, 25, 13); R(wx + 20, 171, 1, 4, 'rgba(255,255,255,0.6)'); R(wx + 19, 175, 1, 2, 'rgba(255,255,255,0.4)');
    R(wx + 3, 182, 20, 2, '#8a5a32'); R(wx + 3, 182, 20, 1, '#b07a48'); R(wx + 4, 184, 1, 2, '#3a3a3a'); R(wx + 21, 184, 1, 2, '#3a3a3a');
    R(wx + 2, 171, 12, 5, '#1d4f91'); ptext('MPK', wx + 8, 170, '#fff', 5, 'center');
    if (NIGHT > 0.2) E(() => R(wx + 1, 170, 25, 1, '#fff6c8'));
    // znak przystanku
    const px = sx(s.x);
    R(px, 172, 1, 15, '#3a3a3a'); R(px - 4, 163, 9, 10, '#2a2a2a'); R(px - 3, 164, 7, 8, '#f2c318'); R(px - 2, 165, 5, 6, '#1a1a1a'); ptext(G.mode === 'tram' ? 'T' : 'A', px + 0.5, 164, '#f2c318', 6, 'center');
    // nazwa
    const nw = ptext(s.name, -100, -100, '#fff', 7);
    const vx0 = G.veh ? sx(G.veh.x - V.len) : -1e9, vx1 = G.veh ? sx(G.veh.x) : -1e9;
    if (px + nw / 2 > vx0 && px - nw / 2 < vx1) ctx.globalAlpha = 0.45;
    R(px - nw / 2 - 3, 150, nw + 6, 12, '#0f1824'); R(px - nw / 2 - 2, 151, nw + 4, 10, '#1d4f91'); R(px - nw / 2 - 2, 151, nw + 4, 1, '#4a7cc0');
    ptext(s.name, px, 151, '#fff', 7, 'center');
    ctx.globalAlpha = 1;
    if (s.ebblo) { R(px - 10, 145, 20, 6, '#2b2a6b'); ptext('ebblo', px, 144, '#f2c318', 6, 'center'); }
  }
}
function drawPeople(front) {
  const w = G.world; if (!w) return;
  for (const s of w.stops) for (const p of s.people) {
    if (p.st === 'gone') continue; const x = sx(p.x); if (x < -10 || x > W + 10) continue;
    if (p.y < 183 !== !front) continue;
    person(x, p.y, p, p.st === 'board' ? G.clock : undefined);
    if (p.kind === 'wheel' && p.st === 'wait') bubble(x + 1, p.y - 12, '♿', '#1d4f91');
    if (p.kind === 'old' && p.st === 'wait' && G.mode === 'bus') bubble(x + 1, p.y - 11, 'K', '#8a4b2a');
  }
  if (front) for (const p of w.walkers) { const x = sx(p.x); if (x > -10 && x < W + 10) person(x, p.y, p, p.t); }
}
function drawCrossPeds(front) {
  const w = G.world; if (!w) return;
  const yb = G.mode === 'bus' ? LANE_Y[0] - 22 * G.veh.ly : LANE_Y[0];
  for (const c of w.crossings) {
    const p = c.ped; if (!p || p.st === 'gone') continue;
    const inFront = p.y > yb + 1;
    if (inFront !== front) continue;
    const x = sx(p.x); person(x, p.y, p, p.st === 'walk' ? G.clock : undefined);
    if (p.st === 'curb') bubble(x + 1, p.y - 12, c.bell ? '✓' : '!', c.bell ? '#27ae60' : '#c0392b');
  }
}

// ===== pogoda =====
function drawWeather() {
  const k = WX.k, kind = WX.kind, cam = camX * PX;
  if (SEASON === 'winter') { for (let x = -((cam | 0) % 7); x < W; x += 7) { R(x, 113, 5, 1, 'rgba(255,255,255,0.75)'); R(x + 2, 197, 4, 1, 'rgba(255,255,255,0.7)'); } }
  if (k <= 0) return;
  if (kind === 'rain' || kind === 'storm') {
    const n = (kind === 'storm' ? 260 : 160) * k, sp = kind === 'storm' ? 420 : 330;
    for (let i = 0; i < n; i++) { const y = (h1(i * 7) * H + G.clock * sp * (0.8 + h1(i) * 0.4)) % H, x = ((h1(i * 3) * (W + 80) - y * 0.3 - cam * 0.9) % (W + 80) + W + 80) % (W + 80) - 40; R(x, y, 1, kind === 'storm' ? 6 : 4, 'rgba(200,220,245,0.55)'); }
    R(0, 114, W, 66, `rgba(150,170,200,${0.08 * k})`);
    for (let i = 0; i < 30 * k; i++) { const x = ((h1(i * 13) * W - cam) % W + W) % W, y = 116 + h1(i * 5) * 82, f = (G.clock * 3 + h1(i)) % 1; R(x - f * 3, y, 1 + f * 6, 1, `rgba(220,235,255,${0.5 * (1 - f)})`); }
  }
  if (kind === 'snow') {
    for (let i = 0; i < 180 * k; i++) { const y = (h1(i * 7) * H + G.clock * 28 * (0.6 + h1(i) * 0.8)) % H, x = ((h1(i * 3) * W + Math.sin(G.clock * 1.3 + i) * 6 - cam * 0.95) % W + W) % W, s = h1(i * 11) > 0.7 ? 2 : 1; R(x, y, s, s, 'rgba(255,255,255,0.9)'); }
  }
  if (kind === 'fog') {
    const g = ctx.createLinearGradient(0, 0, 0, H); const c = NIGHT > 0.5 ? '70,78,92' : '214,220,226';
    g.addColorStop(0, `rgba(${c},${0.35 * k})`); g.addColorStop(0.45, `rgba(${c},${0.7 * k})`); g.addColorStop(1, `rgba(${c},${0.45 * k})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (WX.flash > 0) { ctx.fillStyle = `rgba(235,240,255,${WX.flash * 0.7})`; ctx.fillRect(0, 0, W, H); if (WX.flash > 0.6) { ctx.strokeStyle = '#fffbe0'; ctx.lineWidth = 2; ctx.beginPath(); let x = W * h1(Math.floor(G.clock)); ctx.moveTo(x, 0); for (let y = 12; y < 95; y += 12) { x += (h1(y + Math.floor(G.clock)) - 0.5) * 24; ctx.lineTo(x, y); } ctx.stroke(); ctx.lineWidth = 1; } }
}

// ===== główny rysunek =====
// ===== Ikony ogłoszeń i rozmów nad kabiną (z MWL_THT, ikony_ogloszen/ikony_render.js) =====
const CALL_GLYPH = {
  phone: ['.##......', '####.....', '###......', '.##......', '..##.....', '...##....', '....##.##', '.....####', '......##.'],
  warn: ['....#....', '...###...', '...#.#...', '..##.##..', '..##.##..', '.#######.', '.###.###.', '#########'],
  out: ['.###', '..##', '.#.#', '#...'],
  in: ['...#', '#.#.', '##..', '###.']
};
function glyphAt(rows, x, y, col) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') R(x + i, y + j, 1, 1, col); }); }
function disc(cx, cy, r, col) { for (let j = -r; j <= r; j++) { const h = Math.round(Math.sqrt(r * r - j * j + r * 0.8)); R(cx - h, cy + j, h * 2 + 1, 1, col); } }
function drawCallIcon(cx, cy, c) {
  const t = performance.now() / 1000, talk = c.phase === 'talk', GREEN = '#0a8a2a', BLUE = '#1f6fd0';
  if (!talk && c.kind !== 'ca') cy += Math.round(Math.sin(t * 4));
  // oczekiwanie: rozchodzące się fale
  if (!talk) for (let k = 0; k < 2; k++) {
    const p = (t * 0.8 + k * 0.5) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - p)})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx + 0.5, cy + 0.5, 9 + p * 7, 0, Math.PI * 2); ctx.stroke();
  }
  // rozmowa: kropki płyną w dół (mówi dyspozytor) albo w górę (mówi kierowca)
  if (talk) for (let k = 0; k < 3; k++) {
    const p = (t * 1.5 + k / 3) % 1, y = c.tx ? cy + 22 - p * 12 : cy + 10 + p * 12;
    R(cx - 1, Math.round(y), 2, 2, c.tx ? '#ffd23a' : '#7fd0ff');
  }
  R(cx - 1, cy + 9, 3, 1, '#1a1418'); R(cx, cy + 10, 1, 1, '#1a1418');
  disc(cx, cy, 9, '#1a1418');
  disc(cx, cy, 8, talk && c.kind !== 'ca' ? BLUE : '#ffffff');
  if (c.kind === 'ca') ptext(String(talk ? (c.tx ? 3 : 4) : c.step), cx + 1, cy - 4, GREEN, 8, 'center');
  else if (talk) { glyphAt(CALL_GLYPH.phone, cx - 4, cy - 4, '#ffffff'); glyphAt(c.tx ? CALL_GLYPH.out : CALL_GLYPH.in, cx + 1, cy - 5, '#ffffff'); }
  else if (c.kind === 'rtt') glyphAt(CALL_GLYPH.phone, cx - 4, cy - 4, GREEN);
  else if (!((t * 2.5 | 0) % 2)) glyphAt(CALL_GLYPH.warn, cx - 4, cy - 4, '#d02a1a');
  ptext(c.kind.toUpperCase() + (talk ? (c.tx ? ' · KIEROWCA' : ' · CC') : ''), cx + 1, cy - 18, talk ? '#7fd0ff' : '#ffffff', 6, 'center');
}

// ===== ikony ogłoszeń (jak na terminalu kierowcy) =====
// int/ext/both – ogłoszenie kierowcy (lub z bazy) na głośniki wewn./zewn./oba; ccDrv – Durchsage z CC do kierowcy
// (słuchawka „LS”), ccPass – Durchsage z CC do pasażerów (megafon „LS”), drv – komunikat tylko na głośnik
// kierowcy (na terminalu niebieski przycisk 🔊), stop – automatyczna zapowiedź przystanku (ta sama ikona głośnika).
const ANN_GLYPH = {
  busFill: ['.#######.', '#########', '#########', '#########', '#########', '#########', '#########', '#########', '.##...##.'],
  waves: ['###..', '...#.', '##..#', '..#.#', '#.#.#'],
  wavesL: ['..###', '.#...', '#..##', '#.#..', '#.#.#'],
  phone: ['##....', '##....', '#.....', '#.....', '##..##', '.#####'],
  mega: ['.....#', '...###', '######', '######', '...###', '.....#'],
  ls: ['#...###', '#...#..', '#...###', '#.....#', '###.###'],
  spk: ['...#', '..##', '####', '####', '####', '..##', '...#'],
  spkW: ['...#..', '#...#.', '.#...#', '.#...#', '.#...#', '#...#.', '...#..']
};
const ANN_LABEL = { int: 'OGŁ. WEWN.', ext: 'OGŁ. ZEWN.', both: 'OGŁ. WEWN.+ZEWN.', ccDrv: 'CC: KIEROWCA', ccPass: 'CC: PASAŻEROWIE', drv: 'GŁOŚNIK KIEROWCY', stop: 'ZAPOWIEDŹ PRZYSTANKU' };
function drawAnnIcon(cx, cy, k, still) {
  const t = performance.now() / 1000, GREEN = '#0a8a2a', on = still || ((t * 3) | 0) % 3 !== 0;
  if (!still) { const p = (t * 0.8) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - p)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx + 0.5, cy + 0.5, 9 + p * 6, 0, Math.PI * 2); ctx.stroke(); }
  R(cx - 1, cy + 9, 3, 1, '#1a1418'); R(cx, cy + 10, 1, 1, '#1a1418');
  disc(cx, cy, 9, '#1a1418');
  const spk = k === 'drv' || k === 'stop';
  disc(cx, cy, 8, spk ? '#1a8fe0' : '#ffffff');
  if (spk) {
    glyphAt(ANN_GLYPH.spk, cx - 5, cy - 3, '#ffffff');
    if (on) glyphAt(ANN_GLYPH.spkW, cx, cy - 3, '#ffffff');
  } else if (k === 'int' || k === 'ext' || k === 'both') {
    const bx = k === 'int' ? cx - 4 : cx - 2, by = k === 'int' ? cy - 4 : cy - 3;
    glyphAt(ANN_GLYPH.busFill, bx, by, GREEN);
    if (k !== 'ext' && on) glyphAt(ANN_GLYPH.waves, bx + 2, by + 2, '#ffffff');
    if (k !== 'int' && on) glyphAt(ANN_GLYPH.wavesL, cx - 7, cy - 7, GREEN);
  } else {
    glyphAt(k === 'ccDrv' ? ANN_GLYPH.phone : ANN_GLYPH.mega, cx - 6, cy - 6, GREEN);
    glyphAt(ANN_GLYPH.ls, cx - 2, cy + 1, GREEN);
  }
}
// ikona głośników jako obrazek (zakładki w menu ogłoszeń)
const ANN_URL = {};
function annIconURL(k) {
  if (ANN_URL[k]) return ANN_URL[k];
  const c = document.createElement('canvas'); c.width = 21; c.height = 21; const main = ctx; ctx = c.getContext('2d');
  try { drawAnnIcon(10, 10, k, true); } finally { ctx = main; }
  return ANN_URL[k] = c.toDataURL();
}
// kasowniki zablokowane na czas kontroli biletów
function drawKasIcon(cx, cy, label) {
  const RED = '#d02a1a';
  R(cx - 1, cy + 9, 3, 1, '#1a1418'); R(cx, cy + 10, 1, 1, '#1a1418');
  disc(cx, cy, 9, '#1a1418'); disc(cx, cy, 8, '#ffffff');
  R(cx - 6, cy - 6, 7, 11, '#f2c318'); R(cx - 5, cy - 5, 5, 3, '#2b2f36'); R(cx - 4, cy - 4, 1, 1, '#ff5040'); R(cx - 5, cy, 5, 1, '#8a6a00'); R(cx - 4, cy + 2, 3, 1, '#8a6a00');
  R(cx + 2, cy - 3, 1, 3, RED); R(cx + 6, cy - 3, 1, 3, RED); R(cx + 2, cy - 4, 5, 1, RED);
  R(cx + 1, cy, 7, 5, RED); R(cx + 4, cy + 1, 1, 2, '#ffffff');
  if (label) ptext('KASOWNIKI ZABLOK.', cx + 1, cy - 18, '#ffb0a0', 6, 'center');
}
function drawAnnGroup(cx, cy, ann, call) {
  const n = ann.length + (call ? 1 : 0); let x = cx - (n - 1) * 10;
  for (const k of ann) { drawAnnIcon(x, cy, k); x += 20; }
  if (call) drawCallIcon(x, cy, call);
  const lab = ann.includes('ccDrv') && ann.includes('ccPass') ? 'CC: KIEROWCA + PASAŻEROWIE' : ann.map(k => ANN_LABEL[k]).join(' · ');
  ptext(lab, cx + 1, cy - (call ? 26 : 18), '#ffe27a', 6, 'center');
}

function draw() {
  EMIT.length = 0;
  const v = G.veh, V = VEH[G.mode];
  SEASON = seasonNow(); OV = WXK[WX.kind].ov * WX.k;
  NIGHT = nightOf(G.simTime);
  if (G.td && G.td.a >= 1) { drawTD(G.td); if (G.paused) { R(0, 0, W, H, 'rgba(0,0,0,0.4)'); ptext('PAUZA', W / 2, H / 2 - 10, '#fff', 16, 'center'); } return; }
  const shake = G.shake > 0 ? (Math.random() - 0.5) * 4 * G.shake : 0;
  camX = (v ? v.x : 0) - Math.min(W * 0.5, Math.max(W * 0.3, V.len * PX + 6)) / PX + shake;
  drawSky();
  drawBuildings();
  drawStreet();
  const w = G.world;
  // auta na naszych pasach / blokady
  if (w) {
    for (const c of w.cars) car(sx(c.x), LANE_Y[0] - 22 * (c.cy !== undefined ? c.cy : c.lane), c.col, false, c.brk > 0 || c.v < 0.5, c.type);
    for (const b of w.blockers) { const yb = 178 - b.off * 1.5; if (b.off < 30) car(sx(b.x - 2.2) + b.off * 2, yb, b.col, false, false); if (!b.gone && b.leave <= 0 && Math.abs(sx(b.x) - W / 2) < W) { const x = sx(b.x); bubble(x, 160, '?', '#c0392b'); } }
  }
  drawCrossPeds(false);
  drawPeople(false);
  drawEvFx(0);
  // nasz pojazd
  const curving = vehCurving();
  G._curveOpts = null; G._lateCurve = null; G._callAt = null;
  if (v) {
    const x1 = sx(v.x), x0 = sx(v.x - V.len), opts = { doors: v.doors, load: G.load, line: G.trip ? G.trip.line : '', kneel: v.kneel, ind: v.ind };
    const yb = G.mode === 'tram' ? 178 : Math.round(LANE_Y[0] - 22 * v.ly);
    if (G.call || G.ann || ctrlLocked()) G._callAt = [x1 - 7, yb - (G.mode === 'tram' ? 50 : 46 + (V.tall || 0))];
    if (curving === 2) G._lateCurve = [x0, x1, yb, opts];
    else if (G.mode === 'tram') { if (curving) G._curveOpts = [x0, x1, opts]; else tramSprite(x0, x1, 178, false, opts); }
    else busSprite(x0, x1, yb, false, opts);
    if (G.mode === 'bus' && (WX.kind === 'rain' || WX.kind === 'storm') && v.v > 4) for (const f of V.wheels) for (let i = 0; i < 3; i++) R(x0 + f * (x1 - x0) - 4 - Math.random() * 10 * v.v / 10, yb - 1 - Math.random() * 5, 1, 1, 'rgba(225,238,255,0.7)');
    if (v.ramp > 0) { const dx = x0 + V.doors[RAMP_DOOR] * (x1 - x0); ctx.fillStyle = '#8f8f8f'; ctx.beginPath(); ctx.moveTo(dx, 176); ctx.lineTo(dx + 10, 176); ctx.lineTo(dx + 11, 176 + 7 * v.ramp); ctx.lineTo(dx - 1, 176 + 7 * v.ramp); ctx.fill(); R(dx - 1, 176 + 7 * v.ramp - 1, 12, 1, '#f2c318'); }
    if (v.sand > 0 && v.v > 0.2) for (let i = 0; i < 6; i++) R(x1 - 12 - Math.random() * 6, 175 + Math.random() * 4, 1, 1, '#d8c690');
    if (G.driverOut) { const o = G.driverOut, half = o.d / 4; const dd = o.t < half ? o.t * 4 : o.t < half + 1.8 ? o.d : Math.max(0, o.d - (o.t - half - 1.8) * 4); const px = sx(v.x + dd); person(px, 186, { col: '#1d4f91', skin: SKINS[0], hair: HAIRS[0], kind: 'n' }, G.clock); if (o.t > half && o.t < half + 1.8) R(px + 3, 178 + ((G.clock * 8 | 0) % 2), 1, 7, '#666'); }
  }
  drawPlatforms();
  if (w && G.mode === 'tram') for (const s of w.switches) drawBranch(s);
  if (G._curveOpts) tramCurved(...G._curveOpts);
  drawFx();
  drawEvFx(1);
  drawPeople(true);
  drawCrossPeds(true);
  // pas zieleni z drzewami
  fillP(GRASS(), 0, 198, W, 27); R(0, 198, W, 1, '#5a7a30'); R(0, 199, W, 1, 'rgba(0,0,0,0.12)');
  fillP(PAVE(), 0, 208, W, 4, sx(0) * 1); R(0, 208, W, 1, '#b5a88f'); R(0, 211, W, 1, '#b5a88f');
  for (let k = Math.floor(camX / 12) - 1; k < (camX + W / PX) / 12 + 1; k++) {
    const r = h1(k * 5 + 1), x = sx(k * 12);
    if (r < 0.35) { const tx = sx(k * 12 + r * 8); if (!w || !(w.junctions.some(j => Math.abs(sx(j.x) - tx) < 14) || w.turns.some(t => tx > sx(t.x + 3) - 10 && tx < sx(t.x + 23) + 10) || w.signals.some(sg => plainSig(sg) && Math.abs(sx(sg.x) + 11 - tx) < 16) || w.rounds.some(r => Math.abs(sx(r.x) - tx) < RB[G.mode].orx * PX + 10))) tree(tx, 222, k); }
    else if (r < 0.5) { R(x, 214, 2, 1, '#e0602a'); R(x + 5, 218, 2, 1, '#f0b83a'); R(x + 9, 202, 1, 1, '#e8902a'); R(x + 3, 223, 2, 1, '#d0502a'); }
    else if (r < 0.62) { R(x - 1, 214, 14, 6, '#3e6a26'); R(x, 213, 12, 6, '#5a8a32'); R(x + 1, 213, 6, 2, '#78aa48'); R(x + 3, 215, 1, 1, '#e04a4a'); R(x + 8, 216, 1, 1, '#f0d040'); R(x - 1, 219, 14, 1, 'rgba(0,0,0,0.2)'); }
    else if (r < 0.66) { R(x, 202, 8, 2, '#8a5a32'); R(x, 202, 8, 1, '#b07a48'); R(x + 1, 204, 1, 2, '#3a3a3a'); R(x + 6, 204, 1, 2, '#3a3a3a'); }
  }
  if (w) for (const j of w.junctions) drawJunction(j, true);
  if (w) for (const sg of w.signals) if (plainSig(sg)) drawCrossSt(sg, true);
  if (w) for (const k of w.works) worksSigns(k);
  if (w) { for (const t of w.turns) drawTurnX(t, 'low'); for (const r of w.rounds) drawRound(r, 'low'); }
  if (G._lateCurve) vehCurved(...G._lateCurve);
  drawDepotFront();
  // noc
  if (OV > 0) { ctx.fillStyle = `rgba(40,50,64,${0.22 * OV * (1 - NIGHT * 0.5)})`; ctx.fillRect(0, 0, W, H); }
  if (NIGHT > 0) { ctx.fillStyle = `rgba(8,14,40,${0.55 * NIGHT})`; ctx.fillRect(0, 0, W, H); }
  for (const f of EMIT) f();
  if (G._callAt && G.ann) drawAnnGroup(G._callAt[0], G._callAt[1], G.ann, G.call);
  else if (G._callAt && G.call) drawCallIcon(G._callAt[0], G._callAt[1], G.call);
  if (G._callAt && ctrlLocked()) { const n = (G.ann ? G.ann.length : 0) + (G.call ? 1 : 0); drawKasIcon(n ? G._callAt[0] - n * 10 - 14 : G._callAt[0], G._callAt[1], !n); }
  drawWeather();
  // pływające napisy
  for (const f of G.floats) ptext(f.txt, sx(f.x), f.y - (2.6 - f.t) * 10, f.col, 7, 'center');
  if (G.td && G.td.a > 0) { const main = ctx, c = tdCanvas(); ctx = c.getContext('2d'); try { drawTD(G.td); } finally { ctx = main; } ctx.globalAlpha = G.td.a; ctx.drawImage(c, 0, 0); ctx.globalAlpha = 1; }
  if (G.paused) { R(0, 0, W, H, 'rgba(0,0,0,0.4)'); ptext('PAUZA', W / 2, H / 2 - 10, '#fff', 16, 'center'); }
}
