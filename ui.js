'use strict';
// ===== Dźwięk =====
const AU = {
  ctx: null, muted: false, m: null,
  init() {
    if (this.ctx) return; try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = this.ctx; this.master = c.createGain(); this.master.gain.value = 0.5; this.master.connect(c.destination);
    const o = c.createOscillator(); o.type = 'sawtooth'; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300;
    const g = c.createGain(); g.gain.value = 0; o.connect(f); f.connect(g); g.connect(this.master); o.start();
    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = nb;
    const n = c.createBufferSource(); n.buffer = nb; n.loop = true; const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 700; const ng = c.createGain(); ng.gain.value = 0;
    n.connect(nf); nf.connect(ng); ng.connect(this.master); n.start();
    this.m = { o, f, g, ng, nf };
  },
  setMute(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.5; },
  motor(sp, thr, slip) {
    if (!this.m) return; const t = this.ctx.currentTime, tram = G.mode === 'tram';
    this.m.o.frequency.setTargetAtTime((tram ? 35 : 45) + sp * (tram ? 160 : 110), t, 0.1);
    this.m.g.gain.setTargetAtTime(G.running && !G.paused ? 0.025 + thr * 0.05 + sp * 0.02 : 0, t, 0.15);
    this.m.ng.gain.setTargetAtTime(G.running && !G.paused ? sp * (tram ? 0.08 : 0.04) + (slip ? 0.1 : 0) : 0, t, 0.1);
    this.m.nf.frequency.setTargetAtTime(slip ? 2500 : tram ? 600 : 400, t, 0.1);
  },
  tone(f, d, type = 'sine', vol = 0.2, at = 0) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.05);
  },
  noise(d, freq, vol, at = 0) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + at, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + d + 0.05);
  },
  beep(f, d) { this.tone(f, d, 'square', 0.05); },
  bell() { this.tone(1250, 0.5, 'sine', 0.25); this.tone(1870, 0.4, 'sine', 0.1); this.tone(1250, 0.6, 'sine', 0.25, 0.22); this.tone(1870, 0.4, 'sine', 0.1, 0.22); },
  horn() { this.tone(330, 0.45, 'square', 0.1); this.tone(415, 0.45, 'square', 0.1); },
  chime() { [880, 660, 523].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.15, i * 0.18)); this.noise(0.5, 2000, 0.1, 0.1); },
  hiss() { this.noise(0.6, 3000, 0.15); },
  crash() { this.noise(0.8, 300, 0.6); this.noise(0.4, 1500, 0.4); this.tone(60, 0.5, 'square', 0.3); },
  gong() { this.tone(523, 0.9, 'sine', 0.2); this.tone(392, 1.2, 'sine', 0.2, 0.4); },
  clank() { this.tone(180, 0.15, 'square', 0.2); this.noise(0.2, 900, 0.3, 0.05); },
  sand() { this.noise(1.2, 5000, 0.08); }
};

// ===== Ikony SVG =====
const IC = {
  eye: '<svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="#fff"/></svg>',
  voice: '<svg viewBox="0 0 24 24"><path d="M4 4v16M14 4v16M4 12h10" stroke="#fff" stroke-width="2.5" fill="none"/><path d="M17 8q3 4 0 8M19 6q5 6 0 12" stroke="#fff" stroke-width="1.6" fill="none"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" fill="none" stroke="#fff" stroke-width="2"/><path d="M2 5l10 8 10-8" fill="none" stroke="#fff" stroke-width="2"/></svg>',
  tram: '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="#fff" stroke-width="2"/><path d="M8 1h8M12 1v4M7 9h10M8 22l2-3M16 22l-2-3" stroke="#fff" stroke-width="2"/></svg>',
  bus: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="15" rx="2" fill="none" stroke="#fff" stroke-width="2"/><path d="M3 10h18" stroke="#fff" stroke-width="2"/><circle cx="7" cy="20" r="2" fill="#fff"/><circle cx="17" cy="20" r="2" fill="#fff"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M6 3l15 9-15 9z" fill="#fff"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="5" height="18" fill="#fff"/><rect x="14" y="3" width="5" height="18" fill="#fff"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 10v8M12 6v2" stroke="#fff" stroke-width="2.5"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M2 12L12 3l10 9M5 10v11h14V10" fill="none" stroke="#fff" stroke-width="2"/></svg>',
  spk: '<svg viewBox="0 0 24 24"><path d="M3 9h4l5-5v16l-5-5H3z" fill="#fff"/><path d="M15 8q3 4 0 8M18 5q5 7 0 14" stroke="#fff" stroke-width="2" fill="none"/></svg>',
  spkoff: '<svg viewBox="0 0 24 24"><path d="M3 9h4l5-5v16l-5-5H3z" fill="#fff"/><path d="M15 9l6 6M21 9l-6 6" stroke="#fff" stroke-width="2"/></svg>',
  help: '<svg viewBox="0 0 24 24"><path d="M8 8a4 4 0 118 0c0 3-4 3-4 6M12 18v2" stroke="#fff" stroke-width="2.5" fill="none"/></svg>',
  gps: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5" stroke="#fff" stroke-width="2"/></svg>',
  key: '<svg viewBox="0 0 24 24"><circle cx="7" cy="12" r="4" fill="none" stroke="#fff" stroke-width="2"/><path d="M11 12h11M18 12v4M21 12v3" stroke="#fff" stroke-width="2"/></svg>'
};

