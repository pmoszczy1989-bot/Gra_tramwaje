'use strict';
// ===== Ogłoszenia z bazy, komunikaty dyspozytora (CC) i rozmowy RTT/PRTT/CA – zadania w trakcie kursu =====
// Ikony nad kabiną (render.js: drawAnnGroup/drawCallIcon) jak na terminalu kierowcy: G.ann = ['int'|'ext'|'both'|'stop'|'drv'|'ccDrv'|'ccPass'], G.call = { kind, phase, step, tx }.
// ogłoszenia kierowcy z bazy – osobna lista dla każdego zestawu głośników (cyfry 1…0)
const ANN_DB = {
  int: [
    { id: 'glab', n: 'Przesuń się w głąb', txt: 'Prosimy o przesuwanie się w głąb pojazdu.' },
    { id: 'bilet', n: 'Kontrola biletów', txt: 'Trwa kontrola biletów. Prosimy o przygotowanie biletów do kontroli.' },
    { id: 'kasuj', n: 'Skasuj bilet', txt: 'Prosimy o skasowanie biletu zaraz po wejściu do pojazdu.' },
    { id: 'bagaz', n: 'Bagaż bez opieki', txt: 'Prosimy nie pozostawiać bagażu bez opieki.' },
    { id: 'ustap', n: 'Ustąp miejsca', txt: 'Prosimy ustąpić miejsca osobom starszym, z niepełnosprawnością i z dziećmi.' },
    { id: 'trzymaj', n: 'Trzymaj się poręczy', txt: 'Prosimy trzymać się poręczy podczas jazdy.' },
    { id: 'jedzenie', n: 'Zakaz jedzenia', txt: 'Przypominamy o zakazie spożywania posiłków w pojeździe.' },
    { id: 'opozn', n: 'Przepraszamy za opóźnienie', txt: 'Przepraszamy za opóźnienie spowodowane utrudnieniami w ruchu.' },
    { id: 'awaria', n: 'Awaria – opuść pojazd', txt: 'Z powodu awarii pojazd zjeżdża z trasy. Prosimy o opuszczenie pojazdu na najbliższym przystanku.' },
    { id: 'koniec', n: 'Przystanek końcowy', txt: 'Przystanek końcowy. Prosimy o opuszczenie pojazdu.' }
  ],
  ext: [
    { id: 'linia', n: 'Linia i kierunek', txt: () => G.trip ? `Linia ${G.trip.line}, kierunek ${G.trip.headNow || G.trip.head}.` : 'Linia szkoleniowa.' },
    { id: 'odsun', n: 'Odsuń się od krawędzi', txt: 'Uwaga, pojazd odjeżdża. Prosimy odsunąć się od krawędzi przystanku.' },
    { id: 'wsiadaj', n: 'Wsiadaj wszystkimi drzwiami', txt: 'Prosimy wsiadać wszystkimi drzwiami.' },
    { id: 'przod', n: 'Wsiadanie przednimi drzwiami', txt: 'Wsiadanie tylko przednimi drzwiami.' },
    { id: 'pelny', n: 'Pojazd pełny', txt: 'Pojazd jest pełny. Prosimy zaczekać na następny kurs.' },
    { id: 'nastepny', n: 'Następny pojazd za chwilę', txt: 'Kolejny pojazd tej linii przyjedzie za kilka minut.' },
    { id: 'zjazd', n: 'Zjazd do zajezdni', txt: 'Pojazd zjeżdża do zajezdni. Nie zabieramy pasażerów.' },
    { id: 'rower', n: 'Rowery – środkowe drzwi', txt: 'Przewóz rowerów tylko przez środkowe drzwi.' },
    { id: 'wozek', n: 'Wózki – środkowe drzwi', txt: 'Osoby z wózkami prosimy o wsiadanie środkowymi drzwiami.' },
    { id: 'techn', n: 'Kurs techniczny', txt: 'Kurs techniczny – pojazd nie zabiera pasażerów.' }
  ],
  both: [
    { id: 'drzwi', n: 'Nie blokować drzwi', txt: 'Prosimy nie blokować drzwi. Pojazd zaraz odjedzie.' },
    { id: 'odjazd', n: 'Drzwi się zamykają', txt: 'Uwaga, drzwi się zamykają. Pojazd odjeżdża.' },
    { id: 'objazd', n: 'Objazd', txt: 'Uwaga! Pojazd kursuje objazdem. Przepraszamy za utrudnienia.' },
    { id: 'wstrzym', n: 'Wstrzymanie ruchu', txt: 'Uwaga! Ruch na trasie jest wstrzymany. Prosimy o cierpliwość.' },
    { id: 'spokoj', n: 'Zachowaj spokój', txt: 'Prosimy o zachowanie spokoju. Służby zostały powiadomione.' },
    { id: 'ewak', n: 'Opuść pojazd', txt: 'Uwaga! Prosimy o spokojne opuszczenie pojazdu wszystkimi drzwiami.' },
    { id: 'kieszon', n: 'Uwaga na kieszonkowców', txt: 'Uwaga na kieszonkowców. Prosimy pilnować swoich rzeczy.' },
    { id: 'slisko', n: 'Śliska nawierzchnia', txt: 'Uwaga, śliska nawierzchnia. Zachowaj ostrożność przy wsiadaniu i wysiadaniu.' },
    { id: 'pomoc', n: 'Pomoc w drodze', txt: 'Pomoc jest w drodze. Prosimy zrobić miejsce dla służb ratunkowych.' },
    { id: 'dzieki', n: 'Dziękujemy za podróż', txt: 'Dziękujemy za wspólną podróż. Życzymy miłego dnia.' }
  ]
};
const SPK = { int: 'wewn.', ext: 'zewn.', both: 'wewn.+zewn.' }, SPK_N = { int: 'Wewnętrzne', ext: 'Zewnętrzne', both: 'Oba' };
const annTxt = a => typeof a.txt === 'function' ? a.txt() : a.txt;
const annIdx = (spk, id) => ANN_DB[spk].findIndex(a => a.id === id);
// polecenia dyspozytora: które ogłoszenie, na jakie głośniki i dlaczego
const ANN_REQ = [
  { id: 'glab', spk: 'int', why: 'Tłok przy drzwiach' }, { id: 'bilet', spk: 'int', why: 'Kontrolerzy wsiadają' },
  { id: 'kasuj', spk: 'int', why: 'Pasażerowie nie kasują biletów' }, { id: 'bagaz', spk: 'int', why: 'Pozostawiona torba w pojeździe' },
  { id: 'ustap', spk: 'int', why: 'Senior stoi przy drzwiach' }, { id: 'trzymaj', spk: 'int', why: 'Gwałtowne hamowania na odcinku' },
  { id: 'jedzenie', spk: 'int', why: 'Pasażer je w pojeździe' }, { id: 'opozn', spk: 'int', why: 'Opóźnienia na linii' },
  { id: 'linia', spk: 'ext', why: 'Turyści pytają o kierunek' }, { id: 'odsun', spk: 'ext', why: 'Tłum na przystanku' },
  { id: 'wsiadaj', spk: 'ext', why: 'Tłok przy pierwszych drzwiach' }, { id: 'pelny', spk: 'ext', why: 'Pojazd przepełniony' },
  { id: 'rower', spk: 'ext', why: 'Rowerzysta przy przednich drzwiach' }, { id: 'wozek', spk: 'ext', why: 'Rodzic z wózkiem na przystanku' },
  { id: 'drzwi', spk: 'both', why: 'Pasażerowie blokują drzwi' }, { id: 'objazd', spk: 'both', why: 'Utrudnienia na trasie' },
  { id: 'kieszon', spk: 'both', why: 'Zgłoszenie kradzieży na linii' }, { id: 'slisko', spk: 'both', why: 'Oblodzone przystanki' }
];
const CC_DRV = ['Komunikat dyspozytora: zwiększony ruch pasażerów w centrum, zachowaj ostrożność na przystankach.', 'Komunikat dyspozytora: na trasie możliwa kontrola biletów.',
  'Komunikat dyspozytora: wypadek w okolicy placu Grunwaldzkiego, możliwe utrudnienia.', 'Komunikat dyspozytora: pamiętaj o zgłoszeniu stanu licznika po zjeździe.'];
