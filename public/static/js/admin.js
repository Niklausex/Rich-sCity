/* ============================================================
 * 家长后台（/admin 独立页面）· 云端版 v3.7
 *  - 用家庭账号 + 家长密码登录（云端验证，任何设备都能登录）
 *  - 数据全部来自云存档（GET /api/save），审批走服务端接口
 *  - 存档管理：从云端导出 / 导入并推送云端
 *  - 账号管理：修改家长密码 / 重置孩子的游戏密码
 * ============================================================ */
(function () {
  const PK = 'richs_city_parent'; // { token, username }
  const app = document.getElementById('app');
  const $ = (id) => document.getElementById(id);

  let sess = null;   // { token, username }
  let cloud = null;  // { save, day, money, updatedAt, device } | null（云端为空）
  let gameCfg = null; // 家长配置（null=未设置，游戏用默认值）

  const CFG_DEFAULTS = {
    grade: null, dailyLimit: 50, rewardBase: 2, rewardPerLevel: 1,
    readingReward: 20, maxCreatePerDay: 2,
    subjectWeights: { english: 30, science: 25, general: 25, math: 12, chinese: 8 },
    gifts: [
      { streak: 10, icon: '🚗', name: '小汽车玩具兑换卡', desc: '连续答对10题获得！可以找爸爸妈妈兑换一辆玩具小汽车' },
      { streak: 20, icon: '🧱', name: '乐高小套装兑换卡', desc: '连续答对20题获得！可以兑换一盒乐高小套装' },
      { streak: 30, icon: '🍦', name: '冰淇淋兑换卡', desc: '连续答对30题获得！可以兑换一个美味冰淇淋' },
      { streak: 50, icon: '🎢', name: '游乐园门票兑换卡', desc: '连续答对50题获得！可以兑换一次游乐园之旅' },
      { streak: 100, icon: '🏆', name: '超级大奖兑换卡', desc: '连续答对100题！和爸爸妈妈商量一个大心愿吧！' }
    ]
  };

  function loadSess() { try { sess = JSON.parse(localStorage.getItem(PK)); } catch (e) { sess = null; } return sess; }
  function saveSess() { localStorage.setItem(PK, JSON.stringify(sess)); }

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(toast._tm);
    toast._tm = setTimeout(() => { t.style.display = 'none'; }, 2600);
  }

  async function call(path, opt = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (sess && sess.token) headers['Authorization'] = 'Bearer ' + sess.token;
    const res = await fetch('/api' + path, { ...opt, headers });
    const j = await res.json().catch(() => ({ ok: false, msg: '网络异常' }));
    j._status = res.status;
    return j;
  }

  /* ================= 视图：登录 ================= */
  function renderLogin() {
    app.innerHTML = `
      <div class="login-box">
        <div class="login-logo">🏛️</div>
        <div class="login-title">Rich's City · 家长后台</div>
        <div class="login-sub">用家庭账号的<b>家长密码</b>登录（不是孩子的游戏密码）</div>
        <div class="card">
          <label>家庭账号用户名</label>
          <input id="lg-user" maxlength="20" autocomplete="username" placeholder="和孩子游戏里的用户名相同">
          <label style="display:block;margin-top:12px">家长密码</label>
          <input id="lg-pw" type="password" maxlength="30" autocomplete="current-password">
          <div class="err" id="lg-err"></div>
          <button class="btn btn-blue" id="btn-login" style="width:100%;justify-content:center;margin-top:6px"><i class="fas fa-right-to-bracket"></i> 登录</button>
          <p class="muted" style="margin-top:12px;font-size:12px">还没有家庭账号？在游戏首页可以创建（用户名 + 游戏密码 + 家长密码）。</p>
        </div>
        <p class="muted" style="text-align:center;margin-top:14px"><a class="link" href="/">← 返回游戏</a></p>
      </div>`;
    const doLogin = async () => {
      const user = $('lg-user').value.trim(), pw = $('lg-pw').value;
      if (!user || !pw) return $('lg-err').textContent = '请输入用户名和家长密码';
      $('btn-login').disabled = true;
      const j = await call('/auth/login', { method: 'POST', body: JSON.stringify({ username: user, password: pw, kind: 'parent' }) });
      $('btn-login').disabled = false;
      if (!j.ok) return $('lg-err').textContent = j.msg || '登录失败';
      sess = { token: j.token, username: j.username };
      saveSess();
      renderDash();
    };
    $('btn-login').onclick = doLogin;
    $('lg-pw').onkeydown = (e) => { if (e.key === 'Enter') doLogin(); };
  }

  /* ================= 视图：后台主页 ================= */
  function esc(s) { return String(s).replace(/</g, '&lt;'); }
  function grades(g) { return ({ 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级' })[g] || g + '年级'; }
  function fmtTime(ms) {
    if (!ms) return '';
    const d = new Date(ms), pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

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

  /* ---------- 游戏规则设置卡片 ---------- */
  function cfgVal() { // 当前编辑值 = 云端配置 merge 默认
    const c = gameCfg || {};
    return {
      grade: c.grade != null ? c.grade : CFG_DEFAULTS.grade,
      dailyLimit: c.dailyLimit != null ? c.dailyLimit : CFG_DEFAULTS.dailyLimit,
      rewardBase: c.rewardBase != null ? c.rewardBase : CFG_DEFAULTS.rewardBase,
      rewardPerLevel: c.rewardPerLevel != null ? c.rewardPerLevel : CFG_DEFAULTS.rewardPerLevel,
      readingReward: c.readingReward != null ? c.readingReward : CFG_DEFAULTS.readingReward,
      maxCreatePerDay: c.maxCreatePerDay != null ? c.maxCreatePerDay : CFG_DEFAULTS.maxCreatePerDay,
      subjectWeights: c.subjectWeights || { ...CFG_DEFAULTS.subjectWeights },
      gifts: (c.gifts && c.gifts.length) ? c.gifts.map(g => ({ ...g })) : CFG_DEFAULTS.gifts.map(g => ({ ...g }))
    };
  }

  function configCardHtml() {
    const v = cfgVal();
    const numRow = (id, label, val, hint) => `
      <div style="display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap">
        <label style="min-width:180px">${label}</label>
        <input type="number" id="${id}" value="${val}" style="width:90px">
        <span class="muted" style="font-size:12px">${hint || ''}</span>
      </div>`;
    const sw = v.subjectWeights;
    const giftsRows = v.gifts.map((g, i) => `
      <div class="gift-row" data-gi="${i}" style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;align-items:center">
        <input class="g-icon" value="${esc(g.icon)}" maxlength="4" style="width:52px" title="图标">
        连对 <input class="g-streak" type="number" value="${g.streak}" style="width:64px" min="2"> 题 →
        <input class="g-name" value="${esc(g.name)}" maxlength="30" style="flex:1;min-width:140px" placeholder="礼物名称">
        <input class="g-desc" value="${esc(g.desc || '')}" maxlength="80" style="flex:2;min-width:180px" placeholder="给孩子看的说明（可空）">
        <button class="btn btn-gray btn-del-gift" style="padding:4px 10px" title="删除此档">✕</button>
      </div>`).join('');
    return `
      <div class="card"><h3>🎛️ 游戏规则设置 <span class="muted" style="font-weight:400;font-size:12px">改完点保存，孩子游戏内约30秒自动生效${gameCfg ? '' : '（当前全部为默认值）'}</span></h3>
        <div style="display:flex;align-items:center;gap:10px;margin-top:6px;flex-wrap:wrap">
          <label style="min-width:180px">📚 题目难度（年级）</label>
          <select id="cf-grade">
            <option value="" ${v.grade == null ? 'selected' : ''}>跟随游戏内设置（孩子可自己调）</option>
            ${[3, 4, 5, 6].map(g => `<option value="${g}" ${v.grade === g ? 'selected' : ''}>${g}年级（锁定，孩子不能改）</option>`).join('')}
          </select>
        </div>
        ${numRow('cf-daily', '📝 每位居民每天最多答题', v.dailyLimit, '1-200 道')}
        ${numRow('cf-rbase', '💰 答对基础奖励（元）', v.rewardBase, '0-100')}
        ${numRow('cf-rlevel', '💰 每级额外加成（元/级）', v.rewardPerLevel, '实际=基础+等级×加成')}
        ${numRow('cf-reading', '🎙️ 跟读通过奖励（元）', v.readingReward, '0-500')}
        ${numRow('cf-create', '✍️ 每天创作题上限', v.maxCreatePerDay, '0-10 道，0=关闭创作题')}
        <h4 style="margin-top:14px">📊 科目出题比重（相对权重，越大越常出）</h4>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
          ${[['english', '英语'], ['science', '科学'], ['general', '通识'], ['math', '数学'], ['chinese', '语文']].map(([k, n]) =>
            `<label style="display:flex;align-items:center;gap:4px">${n}<input type="number" id="cf-sw-${k}" value="${sw[k]}" min="0" max="100" style="width:60px"></label>`).join('')}
        </div>
        <h4 style="margin-top:14px">🎁 礼物盒（连对奖励兑换卡）</h4>
        <div id="gift-list">${giftsRows}</div>
        <button class="btn btn-gray" id="btn-add-gift" style="margin-top:8px;padding:6px 12px">＋ 加一档礼物</button>
        <div class="row" style="margin-top:14px">
          <button class="btn btn-green" id="btn-cfg-save"><i class="fas fa-check"></i> 保存规则（立即下发）</button>
          <button class="btn btn-gray" id="btn-cfg-reset">恢复全部默认</button>
        </div>
        <div class="err" id="cfg-err" style="margin-top:6px"></div>
      </div>`;
  }

  function bindConfigCard() {
    const list = $('gift-list');
    if (!list) return;
    const bindDel = () => list.querySelectorAll('.btn-del-gift').forEach(b => b.onclick = () => { b.closest('.gift-row').remove(); });
    bindDel();
    $('btn-add-gift').onclick = () => {
      const div = document.createElement('div');
      div.className = 'gift-row';
      div.style.cssText = 'display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;align-items:center';
      div.innerHTML = `<input class="g-icon" value="🎁" maxlength="4" style="width:52px">
        连对 <input class="g-streak" type="number" value="15" style="width:64px" min="2"> 题 →
        <input class="g-name" value="" maxlength="30" style="flex:1;min-width:140px" placeholder="礼物名称">
        <input class="g-desc" value="" maxlength="80" style="flex:2;min-width:180px" placeholder="给孩子看的说明（可空）">
        <button class="btn btn-gray btn-del-gift" style="padding:4px 10px">✕</button>`;
      list.appendChild(div);
      bindDel();
    };
    $('btn-cfg-save').onclick = async () => {
      const err = (m) => { $('cfg-err').textContent = m; };
      err('');
      const gradeSel = $('cf-grade').value;
      const config = {
        grade: gradeSel === '' ? null : +gradeSel,
        dailyLimit: +$('cf-daily').value,
        rewardBase: +$('cf-rbase').value,
        rewardPerLevel: +$('cf-rlevel').value,
        readingReward: +$('cf-reading').value,
        maxCreatePerDay: +$('cf-create').value,
        subjectWeights: {
          english: +$('cf-sw-english').value, science: +$('cf-sw-science').value,
          general: +$('cf-sw-general').value, math: +$('cf-sw-math').value, chinese: +$('cf-sw-chinese').value
        },
        gifts: [...list.querySelectorAll('.gift-row')].map(row => ({
          icon: row.querySelector('.g-icon').value.trim() || '🎁',
          streak: +row.querySelector('.g-streak').value,
          name: row.querySelector('.g-name').value.trim(),
          desc: row.querySelector('.g-desc').value.trim()
        }))
      };
      if (config.grade == null) delete config.grade;
      for (const g of config.gifts) {
        if (!g.name) return err('每档礼物都要填名称（不要的档位请点✕删除）');
        if (!(g.streak >= 2)) return err('礼物的连对题数至少为 2');
      }
      const btn = $('btn-cfg-save'); btn.disabled = true;
      const j = await call('/config', { method: 'PUT', body: JSON.stringify({ config }) });
      btn.disabled = false;
      if (!j.ok) return err(j.msg || '保存失败');
      gameCfg = j.config;
      toast('✅ 规则已保存，孩子游戏内约30秒自动生效');
      renderDash();
    };
    $('btn-cfg-reset').onclick = async () => {
      if (!confirm('恢复全部默认规则（难度改回孩子可自调）？')) return;
      const j = await call('/config', { method: 'PUT', body: JSON.stringify({ config: {} }) });
      if (j.ok) { gameCfg = j.config; toast('✅ 已恢复默认'); renderDash(); }
      else toast(j.msg || '操作失败');
    };
  }

  async function renderDash() {
    app.innerHTML = `<div class="wrap"><div class="card"><p class="muted">⏳ 正在从云端读取数据…</p></div></div>`;
    const cj = await call('/config');
    if (cj.ok) gameCfg = cj.config;
    const j = await call('/save');
    if (j._status === 401) {
      localStorage.removeItem(PK); sess = null;
      toast('登录已过期，请重新登录');
      return renderLogin();
    }
    if (!j.ok) {
      app.innerHTML = `<div class="wrap"><div class="card"><h3>📡 网络异常</h3><p>连不上云端服务，请检查网络后<a class="link" id="lnk-retry">重试</a>。</p></div></div>`;
      $('lnk-retry').onclick = renderDash;
      return;
    }
    cloud = j.save ? j : null;

    if (!cloud) {
      app.innerHTML = `
        <div class="topbar"><h1>🏛️ Rich's City 家长后台</h1><span class="who">👤 ${esc(sess.username)}</span>
          <button class="btn btn-gray" id="btn-logout" style="padding:6px 12px;font-size:13px">退出</button></div>
        <div class="wrap">
          <div class="card"><h3>📭 云端还没有存档</h3>
            <p>孩子还没在这个家庭账号下玩过。让孩子<a class="link" href="/">打开游戏</a>登录后玩一会儿，进度会自动同步上云；或在下面导入之前导出的存档文件。</p>
            <div class="row">
              <button class="btn btn-blue" id="btn-import"><i class="fas fa-file-import"></i> 导入存档文件</button>
              <input type="file" id="file-import" accept=".json" style="display:none">
            </div>
          </div>
          ${configCardHtml()}
        </div>`;
      $('btn-logout').onclick = logout;
      bindImport();
      bindConfigCard();
      return;
    }

    const S = cloud.save;
    const stats = S.stats || {};
    const ws = (S.writings || []).slice().reverse().slice(0, 20);
    const writingsHtml = ws.length
      ? ws.map(w => `<div class="writing"><div class="w-title">📝 《${esc(w.title)}》<span class="w-day"> · 第${w.day}天</span></div><div class="w-text">${esc(w.text)}</div></div>`).join('')
      : '<p class="muted">还没有创作作品。语文题里会随机出现"小小作家"创作题（每天最多2道）。</p>';
    const saveKb = (JSON.stringify(S).length / 1024).toFixed(1);

    app.innerHTML = `
      <div class="topbar"><h1>🏛️ Rich's City 家长后台</h1><span class="who">👤 ${esc(sess.username)}</span>
        <button class="btn btn-gray" id="btn-refresh" style="padding:6px 12px;font-size:13px"><i class="fas fa-rotate"></i> 刷新</button>
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
        <div class="card"><h3>☁️ 云存档管理</h3>
          <p>云端存档：第 <b>${S.day}</b> 天 · 💰${S.money} 元 · ${S.buildings.length} 座建筑 · 大小 ${saveKb} KB<br>
          <span class="muted">最后同步：${fmtTime(cloud.updatedAt)}（来自 ${esc(cloud.device || '未知设备')}）。进度自动同步云端，换设备登录即恢复；导出文件可作额外备份。</span></p>
          <div class="row">
            <button class="btn btn-green" id="btn-export"><i class="fas fa-file-export"></i> 导出存档文件</button>
            <button class="btn btn-blue" id="btn-import"><i class="fas fa-file-import"></i> 导入并覆盖云端</button>
            <input type="file" id="file-import" accept=".json" style="display:none">
          </div>
        </div>
        ${configCardHtml()}
        <div class="card"><h3>✨ 孩子的作品集（最近20篇）</h3>${writingsHtml}</div>
        <div class="card"><h3>⚙️ 账号</h3>
          <div class="row">
            <button class="btn" id="btn-chpw"><i class="fas fa-key"></i> 修改家长密码</button>
            <button class="btn" id="btn-rspw"><i class="fas fa-child"></i> 重置孩子的游戏密码</button>
            <a class="btn" href="/"><i class="fas fa-gamepad"></i> 返回游戏</a>
          </div>
        </div>
      </div>`;
    $('btn-logout').onclick = logout;
    $('btn-refresh').onclick = renderDash;
    const ab = $('btn-approve');
    if (ab) ab.onclick = async () => {
      ab.disabled = true;
      const r = await call('/parent/approve-reading', { method: 'POST' });
      if (r.ok) {
        toast(`✅ 已确认！奖励 ${r.reward} 元已发放（云端已更新）`);
        cloud = { ...cloud, save: r.save, updatedAt: r.updatedAt };
        $('reading-slot').innerHTML = readingCardHtml(r.save);
      } else {
        ab.disabled = false;
        toast(r.msg || '操作失败');
      }
    };
    $('btn-export').onclick = exportSave;
    bindImport();
    bindConfigCard();
    $('btn-chpw').onclick = changeParentPw;
    $('btn-rspw').onclick = resetGamePw;
  }

  function logout() {
    call('/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem(PK); sess = null;
    renderLogin();
  }

  async function changeParentPw() {
    const old = prompt('请输入当前家长密码：');
    if (old === null) return;
    const pw = prompt('请输入新的家长密码（至少4位，不能和游戏密码相同）：');
    if (pw === null) return;
    const j = await call('/parent/change-password', { method: 'POST', body: JSON.stringify({ oldPassword: old, newPassword: pw }) });
    toast(j.ok ? '✅ 家长密码已修改' : (j.msg || '修改失败'));
  }

  async function resetGamePw() {
    const pw = prompt('孩子忘记游戏密码了？输入新的游戏密码（至少4位）：\n（重置后孩子的设备需要用新密码重新登录）');
    if (pw === null) return;
    const j = await call('/parent/reset-game-password', { method: 'POST', body: JSON.stringify({ newPassword: pw }) });
    toast(j.ok ? '✅ 游戏密码已重置，请告诉孩子新密码' : (j.msg || '重置失败'));
  }

  /* ---------- 存档导出/导入（与游戏内共用同一格式，数据源为云端） ---------- */
  function exportSave() {
    if (!cloud || !cloud.save) return toast('云端没有存档可导出');
    const s = cloud.save;
    const blob = new Blob([JSON.stringify({ _game: 'richs_city', _ver: 1, _exportedAt: new Date().toISOString(), save: s }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date(), pad = (n) => String(n).padStart(2, '0');
    a.href = URL.createObjectURL(blob);
    a.download = `richs_city_第${s.day}天_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('📦 存档已导出，请保存好文件');
  }

  function bindImport() {
    const btn = $('btn-import'), file = $('file-import');
    if (!btn || !file) return;
    btn.onclick = () => file.click();
    file.onchange = () => {
      const f = file.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = JSON.parse(reader.result);
          const s = data && data._game === 'richs_city' ? data.save : data; // 兼容裸存档 JSON
          if (!s || !Array.isArray(s.buildings) || !Array.isArray(s.residents) || typeof s.day !== 'number') {
            return toast('❌ 这不是有效的 Rich\'s City 存档文件');
          }
          if (cloud && cloud.save &&
              !confirm(`导入将覆盖云端进度（第${cloud.save.day}天 · 💰${cloud.save.money}元）！\n导入的存档：第${s.day}天 · 💰${s.money}元\n确定继续吗？`)) return;
          const j = await call('/save', { method: 'PUT', body: JSON.stringify({ save: s, force: true, device: '后台导入' }) });
          if (j.ok) { toast('✅ 存档已导入并同步到云端'); renderDash(); }
          else toast(j.msg || '云端写入失败');
        } catch (e) {
          toast('❌ 文件解析失败，不是有效的存档');
        }
      };
      reader.readAsText(f);
      file.value = '';
    };
  }

  /* ================= 启动 ================= */
  loadSess();
  if (sess && sess.token) renderDash();
  else renderLogin();

  // 供 E2E 测试使用
  window.AdminPage = { exportSave, renderDash, renderLogin };
})();