// ===== Panel kierowcy =====
const UI = {
  state: 'off', input: '', lineIn: '', kursIn: '', field: 'line', toastT: 0, lastHud: '', mmT: 0,
  el: id => document.getElementById(id),
  toast(t) { const e = this.el('toast'); e.textContent = t; e.classList.add('on'); this.toastT = 2.6; },
  announce(t) {
    if (!G.voice || AU.muted || !window.speechSynthesis) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'pl-PL'; const vo = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('pl')); if (vo) u.voice = vo; u.rate = 1.05; speechSynthesis.speak(u); } catch (e) { }
  },
  dispatcher() {
    const M = ['Utrudnienia na pl. Grunwaldzkim – możliwe opóźnienia.', 'Kontrola biletów na linii. Prosimy o współpracę.', 'Pamiętaj o rampie dla osób na wózkach.',
      'Objazd: remont torowiska na ul. Kazimierza Wielkiego.', 'Dzień dobry! Życzymy spokojnej służby.', 'Prosimy zgłosić stan licznika po zjeździe.',
      'Mecz na Tarczyński Arena – zwiększony ruch pasażerów.', 'Uwaga: śliskie torowisko po opadach liści.', 'Przypominamy o kierunkowskazie przy odjeździe z przystanku.'];
    G.msgs.unshift({ t: fmtT(G.simTime), txt: M[Math.random() * M.length | 0] }); G.unread++; AU.tone(988, 0.15, 'sine', 0.15); AU.tone(1319, 0.2, 'sine', 0.15, 0.15);
    this.render();
  },
  setPanel(s) { this.state = s; this.render(); },
  render() {
    const p = this.el('panel'), tripOn = !!G.trip;
    const btn = (a, ic, cls = '', ga = '') => `<div class="pt btn ${cls}" data-a="${a}" style="grid-area:${ga}">${ic}</div>`;
    p.innerHTML =
      `<div class="pt clock ${G.running ? '' : 'nogps'}" style="grid-area:1/1/3/3"><div class="gps">${IC.gps}</div><div id="pclock">--:--:--</div></div>` +
      `<div class="center" style="grid-area:1/3/6/7">${this.center()}</div>` +
      `<div class="pt tripbox" id="ptrip" style="grid-area:1/7/3/9"></div>` +
      btn('eye', IC.eye, G.minimap ? 'on' : '', '3/1/4/3') + btn('voice', IC.voice, G.voice ? 'on' : '', '4/1/5/3') +
      btn('msgs', IC.mail + (G.unread ? `<span class="badge">${G.unread}</span>` : ''), G.unread ? 'blink' : '', '5/1/6/3') +
      btn('veh', G.mode === 'tram' ? IC.tram : IC.bus, '', '3/7/4/8') + btn('play', G.running && !G.paused ? IC.pause : IC.play, tripOn && !G.running && !G.ended ? 'blink' : '', '3/8/4/9') +
      btn('info', IC.info, '', '4/7/5/8') + btn('home', IC.home, '', '4/8/5/9') +
      btn('ann', IC.spk, this.state === 'ann' ? 'on' : G.evTask && G.evTask.kind === 'ann' ? 'blink' : '', '5/7/6/8') + btn('help', IC.help, '', '5/8/6/9') + (tripOn ? this.abar() : '') + this.fbarH();
    const mb = document.getElementById('mutebtn'); if (mb) { mb.textContent = AU.muted ? '🔇' : '🔊'; mb.title = AU.muted ? 'Włącz dźwięk (M)' : 'Wycisz dźwięk (M)'; }
    this.tick(true);
  },
  abar() {
    const v = G.veh || {}, tram = G.mode === 'tram', b = (a, t, k, on) => `<div class="ab${on ? ' on' : ''}" data-a="${a}"><span>${t}</span><kbd>${k}</kbd></div>`;
    return `<div class="abar">` + b('indL', '◀ Kier.', 'Q', v.ind > 0) + b('doors', 'Drzwi', 'E', v.doorsT > 0) + b('bell', tram ? 'Dzwonek' : 'Klakson', 'D') + b('ramp', 'Rampa', 'R', v.rampT > 0) +
      (tram ? b('sw', 'Zwrotnica', 'Z') + b('sand', 'Piasek', 'F', v.sand > 0) : b('kneel', 'Przyklęk', 'C', v.kneelT > 0) + b('ln:1', 'Pas ↑', '↑') + b('ln:-1', 'Pas ↓', '↓')) + b('indR', 'Kier. ▶', 'A', v.ind < 0) + `</div>`;
  },
  // pionowy panel F1–F4 (RTT / PRTT / – / CA) obok panelu kierowcy
  fbarH() {
    const t = G.evTask, c = G.call, tr = G.trip && G.trip.training;
    const need = a => !!t && ((t.kind === 'report' && (tr ? (t.r.prio ? 'prtt' : 'rtt') === a : a === 'rtt' || a === 'prtt')) || (t.kind === 'emerg' && a === 'ca'));
    const on = a => (c && c.kind === a) || (a === 'kas' && ctrlLocked()), nd = a => need(a) || (a === 'kas' && ctrlNeed());
    return `<div class="fbar">` + FKEYS.map(f => `<div class="fb ${f.c}${f.a ? '' : ' off'}${on(f.a) ? ' on' : ''}${nd(f.a) ? ' blink' : ''}"${f.a ? ` data-a="fk:${f.a}"` : ''}><b>${f.n || '·'}</b><small>${f.d}</small><kbd>${f.k}</kbd></div>`).join('') + `</div>`;
  },
  fbar() { const e = document.querySelector('#panel .fbar'); if (e) e.outerHTML = this.fbarH(); },
  center() {
    const s = this.state, c = (t, a, cls = '', ga = '') => `<div class="ct ${cls}" ${a ? `data-a="${a}"` : ''} style="grid-area:${ga}">${t}</div>`;
    const keypad = (r0) => { const K = [['1', '2', '3', '4'], ['5', '6', '7', '8'], ['←', '0', '9', '↵']]; let h = ''; K.forEach((row, i) => row.forEach((k, j) => h += c(k, 'k:' + k, 'key' + (k === '↵' ? ' ok' : ''), `${r0 + i}/${j + 1}`))); return h; };
    if (s === 'off') return c('<b>Panel kierowcy</b><br>Zaloguj się', 'login', 'big hi', '1/1/5/5') + c('⚙ Menu główne · ustawienia', 'startmenu', '', '5/1/6/5');
    if (s === 'login') {
      const n = DRIVERS[this.input];
      return c('Nr służbowy', '', 'lbl', '1/1/2/3') + c(this.input.padEnd(4, '_'), '', 'field act', '1/3/2/5') +
        c(n ? '✔ ' + n : (this.input.length === 4 ? '✖ Nieznany numer' : 'np. 1001 … 1005 · 10 = specjalny'), '', 'note', '2/1/3/5') + keypad(3);
    }
    if (s === 'menu') {
      const d = G.driver;
      let h = c(`${d.name} <small>(${d.id})</small>`, '', 'lbl', '1/1/2/5');
      if (G.trip && !G.ended) { h += c('▶ Wróć do kursu', 'trip', 'hi', '2/1/3/3') + c('✖ Zakończ kurs', 'abort', 'warn', '2/3/3/5'); }
      else h += c('Linia / Kurs', 'linekurs', 'hi', '2/1/3/3') + c('Misja treningowa', 'train', '', '2/3/3/5');
      h += c(G.trip && !G.ended ? 'Trasa linii' : 'Rozkład jazdy', G.trip && !G.ended ? 'trip' : 'linekurs', '', '3/1/4/3') + c('Zmiana pojazdu: ' + VEH[G.mode].name, 'veh', '', '3/3/4/5') +
        (G.trip && !G.ended ? c('Komunikaty', 'msgs', '', '4/1/5/3') : c('Wyniki', 'scores', '', '4/1/5/3')) + c('⚙ Menu główne', 'startmenu', '', '4/3/5/5') +
        c('Zmiana kierowcy', 'chdrv', '', '5/1/6/3') + c(IC.key + ' Wyloguj', 'logout', '', '5/3/6/5');
      return h;
    }
    if (s === 'veh') {
      const tab = this.vehTab || G.mode, list = Object.keys(MODELS).filter(k => MODELS[k].mode === tab);
      let h = c(IC.tram + ' Tramwaje', 'vt:tram', 'mtab' + (tab === 'tram' ? ' hi' : ''), '1/1/2/3') + c(IC.bus + ' Autobusy', 'vt:bus', 'mtab' + (tab === 'bus' ? ' hi' : ''), '1/3/2/5');
      const sm = list.length > 6;
      list.forEach((k, i) => { const m = MODELS[k]; h += c(`<b>${m.short}</b><small>${m.m} m${m.coupled ? ' · 2 wag.' : ''}${sm ? '' : ' · ' + (m.low ? 'niska podł.' : 'wysoka podł.')}</small>`, 'vm:' + k, 'mdl' + (sm ? ' sm' : '') + (G.model[tab] === k ? ' hi' : ''), list.length > 6 ? `${2 + (i >> 2)}/${1 + (i & 3)}/${3 + (i >> 2)}/${2 + (i & 3)}` : `${2 + (i >> 1)}/${1 + (i & 1) * 2}/${3 + (i >> 1)}/${3 + (i & 1) * 2}`); });
      const big = list.length > 6;
      return h + c('◀ Wróć', this.vehBack && this.vehBack !== 'veh' ? this.vehBack : (G.driver ? 'menu' : 'off'), '', big ? '5/3/6/5' : list.length > 5 ? '5/4/6/5' : list.length > 4 ? '4/3/5/5' : '5/1/6/5') + c(VEH[tab].name + (big ? ' – ' + VEH[tab].info : ''), '', 'note', big ? '4/1/5/5' : list.length > 5 ? '5/1/6/4' : '5/1/6/5');
    }
    if (s === 'train') {
      return c('Misja treningowa', '', 'lbl', '1/1/2/5') + c(IC.tram + '<br>Trening tramwaju', 'tr:tram', 'hi big2', '2/1/4/3') + c(IC.bus + '<br>Trening autobusu', 'tr:bus', 'hi big2', '2/3/4/5') +
        c('🎬 Pokaz – tramwaj', 'demo:tram', 'demo', '4/1/5/3') + c('🎬 Pokaz – autobus', 'demo:bus', 'demo', '4/3/5/5') + c('◀ Menu', 'menu', '', '5/1/6/3') + c('Pokaz: gra jedzie sama i pokazuje klawisze', '', 'note', '5/3/6/5');
    }
    if (s === 'linekurs') {
      const tab = this.lineTab || G.mode, q = (this.lineIn || '').toUpperCase();
      let lines = Object.keys(LINES).filter(l => LINES[l].type === tab && (!q || this.field !== 'line' || l.startsWith(q)));
      if (!lines.length) lines = Object.keys(LINES).filter(l => LINES[l].type === tab);
      const dch = this.dirSel !== undefined && LINES[q] ? `<span class="chip sel" data-a="route">→ ${LINES[q].dirs[this.dirSel].head}</span>` : '';
      let h = c('Linia', 'f:line', 'lbl', '1/1/2/2') + c(this.lineIn || '_', 'f:line', 'field' + (this.field === 'line' ? ' act' : ''), '1/2/2/3') +
        c('Kurs', 'f:kurs', 'lbl', '1/3/2/4') + c(this.kursIn || '_', 'f:kurs', 'field' + (this.field === 'kurs' ? ' act' : ''), '1/4/2/5');
      const nT = Object.values(LINES).filter(L => L.type === 'tram').length, nB = Object.values(LINES).filter(L => L.type === 'bus').length;
      h += `<div class="chips" style="grid-area:2/1/3/5"><span class="chip tab ${tab === 'tram' ? 'on' : ''}" data-a="lt:tram">🚋 ${nT}</span><span class="chip tab ${tab === 'bus' ? 'on' : ''}" data-a="lt:bus">🚌 ${nB}</span>${dch}${isSpecial() ? '<span class="chip office" data-a="office">1/11 biurowiec</span>' : ''}${lines.map(l => `<span class="chip ${LINES[l].type}${l === q ? ' sel' : ''}" data-a="l:${l}">${l}</span>`).join('')}</div>`;
      return h + keypad(3);
    }
    if (s === 'route') {
      const L = LINES[this.lineIn], dsel = this.dirSel || 0; if (!L) return c('Brak linii', 'linekurs', '', '1/1/6/5');
      let h = '';
      L.dirs.forEach((D, i) => { h += c(`<span class="ln">${this.lineIn}</span> → ${D.head}<small>${D.stops[0][0]}</small>`, 'd:' + i, 'dirb' + (i === dsel ? ' hi' : ''), `1/${1 + i * 2}/2/${3 + i * 2}`); });
      const D = L.dirs[dsel], n = D.stops.length, tot = D.stops[n - 1][3];
      const rows = D.stops.map((st, i) => `<div class="rs${i === 0 || i === n - 1 ? ' term' : ''}"><span class="rt">${i ? '+' + st[3] + "'" : 'odj.'}</span>${i === 0 || i === n - 1 ? '<b>' + st[0] + '</b> <span class="pt">PĘTLA</span>' : st[0]}</div>`).join('');
      h += `<div class="list route" style="grid-area:2/1/5/5"><div class="dest2">${n} przystanków · ok. ${tot} min</div>${rows}</div>`;
      return h + c('◀ Linie', 'rback', '', '5/1/6/2') + c('Dalej: wybór kursu ▶', 'rnext', 'hi', '5/2/6/5');
    }
    if (s === 'trip') {
      const w = G.world, t = G.trip; if (!w || !t) return c('Brak kursu', 'menu', '', '1/1/6/5');
      let h = c(`<span class="ln">${t.line}</span> ${t.training ? 'TRENING' : t.head}`, '', 'dest', '1/1/2/5');
      for (let r = 0; r < 3; r++) {
        const i = G.ns + 2 - r, s2 = w.stops[i];
        h += s2 ? c(`<span class="nm">${s2.name}</span><span class="tm">${fmtT(s2.sched)}</span>`, '', r === 2 ? 'stop cur' : 'stop', `${r + 2}/1/${r + 3}/5`) : c('', '', 'stop', `${r + 2}/1/${r + 3}/5`);
      }
      if (!G.running && !G.ended && !t.training) h += c('▲', 'up', '', '5/1') + c('▼', 'down', '', '5/2') + c('Menu', 'menu', '', '5/3/6/5');
      else h += c('📢 Ogłoszenia (O)', 'ann', '', '5/1/6/3') + c('Menu', 'menu', '', '5/3/6/5');
      return h;
    }
    if (s === 'ann') {
      const t = G.evTask && G.evTask.kind === 'ann' ? G.evTask : null;
      let h = c('📢 Głośniki', '', 'lbl', '1/1/2/2');
      ['int', 'ext', 'both'].forEach((k, i) => h += c(`<img class="spkic" src="${annIconURL(k)}" alt="${SPK_N[k]}" title="${SPK_N[k]}">`, 'sp:' + k, 'mtab' + (EV.spk === k ? ' hi' : '') + (t && t.spk === k && EV.spk !== k ? ' blink' : ''), `1/${2 + i}`));
      h += `<div class="list ann" style="grid-area:2/1/5/5">${ANN_DB[EV.spk].map((a, i) => `<div data-a="an:${i}" class="${t && t.spk === EV.spk && t.i === i ? 'req' : ''}"><kbd>${(i + 1) % 10}</kbd> ${a.n}</div>`).join('')}</div>`;
      return h + c('◀ Wróć', G.trip && !G.ended ? 'trip' : 'menu', '', '5/1/6/3') + c('O – głośniki · 1…0 – nadaj', '', 'note', '5/3/6/5');
    }
    if (s === 'msgs') {
      G.unread = 0;
      return `<div class="list" style="grid-area:1/1/5/5">${G.msgs.length ? G.msgs.slice(0, 12).map(m => `<div><b>${m.t}</b> Dyspozytor: ${m.txt}</div>`).join('') : '<div>Brak komunikatów</div>'}</div>` + c('◀ Wróć', G.trip && !G.ended ? 'trip' : 'menu', '', '5/1/6/5');
    }
    if (s === 'info' || s === 'help') {
      const info = s === 'info' ? `<div><b>Kierowca:</b> ${G.driver ? G.driver.name : '—'}</div><div><b>Pojazd:</b> ${VEH[G.mode].name}${G.trip ? ' · linia ' + G.trip.line + '/' + pad(G.trip.kurs) : ''}</div><div><b>Punkty:</b> ${G.score} · <b>Kolizje:</b> ${G.damage}/3 · <b>Pasażerowie:</b> ${G.load}</div><div><b>Ostatnie:</b></div>` + G.log.slice(-6).reverse().map(l => `<div class="${l.p < 0 ? 'neg' : 'pos'}">${l.p > 0 ? '+' : ''}${l.p} ${l.txt}</div>`).join('')
        : `<div>W/→ gaz · S/← hamulec · X/Spacja – awaryjny</div><div>Q/A kierunkowskaz lewy/prawy · E drzwi · D dzwonek/klakson · R rampa</div><div>Tramwaj: Z zwrotnica (na skrzyżowaniu: Q/A + Z) · F piasecznica</div><div>Autobus: C przyklęk · ↑/↓ zmiana pasa</div><div>Przystanek zaliczony, dopóki ≤30% pojazdu minęło znak</div><div>O ogłoszenia z bazy · V potwierdź komunikat · F1 RTT · F2 PRTT (pilne) · F4 wezwanie alarmowe CA</div><div>M wycisz · mysz: prawa połowa gaz, lewa hamulec</div><div>Sygnalizacja tramwajowa: — stój, | jedź</div>`;
      return `<div class="list" style="grid-area:1/1/5/5">${info}</div>` + c('◀ Wróć', G.trip && !G.ended ? 'trip' : (G.driver ? 'menu' : 'off'), '', '5/1/6/5');
    }
    if (s === 'scores') {
      const rows = boardGet().slice(0, 10).map((r, i) => `<div>${i + 1}. <b>${r.n}</b> · ${r.line}${r.kurs ? '/' + pad(r.kurs) : ''} · <b>${r.score} pkt</b></div>`).join('');
      return `<div class="list" style="grid-area:1/1/5/5"><div><b>🏆 Tabela wyników</b></div>${rows || '<div>Brak wyników</div>'}</div>` + c('◀ Menu', G.driver ? 'menu' : 'off', '', '5/1/6/5');
    }
    if (s === 'summary') {
      const st = G.stats, avg = st.prec.length ? (st.prec.reduce((a, b) => a + b, 0) / st.prec.length).toFixed(1) : '—';
      return `<div class="list" style="grid-area:1/1/5/5"><div class="dest2">${G.endReason}</div><div><b>${G.kid && !G.demo ? '🧸 Brawo! Tryb dla dzieci – bez punktów' : `Wynik: ${G.score} pkt`}</b></div><div>Przystanki: ${st.stops} · pominięte: ${st.missed}</div><div>Średnia precyzja: ${avg} m · punktualne odjazdy: ${st.punctual}</div><div>Kolizje: ${st.collisions}</div>${st.ev ? `<div>Zadania dyspozytora: ${st.evOk}/${st.ev}</div>` : ''}${G.lastBoard && !G.demo && !G.kid ? `<div>🏆 Zapisano w tabeli: <b>${G.lastBoard.n}</b> – miejsce ${boardGet().findIndex(r => r.ts === G.lastBoard.ts) + 1}</div>` : ''}</div>` +
        (this.canReturn() ? c('↩ Kurs powrotny', 'ret', 'hi', '5/1/6/3') + c('Nowy kurs', 'linekurs', '', '5/3/6/4') + c('Menu', 'menu', '', '5/4/6/5')
          : c('Nowy kurs', 'linekurs', 'hi', '5/1/6/3') + c('Menu', 'menu', '', '5/3/6/5'));
    }
    return '';
  },
  canReturn() { const t = G.trip; return !!(t && !t.training && !t.office && LINES[t.line] && LINES[t.line].dirs.length > 1); },
  openRoute(line) { this.lineIn = line; if (this.dirSel === undefined || this.routeLine !== line) this.dirSel = 0; this.routeLine = line; return this.setPanel('route'); },
  tick(force) {
    const ck = this.el('pclock'); if (ck) ck.textContent = fmtHMS(G.trip ? G.simTime : nowSec());
    const tb = this.el('ptrip'); if (!tb) return;
    if (!G.trip) { tb.className = 'pt tripbox'; tb.innerHTML = '<div class="tl">—</div><div class="ts">brak kursu</div>'; return; }
    const d = delayNow(), cls = G.trip.training ? 'on' : d > 120 ? 'late' : d < -30 ? 'early' : 'on';
    tb.className = 'pt tripbox ' + cls;
    const pct = clamp(50 + d / 6, 0, 100);
    tb.innerHTML = `<div class="tl">${G.trip.line}/${pad(G.trip.kurs)}</div><div class="bar"><i style="left:${pct}%"></i></div><div class="ts">${G.trip.training ? 'trening' : fmtDelay(d)}</div>`;
  },
  pickModel(k) {
    const m = MODELS[k], t = G.trip;
    if (t && G.running && !G.ended) return this.toast('Zmiana pojazdu możliwa dopiero po zakończeniu kursu');
    if (t && !G.ended && !t.training && m.mode !== t.mode) return this.toast(`Linia ${t.line} obsługiwana: ${KIND[t.mode]}`);
    if (G.demo) { G.demo = false; G.demoPrev = null; }
    setModel(k);
    if (t && !G.ended) { if (t.training) loadTraining(m.mode); else loadTrip(t); }
    else { G.mode = m.mode; loadIdle(); }
    this.toast(m.name + ' – ' + m.info);
    return this.render();
  },
  act(a) {
    AU.init();
    if (a.startsWith('k:')) return this.key(a.slice(2));
    if (a.startsWith('fk:')) return fkey(a.slice(3));
    if (a.startsWith('l:')) { this.dirSel = undefined; return this.openRoute(a.slice(2)); }
    if (a.startsWith('d:')) { this.dirSel = +a.slice(2); return this.render(); }
    if (a.startsWith('f:')) { this.field = a.slice(2); return this.render(); }
    if (a.startsWith('lt:')) { this.lineTab = a.slice(3); return this.render(); }
    if (a.startsWith('vt:')) { this.vehTab = a.slice(3); return this.render(); }
    if (a.startsWith('vm:')) return this.pickModel(a.slice(3));
    if (a.startsWith('sp:')) { EV.spk = a.slice(3); return this.render(); }
    if (a.startsWith('an:')) { playAnn(+a.slice(3)); return this.setPanel(G.trip && !G.ended ? 'trip' : 'menu'); }
    if (a.startsWith('demo:')) { startDemo(a.slice(5)); return this.toast('Pokaz jazdy – obserwuj klawisze na ekranie'); }
    if (a.startsWith('tr:')) { loadTraining(a.slice(3)); this.state = 'trip'; this.render(); return this.toast('Misja treningowa – naciśnij ▶'); }
    switch (a) {
      case 'login': case 'chdrv': this.input = ''; if (G.running) { G.paused = true; } return this.setPanel('login');
      case 'logout': if (G.trip && !G.ended && G.running) endTrip('Kurs przerwany – wylogowanie.'); G.driver = null; loadIdle(); return this.setPanel('off');
      case 'menu': return this.setPanel(G.driver ? 'menu' : 'off');
      case 'startmenu': {
        if (G.trip && !G.ended && G.running && !G.trip.training && !G.demo) G.log.push({ p: 0, txt: 'Kurs przerwany – menu główne', t: G.simTime });
        if (G.trip && !G.ended && G.running && !G.demo) { G.endReason = 'Kurs przerwany – menu główne'; boardAdd(); }
        G.msgs = []; G.unread = 0;
        loadIdle(); G.attract = true; document.getElementById('start').classList.remove('hide'); if (this.plUpd) this.plUpd();
        return this.setPanel(G.driver ? 'menu' : 'off');
      }
      case 'linekurs': if (!G.driver) return this.setPanel('login'); this.lineIn = ''; this.kursIn = ''; this.field = 'line'; this.dirSel = undefined; return this.setPanel('linekurs');
      case 'route': return this.openRoute(this.lineIn.toUpperCase());
      case 'rback': this.lineIn = ''; this.field = 'line'; this.dirSel = undefined; return this.setPanel('linekurs');
      case 'rnext': this.kursIn = ''; this.field = 'kurs'; return this.setPanel('linekurs');
      case 'ret': {
        if (!this.canReturn()) return;
        const t = G.trip, nt = makeTrip(t.line, t.kurs, 1 - t.dirIdx, G.simTime / 60 + 3);
        loadTrip(nt); this.toast(`Kurs powrotny ${t.line}/${pad(t.kurs)} → ${nt.head}, odjazd ${fmtT(nt.dep * 60)}`); return this.setPanel('trip');
      }
      case 'office': if (!isSpecial()) { this.toast('Kurs 1/11 – tylko kierowca specjalny (nr 10)'); return; } this.dirSel = undefined; this.lineIn = '1'; this.kursIn = '11'; this.field = 'kurs'; return this.key('↵');
      case 'train': if (!G.driver) return this.setPanel('login'); return this.setPanel('train');
      case 'trip': return this.setPanel('trip');
      case 'abort': endTrip('Kurs przerwany przez kierowcę.'); return;
      case 'scores': return this.setPanel('scores');
      case 'msgs': return this.setPanel('msgs');
      case 'ann': if (!G.trip || G.ended) return this.toast('Ogłoszenia z bazy – tylko w trakcie kursu'); return this.setPanel(this.state === 'ann' ? 'trip' : 'ann');
      case 'info': return this.setPanel('info');
      case 'help': return this.setPanel('help');
      case 'home': return this.setPanel(G.driver ? 'menu' : 'off');
      case 'eye': G.minimap = !G.minimap; this.el('minimap').style.display = G.minimap ? '' : 'none'; return this.render();
      case 'voice': G.voice = !G.voice; return this.render();
      case 'mute': AU.setMute(!AU.muted); return this.render();
      case 'veh': this.vehTab = G.trip && !G.ended && !G.trip.training ? G.trip.mode : G.mode; this.vehBack = this.state === 'veh' ? this.vehBack : this.state; return this.setPanel('veh');
      case 'play':
        if (!G.trip) return this.toast(G.driver ? 'Najpierw wybierz linię i kurs' : 'Najpierw zaloguj się');
        if (G.ended) return this.toast('Kurs zakończony – wybierz nowy');
        if (!G.running) { G.running = true; G.paused = false; const s = curStop(); if (s) annStop((G.trip.office && G.ns === 0 ? 'Zjazd spod biurowca. ' : '') + 'Następny przystanek: ' + s.name); this.setPanel('trip'); return; }
        G.paused = !G.paused; return this.render();
      case 'up': case 'down': {
        const t = G.trip, n = lineData(t).dirs[t.dirIdx].stops.length;
        t.start = clamp(t.start + (a === 'up' ? 1 : -1), 0, n - 2); loadTrip(t); return this.render();
      }
      case 'doors': return ACT.doors();
      case 'bell': return ACT.bell();
      case 'ramp': return ACT.ramp();
      case 'indL': ACT.ind(1); return this.render();
      case 'indR': ACT.ind(-1); return this.render();
      case 'sw': return ACT.sw();
      case 'sand': ACT.sand(); return this.render();
      case 'kneel': ACT.kneel(); return this.render();
      case 'ln:1': return ACT.lane(1);
      case 'ln:-1': return ACT.lane(-1);
    }
  },
  key(k) {
    if (this.state === 'ann') {
      if (/^\d$/.test(k)) { playAnn((+k + 9) % 10); return this.setPanel(G.trip && !G.ended ? 'trip' : 'menu'); }
      if (k === '←') return this.act('trip');
      return;
    }
    if (this.state === 'route') {
      if (k === '1' || k === '2') { const n = LINES[this.lineIn] ? LINES[this.lineIn].dirs.length : 1; this.dirSel = Math.min(+k - 1, n - 1); return this.render(); }
      if (k === '↵') return this.act('rnext');
      if (k === '←') return this.act('rback');
      return;
    }
    if (this.state === 'login') {
      if (k === '←') this.input = this.input.slice(0, -1);
      else if (k === '↵') {
        const n = DRIVERS[this.input]; if (!n) { this.toast('Nieznany numer służbowy'); this.input = ''; return this.render(); }
        const prev = G.driver; G.driver = { id: this.input, name: n }; AU.chime();
        if (prev && G.trip && !G.ended) { G.paused = false; this.toast('Zmiana kierowcy: ' + n); return this.setPanel('trip'); }
        this.toast('Zalogowano: ' + n); return this.setPanel('menu');
      } else if (/^\d$/.test(k) && this.input.length < 4) this.input += k;
      return this.render();
    }
    if (this.state === 'linekurs') {
      const f = this.field === 'line' ? 'lineIn' : 'kursIn';
      if (k === '←') { if (!this[f] && f === 'kursIn') this.field = 'line'; else this[f] = this[f].slice(0, -1); }
      else if (k === '↵') {
        if (this.field === 'line' && this.lineIn) { if (!LINES[this.lineIn.toUpperCase()]) { this.toast('Brak linii ' + this.lineIn + ' w rozkładzie'); return this.render(); } this.dirSel = undefined; return this.openRoute(this.lineIn.toUpperCase()); }
        const line = this.lineIn.toUpperCase(), kurs = parseInt(this.kursIn || '1', 10);
        if (!LINES[line]) { this.toast('Brak linii ' + line + ' w rozkładzie'); return this.render(); }
        if (!(kurs >= 1 && kurs <= 30)) { this.toast('Kurs 1–30'); return this.render(); }
        loadTrip(makeTrip(line, kurs, this.dirSel));
        this.toast(G.trip.office ? 'Kurs 1/11 – autobus, start spod biurowca' : `Linia ${line}/${pad(kurs)} → ${G.trip.head}, odjazd ${fmtT(G.trip.dep * 60)}`);
        return this.setPanel('trip');
      } else if (/^[0-9A-Z]$/i.test(k) && this[f].length < 3) { if (f === 'kursIn' && !/\d/.test(k)) return; this[f] += k.toUpperCase(); }
      return this.render();
    }
  }
};
function delayNow() {
  const s = curStop(); if (!s || !isFinite(s.sched)) return G.lastDelay;
  if (s.arrived) return G.simTime - s.sched > 0 ? G.simTime - s.sched : Math.min(0, G.simTime - s.sched);
  return Math.max(G.lastDelay, G.simTime - s.sched);
}