const CC_PASS = ['Szanowni pasażerowie, z powodu awarii możliwe są opóźnienia. Przepraszamy.', 'Szanowni pasażerowie, przypominamy o obowiązku posiadania ważnego biletu.',
  'Szanowni pasażerowie, dziś na Tarczyński Arena mecz – spodziewany zwiększony ruch.', 'Szanowni pasażerowie, prosimy zwracać uwagę na pozostawione bagaże.'];
// zgłoszenia kierowcy do dyspozytora: RTT (F1, zwykłe) i PRTT (F2, pilne)
const REPORTS = [
  { prio: false, id: 'drzwi', fx: 'door', why: 'Drzwi nr 2 zacinają się', drv: 'Zgłaszam usterkę drzwi numer dwa.', ans: 'Przyjąłem. Zgłoś usterkę po zjeździe do zajezdni.' },
  { prio: false, id: 'kas', fx: 'ticket', why: 'Nie działa kasownik', drv: 'Zgłaszam niedziałający kasownik przy drugich drzwiach.', ans: 'Przyjąłem, przekażę do serwisu.' },
  { prio: false, id: 'korek', fx: 'jam', why: 'Korek – rośnie opóźnienie', drv: 'Mam opóźnienie z powodu korka.', ans: 'Przyjąłem. Jedź według możliwości.' },
  { prio: false, id: 'klima', fx: 'clima', why: 'Nie działa ogrzewanie / klimatyzacja', drv: 'Zgłaszam awarię klimatyzacji w przedziale pasażerskim.', ans: 'Przyjąłem, wpiszę do raportu usterek.' },
  { prio: true, id: 'agres', fx: 'agres', why: 'Agresywny pasażer w pojeździe', drv: 'Pilne! Agresywny pasażer w pojeździe.', ans: 'Przyjąłem. Zatrzymaj się na najbliższym przystanku, nie otwieraj drzwi i czekaj na policję.' },
  { prio: true, id: 'drzewo', fx: 'tree', why: 'Drzewo przewróciło się na trasę', drv: 'Pilne! Drzewo na trasie, przejazd zablokowany.', ans: 'Przyjąłem. Wysyłam ekipę techniczną. Czekaj przed przeszkodą.' },
  { prio: true, id: 'wypadek', fx: 'crash', why: 'Wypadek drogowy przed pojazdem', drv: 'Pilne! Wypadek drogowy przed pojazdem.', ans: 'Przyjąłem. Powiadamiam policję i pogotowie. Przejedź ostrożnie.' }
];
const EMERG = [
  { txt: 'Pasażer zasłabł w pojeździe', fx: 'faint', ans: 'Centrala alarmowa. Karetka jest w drodze. Zatrzymaj pojazd, nie otwieraj drzwi – otworzysz je ratownikom.' },
  { txt: 'Awantura w pojeździe', fx: 'fight', ans: 'Centrala alarmowa. Policja jest w drodze. Nie otwieraj drzwi, dopóki policjanci nie podejdą.' },
  { txt: 'Pasażer zgłasza zadymienie', fx: 'smoke', ans: 'Centrala alarmowa. Straż pożarna w drodze. Stój i otwórz drzwi strażakom, gdy podejdą.' },
  { txt: 'Pasażer upadł przy hamowaniu', fx: 'fall', ans: 'Centrala alarmowa. Karetka jest w drodze. Nie ruszaj pojazdu, drzwi otwórz ratownikom.' }
];
// pionowy panel obok panelu kierowcy
const FKEYS = [{ k: 'F1', a: 'rtt', n: 'RTT', d: 'rozmowa', c: 'g' }, { k: 'F2', a: 'prtt', n: 'PRTT', d: 'pilna', c: 'r' }, { k: 'F3', a: 'kas', n: 'KASOW.', d: 'blokada', c: 'y' }, { k: 'F4', a: 'ca', n: 'CA', d: 'alarm', c: 'm' }];
const EV = { spk: 'int' };
const pickR = a => a[Math.random() * a.length | 0];

function annShow(keys, t) { G.ann = keys; G.annT = t; }
// automatyczna zapowiedź przystanku (głos + ikona 🔊 nad kabiną)
function annStop(txt) { UI.announce(txt); annShow(['stop'], 4); }
function evMsg(txt) { G.msgs.unshift({ t: fmtT(G.simTime), txt }); G.unread++; }
function evOn() { return !!(G.trip && G.running && !G.ended); }
function callSeq(steps) { G.callSeq = steps; G.callI = -1; G.callT = 0; }
function evTask(t) { t.T = t.t; G.evTask = t; G.stats.ev = (G.stats.ev || 0) + 1; UI.render(); }
function evDone(ok, p, txt) {
  const t = G.evTask; if (t && t.fx) t.fx.res = 0;
  G.evTask = null; if (ok) G.stats.evOk = (G.stats.evOk || 0) + 1; addScore(p, txt); G.evT = 6; UI.render();
}
function lineBusy() { return !!(G.callSeq || G.call); }

