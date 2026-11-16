'use strict';
// ===== Widok z góry: skręt na dużym skrzyżowaniu, start z pętli, wjazd do zajezdni =====
// Jednostki: metry, TS px/m, oś y w dół. Kurs h: kierunek (cos h, sin h); lewa strona = (sin h, -cos h).
// Pozycja na ścieżce s = v.x - x0 (przód pojazdu) – cała logika gry dalej liczy się w v.x.
const TS = 3, TD_FADE = 0.35;

// ----- ścieżki: odcinki proste L i łuki A (d = +1 w lewo, -1 w prawo) -----
function mkPath(x, y, h, segs) {
  const P = { segs: [], len: 0 };
  let cx = x, cy = y, ch = h, s = 0;
  for (const g of segs) {
    const sg = Object.assign({ s0: s, x: cx, y: cy, h: ch }, g);
    if (g.t === 'L') { sg.L = g.L; cx += Math.cos(ch) * g.L; cy += Math.sin(ch) * g.L; }
    else {
      sg.L = g.R * g.ang; sg.cx = cx + g.d * Math.sin(ch) * g.R; sg.cy = cy - g.d * Math.cos(ch) * g.R;
      const h2 = ch - g.d * g.ang; cx = sg.cx - g.d * g.R * Math.sin(h2); cy = sg.cy + g.d * g.R * Math.cos(h2); ch = h2;
    }
    s += sg.L; P.segs.push(sg);
  }
  P.len = s; P.end = { x: cx, y: cy, h: ch };
  return P;
}
function pathAt(P, s) {
  if (s <= 0) { const g = P.segs[0]; return { x: g.x + Math.cos(g.h) * s, y: g.y + Math.sin(g.h) * s, h: g.h }; }
  if (s >= P.len) { const e = P.end, d = s - P.len; return { x: e.x + Math.cos(e.h) * d, y: e.y + Math.sin(e.h) * d, h: e.h }; }
  for (const g of P.segs) if (s < g.s0 + g.L) {
    const u = s - g.s0;
    if (g.t === 'L') return { x: g.x + Math.cos(g.h) * u, y: g.y + Math.sin(g.h) * u, h: g.h };
    const hu = g.h - g.d * u / g.R; return { x: g.cx - g.d * g.R * Math.sin(hu), y: g.cy + g.d * g.R * Math.cos(hu), h: hu };
  }
  return P.end;
}
const angD = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
// punkty przesunięte w bok od ścieżki (o > 0 = w prawo)
function pathOff(P, s0, s1, o, step = 1) { const pts = []; for (let s = s0; s <= s1 + 1e-6; s += step) { const p = pathAt(P, s); pts.push([p.x - Math.sin(p.h) * o, p.y + Math.cos(p.h) * o]); } return pts; }

// ----- mapa sceny: statyczne tło malowane raz na osobnym płótnie -----
const TDP = {
  asph: f => { f(0, 0, 16, 12, '#575a66'); for (let i = 0; i < 22; i++) f((h1(i * 3 + 1) * 16) | 0, (h1(i * 5 + 2) * 12) | 0, 1, 1, i % 2 ? '#626573' : '#4d505b'); },
  pave: f => { f(0, 0, 8, 8, '#d3c9b4'); f(0, 7, 8, 1, '#b5a88f'); f(7, 0, 1, 8, '#b5a88f'); f(0, 0, 7, 1, '#e3dac6'); f(3, 3, 1, 1, '#c6bba4'); },
  sett: f => { f(0, 0, 6, 6, '#6b6559'); f(0, 0, 5, 2, '#8f8676'); f(3, 3, 5, 2, '#857c6c'); f(0, 3, 2, 2, '#857c6c'); f(0, 0, 4, 1, '#a39a88'); f(3, 3, 3, 1, '#9a917f'); },
  conc: f => { f(0, 0, 24, 24, '#a7a8ad'); f(0, 23, 24, 1, '#8e8f95'); f(23, 0, 1, 24, '#8e8f95'); for (let i = 0; i < 14; i++) f((h1(i * 7 + 2) * 23) | 0, (h1(i * 9 + 4) * 23) | 0, 1, 1, i % 2 ? '#b3b4b9' : '#9c9da2'); },
  floor: f => { f(0, 0, 18, 18, '#6f7176'); f(0, 17, 18, 1, '#5f6166'); f(17, 0, 1, 18, '#5f6166'); f(4, 6, 1, 1, '#7a7c81'); f(12, 11, 1, 1, '#64666b'); },
  plat: f => { f(0, 0, 6, 6, '#e3dac6'); f(0, 5, 6, 1, '#c4b89f'); f(5, 0, 1, 5, '#c4b89f'); f(0, 0, 5, 1, '#f0e9da'); },
  grass: f => { const w = SEASON === 'winter'; f(0, 0, 16, 12, w ? '#e8eef4' : '#86ad48'); for (let i = 0; i < 30; i++) f((h1(i * 7 + 3) * 16) | 0, (h1(i * 11 + 5) * 12) | 0, 1, 1, w ? (i % 3 ? '#d2dce8' : '#fff') : i % 3 === 0 ? '#9cc45a' : i % 3 === 1 ? '#749a3c' : '#b2d06a'); }
};
const TDPS = { asph: [16, 12], pave: [8, 8], sett: [6, 6], conc: [24, 24], floor: [18, 18], plat: [6, 6], grass: [16, 12] };
function tdMap(x0, y0, x1, y1, paint) {
  const c = document.createElement('canvas'); c.width = Math.ceil((x1 - x0) * TS); c.height = Math.ceil((y1 - y0) * TS);
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const pats = {};
  const X = x => Math.round((x - x0) * TS), Y = y => Math.round((y - y0) * TS);
  const M = {
    c, g, x0, y0, x1, y1,
    style(col) { if (TDP[col]) { if (!pats[col]) pats[col] = g.createPattern(mkCanvas(...TDPS[col], TDP[col]), 'repeat'); return pats[col]; } return col; },
    rect(x, y, w, h, col) { g.fillStyle = M.style(col); const a = X(x), b = Y(y); g.fillRect(a, b, Math.max(1, X(x + w) - a), Math.max(1, Y(y + h) - b)); },
    line(pts, wd, col, cap) { g.strokeStyle = M.style(col); g.lineWidth = wd * TS; g.lineCap = cap || 'butt'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo : g.moveTo).call(g, (p[0] - x0) * TS, (p[1] - y0) * TS)); g.stroke(); },
    circ(x, y, r, col) { g.fillStyle = M.style(col); g.beginPath(); g.arc((x - x0) * TS, (y - y0) * TS, r * TS, 0, 7); g.fill(); },
    tree(x, y, r, k) {
      const cols = SEASON === 'winter' ? ['#7a8a7a', '#9aaa9a', '#dfe8ee'] : SEASON === 'autumn' ? ['#a8642a', '#d08a32', '#e8b048'] : ['#3e6a26', '#5a8a32', '#78aa48'];
      M.circ(x + 0.8, y + 1, r, 'rgba(0,0,0,0.25)'); M.circ(x, y, r, cols[0]); M.circ(x - r * 0.2, y - r * 0.2, r * 0.75, cols[1]); M.circ(x - r * 0.4, y - r * 0.4, r * 0.35, cols[2]);
      if (SEASON === 'spring' && h1(k) < 0.5) for (let i = 0; i < 5; i++) M.rect(x + (h1(k + i) - 0.5) * r * 1.4, y + (h1(k * 3 + i) - 0.5) * r * 1.4, 0.4, 0.4, '#f4b6c8');
    },
    house(x, y, w, h, k) {
      const r = h1(k), flat = r < 0.35;
      const col = flat ? ['#7d8188', '#8f949b', '#6c7077'][k % 3] : ['#a8503a', '#b8644a', '#8e4030', '#9a5a3c', '#7a6a5a'][k % 5];
      M.rect(x + 0.6, y + 0.8, w, h, 'rgba(0,0,0,0.28)');
      M.rect(x, y, w, h, shade(col, 0.25)); M.rect(x + 0.4, y + 0.4, w - 0.8, h - 0.8, col);
      if (flat) { M.rect(x + w * 0.2, y + h * 0.3, 2.4, 1.8, '#c8ccd2'); M.rect(x + w * 0.62, y + h * 0.55, 1.6, 1.6, '#b0b4ba'); M.rect(x + 0.4, y + 0.4, w - 0.8, 0.5, tint(col, 0.2)); }
      else if (w > h) { M.rect(x + 0.4, y + 0.4, w - 0.8, h / 2 - 0.4, tint(col, 0.12)); M.rect(x + 0.4, y + h / 2 - 0.15, w - 0.8, 0.3, shade(col, 0.35)); M.rect(x + w * (0.2 + r * 0.5), y + h * 0.25, 1, 1, '#5a3a2a'); }
      else { M.rect(x + 0.4, y + 0.4, w / 2 - 0.4, h - 0.8, tint(col, 0.12)); M.rect(x + w / 2 - 0.15, y + 0.4, 0.3, h - 0.8, shade(col, 0.35)); M.rect(x + w * 0.25, y + h * (0.2 + r * 0.5), 1, 1, '#5a3a2a'); }
    },
    zebra(x, y, w, h, along) { // pasy zebry; along = 'x' -> paski wydłużone w osi x
      if (along === 'x') for (let yy = y + 0.3; yy < y + h - 0.3; yy += 1.2) M.rect(x, yy, w, 0.6, '#f4f0e4');
      else for (let xx = x + 0.3; xx < x + w - 0.3; xx += 1.2) M.rect(xx, y, 0.6, h, '#f4f0e4');
    },
    dash(x, y, w, h, along, on = 3, off = 3) {
      if (along === 'x') for (let xx = x; xx < x + w; xx += on + off) M.rect(xx, y, Math.min(on, x + w - xx), h, '#f2eee2');
      else for (let yy = y; yy < y + h; yy += on + off) M.rect(x, yy, w, Math.min(on, y + h - yy), '#f2eee2');
    },
    rails(P, s0, s1, o) { for (const d of [-0.72, 0.72]) { M.line(pathOff(P, s0, s1, o + d), 0.32, '#4a4640'); M.line(pathOff(P, s0, s1, o + d), 0.16, '#c9cbcf'); } },
    blocks(xa, xb, ya, yb, k) { // kwartał zabudowy w prostokącie
      let i = 0;
      for (let x = xa; x < xb - 6; ) { const bw = Math.min(16 + h1(k + i * 7) * 16, xb - x); let j = 0;
        for (let y = ya; y < yb - 6; ) { const bh = Math.min(14 + h1(k + i * 13 + j * 5) * 12, yb - y);
          if (h1(k + i * 3 + j * 11) < 0.12) { M.rect(x, y, bw - 1.2, bh - 1.2, 'grass'); M.tree(x + bw / 2, y + bh / 2, 2.6, k + i + j); }
          else M.house(x, y, bw - 1.2, bh - 1.2, (k + i * 5 + j * 3) | 0);
          y += bh; j++; }
        x += bw; i++; }
    }
  };
  paint(M);
  return M;
}

