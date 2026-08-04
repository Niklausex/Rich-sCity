/* 云存档 E2E：
 * 1. 登录门 UI：注册表单显示 → 注册成功进入游戏
 * 2. 游戏保存 → 自动推送云端（game-saved 防抖）
 * 3. 设置面板云账号卡片 + 立即同步按钮
 * 4. "跨设备"：第二个浏览器 context 用同账号登录 → 拉回云存档
 * 5. 冲突：设备B推进进度后设备A旧基线推送 → 409 confirm 处理
 * 6. 退出账号：清 token+存档
 */
import { chromium } from 'playwright-core';

const b = await chromium.launch();
const errs = [];
const mk = async () => {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  pg.on('pageerror', e => errs.push('PAGEERR:' + String(e).slice(0, 200)));
  return { ctx, pg };
};
const uname = 'e2e' + Date.now().toString(36);

// ---------- 1. 登录门：注册 ----------
const A = await mk();
await A.pg.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await A.pg.evaluate(() => localStorage.clear());
await A.pg.reload({ waitUntil: 'networkidle' });
await A.pg.waitForTimeout(600);
const gate1 = await A.pg.evaluate(() => ({
  gate: !!document.getElementById('cloud-gate'),
  hasPpw: !!document.getElementById('cg-ppw'), // 无本地档默认注册模式
  gameStarted: !!(window.Game && Game.state)
}));
console.log('1 gate:', JSON.stringify(gate1));

await A.pg.fill('#cg-user', uname);
await A.pg.fill('#cg-pw', '1234');
await A.pg.fill('#cg-ppw', '5678');
await A.pg.click('#cg-go');
await A.pg.waitForTimeout(2500);
const after1 = await A.pg.evaluate(() => ({
  gateGone: !document.getElementById('cloud-gate'),
  started: !!(window.Game && Game.state),
  loggedIn: Cloud.loggedIn, username: Cloud.username
}));
console.log('1 registered:', JSON.stringify(after1));

// 关欢迎弹窗
await A.pg.evaluate(() => { const m = document.getElementById('modal-overlay'); if (m) m.style.display = 'none'; });

// ---------- 2. 保存 → 自动云推送 ----------
await A.pg.evaluate(() => { Game.state.money = 777; Game.state.day = 5; Game.save(); });
await A.pg.waitForTimeout(3000); // 等防抖1.5s + 请求
const cloud2 = await A.pg.evaluate(async () => {
  const t = JSON.parse(localStorage.getItem('richs_city_cloud'));
  const r = await fetch('/api/save', { headers: { Authorization: 'Bearer ' + t.token } });
  const j = await r.json();
  return { day: j.save && j.save.day, money: j.save && j.save.money, base: t.baseUpdatedAt, cloudUpdated: j.updatedAt };
});
console.log('2 autoPush:', JSON.stringify(cloud2), '(expect day 5 money 777, base===cloudUpdated)');

// ---------- 3. 设置面板云卡片 ----------
await A.pg.evaluate(() => UI.openPanel('settings'));
await A.pg.waitForTimeout(400);
const set3 = await A.pg.evaluate(() => ({
  card: document.body.textContent.includes('家庭账号'),
  showsUser: document.body.textContent.includes(Cloud.username),
  syncBtn: !!document.getElementById('btn-cloud-sync'),
  logoutBtn: !!document.getElementById('btn-cloud-logout')
}));
console.log('3 settings card:', JSON.stringify(set3));
await A.pg.click('#btn-cloud-sync');
await A.pg.waitForTimeout(1500);
console.log('3 manual sync clicked ok');

// ---------- 4. 跨设备：B 登录同账号拉云档 ----------
const B = await mk();
await B.pg.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await B.pg.evaluate(() => localStorage.clear());
await B.pg.reload({ waitUntil: 'networkidle' });
await B.pg.waitForTimeout(600);
// 切到登录模式
await B.pg.evaluate(() => { if (document.getElementById('cg-ppw')) document.getElementById('cg-switch').click(); });
await B.pg.waitForTimeout(300);
await B.pg.fill('#cg-user', uname);
await B.pg.fill('#cg-pw', '1234');
await B.pg.click('#cg-go');
await B.pg.waitForTimeout(2500);
const dev4 = await B.pg.evaluate(() => ({
  gateGone: !document.getElementById('cloud-gate'),
  day: Game.state.day, money: Game.state.money
}));
console.log('4 crossDevice:', JSON.stringify(dev4), '(expect day 5 money 777)');
await B.pg.evaluate(() => { const m = document.getElementById('modal-overlay'); if (m) m.style.display = 'none'; });

// ---------- 5. 冲突：B 推进 → A 旧基线推送 ----------
await B.pg.evaluate(() => { Game.state.money = 999; Game.state.day = 6; Game.save(); });
await B.pg.waitForTimeout(3000); // B 上云
// A 用旧 baseUpdatedAt 推送：confirm 返回 false = 放弃本机用云端（页面会真实 reload）
await A.pg.evaluate(() => {
  window.confirm = () => false; // 选云端
  Game.state.money = 111; Game.state.day = 5;
  Cloud.pushNow(); // 冲突 → 拉云端 → location.reload()
});
await A.pg.waitForTimeout(4000); // 等冲突处理 + reload + 重新登录同步
const conflict5 = await A.pg.evaluate(() => {
  const local = JSON.parse(localStorage.getItem(GameState.SAVE_KEY));
  return { localDay: local.day, localMoney: local.money, stillLoggedIn: Cloud.loggedIn };
});
console.log('5 conflict(chose cloud):', JSON.stringify(conflict5), '(expect local day 6 money 999, loggedIn)');

// 冲突另一支：A 强制覆盖
const conflict5b = await A.pg.evaluate(async () => {
  window.confirm = () => true; // 用本机覆盖云端
  Game.state.money = 555; Game.state.day = 7; Game.save._noop = 1;
  localStorage.setItem(GameState.SAVE_KEY, JSON.stringify(Game.state.toJSON ? Game.state.toJSON() : JSON.parse(JSON.stringify({ ...Game.state }))));
  const cfg = JSON.parse(localStorage.getItem('richs_city_cloud'));
  cfg.baseUpdatedAt = 1; localStorage.setItem('richs_city_cloud', JSON.stringify(cfg)); // 伪造旧基线（页面内 cfg 需重登，直接 API 验证）
  const t = cfg.token;
  const r = await fetch('/api/save', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ save: { day: 7, money: 555, buildings: [], residents: [] }, baseUpdatedAt: 1, device: 'e2e-A' }) });
  const j1 = await r.json();
  const r2 = await fetch('/api/save', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ save: { day: 7, money: 555, buildings: [], residents: [] }, baseUpdatedAt: 1, force: true, device: 'e2e-A' }) });
  const j2 = await r2.json();
  return { firstConflict: j1.conflict === true, forceOk: j2.ok === true };
});
console.log('5b force overwrite:', JSON.stringify(conflict5b), '(expect firstConflict true, forceOk true)');

// ---------- 6. 退出账号（真实 reload 后回到登录门） ----------
await B.pg.evaluate(() => { window.confirm = () => true; Cloud.logout(); });
await B.pg.waitForTimeout(2000);
const out6 = await B.pg.evaluate(() => ({
  tokenGone: !localStorage.getItem('richs_city_cloud'),
  saveGone: !localStorage.getItem('richs_city_save_v1') && !localStorage.getItem(GameState.SAVE_KEY),
  gateBack: !!document.getElementById('cloud-gate')
}));
console.log('6 logout:', JSON.stringify(out6));

console.log('console errors:', errs.length ? errs : 'NONE');
await b.close();