// ===== LED i podpowiedzi =====
function updateLeds() {
  const t = G.trip, v = G.veh, s = curStop();
  const top = UI.el('ledtop'), bot = UI.el('ledbot');
  let a = '', b = '';
  if (!t) { a = `<span class="lt">STiA</span><span class="mq">SYMULATOR TRAMWAJÓW I AUTOBUSÓW · ${G.driver ? 'Wybierz linię i kurs' : 'Zaloguj się w panelu kierowcy'}</span>`; }
  else {
    const next = G.toDepot ? 'ZJAZD DO ZAJEZDNI' : s ? (s.arrived ? 'Przystanek: ' + s.name : 'Następny: ' + s.name) : '';
    a = `<span class="lt">${t.line}</span><span class="hd">→ ${t.training ? 'TRENING' : t.head}</span><span class="mq">${G.ended ? 'KONIEC KURSU' : next}</span>`;
  }
  a += `<span class="ck">${WXK[WX.kind].ico} ${WX.temp}°C · ${fmtT(t ? G.simTime : nowSec())}</span>`;
  const kmh = v ? Math.round(v.v * 3.6) : 0, dist = s && v ? Math.round(s.x - v.x) : null;
  const dtxt = G.toDepot && !G.ended && G.world.depot ? Math.max(0, Math.round(depotStopX() - v.x)) + ' m do STOP w hali' : dist !== null && t && !G.ended ? (dist > 0 ? dist + ' m do przystanku' : 'PRZY PRZYSTANKU') : '—';
  b = `<span class="sp ${kmh > 50 ? 'red' : ''}">${String(kmh).padStart(2, ' ')} km/h</span><span>${dtxt}</span>` +
    `<span>${VEH[G.mode].short || ''}</span><span>${t ? (G.mode === 'bus' ? (v.lane ? 'PAS LEWY' : 'PAS PRAWY') : 'KIER.') + (v.ind ? ((G.clock * 3 | 0) % 2 ? (v.ind > 0 ? ' ◀' : ' ▶') : ' ·') : '') : ''}</span><span>${G.kid && !G.demo ? '🧸' : 'PKT ' + G.score}</span><span>👥 ${G.load}</span>`;
  if (top._h !== a) { top.innerHTML = a; top._h = a; } if (bot._h !== b) { bot.innerHTML = b; bot._h = b; }
}
function hints() {
  // H2: polecenia klawiszy (#tasks, u góry); UI.info: informacje (ramki pod sygnalizatorem, sigZoom)
  const H2 = [], I = UI.info = [], v = G.veh, w = G.world, s = curStop(), V = VEH[G.mode];
  const add = (t, u) => H2.push(`<div class="${u ? 'urg' : ''}">${t}</div>`);
  const info = (c, t, l, sm) => { if (!I.some(o => o.t === t && o.l === l)) I.push({ c, t, l, sm }); };
  const dm = x => Math.max(0, Math.round(x - v.x)) + ' m', horn = G.mode === 'tram' ? 'dzwonek' : 'klakson';
  if (!G.driver) add('Zaloguj się w panelu kierowcy (np. 1001)');
  else if (!G.trip) add('Menu → Linia / Kurs (np. 2/01, A/01; 1/11 – kierowca 10) lub Misja treningowa');
  else if (G.ended) add('Kurs zakończony – zobacz podsumowanie w panelu');
  else if (!G.running) add('Naciśnij ▶ w panelu, aby rozpocząć kurs');
  if (!G.trip || !G.running || G.ended) return H2.join('');
  if (w.tips && w.tips[G.ns]) add('🎓 ' + w.tips[G.ns]);
  evHints(add, info);
  if (G.toDepot && w.depot) info('Y', 'ZJAZD DO ZAJEZDNI · ' + dm(depotStopX()), w.depot.name, 'brama max 10 km/h · stań na linii STOP w hali');
  if (G.td && G.td.kind === 'turn' && !G.td.out && G.td.straight) info('R', 'OMINIĘTY SKRĘT', 'JEDZIESZ PROSTO', 'skręć na następnym skrzyżowaniu (objazd)');
  else if (G.td && G.td.kind === 'turn' && !G.td.out) info('Y', 'SKRĘT', 'MAX 20 km/h', 'ustąp pieszemu na przejściu za zakrętem');
  if (w.loopA && G.ns === 0 && v.x < w.loopA.x - 25) info('', '🔁 PĘTLA ' + w.loopA.name, 'WYJAZD Z PĘTLI', 'podjedź pod przystanek początkowy');
  if (s && v.doors >= 0.99 && s.q) {
    const wait = s.people.filter(p => p.st === 'wait');
    if (s.q.wheelOff && v.ramp < 0.99) add('Pasażer na wózku chce wysiąść – rozłóż rampę (R)', 1);
    if (wait.some(p => p.kind === 'wheel') && v.ramp < 0.99 && !s.q.alight) { if (V.low) add('Osoba na wózku – rozłóż rampę (R)', 1); else info('Y', 'WÓZEK', 'BRAK RAMPY', V.short + ' jest wysokopodłogowy'); }
    if (wait.some(p => p.kind === 'old') && G.mode === 'bus' && v.kneel < 0.99) add('Senior – przyklęknij autobus (C)', 1);
    if (!s.q.done) info('', 'PRZYSTANEK', 'WYMIANA PASAŻERÓW…'); else if (v.ramp > 0) add('Schowaj rampę (R)', 1); else add('Zamknij drzwi (E)');
  }
  if (v.kneel > 0 && v.doors === 0) add('Podnieś autobus (C)', 1);
  if (v.needInd && !v.ind) add('Włącz lewy kierunkowskaz (Q) przed odjazdem');
  if (G.wheel) info('', '♿ PASAŻER NA WÓZKU', 'WYSIADA: ' + (w.stops[G.wheel.at] || {}).name);
  for (const j of w.junctions) if (j.x - v.x > -2 && j.x - v.x < AHEAD && j.cars.some(c => c.bad && !c.halt && !c.passedBad && !c.ghost)) { info('R', '⚠ WYMUSZENIE · ' + dm(j.x), 'AUTO Z POPRZECZNEJ', 'hamuj'); add('Ostrzeż kierowcę: ' + horn + ' (D)', 1); }
  for (const sw of w.switches) if (sw.ok && !sw.cdone && sw.x - v.x < AHEAD && v.x - V.len < sw.x + CURVE_LEN && v.v > CURVE_V) info('R', 'ŁUK ZA ZWROTNICĄ · ' + dm(sw.x), 'ZWOLNIJ', 'max 20 km/h');
  for (const sw of w.switches) if (!sw.ok && !sw.passed && sw.x - v.x < AHEAD && sw.x - v.x > -1) { if (G.driverOut) info('Y', 'ZWROTNICA', 'MOTORNICZY PRZESTAWIA…'); else add('Stań przed zwrotnicą (do 30 m) i przestaw ją (Z)', 1); }
  if (w.leaves.some(l => l.x0 - v.x < AHEAD && v.x - V.len < l.x1)) { info('Y', G.mode === 'tram' ? '🍂 ŚLISKIE SZYNY' : '🍂 ŚLISKA JEZDNIA', 'HAMUJ WCZEŚNIEJ'); if (G.mode === 'tram') add('Piasecznica (F)'); }
  if (wxGrip() < 0.85) info('', WXK[WX.kind].ico + ' ' + WXK[WX.kind].n.toUpperCase(), 'DŁUŻSZA DROGA HAMOWANIA');
  for (const b of w.blockers) if (!b.gone && b.x - v.x < AHEAD && b.x - v.x > -2) { if (b.leave > 0) info('Y', 'AUTO NA TOROWISKU', 'ODJEŻDŻA…'); else { info('R', 'AUTO NA TOROWISKU · ' + dm(b.x), 'STÓJ'); add('Zatrzymaj się i zadzwoń (D)', 1); } }
  for (const c of w.crossings) if (c.ped && c.ped.st !== 'gone' && c.x - v.x < AHEAD && c.x - (v.x - V.len) > 0) { info('Y', '🚶 PRZEJŚCIE · ' + dm(c.x), 'PIESZY – ZWOLNIJ'); add('Ostrzeż pieszego: ' + horn + ' (D)'); }
  if (G.mode === 'bus') {
    for (const k of w.works) if (k.x0 - v.x < AHEAD && k.x1 - (v.x - V.len) > 0 && v.lane === 0) add('Roboty: lewy kierunkowskaz (Q) i zmiana pasa (↑)', 1);
    if (v.lane === 1 && s && s.x - v.x < 140 && !w.works.some(k => k.x1 > v.x - V.len && k.x0 < s.x) && !w.turns.some(t => t.dir > 0 && !t.passed && t.x > v.x && t.x < s.x)) add('Prawy kierunkowskaz (A) i powrót na prawy pas (↓) przed przystankiem', 1);
    const bl = w.cars.find(c => c.lane === 1 && c.x < v.x && c.x > v.x - V.len - 35);
    if (bl && v.lane === 0) info('R', 'LEWY PAS ZAJĘTY', 'AUTO OBOK / ZA TOBĄ');
  }
  for (const t of w.turns) {
    const d = t.x - v.x, txt = t.dir > 0 ? 'w lewo' : 'w prawo';
    if (!t.passed && d < AHEAD && d > -1) {
      if (t.detour) info('R', 'OBJAZD · ' + dm(t.x), 'SKRĘĆ ' + txt.toUpperCase(), 'powrót na trasę');
      if (v.ind !== t.dir) add(`Włącz ${t.dir > 0 ? 'lewy (Q)' : 'prawy (A)'} kierunkowskaz`, 1);
      if (G.mode === 'bus' && v.lane !== (t.dir > 0 ? 1 : 0)) add(t.dir > 0 ? 'Zjedź na lewy pas (↑) – inaczej pojedziesz prosto (objazd)' : 'Zjedź na prawy pas (↓) – inaczej pojedziesz prosto (objazd)', 1);
      if (G.mode === 'tram' && t.set !== t.dir) add('Przestaw zwrotnicę (Z) ' + txt + ' – najpierw kierunkowskaz', 1);
      if (v.v > TURN_V + 0.4) info('R', 'SKRĘT · ' + dm(t.x), 'ZWOLNIJ DO 20 km/h');
    } else if (t.passed && !t.cut && !t.straight && v.v > TURN_V + 0.4) info('R', 'SKRĘT', 'MAX 20 km/h!');
  }
  for (const r of w.rounds) {
    const P = RB[G.mode];
    if (r.x - v.x < AHEAD && v.x - V.len < r.x + P.rx) {
      if (G.mode === 'bus') { info(r.entered ? '' : 'Y', '⭕ RONDO', 'USTĄP AUTOM NA RONDZIE', 'prawy pas · max 30 km/h'); if (v.lane === 1 && v.x < r.x + P.irx) add('Zjedź na prawy pas (↓) – lewy kończy się na wyspie!', 1); }
      else info(r.entered ? '' : 'Y', '⭕ RONDO', 'PRZEJAZD PRZEZ WYSPĘ', 'uważaj na auta przy torach');
    }
  }
  if (s && !s.arrived && v.x > s.x + 0.5) { info('Y', 'MINĄŁEŚ ZNAK O ' + Math.round(v.x - s.x) + ' m', s.name, 'limit ' + Math.round(V.len * 0.3) + ' m'); add('Możesz jeszcze otworzyć drzwi (E)', 1); }
  if (v.v > LIMIT + 0.6) info('R', 'PRĘDKOŚĆ', 'ZWOLNIJ!', 'limit 50 km/h');
  if (s && !s.arrived && s.x - v.x < 130 && v.x <= s.x + 0.5) info('G', '🚏 PRZYSTANEK · ' + dm(s.x), s.name);
  if (G.load && v.lock > 0) info('R', 'KOLIZJA!', G.damage + '/3');
  return H2.join('');
}

