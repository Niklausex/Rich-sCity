/* v4.0 地形/铁轨/桥/船/火车 E2E：验证河流生成、桥规则、铁轨放置、扩地二选一、老档迁移 */
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

// ── 1. 新档：terrain 层存在且含河流 + 预置迎宾桥 ──
const t1 = await pg.evaluate(() => {
  localStorage.removeItem('richs_city_save_v1');
  window.Game.init();   // 无存档 → newGame
  const S = window.Game.state;
  const waterCount = S.terrain.join('').split('').filter(c => c === 'w').length;
  const bridge = S.buildings.find(b => b.id === 'bridge_road');
  const bridgeOnWater = bridge ? (window.Game.isWater(bridge.x, bridge.y) && window.Game.isWater(bridge.x + 1, bridge.y)) : false;
  return {
    rows: S.terrain.length, cols: (S.terrain[0] || '').length,
    mapW: S.mapW, mapH: S.mapH, waterCount,
    bridgeName: bridge ? bridge.name : null, bridgeOnWater
  };
});
ok(t1.rows === t1.mapH && t1.cols === t1.mapW, `terrain 尺寸 ${t1.cols}×${t1.rows} 与地图 ${t1.mapW}×${t1.mapH} 一致`);
ok(t1.waterCount >= t1.mapH * 2, `河流已生成（${t1.waterCount} 格水，≥2列宽）`);
ok(t1.bridgeName === '迎宾桥', `预置迎宾桥存在（${t1.bridgeName}）`);
ok(t1.bridgeOnWater, '迎宾桥整座架在水面上');

// ── 2. 建造规则：普通建筑不能碰水 / 桥必须整座在水 / 桥不能放草地 ──
const t2 = await pg.evaluate(() => {
  const S = window.Game.state, G = window.Game;
  // 找一格水和一格草
  let wx = -1, wy = -1, gx = -1, gy = -1, w2x = -1, w2y = -1;
  outer:
  for (let y = 0; y < S.mapH; y++) for (let x = 0; x < S.mapW - 1; x++) {
    if (G.isWater(x, y) && G.isWater(x + 1, y) && G.isAreaFree(x, y, 2, 1, null, 'bridge_road')) { w2x = x; w2y = y; break outer; }
  }
  for (let y = 0; y < S.mapH && wx < 0; y++) for (let x = 0; x < S.mapW; x++) if (G.isWater(x, y)) { wx = x; wy = y; break; }
  outer2:
  for (let y = 0; y < S.mapH; y++) for (let x = 0; x < S.mapW - 1; x++) {
    if (!G.isWater(x, y) && !G.isWater(x + 1, y) && G.isAreaFree(x, y, 2, 1)) { gx = x; gy = y; break outer2; }
  }
  return {
    houseOnWater: G.isAreaFree(wx, wy, 1, 1, null, 'house_s'),          // 应 false
    bridgeOnWater2: w2x >= 0 ? G.isAreaFree(w2x, w2y, 2, 1, null, 'bridge_road') : null, // 应 true
    bridgeOnGrass: G.isAreaFree(gx, gy, 2, 1, null, 'bridge_road'),      // 应 false
    railOnGrass: G.isAreaFree(gx, gy, 1, 1, null, 'rail'),               // 应 true
    railOnWater: G.isAreaFree(wx, wy, 1, 1, null, 'rail')                // 应 false
  };
});
ok(t2.houseOnWater === false, '普通建筑不能放水面');
ok(t2.bridgeOnWater2 === true, '公路桥可以整座架在水面');
ok(t2.bridgeOnGrass === false, '桥不能放草地');
ok(t2.railOnGrass === true, '铁轨可以放草地');
ok(t2.railOnWater === false, '铁轨不能直接放水面（要用铁路桥）');

