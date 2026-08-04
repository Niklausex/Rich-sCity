/* 家长后台（云端版）E2E：
 * 1. 游戏页：注册家庭账号 → 触发跟读 pending → 上云
 * 2. /admin：错误密码拒绝 → 游戏密码进后台被拒 → 家长密码登录成功
 * 3. 后台显示学习概况 + 云存档信息 → 审批跟读发奖（服务端）
 * 4. 游戏端拉取云端 → 看到奖励到账
 * 5. 导出存档（下载校验） → 导入并覆盖云端
 * 6. 退出登录
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const pg = await ctx.newPage();
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push('game:' + m.text().slice(0, 200)); });
const uname = 'adm' + Date.now().toString(36);

// ---------- 1. 游戏页注册 + 制造待审批跟读 ----------
await pg.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await pg.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await pg.reload({ waitUntil: 'networkidle' });
await pg.waitForTimeout(600);
await pg.fill('#cg-user', uname);
await pg.fill('#cg-pw', '1234');
await pg.fill('#cg-ppw', '5678');
await pg.click('#cg-go');
await pg.waitForTimeout(2500);
await pg.evaluate(() => { const m = document.getElementById('modal-overlay'); if (m) m.style.display = 'none'; });
const s1 = await pg.evaluate(() => {
  Game.state.money = 300;
  Game.state.reading = { day: Game.state.day, idx: 0, status: 'pending' };
  Game.save();
  return { day: Game.state.day, money: Game.state.money, reading: Game.state.reading.status };
});
await pg.waitForTimeout(3000); // 等云推送
console.log('1 game setup:', JSON.stringify(s1));

// ---------- 2. /admin 登录 ----------
const ad = await ctx.newPage();
ad.on('console', m => { if (m.type() === 'error') errs.push('admin:' + m.text().slice(0, 200)); });
await ad.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
await ad.evaluate(() => localStorage.removeItem('richs_city_parent'));
await ad.reload({ waitUntil: 'networkidle' });
await ad.waitForTimeout(500);
const l1 = await ad.evaluate(() => ({ loginBox: !!document.getElementById('btn-login') }));
console.log('2 login page:', JSON.stringify(l1));

// 错误密码
await ad.fill('#lg-user', uname); await ad.fill('#lg-pw', 'wrong');
await ad.click('#btn-login'); await ad.waitForTimeout(800);
const l2 = await ad.evaluate(() => document.getElementById('lg-err').textContent);
console.log('2 wrong pw:', JSON.stringify(l2));

// 游戏密码进后台（应被拒）
await ad.fill('#lg-pw', '1234');
await ad.click('#btn-login'); await ad.waitForTimeout(800);
const l3 = await ad.evaluate(() => document.getElementById('lg-err').textContent);
console.log('2 game pw rejected:', JSON.stringify(l3));

// 家长密码登录
await ad.fill('#lg-pw', '5678');
await ad.click('#btn-login'); await ad.waitForTimeout(1500);
const l4 = await ad.evaluate(() => ({
  dash: document.body.textContent.includes('家长后台'),
  who: document.body.textContent.includes('adm'),
  hasApprove: !!document.getElementById('btn-approve'),
  showsCloud: document.body.textContent.includes('云存档')
}));
console.log('2 parent login:', JSON.stringify(l4));

// ---------- 3. 审批跟读 ----------
await ad.click('#btn-approve');
await ad.waitForTimeout(1500);
const a1 = await ad.evaluate(() => ({
  approved: document.getElementById('reading-slot').textContent.includes('已确认')
}));
console.log('3 approve:', JSON.stringify(a1));

// ---------- 4. 游戏端拉云端看到奖励 ----------
const g4 = await pg.evaluate(async () => {
  const t = JSON.parse(localStorage.getItem('richs_city_cloud'));
  const j = await (await fetch('/api/save', { headers: { Authorization: 'Bearer ' + t.token } })).json();
  return { money: j.save.money, reading: j.save.reading.status, device: j.device };
});
console.log('4 cloud after approve:', JSON.stringify(g4), '(expect money 320, approved, parent-admin)');

// ---------- 5. 导出 / 导入 ----------
const [dl] = await Promise.all([ad.waitForEvent('download'), ad.click('#btn-export')]);
const path = await dl.path();
const exported = JSON.parse(fs.readFileSync(path, 'utf8'));
console.log('5 export:', JSON.stringify({ game: exported._game, day: exported.save.day, money: exported.save.money }));

// 修改导出档再导入（覆盖云端）
exported.save.money = 8888;
const tmp = '/tmp/richs_import_e2e.json';
fs.writeFileSync(tmp, JSON.stringify(exported));
await ad.evaluate(() => { window.confirm = () => true; });
const [chooser] = await Promise.all([ad.waitForEvent('filechooser'), ad.click('#btn-import')]);
await chooser.setFiles(tmp);
await ad.waitForTimeout(2000);
const i5 = await ad.evaluate(() => ({ shows8888: document.body.textContent.includes('8888') }));
console.log('5 import:', JSON.stringify(i5));

// ---------- 6. 退出 ----------
await ad.click('#btn-logout');
await ad.waitForTimeout(600);
const o6 = await ad.evaluate(() => ({
  backToLogin: !!document.getElementById('btn-login'),
  sessGone: !localStorage.getItem('richs_city_parent')
}));
console.log('6 logout:', JSON.stringify(o6));

console.log('console errors:', errs.length ? errs : 'NONE');
await b.close();
