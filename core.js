'use strict';
// ===== Stałe =====
const H = 225, PX = 3, TIME_SCALE = 2, DIST_SCALE = 0.5, LIMIT = 50 / 3.6;
const VEH = {
  tram: { len: 32, acc: 1.15, brake: 1.6, emerg: 3.2, vmax: 70 / 3.6, doors: [.1, .36, .62, .88], name: 'Tramwaj' },
  bus:  { len: 18, acc: 1.35, brake: 1.8, emerg: 3.6, vmax: 80 / 3.6, doors: [.1, .5, .86], name: 'Autobus' }
};
const KIND = { tram: 'Tramwaj', bus: 'Autobus' };
// Modele taboru MPK Wrocław (uproszczone parametry, kolory w stylu pikselowym)
const MODELS = {
  gamma:    { mode: 'tram', name: 'Moderus Gamma', short: 'Gamma', len: 32, acc: 1.3, brake: 1.7, emerg: 3.3, vmax: 70 / 3.6, low: true, sec: 3,
              doors: [.05, .3, .56, .82], bogies: [.1, .37, .63, .9], panto: [.45], front: 'round', body: '#f3f3f3', skirt: '#c8102e', band: '#262b33', roof: '#c4c7cc', pcol: '#3a4552', pillar: 10, nose: '#262b33',
              info: 'Nowoczesny, w pełni niskopodłogowy, klimatyzowany.' },
  twist:    { mode: 'tram', name: 'Pesa Twist 146N', short: 'Twist', len: 32, acc: 1.35, brake: 1.75, emerg: 3.4, vmax: 70 / 3.6, low: true, sec: 3,
              doors: [.05, .3, .56, .82], bogies: [.1, .37, .63, .9], panto: [.42], front: 'slope', body: '#f5f5f5', skirt: '#2b2f36', band: '#1b2026', roof: '#d0d0d0', pcol: '#323b46', pillar: 12, nose: '#c8102e', stripe: '#c8102e',
              info: 'Najnowszy, niskopodłogowy, z klimatyzacją.' },
  skoda:    { mode: 'tram', name: 'Škoda 16T Elektra', short: 'Škoda 16T', len: 31, acc: 1.2, brake: 1.65, emerg: 3.3, vmax: 70 / 3.6, low: true, sec: 5,
              doors: [.04, .25, .46, .67, .87], bogies: [.1, .5, .9], panto: [.5], front: 'round', body: '#f1f1f1', skirt: '#c8102e', band: '#2a3038', roof: '#bfc3c8', pcol: '#f1f1f1', pillar: 8, nose: '#c8102e',
              info: 'Pięcioczłonowy, jednokierunkowy – 17 szt. zbudowanych dla Wrocławia (2006–07).' },
  skoda19:  { mode: 'tram', name: 'Škoda 19T Elektra', short: 'Škoda 19T', len: 32, acc: 1.25, brake: 1.7, emerg: 3.3, vmax: 70 / 3.6, low: true, sec: 5, bidir: true,
              doors: [.04, .25, .46, .67, .88], bogies: [.1, .5, .9], panto: [.5], front: 'elektra', body: '#f3f3f3', skirt: '#c8102e', band: '#232a33', roof: '#c2c6cb', pcol: '#232a33', pillar: 9, nose: '#c8102e', stripe: '#1d4f91',
              info: 'Dwukierunkowy, kabiny z obu stron – 31 szt. we Wrocławiu (2010–11).' },
  protram:  { mode: 'tram', name: 'Protram 205 WrAs', short: '205 WrAs', len: 26, acc: 1.15, brake: 1.6, emerg: 3.2, vmax: 65 / 3.6, low: true, sec: 3,
              doors: [.05, .4, .62, .86], bogies: [.12, .5, .88], panto: [.3], front: 'slope', body: '#efe9da', skirt: '#c8102e', band: '#22303d', roof: '#bdbdbd', pcol: '#efe9da', pillar: 7, nose: '#c8102e', stripe: '#1d4f91',
              info: 'Wrocławska konstrukcja, niska podłoga tylko w środkowym członie (rampa w drzwiach 2).' },
  konstal:  { mode: 'tram', name: 'Konstal 105Na (skład 2 wagonów)', short: '105Na', len: 27, acc: 1.0, brake: 1.45, emerg: 3.0, vmax: 60 / 3.6, low: false, sec: 2, coupled: true,
              doors: [.02, .2, .38, .55, .72, .88], bogies: [.1, .39, .61, .9], panto: [.25], front: 'box', body: '#efe6cf', skirt: '#c8102e', band: '#22303d', roof: '#a9a9a9', pcol: '#efe6cf', pillar: 6, nose: '#c8102e',
              info: 'Klasyk z PRL, wysoka podłoga – brak rampy, słabsze hamulce.' },
  k105n2k:  { mode: 'tram', name: 'Konstal 105N2k/2000 (2 wagony)', short: '105N2k/2000', len: 27, acc: 1.1, brake: 1.55, emerg: 3.1, vmax: 65 / 3.6, low: false, sec: 2, coupled: true,
              doors: [.03, .22, .4, .55, .74, .91], bogies: [.1, .39, .61, .9], panto: [.25, .75], front: 'slope', body: '#f2f2f2', skirt: '#c8102e', band: '#262b33', roof: '#b9bcc0', pcol: '#f2f2f2', pillar: 7, nose: '#c8102e', stripe: '#1d4f91',
              info: 'Skład dwóch wagonów z lat 2000–03, wysoka podłoga, dwa pantografy.' },
  protram204:{ mode: 'tram', name: 'Protram 204 WrAs (2 wagony)', short: '204 WrAs', len: 27, acc: 1.1, brake: 1.55, emerg: 3.1, vmax: 65 / 3.6, low: false, sec: 2, coupled: true,
              doors: [.03, .22, .4, .55, .74, .91], bogies: [.1, .39, .61, .9], panto: [.25], front: 'slope', body: '#efe9da', skirt: '#c8102e', band: '#22303d', roof: '#b4b4b4', pcol: '#efe9da', pillar: 7, nose: '#c8102e', stripe: '#c8102e',
              info: 'Zmodernizowane 105Na w składzie dwuwagonowym, nowe czoła.' },
  urbino12: { mode: 'bus', name: 'Solaris Urbino 12', short: 'Urbino 12', len: 12, acc: 1.45, brake: 1.9, emerg: 3.7, vmax: 75 / 3.6, low: true,
              doors: [.03, .38, .78], wheels: [.3, .68], front: 'solaris', body: '#f2f2f2', stripe: '#1d4f91', roof: '#dcdcdc', pillar: 8,
              info: 'Solowy 12 m, zwrotny i żwawy.' },
  urbino18: { mode: 'bus', name: 'Solaris Urbino 18', short: 'Urbino 18', len: 18, acc: 1.3, brake: 1.8, emerg: 3.6, vmax: 75 / 3.6, low: true,
              doors: [.03, .27, .58, .83], wheels: [.215, .43, .77], joint: .51, front: 'solaris', body: '#f2f2f2', stripe: '#1d4f91', roof: '#dcdcdc', pillar: 8,
              info: 'Przegubowy 18 m, 4 pary drzwi.' },
  citarog:  { mode: 'bus', name: 'Mercedes-Benz Citaro G', short: 'Citaro G', len: 18, acc: 1.3, brake: 1.85, emerg: 3.6, vmax: 78 / 3.6, low: true,
              doors: [.03, .27, .58, .83], wheels: [.215, .43, .77], joint: .51, front: 'citaro', body: '#f4f4f4', stripe: '#1d4f91', accent: '#c8102e', roof: '#d8d8d8', pillar: 9,
              info: 'Przegubowy 18 m – najliczniejszy model w MPK.' },
  ecitaro:  { mode: 'bus', name: 'Mercedes-Benz eCitaro', short: 'eCitaro', len: 12, acc: 1.65, brake: 1.95, emerg: 3.7, vmax: 72 / 3.6, low: true, electric: true,
              doors: [.03, .38, .78], wheels: [.3, .68], front: 'citaro', body: '#f4f4f4', stripe: '#1d4f91', accent: '#5cb85c', roof: '#d8d8d8', pillar: 9, pods: [[.12, .3], [.55, .28]],
              info: 'Elektryczny, mocne przyspieszenie, bateria na dachu.' },
  volvo:    { mode: 'bus', name: 'Volvo 7700', short: 'Volvo 7700', len: 12, acc: 1.15, brake: 1.7, emerg: 3.4, vmax: 72 / 3.6, low: true,
              doors: [.03, .38, .78], wheels: [.3, .68], front: 'volvo', body: '#eeece4', stripe: '#2a5aa0', roof: '#cfcfcf', pillar: 7, tall: 1,
              info: 'Starszy, cięższy w prowadzeniu – wycofywany.' }
};
// pojazdy w grze są wydłużone względem wysokości (bardziej realistyczne proporcje); m.m = prawdziwa długość
const LEN_K = 1.45;
for (const m of Object.values(MODELS)) { m.m = m.len; m.len = Math.round(m.len * LEN_K); }
for (const m of Object.values(VEH)) m.len = Math.round(m.len * LEN_K);
function setModel(id) {
  const m = MODELS[id]; if (!m) return;
  G.model[m.mode] = id; VEH[m.mode] = Object.assign({}, m, { kind: KIND[m.mode] });
  try { localStorage.setItem('mpkwro_model', JSON.stringify(G.model)); } catch (e) { }
}
function randModel(mode) { const k = Object.keys(MODELS).filter(k => MODELS[k].mode === mode); return k[Math.random() * k.length | 0]; }
const RAMP_DOOR = 1;
const LANE_Y = [178, 156];
const DRIVERS = {
  '0000': 'Kursant (szkolenie)', '1001': 'Jan Kowalski', '1002': 'Anna Nowak', '1003': 'Piotr Wiśniewski',
  '1004': 'Katarzyna Wójcik', '1005': 'Tomasz Kamiński',
  '10': 'Kierowca specjalny'
};
const RYNEK = [51.1099, 17.0322];
const SHIRTS = ['#c0392b', '#2e86c1', '#27ae60', '#8e44ad', '#d35400', '#34495e', '#16a085', '#7f8c8d', '#e67e22', '#2c3e50', '#a93226', '#5d6d7e'];
const HAIRS = ['#2b1d0e', '#5a3a1a', '#d9b26f', '#1a1a1a', '#8a4b2a', '#b0b0b0'];
const SKINS = ['#f1c9a5', '#e0ac69', '#c68642', '#f5d6b8'];

