/* v3.9 题库扩充 E2E：验证 data4 加载、语文生成器接入、判断题合并、抽题无异常 */
import { chromium } from 'playwright-core';
import { cloudLogin } from './_cloudlogin.mjs';

const BASE = 'http://localhost:3000';
let fail = 0;
const ok = (cond, msg) => { console.log((cond ? '✅' : '❌') + ' ' + msg); if (!cond) fail++; };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const pg = await ctx.newPage();
const errors = [];
pg.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await pg.goto(BASE, { waitUntil: 'domcontentloaded' });
await cloudLogin(pg);
await pg.reload({ waitUntil: 'networkidle' });
await pg.waitForTimeout(1500);

// 1. data4 已加载
const loaded = await pg.evaluate(() => ({
  gen: !!window.ChineseGen,
  ext: !!window.JUDGE_BANK_EXT,
  sci: (window.QUESTION_BANK.science.g3 || []).length,
  gen3: (window.QUESTION_BANK.general.g3 || []).length,
  cn3: (window.QUESTION_BANK.chinese.g3 || []).length
}));
ok(loaded.gen, 'ChineseGen 生成器已加载');
ok(loaded.ext, 'JUDGE_BANK_EXT 已加载');
ok(loaded.sci >= 50, `science.g3 扩充后 ${loaded.sci} 题（≥50）`);
ok(loaded.gen3 >= 50, `general.g3 扩充后 ${loaded.gen3} 题（≥50）`);

// 2. 语文生成器在浏览器内可抽题
const cnSample = await pg.evaluate(() => {
  const out = [];
  for (let i = 0; i < 200; i++) {
    const q = window.Questions.drawQuestion('chinese', 3, []);
    if (!q || !q.q) return { err: 'null at ' + i };
    out.push(q.q);
  }
  return { unique: new Set(out).size };
});
ok(!cnSample.err && cnSample.unique >= 100, `语文连抽200道，唯一题 ${cnSample.unique} 道（≥100）`);

// 3. 判断题扩充已合并进抽题（多抽科学题应能命中扩充判断题）
const judgeHit = await pg.evaluate(() => {
  for (let i = 0; i < 300; i++) {
    const q = window.Questions.drawQuestion('science', 3, []);
    if (q.type === 'judge' && q.q.includes('向日葵')) return true;
  }
  return false;
});
ok(judgeHit, '扩充判断题（向日葵）可被抽中');

// 4. 五科各抽50道均无异常
const allOk = await pg.evaluate(() => {
  for (const s of ['math', 'chinese', 'english', 'science', 'general']) {
    for (let i = 0; i < 50; i++) {
      const q = window.Questions.drawQuestion(s, 3, []);
      if (!q || !q.type || !q.q) return s + ' failed at ' + i;
    }
  }
  return true;
});
ok(allOk === true, '五科各连抽50道无异常' + (allOk === true ? '' : '：' + allOk));

// 5. 实际 UI 答题一轮（语文），确认渲染正常
await pg.evaluate(() => {
  const S = window.Game.state;
  const dq = (S.dailyQuestions || []).find(q => !q.done) || { residentId: S.residents[0].id, subject: 'chinese', done: false };
  dq.subject = 'chinese';
  window.Quiz.start(dq);
});
await pg.waitForTimeout(800);
const quizVisible = await pg.evaluate(() => {
  const el = document.querySelector('.quiz-q');
  return el ? (el.textContent || '').slice(0, 40) : null;
});
ok(!!quizVisible, 'UI 答题弹窗正常打开：' + (quizVisible || 'N/A'));

const realErrors = errors.filter(e => !/40[139]|Failed to load resource/.test(e));
ok(realErrors.length === 0, '无控制台报错' + (realErrors.length ? '：' + realErrors[0] : ''));

await browser.close();
console.log(fail === 0 ? '\n🎉 banktest ALL PASSED' : `\n💥 ${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
