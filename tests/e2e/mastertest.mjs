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
  const out = { hasMastered: Array.isArray(S.mastered), hasWrongPool: Array.isArray(S.wrongPool) };
  // 阶段1：答 20 题，前 10 答错、后 10 答对
  const wrongQs = [];
  for (let i = 0; i < 20; i++) {
    let dq = S.dailyQuestions.find(x => x.residentId === r.id && !x.done) || G.refillQuestion(r.id);
    const q = G.drawFor(dq);
    const correct = i >= 10;
    if (!correct) wrongQs.push(q.q);
    G.answer(dq, q, correct);
  }
  out.masteredAfter = S.mastered.length;
  out.wrongPoolAfter = S.wrongPool.length;
  // 阶段2：清空 recent 窗口影响，连抽 60 题统计：错题是否重现、已掌握是否绝迹
  S.recentQuestions = [];
  let reviewSeen = 0, masteredLeak = 0, wrongReappear = 0;
  for (let i = 0; i < 60; i++) {
    const dq = { residentId: r.id, subject: G.rollSubject(), done: false };
    const q = G.drawFor(dq);
    if (q.review) reviewSeen++;
    if (q.type !== 'match' && S.mastered.includes(q.q) && !q.review) masteredLeak++;
    if (wrongQs.includes(q.q)) wrongReappear++;
  }
  out.reviewSeen60 = reviewSeen;       // 错题复习出现次数（期望 ~18）
  out.masteredLeak = masteredLeak;     // 已掌握泄漏（期望 0）
  out.wrongReappear = wrongReappear;   // 具体错题重现次数（>0 即证明错题会回来）
  // 阶段3：把一道错题答对 → 应移出错题本
  const before = S.wrongPool.length;
  if (before) {
    const w = S.wrongPool[0];
    const dq = { residentId: r.id, subject: w.subject, done: false };
    G.answer(dq, w, true);
  }
  out.wrongPoolAfterCorrect = S.wrongPool.length;
  out.wrongPoolBefore = before;
  return out;
});
console.log(JSON.stringify(res, null, 1));
console.log('console errors:', errs.length, errs.slice(0,5));
await b.close();