// ===== Powiększenie sygnalizatora i zwrotnicy =====
// zasięg komunikatów o przeszkodach, światłach, zwrotnicach i skrętach (m)
const AHEAD = 40;
function sigSvg(sg, st, tram) {
  if (tram) {
    const bar = st === 'G' ? (sg.turn > 0 ? '<line x1="13" y1="12" x2="35" y2="38"/>' : sg.turn < 0 ? '<line x1="35" y1="12" x2="13" y2="38"/>' : '<line x1="24" y1="9" x2="24" y2="41"/>') : '<line x1="9" y1="25" x2="39" y2="25"/>';
    return `<svg viewBox="0 0 48 74" class="zs"><rect x="2" y="2" width="44" height="70" rx="7" fill="#111" stroke="#555" stroke-width="2"/><g stroke="#eef8ff" stroke-width="6" stroke-linecap="round" filter="url(#glw)">${bar}</g>` +
      `<circle cx="24" cy="58" r="6" fill="${st === 'Y' ? '#ffcf3a' : '#2a2a2a'}"/></svg>`;
  }
  const L = (y, c, on, off) => `<circle cx="20" cy="${y}" r="10" fill="${on ? c : off}" ${on ? 'filter="url(#glw)"' : ''}/>`;
  let h = `<svg viewBox="0 0 ${sg.turn ? 72 : 40} 82" class="zs"><rect x="2" y="2" width="36" height="78" rx="6" fill="#111" stroke="#555" stroke-width="2"/>` + L(17, '#ff3b30', st === 'R', '#3a1010') + L(41, '#ffb000', st === 'Y', '#3a2e10') + L(65, '#33ff6a', st === 'G', '#103a1c');
  if (sg.turn) h += `<rect x="42" y="50" width="28" height="28" rx="5" fill="#111" stroke="#555" stroke-width="2"/><text x="56" y="72" font-size="22" text-anchor="middle" fill="${st === 'G' ? '#33ff6a' : '#1c4a26'}" font-weight="900">${sg.turn > 0 ? '↰' : '↱'}</text>`;
  return h + '</svg>';
}
function swSvg(set, need) {
  const P = { 0: 'M24 70 L24 4', 1: 'M24 70 C24 40 10 30 6 4', '-1': 'M24 70 C24 40 38 30 42 4' };
  let h = '<svg viewBox="0 0 48 74" class="zs">';
  for (const k of [0, 1, -1]) if (k === need || k === 0) h += `<path d="${P[k]}" stroke="#4b535c" stroke-width="7" fill="none"/>`;
  h += `<path d="${P[set]}" stroke="${set === need ? '#33ff6a' : '#ff3b30'}" stroke-width="5" fill="none" filter="url(#glw)"/>`;
  return h + '</svg>';
}
function sigZoom() {
  const el = UI.el('sigzoom'); if (!el) return;
  const v = G.veh, w = G.world;
  let out = '';
  if (G.trip && w && v && G.running && !G.ended) {
    const tram = G.mode === 'tram', box = (cls, t, svg, lab) => `<div class="zb ${cls}"><div class="zt">${t}</div><div class="zr">${svg}<div class="zl">${lab}</div></div></div>`;
    const sg = w.signals.filter(s => !s.passed && s.x - v.x > -1 && s.x - v.x < AHEAD).sort((a, b) => a.x - b.x)[0];
    if (sg) {
      const st = sigState(sg), d = Math.max(0, Math.round(sg.x - v.x));
      const dir = sg.turn > 0 ? ' – SKRĘT W LEWO' : sg.turn < 0 ? ' – SKRĘT W PRAWO' : '';
      let lab = st === 'G' ? 'JEDŹ' + dir : st === 'Y' ? 'UWAGA<small>stój, jeśli możesz bezpiecznie</small>' : 'STÓJ<small>' + (sg.forced ? 'zatrzymaj się przed linią – zmiana po postoju' : 'czekaj przed linią zatrzymania') + '</small>';
      if (tram && st === 'G') lab += '<small>' + (sg.turn ? 'skośna kreska = jazda w skręt' : 'pionowa kreska = jazda prosto') + '</small>';
      else if (tram && st === 'R') lab += '<small>pozioma kreska = stój</small>';
      out += box(st, (tram ? 'SYGNALIZATOR TRAMWAJOWY' : 'SYGNALIZACJA') + ' · ' + d + ' m', sigSvg(sg, st, tram), lab);
    }
    const wk = !tram && w.works.find(k => k.x0 - v.x > -1 && k.x0 - v.x < AHEAD);
    if (wk) out += box(v.lane ? 'G' : 'Y', 'ROBOTY DROGOWE · ' + Math.round(wk.x0 - v.x) + ' m', '<svg viewBox="0 0 48 44" class="zs"><path d="M24 3 L46 41 L2 41 Z" fill="#c81e1e"/><path d="M24 10 L40 37 L8 37 Z" fill="#f6c818"/><g fill="#111"><circle cx="22" cy="20" r="2.5"/><path d="M20 24 h5 l3 8 h-3 l-2-5 -3 5 h-3 z"/><path d="M28 27 l6 6 h-3 z"/></g></svg>',
      (v.lane ? 'OMIJAJ Z LEWEJ ✔' : 'PRAWY PAS ZAMKNIĘTY') + '<small>max 30 km/h · Q + ↑ na lewy pas, za robotami A + ↓</small>');
    const t = w.turns.find(t => !t.passed && t.x - v.x > -1 && t.x - v.x < AHEAD);
    if (tram) {
      const sw = w.switches.find(s => !s.passed && s.x - v.x > -1 && s.x - v.x < AHEAD);
      if (t) {
        const ok = t.set === t.dir, txt = t.dir > 0 ? 'W LEWO ↰' : 'W PRAWO ↱';
        out += box(ok ? 'G' : 'R', 'ZWROTNICA · ' + Math.round(t.x - v.x) + ' m', swSvg(t.set || 0, t.dir),
          ok ? 'USTAWIONA ' + txt : 'TRASA ' + txt + '<small>ustawiona: ' + (t.set > 0 ? 'w lewo' : t.set < 0 ? 'w prawo' : 'prosto') + ' · wciśnij ' + (t.dir > 0 ? 'Q' : 'A') + ' + Z (≤ 20 km/h)</small>');
      } else if (sw) {
        out += box(sw.ok ? 'G' : 'R', 'ZWROTNICA · ' + Math.round(sw.x - v.x) + ' m', swSvg(sw.ok ? -1 : 0, -1),
          sw.ok ? 'USTAWIONA W ŁUK<small>max 20 km/h</small>' : 'ŹLE USTAWIONA<small>zatrzymaj się do 30 m przed nią i wciśnij Z</small>');
      }
    } else if (t) {
      const need = t.dir > 0 ? 1 : 0, ok = v.lane === need && v.ind === t.dir;
      out += box(ok ? 'G' : 'Y', 'SKRĘT · ' + Math.round(t.x - v.x) + ' m', `<div class="zarr">${t.dir > 0 ? '↰' : '↱'}</div>`,
        (t.dir > 0 ? 'W LEWO' : 'W PRAWO') + `<small>pas: ${v.lane === need ? '✔' : '✖'} ${need ? 'lewy (↑)' : 'prawy (↓)'} · kierunkowskaz: ${v.ind === t.dir ? '✔' : '✖'} ${t.dir > 0 ? 'Q' : 'A'} · max 20 km/h</small>`);
    }
    const rk = { R: 0, Y: 1, G: 3 }, inf = (UI.info || []).slice().sort((a, b) => (rk[a.c] ?? 2) - (rk[b.c] ?? 2)).slice(0, 4);
    for (const o of inf) out += `<div class="zb zi ${o.c}"><div class="zt">${o.t}</div><div class="zl">${o.l}${o.sm ? '<small>' + o.sm + '</small>' : ''}</div></div>`;
  }
  if (el._h !== out) { el.innerHTML = out; el._h = out; el.classList.toggle('on', !!out); }
}

