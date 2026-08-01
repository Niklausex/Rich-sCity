import { chromium } from 'playwright-core';

const b = await chromium.launch({ headless: true });
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 200)));

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
// 关闭开局欢迎弹窗
await page.evaluate(() => { const o = document.getElementById('modal-overlay'); if (o) o.style.display = 'none'; });
await page.waitForTimeout(300);

// 1. reading panel
await page.click('.side-btn[data-panel="reading"]');
await page.waitForTimeout(600);
const readingUI = await page.evaluate(() => {
  const t = document.getElementById('panel-title')?.textContent || '';
  const hasPlay = !!document.getElementById('btn-read-play');
  const hasDone = !!document.getElementById('btn-read-done');
  const text = document.getElementById('read-text')?.textContent?.slice(0, 60);
  return { title: t.trim(), hasPlay, hasDone, text };
});
console.log('READING PANEL:', JSON.stringify(readingUI));
await page.screenshot({ path: '/home/user/shot-reading.png' });

// click done
await page.click('#btn-read-done');
await page.waitForTimeout(500);
const afterDone = await page.evaluate(() => window.Game.state.reading.status);
console.log('after done status:', afterDone);

// 2. settings parent gate
await page.evaluate(() => window.UI.openPanel('settings'));
await page.waitForTimeout(500);
const gate = await page.evaluate(() => {
  const inp = document.getElementById('inp-parent-gate');
  const card = inp?.closest('.card');
  const m = card?.textContent.match(/(\d+)\s*×\s*(\d+)/);
  return m ? { a: +m[1], b: +m[2] } : null;
});
console.log('GATE:', JSON.stringify(gate));
if (gate) {
  await page.fill('#inp-parent-gate', String(gate.a * gate.b));
  await page.click('#btn-parent-gate');
  await page.waitForTimeout(600);
  const parentArea = await page.evaluate(() => {
    const wrap = document.getElementById('parent-area-wrap');
    return {
      unlocked: !!wrap,
      hasApprove: !!document.getElementById('btn-approve-reading'),
      textSnippet: wrap?.textContent.slice(0, 120)
    };
  });
  console.log('PARENT AREA:', JSON.stringify(parentArea));
  await page.screenshot({ path: '/home/user/shot-parent.png' });
  // approve
  if (parentArea.hasApprove) {
    const before = await page.evaluate(() => window.Game.state.money);
    await page.click('#btn-approve-reading');
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => ({ money: window.Game.state.money, status: window.Game.state.reading.status }));
    console.log('APPROVE via UI: +' + (after.money - before), after.status);
  }
}

// 3. force a creative question render
await page.evaluate(() => {
  const S = window.Game.state;
  const dq = S.dailyQuestions.find(q => !q.done) || { residentId: S.residents[0].id, subject: 'chinese', done: false };
  const cq = window.Questions.drawCreative([]);
  // monkey-patch drawFor once
  const orig = window.Game.drawFor.bind(window.Game);
  window.Game.drawFor = () => { window.Game.drawFor = orig; return cq; };
  document.getElementById('panel-close')?.click();
  window.Quiz.start(dq);
});
await page.waitForTimeout(600);
const createUI = await page.evaluate(() => ({
  hasTextarea: !!document.getElementById('create-input'),
  submitDisabled: document.getElementById('create-submit')?.disabled,
  q: document.querySelector('.quiz-q')?.textContent.slice(0, 50)
}));
console.log('CREATE UI:', JSON.stringify(createUI));
await page.fill('#create-input', '今天我想写一个关于会飞的小房子的故事，它带着我去了很多神奇的地方，我们一起冒险。');
await page.waitForTimeout(300);
const enabled = await page.evaluate(() => !document.getElementById('create-submit').disabled);
console.log('submit enabled after typing:', enabled);
await page.click('#create-submit');
await page.waitForTimeout(500);
const writing = await page.evaluate(() => {
  const w = window.Game.state.writings;
  return { count: w.length, last: w[w.length - 1]?.text.slice(0, 30) };
});
console.log('WRITING SAVED:', JSON.stringify(writing));
await page.screenshot({ path: '/home/user/shot-create.png' });

// 4. listen question render (🔊 button)
await page.evaluate(() => {
  const S = window.Game.state;
  const dq = { residentId: S.residents[0].id, subject: 'english', done: false };
  let lq = null;
  for (let i = 0; i < 100 && !lq; i++) {
    const q = window.Questions.drawQuestion('english', S.grade, []);
    if (q.qkey && q.qkey.startsWith('listen:')) lq = q;
  }
  const orig = window.Game.drawFor.bind(window.Game);
  window.Game.drawFor = () => { window.Game.drawFor = orig; return lq; };
  document.getElementById('modal-overlay').style.display = 'none';
  window.Quiz.start(dq);
});
await page.waitForTimeout(600);
const listenUI = await page.evaluate(() => ({
  hasSpeakBtn: !!document.getElementById('btn-speak'),
  q: document.querySelector('.quiz-q')?.textContent.slice(0, 60)
}));
console.log('LISTEN UI:', JSON.stringify(listenUI));
await page.screenshot({ path: '/home/user/shot-listen.png' });

console.log('pageerrors:', errors.length, errors.slice(0, 3));
await b.close();
