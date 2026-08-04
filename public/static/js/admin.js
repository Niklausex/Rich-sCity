/* ============================================================
 * 家长后台（/admin 独立页面）
 *  - 用户名+密码登录（首次访问设置账号；SHA-256+盐 存 localStorage）
 *  - 与游戏同源共享 localStorage 存档：审批跟读 / 作品集 / 学习概况
 *  - 存档管理：导出 / 导入 / 查看信息
 *  - 忘记密码：两位数乘法验证后重置账号
 * ============================================================ */
(function () {
  const AUTH_KEY = 'richs_city_admin_auth';
  const SESSION_KEY = 'richs_city_admin_session';
  const app = document.getElementById('app');
  const $ = (id) => document.getElementById(id);

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(toast._tm);
    toast._tm = setTimeout(() => { t.style.display = 'none'; }, 2600);
  }

  /* ---------- 密码哈希（Web Crypto SHA-256 + 随机盐） ---------- */
  async function hashPw(pw, salt) {
    const data = new TextEncoder().encode(salt + '::' + pw);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function getAuth() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch (e) { return null; }
  }
  function loggedIn() { return sessionStorage.getItem(SESSION_KEY) === '1'; }

  /* ---------- 游戏存档（只读加载，避免误建新档） ---------- */
  let hasSave = false;
  function loadGame() {
    hasSave = !!localStorage.getItem(GameState.SAVE_KEY);
    if (hasSave) Game.init(); // 有存档才 init（无存档时 init 会新建存档，必须避免）
  }

  /* ================= 视图：首次设置账号 ================= */
  function renderSetup() {
    app.innerHTML = `
      <div class="login-box">
        <div class="login-logo">🔐</div>
        <div class="login-title">家长后台 · 首次设置</div>
        <div class="login-sub">设置一个只有爸爸妈妈知道的账号密码（保存在本机浏览器）</div>
        <div class="card">
          <label>用户名</label>
          <input id="su-user" maxlength="20" placeholder="例如：papa">
          <label style="display:block;margin-top:12px">密码（至少4位）</label>
          <input id="su-pw" type="password" maxlength="30" placeholder="输入密码">
          <label style="display:block;margin-top:12px">再输一遍密码</label>
          <input id="su-pw2" type="password" maxlength="30" placeholder="确认密码">
          <div class="err" id="su-err"></div>
          <button class="btn btn-blue" id="btn-setup" style="width:100%;justify-content:center;margin-top:6px"><i class="fas fa-check"></i> 创建账号并进入</button>
        </div>
        <p class="muted" style="text-align:center;margin-top:14px"><a class="link" href="/">← 返回游戏</a></p>
      </div>`;
    $('btn-setup').onclick = async () => {
      const user = $('su-user').value.trim();
      const pw = $('su-pw').value, pw2 = $('su-pw2').value;
      if (!user) return $('su-err').textContent = '请输入用户名';
      if (pw.length < 4) return $('su-err').textContent = '密码至少4位';
      if (pw !== pw2) return $('su-err').textContent = '两次密码不一致';
      const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const hash = await hashPw(pw, salt);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user, salt, hash }));
      sessionStorage.setItem(SESSION_KEY, '1');
      toast('✅ 账号创建成功');
      renderDash();
    };
  }

  /* ================= 视图：登录 ================= */
  function renderLogin() {
    const auth = getAuth();
    app.innerHTML = `
      <div class="login-box">
        <div class="login-logo">🏛️</div>
        <div class="login-title">Rich's City · 家长后台</div>
        <div class="login-sub">请用家长账号登录</div>
        <div class="card">
          <label>用户名</label>
          <input id="lg-user" maxlength="20" autocomplete="username">
          <label style="display:block;margin-top:12px">密码</label>
          <input id="lg-pw" type="password" maxlength="30" autocomplete="current-password">
          <div class="err" id="lg-err"></div>
          <button class="btn btn-blue" id="btn-login" style="width:100%;justify-content:center;margin-top:6px"><i class="fas fa-right-to-bracket"></i> 登录</button>
          <p style="text-align:center;margin-top:12px"><a class="link" id="lnk-forgot">忘记密码？</a></p>
        </div>
        <p class="muted" style="text-align:center;margin-top:14px"><a class="link" href="/">← 返回游戏</a></p>
      </div>`;
    const doLogin = async () => {
      const user = $('lg-user').value.trim(), pw = $('lg-pw').value;
      const h = await hashPw(pw, auth.salt);
      if (user === auth.user && h === auth.hash) {
        sessionStorage.setItem(SESSION_KEY, '1');
        renderDash();
      } else {
        $('lg-err').textContent = '用户名或密码不对';
      }
    };
    $('btn-login').onclick = doLogin;
    $('lg-pw').onkeydown = (e) => { if (e.key === 'Enter') doLogin(); };
    $('lnk-forgot').onclick = () => {
      const a = 12 + Math.floor(Math.random() * 78), b = 12 + Math.floor(Math.random() * 78);
      const ans = prompt(`重置账号需要家长验证：${a} × ${b} = ?`);
      if (parseInt(ans, 10) === a * b) {
        localStorage.removeItem(AUTH_KEY);
        toast('已重置，请重新设置账号');
        renderSetup();
      } else if (ans !== null) {
        toast('答案不对哦');
      }
    };
  }

  /* ================= 视图：后台主页 ================= */
  function esc(s) { return String(s).replace(/</g, '&lt;'); }

  function readingCardHtml(S) {
    const RA = window.READ_ALOUD || [];
    const r = S.reading;
    if (r && r.day === S.day && r.status === 'pending') {
      const p = RA[r.idx % RA.length] || { title: '' };
      return `<span class="tag">⏳ 待确认</span>
        <p style="margin-top:8px">孩子说已完成今天的跟读《<b>${esc(p.title)}</b>》。请听孩子读一遍，确认后点通过（奖励 20 元 + 快乐值 5）。</p>
        <button class="btn btn-green" id="btn-approve" style="margin-top:10px"><i class="fas fa-check"></i> 确认通过，发奖励</button>`;
    }
    if (r && r.day === S.day && r.status === 'approved') {
      return `<span class="tag tag-ok">✅ 已确认</span><p style="margin-top:8px">今天的跟读已确认完成，奖励已发放。</p>`;
    }
    return `<p class="muted">孩子还没点"我完成跟读啦"，暂无待确认项。</p>`;
  }

  function renderDash() {
    loadGame();
    const auth = getAuth();
    if (!hasSave) {
      app.innerHTML = `
        <div class="topbar"><h1>🏛️ Rich's City 家长后台</h1><span class="who">👤 ${esc(auth.user)}</span>
          <button class="btn btn-gray" id="btn-logout" style="padding:6px 12px;font-size:13px">退出</button></div>
        <div class="wrap">
          <div class="card"><h3>📭 还没有游戏存档</h3>
            <p>这台浏览器上还没有孩子的游戏进度。请先<a class="link" href="/">打开游戏</a>玩一会儿，或在下面导入之前导出的存档文件。</p>
            <div class="row">
              <button class="btn btn-blue" id="btn-import"><i class="fas fa-file-import"></i> 导入存档文件</button>
              <input type="file" id="file-import" accept=".json" style="display:none">
            </div>
          </div>
        </div>`;
      $('btn-logout').onclick = logout;
      bindImport(() => renderDash());
      return;
    }
    const S = Game.state;
    const stats = S.stats || {};
    const ws = (S.writings || []).slice().reverse().slice(0, 20);
    const writingsHtml = ws.length
      ? ws.map(w => `<div class="writing"><div class="w-title">📝 《${esc(w.title)}》<span class="w-day"> · 第${w.day}天</span></div><div class="w-text">${esc(w.text)}</div></div>`).join('')
      : '<p class="muted">还没有创作作品。语文题里会随机出现"小小作家"创作题（每天最多2道）。</p>';
    const saveRaw = localStorage.getItem(GameState.SAVE_KEY) || '';
    const saveKb = (saveRaw.length / 1024).toFixed(1);

    app.innerHTML = `
      <div class="topbar"><h1>🏛️ Rich's City 家长后台</h1><span class="who">👤 ${esc(auth.user)}</span>
        <button class="btn btn-gray" id="btn-logout" style="padding:6px 12px;font-size:13px">退出</button></div>
      <div class="wrap">
        <div class="card"><h3>🎙️ 今日跟读审批</h3><div id="reading-slot">${readingCardHtml(S)}</div></div>
        <div class="card"><h3>📚 学习概况 <span class="muted" style="font-weight:400">（第${S.day}天 · ${grades(S.grade)}）</span></h3>
          <div class="stat-grid">
            <div class="stat-item"><b>${stats.totalAnswered || 0}</b><span>累计答题</span></div>
            <div class="stat-item"><b>${stats.totalAnswered ? Math.round((stats.totalRight || 0) / stats.totalAnswered * 100) : 0}%</b><span>正确率</span></div>
            <div class="stat-item"><b>${(S.wrongPool || []).length}</b><span>待复习错题</span></div>
            <div class="stat-item"><b>${(S.mastered || []).length}</b><span>已掌握</span></div>
            <div class="stat-item"><b>${(S.reviewQueue || []).length}</b><span>巩固队列</span></div>
            <div class="stat-item"><b>${(S.writings || []).length}</b><span>创作作品</span></div>
          </div>
        </div>
        <div class="card"><h3>💾 存档管理</h3>
          <p>当前存档：第 <b>${S.day}</b> 天 · 💰${S.money} 元 · ${S.buildings.length} 座建筑 · 大小 ${saveKb} KB<br>
          <span class="muted">游戏会自动保存在本机浏览器。建议定期导出存档文件备份，防止清理浏览器数据导致丢失。</span></p>
          <div class="row">
            <button class="btn btn-green" id="btn-export"><i class="fas fa-file-export"></i> 导出存档文件</button>
            <button class="btn btn-blue" id="btn-import"><i class="fas fa-file-import"></i> 导入存档文件</button>
            <input type="file" id="file-import" accept=".json" style="display:none">
          </div>
        </div>
        <div class="card"><h3>✨ 孩子的作品集（最近20篇）</h3>${writingsHtml}</div>
        <div class="card"><h3>⚙️ 账号</h3>
          <div class="row">
            <button class="btn" id="btn-chpw"><i class="fas fa-key"></i> 修改密码</button>
            <a class="btn" href="/"><i class="fas fa-gamepad"></i> 返回游戏</a>
          </div>
        </div>
      </div>`;
    $('btn-logout').onclick = logout;
    const ab = $('btn-approve');
    if (ab) ab.onclick = () => {
      const res = Game.approveReading();
      if (res.ok) {
        toast(`✅ 已确认！奖励 ${res.reward} 元已发放`);
        $('reading-slot').innerHTML = readingCardHtml(Game.state);
      } else {
        toast(res.msg || '操作失败');
      }
    };
    $('btn-export').onclick = exportSave;
    bindImport(() => renderDash());
    $('btn-chpw').onclick = changePw;
  }

  function grades(g) { return ({ 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级' })[g] || g + '年级'; }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    renderLogin();
  }

  async function changePw() {
    const auth = getAuth();
    const old = prompt('请输入当前密码：');
    if (old === null) return;
    if (await hashPw(old, auth.salt) !== auth.hash) return toast('当前密码不对');
    const pw = prompt('请输入新密码（至少4位）：');
    if (pw === null) return;
    if (pw.length < 4) return toast('密码至少4位');
    const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
    auth.salt = salt;
    auth.hash = await hashPw(pw, salt);
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    toast('✅ 密码已修改');
  }

  /* ---------- 存档导出/导入（与游戏内共用同一格式） ---------- */
  function exportSave() {
    const raw = localStorage.getItem(GameState.SAVE_KEY);
    if (!raw) return toast('没有存档可导出');
    const s = JSON.parse(raw);
    const blob = new Blob([JSON.stringify({ _game: 'richs_city', _ver: 1, _exportedAt: new Date().toISOString(), save: s }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date(), pad = (n) => String(n).padStart(2, '0');
    a.href = URL.createObjectURL(blob);
    a.download = `richs_city_第${s.day}天_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('📦 存档已导出，请保存好文件');
  }

  function bindImport(onDone) {
    const btn = $('btn-import'), file = $('file-import');
    if (!btn || !file) return;
    btn.onclick = () => file.click();
    file.onchange = () => {
      const f = file.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const s = data && data._game === 'richs_city' ? data.save : data; // 兼容裸存档 JSON
          if (!s || !Array.isArray(s.buildings) || !Array.isArray(s.residents) || typeof s.day !== 'number') {
            return toast('❌ 这不是有效的 Rich\'s City 存档文件');
          }
          if (localStorage.getItem(GameState.SAVE_KEY) &&
              !confirm(`导入将覆盖当前进度（第${Game.state ? Game.state.day : '?'}天）！\n导入的存档：第${s.day}天 · 💰${s.money}元\n确定继续吗？`)) return;
          localStorage.setItem(GameState.SAVE_KEY, JSON.stringify(s));
          toast('✅ 存档导入成功');
          setTimeout(() => location.reload(), 800); // 重载让 Game.init 走 migrate
        } catch (e) {
          toast('❌ 文件解析失败，不是有效的存档');
        }
      };
      reader.readAsText(f);
      file.value = '';
    };
    if (onDone) onDone._bound = true;
  }

  /* ================= 启动 ================= */
  if (!getAuth()) renderSetup();
  else if (loggedIn()) renderDash();
  else renderLogin();

  // 供 E2E 测试使用
  window.AdminPage = { exportSave, renderDash, renderLogin };
})();