// ===== Minimapa =====
const mm = document.getElementById('minimap'), mctx = mm.getContext('2d');
function drawMinimapBg(mctx, S, P, bk) {
  mctx.fillStyle = 'rgba(15,22,34,0.88)'; mctx.fillRect(0, 0, S, S);
  mctx.strokeStyle = 'rgba(120,170,220,0.6)'; mctx.lineWidth = 4; mctx.beginPath();
  [[51.1185, 16.98], [51.113, 17.01], [51.114, 17.035], [51.111, 17.06], [51.105, 17.09]].forEach((p, i) => { const q = P(p[0], p[1]); i ? mctx.lineTo(q[0], q[1]) : mctx.moveTo(q[0], q[1]); }); mctx.stroke();
  mctx.lineWidth = 1;
  for (const [ln, L] of Object.entries(LINES)) {
    const cur = bk === ln;
    if (cur || L.type === 'tour') continue;
    mctx.strokeStyle = L.type === 'tram' ? 'rgba(220,80,80,0.35)' : 'rgba(80,140,230,0.35)'; mctx.beginPath();
    L.dirs[0].shape.forEach((p, i) => { const q = P(p[0], p[1]); i ? mctx.lineTo(q[0], q[1]) : mctx.moveTo(q[0], q[1]); }); mctx.stroke();
  }
}
function drawMinimap() {
  const S = 240, k = Math.cos(51.11 * Math.PI / 180), cx = 17.035, cy = 51.11, sc = 1500;
  const P = (la, lo) => [S / 2 + (lo - cx) * k * sc, S / 2 - (la - cy) * sc];
  const bk = G.trip && !G.trip.training ? (G.trip.src || G.trip.line) : '';
  if (!drawMinimap.bg || drawMinimap.key !== bk) {
    const b = document.createElement('canvas'); b.width = b.height = S; drawMinimap.bg = b; drawMinimap.key = bk; drawMinimapBg(b.getContext('2d'), S, P, bk);
  }
  mctx.clearRect(0, 0, S, S); mctx.drawImage(drawMinimap.bg, 0, 0);
  const r = P(RYNEK[0], RYNEK[1]); mctx.fillStyle = '#ffd24a'; mctx.font = '10px Arial'; mctx.fillText('★ Rynek', r[0] - 4, r[1] + 4);
  if (G.trip && !G.trip.training) {
    const D = lineData(G.trip).dirs[G.trip.dirIdx];
    mctx.strokeStyle = '#ffb000'; mctx.lineWidth = 2.5; mctx.beginPath(); D.shape.forEach((p, i) => { const q = P(p[0], p[1]); i ? mctx.lineTo(q[0], q[1]) : mctx.moveTo(q[0], q[1]); }); mctx.stroke(); mctx.lineWidth = 1;
    const w = G.world, v = G.veh; let i = w.stops.findIndex(s => s.x > v.x); if (i < 0) i = w.stops.length - 1;
    const a = w.stops[Math.max(0, i - 1)], b = w.stops[i], f = b.x === a.x ? 0 : clamp((v.x - a.x) / (b.x - a.x), 0, 1);
    const q = P(a.lat + (b.lat - a.lat) * f, a.lon + (b.lon - a.lon) * f);
    if (w.officeX !== null) { const e = P(w.stops[0].lat, w.stops[0].lon); mctx.fillStyle = '#2b2a6b'; mctx.fillRect(e[0] - 5, e[1] - 5, 10, 10); mctx.fillStyle = '#f2c318'; mctx.fillText('biurowiec', e[0] + 7, e[1] + 4); }
    mctx.fillStyle = (G.clock * 3 | 0) % 2 ? '#fff' : '#ffb000'; mctx.beginPath(); mctx.arc(q[0], q[1], 4.5, 0, 7); mctx.fill();
    mctx.fillStyle = '#fff'; mctx.fillText(G.trip.line + ' → ' + G.trip.head, 6, S - 8);
  } else if (G.trip) { mctx.fillStyle = '#fff'; mctx.fillText('Plac manewrowy – trening', 6, S - 8); }
  else { mctx.fillStyle = '#aaa'; mctx.fillText('Wrocław – sieć linii', 6, S - 8); }
}

