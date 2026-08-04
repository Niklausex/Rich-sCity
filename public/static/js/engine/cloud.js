/* ============================================================
 * 云同步引擎（家庭账号 + 云存档）
 *  - Cloud.ensureLogin(cb)：启动门（注册/登录 UI），成功后回调
 *  - 登录后：拉云存档 vs 本地存档（新者优先，冲突弹窗确认）
 *  - Cloud.push()：防抖推送云端（game-saved 事件自动触发）
 *  - 离线回退：推送失败静默重试，不阻塞游戏
 *  - localStorage: richs_city_cloud = { token, username, baseUpdatedAt }
 * ============================================================ */
(function () {
  const CK = 'richs_city_cloud';
  const API = '/api';

  let cfg = null;        // { token, username, baseUpdatedAt }
  let pushTimer = null;
  let pushing = false;
  let dirty = false;
  let offline = false;

  function loadCfg() { try { cfg = JSON.parse(localStorage.getItem(CK)); } catch (e) { cfg = null; } return cfg; }
  function saveCfg() { localStorage.setItem(CK, JSON.stringify(cfg)); }

  async function call(path, opt = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (cfg && cfg.token) headers['Authorization'] = 'Bearer ' + cfg.token;
    const res = await fetch(API + path, { ...opt, headers });
    const j = await res.json().catch(() => ({ ok: false, msg: '网络异常' }));
    j._status = res.status;
    return j;
  }

  function deviceName() {
    const ua = navigator.userAgent;
    const os = /iPad|iPhone/.test(ua) ? 'iOS' : /Android/.test(ua) ? '安卓' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : '设备';
    const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '浏览器';
    return os + '·' + br;
  }

  /* ================= 登录门 UI ================= */
  function gateHtml(mode) {
    const isReg = mode === 'register';
    return `
    <div id="cloud-gate" style="position:fixed;inset:0;z-index:9000;background:linear-gradient(160deg,#1e3a5f,#2b6cb0);display:flex;align-items:center;justify-content:center;font-family:inherit">
      <div style="background:#fff;border-radius:20px;padding:28px 30px;width:min(400px,92vw);box-shadow:0 16px 60px rgba(0,0,0,.35)">
        <div style="text-align:center;font-size:44px">🏙️</div>
        <div style="text-align:center;font-size:21px;font-weight:900;margin-top:4px">Rich's City</div>
        <div style="text-align:center;font-size:13px;color:#888;margin-top:4px">${isReg ? '创建家庭账号，进度存云端，换设备也能接着玩' : '登录家庭账号，继续你的城市'}</div>
        <div style="margin-top:18px">
          <label style="font-size:13px;font-weight:700;color:#555">用户名</label>
          <input id="cg-user" maxlength="20" placeholder="${isReg ? '2-20位，中英文都可以' : '你的用户名'}" style="width:100%;box-sizing:border-box;border:1.5px solid #ccd3dd;border-radius:10px;padding:10px 12px;font-size:15px;margin-top:6px">
          <label style="font-size:13px;font-weight:700;color:#555;display:block;margin-top:12px">${isReg ? '游戏密码（孩子用，至少4位）' : '密码'}</label>
          <input id="cg-pw" type="password" maxlength="30" style="width:100%;box-sizing:border-box;border:1.5px solid #ccd3dd;border-radius:10px;padding:10px 12px;font-size:15px;margin-top:6px">
          ${isReg ? `
          <label style="font-size:13px;font-weight:700;color:#555;display:block;margin-top:12px">家长密码（爸爸妈妈用，进后台审批，不能和游戏密码相同）</label>
          <input id="cg-ppw" type="password" maxlength="30" style="width:100%;box-sizing:border-box;border:1.5px solid #ccd3dd;border-radius:10px;padding:10px 12px;font-size:15px;margin-top:6px">` : ''}
          <div id="cg-err" style="color:#e03131;font-size:13px;min-height:18px;margin-top:8px"></div>
          <button id="cg-go" style="width:100%;border:none;border-radius:12px;padding:12px;font-size:16px;font-weight:800;cursor:pointer;background:#2f9e44;color:#fff">${isReg ? '🚀 创建账号，开始建城！' : '🔑 登录'}</button>
          <p style="text-align:center;font-size:13px;color:#666;margin-top:12px">
            ${isReg ? '已经有账号？<a id="cg-switch" style="color:#2b6cb0;cursor:pointer;text-decoration:underline">直接登录</a>' : '还没有账号？<a id="cg-switch" style="color:#2b6cb0;cursor:pointer;text-decoration:underline">创建家庭账号</a>'}
          </p>
        </div>
      </div>
    </div>`;
  }

  function showGate(mode, done) {
    const old = document.getElementById('cloud-gate');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', gateHtml(mode));
    const $ = (id) => document.getElementById(id);
    $('cg-switch').onclick = () => showGate(mode === 'register' ? 'login' : 'register', done);
    const err = (m) => { $('cg-err').textContent = m; };
    $('cg-go').onclick = async () => {
      const user = $('cg-user').value.trim(), pw = $('cg-pw').value;
      if (!user) return err('请输入用户名');
      if (pw.length < 4) return err('密码至少4位');
      $('cg-go').disabled = true; $('cg-go').textContent = '请稍等…';
      let j;
      if (mode === 'register') {
        const ppw = $('cg-ppw').value;
        if (ppw.length < 4) { $('cg-go').disabled = false; $('cg-go').textContent = '🚀 创建账号，开始建城！'; return err('家长密码至少4位'); }
        j = await call('/auth/register', { method: 'POST', body: JSON.stringify({ username: user, gamePassword: pw, parentPassword: ppw }) });
      } else {
        j = await call('/auth/login', { method: 'POST', body: JSON.stringify({ username: user, password: pw, kind: 'game' }) });
      }
      if (!j.ok) {
        $('cg-go').disabled = false;
        $('cg-go').textContent = mode === 'register' ? '🚀 创建账号，开始建城！' : '🔑 登录';
        return err(j.msg || '出错了，再试试');
      }
      cfg = { token: j.token, username: j.username, baseUpdatedAt: null };
      saveCfg();
      document.getElementById('cloud-gate').remove();
      done();
    };
    $('cg-pw').onkeydown = (e) => { if (e.key === 'Enter') $('cg-go').click(); };
  }

  /* ================= 启动：登录 + 存档协调 ================= */
  async function ensureLogin(done) {
    loadCfg();
    if (cfg && cfg.token) {
      const me = await call('/auth/me').catch(() => ({ ok: false, _status: 0 }));
      if (me.ok) return syncOnBoot(done);
      if (me._status === 0) { offline = true; return done(); } // 离线：本地模式直接进
      cfg = null; localStorage.removeItem(CK);                 // token 失效 → 重新登录
    }
    // 无账号：本地有存档默认给"登录"入口，否则默认注册
    const hasLocal = !!localStorage.getItem(GameState.SAVE_KEY);
    showGate(hasLocal ? 'login' : 'register', () => syncOnBoot(done));
  }

  async function syncOnBoot(done) {
    const j = await call('/save').catch(() => null);
    if (!j || !j.ok) { offline = !j; return done(); }
    const localRaw = localStorage.getItem(GameState.SAVE_KEY);
    const local = localRaw ? JSON.parse(localRaw) : null;

    if (j.save == null) {
      // 云端空：本地存档（若有）首推上云
      cfg.baseUpdatedAt = null; saveCfg();
      if (local) await pushNow(local, true);
      return done();
    }
    if (!local) {
      // 本地空：直接用云端
      localStorage.setItem(GameState.SAVE_KEY, JSON.stringify(j.save));
      cfg.baseUpdatedAt = j.updatedAt; saveCfg();
      return done();
    }
    // 双方都有：一致基线直接用本地；否则挑新的，差异大时问用户
    if (cfg.baseUpdatedAt === j.updatedAt) return done(); // 本地就是从这份云端玩下来的
    const useCloud = () => {
      localStorage.setItem(GameState.SAVE_KEY, JSON.stringify(j.save));
      cfg.baseUpdatedAt = j.updatedAt; saveCfg();
      done();
    };
    const useLocal = async () => { await pushNow(local, true); done(); };
    if (j.save.day === local.day && j.save.money === local.money) return useCloud(); // 等价，取云端基线
    const cloudNewer = j.save.day !== local.day ? j.save.day > local.day : true;     // 天数优先，云端时间戳兜底
    const pick = confirm(
      `发现两份进度：\n☁️ 云端：第${j.save.day}天 · 💰${j.save.money}元（${j.device || '其他设备'}）\n💻 本机：第${local.day}天 · 💰${local.money}元\n\n【确定】用${cloudNewer ? '云端' : '本机'}（推荐，较新）\n【取消】用${cloudNewer ? '本机' : '云端'}`
    );
    const chooseCloud = cloudNewer ? pick : !pick;
    chooseCloud ? useCloud() : await useLocal();
  }

  /* ================= 推送 ================= */
  async function pushNow(saveObj, force) {
    if (!cfg || !cfg.token) return false;
    if (pushing) { dirty = true; return false; }
    pushing = true;
    try {
      const s = saveObj || JSON.parse(localStorage.getItem(GameState.SAVE_KEY) || 'null');
      if (!s) return false;
      const j = await call('/save', {
        method: 'PUT',
        body: JSON.stringify({ save: s, baseUpdatedAt: cfg.baseUpdatedAt, device: deviceName(), force: !!force })
      });
      if (j.ok) {
        cfg.baseUpdatedAt = j.updatedAt; saveCfg();
        offline = false;
        statusEvent('synced');
        return true;
      }
      if (j.conflict) {
        // 云端被别的设备改了：问用户
        const keepMine = confirm(
          `⚠️ 云端进度被其他设备更新了：\n☁️ 云端：第${j.cloud.day}天 · 💰${j.cloud.money}元（${j.cloud.device || '其他设备'}）\n💻 本机：第${s.day}天 · 💰${s.money}元\n\n【确定】用本机进度覆盖云端\n【取消】放弃本机，改用云端（页面会刷新）`
        );
        if (keepMine) return pushNow(s, true);
        const g = await call('/save');
        if (g.ok && g.save) {
          localStorage.setItem(GameState.SAVE_KEY, JSON.stringify(g.save));
          cfg.baseUpdatedAt = g.updatedAt; saveCfg();
          location.reload();
        }
        return false;
      }
      if (j._status === 401) { statusEvent('logout'); return false; }
      offline = true; statusEvent('offline');
      return false;
    } catch (e) {
      offline = true; statusEvent('offline');
      return false;
    } finally {
      pushing = false;
      if (dirty) { dirty = false; schedulePush(); }
    }
  }

  function schedulePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => pushNow(), 1500); // 防抖1.5s
  }

  function statusEvent(state) {
    document.dispatchEvent(new CustomEvent('cloud-state', { detail: { state, username: cfg ? cfg.username : null, offline } }));
  }

  /* 游戏每次 save() 都派发 game-saved → 自动云推送 */
  document.addEventListener('game-saved', schedulePush);
  /* 离线重试：每30s；页面隐藏/关闭前抢救一次 */
  setInterval(() => { if (offline && cfg && cfg.token) pushNow(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && cfg && cfg.token) pushNow(); });

  function logout() {
    if (cfg && cfg.token) call('/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem(CK);
    localStorage.removeItem(GameState.SAVE_KEY); // 防止下个账号读到旧档
    location.reload();
  }

  window.Cloud = {
    ensureLogin, push: schedulePush, pushNow, logout,
    get username() { return cfg ? cfg.username : null; },
    get online() { return !offline && !!(cfg && cfg.token); },
    get loggedIn() { return !!(cfg && cfg.token); }
  };
})();
