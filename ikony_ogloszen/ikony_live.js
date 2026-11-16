// Wycięte z MWL_THT v6.3.4 (Ver_5_0/resources/tramlive/live.js) – zamiana stanu SOMA na G.call / G.ann.
// Wywołanie (w LIVE.state(s), przy każdej paczce stanu z aplikacji):
//    G.call = callInfo(s);
//    G.ann  = annInfo(s);
// s.conn = true gdy jest połączenie z pojazdem; pozostałe pola – patrz README.md (tabela 'Wejście').

function callInfo(s) {
  const st = String(s.ccStt || ''), kd = String(s.ccKind || '');
  if (!s.conn || !st || /Nicht/i.test(st) || /Durchsa/i.test(kd)) return null;
  return {
    kind: /berfall/i.test(kd) ? 'ca' : /Prio/i.test(kd) ? 'prtt' : 'rtt',
    phase: /Verbunden/i.test(st) ? 'talk' : 'wait',
    step: /W.hlen/i.test(st) ? 1 : 2,
    tx: s.voice === 1
  };
}

// ogłoszenia (Dat_Acstc.AcousticState "źródło:wyjścia;...", źródło 4 = kierowca/baza, 7 = CC;
// wyjścia 1 = głośnik kierowcy, 3 = wewnętrzne, 5 = zewnętrzne) -> ikony jak na terminalu kierowcy
function annInfo(s) {
  if (!s.conn) return null;
  const kd = String(s.ccKind || ''), st = String(s.ccStt || '');
  const dur = /Durchsa/i.test(kd) && /Verbunden/i.test(st), out = [];
  const stop = String(s.acreq || '').split(',').map(Number).includes(34);   // 0x22 = zapowiedź przystanku
  for (const r of String(s.acstc || '').split(';')) {
    if (!r) continue;
    const [src, o] = r.split(':'), outs = String(o || '').split(',').filter(Boolean).map(Number);
    if (+src === 4 && stop) out.push('stop');
    else if (+src === 4) { const i = outs.includes(3), e = outs.includes(5); if (i || e) out.push(i && e ? 'both' : i ? 'int' : 'ext'); else if (outs.includes(1)) out.push('drv'); }
    else if (+src === 7 && dur) { if (outs.includes(3)) out.push('ccPass'); if (outs.includes(1)) out.push('ccDrv'); }
  }
  if (dur && !out.some(k => k.startsWith('cc'))) out.push('ccDrv');
  return out.length ? [...new Set(out)] : null;
}