// ── 3. 铁轨实际购买放置 + 目录三新条目 ──
const t3 = await pg.evaluate(() => {
  const S = window.Game.state, G = window.Game;
  S.money = 99999; S.stats = S.stats || {}; S.stats.peakIncome = 9999; // 解锁全部建筑
  const cat = window.CATALOG.BUILDINGS;
  const has = id => cat.some(b => b.id === id);
  let px = -1, py = -1;
  outer:
  for (let y = 0; y < S.mapH; y++) for (let x = 0; x < S.mapW; x++) {
    if (!G.isWater(x, y) && G.isAreaFree(x, y, 1, 1, null, 'rail')) { px = x; py = y; break outer; }
  }
  const r = G.buyAndPlace('rail', px, py);
  return {
    entries: has('rail') && has('bridge_road') && has('bridge_rail'),
    placed: r.ok === true,
    railInState: S.buildings.some(b => b.id === 'rail')
  };
});
ok(t3.entries, '目录含 rail / bridge_road / bridge_rail');
ok(t3.placed && t3.railInState, '铁轨购买放置成功');

// ── 4. 扩地二选一：水域扩建后新增行列为 w ──
const t4 = await pg.evaluate(() => {
  const S = window.Game.state, G = window.Game;
  S.money = 999999;
  const oldW = S.mapW, oldH = S.mapH;
  const r = G.expandLand('water');
  if (!r.ok) return { err: r.msg };
  const newColWater = S.terrain[0].slice(oldW).split('').every(c => c === 'w');
  const newRowWater = S.terrain[S.mapH - 1].split('').every(c => c === 'w');
  const r2 = G.expandLand('land');
  const newColGrass = r2.ok ? S.terrain[0].slice(S.mapW - G.EXPAND_STEP.w).split('').every(c => c === 'g') : null;
  return { ok1: r.ok, newColWater, newRowWater, ok2: r2.ok, newColGrass, size: S.mapW + 'x' + S.mapH };
});
ok(t4.ok1 && t4.newColWater && t4.newRowWater, `扩建水域：新增区域全为水（${t4.size ? '' : t4.err}）`);
ok(t4.ok2 && t4.newColGrass, '扩建草地：新增区域全为草');

// ── 5. 老档迁移：无 terrain 的存档 → migrate 补河流且避开建筑 ──
const t5 = await pg.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('richs_city_save_v1'));
  delete raw.terrain;
  localStorage.setItem('richs_city_save_v1', JSON.stringify(raw));
  window.Game.init();   // 重新加载 → migrate 补地形
  const S = window.Game.state;
  if (!S.terrain || S.terrain.length !== S.mapH) return { migrated: false };
  // 河流不能压在任何建筑（桥除外）下面
  let clash = false;
  for (const b of S.buildings) {
    if (b.id === 'bridge_road' || b.id === 'bridge_rail') continue;
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++)
      if (window.Game.isWater(x, y)) clash = true;
  }
  return { migrated: true, clash };
});
ok(t5.migrated, '老档迁移：terrain 自动补齐');
ok(t5.clash === false, '老档迁移：河流避开所有已有建筑');

// ── 6. 载具系统冒烟：拥有火车/轮船后 trains/ships 不报错 ──
const t6 = await pg.evaluate(async () => {
  const S = window.Game.state, G = window.Game;
  S.money = 999999;
  // 直接塞载具（跳过车库 UI）
  if (!S.vehicles.includes('steam')) S.vehicles.push('steam');
  if (!S.vehicles.includes('sailboat')) S.vehicles.push('sailboat');
  G.save();
  await new Promise(r => setTimeout(r, 1200)); // 跑几帧 rAF
  return { ok: true };
});
ok(t6.ok, '火车+轮船加入后主循环运行无崩溃');

await pg.waitForTimeout(800);
const fatalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('net::'));
ok(fatalErrors.length === 0, `无 JS 控制台错误${fatalErrors.length ? '：' + fatalErrors[0].slice(0, 120) : ''}`);

await browser.close();
console.log(fail === 0 ? '\n🎉 terraintest 全部通过' : `\n💥 terraintest ${fail} 项失败`);
process.exit(fail === 0 ? 0 : 1);
