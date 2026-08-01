import { chromium } from 'playwright-core';
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1400, height: 900 } });
const errs = [];
pg.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,200)); });
pg.on('pageerror', e => errs.push('PAGEERR: ' + String(e).slice(0,200)));
await pg.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await pg.waitForTimeout(2500);
const res = await pg.evaluate(() => {
  const G = window.Game, S = G.state;
  const r = S.residents[0];
  if (!r) return { err: 'no residents' };
  const out = { limit: G.DAILY_LIMIT, initialPending: G.pendingQuestions().length, residents: S.residents.length };
  const subjSeen = {};
  let answered = 0; const moneyBefore = S.money;
  for (let i = 0; i < 60; i++) {
    if (!G.canAsk(r.id)) break;
    let dq = S.dailyQuestions.find(x => x.residentId === r.id && !x.done);
    if (!dq) dq = G.refillQuestion(r.id);
    if (!dq) break;
    const q = G.drawFor(dq);
    if (!q || !q.q) return { err: 'draw failed at ' + i };
    subjSeen[q.subject] = (subjSeen[q.subject]||0)+1;
    S.recentQuestions.push(q.q);
    G.answer(dq, q, true);
    answered++;
  }
  out.answered = answered;
  out.askedToday = G.askedCount(r.id);
  out.canAskAfter = G.canAsk(r.id);
  out.refillAfterLimit = G.refillQuestion(r.id);
  out.moneyGain = S.money - moneyBefore;
  out.recentLen = S.recentQuestions.length;
  out.subjSeen = subjSeen;
  return out;
});
console.log(JSON.stringify(res, null, 1));
console.log('console errors:', errs.length, errs.slice(0,5));
await b.close();
