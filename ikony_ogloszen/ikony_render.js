// Wycięte z MWL_THT v6.3.4 (Ver_5_0/resources/tramlive/render.js) – rysowanie ikon nad kabiną.
// Wymaga istniejących w grze: R(x,y,w,h,col), ptext(txt,x,y,col,size,align), ctx.
// Opis: patrz README.md w tym folderze.

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
function drawAnnIcon(cx, cy, k) {
  const t = performance.now() / 1000, GREEN = '#0a8a2a', on = ((t * 3) | 0) % 3 !== 0;
  const p = (t * 0.8) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - p)})`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx + 0.5, cy + 0.5, 9 + p * 6, 0, Math.PI * 2); ctx.stroke();
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
function drawAnnGroup(cx, cy, ann, call) {
  const n = ann.length + (call ? 1 : 0); let x = cx - (n - 1) * 10;
  for (const k of ann) { drawAnnIcon(x, cy, k); x += 20; }
  if (call) drawCallIcon(x, cy, call);
  const lab = ann.includes('ccDrv') && ann.includes('ccPass') ? 'CC: KIEROWCA + PASAŻEROWIE' : ann.map(k => ANN_LABEL[k]).join(' · ');
  ptext(lab, cx + 1, cy - (call ? 26 : 18), '#ffe27a', 6, 'center');
}

// ===== wpięcie w draw() (fragmenty z MWL_THT) =====
// 1) przy rysowaniu własnego pojazdu (x1 = prawy koniec pojazdu na ekranie, yb = dół pojazdu):
//    G._callAt = G.call || G.ann ? [x1 - 7, yb - (G.mode === 'tram' ? 50 : 46 + (V.tall || 0))] : null;
//    (na początku tej sekcji: G._callAt = null;)
// 2) na końcu sceny – po nocy/EMIT, przed pogodą, żeby ikona nie była przyciemniana:
//    if (G._callAt && G.ann) drawAnnGroup(G._callAt[0], G._callAt[1], G.ann, G.call);
//    else if (G._callAt && G.call) drawCallIcon(G._callAt[0], G._callAt[1], G.call);