// ===== Narzędzia =====
function hav(la1, lo1, la2, lo2) {
  const R = 6371000, r = Math.PI / 180, a = Math.sin((la2 - la1) * r / 2) ** 2 +
    Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin((lo2 - lo1) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function h1(n) { let x = Math.imul(n | 0, 0x27d4eb2d) ^ 0x9e3779b9; x ^= x >>> 15; x = Math.imul(x, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; }
function strSeed(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const pad = n => String(n).padStart(2, '0');
function fmtT(sec) { if (!isFinite(sec)) return '--:--'; sec = ((Math.round(sec) % 86400) + 86400) % 86400; return pad(Math.floor(sec / 3600)) + ':' + pad(Math.floor(sec / 60) % 60); }
function fmtHMS(sec) { sec = ((Math.floor(sec) % 86400) + 86400) % 86400; return pad(Math.floor(sec / 3600)) + ':' + pad(Math.floor(sec / 60) % 60) + ':' + pad(sec % 60); }
function fmtDelay(s) { const sg = s < 0 ? '-' : '+'; s = Math.abs(Math.round(s)); return sg + Math.floor(s / 60) + ':' + pad(s % 60); }
// ===== Warunki: godzina, pora roku, pogoda =====
const ENV = Object.assign({ hour: '', season: 'auto', weather: 'live' }, (() => { try { return JSON.parse(localStorage.getItem('ibisEnv') || '{}'); } catch (e) { return {}; } })());
if (!ENV.wv) { if (ENV.weather === 'auto') ENV.weather = 'live'; ENV.wv = 1; }
ENV.t0 = Date.now();
function saveEnv() { ENV.t0 = Date.now(); try { localStorage.setItem('ibisEnv', JSON.stringify({ hour: ENV.hour, season: ENV.season, weather: ENV.weather, wv: 1 })); } catch (e) {} }
function nowSec() {
  if (ENV.hour) { const [h, m] = ENV.hour.split(':').map(Number); return (h * 3600 + m * 60 + Math.floor((Date.now() - ENV.t0) / 1000)) % 86400; }
  const d = new Date(); return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}
const SEASONS = { spring: 'Wiosna', summer: 'Lato', autumn: 'Jesień', winter: 'Zima' };
function seasonNow() { if (ENV.season !== 'auto') return ENV.season; const m = new Date().getMonth(); return m >= 2 && m <= 4 ? 'spring' : m <= 7 && m > 4 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter'; }
const WXK = {
  clear: { n: 'Słonecznie', ico: '☀', ov: 0, grip: 1 }, cloudy: { n: 'Pochmurno', ico: '☁', ov: 0.55, grip: 1 },
  rain: { n: 'Deszcz', ico: '🌧', ov: 0.8, grip: 0.78 }, storm: { n: 'Burza', ico: '⛈', ov: 1, grip: 0.7 },
  snow: { n: 'Śnieg', ico: '🌨', ov: 0.7, grip: 0.55 }, fog: { n: 'Mgła', ico: '🌫', ov: 0.45, grip: 0.9 },
};
const WX_ODDS = {
  spring: { clear: 4, cloudy: 3, rain: 3, storm: 1, fog: 1 }, summer: { clear: 6, cloudy: 2, rain: 2, storm: 2 },
  autumn: { clear: 2, cloudy: 3, rain: 4, fog: 3, storm: 1 }, winter: { clear: 2, cloudy: 3, snow: 5, fog: 2 },
};
const WX = { kind: 'clear', k: 0, next: null, t: 0, flash: 0, temp: 15 };
function pickWx() { const o = WX_ODDS[seasonNow()]; let s = Object.values(o).reduce((a, b) => a + b), r = Math.random() * s; for (const [k, p] of Object.entries(o)) if ((r -= p) < 0) return k; return 'clear'; }
// ===== Pogoda rzeczywista (Open-Meteo, Wrocław; bez klucza, CORS) =====
const LIVE = { kind: null, temp: null, at: 0, code: null, err: '', busy: false, onupdate: null };
const LIVE_URL = 'https://api.open-meteo.com/v1/forecast?latitude=51.11&longitude=17.03&current=temperature_2m,weather_code&timezone=Europe%2FWarsaw';
function wmoKind(c) {
  if (c >= 95) return 'storm';
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow';
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'rain';
  if (c === 45 || c === 48) return 'fog';
  return c >= 2 ? 'cloudy' : 'clear';
}
function fetchLiveWx() {
  if (LIVE.busy || typeof fetch !== 'function') return; LIVE.busy = true;
  fetch(LIVE_URL, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(j => {
    const c = j.current; LIVE.code = c.weather_code; LIVE.kind = wmoKind(c.weather_code); LIVE.temp = Math.round(c.temperature_2m); LIVE.at = Date.now(); LIVE.err = '';
    if (ENV.weather === 'live' && !(typeof G !== 'undefined' && G.running)) resetWeather();
  }).catch(e => { LIVE.err = 'brak połączenia'; }).finally(() => { LIVE.busy = false; if (LIVE.onupdate) LIVE.onupdate(); });
}
fetchLiveWx(); setInterval(fetchLiveWx, 10 * 60 * 1000);
function resetWeather() {
  const live = ENV.weather === 'live' && LIVE.kind;
  WX.kind = live ? LIVE.kind : (ENV.weather === 'auto' || ENV.weather === 'live') ? pickWx() : ENV.weather; WX.k = WX.kind === 'clear' ? 0 : 1; WX.next = null; WX.t = 45 + Math.random() * 60;
  const base = { spring: 12, summer: 25, autumn: 9, winter: -3 }[seasonNow()]; WX.temp = base + Math.round(Math.random() * 6 - 3) - (WX.kind === 'rain' || WX.kind === 'storm' ? 3 : 0);
  if (WX.kind === 'snow') WX.temp = Math.min(WX.temp, -1);
  if (live) WX.temp = LIVE.temp;
}
function updateWeather(dt) {
  const live = ENV.weather === 'live' && LIVE.kind;
  if (ENV.weather !== 'auto' && ENV.weather !== 'live') { if (WX.kind !== ENV.weather) resetWeather(); WX.k = Math.min(1, WX.k + dt * 0.3); }
  else if (WX.next) { WX.k -= dt * 0.12; if (WX.k <= 0) { WX.k = 0; WX.kind = WX.next; WX.next = null; if (G.running && WX.kind !== 'clear') say('Pogoda: ' + WXK[WX.kind].n + (WXK[WX.kind].grip < 0.9 ? ' – dłuższa droga hamowania!' : '')); } }
  else if (live) { WX.k = Math.min(1, WX.k + dt * 0.1); WX.temp = LIVE.temp; if (WX.kind !== LIVE.kind) WX.next = LIVE.kind; }
  else { WX.k = Math.min(1, WX.k + dt * 0.1); WX.t -= dt; if (WX.t <= 0) { const n = pickWx(); WX.t = 50 + Math.random() * 70; if (n !== WX.kind) WX.next = n; } }
  if (WX.kind === 'storm' && WX.k > 0.5 && Math.random() < dt * 0.12) { WX.flash = 1; if (typeof AU !== 'undefined' && AU.tone) AU.tone(55, 1.2, 'sawtooth', 0.12, 0.4); }
  WX.flash = Math.max(0, WX.flash - dt * 2.5);
}
function wxGrip() { return 1 - (1 - WXK[WX.kind].grip) * WX.k; }

// ===== Stan gry =====
const G = {
  mode: 'tram', driver: null, trip: null, world: null, veh: null, ns: 0,
  running: false, paused: false, ended: false, simTime: nowSec(), clock: 0,
  score: 0, log: [], damage: 0, load: 0, wheel: null, floats: [], shake: 0,
  msgs: [], unread: 0, minimap: true, voice: true, driverOut: null, lastDelay: 0,
  overT: 0, msgT: 70, stats: {}, oppo: [], far: [], keys: {}, mouse: 0, endReason: '', model: { tram: 'gamma', bus: 'urbino18' }
};
try { Object.assign(G.model, JSON.parse(localStorage.getItem('mpkwro_model') || '{}')); } catch (e) { }
for (const m of ['tram', 'bus']) setModel(MODELS[G.model[m]] && MODELS[G.model[m]].mode === m ? G.model[m] : (m === 'tram' ? 'gamma' : 'urbino18'));

function newVeh(x) {
  return { x, v: 0, doors: 0, doorsT: 0, ramp: 0, rampT: 0, kneel: 0, kneelT: 0, ind: 0, indT: 0, needInd: false, departX: x,
    sand: 0, lock: 0, emHeld: false, lane: 0, ly: 0, laneFrom: 0, closing: false, warnT: 0, thr: 0 };
}

// ===== Budowa świata =====
function zoneOf(lat, lon) { const d = hav(lat, lon, RYNEK[0], RYNEK[1]); return d < 1600 ? 'centre' : d < 4200 ? 'mid' : 'out'; }
function mkStop(name, x, sched, lat, lon) {
  return { name, x, sched, lat, lon, zone: zoneOf(lat, lon), bridge: /^most|mosty/i.test(name), station: /dworzec g/i.test(name),
    people: [], arrived: false, served: false, missed: false, q: null, term: false };
}
function mkPerson(x, R, kind) {
  return { x, y: 186 + Math.floor(R() * 10), col: SHIRTS[R() * SHIRTS.length | 0], hair: HAIRS[R() * HAIRS.length | 0],
    skin: SKINS[R() * SKINS.length | 0], kind: kind || 'n', st: 'wait', wob: R() * 6 };
}
function genPeople(s, R, mode, n, extra) {
  const len = VEH[mode].len;
  for (let k = 0; k < n; k++) s.people.push(mkPerson(s.x - 2 - R() * (len - 4), R));
  for (const e of extra) {
    const dx = s.x - len + VEH[mode].doors[e === 'wheel' ? RAMP_DOOR : 0] * len;
    const p = mkPerson(dx + (R() - 0.5) * 4, R, e);
    if (e === 'wheel') p.y = 191;
    s.people.push(p);
  }
}

// łuk na odgałęzieniu za zwrotnicą: wjazd A m, prosta F m, zjazd A m, przesunięcie D px
const CURVE = { a: 16, f: 14, d: 9 }, CURVE_LEN = 2 * CURVE.a + CURVE.f, CURVE_V = 20 / 3.6;
function curveShape(u) {
  if (u <= 0 || u >= CURVE_LEN) return 0;
  const t = u < CURVE.a ? u / CURVE.a : u < CURVE.a + CURVE.f ? 1 : (CURVE_LEN - u) / CURVE.a;
  return CURVE.d * t * t * (3 - 2 * t);
}
// duże skrzyżowanie ze skrętem: łuk zaczyna się A m za linią zatrzymania, długość L m, wychylenie D px
const TURN = { a: 4, L: 18, D: 30 }, TURN_V = 20 / 3.6;
function turnOff(x, t) { const u = x - t.x - TURN.a; if (u <= 0 || u > TURN.L * 2) return 0; const k = Math.min(1.35, u / TURN.L); return -t.dir * TURN.D * k * k; }
// rondo: geometria w trybie bus / tram (rx w m, y w px)
const RB = { bus: { Y: 147, ry: 24, rx: 18, iy: 10, irx: 11, oy: 33, orx: 27 }, tram: { Y: 158, ry: 50, rx: 20, iy: 36, irx: 13, oy: 58, orx: 28 } };
function roundOff(x, r) { const P = RB.bus, u = (x - r.x + P.rx) / (2 * P.rx); return u <= 0 || u >= 1 ? 0 : 5 * Math.sin(Math.PI * u) ** 2; }
function curveOff(x) {
  const w = G.world; if (!w) return 0;
  let o = 0;
  if (G.mode === 'tram') for (const s of w.switches) if (s.ok) o = Math.max(o, curveShape(x - s.x));
  if (G.mode === 'bus') for (const r of w.rounds) { const q = roundOff(x, r); if (q > o) o = q; }
  return o;
}
function vehCurving() {
  const v = G.veh, V = VEH[G.mode], w = G.world; if (!v || !w) return 0;
  if (G.mode === 'bus' && w.rounds.some(r => v.x > r.x - RB.bus.rx && v.x - V.len < r.x + RB.bus.rx)) return 2;
  if (G.mode === 'tram' && w.switches.some(s => s.ok && v.x > s.x && v.x - V.len < s.x + CURVE_LEN)) return 1;
  return 0;
}
// kierunek zmiany kursu na przystanku i+1 (1 = w lewo, -1 = w prawo)
function turnDir(st, i) {
  const a = st[i], b = st[i + 1], c = st[i + 2]; if (!c) return 0;
  const k = Math.cos(a.lat * Math.PI / 180), ux = (b.lon - a.lon) * k, uy = b.lat - a.lat, vx = (c.lon - b.lon) * k, vy = c.lat - b.lat;
  const ang = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy) * 180 / Math.PI;
  return Math.abs(ang) > 38 && Math.abs(ang) < 150 ? Math.sign(ang) : 0;
}
// autobus na złym pasie jedzie przez skrzyżowanie prosto: reszta trasy odsuwa się o DETOUR m,
// a na następnym skrzyżowaniu trzeba skręcić w tę samą stronę, by wrócić na trasę
const DETOUR = 200;
function shiftWorld(x0, d) {
  const w = G.world, sh = o => { if (o && o.x > x0) o.x += d; };
  for (const s of w.stops) if (s.x > x0) { s.x += d; for (const p of s.people) p.x += d; }
  for (const a of [w.signals, w.crossings, w.junctions, w.rounds, w.switches, w.blockers, w.dwarfs, w.turns, w.walkers, w.cars]) a.forEach(sh);
  for (const k of [...w.works, ...w.leaves]) if (k.x0 > x0) { k.x0 += d; k.x1 += d; }
  sh(w.depot); sh(w.loopB); if (w.loopA) sh(w.loopA);
  if (w.officeX !== null && w.officeX > x0) w.officeX += d;
}
function turnMissed(t) {
  const w = G.world, txt = t.dir > 0 ? 'w lewo' : 'w prawo';
  t.straight = true;
  addScore(G.mode === 'tram' ? -40 : -25, G.mode === 'tram' ? 'Zwrotnica nieprzestawiona – tramwaj pojechał prosto' : 'Ominięty skręt ' + txt + ' – zły pas');
  shiftWorld(t.x + 20, DETOUR);
  const nx = t.x + 170;
  w.turns.push({ x: nx, dir: t.dir, set: 0, passed: false, cut: false, fast: false, detour: true });
  w.signals.push({ x: nx, off: Math.random() * 26, lock: false, passed: false, turn: t.dir });
  say('Objazd! Skręć ' + txt + ' na następnym skrzyżowaniu, by wrócić na trasę');
}
// odcinek z GTFS shapes.txt: [długość po trasie (m), [[ułamek, kierunek, kąt°], ...]]
// długość w grze: 160 m + 45% nadwyżki do 1 km + 15% powyżej, max 700 m (min. tyle, by zmieściły się skręty)
const SEG = { min: 160, k1: 0.45, k2: 0.15, max: 700, maxT: 820, after: 80, before: 120, gap: 130 };
function segLayout(sg) {
  const real = sg[0];
  let g = real <= 1000 ? SEG.min + Math.max(0, real - SEG.min) * SEG.k1 : SEG.min + 840 * SEG.k1 + (real - 1000) * SEG.k2;
  g = Math.min(SEG.max, Math.max(SEG.min, g));
  let T = sg[1].slice();
  const need = n => n ? SEG.after + SEG.before + SEG.gap * (n - 1) : 0;
  while (T.length && need(T.length) > Math.max(g, SEG.maxT)) { let k = 0; T.forEach((t, j) => { if (t[2] < T[k][2]) k = j; }); T.splice(k, 1); }
  g = Math.max(g, need(T.length));
  const lo = SEG.after, hi = g - SEG.before, turns = [];
  T.forEach((t, j) => {
    let tx = clamp(t[0] * g, lo + SEG.gap * j, hi - SEG.gap * (T.length - 1 - j));
    if (turns.length) tx = Math.max(tx, turns[turns.length - 1][1] + SEG.gap);
    turns.push([t[1], Math.round(tx)]);
  });
  return { g: Math.round(g), turns };
}
function mkRound(x) { return { x, cars: [], t: 0, entered: false, sig: null }; }

// Zajezdnie MPK Wrocław (zjazd po zakończeniu kursu do najbliższej)
const DEPOTS = {
  tram: [['Zajezdnia Gaj', 51.0790, 17.0390], ['Zajezdnia Borek', 51.0895, 17.0000], ['Zajezdnia Ołbin', 51.1240, 17.0430]],
  bus: [['Zajezdnia Obornicka', 51.1440, 17.0240], ['Zajezdnia Grabiszyńska', 51.0980, 16.9750], ['Zajezdnia Krakowska', 51.0920, 17.0730]]
};
function nearestDepot(mode, lat, lon) {
  let best = DEPOTS[mode][0], bd = 1e9;
  for (const d of DEPOTS[mode]) { const dd = hav(lat, lon, d[1], d[2]); if (dd < bd) { bd = dd; best = d; } }
  return best[0];
}
function buildWorld(cfg) {
  const w = { kind: cfg.kind, mode: cfg.mode, stops: [], switches: [], leaves: [], blockers: [], crossings: [], signals: [],
    cars: [], works: [], walkers: [], junctions: [], dwarfs: [], turns: [], rounds: [], officeX: null, tips: null, carT: 3, behindT: 12, noSpawn: false };
  const R = mulberry(cfg.seed || 1), mode = cfg.mode;
  if (cfg.kind === 'idle') return w;
  if (cfg.kind === 'training') { buildTraining(w, mode, R); return w; }
  const D = LINES[cfg.line].dirs[cfg.dir];
  let x = 0;
  const segT = [];
  for (let i = cfg.start; i < D.stops.length; i++) {
    const s = D.stops[i];
    if (i > cfg.start) {
      const p = D.stops[i - 1], sg = D.seg && D.seg[i - 1];
      if (sg) { const r = segLayout(sg); x += r.g; segT.push(r.turns); }
      else { x += clamp(hav(p[1], p[2], s[1], s[2]) * DIST_SCALE, 150, 620); segT.push(null); }
    }
    w.stops.push(mkStop(s[0], x, (cfg.dep + s[3]) * 60, s[1], s[2]));
  }
  if (cfg.line === 'OFFICE') {
    w.stops.forEach(s => { s.info = TOUR_INFO[s.name]; s.zone = s.zone === 'out' ? 'mid' : s.zone; });
    if (cfg.office) { const st = w.stops[0]; st.office = true; st.noPrec = true; st.zone = 'mid'; w.officeX = st.x; }
  }
  const last = w.stops[w.stops.length - 1]; last.term = true;
  if (!cfg.office && cfg.start === 0) { w.stops[0].loop = true; w.loopA = { x: w.stops[0].x, name: w.stops[0].name }; }
  if (cfg.line !== 'OFFICE') { last.loop = true; w.loopB = { x: last.x, name: last.name }; }
  w.depot = { x: last.x + 330, name: nearestDepot(mode, last.lat, last.lon) };
  w.stops.forEach((s, i) => {
    if (s.term && i > 0) return;
    if (s.office) { genPeople(s, R, mode, 0, []); for (let k = 0; k < 6; k++) { const p = mkPerson(s.x - 2 - R() * 14, R, 'office'); p.col = '#2b2a6b'; s.people.push(p); } return; }
    const extra = [];
    if (R() < 0.16) extra.push('wheel');
    if (mode === 'bus' && R() < 0.3) extra.push('old');
    genPeople(s, R, mode, 1 + Math.floor(R() * (i === 0 ? 7 : 5)), extra);
  });
  for (let i = 0; i < w.stops.length - 1; i++) {
    const a = w.stops[i].x, g = w.stops[i + 1].x - a;
    if (segT[i]) {
      for (const [d, tx] of segT[i]) { w.turns.push({ x: a + tx, dir: d, set: 0, passed: false, cut: false, fast: false }); w.signals.push({ x: a + tx, off: R() * 26, lock: false, passed: false, turn: d }); }
      if (segT[i].length) continue;
    } else {
      const td = turnDir(w.stops, i);
      if (td && g >= (mode === 'tram' ? 260 : 200)) {
        const tx = a + g * 0.38; w.turns.push({ x: tx, dir: td, set: 0, passed: false, cut: false, fast: false });
        w.signals.push({ x: tx, off: R() * 26, lock: false, passed: false, turn: td }); continue;
      }
    }
    if (R() < 0.42) w.crossings.push({ x: a + g * 0.3, spawned: false, ped: null, bell: false });
    if (g >= 280 && R() < 0.22) {
      const r = mkRound(a + g * 0.5); w.rounds.push(r);
      if (mode === 'tram') { r.sig = { x: r.x - RB.tram.rx - 5, off: R() * 26, lock: false, passed: false, noCross: true }; w.signals.push(r.sig); }
      continue;
    }
    if (R() < 0.6) w.signals.push({ x: a + g * 0.62, off: R() * 26, lock: false, passed: false });
    if (g > 200 && R() < 0.55) w.junctions.push(mkJunction(a + g * 0.54, R() < 0.6));
    if (mode === 'tram') {
      if (g > 250 && R() < 0.55) w.switches.push({ x: a + g - 95, ok: R() < 0.4, passed: false });
      
      const se = seasonNow(); if ((se === 'autumn' || se === 'winter') && R() < 0.25) w.leaves.push({ x0: a + g * 0.1, x1: a + g * 0.42, ice: se === 'winter' });
    } else if (g > 250 && R() < 0.3) {
      const x0 = a + g * 0.42; w.works.push({ x0, x1: x0 + 22 });
    }
  }
  for (let xx = -400; xx < x + 300; xx += 70 + R() * 160) w.dwarfs.push({ x: xx, k: R() * 4 | 0 });
  return w;
}

function buildTraining(w, mode, R) {
  const tram = mode === 'tram';
  // plac szkoleniowy: wszystkie sytuacje z normalnej jazdy, na koniec pętla i zjazd do zajezdni
  const names = ['Plac manewrowy', 'Przyst. szkoleniowy 1', 'Przyst. szkoleniowy 2', 'Przyst. szkoleniowy 3', 'Przyst. szkoleniowy 4', 'Pętla szkoleniowa'];
  const xs = [0, 300, 700, 1100, 1500, 1900];
  names.forEach((n, i) => { const s = mkStop(n, xs[i], Infinity, 51.135 + i * 0.001, 16.96 + i * 0.002); s.zone = 'depot'; w.stops.push(s); });
  const last = w.stops[5];
  w.stops[0].served = w.stops[0].arrived = true; last.term = true; last.loop = true;
  w.loopB = { x: last.x, name: last.name };
  w.depot = { x: last.x + 330, name: tram ? 'Zajezdnia Gaj' : 'Zajezdnia Obornicka' };
  genPeople(w.stops[1], R, mode, 2, tram ? [] : ['old']);
  genPeople(w.stops[2], R, mode, 1, ['wheel']);
  genPeople(w.stops[3], R, mode, 2, []);
  genPeople(w.stops[4], R, mode, 2, tram ? [] : ['old']);
  w.training = true; w.noSpawn = true;
  // 0→1: przejście dla pieszych
  w.crossings.push({ x: 150, spawned: false, ped: null, bell: false });
  // 2→3: skrzyżowanie ze skrętem w lewo i sygnalizacją
  w.turns.push({ x: 900, dir: 1, set: 0, passed: false, cut: false, fast: false });
  w.signals.push({ x: 900, off: 0, forced: true, green: false, wait: 0, lock: false, passed: false, turn: 1 });
  // 3→4: przejście i rondo
  w.crossings.push({ x: 1180, spawned: false, ped: null, bell: false });
  const r = mkRound(1320); w.rounds.push(r);
  if (tram) { r.sig = { x: r.x - RB.tram.rx - 5, off: 4, lock: false, passed: false, noCross: true }; w.signals.push(r.sig); }
  // 4→5: skrzyżowanie bez świateł (wymuszenie) i czerwone światło
  w.junctions.push(mkJunction(1640, true));
  w.signals.push({ x: 1800, off: 0, forced: true, green: false, wait: 0, lock: false, passed: false });
  const D = tram ? 'dzwonek' : 'klakson';
  if (tram) {
    w.leaves.push({ x0: 340, x1: 480 });
    w.switches.push({ x: 600, ok: false, passed: false });
    
  } else {
    w.cars.push({ x: 420, v: 0, vt: 9, len: 4.4, lane: 0, col: '#2e86c1', brk: 0, nextBrake: 99, script: 'wait' });
    w.works.push({ x0: 560, x1: 585 });
  }
  // zadania od dyspozytora w treningu (events.js) – uruchamiane po minięciu x
  w.evs = [{ x: 310, k: 'ann', id: 'glab' }, { x: 720, k: 'ack', pass: false }, { x: 740, k: 'ctrl' }, { x: 1000, k: 'report', id: 'drzwi' }, { x: 1420, k: 'emerg' }, { x: 1520, k: 'report', id: 'drzewo', fxAt: 1590 }];
  const EVT2 = ' 📢 Dyspozytor poprosi o ogłoszenie z bazy: O – panel ogłoszeń, O – zmiana głośników, cyfra – nadanie.',
    EVT3 = ' 📩 Komunikat dyspozytora – potwierdź (V). Usterka drzwi – zwykłe zgłoszenie RTT (F1, zielony). 🎫 Kontrolerzy wsiądą na następnym przystanku – po zamknięciu drzwi zablokuj kasowniki (F3), a na kolejnym przystanku odblokuj je przed otwarciem drzwi.',
    EVT4 = ' 🆘 Pasażer potrzebuje pomocy – zatrzymaj pojazd i wezwij CA (F4, magenta). Drzwi zostają zamknięte, aż służby podejdą – wtedy otwórz (E) i czekaj, aż odjadą.',
    EVT5 = ' ⚠ Przeszkoda na trasie – pilne zgłoszenie PRTT (F2, czerwony). Na pętli nadaj „Przystanek końcowy”.';
  w.tips = ['',
    tram ? 'TRENING 1/6: start na pętli (widok z góry) – wyjedź z pętli na trasę. → / W – jazda, ← / S – hamowanie. Pieszy przy przejściu – dzwonek (D) i ustąp. Zatrzymaj przód przy znaku przystanku, otwórz drzwi (E), po wymianie zamknij (E).'
      : 'TRENING 1/6: start na pętli (widok z góry). Przed ruszeniem lewy kierunkowskaz (Q), gaz → / W. Pieszy przy przejściu – klakson (D) i ustąp. Senior na przystanku – przyklęk (C), drzwi (E), po wymianie podnieś (C) i zamknij (E).',
    tram ? 'TRENING 2/6: śliskie liście – piasecznica (F). Zwrotnica źle ustawiona – stań do 30 m przed nią i przestaw (Z), łuk max 20 km/h. Na przystanku osoba na wózku – rampa (R).' + EVT2
      : 'TRENING 2/6: zachowaj odstęp – auto przed Tobą gwałtownie hamuje! Znaki: roboty drogowe, zwężenie, 30 km/h i „omijaj z lewej” – Q + ↑ na lewy pas, za przeszkodą A + ↓. Na przystanku osoba na wózku – rampa (R).' + EVT2,
    tram ? 'TRENING 3/6: skręt w lewo: czerwone – stój; potem kierunkowskaz (Q), zwrotnica (Z), max 20 km/h – bez przestawienia zwrotnicy pojedziesz prosto i trzeba skręcić na następnym skrzyżowaniu (objazd). Skręt widać z góry – mapa się obraca; ustąp pieszemu na przejściu za zakrętem. Pasażer na wózku wysiada – rampa (R).' + EVT3
      : 'TRENING 3/6: skręt w lewo – kierunkowskaz (Q), lewy pas (↑), czerwone – stój, max 20 km/h. Skręt widać z góry – mapa się obraca; ustąp pieszemu za zakrętem. Autobus skręca sam, jeśli stoi na właściwym pasie – z prawego pojedziesz prosto i trzeba skręcić na następnym skrzyżowaniu (objazd). Po skręcie A + ↓ przed przystankiem. Pasażer na wózku wysiada – rampa (R).' + EVT3,
    tram ? 'TRENING 4/6: pieszy na przejściu. Rondo – tramwaj jedzie przez wyspę wg sygnalizatora (pozioma kreska = stój, pionowa = jedź), max 30 km/h.' + EVT4
      : 'TRENING 4/6: pieszy na przejściu. Rondo – ustąp autom na rondzie, jedź prawym pasem, max 30 km/h.' + EVT4,
    `TRENING 5/6: skrzyżowanie bez świateł – auto z poprzecznej może wymusić pierwszeństwo: hamuj i ${D} (D). Czerwone – zatrzymaj się i czekaj; inne pojazdy też stają przed pieszymi i autami poprzecznymi. Dojedź do pętli.` + EVT5,
    'TRENING 6/6: koniec kursu – zjazd do zajezdni. ' + (tram ? '' : 'Lewy kierunkowskaz (Q) przy ruszaniu. ') + 'Przejedź powoli przez bramę (max 10 km/h), wjedź do hali i zatrzymaj się na linii STOP, zamknij drzwi.'];
  for (let xx = -200; xx < last.x + 600; xx += 120 + R() * 120) w.dwarfs.push({ x: xx, k: R() * 4 | 0 });
}

// ===== Kursy =====
// Kurs specjalny 1/11 – trasa po atrakcjach Wrocławia (tylko kierowca 10)
const TOUR = [
  ['Biurowiec', 51.1048, 17.0090, 'start spod biurowca'],
  ['Tarczyński Arena Wrocław', 51.1413, 16.9436, 'stadion na Euro 2012, dom Śląska Wrocław, 45 tysięcy miejsc'],
  ['Sky Tower', 51.0946, 17.0193, 'najwyższy budynek Wrocławia, taras widokowy na 49. piętrze'],
  ['Dworzec Główny', 51.0985, 17.0366, 'neogotycki dworzec z 1857 roku'],
  ['Renoma', 51.1030, 17.0298, 'modernistyczny dom towarowy z 1930 roku'],
  ['Narodowe Forum Muzyki', 51.1074, 17.0262, 'sala koncertowa na placu Wolności'],
  ['Rynek', 51.1099, 17.0322, 'gotycki Ratusz i krasnale wrocławskie'],
  ['Uniwersytet', 51.1140, 17.0343, 'barokowa Aula Leopoldina i Wieża Matematyczna'],
  ['Hala Targowa', 51.1125, 17.0394, 'żelbetowa hala z 1908 roku'],
  ['Ostrów Tumski – Katedra', 51.1143, 17.0466, 'najstarsza część miasta, latarnik zapala gazowe latarnie'],
  ['Panorama Racławicka', 51.1100, 17.0446, 'monumentalny obraz bitwy pod Racławicami'],
  ['Most Grunwaldzki', 51.1088, 17.0546, 'wiszący most nad Odrą z 1910 roku'],
  ['Hala Stulecia', 51.1069, 17.0772, 'obiekt UNESCO, Pergola i Fontanna Multimedialna'],
  ['Ogród Japoński', 51.1092, 17.0797, 'japoński ogród w Parku Szczytnickim'],
  ['ZOO', 51.1045, 17.0748, 'najstarsze ZOO w Polsce i Afrykarium'],
];
(function () {
  let m = 0; const stops = TOUR.map((t, i) => { if (i) m += Math.max(2, Math.round(hav(TOUR[i - 1][1], TOUR[i - 1][2], t[1], t[2]) / 450)); return [t[0], t[1], t[2], m]; });
  const deps = []; for (let d = 5 * 60 + 7; d < 23 * 60; d += 20) deps.push(d);
  LINES.OFFICE = { type: 'tour', dirs: [{ head: 'ZOO – AFRYKARIUM', stops, deps, shape: TOUR.map(t => [t[1], t[2]]) }] };
})();
const TOUR_INFO = Object.fromEntries(TOUR.map(t => [t[0], t[3]]));
function lineData(t) { return LINES[t.src || t.line]; }
const SPECIAL_ID = '10';
function isSpecial() { return !!(G.driver && G.driver.id === SPECIAL_ID); }
function makeTrip(line, kurs, dir, after) {
  const L = LINES[line]; if (!L) return null;
  const explicit = dir === 0 || dir === 1;
  const dirIdx = explicit ? Math.min(dir, L.dirs.length - 1) : (kurs - 1) % 2, D = L.dirs[dirIdx];
  const now = after !== undefined ? after : nowSec() / 60;
  let k = D.deps.findIndex(d => d >= now - (after !== undefined ? 0 : 1)); if (k < 0) k = 0;
  if (after === undefined) k = (k + (explicit ? kurs - 1 : Math.floor((kurs - 1) / 2))) % D.deps.length;
  const office = line === '1' && kurs === 11 && isSpecial();
  if (office) { const T = LINES.OFFICE.dirs[0]; let j = T.deps.findIndex(d => d >= now - 1); if (j < 0) j = 0; return { line, kurs, src: 'OFFICE', dirIdx: 0, dep: T.deps[j], start: 0, office, mode: 'bus', head: T.head, training: false }; }
  return { line, kurs, dirIdx, dep: D.deps[k], start: 0, office, mode: L.type, head: D.head, training: false };
}
function resetRun() {
  Object.assign(G, { score: 0, log: [], damage: 0, floats: [], running: false, paused: false, ended: false, driverOut: null,
    lastDelay: 0, overT: 0, wheel: null, oppo: [], far: [], endReason: '', toDepot: false, inDepot: false, td: null,
    ann: null, annT: 0, call: null, callSeq: null, evTask: null, evT: 0, evFx: [], ctrl: null });
  if (G.demo && G.demoPrev) setModel(G.demoPrev);
  G.demo = false; G.demoPrev = null;
  G.stats = { stops: 0, prec: [], missed: 0, collisions: 0, punctual: 0, ev: 0, evOk: 0 };
}
function loadTrip(t) {
  G.trip = t; G.mode = t.mode;
  const D = lineData(t).dirs[t.dirIdx];
  const office = t.office && t.start === 0;
  G.world = buildWorld({ kind: 'line', mode: t.mode, line: t.src || t.line, dir: t.dirIdx, start: t.start, dep: t.dep, office, seed: strSeed(t.line + '/' + t.kurs + '/' + t.start + '/' + t.mode) });
  resetRun();
  const s0 = G.world.stops[0];
  G.veh = newVeh(office ? s0.x : s0.x - 110);
  if (!office && G.world.loopA) tdStartLoop();
  G.ns = 0; G.simTime = s0.sched - (office ? 60 : 80); G.lastDelay = -30;
  G.load = t.start > 0 ? 6 + (Math.random() * 12 | 0) : 0;
  t.headNow = D.head;
  evPlan();
}
function loadTraining(mode) {
  G.mode = mode;
  G.trip = { training: true, mode, line: 'TR', kurs: mode === 'tram' ? 1 : 2, head: 'PĘTLA SZKOLENIOWA', start: 0 };
  G.world = buildWorld({ kind: 'training', mode, seed: mode === 'tram' ? 7 : 9 });
  resetRun();
  G.veh = newVeh(0); G.ns = 1; G.simTime = nowSec(); G.load = 0;
  tdStartLoop();
  if (mode === 'bus') G.veh.needInd = true;
}
function loadIdle() {
  G.trip = null; G.world = buildWorld({ kind: 'idle', mode: G.mode }); resetRun(); G.veh = newVeh(0); G.ns = 0;
}

// ===== Punktacja i komunikaty =====
function addScore(p, txt) {
  // tryb dla dzieci: bez punktów – tylko pochwały
  if (kidOn()) { if (p > 0 && G.veh) { G.floats.push({ x: G.veh.x - 4, y: 140, txt: '★ ' + txt, col: '#7CFC6A', t: 2.6 }); AU.beep(880, 0.08); } return; }
  // tryb standardowy: wynik nie spada poniżej zera
  G.score = Math.max(0, G.score + p); G.log.push({ p, txt, t: G.simTime });
  if (G.veh) G.floats.push({ x: G.veh.x - 4, y: 140, txt: (p > 0 ? '+' : '') + (p || '') + ' ' + txt, col: p > 0 ? '#7CFC6A' : p < 0 ? '#ff5a4a' : '#ffd24a', t: 2.6 });
  if (p < 0) AU.beep(220, 0.15); else if (p > 0) AU.beep(880, 0.08);
}
function say(txt) { UI.toast(txt); }
function collide(msg, pts = -250) {
  const v = G.veh; if (v.lock > 0) return;
  addScore(pts, msg); v.v = 0; v.lock = 3; G.shake = 0.7; G.stats.collisions++; AU.crash();
  if (kidOn()) return;
  G.damage++;
  if (G.damage >= 3) setTimeout(() => endTrip('Trzecia kolizja – kurs przerwany, zjazd do zajezdni.'), 1200);
}
function curStop() { return G.world && G.world.stops[G.ns]; }

// ===== Akcje kierowcy =====
const ACT = {
  doors() {
    const v = G.veh, V = VEH[G.mode]; if (!G.running) return say('Rozpocznij kurs przyciskiem ▶ w panelu');
    if (v.doorsT === 0 && v.doors === 0) {
      if (v.v > 0.1) return say('Najpierw zatrzymaj pojazd');
      const g = evDoorGate(); if (g && g.msg) return say(g.msg);
      const s = curStop(); const d = s ? s.x - v.x : 999;
      const atStop = s && d >= -V.len * 0.3 && d <= Math.max(22, V.len * 0.6) && (G.mode !== 'bus' || v.lane === 0);
      if (g === 'svc' && !atStop) { v.doorsT = 1; v.emDoor = true; AU.chime(); return say('Awaryjne otwarcie drzwi dla służb'); }
      if (!s || d < -V.len * 0.3 || d > Math.max(22, V.len * 0.6)) return say(s && d < 0 ? 'Za daleko za przystankiem – ponad 30% pojazdu za znakiem' : 'Drzwi otwierasz tylko na przystanku (przód przy znaku)');
      if (G.mode === 'bus' && v.lane !== 0) return say('Podjedź do krawężnika – prawy pas');
      v.doorsT = 1; AU.chime(); arrive(s, d);
    } else if (v.doorsT === 1) {
      if (v.ramp > 0) return say('Najpierw schowaj rampę (R)');
      if (evDoorGate() === 'busy') return say('Służby są w pojeździe – nie zamykaj drzwi');
      if (ctrlBoarding()) return say('Kontrolerzy wsiadają – poczekaj z zamknięciem drzwi');
      if (v.emDoor) { v.emDoor = false; v.doorsT = 0; AU.hiss(); return; }
      const s = curStop();
      if (s && s.q && !s.q.done) {
        const left = s.people.filter(p => p.st === 'wait');
        if (left.some(p => p.kind === 'wheel')) { if (V.low) addScore(-50, 'Pozostawiono osobę na wózku'); else addScore(0, 'Wagon wysokopodłogowy – wózek poczeka na niskopodłogowy'); }
        if (left.some(p => p.kind !== 'wheel') || s.q.alight > 0) addScore(-20, 'Zamknięto drzwi przed pasażerami');
        left.forEach(p => p.st = 'left');
        s.people.filter(p => p.st === 'board').forEach(p => { p.st = 'gone'; G.load++; });
        G.load = Math.max(0, G.load - s.q.alight); s.q.alight = 0; s.q.done = true;
      }
      v.doorsT = 0; v.closing = true; AU.hiss();
    }
  },
  ramp() {
    const v = G.veh;
    if (!VEH[G.mode].low) return say(VEH[G.mode].short + ': wysoka podłoga – brak rampy');
    if (v.doors < 0.99 || v.doorsT !== 1) return say('Rampę rozkładasz przy otwartych drzwiach (E)');
    v.rampT = v.rampT ? 0 : 1; AU.beep(500, 0.1);
  },
  kneel() {
    const v = G.veh; if (G.mode !== 'bus') return say('Przyklęk dostępny tylko w autobusie');
    if (v.v > 0.1) return say('Przyklęk tylko na postoju');
    v.kneelT = v.kneelT ? 0 : 1; AU.hiss();
  },
  ind(side = 1) {
    const v = G.veh;
    v.ind = v.ind === side ? 0 : side; v.indT = 0; AU.beep(1200, 0.03);
  },
  bell() {
    const v = G.veh; if (G.mode === 'tram') AU.bell(); else AU.horn();
    if (!G.running) return;
    const w = G.world;
    for (const b of w.blockers) if (!b.gone && b.leave <= 0 && b.x - v.x < 38 && b.x - v.x > 0 && v.v < 0.5) { b.leave = 1.6; addScore(15, 'Kierowca auta zjeżdża z torów'); }
    for (const c of w.crossings) if (c.x - v.x < 80 && c.x - v.x > -2) { c.bell = true; if (c.ped && c.ped.st === 'walk') c.ped.hurry = true; }
    const band = ourBand();
    for (const j of w.junctions) if (j.x - v.x < 100 && j.x - v.x > -2) for (const c of j.cars) if (c.bad && !c.halt && (c.dir > 0 ? c.y + c.len / 2 < band[0] : c.y - c.len / 2 > band[1])) { c.halt = true; addScore(10, 'Ostrzeżenie – auto zahamowało przed skrzyżowaniem'); }
  },
  sw() {
    const v = G.veh; if (G.mode !== 'tram') return say('Zwrotnice są tylko w tramwaju');
    if (G.driverOut) return;
    const tn = G.world.turns.find(t => !t.passed && t.x - v.x > -1 && t.x - v.x < 90);
    if (tn) {
      if (!v.ind) return say('Włącz kierunkowskaz (Q – lewo / A – prawo), potem Z – zwrotnica elektryczna');
      if (v.v > 20 / 3.6) return say('Zwolnij – zwrotnicę przestawiasz poniżej 20 km/h');
      tn.set = v.ind; AU.clank(); return say('Zwrotnica: ' + (v.ind > 0 ? '↰ w lewo' : '↱ w prawo'));
    }
    const s = G.world.switches.find(s => !s.ok && !s.passed && s.x - v.x > -1 && s.x - v.x < 160);
    if (!s) return say('Brak zwrotnicy do przestawienia');
    if (s.x - v.x > 30) return say('Podjedź bliżej zwrotnicy (do 30 m)');
    if (v.v > 0.1) return say('Zatrzymaj tramwaj przed zwrotnicą');
    if (v.doors > 0) return say('Zamknij drzwi przed wyjściem z kabiny');
    G.driverOut = { sw: s, t: 0, d: s.x - v.x + 1 }; AU.hiss();
  },
  sand() { if (G.mode !== 'tram') return say('Piasecznica tylko w tramwaju'); G.veh.sand = 3.5; AU.sand(); },
  lane(dir) {
    const v = G.veh; if (G.mode !== 'bus') return say('Tramwaj jedzie po szynach – nie zmienisz pasa');
    if (!G.running) return;
    if (G.td && !G.td.out && !(G.td.kind === 'turn' && !G.td.decided)) return say('Na skrzyżowaniu / pętli nie zmieniasz pasa');
    const to = v.lane + dir; if (to < 0 || to > 1) return;
    if (v.v < 1.5) return say('Zmiana pasa tylko w ruchu');
    if (Math.abs(v.ly - v.lane) > 0.01) return;
    if (v.ind !== dir) addScore(-10, 'Zmiana pasa bez ' + (dir > 0 ? 'lewego' : 'prawego') + ' kierunkowskazu');
    // kontrola zajętości pasa
    const V = VEH.bus;
    const hit = G.world.cars.find(c => c.lane === to && c.x < v.x + 1 && c.x + c.len > v.x - V.len - 1);
    v.laneFrom = v.lane; v.lane = to;
    if (hit) { collide('Zajechanie drogi przy zmianie pasa!'); v.lane = v.laneFrom; }
    setTimeout(() => { if (G.veh === v && v.lane === to && v.ind === dir) v.ind = 0; }, 1500);
  }
};

function arrive(s, d) {
  if (!s.arrived) {
    s.arrived = true; G.stats.stops++;
    if (!s.noPrec) {
      const ad = Math.abs(d), p = ad < 0.5 ? 100 : ad < 1.5 ? 80 : ad < 3 ? 55 : ad < 8 ? 30 : 0;
      G.stats.prec.push(ad); addScore(p, p ? 'Precyzja ' + ad.toFixed(1) + ' m' : (d < 0 ? 'Przejechany znak o ' + ad.toFixed(0) + ' m' : 'Niedokładne zatrzymanie'));
    }
    const al = s.term ? G.load : Math.min(G.load, Math.floor(G.load * (0.15 + Math.random() * 0.35)));
    s.q = { alight: al, wheelOff: !!(G.wheel && (G.wheel.at === G.ns || s.term)), t: 0.6, oldWait: 0, done: false };
    annStop('Przystanek ' + s.name + (s.info && !s.office ? ' – ' + s.info : '')); evArrive(s);
  } else if (s.q) { s.q.done = false; s.q.t = 0.5; }
}
function depart(s) {
  s.served = true;
  if (isFinite(s.sched) && !s.term) {
    // pierwszy przystanek: rozkład startuje od odjazdu, zawsze 30 s przed czasem
    if (G.ns === 0 && G.trip && !G.trip.training) G.simTime = s.sched - 30;
    const diff = G.simTime - s.sched;
    if (diff < -30) addScore(-30, 'Odjazd przed czasem!');
    else if (diff <= 90) { addScore(50, 'Punktualny odjazd'); G.stats.punctual++; }
    else addScore(0, 'Opóźnienie ' + fmtDelay(diff));
    G.lastDelay = diff;
  }
  if (s.term) return startDepot();
  G.ns++;
  const v = G.veh;
  if (G.mode === 'bus') { v.needInd = true; v.departX = v.x; }
  const n = curStop(); if (n) annStop('Następny przystanek: ' + n.name);
}
function startDepot() {
  const w = G.world, v = G.veh;
  if (!w.depot) return endTrip('Kurs zakończony na przystanku końcowym.');
  G.toDepot = true; G.ns++; w.noSpawn = true;
  w.cars = w.cars.filter(c => c.x < v.x - 5);
  if (G.mode === 'bus') { v.needInd = true; v.departX = v.x; }
  annStop('Koniec kursu. Zjazd do zajezdni – ' + w.depot.name);
}
function endTrip(reason) {
  if (G.ended) return;
  G.running = false; G.ended = true; G.endReason = reason; AU.gong(); G.msgs = []; G.unread = 0;
  if (G.trip && !G.demo && !kidOn()) boardAdd();
  if (G.driver && G.trip && !G.demo && !kidOn()) {
    const all = JSON.parse(localStorage.getItem('mpkwro_scores') || '{}');
    (all[G.driver.id] = all[G.driver.id] || []).push({ d: new Date().toLocaleString('pl-PL'), line: G.trip.line, kurs: G.trip.kurs, mode: G.mode, score: G.score, col: G.stats.collisions });
    all[G.driver.id].sort((a, b) => b.score - a.score); all[G.driver.id].length = Math.min(all[G.driver.id].length, 10);
    localStorage.setItem('mpkwro_scores', JSON.stringify(all));
  }
  UI.setPanel('summary');
}

// ===== Gracz i tabela wyników (localStorage) =====
function playerName() { try { return (localStorage.getItem('mpkwro_player') || '').trim(); } catch (e) { return ''; } }
function setPlayerName(n) { n = (n || '').replace(/[<>&"]/g, '').trim().slice(0, 20); try { localStorage.setItem('mpkwro_player', n); } catch (e) { } return n; }
function boardGet() { try { return JSON.parse(localStorage.getItem('mpkwro_board') || '[]'); } catch (e) { return []; } }
// import tabeli z pliku: łączy z obecną (bez duplikatów), zwraca liczbę dodanych wpisów
function boardImport(data) {
  const rows = Array.isArray(data) ? data : data && Array.isArray(data.board) ? data.board : null;
  if (!rows) throw new Error('zły format');
  const b = boardGet(), key = r => r.ts + '|' + r.n, have = new Set(b.map(key));
  let n = 0;
  for (const r of rows) {
    if (!r || typeof r.n !== 'string' || !isFinite(r.score) || !isFinite(r.ts) || have.has(key(r))) continue;
    b.push({ n: r.n.slice(0, 20), d: String(r.d || ''), ts: +r.ts, line: String(r.line || ''), kurs: +r.kurs || 0, mode: r.mode === 'bus' ? 'bus' : 'tram',
      veh: String(r.veh || ''), score: Math.max(0, +r.score), col: +r.col || 0, stops: +r.stops || 0, done: r.done !== false });
    have.add(key(r)); n++;
  }
  b.sort((a, c) => c.score - a.score || c.ts - a.ts); b.length = Math.min(b.length, 100);
  localStorage.setItem('mpkwro_board', JSON.stringify(b));
  return n;
}
function boardAdd() {
  const t = G.trip, st = G.stats || {}, b = boardGet(), m = MODELS[G.model[G.mode]];
  const r = { n: playerName() || (G.driver ? G.driver.name : 'Kierowca'), d: new Date().toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }), ts: Date.now(),
    line: t.training ? 'Trening' : t.line, kurs: t.training ? 0 : t.kurs, mode: G.mode, veh: m ? m.short : '', score: G.score, col: st.collisions || 0,
    stops: st.stops || 0, done: !/przerwan/i.test(G.endReason || '') };
  b.push(r); b.sort((a, c) => c.score - a.score || c.ts - a.ts); b.length = Math.min(b.length, 100);
  try { localStorage.setItem('mpkwro_board', JSON.stringify(b)); } catch (e) { }
  G.lastBoard = r;
}
function boardHTML(lim = 20, mark) {
  const b = boardGet().slice(0, lim);
  if (!b.length) return '<div class="bempty">Brak wyników – przejedź pierwszy kurs!</div>';
  const esc = s => String(s).replace(/[<>&"]/g, '');
  return '<table class="btab"><tr><th>#</th><th>Kierowca</th><th>Linia</th><th>Pojazd</th><th>Pkt</th><th>Kolizje</th><th>Data</th></tr>' +
    b.map((r, i) => `<tr class="${mark && r.ts === mark.ts ? 'me' : ''}${r.done ? '' : ' brk'}"><td>${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</td><td>${esc(r.n)}</td><td>${r.mode === 'tram' ? '🚋' : '🚌'} ${esc(r.line)}${r.kurs ? '/' + pad(r.kurs) : ''}</td><td>${esc(r.veh)}</td><td><b>${r.score}</b></td><td>${r.col}</td><td>${r.d}</td></tr>`).join('') + '</table>';
}

// ===== Sygnalizacja =====
const CYCLE = 26;
function sigState(sg) {
  if (sg.forced) return sg.green ? 'G' : 'R';
  if (sg.lock) return 'G';
  const t = (G.clock + sg.off) % CYCLE;
  return t < 13 ? 'G' : t < 16 ? 'Y' : 'R';
}
// faza ruchu poprzecznego: 0..1 gdy auto przejeżdża skrzyżowanie
function crossPhase(sg) {
  if (sg.forced) return sg.green ? -1 : ((G.clock * 0.35) % 1);
  if (sigState(sg) !== 'R') return -1;
  const t = (G.clock + sg.off) % CYCLE - 16.5;
  return t < 0 ? -1 : (t % 4.5) / 3.2;
}

// ===== Skrzyżowania z ulicą poprzeczną (bez świateł) =====
function mkJunction(x, bad) { return { x, cars: [], t: 0.5, bad, badDone: false }; }
function ourBand() {
  if (G.mode === 'tram') return [157, 180];
  const yb = Math.round(LANE_Y[0] - 22 * G.veh.ly); return [yb - 15, yb];
}
// ulica poprzeczna jest tylko po stronie bliższej (dół ekranu): auta skręcają w nią z jezdni dalszej (z kierunkowskazem)
// albo z niej wyjeżdżają i włączają się do ruchu na jezdni dalszej; nie ma wyjazdów z budynków
const XSTOP_DN = 137, XSTOP_UP = 206, XEXIT = 128;
function crossLen(type) { return type === 'car' ? 14 : type === 'van' ? 18 : 24; }
function mkCross(j, down, type, bad, y) {
  const len = crossLen(type);
  return { y: y !== undefined ? y : down ? 133 - len / 2 : 232, dir: down ? 1 : -1, sp: 40 + Math.random() * 15, v: 0, type, len,
    col: type === 'truck' ? '#e0e0e0' : SHIRTS[Math.random() * 12 | 0], bad, halt: false, crash: 0, ghost: false };
}
function spawnCross(j, bad, v) {
  // auto z ulicy poprzecznej (z dołu); wymuszające może też skręcać z jezdni dalszej
  const down = bad && Math.random() < 0.5;
  if (j.cars.some(o => o.dir === (down ? 1 : -1) && Math.abs(o.y - (down ? 126 : 232)) < o.len / 2 + 22)) return;
  const r = Math.random(), type = r < 0.6 ? 'car' : r < 0.85 ? 'van' : 'truck', c = mkCross(j, down, type, bad);
  if (bad) { const band = ourBand(), dist = down ? band[0] - c.y : c.y - band[1], t = Math.max(1.2, (j.x - v.x) / Math.max(v.v, 2)); c.sp = clamp(dist / t, 28, 75); }
  c.v = down && !bad ? 0 : c.sp; j.cars.push(c);
}
// skrzyżowania ze zwykłą sygnalizacją też mają ulicę poprzeczną (środek 11 px za sygnalizatorem)
function sigJ(sg) { if (!sg.j) sg.j = Object.assign(mkJunction(0, false), { sg }); sg.j.x = sg.x + 11 / PX; return sg.j; }
function allJ() { const w = G.world; return w ? [...w.junctions, ...w.signals.filter(plainSig).map(sigJ)] : []; }
// zielone dla ulicy poprzecznej (bez ostatnich 2 s fazy)
function crossGreen(sg) {
  if (sg.forced) return !sg.green;
  if (sigState(sg) !== 'R') return false;
  const t = (G.clock + sg.off) % CYCLE; return t > 16.5 && t < CYCLE - 2;
}
// tramwaj z naprzeciwka zbliża się do skrzyżowania (tor dalszy)
function oppoNear(x) { return G.mode === 'tram' && G.oppo.some(o => { const g = (x - (o.dir > 0 ? o.x + tfLen(o) : o.x)) * o.dir; return g > -tfLen(o) - 3 && g < 25 + Math.abs(o.v) * 3; }); }
function updateJunction(j, dt, v, V) {
  const d = j.x - v.x, sg = j.sg; j.t -= dt;
  if (Math.abs(d) < 230 && j.t <= 0 && j.cars.length < 3) {
    j.t = 4 + Math.random() * 6;
    const bad = !sg && j.bad && !j.badDone && d > 45 && d < 120 && v.v > 3;
    if (bad) j.badDone = true;
    // zwykłe auto pojawia się tylko, gdy zdąży zatrzymać się przed naszym pojazdem
    if (bad || v.v < 0.3 || d > 30 + v.v * 4.5 || v.x - V.len > j.x + 3) spawnCross(j, bad, v);
  } else if (!sg && j.bad && !j.badDone && d > 45 && d < 120 && v.v > 3 && j.cars.length < 3) { j.badDone = true; spawnCross(j, true, v); }
  const band = ourBand(), occupied = v.x > j.x - 2.5 && v.x - V.len < j.x + 2.5;
  const coming = occupied || (d > 0 && d < 25 + v.v * 3.5 && v.v > 0.3);
  const oppo = oppoNear(j.x), exitDir = G.mode === 'tram' ? 1 : -1;
  for (const c of j.cars) {
    const h = c.len / 2, front = c.y + c.dir * h, stopY = c.dir > 0 ? XSTOP_DN : XSTOP_UP, before = c.dir > 0 ? front < stopY + 1 : front > stopY - 1;
    if (c.crash > 0) { c.crash -= dt; if (c.crash <= 0) c.ghost = true; continue; }
    let target = c.sp;
    if (c.halt) target = 0;
    for (const o of j.cars) if (o !== c && o.dir === c.dir && (o.y - c.y) * c.dir > 0) { const g = (o.y - c.y) * c.dir - (o.len + c.len) / 2; if (g < 12) target = Math.min(target, Math.max(0, (g - 4) * 3)); }
    if (!c.bad && before) {
      // przed torami / jezdnią: czerwone (sygnalizacja) albo pierwszeństwo tramwaju i naszego pojazdu
      let wait = c.dir > 0 ? coming || oppo : sg ? !crossGreen(sg) : coming || oppo;
      if (c.dir < 0 && !wait) wait = !trafficFree(133, j.x - 2.2, 14) || !trafficFree(123, j.x - 2.2, 8);
      if (wait) target = Math.min(target, Math.max(0, (stopY - front) * c.dir * 3));
    }
    c.v += clamp(target - c.v, -120 * dt, 60 * dt);
    if (c.halt && c.v <= 0.5 && !occupied && !coming) { c.halt = false; c.bad = false; }
    c.y += c.dir * c.v * dt;
    if (!c.ghost && c.y + h > band[0] && c.y - h < band[1] && occupied) {
      if (v.x - j.x < 2.6 && v.v > 0.1) v.x = Math.min(v.x, j.x - 1.6);
      collide(c.bad ? 'Zderzenie z autem wymuszającym pierwszeństwo!' : 'Zderzenie z autem na skrzyżowaniu!');
      c.crash = 2.5; c.bad = false; G.stats.junctionHits = (G.stats.junctionHits || 0) + 1;
    }
    if (c.bad && !c.passedBad && (c.dir > 0 ? c.y - h > band[1] : c.y + h < band[0])) { c.passedBad = true; if (!c.ghost) addScore(15, 'Uniknięto kolizji z autem wymuszającym'); }
    // wyjazd z ulicy poprzecznej – włącza się do ruchu na jezdni dalszej
    if (c.dir < 0 && c.y - h < XEXIT) {
      c.gone = true;
      if (!c.ghost) { const o = { x: j.x - 2.2, v: exitDir * 3, ly: 133, dir: exitDir, vt: 10 + Math.random() * 3, col: c.col, seen: [j] }; G.far.push(o); }
    }
  }
  j.cars = j.cars.filter(c => !c.gone && c.y > 52 && c.y < 250);
}
// auto na jezdni dalszej skręca w ulicę poprzeczną: zwalnia z kierunkowskazem i przechodzi do j.cars
function farTurn(o, dt) {
  if (o.type) return Infinity;
  const c = o.x + 2.2;
  if (!o.tj) {
    o.seen = o.seen || [];
    for (const j of allJ()) { const g = (j.x - c) * o.dir; if (g > 25 && g < 70 && !o.seen.includes(j)) { o.seen.push(j); if (Math.random() < 0.4) { o.tj = j; break; } } }
    if (!o.tj) return Infinity;
  }
  const j = o.tj, g = (j.x - c) * o.dir;
  if (g < -2 || !(G.world.junctions.includes(j) || G.world.signals.some(sg => sg.j === j))) { o.tj = null; return Infinity; }
  if (g <= 0.4) {
    const len = crossLen('car');
    if (j.cars.some(q => q.dir > 0 && q.y - q.len / 2 < 135 && q.y + q.len / 2 > o.ly - len - 4)) return 0;
    const q = mkCross(j, true, 'car', false, o.ly - len / 2); q.col = o.col; q.v = 6; j.cars.push(q); o.gone = true; return Infinity;
  }
  return g;
}
// ===== Fizyka i logika =====
function approach(o, k, kt, sp) { const d = o[kt] - o[k]; o[k] = Math.abs(d) <= sp ? o[kt] : o[k] + Math.sign(d) * sp; }

function update(dt) {
  G.clock += dt;
  const v = G.veh, w = G.world, V = VEH[G.mode];
  if (!v) return;
  G.shake = Math.max(0, G.shake - dt);
  G.floats.forEach(f => f.t -= dt); G.floats = G.floats.filter(f => f.t > 0);
  const wasOpen = v.doors > 0;
  approach(v, 'doors', 'doorsT', 1.4 * dt); approach(v, 'ramp', 'rampT', 0.7 * dt); approach(v, 'kneel', 'kneelT', 0.8 * dt);
  approach(v, 'ly', 'lane', 0.9 * dt);
  if (wasOpen && v.doors === 0 && v.closing) { v.closing = false; const s = curStop(); if (s && s.arrived && !s.served) depart(s); }
  updateWalkers(dt);
  updateDeco(dt);
  updateWeather(dt);
  G.fx = (G.fx || []).filter(p => (p.t -= dt) > 0); for (const p of G.fx) { p.x += p.vx * dt; p.y += p.vy * dt; }
  if (G.attract && w && w.kind === 'idle') { v.v = 7; v.x += 7 * dt; }
  if (!G.running || G.paused || G.ended) { AU.motor(0, 0); return; }
  G.simTime += dt * TIME_SCALE;
  // do odjazdu z 1. przystanku zegar rozkładu stoi na -30 s
  if (G.ns === 0 && G.trip && !G.trip.training) { const s0 = w.stops[0]; if (s0 && isFinite(s0.sched)) G.simTime = Math.min(G.simTime, s0.sched - 30); }
  if (G.demo) demoStep(dt); else if (kidOn()) kidStep(dt);
  updateEvents(dt);

  // --- sterowanie
  const K = G.keys;
  let thr = K.up || G.mouse > 0, brk = K.down || G.mouse < 0, em = K.space;
  let block = '';
  if (v.lock > 0) { v.lock -= dt; thr = false; }
  if (thr) {
    if (v.doors > 0 || v.doorsT > 0) block = 'Zamknij drzwi (E) przed odjazdem';
    else if (v.ramp > 0) block = 'Schowaj rampę (R)';
    else if (v.kneel > 0) block = 'Podnieś autobus (C)';
    else if (G.driverOut) block = 'Motorniczy jest poza kabiną';
    else block = evThrBlock();
    if (block) { thr = false; if (v.warnT <= 0) { say(block); v.warnT = 1.5; } }
  }
  v.warnT -= dt;
  const inLeaves = w.leaves.some(l => v.x > l.x0 && v.x - V.len < l.x1);
  v.sand = Math.max(0, v.sand - dt); if (K.sand) v.sand = Math.max(v.sand, 0.3);
  // tryb dla dzieci: przywróć klawisze gracza (pomocnik ustawia je tylko na tę klatkę)
  if (G.kidK) { Object.assign(K, G.kidK.k); G.mouse = G.kidK.m; G.kidK = null; }
  const grip = v.sand > 0 && G.mode === 'tram' ? 1 : Math.min(inLeaves ? 0.45 : 1, wxGrip());
  let a;
  if (em) a = -V.emerg * grip; else if (brk) a = -V.brake * grip; else if (thr) a = V.acc * (1 - v.v / V.vmax) * (grip < 0.7 ? 0.55 : grip < 1 ? 0.85 : 1); else a = -0.12;
  if (em && v.v > 1 && !v.emHeld) { v.emHeld = true; addScore(G.load > 0 ? -10 : -5, 'Hamowanie awaryjne'); }
  if (!em) v.emHeld = false;
  if (grip < 0.7 && (brk || em) && v.v > 2 && Math.random() < dt * 1.5) G.floats.push({ x: v.x, y: 150, txt: 'POŚLIZG!', col: '#ffb347', t: 0.8 });
  const v0 = v.v;
  v.v = Math.max(0, v.v + a * dt); v.x += (v0 + v.v) / 2 * dt;
  v.thr = thr ? 1 : 0;
  v.acc = (v.acc || 0) + ((v.v - v0) / Math.max(dt, 1e-3) - (v.acc || 0)) * Math.min(1, dt * 6);
  if (G.mode === 'bus' && !V.electric && thr && Math.random() < dt * (v.v < 3 ? 14 : 5)) {
    const yb = LANE_Y[0] - 22 * v.ly; G.fx.push({ k: 'smoke', x: v.x - V.len - 0.3, y: yb - 3, vx: -0.6 - Math.random(), vy: -6 - Math.random() * 4, t: 1.6, T: 1.6 });
  }
  if (G.mode === 'tram' && (em || (brk && grip < 0.7)) && v.v > 2 && Math.random() < dt * 30) {
    const f = V.bogies[Math.random() * V.bogies.length | 0]; G.fx.push({ k: 'spark', x: v.x - V.len + f * V.len, y: 176, vx: -3 - Math.random() * 6, vy: -10 - Math.random() * 15, t: 0.35, T: 0.35 });
  }
  if (G.mode === 'tram' && v.v > 4 && (NIGHT > 0.3 || WX.kind === 'rain' || WX.kind === 'storm' || WX.kind === 'snow') && Math.random() < dt * 0.8) {
    const f = V.panto[0] || 0.5; G.fx.push({ k: 'arc', x: v.x - V.len + f * V.len, y: 0, vx: 0, vy: 0, t: 0.12, T: 0.12 });
  }
  AU.motor(v.v / V.vmax, v.thr, grip < 0.7 && (brk || em) && v.v > 1);

  if (v.v > LIMIT + 0.6) { G.overT += dt; if (G.overT > 2) { G.overT = 0; addScore(-5, 'Przekroczenie prędkości'); } } else G.overT = Math.max(0, G.overT - dt);

  // --- przystanki
  const s = curStop();
  if (s && !s.arrived && v.x - V.len * 0.3 > s.x) {
    s.missed = s.served = true; G.stats.missed++; addScore(-100, 'Pominięto przystanek ' + s.name);
    if (s.term) startDepot(); else { G.ns++; const n = curStop(); if (n) annStop('Następny przystanek: ' + n.name); }
  }
  if (s && s.q && !s.q.done && v.doors >= 0.99) exchange(s, dt);
  // zjazd do zajezdni
  // (wjazd przez bramę do hali obsługuje scena z góry – topdown.js)
  if (G.inDepot) return;
  // kierunkowskaz przy odjeździe
  if (v.needInd && v.x - v.departX > 4) {
    v.needInd = false;
    if (v.ind === 1) addScore(5, 'Kierunkowskaz przy odjeździe'); else addScore(-15, 'Odjazd bez lewego kierunkowskazu (Q)');
    setTimeout(() => { if (G.veh === v && v.lane === 0) v.ind = 0; }, 2500);
  }

  // --- zwrotnice
  if (G.driverOut) {
    const o = G.driverOut; o.t += dt;
    if (!o.sw.ok && o.t > o.d / 4 + 1.8) { o.sw.ok = true; addScore(20, 'Zwrotnica przestawiona'); AU.clank(); }
    if (o.t > o.d / 2 + 1.8) G.driverOut = null;
  }
  for (const sw of w.switches) if (!sw.passed && v.x > sw.x) {
    sw.passed = true;
    if (!sw.ok) { collide('Wykolejenie na źle ustawionej zwrotnicy!', -200); v.lock = 5; sw.ok = true; sw.fast = true; }
  }
  for (const sw of w.switches) if (sw.passed && !sw.cdone) {
    if (v.v > CURVE_V + 0.3 && !sw.fast) { sw.fast = true; addScore(-30, 'Za szybko na łuku (max 20 km/h)'); AU.clank(); G.shake = 0.6; }
    if (v.x - V.len > sw.x + CURVE_LEN) { sw.cdone = true; if (!sw.fast) addScore(10, 'Płynny przejazd przez łuk'); }
  }
  // --- auto na torowisku
  for (const b of w.blockers) {
    if (b.leave > 0) { b.leave -= dt; if (b.leave <= 0) b.gone = true; }
    if (b.gone) { b.off = Math.min(30, b.off + dt * 8); continue; }
    if (v.x > b.x - 2.3 && v.x - V.len < b.x + 2.3) { v.x = b.x - 2.3; collide('Zderzenie z autem na torowisku!'); }
  }
  // --- skrzyżowania z ulicą poprzeczną
  for (const j of allJ()) updateJunction(j, dt, v, V);
  // --- piesi na przejściach
  for (const c of w.crossings) updateCrossing(c, dt, v, V);
  // --- sygnalizacja
  for (const sg of w.signals) {
    const d = sg.x - v.x;
    if (sg.forced && !sg.green) { if (v.v < 0.1 && d > 0 && d < 45) { sg.wait += dt; if (sg.wait > 2.5) sg.green = true; } }
    if (!sg.forced && !sg.lock && !sg.passed && d > 0 && d < 55 && sigState(sg) === 'G') sg.lock = true;
    if (!sg.passed && v.x > sg.x) {
      sg.passed = true;
      if (sigState(sg) !== 'G') {
        addScore(-100, 'Przejazd na czerwonym!');
        if (!plainSig(sg)) { const ph = crossPhase(sg); if (!sg.noCross && ph > 0.3 && ph < 0.75) collide('Zderzenie na skrzyżowaniu!'); }
      }
    }
    if (sg.lock && v.x - V.len > sg.x + 10) sg.lock = false;
  }
  // --- duże skrzyżowania ze skrętem
  for (const t of w.turns) {
    if (t.straight) { t.passed = t.passed || v.x > t.x; continue; }
    if (!t.passed && v.x > t.x + 1) {
      t.passed = true;
      if (v.ind === t.dir) addScore(15, 'Kierunkowskaz przy skręcie'); else addScore(-30, 'Skręt bez ' + (t.dir > 0 ? 'lewego (Q)' : 'prawego (A)') + ' kierunkowskazu');
      if (G.mode === 'bus' && v.lane !== (t.dir > 0 ? 1 : 0)) addScore(-20, t.dir > 0 ? 'Skręt w lewo z prawego pasa' : 'Skręt w prawo z lewego pasa');
    }
    if (t.passed && !t.cut) {
      if (G.mode === 'tram' && !t.swChk && v.x > t.x + 2) {
        t.swChk = true;
        if (t.set === t.dir) addScore(10, 'Zwrotnica ustawiona prawidłowo');
      }
      if (v.v > TURN_V + 0.4 && !t.fast) { t.fast = true; addScore(-30, 'Za szybko w zakręcie (max 20 km/h)'); G.shake = 0.5; AU.clank(); }
    }
  }
  // --- ronda
  for (const r of w.rounds) {
    updateRound(r, dt, v, V);
    const P = RB[G.mode];
    if (!r.entered && v.x > r.x - P.rx * 0.87) {
      r.entered = true;
      if (G.mode === 'bus') {
        const forced = r.cars.some(c => !c.ghost && c.th < -Math.PI * 0.72 && c.th > -Math.PI * 1.2);
        if (forced) addScore(-50, 'Wymuszenie pierwszeństwa na rondzie'); else addScore(10, 'Prawidłowy wjazd na rondo');
      }
      if (v.v > 30 / 3.6) addScore(-20, 'Za szybko na rondzie (max 30 km/h)');
    }
    if (G.mode === 'bus' && v.ly > 0.4 && v.x > r.x - P.irx && v.x - V.len < r.x + P.irx) {
      if (v.x - V.len < r.x - P.irx) v.x = Math.min(v.x, r.x - P.irx + 0.3);
      if (v.v > 0.5) collide('Najechanie na wysepkę ronda – jedź prawym pasem!'); v.v = 0;
    }
  }
  // --- ruch samochodów (autobus)
  if (G.mode === 'bus') updateCars(dt, v, V);
  // --- roboty drogowe
  if (G.mode === 'bus') for (const wk of w.works) {
    if (v.ly < 0.5 && v.x > wk.x0 && v.x - V.len < wk.x1) { v.x = Math.min(v.x, wk.x0 + 0.1); if (v.v > 0.5) collide('Wjechano w roboty drogowe!'); v.v = 0; }
  }
  tdUpdate(dt);
  if (G.ended) return;
  // --- dyspozytor
  G.msgT -= dt; if (G.msgT <= 0) { G.msgT = 60 + Math.random() * 70; UI.dispatcher(); }
}

function updateRound(r, dt, v, V) {
  const P = RB[G.mode], d = r.x - v.x;
  r.t -= dt;
  if (Math.abs(d) < 260 && r.t <= 0 && r.cars.length < 3) {
    r.t = 2 + Math.random() * 3.5;
    if (!r.cars.some(c => c.th > -1.3)) { const ty = Math.random() < 0.8 ? 'car' : 'van'; r.cars.push({ th: -0.55, v: 5, sp: 6 + Math.random() * 3, col: SHIRTS[Math.random() * 12 | 0], type: ty, len: ty === 'car' ? 14 : 18, crash: 0, ghost: false }); }
  }
  const band = ourBand(), pos = th => [r.x + P.rx * Math.cos(th), P.Y + P.ry * Math.sin(th)];
  const hitP = p => p[0] > v.x - V.len - 2.3 && p[0] < v.x + 2.3 && p[1] + 4 > band[0] && p[1] - 4 < band[1];
  const inTr = p => p[1] + 5 > 139 && p[1] - 5 < 180;
  for (const c of r.cars) {
    if (c.crash > 0) { c.crash -= dt; if (c.crash <= 0) c.ghost = true; continue; }
    const cp = pos(c.th), np = pos(c.th - (Math.max(c.v, 2) * 0.7 + 1.5) / P.rx);
    let stop = !c.ghost && hitP(np) && !hitP(cp);
    if (G.mode === 'tram' && !c.ghost && !inTr(cp) && inTr(np)) {
      const xc = np[0];
      if ((xc > v.x - V.len - 4 && xc < v.x + 4) || (xc > v.x && xc - v.x < 14 + v.v * 3 && v.v > 0.3) ||
        (r.sig && xc < r.x && xc - v.x > 0 && xc - v.x < 80 && sigState(r.sig) === 'G')) stop = true;
    }
    for (const o of r.cars) if (o !== c && !o.ghost && o.th < c.th && c.th - o.th < 0.6) stop = true;
    c.v += clamp((stop ? 0 : c.sp) - c.v, -30 * dt, 5 * dt);
    c.th -= c.v * dt / P.rx;
    c.y = pos(c.th)[1]; c.xm = pos(c.th)[0];
    if (!c.ghost && hitP([c.xm, c.y])) { collide('Zderzenie z autem na rondzie!'); c.crash = 2.5; G.stats.junctionHits = (G.stats.junctionHits || 0) + 1; }
  }
  r.cars = r.cars.filter(c => c.th > -2 * Math.PI);
}
function exchange(s, dt) {
  const q = s.q, v = G.veh, V = VEH[G.mode];
  q.t -= dt; if (q.t > 0) return;
  if (q.alight > 0) { q.alight--; G.load = Math.max(0, G.load - 1); spawnWalker(v.x - V.len + V.doors[Math.random() * V.doors.length | 0] * V.len, 'n'); q.t = 0.45; return; }
  if (q.wheelOff) {
    if (v.ramp >= 0.99) { spawnWalker(v.x - V.len + V.doors[RAMP_DOOR] * V.len, 'wheel'); G.wheel = null; q.wheelOff = false; addScore(20, 'Pomoc przy wysiadaniu'); q.t = 1.2; }
    else q.t = 0.3;
    return;
  }
  const waiting = s.people.filter(p => p.st === 'wait');
  const normal = waiting.find(p => p.kind === 'n' || p.kind === 'office');
  const old = waiting.find(p => p.kind === 'old');
  const wheel = waiting.find(p => p.kind === 'wheel');
  if (normal) { board(normal, 0); q.t = 0.4; return; }
  if (old) {
    if (G.mode !== 'bus') { board(old, 0); q.t = 1; return; }
    if (v.kneel >= 0.99) { board(old, 0); addScore(10, 'Przyklęk dla seniora'); q.t = 0.8; return; }
    q.oldWait += 0.25; q.t = 0.25;
    if (q.oldWait > 5) { board(old, 0); addScore(-10, 'Senior wsiadał z trudem (C)'); q.t = 1; }
    return;
  }
  if (wheel) {
    if (v.ramp >= 0.99) { board(wheel, RAMP_DOOR); addScore(25, 'Pomoc osobie na wózku'); q.t = 1.5;
      const last = G.world.stops.length - 1; G.wheel = { at: Math.min(last, G.ns + (G.world.training ? 1 : 2 + (Math.random() * 3 | 0))) }; }
    else q.t = 0.3;
    return;
  }
  if (s.people.some(p => p.st === 'board')) { q.t = 0.2; return; }
  q.done = true; AU.beep(660, 0.05);
}
function board(p, doorIdx) {
  const v = G.veh, V = VEH[G.mode];
  let best = null, bd = 1e9;
  V.doors.forEach((f, i) => { const dx = v.x - V.len + f * V.len + 1.5; const d = Math.abs(dx - p.x); if ((doorIdx ? i === doorIdx : true) && d < bd) { bd = d; best = dx; } });
  p.st = 'board'; p.tx = best;
}
function spawnWalker(x, kind) {
  const w = G.world;
  w.walkers.push({ x: x + 1, y: 183, kind, col: SHIRTS[Math.random() * 12 | 0], hair: HAIRS[Math.random() * 6 | 0], skin: SKINS[Math.random() * 4 | 0], vx: (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.6), t: 0 });
}
function updateWalkers(dt) {
  const w = G.world; if (!w) return;
  for (const p of w.walkers) { p.t += dt; if (p.y < 192) p.y += 9 * dt; else p.x += p.vx * dt; }
  w.walkers = w.walkers.filter(p => p.t < 12);
  const s = curStop(); if (!s) return;
  for (const st of [s, w.stops[G.ns - 1]]) if (st) for (const p of st.people) if (p.st === 'board') {
    const d = p.tx - p.x; const sp = p.kind === 'old' ? 0.7 : p.kind === 'wheel' ? 0.9 : 1.6;
    if (Math.abs(d) > 0.2) p.x += Math.sign(d) * Math.min(Math.abs(d), sp * dt);
    else if (p.y > 183) p.y -= 10 * dt;
    else { p.st = 'gone'; G.load++; }
  }
}

function updateCrossing(c, dt, v, V) {
  const d = c.x - v.x;
  if (!c.spawned && d < 78 && d > 6) {
    c.spawned = true;
    c.ped = { x: c.x + 0.5, y: 197, st: 'curb', t: 0, col: SHIRTS[Math.random() * 12 | 0], hair: HAIRS[Math.random() * 6 | 0], skin: SKINS[Math.random() * 4 | 0], hurry: false, kind: 'n' };
  }
  const p = c.ped; if (!p) return;
  if (p.st === 'curb') {
    p.t += dt;
    const passed = v.x - V.len > c.x + 1;
    const stopped = v.v < 0.2 && d > 1.5;
    if (passed) p.st = 'walk';
    else if (stopped && p.t > 1) p.st = 'walk';
    else if (!c.bell && v.v > 6 && d / Math.max(v.v, 1) < 2.4 && d > 0) p.st = 'walk';
  } else if (p.st === 'walk') {
    // nie wchodzi w bok stojącego pojazdu
    const laneTop = LANE_Y[0] - 22 * (G.mode === 'bus' ? v.ly : 0);
    const body = v.x + 0.5 > c.x && v.x - V.len < c.x + 0.5;
    if (body && v.v < 0.2 && p.y > laneTop + 4 && p.y < laneTop + 8) return;
    p.y -= (p.hurry ? 32 : 14) * dt;
    if (p.y < 98) { p.st = 'gone'; }
    const yb = LANE_Y[0] - 22 * (G.mode === 'bus' ? v.ly : 0);
    if (p.y < yb + 5 && p.y > yb - 21 && v.v > 0.3 && v.x >= c.x && v.x - V.len <= c.x + 0.5) {
      p.st = 'fallen'; p.t = 0; collide('Potrącenie pieszego!', -350);
    }
  } else if (p.st === 'fallen') { p.t += dt; if (p.t > 3) { p.st = 'walk'; p.hurry = true; } }
}

function updateCars(dt, v, V) {
  const w = G.world;
  if (!w.noSpawn && !G.td) {
    w.carT -= dt;
    if (w.carT <= 0) {
      w.carT = 5 + Math.random() * 9;
      const lane = Math.random() < 0.55 ? 0 : 1, x = v.x + 100 + Math.random() * 60;
      const ahead = w.cars.filter(c => c.x > v.x).length;
      if (ahead < 3 && !w.cars.some(c => c.lane === lane && Math.abs(c.x - x) < 18) && !(lane === 1 && svcBlocks().some(([b0, b1]) => x > b0 - 15 && x < b1 + 5)) && !w.works.some(k => lane === 0 && x > k.x0 - 10 && x < k.x1 + 10))
        w.cars.push(mkCar(x, lane, 9 + Math.random() * 4 + lane * 2));
    }
    w.behindT -= dt;
    if (w.behindT <= 0) {
      w.behindT = 10 + Math.random() * 14;
      if (v.v > 3 || Math.random() < 0.4) { const c = mkCar(v.x - V.len - 70, 1, Math.max(13, v.v + 4)); c.v = c.vt; if (!w.cars.some(o => o.lane === 1 && Math.abs(o.x - c.x) < 20)) w.cars.push(c); }
    }
  }
  const busLaneOcc = l => Math.abs(v.ly - l) < 0.75, blk = svcBlocks();
  for (const c of w.cars) {
    if (c.script === 'wait') { if (v.x > 330) { c.script = 'go'; c.v = 7; } else continue; }
    if (c.script === 'go' && c.x - v.x < 32 && c.x > v.x) { c.brk = 2.2; c.script = 'done'; }
    let a = 1.4 * (1 - c.v / c.vt);
    let lead = null, gap = 1e9;
    for (const o of w.cars) if (o !== c && o.lane === c.lane && o.x > c.x) { const g = o.x - (c.x + c.len); if (g < gap) { gap = g; lead = o; } }
    if (busLaneOcc(c.lane) && v.x - V.len > c.x) { const g = v.x - V.len - (c.x + c.len); if (g < gap) { gap = g; lead = { v: v.v }; } }
    if (lead && gap < 16) a = Math.min(a, (gap - 5) * 0.7 + (lead.v - c.v) * 1.2);
    for (const sg of w.signals) {
      const d = sg.x - 3 - (c.x + c.len);
      if (d > -0.5 && d < 45 && sigState(sg) !== 'G' && !(sigState(sg) === 'Y' && d < c.v * c.v / 8)) a = Math.min(a, -(c.v * c.v) / (2 * Math.max(d, 0.4)) - 0.3);
    }
    { const yb = LANE_Y[c.lane], d = obstAhead(c.x + c.len, 1, yb - 15, yb); if (d < 35) a = Math.min(a, -(c.v * c.v) / (2 * Math.max(d - 1, 0.4)) - 0.3); }
    // służby / wypadek na drugim pasie – stań i czekaj, aż odjadą
    if (c.lane === 1 || c.cy > 0.5) for (const [b0] of blk) { const d = b0 - (c.x + c.len); if (d > -1.5 && d < 45) a = Math.min(a, -(c.v * c.v) / (2 * Math.max(d - 2, 0.3)) - 0.5); }
    if (c.lane === 0) for (const k of w.works) {
      const d = k.x0 - (c.x + c.len);
      if (d > -1 && d < 40) {
        if (!w.cars.some(o => o.lane === 1 && Math.abs(o.x - c.x) < 12) && !blk.some(([b0, b1]) => c.x + c.len > b0 - 10 && c.x < b1 + 2) && !(busLaneOcc(1) && c.x < v.x + 3 && c.x + c.len > v.x - V.len - 3)) c.lane = 1;
        else a = Math.min(a, -(c.v * c.v) / (2 * Math.max(d - 1, 0.4)) - 0.3);
      }
    }
    if (!c.script) { c.nextBrake -= dt; if (c.nextBrake <= 0 && c.x - v.x < 55 && c.x > v.x && busLaneOcc(c.lane)) { c.brk = 1.4; c.nextBrake = 14 + Math.random() * 20; } }
    if (c.brk > 0) { c.brk -= dt; a = -5; }
    c.v = Math.max(0, c.v + a * dt); c.x += c.v * dt;
    c.cy = c.cy === undefined ? c.lane : c.cy + clamp(c.lane - c.cy, -dt, dt);
    // kolizje
    if (busLaneOcc(c.lane) && v.x > c.x && v.x - V.len < c.x + c.len) {
      if (v.x - c.x < 3 && v.v >= c.v) { v.x = c.x - 0.2; collide('Najechanie na samochód!'); c.v += 2; }
      else if (c.x + c.len - (v.x - V.len) < 3) { c.x = v.x - V.len - c.len - 0.3; c.v = v.v; collide('Samochód uderzył w tył autobusu', -50); }
    }
  }
  w.cars = w.cars.filter(c => c.x < v.x + 360 && c.x > v.x - 160);
}
function mkCar(x, lane, vt) { return { x, v: vt * 0.8, vt, len: 4.4, lane, col: SHIRTS[Math.random() * 12 | 0], brk: 0, nextBrake: 6 + Math.random() * 18, type: Math.random() < 0.15 ? 'van' : 'car' }; }

// ===== Ruch pozostałych pojazdów (dalsza jezdnia, tor / jezdnia przeciwna) =====
// każdy pas ma osobną wysokość ly; pojazdy trzymają odstęp i stają na czerwonym, przed pieszymi i autami poprzecznymi
const tfLen = o => o.type === 'bus' || o.type === 'tram' ? MODELS[o.m].len : 4.4;
const tfBand = ly => ly === 155 ? [139, 157] : ly === 123 ? [114, 125] : [125, 136];
function obstAhead(front, dir, y0, y1) {
  const w = G.world; let d = 1e9;
  const at = x => { const q = (x - front) * dir; if (q > -1.5 && q < d) d = q; };
  for (const sg of w.signals) {
    if (sg.noCross) continue;
    const st = sigState(sg), x = dir > 0 ? sg.x + 0.5 : sg.x + 7, q = (x - front) * dir;
    if (st === 'R' || (st === 'Y' && q > 8)) at(x);
  }
  for (const c of w.crossings) { const p = c.ped; if (p && (p.st === 'walk' || p.st === 'fallen') && p.y > y0 - 3 && p.y < y1 + 10) at(dir > 0 ? c.x - 3 : c.x + 4); }
  for (const j of allJ()) if (j.cars.some(c => !c.ghost && c.y + c.len / 2 > y0 + 1 && c.y - c.len / 2 < y1 - 1)) at(j.x - dir * 6);
  return d;
}
function trafficFree(ly, x, gap = 20) { return ![...G.far, ...G.oppo].some(o => o.ly === ly && x > o.x - gap && x < o.x + tfLen(o) + gap); }
function moveTraffic(dt) {
  const all = [...G.far, ...G.oppo], blk = svcBlocks(), jam = jamBlocks();
  for (const o of all) {
    const dir = o.dir, L = tfLen(o), front = dir > 0 ? o.x + L : o.x, [y0, y1] = tfBand(o.ly);
    let d = obstAhead(front, dir, y0, y1);
    // przeciwny tor zajęty przez służby / wypadek – tramwaj czeka
    if (o.ly === 155) for (const [b0, b1] of blk) { const g = (dir > 0 ? b0 - front : front - b1); if (g > -1.5 && g - 2 < d) d = Math.max(0, g - 2); }
    // korek na jezdni dalszej (tramwaj) – auta ustawiają się za nim
    if (o.ly === 133) for (const [b0, b1] of jam) { const g = (dir > 0 ? b0 - front : front - b1); if (g > -1.5 && g - 2 < d) d = Math.max(0, g - 2); }
    for (const q of all) if (q !== o && q.ly === o.ly && q.dir === dir) { const g = ((dir > 0 ? q.x : q.x + tfLen(q)) - front) * dir; if (g > -1 && g - 2.5 < d) d = g - 2.5; }
    const tdist = farTurn(o, dt); if (o.gone) continue;
    const sp = Math.abs(o.v), tg = d < 0.5 || tdist <= 0.4 ? 0 : Math.min(o.vt, Math.sqrt(8 * (d - 0.5)), tdist < 40 ? 3 + tdist * 0.35 : 99), ns = Math.max(0, sp + clamp(tg - sp, -8 * dt, 2.5 * dt));
    o.brk = ns < 0.3 || ns < sp - 0.01; o.v = dir * ns; o.x += o.v * dt;
  }
}
function updateDeco(dt) {
  const v = G.veh; if (!v) return;
  const tram = G.mode === 'tram', nearDepot = (G.td && !G.td.out) || (G.world && G.world.depot && v.x > G.world.depot.x - 300);
  const add = (o, ly) => { o.ly = ly; o.dir = Math.sign(o.v); o.vt = Math.abs(o.v); if ((ly === 155 ? svcBlocks() : ly === 133 ? jamBlocks() : []).some(([b0, b1]) => o.x > b0 - 20 && o.x < b1 + 20)) return; if (trafficFree(ly, o.x)) (o.type ? G.oppo : G.far).push(o); };
  if (!nearDepot && Math.random() < dt / 9 && G.oppo.length < 2) add({ x: v.x + 140, v: -(9 + Math.random() * 4), type: tram ? 'tram' : (Math.random() < 0.3 ? 'bus' : 'car'), m: randModel(G.mode), col: SHIRTS[Math.random() * 12 | 0] }, tram ? 155 : 133);
  if (G.td) { G.far = []; G.oppo = []; }
  else if (nearDepot) { G.far = G.far.filter(c => c.x < G.world.depot.x - 10); G.oppo = G.oppo.filter(c => c.x < G.world.depot.x - 10); }
  if (!nearDepot && Math.random() < dt / 3 && G.far.length < 6) {
    const r = tram && Math.random() < 0.5, ly = r ? 133 : tram ? 123 : (Math.random() < 0.5 ? 123 : 133);
    if (tram || ly === 123 || G.oppo.length === 0 || trafficFree(133, v.x + 150, 30)) add({ x: v.x + (r ? -60 : 150), v: r ? 11 + Math.random() * 3 : -(10 + Math.random() * 3), col: SHIRTS[Math.random() * 12 | 0] }, ly);
  }
  moveTraffic(dt);
  G.far = G.far.filter(o => !o.gone);
  G.oppo = G.oppo.filter(o => o.x > v.x - 160 && o.x < v.x + 200);
  G.far = G.far.filter(o => o.x > v.x - 160 && o.x < v.x + 220);
}