// nadanie ogłoszenia z bazy przez kierowcę (i – pozycja na liście wybranych głośników)
function playAnn(i, spk) {
  spk = spk || EV.spk;
  const a = ANN_DB[spk][i]; if (!a) return;
  if (!G.trip || G.ended) return say('Ogłoszenia z bazy – tylko w trakcie kursu');
  const txt = annTxt(a);
  UI.announce(txt); annShow([spk], 3 + txt.length / 14);
  say('📢 ' + a.n + ' – głośniki ' + SPK[spk]);
  const t = G.evTask;
  if (t && t.kind === 'ann' && t.id === a.id && t.spk === spk) evDone(true, 40, 'Ogłoszenie nadane');
}
// V – potwierdzenie komunikatu dyspozytora
function evConfirm() {
  const t = G.evTask;
  if (t && t.kind === 'ack') { G.annT = Math.min(G.annT, 1); AU.beep(1200, 0.08); return evDone(true, 15, 'Komunikat potwierdzony'); }
  say('Brak komunikatu do potwierdzenia');
}
// F1 / F2 – kierowca wywołuje dyspozytora (RTT / PRTT)
function evCall(kind) {
  if (!G.trip || G.ended || !G.running) return say('Rozmowa z dyspozytorem – tylko w trakcie kursu');
  if (lineBusy()) return say('Linia zajęta – trwa rozmowa');
  const prio = kind === 'prtt', t = G.evTask, rep = t && t.kind === 'report' ? t.r : null;
  const drv = rep ? rep.drv : prio ? 'Pilne! Proszę o kontakt.' : 'Proszę o kontakt.';
  const ans = rep ? rep.ans : prio ? 'Tu dyspozytor. Nie ma podstaw do pilnego wywołania. Używaj PRTT tylko w pilnych sprawach.' : 'Tu dyspozytor, słucham. Przyjąłem, bez uwag.';
  callSeq([{ d: prio ? 1.6 : 2.6, c: { kind, phase: 'wait' } }, { d: 1 + drv.length / 14, c: { kind, phase: 'talk', tx: true }, txt: 'Kierowca: ' + drv },
    { d: 1 + ans.length / 14, c: { kind, phase: 'talk', tx: false }, say: ans, log: ans }]);
  G.ringT = 0;
  if (rep) {
    if (rep.prio === prio) evDone(true, prio ? 35 : 25, 'Zgłoszenie ' + kind.toUpperCase());
    else evDone(true, prio ? 5 : 10, prio ? 'Zgłoszenie – niepotrzebnie PRTT' : 'Pilne zgłoszenie tylko przez RTT');
  } else if (prio && !G.trip.training) addScore(-10, 'Nieuzasadnione PRTT');
}
// F4 – wezwanie alarmowe CA (centrala alarmowa)
function evAlarm() {
  if (!G.trip || G.ended || !G.running) return say('Wezwanie alarmowe – tylko w trakcie kursu');
  if (lineBusy()) return say('Linia zajęta – trwa rozmowa');
  const t = G.evTask, real = !!(t && t.kind === 'emerg');
  if (real && G.veh.v > 0.5) return say('Najpierw zatrzymaj pojazd!');
  callSeq([{ d: 1.5, c: { kind: 'ca', phase: 'wait', step: 1 } }, { d: 1.5, c: { kind: 'ca', phase: 'wait', step: 2 } },
    { d: 3, c: { kind: 'ca', phase: 'talk', tx: true }, txt: 'Kierowca: ' + (real ? t.e.txt + ' – potrzebna pomoc.' : 'Wezwanie testowe.') },
    { d: 5, c: { kind: 'ca', phase: 'talk', tx: false }, say: real ? t.e.ans : 'Centrala alarmowa. Wezwanie bez powodu, rozłączam.' }]);
  AU.tone(660, 0.25, 'square', 0.08); AU.tone(880, 0.25, 'square', 0.08, 0.3);
  if (real) evDone(true, 40, 'Wezwanie alarmowe CA');
  else if (!G.trip.training) addScore(-15, 'Nieuzasadnione wezwanie alarmowe');
}
function fkey(a) { if (a === 'rtt' || a === 'prtt') evCall(a); else if (a === 'ca') evAlarm(); else if (a === 'kas') ctrlKey(); UI.fbar(); }
// przystanek końcowy – zadanie: ogłoszenie „Przystanek końcowy”
function evArrive(s) {
  if (s.term && evOn() && !G.evTask) evTask({ kind: 'ann', id: 'koniec', i: annIdx('int', 'koniec'), spk: 'int', t: 25, pen: 10, fail: 'Brak ogłoszenia na pętli', why: 'Pętla – pasażerowie wysiadają' });
}
// plan zadań kursu liniowego: każdy rodzaj (ogłoszenie, komunikat, RTT, PRTT, CA) co najmniej raz, w losowej kolejności i miejscach
function evPlan() {
  const w = G.world, st = w.stops; if (!st || st.length < 2) return;
  const a = st[0].x + 40, L = Math.max(60, st[st.length - 1].x - 100 - a);
  // na każdej linii: RTT, PRTT i CA (na dłuższych po dwa razy, za każdym razem inna sytuacja) + kontrola biletów
  const ks = ['ann', 'ack', 'rtt', 'prtt', 'emerg', 'ctrl'];
  if (L > 2500) ks.push('rtt', 'prtt', 'emerg');
  if (L > 5000) ks.push('ann', 'ack');
  ks.sort(() => Math.random() - 0.5);
  const span = L * 0.85;
  w.evUsed = { rep: [], em: [] };
  w.evs = ks.map((k, i) => ({ x: a + (i + 0.15 + Math.random() * 0.7) * span / ks.length, k: k === 'rtt' || k === 'prtt' ? 'report' : k, prio: k === 'prtt' }));
}
// ile metrów przed pojazdem postawić przeszkodę, żeby dało się wyhamować
function fxAhead() { const v = G.veh, b = VEH[G.mode].brake * 0.45; return clamp(30 + v.v * v.v / (2 * b), 40, 110); }
function spaceAhead(d) { const w = G.world, x = G.veh.x; return !w.turns.some(t => t.x > x - 10 && t.x < x + d + 40) && !w.rounds.some(r => r.x > x - 30 && r.x < x + d + 50) && !(w.depot && w.depot.x < x + d + 60); }
// f – zadanie z planu ({ k:'ann'|'ack'|'report'|'emerg', id?, prio?, fxAt? }), bez f – losowe
function evStart(f) {
  f = f || {};
  const k = f.k || (r => r < 0.4 ? 'ann' : r < 0.62 ? 'ack' : r < 0.88 ? 'report' : 'emerg')(Math.random()), v = G.veh;
  if (k === 'ann') {
    const pool = delayNow() > 120 ? ANN_REQ.filter(q => q.id === 'opozn') : ANN_REQ.filter(q => q.id !== 'opozn'), q = f.id ? ANN_REQ.find(q => q.id === f.id) : pickR(pool), i = annIdx(q.spk, q.id);
    evMsg(`${q.why} – nadaj ogłoszenie „${ANN_DB[q.spk][i].n}” na głośniki ${SPK[q.spk]}.`); annShow(['ccDrv'], 3);
    AU.tone(988, 0.15, 'sine', 0.15); AU.tone(1319, 0.2, 'sine', 0.15, 0.15);
    evTask({ kind: 'ann', id: q.id, i, spk: q.spk, t: 45, pen: 25, fail: 'Nie nadano ogłoszenia', why: q.why });
  } else if (k === 'ack') {
    const pass = f.pass !== undefined ? !!f.pass : Math.random() < 0.5, m = pickR(pass ? CC_PASS : CC_DRV);
    annShow(pass ? ['ccDrv', 'ccPass'] : ['ccDrv'], 2 + m.length / 14); UI.announce(m); evMsg(m); AU.tone(784, 0.2, 'sine', 0.15);
    evTask({ kind: 'ack', t: 18 + m.length / 14, pen: 15, fail: 'Komunikat niepotwierdzony', txt: m, pass });
  } else if (k === 'report') {
    const used = (G.world.evUsed || { rep: [] }).rep;
    let pool = REPORTS.filter(r => f.id ? r.id === f.id : f.prio === undefined || r.prio === !!f.prio);
    if (!f.id && pool.some(r => !used.includes(r.id))) pool = pool.filter(r => !used.includes(r.id));
    const fa = f.fxAt && f.fxAt - v.x > 35, d = fa ? f.fxAt - v.x : fxAhead();
    if (!fa && !spaceAhead(d)) pool = pool.filter(r => r.fx !== 'tree' && r.fx !== 'crash') ;
    if (!pool.length) pool = REPORTS.filter(r => r.prio === !!f.prio && r.fx !== 'tree' && r.fx !== 'crash');
    const r = pickR(pool); used.push(r.id);
    AU.tone(520, 0.2, 'triangle', 0.12); AU.tone(660, 0.2, 'triangle', 0.12, 0.22); say((r.prio ? '⚠ ' : 'ℹ ') + r.why);
    evTask({ kind: 'report', r, t: r.prio ? 15 : 30, pen: r.prio ? 30 : 15, fail: 'Brak zgłoszenia do dyspozytora', fx: fxAdd(r.fx, v.x + d) });
  } else {
    const uE = (G.world.evUsed || { em: [] }).em, pe = f.id ? EMERG.filter(e => e.fx === f.id) : EMERG.filter(e => !uE.includes(e.fx)), e = pickR(pe.length ? pe : EMERG); uE.push(e.fx); AU.tone(520, 0.3, 'square', 0.1); AU.tone(520, 0.3, 'square', 0.1, 0.4); say('⚠ ' + e.txt + '!');
    evTask({ kind: 'emerg', t: 35, pen: 40, fail: 'Brak wezwania alarmowego', txt: e.txt, e, fx: fxAdd(e.fx, v.x) });
  }
}
function updateEvents(dt) {
  if (G.annT > 0 && (G.annT -= dt) <= 0) G.ann = null;
  if (G.callSeq && (G.callT -= dt) <= 0) {
    const s = G.callSeq[++G.callI];
    if (!s) { G.callSeq = null; G.call = null; }
    else { G.call = s.c; G.callT = s.d; if (s.say) UI.announce(s.say); if (s.txt) say(s.txt); if (s.log) evMsg(s.log); }
    UI.fbar();
  }
  // kierowca czeka na zgłoszenie się dyspozytora – sygnał zwrotny
  if (G.call && G.call.phase === 'wait' && G.call.kind !== 'ca' && (G.ringT = (G.ringT || 0) - dt) <= 0) { G.ringT = 1.2; AU.tone(425, 0.4, 'sine', 0.06); }
  updateFx(dt);
  updateCtrl(dt);
  if (evOn() && !G.td && !G.ctrl) { const c = G.world.evs && G.world.evs.find(e => !e.done && e.k === 'ctrl' && G.veh.x >= e.x); if (c) { c.done = true; ctrlStart(); } }
  const t = G.evTask;
  if (t) {
    if ((t.t -= dt) <= 0) evDone(false, -t.pen, t.fail);
    return;
  }
  if (!evOn() || G.toDepot || G.td || G.driverOut) return;
  if ((G.evFx || []).some(o => fxHold(o) || (o.type === 'agres' && o.res >= 0 && !o.svc && !o.left && o.stopX !== null))) return;
  if ((G.evT -= dt) > 0) return;
  const w = G.world, f = w.evs && w.evs.find(e => !e.done && e.k !== 'ctrl' && G.veh.x >= e.x);
  if (f) { f.done = true; evStart(f); }
}