// ===== Wejście =====
const KEYMAP = { ArrowRight: 'up', KeyW: 'up', ArrowLeft: 'down', KeyS: 'down', Space: 'space', KeyX: 'space', KeyF: 'sand', KeyP: 'sand' };
addEventListener('keydown', e => {
  AU.init();
  if (/^F[1-4]$/.test(e.code)) e.preventDefault();
  if (G.demo && G.running && !G.ended && document.getElementById('start').classList.contains('hide') && !['Escape', 'KeyM', 'KeyG'].includes(e.code)) { if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); return; }
  if (UI.state === 'login' || UI.state === 'linekurs' || UI.state === 'route' || UI.state === 'ann') {
    if (/^Digit|^Numpad\d/.test(e.code)) { UI.key(e.key); e.preventDefault(); return; }
    if (e.key === 'Backspace') { UI.key('←'); e.preventDefault(); return; }
    if (e.key === 'Enter') { UI.key('↵'); e.preventDefault(); return; }
    if (UI.state === 'linekurs' && /^[a-z]$/i.test(e.key)) { UI.key(e.key); return; }
  }
  if (KEYMAP[e.code]) { G.keys[KEYMAP[e.code]] = true; e.preventDefault(); }
  if (e.repeat) return;
  if (e.code === 'KeyG') { toggleFS(); return; }
  if (!document.getElementById('start').classList.contains('hide')) { const c = { Digit1: 'tram', Digit2: 'bus', Digit3: 'tr-tram', Digit4: 'tr-bus', Digit5: 'demo-tram', Digit6: 'demo-bus' }[e.code]; if (c) { const b = document.querySelector(`#start [data-m="${c}"]`); if (b) b.click(); } return; }
  switch (e.code) {
    case 'KeyE': ACT.doors(); break; case 'KeyD': case 'KeyB': ACT.bell(); break; case 'KeyR': ACT.ramp(); break;
    case 'KeyZ': ACT.sw(); break; case 'KeyF': case 'KeyP': ACT.sand(); break; case 'KeyC': case 'KeyK': ACT.kneel(); break;
    case 'KeyO': if (UI.state === 'ann') { const o = ['int', 'ext', 'both']; EV.spk = o[(o.indexOf(EV.spk) + 1) % 3]; UI.render(); } else UI.act('ann'); break;
    case 'KeyV': evConfirm(); break;
    case 'F1': fkey('rtt'); break; case 'F2': fkey('prtt'); break; case 'F3': fkey('kas'); break; case 'F4': fkey('ca'); break;
    case 'KeyQ': ACT.ind(1); break; case 'KeyA': ACT.ind(-1); break; case 'KeyM': UI.act('mute'); break;
    case 'ArrowUp': ACT.lane(1); e.preventDefault(); break;
    case 'ArrowDown': ACT.lane(-1); e.preventDefault(); break;
    case 'Escape': UI.act('play'); break;
  }
});
addEventListener('keyup', e => { if (KEYMAP[e.code]) G.keys[KEYMAP[e.code]] = false; });
// pedały dotykowe: prawa połowa ekranu – gaz, lewa – hamulec; śledzimy jeden palec (pointerId), więc dotknięcie panelu drugim palcem nie puszcza gazu
let pedalId = null;
const pedalSide = e => e.clientX > innerWidth / 2 ? 1 : -1;
cv.addEventListener('pointerdown', e => { AU.init(); pedalId = e.pointerId; G.mouse = pedalSide(e); });
cv.addEventListener('pointermove', e => { if (e.pointerId === pedalId) G.mouse = pedalSide(e); });
const pedalUp = e => { if (pedalId === null || e.pointerId === pedalId) { pedalId = null; G.mouse = 0; } };
addEventListener('pointerup', pedalUp); addEventListener('pointercancel', pedalUp);
cv.addEventListener('contextmenu', e => e.preventDefault());
document.getElementById('panel').addEventListener('pointerdown', e => { const t = e.target.closest('[data-a]'); if (t) { e.preventDefault(); UI.act(t.dataset.a); } });
// ===== Ustawienia warunków (menu startowe) =====
(function () {
  const $ = id => document.getElementById(id), hr = $('envHour'), se = $('envSeason'), wx = $('envWx'), info = $('envInfo');
  if (!hr) return;
  hr.value = ENV.hour; se.value = ENV.season; wx.value = ENV.weather;
  const wxName = () => {
    if (ENV.weather === 'auto') return 'pogoda zmienna';
    if (ENV.weather !== 'live') return WXK[ENV.weather].n;
    if (LIVE.kind) return 'pogoda rzeczywista: ' + WXK[LIVE.kind].ico + ' ' + WXK[LIVE.kind].n + ' ' + LIVE.temp + '°C (Open-Meteo, ' + new Date(LIVE.at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) + ')';
    return LIVE.err ? 'pogoda rzeczywista – ' + LIVE.err + ', na razie zmienna' : 'pobieranie pogody…';
  };
  const show = () => { info.textContent = 'Teraz: ' + fmtT(nowSec()) + ' · ' + SEASONS[seasonNow()] + ' · ' + wxName(); };
  LIVE.onupdate = show;
  const upd = () => { ENV.hour = hr.value; ENV.season = se.value; ENV.weather = wx.value; saveEnv(); if (ENV.weather === 'live') fetchLiveWx(); resetWeather(); PATS.clear(); if (!G.trip) G.simTime = nowSec(); show(); };
  hr.onchange = se.onchange = wx.onchange = upd; hr.oninput = upd;
  $('envNow').onclick = () => { hr.value = ''; upd(); };
  show(); setInterval(show, 15000);
})();
// ===== Motyw panelu kierowcy =====
(function () {
  const sel = document.getElementById('envPanel'); let th = 'classic';
  try { th = localStorage.getItem('ibisPanel') || 'classic'; } catch (e) { }
  const apply = v => { document.body.className = document.body.className.replace(/\bpt-\w+/g, '').trim(); if (v !== 'classic') document.body.classList.add('pt-' + v); try { localStorage.setItem('ibisPanel', v); } catch (e) { } };
  if (sel) { if (![...sel.options].some(o => o.value === th)) th = 'classic'; sel.value = th; sel.onchange = () => apply(sel.value); }
  apply(th);
})();
// ===== Rozpoznawanie urządzenia: komputer / tablet / smartfon =====
// Klasy na <body>: dev-desktop|dev-tablet|dev-phone, touch, portrait|landscape; zmienna CSS --ps = skala panelu kierowcy.
// Wymuszenie do testów: index.html?dev=phone (albo tablet / desktop).
const DEV = {
  kind: 'desktop', touch: false, portrait: false,
  NAMES: { desktop: 'komputer', tablet: 'tablet', phone: 'smartfon' },
  detect() {
    const ua = navigator.userAgent || '', uad = navigator.userAgentData, mq = q => !!(window.matchMedia && matchMedia(q).matches);
    const coarse = mq('(pointer:coarse)'), hover = mq('(hover:hover)'), tp = navigator.maxTouchPoints || 0;
    const ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && tp > 1);
    const mobUA = (uad && uad.mobile) || /iPhone|iPod|Android.+Mobile|Windows Phone|Mobi/i.test(ua);
    const tabUA = ipad || /Android|Tablet|Silk|Kindle|PlayBook/i.test(ua);
    let k = 'desktop';
    if (mobUA || tabUA || (coarse && !hover)) {
      // o telefonie/tablecie rozstrzyga krótszy bok ekranu (telefony < 600 px CSS)
      const side = Math.min(screen.width || innerWidth, screen.height || innerHeight);
      k = side < 600 ? 'phone' : 'tablet';
    }
    const f = (new URLSearchParams(location.search).get('dev') || '').toLowerCase();
    if (this.NAMES[f]) k = f;
    this.kind = k; this.touch = k !== 'desktop' || (coarse && tp > 0);
  },
  apply() {
    const b = document.body, vw = innerWidth, vh = innerHeight, k = this.kind;
    this.portrait = vh > vw;
    for (const n of ['desktop', 'tablet', 'phone']) b.classList.toggle('dev-' + n, n === k);
    b.classList.toggle('touch', this.touch); b.classList.toggle('portrait', this.portrait); b.classList.toggle('landscape', !this.portrait);
    // panel ma naturalnie 330–540 px szerokości (34vw) + pasek akcji pod spodem i F1–F4 z boku; na mniejszych ekranach zmniejszamy go
    let s = 1;
    if (k !== 'desktop') {
      const pw = Math.min(540, Math.max(330, vw * .34)), fw = Math.min(62, Math.max(46, vw * .042)), ph = pw * 5 / 8 + 50;
      s = k === 'phone' ? Math.min(1, vh * .56 / ph, vw * .44 / (pw + fw + 12)) : Math.min(1, vh * .62 / ph, vw * .52 / (pw + fw + 12));
    }
    document.documentElement.style.setProperty('--ps', Math.max(.4, s).toFixed(3));
  },
  init() {
    this.detect(); this.apply();
    const upd = () => { this.apply(); resize(); };
    addEventListener('resize', upd); addEventListener('orientationchange', () => setTimeout(upd, 150));
    if (window.visualViewport) visualViewport.addEventListener('resize', upd);
    const ti = document.getElementById('touchinfo');
    if (ti) ti.innerHTML = `📱 Wykryto: <b>${this.NAMES[this.kind]}</b>. Dotknij <b>prawej połowy</b> ekranu – gaz, <b>lewej</b> – hamulec. Przyciski akcji są pod panelem kierowcy, 📟 chowa panel.` + (this.kind === 'phone' ? ' Najwygodniej grać poziomo, na pełnym ekranie.' : '');
    const pb = document.getElementById('panelbtn');
    if (pb) pb.onclick = e => { e.stopPropagation(); document.body.classList.toggle('nopanel'); pb.blur(); };
    const ro = document.getElementById('rotok');
    if (ro) ro.onclick = () => document.body.classList.add('rotok');
  }
};
DEV.init();
// ===== Pełny ekran =====
function toggleFS() {
  const d = document;
  try { if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else { const e = d.documentElement; const r = (e.requestFullscreen || e.webkitRequestFullscreen).call(e, { navigationUI: 'hide' }); if (r && r.catch) r.catch(() => say('Pełny ekran niedostępny w tej przeglądarce')); } }
  catch (e) { say('Pełny ekran niedostępny w tej przeglądarce'); }
}
(function () {
  const b = document.getElementById('fsbtn'), b2 = document.getElementById('envFs');
  const sync = () => { const on = !!(document.fullscreenElement || document.webkitFullscreenElement); if (b) { b.textContent = on ? '🗗' : '⛶'; b.title = on ? 'Zamknij pełny ekran (G / Esc)' : 'Pełny ekran (G)'; } if (b2) b2.textContent = on ? '🗗 Zamknij pełny ekran (G)' : '⛶ Pełny ekran (G)'; };
  if (b) b.onclick = e => { e.stopPropagation(); toggleFS(); b.blur(); };
  if (b2) b2.onclick = e => { e.stopPropagation(); toggleFS(); b2.blur(); };
  const m = document.getElementById('mutebtn'); if (m) m.onclick = e => { e.stopPropagation(); AU.init(); UI.act('mute'); m.blur(); };
  document.addEventListener('fullscreenchange', sync); document.addEventListener('webkitfullscreenchange', sync);
})();
resetWeather();
document.getElementById('start').addEventListener('click', e => {
  const t = e.target.closest('[data-m]'); if (!t) return; AU.init(); G.simTime = nowSec();
  const m = t.dataset.m;
  if (m === 'board') { showBoard(true); return; }
  if (!m.startsWith('demo-')) {
    const inp = document.getElementById('plName'), n = setPlayerName(inp.value); inp.value = n;
    if (!n && !G.kid) { inp.focus(); inp.classList.add('err'); document.getElementById('plInfo').textContent = 'Wpisz nazwę kierowcy, aby zacząć'; return; }
  }
  G.lastBoard = null;
  if (m.startsWith('demo-')) { G.attract = false; document.getElementById('start').classList.add('hide'); startDemo(m.slice(5)); return; }
  if (m.startsWith('tr-')) { G.driver = G.driver || { id: '0000', name: DRIVERS['0000'] }; loadTraining(m.slice(3)); UI.setPanel('trip'); UI.toast('Misja treningowa – naciśnij ▶ w panelu'); }
  else { G.mode = m; loadIdle(); UI.setPanel('off'); }
  G.attract = false; document.getElementById('start').classList.add('hide');
});

