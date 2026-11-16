// ===== Pokaz jazdy – autopilot przechodzi cały plac treningowy i pokazuje klawisze =====
const DEMO = { t: 0, cd: {}, need: {}, msg: '', key: '', lbl: '', btn: '', keyT: 0, indAt: -9, hint: 0, vt: Infinity };

function startDemo(mode) {
  G.driver = G.driver || { id: '0000', name: DRIVERS['0000'] };
  loadTraining(mode);
  const prev = G.model[mode];
  if (!VEH[mode].low) { const k = Object.keys(MODELS).find(k => MODELS[k].mode === mode && MODELS[k].low); if (k) setModel(k); }
  G.demo = true; G.demoPrev = G.model[mode] !== prev ? prev : null;
  if (mode === 'bus') G.veh.needInd = true;
  Object.assign(DEMO, { kidTrip: null, t: 0, cd: {}, need: {}, hint: 0, msg: 'Pokaz jazdy – patrz, które klawisze są wciskane', key: '', lbl: '', btn: '', keyT: 0, indAt: -9 });
  G.running = true; G.paused = false;
  UI.setPanel('trip');
  UI.announce('Pokaz jazdy – gra prowadzi sama. Następny przystanek: ' + curStop().name);
}
function stopDemo() {
  if (!G.demo) return;
  if (G.trip && !G.ended) endTrip('Pokaz jazdy przerwany.');
  G.keys.up = G.keys.down = G.keys.sand = G.keys.space = false;
}

// naciśnięcie klawisza akcji (z pokazaniem na ekranie)
function dPress(id, key, lbl, btn, fn, cool = 0.9) {
  if ((DEMO.cd[id] || -1) > DEMO.t) return false;
  if (kidOn()) {
    // tryb dla dzieci: najpierw podpowiedź (podświetlony przycisk), a gdy dziecko nie zdąży – pomocnik robi to sam
    let n = DEMO.need[id];
    if (!n || DEMO.t - n.last > 0.5) n = DEMO.need[id] = { t0: DEMO.t, last: DEMO.t }; else n.last = DEMO.t;
    const left = (KID_WAIT[id] || 6) - (DEMO.t - n.t0);
    if (left > 0) { Object.assign(DEMO, { key, lbl, btn, keyT: 0.3, hint: left }); return false; }
    delete DEMO.need[id];
  }
  DEMO.cd[id] = DEMO.t + cool;
  Object.assign(DEMO, { key, lbl, btn, keyT: 1.7, hint: 0, n: (DEMO.n || 0) + 1 });
  fn(); return true;
}
function dInd(dir, why) {
  const v = G.veh; if (v.ind === dir) return true;
  if (dPress('ind', dir > 0 ? 'Q' : 'A', why || (dir > 0 ? 'Lewy kierunkowskaz' : 'Prawy kierunkowskaz'), dir > 0 ? 'indL' : 'indR', () => ACT.ind(dir), 1)) DEMO.indAt = DEMO.t;
  return false;
}

