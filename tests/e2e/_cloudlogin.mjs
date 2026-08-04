/* E2E 辅助：注册临时家庭账号并写入 richs_city_cloud，
 * 使刷新后 Cloud.ensureLogin 直接通过（跳过登录门）。
 * 用法：await cloudLogin(pg); await pg.reload(...); */
export async function cloudLogin(pg, opts = {}) {
  const uname = opts.username || ('t' + Date.now().toString(36) + Math.floor(Math.random() * 10000));
  const j = await pg.evaluate(async (u) => {
    const r = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, gamePassword: '1234', parentPassword: '5678' })
    });
    return r.json();
  }, uname);
  if (!j.ok) throw new Error('cloudLogin register failed: ' + JSON.stringify(j));
  await pg.evaluate((cfg) => {
    localStorage.setItem('richs_city_cloud', JSON.stringify({ token: cfg.token, username: cfg.username, baseUpdatedAt: null }));
  }, j);
  return { username: uname, gameToken: j.token, gamePassword: '1234', parentPassword: '5678' };
}