// ===== Nazwa kierowcy i tabela wyników na ekranie startowym =====
function showBoard(on) {
  const el = document.getElementById('board'); if (!el) return;
  if (on) document.getElementById('boardBody').innerHTML = boardHTML(20);
  el.classList.toggle('hide', !on);
  if (!on && UI.plUpd) UI.plUpd();
}
(function () {
  const inp = document.getElementById('plName'), info = document.getElementById('plInfo');
  if (!inp) return;
  inp.value = playerName();
  // tryb gry: standardowy / dla dzieci (poniżej 6 lat)
  const gm = document.getElementById('plMode');
  try { G.kid = localStorage.getItem('mpkwro_kid') === '1'; } catch (e) { G.kid = false; }
  if (gm) { gm.value = G.kid ? 'kid' : 'std'; gm.onchange = () => { G.kid = gm.value === 'kid'; try { localStorage.setItem('mpkwro_kid', G.kid ? '1' : '0'); } catch (e) { } upd(); }; }
  const upd = () => { const n = inp.value.trim(); inp.classList.remove('err'); if (G.kid) { info.textContent = '🧸 Tryb dla dzieci: pomocnik hamuje i podpowiada, bez punktów'; return; } const b = boardGet().filter(r => r.n === n); info.textContent = n ? (b.length ? `Najlepszy wynik: ${b[0].score} pkt · kursów: ${b.length}` : 'Nowy kierowca – powodzenia!') : 'Wpisz swoje imię – trafi do tabeli wyników'; };
  inp.addEventListener('input', upd); inp.addEventListener('change', () => { inp.value = setPlayerName(inp.value); upd(); });
  inp.addEventListener('keydown', e => e.stopPropagation()); inp.addEventListener('keyup', e => e.stopPropagation());
  upd(); UI.plUpd = upd;
  const bd = document.getElementById('board');
  bd.addEventListener('click', e => { if (e.target === bd || e.target.closest('[data-x=close]')) { e.stopPropagation(); showBoard(false); } });
  // eksport / import tabeli wyników (plik .json) – np. przy przenoszeniu gry na inny komputer lub przeglądarkę
  document.getElementById('boardExp').addEventListener('click', e => {
    e.stopPropagation();
    const data = { app: 'mpkwro', v: 1, saved: new Date().toISOString(), board: boardGet() };
    const a = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
    a.href = url; a.download = 'stia-wyniki-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const bf = document.getElementById('boardFile');
  document.getElementById('boardImp').addEventListener('click', e => { e.stopPropagation(); bf.value = ''; bf.click(); });
  bf.addEventListener('change', () => {
    const f = bf.files[0]; if (!f) return;
    f.text().then(t => {
      const n = boardImport(JSON.parse(t));
      alert(n ? `Wczytano ${n} nowych wyników.` : 'Brak nowych wyników w pliku (wszystkie już są w tabeli).');
      showBoard(true); upd();
    }).catch(() => alert('Nie udało się wczytać pliku – to nie jest plik z wynikami gry STiA.'));
  });
  document.getElementById('boardClr').addEventListener('click', e => { e.stopPropagation(); if (confirm('Wyczyścić całą tabelę wyników?')) { localStorage.removeItem('mpkwro_board'); showBoard(true); upd(); } });
})();

// ===== Pętla =====
G.mode = 'tram'; loadIdle(); G.attract = true; UI.render();
let last = performance.now(), ledT = 0;
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  try { update(dt); draw(); } catch (e) { console.error(e); }
  ledT -= dt; UI.mmT -= dt;
  if (ledT <= 0) {
    ledT = 0.1; updateLeds(); UI.tick();
    const h = hints(); if (h !== UI.lastHud) { UI.el('tasks').innerHTML = h; UI.lastHud = h; }
    demoHud(); sigZoom();
    if (UI.state === 'trip' && UI._ns !== G.ns + '|' + G.running + '|' + G.ended) { UI._ns = G.ns + '|' + G.running + '|' + G.ended; UI.render(); }
  }
  if (UI.mmT <= 0 && G.minimap) { UI.mmT = 0.3; drawMinimap(); }
  if (UI.toastT > 0) { UI.toastT -= dt; if (UI.toastT <= 0) UI.el('toast').classList.remove('on'); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