function demoStep(dt) {
  DEMO.t += dt; DEMO.keyT -= dt;
  const v = G.veh, w = G.world, V = VEH[G.mode], K = G.keys, tram = G.mode === 'tram';
  K.up = K.down = K.space = K.sand = false; G.mouse = 0;
  const grip = Math.min(1, wxGrip());
  const b = V.brake * 0.5 * (tram ? 1 : grip);
  let vt = 36 / 3.6, msg = '';
  const lim = (d, vmax) => Math.sqrt(Math.max(0, vmax * vmax + 2 * b * Math.max(0, d)));
  const cap = (u, why) => { if (u < vt) { vt = u; msg = why; } };
  const stopAt = (d, why) => cap(d <= 0.05 ? 0 : lim(d, 0), why);
  const slowAt = (d, vmax, why) => cap(lim(d, vmax), why);

  if (v.lock > 0) { K.down = true; DEMO.msg = 'Kolizja – pojazd unieruchomiony'; return; }
  if (G.driverOut) { K.down = true; DEMO.msg = 'Motorniczy wyszedł przestawić zwrotnicę ręcznie…'; return; }

  // --- przystanek
  const s = curStop();
  if (s && !s.served) {
    const d = s.x - v.x;
    if (!s.arrived) {
      stopAt(d, 'Hamuję precyzyjnie – przód przy znaku przystanku');
      if (v.v < 0.05 && d < 1.2 && d > -V.len * 0.3 && (tram || (v.lane === 0 && v.ly < 0.01))) {
        const old = !tram && s.people.some(p => p.st === 'wait' && p.kind === 'old');
        if (old && v.kneelT === 0) dPress('kneel', 'C', 'Senior na przystanku – przyklęk autobusu', 'kneel', () => ACT.kneel());
        else if (ctrlNeed()) dPress('ev', 'F3', 'Odblokowuję kasowniki przed otwarciem drzwi', 'fk:kas', () => fkey('kas'), 1.2);
        else if (evDoorGate() && evDoorGate().msg) { const g = evDoorGate(); msg = g.msg.replace(/^\S+ /, '') + '…'; }
        else if (!old || v.kneel >= 0.99) dPress('doors', 'E', 'Otwieram drzwi', 'doors', () => ACT.doors(), 1.2);
        msg = 'Zatrzymany na przystanku ' + s.name;
      }
    } else {
      vt = 0; msg = 'Wymiana pasażerów…';
      const q = s.q;
      if (q && v.doors >= 0.99 && v.doorsT === 1) {
        const wheelWait = s.people.some(p => p.st === 'wait' && p.kind === 'wheel');
        const oldWait = !tram && s.people.some(p => p.st === 'wait' && p.kind === 'old');
        if (!q.done) {
          if (V.low && (q.wheelOff || wheelWait) && v.rampT === 0) dPress('ramp', 'R', q.wheelOff ? 'Pasażer na wózku wysiada – rozkładam rampę' : 'Osoba na wózku – rozkładam rampę', 'ramp', () => ACT.ramp(), 1.5);
          else if (oldWait && v.kneelT === 0) dPress('kneel', 'C', 'Senior – przyklęk', 'kneel', () => ACT.kneel());
          if (q.wheelOff || wheelWait) msg = 'Pomoc osobie na wózku…';
        } else if (v.rampT > 0) dPress('ramp', 'R', 'Chowam rampę', 'ramp', () => ACT.ramp(), 1.5);
        else if (v.ramp > 0) msg = 'Rampa się chowa…';
        else if (v.kneelT > 0) dPress('kneel', 'C', 'Podnoszę autobus', 'kneel', () => ACT.kneel());
        else if (v.kneel > 0) msg = 'Autobus się podnosi…';
        else if (ctrlBoarding()) msg = 'Kontrolerzy biletów wsiadają…';
        else if (evDoorGate() === 'busy' || evDoorGate() === 'svc') msg = 'Służby przy pojeździe – drzwi otwarte…';
        else if (dPress('doors', 'E', 'Zamykam drzwi', 'doors', () => ACT.doors(), 1.5)) {}
      } else if (v.doorsT === 0 && v.doors > 0) msg = 'Drzwi się zamykają…';
    }
  }

  // --- kierunkowskaz przy odjeździe (autobus)
  if (v.needInd && v.ind !== 1 && v.doors === 0) { vt = Math.min(vt, v.v); if (v.v < 0.3) { vt = 0; dInd(1, 'Lewy kierunkowskaz przed odjazdem'); msg = 'Sygnalizuję odjazd z przystanku'; } }

  // --- sygnalizacja
  for (const sg of w.signals) {
    const d = sg.x - v.x; if (sg.passed || d < -0.5 || d > 160) continue;
    const st = sigState(sg);
    if (st === 'R' || (st === 'Y' && v.v * v.v / (2 * V.brake) < d - 2)) stopAt(d - 3, st === 'R' ? (sg.forced ? 'Czerwone – stoję przed linią i czekam na zielone' : 'Czerwone – zatrzymuję się') : 'Żółte – zatrzymuję się');
  }

  // --- duże skrzyżowania ze skrętem
  for (const t of w.turns) {
    if (t.cut) continue;
    const d = t.x - v.x, txt = t.dir > 0 ? 'w lewo' : 'w prawo';
    if (!t.passed && d < 140) {
      if (v.ind !== t.dir && !(G.mode === 'bus' && (DEMO.t - DEMO.indAt < 0.6 || (s && !s.served && s.x < t.x)))) dInd(t.dir, 'Kierunkowskaz – skręt ' + txt);
      if (tram && t.set !== t.dir) {
        slowAt(d - 86, 15 / 3.6, 'Zwalniam – przestawię zwrotnicę ' + txt);
        if (d < 12) stopAt(d - 4, 'Czekam na przestawienie zwrotnicy');
        if (v.ind === t.dir && d < 89 && v.v < 19 / 3.6) dPress('sw', 'Z', 'Przestawiam zwrotnicę ' + txt, 'sw', () => ACT.sw(), 1.2);
      }
      slowAt(d - 4, TURN_V - 1, 'Skręt ' + txt + ' – zwalniam do 20 km/h');
    } else if (t.passed && !t.straight) cap(TURN_V - 1, 'Skręcam ' + txt + ' – max 20 km/h');
  }

  // --- zwrotnice (tramwaj)
  if (tram) {
    for (const sw of w.switches) {
      const d = sw.x - v.x;
      if (!sw.passed && d > -1 && d < 170) {
        if (!sw.ok) {
          stopAt(d - 14, 'Zwrotnica źle ustawiona – zatrzymuję się przed nią');
          if (v.v < 0.05 && d < 30 && v.doors === 0) dPress('sw', 'Z', 'Wychodzę przestawić zwrotnicę', 'sw', () => ACT.sw(), 3);
        } else slowAt(d, CURVE_V - 0.8, 'Łuk za zwrotnicą – max 20 km/h');
      } else if (sw.passed && !sw.cdone) cap(CURVE_V - 0.8, 'Jadę łukiem – max 20 km/h');
    }
    // piasecznica na liściach / śliskich szynach
    const slip = w.leaves.some(l => l.x0 - v.x < 30 && v.x - V.len < l.x1);
    if (slip || (grip < 0.85 && v.v > 2 && vt < v.v)) {
      K.sand = true; if (slip && !msg) msg = 'Śliskie szyny – sypię piasek (F)';
      if (!DEMO.sandShown && slip) { DEMO.sandShown = true; Object.assign(DEMO, { key: 'F', lbl: 'Piasecznica – trzymam F na liściach', btn: 'sand', keyT: 2.2, n: (DEMO.n || 0) + 1 }); }
    }
    // auto na torowisku
    for (const bl of w.blockers) {
      if (bl.gone) continue;
      const d = bl.x - 2.3 - v.x; if (d < -1 || d > 160) continue;
      stopAt(d - 6, bl.leave > 0 ? 'Auto zjeżdża z torowiska…' : 'Auto na torowisku – zatrzymuję się');
      if (v.v < 0.5 && bl.x - v.x < 38 && bl.leave <= 0) dPress('bell', 'D', 'Dzwonek – kierowca auta zjeżdża z torów', 'bell', () => ACT.bell(), 2);
    }
  }

  // --- ronda
  for (const r of w.rounds) {
    const P = RB[G.mode], d = r.x - P.rx - v.x;
    if (v.x - V.len > r.x + P.rx || d > 170) continue;
    slowAt(d, 24 / 3.6, 'Rondo – max 30 km/h');
    if (d < 0) cap(24 / 3.6, 'Jadę przez rondo');
    if (!tram) {
      const live = r.cars.filter(c => !c.ghost && c.crash <= 0);
      if (d < 50) r.t = Math.max(r.t, 1.5); // w pokazie: bez nowych aut, gdy autobus wjeżdża
      if (!r.entered && d < 45 && d > 1.5 && live.some(c => c.th > -Math.PI * 1.3))
        stopAt(d - 4, 'Rondo – ustępuję autom jadącym po rondzie');
      for (const c of live) if (c.th <= -Math.PI * 1.3 && c.xm > v.x - 2 && c.y + 4 > ourBand()[0]) {
        const gap = c.xm - v.x - 2.5;
        if (gap < 6) stopAt(0, 'Auto przede mną na rondzie – czekam'); else cap(Math.min(24 / 3.6, c.v + gap / 4), 'Jadę za autem po rondzie');
      }
    }
  }

  // --- piesi na przejściach
  const yb = LANE_Y[0] - 22 * (tram ? 0 : v.ly), top = tram ? 157 : yb - 21;
  for (const c of w.crossings) {
    const p = c.ped, d = c.x - v.x; if (!p || d < -0.5 || d > 100) continue;
    if (p.st === 'gone') continue;
    if (!c.bell && d < 78 && v.x - V.len < c.x) dPress('bell', 'D', tram ? 'Pieszy – dzwonek ostrzegawczy' : 'Pieszy – klakson', 'bell', () => ACT.bell(), 1.5);
    if (p.st === 'curb' || p.st === 'fallen' || (p.st === 'walk' && p.y > top - 3)) stopAt(d - 4, 'Ustępuję pieszemu na przejściu');
  }

  // --- skrzyżowania bez świateł
  const band = ourBand();
  for (const j of allJ()) {
    const d = j.x - v.x; if (d < 0 || d > 120) continue;
    if (j.sg && j.cars.every(c => !(c.y + c.len / 2 > 138 && c.y - c.len / 2 < band[1] + 4))) continue;
    if (j.cars.some(c => c.bad && !c.halt && !c.passedBad && !c.ghost)) {
      dPress('bell', 'D', 'Auto wymusza pierwszeństwo – ' + (tram ? 'dzwonek' : 'klakson') + ' i hamuję!', 'bell', () => ACT.bell(), 1.5);
      slowAt(d - 6, 0, 'Auto wymusza pierwszeństwo – hamuję');
    }
    const inX = c => { const h = c.len / 2; return c.dir > 0 ? c.y + h > 138 && c.y - h < band[1] + 4 : c.y - h < 206 && c.y + h > band[0] - 4; };
    if (j.cars.some(c => !c.ghost && c.crash <= 0 && !c.halt && inX(c))) stopAt(d - 4, 'Auto na skrzyżowaniu – czekam');
    slowAt(d, 25 / 3.6, 'Skrzyżowanie bez świateł – ostrożnie');
  }

  // --- autobus: odstęp, pasy, roboty
  if (!tram) {
    for (const c of w.cars) {
      const cl = c.cy !== undefined ? c.cy : c.lane;
      if (Math.abs(cl - v.ly) > 0.75 || c.x < v.x - 0.5) continue;
      const gap = c.x - v.x;
      cap(Math.sqrt(Math.max(0, c.v * c.v * 0.5 + 2 * b * (gap - 9))), c.brk > 0 ? 'Auto przede mną hamuje – hamuję!' : 'Zachowuję bezpieczny odstęp');
    }
    let want = 0, why = 'Powrót na prawy pas';
    const turnNow = w.turns.find(t => t.passed && !t.cut);
    const wk = w.works.find(k => k.x0 - v.x < 120 && v.x - V.len < k.x1 + 3 && !(s && !s.served && s.x < k.x0));
    const lt = w.turns.find(t => !t.passed && t.dir > 0 && t.x - v.x < 170 && t.x - v.x > -1 && !(s && !s.served && s.x < t.x));
    const rb = w.rounds.find(r => r.x - v.x < 160 && v.x - V.len < r.x + RB.bus.rx);
    if (turnNow) want = v.lane;
    else if (wk) { want = 1; why = 'Roboty na prawym pasie – zmieniam pas'; }
    else if (lt) { want = 1; why = 'Do skrętu w lewo – lewy pas'; }
    else if (rb) { want = 0; why = 'Rondo – prawy pas'; }
    if (s && !s.arrived && s.x - v.x < 160 && !wk && !lt) want = 0;
    if (G.td && !G.td.out) want = v.lane;
    if (want !== v.lane && !(s && s.arrived && !s.served)) {
      const dir = want - v.lane;
      if (v.ind !== dir) dInd(dir, (dir > 0 ? 'Lewy' : 'Prawy') + ' kierunkowskaz – ' + why.toLowerCase());
      else if (DEMO.t - DEMO.indAt > 0.6 && Math.abs(v.ly - v.lane) < 0.01) {
        const busy = w.cars.some(c => c.lane === want && c.x < v.x + 5 && c.x + c.len > v.x - V.len - 6);
        if (!busy && v.v > 1.6) dPress('lane', dir > 0 ? '↑' : '↓', why, dir > 0 ? 'ln:1' : 'ln:-1', () => ACT.lane(dir), 1.2);
        else if (v.v <= 1.6) vt = Math.max(vt, 2.6);
      }
      if (wk && v.lane === 0) {
        const busy = w.cars.some(c => c.lane === 1 && c.x < v.x + 8 && c.x + c.len > v.x - V.len - 8);
        if (busy) stopAt(wk.x0 - v.x - 3, 'Lewy pas zajęty – czekam przed robotami'); else slowAt(wk.x0 - v.x - 3, 2.6, why);
      }
      if (!msg) msg = why;
    }
  }

  // --- zjazd do zajezdni
  if (G.toDepot && w.depot) {
    if (v.x > w.depot.x - 25) cap(9 / 3.6, 'Teren zajezdni – max 10 km/h, wjeżdżam przez bramę');
    stopAt(depotStopX() - v.x, v.x > w.depot.x + 40 ? 'Hala – staję dokładnie na linii STOP' : 'Zjazd do zajezdni – ' + w.depot.name);
  }
  // --- pętla na starcie: powoli objeżdżamy pętlę
  if (G.td && G.td.kind === 'loop' && !G.td.out) cap(14 / 3.6, 'Wyjazd z pętli – max 15 km/h');
  // --- pieszy na przejściu za skrętem
  const yd = tdYield(); if (yd !== null) stopAt(yd, 'Pieszy na przejściu – ustępuję przy skręcie');

  // --- zadania dyspozytora: ogłoszenia, komunikaty, RTT/PRTT, CA
  const et = G.evTask;
  if (G.call && G.call.kind === 'ca') cap(0, 'Rozmowa z centralą alarmową – pojazd stoi');
  for (const o of G.evFx || []) {
    if (fxTree(o) && o.x > v.x - 2) stopAt(o.x - v.x - 3, o.res >= 0 ? 'Ekipa usuwa drzewo – czekam' : 'Drzewo na trasie – staję');
    if (fxHold(o)) {
      const st = o.svc ? o.svc.st : '';
      cap(0, st === 'door' ? 'Służby przy drzwiach – otwieram' : st === 'in' ? 'Służby w pojeździe – czekam' : st === 'out' || st === 'go' ? 'Służby kończą interwencję' : 'Czekam z zamkniętymi drzwiami na służby');
      if (st === 'door' && v.v < 0.05 && v.doorsT === 0 && v.doors === 0) dPress('doors', 'E', 'Otwieram drzwi służbom', 'doors', () => ACT.doors(), 1.2);
    }
  }
  if (v.emDoor && v.doorsT === 1 && v.doors >= 0.99 && !['busy', 'svc'].includes(evDoorGate()) && !(G.evFx || []).some(o => fxHold(o) && o.svc && /in|out/.test(o.svc.st))) dPress('doors', 'E', 'Służby odjechały – zamykam drzwi', 'doors', () => ACT.doors(), 1.5);
  if (G.ctrl && G.ctrl.st === 'lockreq' && G.ctrl.t > 1) dPress('ev', 'F3', 'Kontrola biletów – blokuję kasowniki', 'fk:kas', () => fkey('kas'), 1.2);
  if (et && et.T - et.t >= 1.6) {
    if (et.kind === 'ann') {
      if (UI.state !== 'ann') dPress('ev', 'O', 'Dyspozytor prosi o ogłoszenie – otwieram ogłoszenia z bazy', '', () => UI.act('ann'), 1.4);
      else if (EV.spk !== et.spk) dPress('ev', 'O', 'Zmieniam głośniki na ' + SPK[et.spk], '', () => { const o = ['int', 'ext', 'both']; EV.spk = o[(o.indexOf(EV.spk) + 1) % 3]; UI.render(); }, 1.4);
      else dPress('ev', String((et.i + 1) % 10), 'Nadaję „' + ANN_DB[et.spk][et.i].n + '”', '', () => { playAnn(et.i, et.spk); UI.setPanel('trip'); }, 1.4);
    } else if (et.kind === 'ack') dPress('ev', 'V', 'Potwierdzam komunikat dyspozytora', '', evConfirm, 1.4);
    else if (et.kind === 'report' && !G.callSeq) { const k = et.r.prio ? 'prtt' : 'rtt'; dPress('ev', et.r.prio ? 'F2' : 'F1', (et.r.prio ? 'Pilne zgłoszenie PRTT: ' : 'Zgłoszenie RTT: ') + et.r.why, 'fk:' + k, () => fkey(k), 1.4); }
    else if (et.kind === 'emerg') {
      cap(0, '⚠ ' + et.txt + ' – zatrzymuję pojazd');
      if (v.v < 0.3 && !G.callSeq) dPress('ev', 'F4', 'Wezwanie alarmowe CA – ' + et.txt, 'fk:ca', () => fkey('ca'), 1.4);
    }
  }

  // --- gaz / hamulec
  if (vt < 0.05 && v.v < 0.05) K.down = true;
  else if (v.v > vt + 0.08) K.down = true;
  else if (v.v < vt - 0.25) K.up = true;
  DEMO.vt = vt;
  DEMO.msg = msg || (K.up ? 'Przyspieszam' : 'Jadę ze stałą prędkością');
}

