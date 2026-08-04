import { chromium } from 'playwright-core';
import { cloudLogin } from './_cloudlogin.mjs';
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await pg.evaluate(() => { localStorage.clear(); });
await cloudLogin(pg);
await pg.reload({ waitUntil: 'networkidle' });
await pg.waitForTimeout(800);
await pg.evaluate(() => { const m = document.getElementById('modal-overlay'); if (m) m.style.display = 'none'; });

// 1. initial map size + expand API
const t1 = await pg.evaluate(() => { const S = Game.state; return {
  mapW: S.mapW, mapH: S.mapH,
  level: Game.expandLevel(), cost: Game.expandCost(), max: Game.EXPAND_MAX
}; });
console.log('initial:', JSON.stringify(t1));

// 2. poor: expand should fail
const t2 = await pg.evaluate(() => { const S = Game.state; S.money = 100; return Game.expandLand(); });
console.log('poor expand:', JSON.stringify(t2));

// 3. rich: open build panel, card visible, click button
await pg.evaluate(() => { const S = Game.state; S.money = 10000; UI.openPanel('build'); });
await pg.waitForTimeout(400);
const t3 = await pg.evaluate(() => {
  const btn = document.getElementById('btn-expand-land');
  return { btnExists: !!btn, btnText: btn ? btn.textContent.trim() : '',
           cardText: document.body.textContent.includes('城市地块') };
});
console.log('build panel:', JSON.stringify(t3));
await pg.click('#btn-expand-land');
await pg.waitForTimeout(600);
const t4 = await pg.evaluate(() => { const S = Game.state; return {
  mapW: S.mapW, mapH: S.mapH, money: S.money,
  level: Game.expandLevel(), nextCost: Game.expandCost()
}; });
console.log('after 1st expand:', JSON.stringify(t4));

// 4. expand to max via API, button should disappear
const t5 = await pg.evaluate(() => {
  const S = Game.state;
  S.money = 99999;
  const r2 = Game.expandLand(); const r3 = Game.expandLand(); const r4 = Game.expandLand();
  return { r2ok: r2.ok, r3ok: r3.ok, r4ok: r4.ok, r4msg: r4.msg, mapW: S.mapW, mapH: S.mapH, cost: Game.expandCost() };
});
console.log('max expand:', JSON.stringify(t5));
await pg.evaluate(() => UI.openPanel('build'));
await pg.waitForTimeout(300);
const t6 = await pg.evaluate(() => ({
  btnGone: !document.getElementById('btn-expand-land'),
  maxMsg: document.body.textContent.includes('地块已扩到最大')
}));
console.log('max UI:', JSON.stringify(t6));

// 5. reload persistence
await pg.reload({ waitUntil: 'networkidle' });
await pg.waitForTimeout(800);
const t7 = await pg.evaluate(() => { const S = Game.state; return { mapW: S.mapW, mapH: S.mapH }; });
console.log('after reload:', JSON.stringify(t7));

// 6. screenshot expanded map
await pg.evaluate(() => { const m = document.getElementById('modal-overlay'); if (m) m.style.display = 'none'; });
await pg.waitForTimeout(500);
await pg.screenshot({ path: '/tmp/expand_max.png' });
console.log('console errors:', errs.length, errs.slice(0, 3));
await b.close();