// ===== Sceny zdarzeń: przeszkody, służby, dym, dymki nad pojazdem =====
// fx: { type, x (świat), res: -1 przed zgłoszeniem, potem sekundy od zgłoszenia / upływu czasu }
const FX_HOLD = { faint: 1, fall: 1, fight: 1, smoke: 1 };
function fxAdd(type, x) {
  const o = { type, x, t: 0, res: -1, hold: !!FX_HOLD[type] };
  if (type === 'agres') { const st = G.world.stops; let j = G.ns; if (st[j] && st[j].arrived) j++; const s = st[j]; o.stopX = s && j < st.length - 1 ? s.x : null; }
  G.evFx.push(o); return o;
}
function fxTree(o) { return o.type === 'tree' && !(o.res > 9); }
function fxHold(o) { return !!(o.hold && !o.left && o.res >= 0 && !(o.svc && o.svc.st === 'done')); }
// służby wezwane przez CA / PRTT: przyjeżdżają, załoga podchodzi do drzwi, wchodzi do pojazdu i wraca do auta
const SVC_K = { faint: 'amb', fall: 'amb', fight: 'police', agres: 'police', smoke: 'fire' };
const SVC_COL = { amb: '#e8e8e8', police: '#1d4f91', fire: '#c81e1e' };
const SVC_N = { amb: '🚑 KARETKA', police: '👮 POLICJA', fire: '🚒 STRAŻ POŻARNA' };
const SVC_W = { amb: 'ratownicy', police: 'policjanci', fire: 'strażacy' };
function fxSolved(o) { return !!o.left || !!(o.svc && /out|go|done/.test(o.svc.st)); }
function svcDoorX() { const v = G.veh, V = VEH[G.mode]; return v.x - V.len + V.doors[V.doors.length - 1] * V.len + 0.4; }
function svcStart(o, delay) { o.svc = { st: 'wait', t: 0, delay, k: SVC_K[o.type] }; }
function updateSvc(o, dt) {
  const v = G.veh, S = o.svc; S.t += dt;
  if (S.st === 'wait') { if (S.t >= S.delay) { Object.assign(S, { st: 'come', t: 0, vx: camX - 8, px: v.x + 7, vs: 16 }); say(SVC_N[S.k] + ' przyjeżdża'); } }
  else if (S.st === 'come') { S.vx = Math.min(S.px, S.vx + Math.max(2.5, Math.min(16, (S.px - S.vx) * 0.9)) * dt); if (S.vx >= S.px - 0.05) Object.assign(S, { st: 'walk', t: 0, cx: S.px + 2, cy: 158 }); }
  else if (S.st === 'walk') {
    const dx = svcDoorX();
    if (S.cy < 188) S.cy = Math.min(188, S.cy + 16 * dt); else S.cx = Math.max(dx, S.cx - 1.6 * dt);
    if (S.cy >= 188 && S.cx <= dx + 0.01) { S.st = 'door'; S.t = 0; say(SVC_N[S.k] + ' – ' + SVC_W[S.k] + ' przy drzwiach: otwórz drzwi (E)'); AU.beep(1000, 0.08); }
  }
  else if (S.st === 'door') { if (v.doors >= 0.99) { S.st = 'in'; S.t = 0; } }
  else if (S.st === 'in') { if (S.t > (S.k === 'amb' ? 6 : 4.5)) { Object.assign(S, { st: 'out', t: 0, cx: svcDoorX() }); o.calm = true; say(S.k === 'amb' ? '🚑 Ratownicy wynoszą pasażera do karetki' : S.k === 'police' ? '👮 Policja wyprowadza agresywnego pasażera' : '🚒 Strażacy opanowali zadymienie'); } }
  else if (S.st === 'out') { if (S.cx < S.px + 2) S.cx = Math.min(S.px + 2, S.cx + 1.4 * dt); else S.cy = Math.max(158, S.cy - 14 * dt); if (S.cy <= 158) { S.st = 'go'; S.t = 0; } }
  else if (S.st === 'go') { S.vs += 10 * dt; S.vx += S.vs * dt * (S.t < 0.5 ? S.t * 2 : 1); if (S.t > 3.5) { S.st = 'done'; addScore(20, 'Interwencja służb zakończona'); say('Służby odjechały – zamknij drzwi (E) i jedź dalej'); } }
}
// blokada drzwi: { msg } – nie otwierać; 'svc' – załoga przy drzwiach (można otworzyć poza przystankiem); 'busy' – służby w pojeździe
function evDoorGate() {
  for (const o of G.evFx || []) {
    if (!SVC_K[o.type] || o.left || o.res < 0 || (o.type === 'agres' && o.stopX === null)) continue;
    const st = o.svc ? o.svc.st : '';
    if (!st || st === 'wait' || st === 'come' || st === 'walk') return { msg: o.type === 'agres' || o.type === 'fight' ? '👮 Nie otwieraj drzwi – czekaj na policję' : o.type === 'smoke' ? '🚒 Czekaj, aż strażacy podejdą do drzwi' : '🚑 Czekaj, aż ratownicy podejdą do drzwi' };
    if (st === 'door') return 'svc';
    if (st === 'in' || st === 'out') return 'busy';
  }
  const c = G.ctrl; if (c && c.st === 'locked' && G.ns === c.j + 1) return { msg: '🔒 Najpierw odblokuj kasowniki (F3)' };
  return null;
}
// blokada odjazdu, dopóki służby nie skończą
function evThrBlock() {
  for (const o of G.evFx || []) if (fxHold(o)) return o.svc && o.svc.st === 'door' ? 'Otwórz drzwi służbom (E)' : 'Czekaj na służby – nie odjeżdżaj';
  return '';
}
function updateFx(dt) {
  if (!G.evFx || !G.evFx.length) return;
  const v = G.veh, V = VEH[G.mode];
  for (const o of G.evFx) {
    o.t += dt; if (o.res >= 0) o.res += dt;
    if (fxTree(o) && v.x > o.x - 1.5) { v.x = o.x - 1.5; if (v.v > 0.5) collide('Wjazd w drzewo na trasie!'); v.v = 0; }
    if (o.type === 'crash' && G.mode === 'bus' && v.ly > 0.5 && v.x > o.x - 1 && v.x - V.len < o.x + 12) { v.x = o.x - 1; if (v.v > 0.5) collide('Najechanie na rozbite auta!'); v.v = 0; }
    if (o.hold && o.res >= 0 && !o.svc && v.v < 0.3) { o.ax = v.x; svcStart(o, 4); }
    if (o.type === 'agres' && o.res >= 0 && !o.svc && !o.left) {
      if (o.stopX === null) { if (o.res > 8) o.calm = true; }
      else {
        const d = o.stopX - v.x;
        if (v.v < 0.3 && d > -V.len * 0.3 && d < Math.max(22, V.len * 0.6)) { o.hold = true; o.ax = v.x; svcStart(o, 3); say('👮 Stoisz na przystanku z zamkniętymi drzwiami – policja w drodze'); }
        else if (d < -V.len * 0.3 - 6) { o.left = o.calm = true; addScore(-20, 'Nie zatrzymano się na przystanku dla policji'); }
      }
    }
    if (o.svc) updateSvc(o, dt);
  }
  G.evFx = G.evFx.filter(o => o.t < 900 && !(o.res > 30 && (o.x === undefined || o.x < v.x - V.len - 150) && !(o.type === 'agres' && !o.calm) && !(o.svc && o.svc.st !== 'done')));
}
// odcinki [x0, x1] (świat) zajęte przez pojazdy służb / rozbite auta / korek na drugim pasie (autobus) lub przeciwnym torze (tramwaj)
// korek w trybie tramwaju stoi na jezdni dalszej (pas 133), nie na torze – patrz jamBlocks()
function svcBlocks() {
  const out = [];
  const at = (o, wx, delay, stay, len) => { const a = o.res - delay; if (o.res < 0 || a < 0) return; const x = wx + (stay && a > stay ? (a - stay) * (a - stay) * 18 : -Math.max(0, 2.5 - a) * 70) / PX; out.push([x - 1, x + len]); };
  for (const o of G.evFx || []) {
    if (o.type === 'crash') { out.push([o.x - 1, o.x + 10]); at(o, o.x - 10, 4, 0, 6); at(o, o.x + 14, 8, 0, 6); }
    else if (o.type === 'jam') { if (G.mode !== 'tram') out.push([o.x - 1, o.x + 120 / PX]); }
    else if (o.type === 'tree') at(o, o.x + 4, 3, 13, 6);
    else if (o.svc && o.svc.vx !== undefined && o.svc.st !== 'done') out.push([o.svc.vx - 1, o.svc.vx + (o.svc.k === 'fire' ? 11 : 6)]);
  }
  return out;
}
function jamBlocks() { return G.mode === 'tram' ? (G.evFx || []).filter(o => o.type === 'jam').map(o => [o.x - 1, o.x + 120 / PX]) : []; }
// wjazd / postój / odjazd pojazdu służb: px ekranu albo null
function svcX(o, wx, delay, stay) {
  const a = o.res - delay; if (o.res < 0 || a < 0) return null;
  if (stay && a > stay) return sx(wx) + (a - stay) * (a - stay) * 18;
  return sx(wx) - Math.max(0, 2.5 - a) * 70;
}
function drawSvc(x, y, k) {
  if (x === null || x < -40 || x > W + 40) return;
  const C = { police: '#1d4f91', amb: '#f2f2ee', fire: '#c81e1e', crew: '#f08a12' }[k];
  if (k === 'fire') { car(x + 13, y, C, false, false, 'van'); car(x, y, C, false, false, 'van'); R(x + 1, y - 12, 26, 1, '#c8c8c8'); for (let i = 2; i < 26; i += 3) R(x + i, y - 13, 1, 1, '#c8c8c8'); }
  else car(x, y, C, false, false, 'van');
  if (k === 'amb') { R(x + 1, y - 5, 14, 1, '#d02020'); R(x + 6, y - 6, 1, 3, '#d02020'); R(x + 5, y - 5, 3, 1, '#d02020'); }
  if (k === 'police') R(x + 1, y - 5, 14, 1, '#f2f2f2');
  if (k === 'crew') { R(x + 1, y - 4, 14, 1, '#fff'); for (let i = 1; i < 15; i += 4) R(x + i, y - 4, 2, 1, '#c81e1e'); }
  const b = (G.clock * 6 | 0) % 2;
  E(() => {
    if (k === 'crew') { R(x + 6, y - 11, 3, 1, b ? '#ffb000' : '#6a4400'); if (b) R(x + 5, y - 12, 5, 1, 'rgba(255,176,0,0.4)'); }
    else { const c2 = k === 'police' ? '#3a7dff' : '#ff3030'; R(x + 5, y - 11, 2, 1, b ? '#3a7dff' : '#0d2a66'); R(x + 8, y - 11, 2, 1, b ? '#0d2a66' : c2); R(x + (b ? 3 : 8), y - 12, 4, 1, 'rgba(80,140,255,0.45)'); }
  });
}
function bigBubble(x, y, w, h) { x = Math.round(x - w / 2); R(x - 1, y - h - 1, w + 2, h + 2, '#222'); R(x, y - h, w, h, '#fff'); R(x + (w >> 1) - 1, y + 1, 3, 1, '#222'); R(x + (w >> 1), y, 1, 1, '#fff'); R(x + (w >> 1), y + 1, 1, 2, '#222'); return x; }
function puff(x, y, i, n, col) { const p = (G.clock * 0.5 + i / n) % 1, r = 2 + p * 4 | 0; R(x + Math.sin(p * 6 + i) * 3 - r / 2, y - p * 22, r, r, col.replace('A', (0.55 * (1 - p)).toFixed(2))); }
// layer 0 – drugi pas (za pojazdem), layer 1 – przed pojazdem i nad nim
// załoga służb: idzie do drzwi, czeka na otwarcie, wraca (karetka – z noszami, policja – z zatrzymanym)
function drawCrew(S, bl) {
  if (!/walk|door|out/.test(S.st)) return;
  const x = sx(S.cx), y = S.cy, mov = S.st === 'door' ? undefined : G.clock, col = SVC_COL[S.k], hair = S.k === 'fire' ? '#f2c318' : '#333';
  const pa = { col, skin: '#e8b48a', hair, kind: 'svc' }, pb = { col, skin: '#c8946a', hair, kind: 'svc' };
  if (S.st === 'out' && S.k === 'amb') { person(x, y, pa, mov); person(x + 15, y, pb, mov); R(x + 3, y - 6, 12, 1, '#9a9a9a'); R(x + 4, y - 8, 8, 2, '#2e86c1'); R(x + 12, y - 9, 2, 2, '#e8b48a'); R(x + 4, y - 5, 1, 2, '#666'); R(x + 13, y - 5, 1, 2, '#666'); }
  else if (S.st === 'out' && S.k === 'police') { person(x, y, pa, mov); person(x + 5, y, { col: '#8e3b2a', skin: '#e8b48a', hair: '#5a3a22', kind: 'n' }, mov); person(x + 10, y, pb, mov); }
  else { person(x, y, pa, mov); person(x + 5, y, pb, mov); }
  if (S.st === 'door' && bl) bubble(x + 3, y - 13, 'E', '#c0392b');
}
function drawEvFx(layer) {
  if (layer === 1) drawCtrl();
  if (!G.evFx || !G.evFx.length || !G.veh) return;
  const v = G.veh, V = VEH[G.mode], tram = G.mode === 'tram', yb = tram ? 178 : Math.round(LANE_Y[0] - 22 * v.ly), L1 = LANE_Y[1];
  const x0 = sx(v.x - V.len), x1 = sx(v.x), xm = (x0 + x1) / 2, top = yb - 30 - (V.tall || 0), bl = (G.clock * 4 | 0) % 2, shake = bl ? 1 : 0;
  for (const o of G.evFx) {
    if (layer === 0) {
      if (o.type === 'crash') {
        const x = sx(o.x); car(x, L1, '#c0392b', false, false); car(x + 12, L1 - 1, '#e8e8e8', true, false);
        R(x + 11, L1 - 2, 2, 1, '#9a9a9a'); R(x + 6, L1, 1, 1, '#9ec8e4'); R(x + 18, L1 + 1, 1, 1, '#9ec8e4');
        for (let i = 0; i < 4; i++) puff(x + 13, L1 - 8, i, 4, 'rgba(90,90,90,A)');
        E(() => { if (bl) { R(x, L1 - 5, 1, 1, '#ffb000'); R(x + 13, L1 - 5, 1, 1, '#ffb000'); R(x + 26, L1 - 6, 1, 1, '#ffb000'); } });
        drawSvc(svcX(o, o.x - 10, 4), L1, 'police'); drawSvc(svcX(o, o.x + 14, 8), L1, 'amb');
      } else if (o.type === 'jam') { const x = sx(o.x); ['#2e86c1', '#7d3c98', '#d4ac0d', '#566573', '#c0392b', '#17a589'].forEach((c, i) => car(x + i * 19, tram ? 133 : L1, c, false, true)); }
      else if (o.type === 'tree') drawSvc(svcX(o, o.x + 4, 3, 13), L1, 'crew');
      else if (o.svc && o.svc.vx !== undefined && o.svc.st !== 'done') drawSvc(sx(o.svc.vx), L1, o.svc.k);
    } else {
      if (o.type === 'tree' && !(o.res > 9)) {
        const x = sx(o.x), cut = o.res > 6, lc = SEASON === 'winter' ? '#6a5040' : SEASON === 'autumn' ? '#c8782a' : '#3e7a2a', ld = SEASON === 'winter' ? '#4a3428' : SEASON === 'autumn' ? '#9a4e1a' : '#2a5a1c';
        for (let i = 0; i < (cut ? 12 : 30); i++) R(x + i, 180 - i * 0.95, 3, 3, i % 4 ? '#5a3a22' : '#7a5232');
        R(x - 2, 178, 4, 3, '#4a2e1a'); R(x - 4, 180, 2, 1, '#4a2e1a');
        if (!cut) for (const [dx, dy, r, c] of [[30, -32, 8, ld], [27, -30, 6, lc], [35, -28, 6, lc], [31, -36, 5, lc], [24, -24, 4, ld]]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + dx, 180 + dy, r, 0, 7); ctx.fill(); }
        else R(x + 14, 170, 6, 6, '#5a3a22');
        if (o.res > 4 && o.res < 9.5) { person(x - 7, 188, { col: '#f08a12', skin: '#e8b48a', hair: '#333', kind: 'n' }, G.clock); person(x + 12, 188, { col: '#f08a12', skin: '#c8946a', hair: '#222', kind: 'n' }, G.clock); if (bl) E(() => { R(x + 11, 168 + Math.random() * 3, 1, 1, '#ffe060'); R(x + 13, 167, 1, 1, '#fff'); }); }
        if (Math.abs(x - x1) < W && o.res < 0) bubble(x + 8, 160, '!', '#c0392b');
      }
      if (o.type === 'door' && !(o.res > 5)) { const dx = x0 + V.doors[1] * (x1 - x0); if (bl) { R(dx, yb - 22, 8, 18, 'rgba(255,140,0,0.45)'); E(() => R(dx + 3, yb - 24 + Math.random() * 18, 1, 1, '#ffe060')); } const bx = bigBubble(dx + 4, top - 2, 11, 10); ptext('!', bx + 5.5, top - 12, '#e07000', 8, 'center'); }
      if (o.type === 'ticket' && !(o.res > 5)) { const bx = bigBubble(xm, top, 13, 10); R(bx + 3, top - 8, 7, 5, '#f2c318'); R(bx + 4, top - 7, 5, 1, '#8a6a00'); R(bx + 3, top - 8, 1, 1, '#d02020'); for (let i = 0; i < 6; i++) { R(bx + 3 + i, top - 9 + i, 1, 1, '#d02020'); R(bx + 9 - i, top - 9 + i, 1, 1, '#d02020'); } }
      if (o.type === 'clima' && !(o.res > 5)) { const bx = bigBubble(xm, top, 13, 11); R(bx + 3, top - 10, 2, 7, '#bbb'); R(bx + 3, top - 6, 2, 4, '#d02020'); R(bx + 2, top - 3, 4, 2, '#d02020'); for (let i = 0; i < 3; i++) R(bx + 7 + ((G.clock * 4 + i) | 0) % 2, top - 9 + i * 3, 3, 1, '#e07000'); }
      if (o.type === 'agres' && !o.calm) { const bx = bigBubble(xm + shake, top, 17, 10); ptext('#@!', bx + 8.5, top - 11, '#c0392b', 7, 'center'); }
      if ((o.type === 'fight') && !fxSolved(o)) { const bx = bigBubble(xm + shake, top, 17, 10); ptext('!!', bx + 8.5, top - 11, '#c0392b', 7, 'center'); }
      if ((o.type === 'faint' || o.type === 'fall') && !fxSolved(o)) { const bx = bigBubble(xm, top, 15, 9); R(bx + 3, top - 4, 8, 2, '#2e86c1'); R(bx + 11, top - 4, 2, 2, '#e8b48a'); if (bl) { R(bx + 7, top - 8, 1, 2, '#d02020'); R(bx + 7, top - 5.5, 1, 1, '#d02020'); } }
      if (o.type === 'smoke' && !fxSolved(o)) for (let i = 0; i < 6; i++) puff(xm - 10 + i * 4, yb - 26 - (V.tall || 0), i, 6, 'rgba(70,70,70,A)');
      if (o.svc) drawCrew(o.svc, bl);
    }
  }
}
// podpowiedzi: polecenia klawiszy (add) i informacje (info) – wywoływane z hints()
function evHints(add, info) {
  const t = G.evTask, v = G.veh, tr = G.trip.training;
  if (t) {
    const s = ' · ' + Math.max(0, Math.ceil(t.t)) + ' s', an = ANN_DB[t.spk] && ANN_DB[t.spk][t.i];
    if (t.kind === 'ann') { add(`📢 Nadaj „${an.n}” – głośniki ${SPK[t.spk]}: O${EV.spk !== t.spk ? ', O (głośniki)' : ''}, ${(t.i + 1) % 10}` + s, t.t < 12); info('Y', '📩 DYSPOZYTOR', t.why.toUpperCase(), 'ogłoszenie z bazy: ' + an.n); }
    else if (t.kind === 'ack') { add('Potwierdź komunikat dyspozytora (V)' + s, t.t < 6); info('', t.pass ? '📢 CC: PASAŻEROWIE' : '📞 CC: KIEROWCA', 'KOMUNIKAT DYSPOZYTORA', t.txt.replace(/^Komunikat dyspozytora: |^Szanowni pasażerowie, /, '')); }
    else if (t.kind === 'report') { add('📞 Zgłoś dyspozytorowi: ' + (tr ? (t.r.prio ? 'PRTT – pilne (F2)' : 'RTT (F1)') : 'RTT (F1) lub PRTT – pilne (F2)') + s, 1); info(t.r.prio ? 'R' : 'Y', t.r.prio ? '⚠ PILNE' : 'ℹ USTERKA / UTRUDNIENIE', t.r.why.toUpperCase(), 'zgłoś przez ' + (tr ? (t.r.prio ? 'PRTT' : 'RTT') : 'RTT lub PRTT')); }
    else if (t.kind === 'emerg') { add((v.v > 0.5 ? 'Zatrzymaj pojazd i wyślij' : 'Wyślij') + ' wezwanie alarmowe CA (F4)' + s, 1); info('R', '⚠ ' + t.txt.toUpperCase(), 'WEZWIJ POMOC – CA (F4)'); }
  }
  for (const o of G.evFx || []) {
    const d = o.x - v.x;
    if (fxTree(o) && d < 40 && d > -2) { info('R', '🌳 DRZEWO NA TRASIE · ' + Math.max(0, Math.round(d)) + ' m', o.res >= 0 ? 'EKIPA USUWA… CZEKAJ' : 'STÓJ'); add('Zatrzymaj się przed drzewem' + (o.res >= 0 ? ' – czekaj na ekipę' : ''), 1); }
    const S = o.svc, N = SVC_N[SVC_K[o.type]];
    if (fxHold(o)) {
      const st = S ? S.st : '';
      if (st === 'door') { info('R', N + ' PRZY DRZWIACH', 'OTWÓRZ DRZWI (E)'); add('Otwórz drzwi – ' + SVC_W[S.k] + ' czekają (E)', 1); }
      else if (st === 'in') info('Y', N + ' W POJEŹDZIE', 'NIE ZAMYKAJ DRZWI');
      else if (st === 'out' || st === 'go') info('Y', N, 'INTERWENCJA KOŃCZY SIĘ…');
      else { info('Y', N + ' W DRODZE', 'DRZWI ZAMKNIĘTE · NIE ODJEŻDŻAJ'); add((v.v > 0.3 ? 'Zatrzymaj pojazd – ' : 'Stój z zamkniętymi drzwiami – ') + 'czekaj na służby', 1); }
    }
    if (o.type === 'agres' && o.res >= 0 && !o.svc && !o.left && o.stopX !== null) { const d = Math.max(0, Math.round(o.stopX - v.x)); info('R', '👮 ZATRZYMAJ SIĘ NA PRZYSTANKU', 'NIE OTWIERAJ DRZWI' + (d < 300 ? ' · ' + d + ' m' : '')); add('Zatrzymaj się na najbliższym przystanku – drzwi zamknięte, czekaj na policję', 1); }
  }
  ctrlHints(add, info);
  const c = G.call;
  if (c && c.phase === 'wait') info(c.kind === 'ca' ? 'R' : '', c.kind === 'ca' ? '🆘 WEZWANIE CA' : '📞 ' + c.kind.toUpperCase(), c.kind === 'ca' ? 'ŁĄCZENIE… ' + c.step + '/2' : 'CZEKAM NA DYSPOZYTORA…');
  else if (c && c.phase === 'talk') info('', '📞 ROZMOWA ' + c.kind.toUpperCase(), c.tx ? 'MÓWI KIEROWCA' : 'MÓWI ' + (c.kind === 'ca' ? 'CENTRALA' : 'DYSPOZYTOR'));
}