// ===== Tryb dla dzieci (poniżej 6 lat): pomocnik =====
// dziecko steruje normalnie; pomocnik pilnuje prędkości i hamuje (przystanki, światła, zwrotnice, piesi),
// nie rusza sam (o jeździe decyduje dziecko, gazem), a czynności wykonuje sam po czasie z KID_WAIT (s), jeśli dziecko ich nie zrobi
const KID_WAIT = { sw: 10, doors: 6, ramp: 6, kneel: 6, bell: 2, ind: 3, lane: 4, ev: 6 }, KID_IDLE = 3;
function kidOn() { return !!(G.kid && !G.demo && G.trip); }
function kidStep(dt) {
  const K = G.keys, v = G.veh;
  if (DEMO.kidTrip !== G.trip) { // nowy kurs: czysty stan pomocnika (bez „wiszących” klawiszy po pokazie)
    Object.assign(DEMO, { kidTrip: G.trip, t: 0, cd: {}, need: {}, key: '', lbl: '', btn: '', keyT: 0, indAt: -9, hint: 0 });
    K.up = K.down = K.sand = K.space = false; G.mouse = 0; G.kidIdle = 0;
  }
  const U = { up: K.up || G.mouse > 0, down: K.down || G.mouse < 0 };
  G.kidK = { k: { up: K.up, down: K.down, space: K.space, sand: K.sand }, m: G.mouse };
  G.kidIdle = U.up || U.down ? 0 : (G.kidIdle || 0) + dt;
  DEMO.vt = Infinity;
  demoStep(dt);
  const autoUp = K.up, autoDown = K.down;
  // ruszanie i jazda tylko gdy dziecko trzyma gaz – pomocnik jedynie podpowiada
  K.up = U.up && v.v < DEMO.vt - 0.1;
  if (autoUp && !U.up && v.v < 0.3 && G.kidIdle > KID_IDLE && !(DEMO.keyT > 0 && DEMO.hint > 0))
    Object.assign(DEMO, { key: '→', lbl: 'Możesz ruszać – wciśnij Gaz', btn: '', keyT: 0.3, hint: 0 });
  K.down = autoDown || U.down;
  K.space = G.kidK.k.space; K.sand = K.sand || G.kidK.k.sand;
  G.mouse = 0;
}

