/* 家长游戏规则配置 E2E：
 * 1. 孩子端注册进游戏 → 默认规则（50题/2+级奖励/默认礼物）
 * 2. 家长后台登录 → 出现🎛️规则卡片 → 修改并保存
 * 3. 孩子端 Cloud.fetchConfig() → 规则实时生效：
 *    DAILY_LIMIT、答对奖励、礼物表、年级锁定、设置面板只读提示
 * 4. 答对一题验证奖励金额 = base + level*perLevel
 * 5. 家长恢复默认 → 孩子端回落
 */
import { chromium } from 'playwright-core';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const pg = await ctx.newPage();
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push('game:' + m.text().slice(0, 150)); });
pg.on('pageerror', e => errs.push('PAGEERR:' + String(e).slice(0, 150)));
const uname = 'cfg' + Date.now().toString(36);

// ---------- 1. 孩子端注册 ----------
await pg.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await pg.evaluate(() => localStorage.clear());
await pg.reload({ waitUntil: 'networkidle' });
await pg.waitForTimeout(600);
await pg.fill('#cg-user', uname); await pg.fill('#cg-pw', '1234'); await pg.fill('#cg-ppw', '5678');
await pg.click('#cg-go');
await pg.waitForTimeout(2500);
await pg.evaluate(() => { const m = document.getElementById('modal-overlay'); if (m) m.style.display = 'none'; });
const d1 = await pg.evaluate(() => ({
  limit: Game.DAILY_LIMIT, base: Game.config.rewardBase, grade: Game.state.grade,
  gifts: Game.giftTable().length, firstGift: Game.giftTable()[0].streak
}));
console.log('1 defaults:', JSON.stringify(d1), '(expect limit 50, base 2, gifts 5, first 10)');

// ---------- 2. 家长后台改规则 ----------
const ad = await ctx.newPage();
ad.on('console', m => { if (m.type() === 'error') errs.push('admin:' + m.text().slice(0, 150)); });
await ad.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
await ad.evaluate(() => localStorage.removeItem('richs_city_parent'));
await ad.reload({ waitUntil: 'networkidle' });
await ad.waitForTimeout(500);
await ad.fill('#lg-user', uname); await ad.fill('#lg-pw', '5678');
await ad.click('#btn-login');
await ad.waitForTimeout(1500);
const a1 = await ad.evaluate(() => ({
  cfgCard: document.body.textContent.includes('游戏规则设置'),
  gradeSel: !!document.getElementById('cf-grade'),
  giftRows: document.querySelectorAll('.gift-row').length
}));
console.log('2 admin card:', JSON.stringify(a1), '(expect card, select, 5 rows)');

// 修改：4年级锁定 / 每天8题 / 奖励 5+3×级 / 跟读100 / 删掉最后4档礼物只留1档改成5题棒棒糖
await ad.selectOption('#cf-grade', '4');
await ad.fill('#cf-daily', '8');
await ad.fill('#cf-rbase', '5');
await ad.fill('#cf-rlevel', '3');
await ad.fill('#cf-reading', '100');
await ad.evaluate(() => {
  const rows = [...document.querySelectorAll('.gift-row')];
  rows.slice(1).forEach(r => r.remove());
  const r0 = rows[0];
  r0.querySelector('.g-streak').value = '5';
  r0.querySelector('.g-name').value = '棒棒糖兑换卡';
  r0.querySelector('.g-icon').value = '🍭';
});
await ad.click('#btn-cfg-save');
await ad.waitForTimeout(1500);
const a2 = await ad.evaluate(() => ({ saved: document.body.textContent.includes('游戏规则设置') && !document.getElementById('cfg-err')?.textContent }));
console.log('2 saved:', JSON.stringify(a2));

// ---------- 3. 孩子端实时生效（手动触发轮询函数，等价于30s定时器）----------
await pg.evaluate(() => Cloud.fetchConfig());
await pg.waitForTimeout(1200);
const d3 = await pg.evaluate(() => ({
  limit: Game.DAILY_LIMIT, base: Game.config.rewardBase, perLevel: Game.config.rewardPerLevel,
  reading: Game.config.readingReward, grade: Game.state.grade, cfgGrade: Game.config.grade,
  gifts: Game.giftTable().map(g => g.streak + ':' + g.name).join(',')
}));
console.log('3 applied:', JSON.stringify(d3), '(expect limit 8, base 5, perLevel 3, reading 100, grade 4, gifts 5:棒棒糖兑换卡)');

// 设置面板：难度应为只读锁定提示
await pg.evaluate(() => UI.openPanel('settings'));
await pg.waitForTimeout(400);
const d3b = await pg.evaluate(() => ({
  locked: document.body.textContent.includes('由爸爸妈妈在家长后台设定'),
  noTabs: !document.querySelector('[data-grade]')
}));
console.log('3 settings locked:', JSON.stringify(d3b));

// ---------- 4. 答对一题奖励验证 + 礼物触发 ----------
const d4 = await pg.evaluate(() => {
  const S = Game.state, r = S.residents[0];
  r.streak = 4; r.level = 2; r.claimedGifts = [];
  const before = S.money;
  const dq = { residentId: r.id, subject: 'math', done: false };
  const res = Game.answer(dq, { q: 'test', a: '1', qkey: 'e2e' }, true);
  return { bonus: res.moneyBonus, expect: 5 + 2 * 3, gift: res.gift && res.gift.name, moneyDelta: S.money - before };
});
console.log('4 reward+gift:', JSON.stringify(d4), '(expect bonus 11, gift 棒棒糖兑换卡)');

// ---------- 5. 恢复默认 ----------
await ad.evaluate(() => { window.confirm = () => true; });
await ad.click('#btn-cfg-reset');
await ad.waitForTimeout(1500);
await pg.evaluate(() => Cloud.fetchConfig());
await pg.waitForTimeout(1000);
const d5 = await pg.evaluate(() => ({
  limit: Game.DAILY_LIMIT, base: Game.config.rewardBase,
  gifts: Game.giftTable().length, cfgGrade: Game.config.grade
}));
console.log('5 reset:', JSON.stringify(d5), '(expect limit 50, base 2, gifts 5, cfgGrade null)');

console.log('console errors:', errs.length ? errs : 'NONE');
await b.close();
