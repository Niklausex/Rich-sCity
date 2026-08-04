/* 家长后台 + 手动存档 E2E：
 * 1. 游戏页：顶栏💾保存按钮 / 设置面板存档卡片+家长后台链接
 * 2. /admin 首次设置账号 → 进入后台（无存档提示）
 * 3. 游戏生成存档后 → 后台显示概况 + 审批跟读发奖
 * 4. 退出 → 错误密码拒绝 → 正确密码登录
 * 5. 导出存档（下载事件+文件内容校验） → 修改进度 → 导入回滚验证
 * 6. 忘记密码重置
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const pg = await ctx.newPage();
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push('game:' + m.text()); });

// ---------- 1. 游戏页 ----------
await pg.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await pg.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await pg.reload({ waitUntil: 'networkidle' });
await pg.waitForTimeout(900);
await pg.evaluate(() => { const m = document.getElementById('modal-overlay'); if (m) m.style.display = 'none'; });
const g1 = await pg.evaluate(() => {
  const saveBtn = document.getElementById('btn-save-now');
  return { saveBtn: !!saveBtn, saveText: saveBtn ? saveBtn.textContent.trim() : '' };
});
console.log('game topbar:', JSON.stringify(g1));
await pg.click('#btn-save-now');
await pg.waitForTimeout(300);
const g2 = await pg.evaluate(() => ({
  saved: !!localStorage.getItem(GameState.SAVE_KEY),
  toast: document.getElementById('toast-box').textContent.includes('已保存')
}));
console.log('manual save:', JSON.stringify(g2));
// 设置面板
await pg.evaluate(() => UI.openPanel('settings'));
await pg.waitForTimeout(400);
const g3 = await pg.evaluate(() => ({
  exportBtn: !!document.getElementById('btn-save-export'),
  importBtn: !!document.getElementById('btn-save-import'),
  manualBtn: !!document.getElementById('btn-save-manual'),
  adminLink: !!document.querySelector('a[href="/admin"]'),
  oldGate: document.body.textContent.includes('两位数乘法') || !!document.getElementById('inp-parent-gate')
}));
console.log('settings panel:', JSON.stringify(g3));
// 造一个 pending 跟读，供后台审批
await pg.evaluate(() => { const S = Game.state; S.reading = { day: S.day, idx: 0, status: 'pending' }; S.money = 100; Game.save(); });

// ---------- 2. /admin 首次设置 ----------
const ad = await ctx.newPage();
ad.on('console', m => { if (m.type() === 'error') errs.push('admin:' + m.text()); });
await ad.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
const a1 = await ad.evaluate(() => document.body.textContent.includes('首次设置'));
console.log('setup page shown:', a1);
await ad.fill('#su-user', 'papa');
await ad.fill('#su-pw', '1234');
await ad.fill('#su-pw2', '1234');
await ad.click('#btn-setup');
await ad.waitForTimeout(600);
const a2 = await ad.evaluate(() => ({
  dash: document.body.textContent.includes('学习概况'),
  pending: document.body.textContent.includes('待确认'),
  approveBtn: !!document.getElementById('btn-approve'),
  exportBtn: !!document.getElementById('btn-export')
}));
console.log('dashboard:', JSON.stringify(a2));

// ---------- 3. 审批跟读 ----------
const moneyBefore = await ad.evaluate(() => Game.state.money);
await ad.click('#btn-approve');
await ad.waitForTimeout(400);
const a3 = await ad.evaluate(() => ({
  money: Game.state.money,
  status: Game.state.reading.status,
  approvedShown: document.getElementById('reading-slot').textContent.includes('已确认')
}));
console.log('approve:', JSON.stringify({ moneyBefore, ...a3 }));

// ---------- 4. 退出/登录 ----------
await ad.click('#btn-logout');
await ad.waitForTimeout(300);
const a4 = await ad.evaluate(() => document.body.textContent.includes('请用家长账号登录'));
await ad.fill('#lg-user', 'papa');
await ad.fill('#lg-pw', 'wrong');
await ad.click('#btn-login');
await ad.waitForTimeout(400);
const a5 = await ad.evaluate(() => document.getElementById('lg-err').textContent);
await ad.fill('#lg-pw', '1234');
await ad.click('#btn-login');
await ad.waitForTimeout(500);
const a6 = await ad.evaluate(() => document.body.textContent.includes('学习概况'));
console.log('login flow:', JSON.stringify({ loginPage: a4, wrongPwErr: a5, reLogin: a6 }));

// ---------- 5. 导出 → 改进度 → 导入回滚 ----------
const [download] = await Promise.all([ad.waitForEvent('download'), ad.click('#btn-export')]);
const fpath = '/tmp/richs_save_test.json';
await download.saveAs(fpath);
const exported = JSON.parse(fs.readFileSync(fpath, 'utf-8'));
console.log('export:', JSON.stringify({ game: exported._game, ver: exported._ver, day: exported.save.day, money: exported.save.money }));
// 篡改当前进度
await ad.evaluate(() => { Game.state.money = 77777; Game.save(); });
// 导入（覆盖 confirm）
await ad.evaluate(() => { window.confirm = () => true; });
const [fileChooser] = await Promise.all([ad.waitForEvent('filechooser'), ad.click('#btn-import')]);
await fileChooser.setFiles(fpath);
await ad.waitForTimeout(1500); // 等 reload
await ad.waitForLoadState('networkidle');
await ad.waitForTimeout(500);
const a7 = await ad.evaluate(() => {
  const s = JSON.parse(localStorage.getItem(GameState.SAVE_KEY));
  return { money: s.money, stillLoggedIn: document.body.textContent.includes('学习概况') };
});
console.log('import rollback:', JSON.stringify({ expected: exported.save.money, ...a7 }));

// ---------- 6. 忘记密码 ----------
await ad.evaluate(() => { sessionStorage.removeItem('richs_city_admin_session'); location.reload(); });
await ad.waitForLoadState('networkidle');
await ad.waitForTimeout(400);
await ad.evaluate(() => {
  window.prompt = (msg) => { const m = msg.match(/(\d+)\s*×\s*(\d+)/); return String(+m[1] * +m[2]); };
});
await ad.click('#lnk-forgot');
await ad.waitForTimeout(400);
const a8 = await ad.evaluate(() => ({
  setupShown: document.body.textContent.includes('首次设置'),
  authCleared: !localStorage.getItem('richs_city_admin_auth')
}));
console.log('forgot pw:', JSON.stringify(a8));

await ad.screenshot({ path: '/tmp/admin_final.png' });
console.log('console errors:', errs.length, errs.slice(0, 3));
await b.close();