// ===== Nakładka pokazu (klawisze) =====
function demoHud() {
  const el = document.getElementById('demo'); if (!el) return;
  const demo = !!(G.demo && G.trip && !G.ended), kid = !demo && kidOn() && G.running && !G.ended, on = demo || (kid && DEMO.keyT > 0);
  el.classList.toggle('hide', !on);
  el.classList.toggle('kid', kid);
  document.body.classList.toggle('demo', demo);
  document.querySelectorAll('.ab.press, .fb.press').forEach(e => { if (!(demo || kid) || DEMO.keyT <= 0 || e.dataset.a !== DEMO.btn) e.classList.remove('press'); });
  if (!(demo || kid)) return;
  const mode = demo ? 'demo' : 'kid';
  if (el._ok !== mode) {
    el.innerHTML = demo ? '<div class="dh">🎬 POKAZ JAZDY <span>gra prowadzi sama</span><b data-x="stop">✖ Zakończ</b></div><div class="dmsg"></div><div class="dkeys"></div><div class="dbw"></div>'
      : '<div class="dh">🧸 POMOCNIK <span>pomaga w jeździe</span></div><div class="dmsg hide"></div><div class="dkeys hide"></div><div class="dbw"></div>';
    el._ok = mode;
  }
  const K = G.keys, kc = (k, t, a) => `<div class="dk${a ? ' on' : ''}"><kbd>${k}</kbd><span>${t}</span></div>`;
  const set = (sel, h) => { const e = el.querySelector(sel); if (e._h !== h) { e.innerHTML = h; e._h = h; } };
  set('.dmsg', DEMO.msg);
  set('.dkeys', kc('→', 'Gaz', K.up) + kc('←', 'Hamulec', K.down) + (G.mode === 'tram' ? kc('F', 'Piasek', K.sand) : ''));
  const tm = kid && DEMO.hint > 0 ? ` <small>⏳ ${Math.ceil(DEMO.hint)}</small>` : '';
  set('.dbw', DEMO.keyT > 0 ? `<div class="dbig" data-n="${DEMO.n}"><kbd>${DEMO.key}</kbd><span>${DEMO.lbl}${tm}</span></div>` : '');
  if (DEMO.keyT > 0 && DEMO.btn) { const b = document.querySelector(`.ab[data-a="${DEMO.btn}"], .fb[data-a="${DEMO.btn}"]`); if (b) b.classList.add('press'); }
}
document.addEventListener('pointerdown', e => { if (e.target.closest('#demo [data-x=stop]')) { e.preventDefault(); stopDemo(); } });