// ----- sprite'y z góry (rysowane w metrach na bieżącym ctx) -----
function tdBox(x, y, h, L, wd, fn) { ctx.save(); ctx.translate(x, y); ctx.rotate(h); fn(L, wd); ctx.restore(); }
function fr(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function tdVeh(P, s, M, o = {}) {
  const tram = M.mode === 'tram', len = M.len, wd = tram ? 3.3 : 3.2;
  const cuts = tram ? (M.coupled ? [0, 0.5, 1] : [...Array(M.sec + 1).keys()].map(i => i / M.sec)) : M.joint ? [0, M.joint, 1] : [0, 1];
  const n = cuts.length - 1, gap = M.coupled ? 0.45 : 0.15, blink = (G.clock * 2.6 | 0) % 2 === 0;
  const secs = [];
  for (let i = 0; i < n; i++) {
    const a = pathAt(P, s - (1 - cuts[i]) * len + (i ? gap : 0)), b = pathAt(P, s - (1 - cuts[i + 1]) * len - (i < n - 1 ? gap : 0));
    secs.push({ a, b, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, h: Math.atan2(b.y - a.y, b.x - a.x), L: Math.hypot(b.x - a.x, b.y - a.y) + (n > 1 && !M.coupled ? 0.3 : 0), i });
  }
  for (const q of secs) tdBox(q.x + 0.5, q.y + 0.7, q.h, q.L, wd, (L, w) => fr(-L / 2, -w / 2, L, w, 'rgba(0,0,0,0.3)'));
  // przeguby / sprzęg
  for (let i = 1; i < n; i++) { const p = pathAt(P, s - (1 - cuts[i]) * len); tdBox(p.x, p.y, p.h, 0, wd, (L, w) => M.coupled ? fr(-0.6, -0.15, 1.2, 0.3, '#222') : fr(-0.45, -w / 2 + 0.25, 0.9, w - 0.5, '#2a2a2e')); }
  for (const q of secs) tdBox(q.x, q.y, q.h, q.L, wd, (L, w) => {
    const front = q.i === n - 1 || (M.coupled && q.i === 0 && false), rear = q.i === 0;
    fr(-L / 2, -w / 2, L, w, '#26262c');
    fr(-L / 2 + 0.12, -w / 2 + 0.12, L - 0.24, w - 0.24, M.body || '#f2f2f2');
    fr(-L / 2 + 0.2, -w / 2 + 0.2, L - 0.4, 0.28, '#2e4a6b'); fr(-L / 2 + 0.2, w / 2 - 0.48, L - 0.4, 0.28, '#2e4a6b');
    fr(-L / 2 + 0.5, -w / 2 + 0.6, L - 1, w - 1.2, M.roof || '#d0d0d0');
    fr(-L / 2 + 0.5, -w / 2 + 0.5, L - 1, 0.1, M.stripe || M.skirt || '#1d4f91'); fr(-L / 2 + 0.5, w / 2 - 0.6, L - 1, 0.1, M.stripe || M.skirt || '#1d4f91');
    // klimatyzacja / wyposażenie dachu
    fr(-1.3, -0.8, 2.6, 1.6, '#e4e6ea'); fr(-1.3, -0.8, 2.6, 0.2, '#ffffff'); for (let k = -1; k <= 1; k += 0.5) fr(k - 0.05, -0.55, 0.1, 1.1, '#a8acb4');
    if (M.electric || M.pods) fr(-L / 2 + 1, -0.9, Math.min(4, L / 3), 1.8, '#5d6670');
    if (front) {
      fr(L / 2 - 1.05, -w / 2 + 0.3, 0.8, w - 0.6, '#16222e'); fr(L / 2 - 0.95, -w / 2 + 0.45, 0.25, w / 2 - 0.6, '#3e5a7a');
      fr(L / 2 - 0.25, -w / 2 + 0.2, 0.25, w - 0.4, M.nose || '#2a2e34');
      fr(L / 2 - 0.12, -w / 2 + 0.25, 0.12, 0.45, '#fff6c8'); fr(L / 2 - 0.12, w / 2 - 0.7, 0.12, 0.45, '#fff6c8');
      if (o.ind && blink) fr(L / 2 - 0.55, o.ind > 0 ? -w / 2 - 0.12 : w / 2 - 0.38, 0.5, 0.5, '#ffae1a');
    }
    if (rear) {
      fr(-L / 2, -w / 2 + 0.2, 0.18, 0.5, o.brake ? '#ff2a2a' : '#8a1414'); fr(-L / 2, w / 2 - 0.7, 0.18, 0.5, o.brake ? '#ff2a2a' : '#8a1414');
      if (o.ind && blink) fr(-L / 2 + 0.05, o.ind > 0 ? -w / 2 - 0.12 : w / 2 - 0.38, 0.5, 0.5, '#ffae1a');
      if (tram && M.bidir) fr(-L / 2 + 0.25, -w / 2 + 0.3, 0.8, w - 0.6, '#16222e');
    }
    if (o.line && front) fr(L / 2 - 2.2, -0.5, 0.9, 1, '#f2a516');
  });
  if (tram) for (const f of M.panto || []) { const p = pathAt(P, s - (1 - f) * len); tdBox(p.x, p.y, p.h, 0, wd, () => { ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = 0.18; ctx.beginPath(); ctx.moveTo(-1.1, 0); ctx.lineTo(0, -1.2); ctx.lineTo(1.1, 0); ctx.lineTo(0, 1.2); ctx.closePath(); ctx.stroke(); fr(-0.15, -1.6, 0.3, 3.2, '#3a3a42'); }); }
  return secs;
}
function tdCar(x, y, h, c) {
  tdBox(x + 0.4, y + 0.5, h, 0, 0, () => fr(-2.2, -1, 4.4, 2, 'rgba(0,0,0,0.3)'));
  tdBox(x, y, h, 0, 0, () => {
    const L = c.type === 'van' ? 5.2 : 4.4;
    fr(-L / 2, -1, L, 2, shade(c.col, 0.3)); fr(-L / 2 + 0.1, -0.9, L - 0.2, 1.8, c.col);
    fr(-L / 2 + 1.1, -0.75, L - 2.3, 1.5, tint(c.col, 0.18));
    fr(L / 2 - 1.35, -0.75, 0.45, 1.5, '#1c2834'); fr(-L / 2 + 0.55, -0.7, 0.35, 1.4, '#2b3a4a');
    fr(L / 2 - 0.1, -0.85, 0.1, 0.4, '#fff6c8'); fr(L / 2 - 0.1, 0.45, 0.1, 0.4, '#fff6c8');
    fr(-L / 2, -0.85, 0.12, 0.4, c.v < 0.5 ? '#ff2a2a' : '#8a1414'); fr(-L / 2, 0.45, 0.12, 0.4, c.v < 0.5 ? '#ff2a2a' : '#8a1414');
  });
}
function tdPed(x, y, h, p) {
  const ph = Math.sin(G.clock * 9 + (p.wob || 0)) * (p.st === 'walk' ? 0.35 : 0);
  if (p.st === 'fallen') { tdBox(x, y, h, 0, 0, () => { fr(-0.9, -0.3, 1.8, 0.6, p.col); ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(1.1, 0, 0.32, 0, 7); ctx.fill(); }); return; }
  tdBox(x, y, h, 0, 0, () => {
    fr(-0.2 + ph, -0.35, 0.4, 0.22, '#2a2a3a'); fr(-0.2 - ph, 0.13, 0.4, 0.22, '#2a2a3a');
    ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, 0.32, 0.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = p.hair; ctx.beginPath(); ctx.arc(0, 0, 0.24, 0, 7); ctx.fill();
  });
}
function tdSignal(x, y, st, tram, turn) {
  fr(x - 0.15, y - 0.15, 1.3, 2.9, '#111');
  if (tram) { const c = '#e8f6ff'; if (st === 'G') fr(x + 0.4, y + 0.25, 0.3, 1.2, c); else fr(x + 0.15, y + 0.7, 0.8, 0.3, c); fr(x + 0.35, y + 1.9, 0.4, 0.4, st === 'Y' ? '#ffb000' : '#333'); return; }
  const L = [['R', '#ff3030', '#4a1010'], ['Y', '#ffb000', '#4a3a10'], ['G', '#30ff60', '#103a18']];
  L.forEach((l, i) => { ctx.fillStyle = st === l[0] ? l[1] : l[2]; ctx.beginPath(); ctx.arc(x + 0.5, y + 0.4 + i * 0.9, 0.32, 0, 7); ctx.fill(); });
  if (turn) { fr(x + 1.1, y + 1.5, 0.9, 0.9, '#111'); fr(x + 1.25, y + 1.9, 0.6, 0.12, st === 'G' ? '#30ff60' : '#1c4a26'); }
}

// ----- sceny -----
function tdSampleBody(T, step = 1.5) { const V = VEH[G.mode], pts = []; for (let k = 0; k <= V.len; k += step) pts.push(pathAt(T.P, T.s - k)); return pts; }
// auta jadące po prostych pasach sceny: ustępują naszemu pojazdowi, stają na liniach zatrzymania i za poprzednikiem
function tdCars(T, dt) {
  const body = tdSampleBody(T);
  for (const L of T.lanes) {
    L.t -= dt;
    if (L.t <= 0) { L.t = 2.5 + Math.random() * 4; if (!T.cars.some(c => c.L === L && c.q < 12) && T.cars.length < 12) T.cars.push({ L, q: 0, v: L.vt, vt: L.vt * (0.85 + Math.random() * 0.3), col: SHIRTS[Math.random() * 12 | 0], type: Math.random() < 0.15 ? 'van' : 'car' }); }
  }
  for (const c of T.cars) {
    const L = c.L, dx = Math.cos(L.h), dy = Math.sin(L.h);
    let d = 1e9;
    if (L.stop && L.stop() && c.q < L.stopQ + 0.3) d = L.stopQ - c.q;
    for (const o of T.cars) if (o !== c && o.L === L && o.q > c.q) d = Math.min(d, o.q - 4.8 - c.q - 1.5);
    for (const p of body) { const rx = p.x - L.x, ry = p.y - L.y, al = rx * dx + ry * dy, la = -rx * dy + ry * dx; if (Math.abs(la) < 2.8 && al > c.q - 1) d = Math.min(d, al - c.q - 2.5); }
    const tv = d < 0.3 ? 0 : Math.min(c.vt, Math.sqrt(2 * 4 * d));
    c.v += clamp(tv - c.v, -8 * dt, 2.5 * dt); c.v = Math.max(0, c.v); c.q += c.v * dt;
    c.x = L.x + dx * (c.q - 2.2); c.y = L.y + dy * (c.q - 2.2);
  }
  T.cars = T.cars.filter(c => c.q < c.L.len);
}
function tdPre(T, n) { for (let k = 0; k < n; k++) tdCars(T, 0.25); }

function tdTurn(t) {
  const v = G.veh, V = VEH[G.mode], tram = G.mode === 'tram', len = V.len;
  const hw = tram ? 12.5 : 10, xs = -hw - 5, dir = t.dir;
  // pojazd skręca sam po torze/pasie; decyzja zapada na linii zatrzymania (s = 40):
  // autobus na złym pasie lub tramwaj ze źle ustawioną zwrotnicą jedzie prosto (objazd)
  const endX = tram ? 2.6 * dir : dir > 0 ? 2.5 : -7.5, Rr = endX - xs, zc = hw + 9;
  const geo = st => {
    const y0 = tram ? 2.6 : 7.5 - 5 * v.ly, arc = st ? 2 * hw + 5 : Rr * Math.PI / 2;
    const P = st ? mkPath(xs - 40, y0, 0, [{ t: 'L', L: 40 + arc + len + 90 }])
      : mkPath(xs - 40, y0, 0, [{ t: 'L', L: 40 }, { t: 'A', R: Rr, ang: Math.PI / 2, d: dir }, { t: 'L', L: len + 90 }]);
    const yE = pathAt(P, 40 + arc).y;
    return { P, arc, sZ: 40 + arc + Math.max(2, zc - Math.abs(yE)), sEnd: 40 + arc + len + 25 };
  };
  let { P, arc, sZ, sEnd } = geo(false);
  const sg = G.world.signals.find(q => q.turn && Math.abs(q.x - t.x) < 1);
  const xa = xs - 40 - len - 70, xb = 150, ya = -210, yb = 210, R0 = mulberry((t.x * 7) | 0);
  const map = tdMap(xa, ya, xb, yb, M => {
    M.rect(xa, ya, xb - xa, yb - ya, 'pave');
    const bo = hw + 6;
    M.blocks(bo, xb, bo, yb, 11); M.blocks(bo, xb, ya, -bo, 23); M.blocks(xa, -bo, bo, yb, 37); M.blocks(xa, -bo, ya, -bo, 51);
    M.rect(xa, -hw, xb - xa, 2 * hw, 'asph'); M.rect(-hw, ya, 2 * hw, yb - ya, 'asph');
    for (const sY of [-1, 1]) { M.rect(xa, sY > 0 ? hw : -hw - 0.35, -hw - xa, 0.35, '#d8d4c8'); M.rect(hw, sY > 0 ? hw : -hw - 0.35, xb - hw, 0.35, '#d8d4c8'); M.rect(sY > 0 ? hw : -hw - 0.35, ya, 0.35, -hw - ya, '#d8d4c8'); M.rect(sY > 0 ? hw : -hw - 0.35, hw, 0.35, yb - hw, '#d8d4c8'); }
    for (let x = xa + 4; x < xb; x += 13) if (Math.abs(x) > hw + 7) for (const sY of [-1, 1]) M.tree(x + h1(x | 0) * 3, sY * (hw + 3), 2.2, x | 0);
    for (let y = ya + 4; y < yb; y += 13) if (Math.abs(y) > zc + 6) for (const sX of [-1, 1]) M.tree(sX * (hw + 3), y + h1(y | 0) * 3, 2.2, (y * 3) | 0);
    if (tram) {
      M.rect(xa, -5.2, xb - xa, 10.4, 'sett'); M.rect(-5.2, ya, 10.4, yb - ya, 'sett');
      M.dash(xa, -5.4, -hw - xa, 0.2, 'x', 2, 2); M.dash(xa, 5.2, -hw - xa, 0.2, 'x', 2, 2); M.dash(hw, -5.4, xb - hw, 0.2, 'x', 2, 2); M.dash(hw, 5.2, xb - hw, 0.2, 'x', 2, 2);
      M.dash(-5.4, ya, 0.2, -zc - 3 - ya, 'y', 2, 2); M.dash(5.2, ya, 0.2, -zc - 3 - ya, 'y', 2, 2); M.dash(-5.4, zc + 3, 0.2, yb - zc - 3, 'y', 2, 2); M.dash(5.2, zc + 3, 0.2, yb - zc - 3, 'y', 2, 2);
      for (const o of [-2.6, 2.6]) for (const d of [-0.72, 0.72]) { M.rect(xa, o + d - 0.16, xb - xa, 0.32, '#4a4640'); M.rect(xa, o + d - 0.08, xb - xa, 0.16, '#c9cbcf'); M.rect(o + d - 0.16, ya, 0.32, yb - ya, '#4a4640'); M.rect(o + d - 0.08, ya, 0.16, yb - ya, '#c9cbcf'); }
      M.rails(P, 38, 40 + arc + 2, 0);
    } else {
      M.rect(xa, -0.25, -hw - 5 - xa, 0.15, '#f2eee2'); M.rect(xa, 0.1, -hw - 5 - xa, 0.15, '#f2eee2'); M.rect(hw + 5, -0.25, xb - hw - 5, 0.15, '#f2eee2'); M.rect(hw + 5, 0.1, xb - hw - 5, 0.15, '#f2eee2');
      M.rect(-0.25, ya, 0.15, -zc - 3 - ya, '#f2eee2'); M.rect(0.1, ya, 0.15, -zc - 3 - ya, '#f2eee2'); M.rect(-0.25, zc + 3, 0.15, yb - zc - 3, '#f2eee2'); M.rect(0.1, zc + 3, 0.15, yb - zc - 3, '#f2eee2');
      for (const o of [-5, 5]) { M.dash(xa, o - 0.07, -hw - 5 - xa, 0.15, 'x'); M.dash(hw + 5, o - 0.07, xb - hw - 5, 0.15, 'x'); M.dash(o - 0.07, ya, 0.15, -zc - 3 - ya, 'y'); M.dash(o - 0.07, zc + 3, 0.15, yb - zc - 3, 'y'); }
      // strzałki kierunkowe na wlocie
      const ax = xs - 14; M.rect(ax, 2.35, 4, 0.3, '#f2eee2'); M.rect(ax + 3.7, 0.9, 0.3, 1.6, '#f2eee2'); M.rect(ax + 3.2, 0.9, 1.3, 0.3, '#f2eee2');
      M.rect(ax, 7.35, 4, 0.3, '#f2eee2'); M.rect(ax + 4, 7, 0.9, 1, '#f2eee2'); M.rect(ax + 2.6, 7.5, 0.3, 1.8, '#f2eee2');
    }
    // linie zatrzymania i przejścia
    M.rect(xs - 0.4, 0, 0.4, hw, '#f2eee2'); M.rect(hw + 5, -hw, 0.4, hw, '#f2eee2');
    M.rect(-hw, -zc - 3.4, hw, 0.4, '#f2eee2'); M.rect(0, zc + 3, hw, 0.4, '#f2eee2');
    M.zebra(-hw - 4.5, -hw, 4, 2 * hw, 'x'); M.zebra(hw + 0.5, -hw, 4, 2 * hw, 'x');
    M.zebra(-hw, -zc - 2, 2 * hw, 4, 'y'); M.zebra(-hw, zc - 2, 2 * hw, 4, 'y');
    for (const [px, py] of [[xs + 0.5, hw + 0.8], [hw + 4.2, -hw - 3.6], [-hw - 3.6, -zc - 3.5], [hw + 0.8, zc + 3.2]]) M.rect(px, py, 0.5, 0.5, '#2f3338');
  });
  const lv = tram ? [8.85] : [2.5, 7.5], LL = 160;
  const crossOK = () => { if (!sg) return true; if (sg.forced) return !sg.green; if (sigState(sg) !== 'R') return false; return CYCLE - ((G.clock + sg.off) % CYCLE) > 3; };
  const lanes = [];
  for (const o of lv) {
    lanes.push({ x: -o, y: -LL, h: Math.PI / 2, len: 2 * LL, stopQ: LL - zc - 3.6, vt: 9, t: Math.random() * 3, stop: () => !crossOK() });
    lanes.push({ x: o, y: LL, h: -Math.PI / 2, len: 2 * LL, stopQ: LL - zc - 3.6, vt: 9, t: Math.random() * 3, stop: () => !crossOK() });
    lanes.push({ x: LL, y: -o, h: Math.PI, len: 2 * LL, stopQ: LL - hw - 5.6, vt: 10, t: Math.random() * 3, stop: () => !T.straight && !(sg && sigState(sg) === 'G' && dir < 0) });
  }
  const pedOn = G.world.training || R0() < 0.6, pdir = R0() < 0.5 ? 1 : -1;
  const T = { kind: 'turn', t, sg, P, x0: t.x - 40, sEnd, map, a: 0, s: 10, prevS: 10, dir, arc, sZ, zc, hw, xs, lanes, cars: [], pedOn, pdir, ped: null,
    title: dir > 0 ? '<< SKRĘT W LEWO' : 'SKRĘT W PRAWO >>', sub: t.detour ? 'OBJAZD - SKRZYŻOWANIE' : 'SKRZYŻOWANIE', limit: 20, straight: false, decided: false };
  T.s = v.x - T.x0; tdPre(T, 20);
  T.ly = v.ly;
  T.update = dt => {
    // autobus może zmienić pas aż do linii zatrzymania – tor jazdy przeliczany na bieżąco
    if (!tram && !T.decided && v.ly !== T.ly) { T.ly = v.ly; ({ P, arc, sZ, sEnd } = geo(false)); Object.assign(T, { P, arc, sZ, sEnd }); }
    if (!T.decided && T.s >= 40) {
      T.decided = true;
      if (tram ? t.set !== dir : v.lane !== (dir > 0 ? 1 : 0)) {
        T.straight = true; turnMissed(t);
        ({ P, arc, sZ, sEnd } = geo(true)); Object.assign(T, { P, arc, sZ, sEnd, title: 'NA WPROST - OBJAZD', sub: 'OMINIĘTY SKRĘT', limit: 50 });
      }
    }
    tdCars(T, dt);
    const s = T.s, zp = pathAt(P, sZ), xv = zp.x, half = 1.65;
    if (T.pedOn && !T.ped && s >= 30 && sg && sigState(sg) === 'G') {
      T.ped = { x: -pdir * (hw + 2.2), y: zp.y + (Math.random() - 0.5) * 2, dir: pdir, st: 'walk', col: SHIRTS[Math.random() * 12 | 0], hair: HAIRS[Math.random() * 6 | 0], skin: SKINS[0], wob: Math.random() * 6, sp: 1.5 };
    }
    const p = T.ped;
    if (p && T.straight) { p.conf = false; if (p.st !== 'done') { p.st = 'walk'; p.x += p.dir * p.sp * dt; if (Math.abs(p.x) > hw + 3 && p.x * p.dir > 0) p.st = 'done'; } }
    else if (p) {
      const passed = (p.x - xv) * p.dir > half + 1.1, onRoad = Math.abs(p.x) < hw + 0.5;
      const cover = s - V.len < sZ + 1 && s > sZ - 1;
      p.conf = !passed && p.st !== 'done';
      if (p.st === 'walk') {
        const ahead = (xv - p.x) * p.dir;
        if (cover && ahead > 0 && ahead < half + 1.3) p.st = 'wait';
        else p.x += p.dir * p.sp * dt;
        if (Math.abs(p.x) > hw + 3 && (p.x * p.dir) > 0) p.st = 'done';
      } else if (p.st === 'wait') { p.t = (p.t || 0) + dt; if (!cover) p.st = 'walk'; }
      else if (p.st === 'fallen') { p.t = (p.t || 0) + dt; if (p.t > 3) { p.st = 'walk'; p.sp = 2.6; } }
      if (p.st !== 'fallen' && p.st !== 'done' && cover && Math.abs(p.x - xv) < half + 0.25 && v.v > 0.3) { p.st = 'fallen'; p.t = 0; collide('Potrącenie pieszego przy skręcie!', -350); }
      if (p.conf && onRoad && s < sZ - 0.5 && v.v < 0.2 && s > 30) T.waited = true;
      if (T.prevS < sZ && s >= sZ && !T.judged) {
        T.judged = true;
        if (p.conf && p.st !== 'fallen' && Math.abs(p.x - xv) < 7) addScore(-50, 'Nieustąpienie pieszemu przy skręcie');
        else if (T.waited) addScore(15, 'Ustąpiono pieszemu przy skręcie');
      }
    }
  };
  T.exit = () => { t.cut = true; if (T.straight) return; if (v.ind === t.dir) v.ind = 0; if (!t.fast) addScore(20, 'Płynny skręt ' + (t.dir > 0 ? 'w lewo' : 'w prawo')); };
  T.draw = () => {
    if (sg) {
      const st = sigState(sg), cst = crossOK() ? 'G' : 'R';
      tdSignal(xs + 0.4, hw + 0.9, st, tram, dir); tdSignal(hw + 4, -hw - 3.6, st === 'G' && dir < 0 ? 'G' : 'R', tram);
      tdSignal(-hw - 3.4, -zc - 3.4, cst, false); tdSignal(hw + 0.9, zc + 3.1, cst, false);
    }
    for (const c of T.cars) tdCar(c.x, c.y, c.L.h, c);
    if (T.ped && T.ped.st !== 'done' || (T.ped && Math.abs(T.ped.x) < hw + 12)) { const p = T.ped; tdPed(p.x, p.y, p.dir > 0 ? 0 : Math.PI, p); if (p.st === 'wait') tdBubble(p.x, p.y - 1.6, '!'); }
  };
  return T;
}
function tdYield() {
  const T = G.td; if (!T || T.kind !== 'turn' || !T.ped || !T.ped.conf || T.ped.st === 'done') return null;
  if (T.s > T.sZ - 0.5) return null;
  return T.sZ - 3 - T.s;
}
function tdBubble(x, y, s) { fr(x - 0.7, y - 0.7, 1.4, 1.4, '#fff'); fr(x - 0.12, y - 0.5, 0.24, 0.65, '#c0392b'); fr(x - 0.12, y + 0.3, 0.24, 0.2, '#c0392b'); }

// pętla: pojazd stoi przy peronie odjazdowym, objeżdża pętlę i wyjeżdża na ulicę
const LOOP_GAP = 110; // m od wyjazdu z pętli do pierwszego przystanku
function tdLoopGeo() { const V = VEH[G.mode], tram = G.mode === 'tram', Lp = V.len + 10, R = tram ? 20 : 14; return { Lp, R, sEnd: Lp + Math.PI * R + Lp + 40 }; }
function tdLoop(stopX, name) {
  const V = VEH[G.mode], tram = G.mode === 'tram', len = V.len, { Lp, R, sEnd } = tdLoopGeo();
  const P = mkPath(0, 0, Math.PI, [{ t: 'L', L: Lp }, { t: 'A', R, ang: Math.PI, d: 1 }, { t: 'L', L: Lp + 200 }]);
  const xa = -Lp - R - 80, xb = Lp + 220, ya = -80, yb = 2 * R + 80;
  const map = tdMap(xa, ya, xb, yb, M => {
    M.rect(xa, ya, xb - xa, yb - ya, 'grass');
    M.blocks(xa, xb, ya, -34, 71); M.rect(xa, -34, xb - xa, 6, 'pave');
    M.rect(xa, 2 * R + 9, xb - xa, 6, 'pave'); M.blocks(xa, xb, 2 * R + 15, yb, 83);
    M.rect(-Lp + 6, 2 * R - 6, xb + Lp, 15, 'asph'); M.rect(-Lp + 6, 2 * R + 9, xb + Lp, 0.35, '#d8d4c8'); M.rect(-Lp + 6, 2 * R - 6.35, xb + Lp, 0.35, '#d8d4c8');
    if (!tram) M.dash(0, 2 * R + 1.5, xb, 0.15, 'x');
    for (let i = 0; i < 26; i++) { const x = -Lp - R + 8 + h1(i * 7 + 5) * (Lp * 2 + R + 80), y = 7 + h1(i * 11 + 3) * (2 * R - 14); if (Math.hypot(x + Lp, y - R) < R - 5 || x > -Lp + 2) M.tree(x, y, 2 + h1(i) * 1.4, i); }
    for (let i = 0; i < 40; i++) M.rect(-Lp + h1(i * 3) * 20 - 6, R - 4 + h1(i * 5) * 8, 0.5, 0.5, ['#e04a4a', '#f0d040', '#f4b6c8', '#ffffff'][i % 4]);
    // peron / zatoka
    const py = tram ? -2.2 : -3.6, sy = tram ? -10.4 : -11.4;
    M.rect(-Lp - 4, -27, Lp + 40, 16.5, 'pave');
    M.rect(-len - 8, py - 4.4, len + 12, 4.4, 'plat'); M.rect(-len - 8, py - 0.4, len + 12, 0.4, '#f2c318');
    M.rect(-len * 0.6, py - 3.8, 10, 2, 'rgba(120,170,210,0.75)'); M.rect(-len * 0.6, py - 3.8, 10, 0.25, '#3a4a5a'); M.rect(-len * 0.6 + 2, py - 1.6, 6, 0.6, '#8a5a32');
    M.rect(-6, py - 3.2, 0.6, 0.6, '#1d4f91');
    // dyspozytornia
    M.house(-len * 0.5 - 14, -27, 14, 9, 3); M.rect(-len * 0.5 - 14, -27, 14, 9, 'rgba(0,0,0,0)');
    M.rect(-len * 0.5 - 13, -26, 12, 7, '#7d8188'); M.rect(-len * 0.5 - 12, -25, 4, 2.5, '#c8ccd2'); M.rect(-len * 0.5 - 13, -26, 12, 0.6, '#1d4f91');
    // tory / jezdnia pętli
    if (tram) {
      M.line(pathOff(P, -240, sEnd + 200, 0, 1), 3.4, 'sett'); M.rails(P, -240, sEnd + 200, 0);
      const Q = mkPath(80, sy, Math.PI, [{ t: 'L', L: Lp + 70 }]); M.line(pathOff(Q, 0, Lp + 70, 0, 2), 3.4, 'sett'); M.rails(Q, 0, Lp + 70, 0); M.rect(-Lp + 8, sy - 1.6, 1.2, 3.2, '#f2c318');
      M.rect(-Lp + 8, sy - 1.6, 0.4, 3.2, '#222');
    } else {
      M.line(pathOff(P, -240, sEnd + 200, 0, 1), 7.2, 'asph'); M.line(pathOff(P, -240, sEnd, -3.6, 1), 0.3, '#d8d4c8'); M.line(pathOff(P, -240, sEnd, 3.6, 1), 0.3, '#d8d4c8');
      const Q = mkPath(80, sy, Math.PI, [{ t: 'L', L: Lp + 70 }]); M.line(pathOff(Q, 0, Lp + 70, 0, 2), 7.2, 'asph');
      for (let x = -len - 6; x < 4; x += 0.9) M.rect(x, py + 0.3, 0.45, 0.15, '#f2c318');
    }
    M.rect(4, -0.4, 0.4, 0.8, '#f2eee2');
  });
  const pm = MODELS[randModel(G.mode)], QP = mkPath(80, tram ? -10.4 : -11.4, Math.PI, [{ t: 'L', L: 200 }]);
  const people = [...Array(4)].map((_, i) => ({ x: -len * (0.15 + i * 0.2), y: (tram ? -2.2 : -3.6) - 2 - h1(i * 3) * 2, col: SHIRTS[(i * 5) % 12], hair: HAIRS[i % 6], skin: SKINS[i % 4], st: 'stand', wob: i }));
  const T = { kind: 'loop', P, x0: stopX - LOOP_GAP - sEnd, sEnd, map, a: 1, s: len + 2, prevS: len + 2, title: 'PĘTLA ' + name.toUpperCase(), limit: 15, lanes: [], cars: [] };
  T.update = () => { };
  T.draw = () => { tdVeh(QP, 80 + 4 + len, pm, {}); for (const p of people) tdPed(p.x, p.y, -Math.PI / 2, p); };
  return T;
}

// zajezdnia: brama w murze, plac i hala z trzema stanowiskami
function tdDepotGeo() { const V = VEH[G.mode]; const sStop = 45 + 8 * Math.PI + 20 + V.len; return { sStop, sEnd: sStop + 6 }; }
function depotStopX() { const w = G.world; return w.depot.x - 45 + tdDepotGeo().sStop; }
function tdDepot(dp) {
  const V = VEH[G.mode], tram = G.mode === 'tram', len = V.len, { sStop, sEnd } = tdDepotGeo();
  const P = mkPath(0, 0, 0, [{ t: 'L', L: 45 }, { t: 'A', R: 16, ang: Math.PI / 2, d: 1 }, { t: 'L', L: len + 70 }]);
  const hy0 = -30, hy1 = -46 - len, xa = -len - 80, xb = 190, ya = hy1 - 40, yb = 60, yStop = -36 - len;
  const map = tdMap(xa, ya, xb, yb, M => {
    M.rect(xa, ya, xb - xa, yb - ya, 'conc');
    M.rect(xa, -20, xb - xa, yb + 20, 'pave'); M.blocks(xa, xb, 16, yb, 91);
    M.rect(xa, tram ? -6 : -5, xb - xa, tram ? 12 : 11, 'asph'); M.rect(xa, 6, xb - xa, 0.35, '#d8d4c8'); M.rect(xa, -6.35, xb - xa, 0.35, '#d8d4c8');
    if (tram) { M.rect(xa, -1.7, xb - xa, 3.4, 'sett'); for (const d of [-0.72, 0.72]) { M.rect(xa, d - 0.16, xb - xa, 0.32, '#4a4640'); M.rect(xa, d - 0.08, xb - xa, 0.16, '#c9cbcf'); } }
    else M.dash(xa, -0.07, xb - xa, 0.15, 'x');
    for (let x = xa + 6; x < xb; x += 14) if (x < 44 || x > 78) M.tree(x, -13, 2.4, x | 0);
    // mur z bramą
    for (const [a, b] of [[xa, 52], [70, xb]]) { M.rect(a, -21.2, b - a, 1.4, '#8e4030'); M.rect(a, -21.2, b - a, 0.4, '#b8644a'); }
    M.rect(50.8, -22, 1.6, 2.8, '#6a3020'); M.rect(69.6, -22, 1.6, 2.8, '#6a3020');
    M.rect(52, -19.6, 18, 0.3, '#f2c318');
    // tor / pas do hali
    if (tram) { M.line(pathOff(P, 30, sEnd + 2, 0, 1), 3.2, 'sett'); M.rails(P, 0, sEnd + 2, 0); for (const bx of [41, 81]) { const Q = mkPath(bx, hy0 + 6, -Math.PI / 2, [{ t: 'L', L: len + 12 }]); M.rails(Q, 0, len + 12, 0); } }
    else { M.line(pathOff(P, 52, sEnd, -2, 1), 0.25, '#f2c318'); M.line(pathOff(P, 52, sEnd, 2, 1), 0.25, '#f2c318'); }
    // hala
    M.rect(31, hy1, 60, hy0 - hy1, 'floor');
    M.rect(30, hy1 - 1.2, 62, 1.2, '#8e4030'); M.rect(30, hy1, 1.2, hy0 - hy1, '#8e4030'); M.rect(90.8, hy1, 1.2, hy0 - hy1, '#8e4030');
    for (const [a, b] of [[30, 34], [48, 54], [68, 74], [88, 92]]) M.rect(a, hy0 - 1.2, b - a, 1.2, '#8e4030');
    for (const x of [51, 71]) M.dash(x - 0.1, hy1 + 1, 0.2, hy0 - hy1 - 2, 'y', 2, 1);
    M.rect(55, yStop - 0.2, 12, 0.4, '#f2c318'); M.rect(52, yStop - 4.8, 18, 0.9, '#f2c318'); for (let x = 52; x < 70; x += 1.8) M.rect(x, yStop - 4.8, 0.9, 0.9, '#222');
    M.rect(57, yStop + 0.8, 8, 1.2, 'rgba(242,195,24,0.7)');
    M.rect(xa, ya, xb - xa, hy1 - 1.2 - ya, 'pave');
    M.blocks(xa, 26, ya, -24, 97); M.blocks(96, xb, ya, -24, 99);
  });
  const pm = [MODELS[randModel(G.mode)], MODELS[randModel(G.mode)]];
  const bays = [41, 81].map((bx, i) => ({ P: mkPath(bx, hy0 + 2, -Math.PI / 2, [{ t: 'L', L: 200 }]), m: pm[i] }));
  const T = { kind: 'depot', dp, P, x0: dp.x - 45, sEnd: sEnd + 30, sStop, map, a: 0, s: 15, prevS: 15, title: dp.name.toUpperCase(), limit: 10, lanes: [], cars: [], gate: 0, sub: 'ZAJEZDNIA' };
  T.update = dt => {
    const v = G.veh, s = T.s;
    T.gate = clamp(T.gate + (s > 18 ? dt : -dt) * 0.9, 0, 1);
    if (s > 45 + 8 * Math.PI - 6 && v.v > 10 / 3.6 + 0.4 && !T.fast) { T.fast = true; addScore(-10, 'Za szybko na terenie zajezdni (max 10 km/h)'); }
    if (s > sStop + 4) { v.x = T.x0 + sStop + 4; collide('Najechanie na odbojnicę w hali!', -60); }
    if (!G.inDepot && Math.abs(s - sStop) <= 4 && v.v < 0.3 && v.doors === 0) {
      G.inDepot = true; addScore(40, 'Zjazd do zajezdni');
      if (Math.abs(s - sStop) < 1) addScore(20, 'Precyzyjne ustawienie w hali');
      endTrip('Kurs zakończony – pojazd w hali zajezdni (' + dp.name + ').');
    }
  };
  T.draw = () => {
    if (tram) { const o = T.gate * 9; fr(52 - o, -20.2, 9, 0.6, '#3a4a5a'); fr(61 + o, -20.2, 9, 0.6, '#3a4a5a'); }
    else { tdBox(52.4, -20.2, -T.gate * Math.PI / 2 * 0.05, 0, 0, () => { const L = 17 * Math.cos(T.gate * Math.PI / 2); for (let x = 0; x < L; x += 1.2) fr(x, -0.2, 0.6, 0.4, '#e03030'); for (let x = 0.6; x < L; x += 1.2) fr(x, -0.2, 0.6, 0.4, '#ffffff'); }); fr(51.6, -21, 1.6, 1.6, '#333'); }
    for (const b of bays) tdVeh(b.P, len + 2, b.m, {});
    const wk = { col: '#ff8a00', hair: '#2b1d0e', skin: SKINS[0], st: 'stand' }; tdPed(73, hy0 - 8, Math.PI, wk);
    if (Math.abs(T.s - sStop) < 14 && !G.ended) { const ok = Math.abs(T.s - sStop) <= 1; fr(72.5, yStop - 1.4, 1, 1, ok ? '#30ff60' : (G.clock * 3 | 0) % 2 ? '#ffb000' : '#663c00'); }
    for (let x = 36; x < 90; x += 12) for (let y = hy1 + 6; y < hy0 - 3; y += 14) { ctx.fillStyle = 'rgba(255,240,190,0.18)'; ctx.fillRect(x - 2, y - 1, 4, 2); }
  };
  return T;
}

// ----- sterowanie sceną -----
function tdClear() { const w = G.world; w.cars = []; G.oppo = []; G.far = []; }
function tdStartLoop() {
  const w = G.world, V = VEH[G.mode], s0 = w.stops[0], name = w.loopA ? w.loopA.name : s0.name;
  const T = tdLoop(w.training ? 35 : s0.x, name);
  if (w.training) T.x0 = -5 - T.sEnd;
  G.td = T; G.veh.x = T.x0 + V.len + 2; G.veh.departX = G.veh.x; T.s = V.len + 2; T.camH = pathAt(T.P, T.s - V.len * 0.35).h;
}
function tdUpdate(dt) {
  const v = G.veh, w = G.world, V = VEH[G.mode]; if (!v || !w) return;
  if (!G.td) {
    const t = w.turns.find(t => !t.cut && !t.td && v.x > t.x - 30 && v.x < t.x + 10);
    if (t) { t.td = true; G.td = tdTurn(t); }
    else if (G.toDepot && w.depot && !w.depot.td && v.x > w.depot.x - 30) { w.depot.td = true; G.td = tdDepot(w.depot); }
    if (!G.td) return;
    tdClear();
  }
  const T = G.td; T.prevS = T.s; T.s = v.x - T.x0;
  const hh = pathAt(T.P, T.s - V.len * 0.35).h;
  T.camH = T.camH === undefined ? hh : T.camH + angD(hh, T.camH) * Math.min(1, dt * 2.5);
  if (!T.out) T.a = Math.min(1, T.a + dt / TD_FADE);
  else { T.a -= dt / TD_FADE; if (T.a <= 0) { G.td = null; return; } }
  T.update(dt);
  if (!T.out && T.s >= T.sEnd) { T.out = true; if (T.exit) T.exit(); }
}

// ----- rysowanie -----
let TDC = null;
function tdCanvas() { if (!TDC || TDC.width !== W || TDC.height !== H) { TDC = document.createElement('canvas'); TDC.width = W; TDC.height = H; } const g = TDC.getContext('2d'); g.imageSmoothingEnabled = false; return TDC; }
function drawTD(T) {
  const v = G.veh, V = VEH[G.mode], M = T.map, len = V.len;
  const c = pathAt(T.P, T.s - len * 0.5), h = T.camH === undefined ? c.h : T.camH, ahead = 12;
  const fx = c.x + Math.cos(h) * ahead, fy = c.y + Math.sin(h) * ahead;
  const sh = G.shake > 0 ? (Math.random() - 0.5) * 3 * G.shake : 0;
  ctx.save();
  ctx.fillStyle = '#6f7a5a'; ctx.fillRect(0, 0, W, H);
  ctx.translate(W * 0.5 + sh, H * 0.55); ctx.rotate(-h); ctx.scale(TS, TS); ctx.translate(-fx, -fy);
  const aligned = Math.abs(Math.sin(2 * h)) < 0.01;
  ctx.imageSmoothingEnabled = !aligned;
  ctx.drawImage(M.c, M.x0, M.y0, M.c.width / TS, M.c.height / TS);
  ctx.imageSmoothingEnabled = false;
  T.draw();
  const brake = !!(G.keys.down || G.keys.space || (v.acc || 0) < -0.4);
  const secs = tdVeh(T.P, T.s, V, { ind: v.ind, brake, line: G.trip && G.trip.line });
  ctx.restore();
  // noc i światła
  if (OV > 0) { ctx.fillStyle = `rgba(40,50,64,${0.22 * OV * (1 - NIGHT * 0.5)})`; ctx.fillRect(0, 0, W, H); }
  if (NIGHT > 0) {
    ctx.fillStyle = `rgba(8,14,40,${0.55 * NIGHT})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W * 0.5, H * 0.55); ctx.rotate(-h); ctx.scale(TS, TS); ctx.translate(-fx, -fy);
    const f = secs[secs.length - 1], p = pathAt(T.P, T.s);
    ctx.translate(p.x, p.y); ctx.rotate(f.h); ctx.fillStyle = `rgba(255,236,170,${0.28 * NIGHT})`; ctx.beginPath(); ctx.moveTo(0, -1.3); ctx.lineTo(22, -6); ctx.lineTo(22, 6); ctx.lineTo(0, 1.3); ctx.fill();
    ctx.restore();
  }
  tdWeather();
  // nagłówek sceny
  const tw = ptext(T.title, -500, -500, '#fff', 8), bw = Math.max(tw + 16, 90), bx = 6;
  R(bx, 6, bw, T.sub ? 26 : 17, 'rgba(10,18,34,0.82)'); R(bx, 6, bw, 1, '#f2c318');
  ptext(T.title, bx + 8, 10, '#ffd24a', 8); if (T.sub) ptext(T.sub + ' – max ' + T.limit + ' km/h', bx + 8, 22, '#cfe0ff', 6);
  const lx = W - 22, ly = 22; ctx.fillStyle = '#d02020'; ctx.beginPath(); ctx.arc(lx, ly, 13, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lx, ly, 10, 0, 7); ctx.fill(); ptext(String(T.limit), lx, ly - 5, '#111', 8, 'center');
  ptext(Math.round(v.v * 3.6) + ' km/h', lx, ly + 16, v.v * 3.6 > T.limit + 1 ? '#ff6a5a' : '#ffffff', 6, 'center');
  for (const f of G.floats) ptext(f.txt, W * 0.5, f.y - 40 - (2.6 - f.t) * 10, f.col, 7, 'center');
}
function tdWeather() {
  const k = WX.k, kind = WX.kind; if (k <= 0) return;
  if (kind === 'rain' || kind === 'storm') for (let i = 0; i < 140 * k; i++) { const x = h1(i * 3) * W, y = h1(i * 7) * H, f = (G.clock * 2.5 + h1(i)) % 1; if (f < 0.5) R(x, y, 1 + f * 3, 1, `rgba(210,228,255,${0.6 * (1 - f * 2)})`); }
  if (kind === 'snow') for (let i = 0; i < 160 * k; i++) { const x = (h1(i * 3) * W + Math.sin(G.clock + i) * 5 + G.clock * 6) % W, y = (h1(i * 7) * H + G.clock * 10 * (0.5 + h1(i))) % H; R(x, y, 1, 1, 'rgba(255,255,255,0.9)'); }
  if (kind === 'fog') { ctx.fillStyle = `rgba(214,220,226,${0.45 * k})`; ctx.fillRect(0, 0, W, H); }
  if (WX.flash > 0) { ctx.fillStyle = `rgba(235,240,255,${WX.flash * 0.7})`; ctx.fillRect(0, 0, W, H); }
}