// ===== Kontrola biletów: kontrolerzy wsiadają, kierowca blokuje kasowniki (F3) i odblokowuje je na następnym przystanku przed otwarciem drzwi =====
function ctrlStart() {
  const w = G.world, v = G.veh, st = w.stops; let j = G.ns;
  while (j < st.length && (st[j].arrived || st[j].x - v.x < 60)) j++;
  if (j >= st.length - 1) return;
  const s = st[j];
  G.ctrl = { st: 'wait', j, t: 0, p: [0, 1].map(i => ({ x: s.x - 5 - i * 2.4, col: '#2a2f3a', skin: SKINS[i % SKINS.length], hair: HAIRS[(i * 3) % HAIRS.length], kind: 'ctl', in: false })) };
  evMsg(`Na przystanku ${s.name} wsiądą kontrolerzy biletów. Po zamknięciu drzwi zablokuj kasowniki (F3), odblokuj je na następnym przystanku przed otwarciem drzwi.`);
  annShow(['ccDrv'], 3); AU.tone(784, 0.15, 'sine', 0.12); say('🎫 Kontrola biletów – kontrolerzy wsiądą na przystanku ' + s.name);
}
function ctrlDoors() { const v = G.veh, V = VEH[G.mode]; return V.doors.map(f => v.x - V.len + f * V.len + 0.5); }
function ctrlAtUnlock() { const c = G.ctrl, v = G.veh, V = VEH[G.mode]; if (!c || G.ns !== c.j + 1) return false; const d = G.world.stops[c.j + 1].x - v.x; return v.v < 0.3 && d > -V.len * 0.3 && d < Math.max(22, V.len * 0.6); }
function ctrlLocked() { return !!(G.ctrl && G.ctrl.st === 'locked'); }
function ctrlNeed() { const c = G.ctrl; return !!c && (c.st === 'lockreq' || (c.st === 'locked' && ctrlAtUnlock())); }
// kontrolerzy wciąż wsiadają – nie zamykać drzwi
function ctrlBoarding() { const c = G.ctrl; return !!c && c.st === 'board'; }
function updateCtrl(dt) {
  const c = G.ctrl; if (!c || c.st === 'done') return;
  const v = G.veh, w = G.world, s = w.stops[c.j], s2 = w.stops[c.j + 1];
  c.t += dt;
  if (c.st === 'wait' || c.st === 'board') {
    if (G.ns > c.j) { c.st = 'done'; addScore(-15, 'Odjazd bez kontrolerów biletów'); return; }
    if (G.ns === c.j && s.arrived && v.doors >= 0.99) {
      c.st = 'board'; const D = ctrlDoors();
      for (const p of c.p) if (!p.in) { const dx = D.reduce((a, b) => Math.abs(b - p.x) < Math.abs(a - p.x) ? b : a); p.x += Math.sign(dx - p.x) * Math.min(Math.abs(dx - p.x), 1.5 * dt); if (Math.abs(dx - p.x) < 0.05) p.in = true; }
      if (c.p.every(p => p.in)) { c.st = 'aboard'; say('🎫 Kontrolerzy w pojeździe – po zamknięciu drzwi zablokuj kasowniki (F3)'); }
    }
  } else if (c.st === 'aboard') { if (v.doors === 0) { c.st = 'lockreq'; c.t = 0; AU.beep(900, 0.08); UI.fbar(); } }
  else if (c.st === 'lockreq') { if (c.t > 25 || v.x > s.x + 80) { c.st = 'locked'; addScore(-20, 'Nie zablokowano kasowników podczas kontroli'); say('Dyspozytor zablokował kasowniki zdalnie'); UI.fbar(); } }
  else if (c.st === 'locked') { if (G.ns > c.j + 1) { c.st = 'done'; addScore(-20, 'Nie odblokowano kasowników na przystanku'); UI.fbar(); } }
  else if (c.st === 'free') {
    if (G.ns > c.j + 1 || (s2.arrived && v.doors >= 0.99)) { c.st = 'out'; c.t = 0; const D = ctrlDoors(); c.p.forEach((p, i) => { p.x = D[i ? 0 : D.length - 1]; p.d = i ? -1 : 1; }); say('🎫 Kontrolerzy wysiadają – kontrola zakończona'); }
  } else if (c.st === 'out') { for (const p of c.p) p.x += p.d * 1.3 * dt; if (c.t > 7) c.st = 'done'; }
}
// F3 – blokada / odblokowanie kasowników
function ctrlKey() {
  const c = G.ctrl;
  if (!c || c.st === 'done' || c.st === 'wait' || c.st === 'board' || c.st === 'out') return say('Blokada kasowników – tylko podczas kontroli biletów (gdy kontrolerzy są w pojeździe)');
  if (c.st === 'aboard') return say('Najpierw zamknij drzwi, potem zablokuj kasowniki');
  if (c.st === 'lockreq') { c.st = 'locked'; AU.tone(330, 0.12, 'square', 0.08); AU.tone(220, 0.18, 'square', 0.08, 0.12); say('🔒 Kasowniki zablokowane – trwa kontrola biletów'); return addScore(20, 'Kasowniki zablokowane na czas kontroli'); }
  if (c.st === 'locked') {
    if (!ctrlAtUnlock()) return say('🔒 Kasowniki odblokujesz na następnym przystanku – po zatrzymaniu, przed otwarciem drzwi');
    c.st = 'free'; AU.tone(660, 0.12, 'square', 0.08); AU.tone(880, 0.12, 'square', 0.08, 0.12); say('🔓 Kasowniki odblokowane – możesz otworzyć drzwi'); return addScore(20, 'Kasowniki odblokowane przed otwarciem drzwi');
  }
  say('Kasowniki są odblokowane');
}
function drawCtrl() {
  const c = G.ctrl; if (!c || c.st === 'done' || !G.veh) return;
  const show = c.st === 'wait' || c.st === 'board' || c.st === 'out', bl = (G.clock * 3 | 0) % 2;
  if (!show) return;
  for (const p of c.p) if (!p.in || c.st === 'out') {
    const x = sx(p.x); if (x < -10 || x > W + 10) continue;
    const mov = c.st === 'out' || (c.st === 'board' && !p.in) ? G.clock : undefined;
    person(x, 188, p, mov);
    if (c.st !== 'out' && bl) bubble(x + 2, 175, 'K', '#1d4f91');
  }
}
function ctrlHints(add, info) {
  const c = G.ctrl; if (!c || c.st === 'done') return;
  const s = G.world.stops[c.j], s2 = G.world.stops[c.j + 1], v = G.veh;
  if (c.st === 'wait' && s.x - v.x < 250) info('Y', '🎫 KONTROLA BILETÓW', 'KONTROLERZY NA PRZYST. ' + s.name.toUpperCase());
  else if (c.st === 'board') { info('Y', '🎫 KONTROLERZY WSIADAJĄ', 'NIE ZAMYKAJ DRZWI'); add('Poczekaj, aż kontrolerzy wsiądą', 1); }
  else if (c.st === 'aboard') add('Kontrolerzy w pojeździe – zamknij drzwi (E), potem zablokuj kasowniki (F3)', 1);
  else if (c.st === 'lockreq') { add('🔒 Zablokuj kasowniki na czas kontroli (F3) · ' + Math.max(0, Math.ceil(25 - c.t)) + ' s', 1); info('R', '🎫 KONTROLA BILETÓW', 'ZABLOKUJ KASOWNIKI (F3)'); }
  else if (c.st === 'locked') {
    const d = s2.x - v.x;
    if (ctrlAtUnlock()) { add('🔓 Odblokuj kasowniki (F3) przed otwarciem drzwi', 1); info('R', '🔒 KASOWNIKI ZABLOKOWANE', 'ODBLOKUJ (F3) PRZED OTWARCIEM DRZWI'); }
    else if (d < 40) info('Y', '🔒 KASOWNIKI ZABLOKOWANE', 'NA PRZYSTANKU: ODBLOKUJ (F3), POTEM DRZWI');
  }
}
