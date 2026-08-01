import { chromium } from 'playwright-core';

const b = await chromium.launch({ headless: true });
const page = await b.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message.slice(0, 200)));

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const res = await page.evaluate(() => {
  const out = {};
  const G = window.Game, S = G.state;

  // 0. basics
  out.data3Loaded = !!(window.READ_ALOUD && window.CREATIVE_PROMPTS);
  out.readAloudCount = (window.READ_ALOUD || []).length;
  out.creativeCount = (window.CREATIVE_PROMPTS || []).length;
  out.stateFields = { reviewQueue: Array.isArray(S.reviewQueue), writings: Array.isArray(S.writings), reading: 'reading' in S, createdToday: typeof S.createdToday === 'number' };

  // 1. reading flow
  const tr = G.todayReading();
  out.readingToday = tr ? { title: tr.passage.title, status: tr.status } : null;
  out.markDone = G.markReadingDone();
  out.statusAfterMark = S.reading.status;
  const moneyBefore = S.money;
  const ap = G.approveReading();
  out.approve = ap;
  out.moneyGain = S.money - moneyBefore;
  out.approveTwice = G.approveReading().ok; // should be false

  // 2. qkey dedup & listen draw
  let listen = 0, say = 0, creative = 0;
  const dq = { residentId: S.residents[0].id, subject: 'english', done: false };
  for (let i = 0; i < 200; i++) {
    const q = G.drawFor({ ...dq, subject: 'english' });
    if (q.qkey && q.qkey.startsWith('listen:')) listen++;
    if (q.say) say++;
  }
  out.listenDraws = listen; out.sayDraws = say;

  // 3. creative draw for chinese (createdToday limit)
  S.createdToday = 0;
  for (let i = 0; i < 100; i++) {
    const q = G.drawFor({ ...dq, subject: 'chinese' });
    if (q.type === 'create') { creative++; }
  }
  out.creativeDrawable = creative > 0;

  // 4. submitWriting
  const cq = window.Questions.drawCreative([]);
  const wBefore = S.writings.length;
  const r = G.submitWriting({ ...dq, subject: 'chinese' }, cq, '这是一段测试作文，超过二十个字的创作内容，用来验证保存逻辑是否正确。');
  out.writingSaved = S.writings.length === wBefore + 1;
  out.writingReward = r.correct === true && r.moneyBonus > 0;
  out.createdTodayInc = S.createdToday;
  out.createNotMastered = !S.mastered.includes(cq.qkey || cq.q);

  // 5. forgetting curve: answer a fresh question correctly -> reviewQueue
  const rqBefore = S.reviewQueue.length;
  const fq = window.Questions.drawQuestion('math', 3, S.recentQuestions.concat(S.mastered));
  G.answer({ ...dq, subject: 'math' }, fq, true);
  const item = S.reviewQueue.find(it => it.key === (fq.qkey || fq.q));
  out.reviewQueueAdded = S.reviewQueue.length === rqBefore + 1 && !!item;

  // 6. consolidate draw after 7 days
  if (item) item.day = S.day - 8;
  // remove from recent so it can be drawn
  S.recentQuestions = S.recentQuestions.filter(k => k !== item.key);
  let consolidateSeen = false;
  for (let i = 0; i < 80; i++) {
    const q = G.drawFor({ ...dq, subject: 'math' });
    if (q.review === 'consolidate') { consolidateSeen = true; 
      // 6a. consolidate correct -> removed from queue, stays mastered
      G.answer({ ...dq, subject: 'math' }, q, true);
      out.consolidateRemoved = !S.reviewQueue.some(it => it.key === (q.qkey || q.q));
      out.stillMastered = S.mastered.includes(q.qkey || q.q);
      break;
    }
  }
  out.consolidateSeen = consolidateSeen;

  // 7. consolidate wrong -> un-mastered + into wrongPool
  const fq2 = window.Questions.drawQuestion('science', 3, S.recentQuestions.concat(S.mastered));
  G.answer({ ...dq, subject: 'science' }, fq2, true);
  const it2 = S.reviewQueue.find(it => it.key === (fq2.qkey || fq2.q));
  if (it2) {
    it2.day = S.day - 10;
    S.recentQuestions = S.recentQuestions.filter(k => k !== it2.key);
    const snap = JSON.parse(JSON.stringify(it2.snap));
    snap.review = 'consolidate';
    G.answer({ ...dq, subject: 'science' }, snap, false);
    out.consolidateWrongUnmastered = !S.mastered.includes(it2.key);
    out.consolidateWrongInWrongPool = S.wrongPool.some(w => (w.qkey || w.q) === it2.key);
  }

  // 8. mastered leak re-test (1500 draws)
  let leak = 0;
  const recent = [];
  for (let i = 0; i < 1500; i++) {
    const subj = ['math', 'english', 'chinese', 'science', 'general'][i % 5];
    const q = G.drawFor({ residentId: S.residents[0].id, subject: subj, done: false });
    const k = q.qkey || q.q;
    if (!q.review && q.type !== 'match' && q.type !== 'create' && S.mastered.includes(k)) leak++;
    G.answer({ residentId: S.residents[0].id, subject: subj, done: false }, q, Math.random() < 0.8);
  }
  out.leak1500 = leak;
  out.masteredCount = S.mastered.length;
  out.reviewQueueCount = S.reviewQueue.length;
  out.wrongPoolCount = S.wrongPool.length;

  // 9. newDay resets creative + reading
  G.sleep();
  out.newDayCreatedToday = S.createdToday;
  out.newDayReadingStatus = S.reading.status;
  out.newDayReadingDay = S.reading.day === S.day;

  return out;
});

console.log(JSON.stringify(res, null, 2));
console.log('console errors:', errors.length, errors.slice(0, 5));
await b.close();
