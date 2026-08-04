/* ============================================================
 * UI：顶栏刷新 / 侧栏面板 / 建筑菜单 / toast / 彩带
 * ============================================================ */
(function () {
  const $ = (id) => document.getElementById(id);
  const panelBox = $('panel-box'), panelOverlay = $('panel-overlay'),
        panelTitle = $('panel-title'), panelContent = $('panel-content');
  let currentPanel = null;

  /* ---------- 通用 ---------- */
  function toast(msg, type) {
    const t = document.createElement('div');
    t.className = 'toast' + (type ? ' ' + type : '');
    t.textContent = msg;
    $('toast-box').appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 400); }, 2400);
  }

  function hint(msg) {
    const el = $('map-hint');
    if (!msg) { el.style.display = 'none'; return; }
    el.textContent = msg; el.style.display = 'block';
  }

  function confetti(n) {
    const colors = ['#d01012', '#f5c518', '#0d69ab', '#3ab54a', '#fe8a18', '#e46a9a'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      const size = 8 + Math.random() * 8;
      c.style.cssText = `left:${Math.random() * 100}vw;width:${size}px;height:${size * 0.6}px;background:${colors[i % colors.length]};border-radius:2px;animation-duration:${1.6 + Math.random() * 1.6}s;animation-delay:${Math.random() * 0.4}s`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 3800);
    }
  }

  /* ---------- 顶栏 ---------- */
  function refreshTop() {
    const S = Game.state;
    $('stat-money').textContent = S.money;
    $('stat-pop').textContent = `${S.residents.length}/${Game.popCap()}`;
    $('stat-happy').textContent = Game.happiness();
    $('stat-joy').textContent = S.joy;
    $('stat-income').textContent = Game.weeklyIncome();
    $('stat-tax').textContent = Game.weeklyTax();
    $('city-name').textContent = S.cityName;
    const rank = Game.cityRank();
    $('city-rank').textContent = rank.icon + rank.name;
    $('game-date').textContent = `第${S.day}天`;
    // 徽章
    const pq = Game.pendingQuestions().length;
    const bq = $('badge-questions');
    bq.style.display = pq ? 'flex' : 'none'; bq.textContent = pq;
    const bt = $('badge-tax');
    bt.style.display = Game.canCollectTax() && Game.weeklyTax() > 0 ? 'flex' : 'none';
    const ug = Game.state.gifts.filter(g => !g.claimed).length;
    const bg = $('badge-gifts');
    bg.style.display = ug ? 'flex' : 'none'; bg.textContent = ug;
    // 跟读徽章：今天还没完成（todo）时提醒
    const br = $('badge-reading');
    if (br) br.style.display = (!S.reading || S.reading.day !== S.day || S.reading.status === 'todo') ? 'flex' : 'none';
    CityMap.draw();
  }

  /* ---------- 居民头像：有美术贴图用贴图，否则用SVG小人 ---------- */
  function portrait(r, scale) {
    const s = scale || 1;
    const spriteId = window.Assets && Assets.charSprite(r);
    if (spriteId) {
      const hat = r.hat
        ? `<span style="position:absolute;top:${-12 * s}px;left:50%;transform:translateX(-50%);font-size:${20 * s}px;z-index:2">${Assets.iconHTML(r.hat, CATALOG.findOutfit(r.hat)?.emoji || '', Math.round(24 * s))}</span>`
        : '';
      return `<span style="position:relative;display:inline-block">${hat}<img src="/static/assets/${spriteId}.webp" style="height:${74 * s}px;width:auto;display:block;filter:drop-shadow(0 3px 4px rgba(0,0,0,.25))" alt="${r.name}"></span>`;
    }
    return minifigSVG(r, scale);
  }

  /* ---------- 乐高小人 SVG ---------- */
  function minifigSVG(r, scale) {
    const hat = r.hat ? `<text x="50" y="16" font-size="26" text-anchor="middle">${CATALOG.findOutfit(r.hat)?.emoji || ''}</text>` : '';
    return `<svg class="minifig" viewBox="0 0 100 132" style="${scale ? `width:${56 * scale}px;height:${74 * scale}px` : ''}">
      ${hat}
      <rect x="42" y="18" width="16" height="8" rx="3" fill="${r.skin}"/>
      <rect x="30" y="24" width="40" height="34" rx="10" fill="${r.skin}"/>
      <circle cx="42" cy="38" r="3.4" fill="#333"/><circle cx="58" cy="38" r="3.4" fill="#333"/>
      <path d="M42 48 Q50 54 58 48" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="44" y="58" width="12" height="5" fill="${r.skin}"/>
      <path d="M28 63 L72 63 L78 100 L22 100 Z" fill="${r.shirt}"/>
      <rect x="12" y="66" width="13" height="30" rx="6" fill="${r.shirt}"/>
      <rect x="75" y="66" width="13" height="30" rx="6" fill="${r.shirt}"/>
      <circle cx="18" cy="99" r="6.5" fill="${r.skin}"/><circle cx="82" cy="99" r="6.5" fill="${r.skin}"/>
      <rect x="24" y="100" width="52" height="10" fill="${r.pants}"/>
      <rect x="26" y="110" width="21" height="18" rx="3" fill="${r.pants}"/>
      <rect x="53" y="110" width="21" height="18" rx="3" fill="${r.pants}"/>
    </svg>`;
  }

  /* ---------- 面板框架 ---------- */
  function openPanel(name) {
    currentPanel = name;
    document.querySelectorAll('.side-btn').forEach(b => b.classList.toggle('active', b.dataset.panel === name));
    panelBox.style.display = 'flex';
    panelOverlay.style.display = 'block';
    render();
  }

  function closePanel() {
    currentPanel = null;
    panelBox.style.display = 'none';
    panelOverlay.style.display = 'none';
    document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
  }

  $('panel-close').onclick = closePanel;
  panelOverlay.onclick = closePanel;
  document.querySelectorAll('.side-btn').forEach(b => {
    b.onclick = () => currentPanel === b.dataset.panel ? closePanel() : openPanel(b.dataset.panel);
  });

  function render() {
    if (!currentPanel) return;
    const fns = { residents: renderResidents, build: renderBuild, vehicles: renderVehicles, tax: renderTax, gifts: renderGifts, reading: renderReading, settings: renderSettings };
    (fns[currentPanel] || (() => {}))();
  }

  /* ---------- 居民面板 ---------- */
  function renderResidents() {
    const S = Game.state;
    panelTitle.innerHTML = '<i class="fas fa-people-group"></i> 城市居民';
    const cost = CATALOG.residentCost(S.residents.length);
    // 招募入口由 CATALOG.RECRUIT_ENABLED 控制（本版本关闭，代码与候选池全部保留）
    let html = Game.recruitEnabled()
      ? `<div class="card" style="background:#fff8e0">
          <div class="grow"><h4>👋 招募新居民</h4><p>人口：${S.residents.length}/${Game.popCap()}（住房不够时先建住宅）</p></div>
          <button class="btn btn-green btn-small" id="btn-recruit">💰${cost} 招募</button>
        </div>`
      : `<div class="card" style="background:#f4f7fb">
          <div class="grow"><h4>👪 市长的家人（${S.residents.length}位）</h4>
          <p>本版本先专心经营城市，暂不招募新居民。建筑解锁看的是<b>每周城市收入</b>，不看人口啦！</p></div>
        </div>`;
    for (const r of S.residents) {
      const career = CATALOG.CAREERS[r.level - 1];
      const need = CATALOG.xpNeeded(r.level);
      const dq = S.dailyQuestions.find(q => q.residentId === r.id && !q.done);
      const asked = Game.askedCount(r.id);
      const askBtn = dq
        ? `<button class="btn btn-blue btn-small" data-ask="${r.id}"><i class="fas fa-circle-question"></i> 有问题!</button>`
        : (Game.canAsk(r.id)
          ? `<button class="btn btn-blue btn-small" data-ask="${r.id}"><i class="fas fa-comment-dots"></i> 提问 ${asked}/${Game.DAILY_LIMIT}</button>`
          : `<span class="tag" style="font-size:11px">今日已问完50题</span>`);
      html += `<div class="card">
        ${portrait(r)}
        <div class="grow">
          <h4>${r.name} <span class="tag tag-blue">Lv.${r.level} ${career.icon}${career.title}</span></h4>
          <p>周薪 ${career.salary}元 · 答对 ${r.totalRight}题 · <span class="streak-flame"><i class="fas fa-fire"></i> 连对${r.streak}</span>（最高${r.bestStreak}）</p>
          <div class="xpbar"><div style="width:${Math.min(100, r.xp / need * 100)}%"></div></div>
          <p style="margin-top:2px">升级进度 ${r.xp}/${need}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${askBtn}
          <button class="btn btn-small" data-dress="${r.id}"><i class="fas fa-shirt"></i> 装扮</button>
        </div>
      </div>`;
    }
    panelContent.innerHTML = html;
    if ($('btn-recruit')) $('btn-recruit').onclick = () => {
      const r = Game.recruitResident();
      if (r.ok) { toast(`🎉 「${r.resident.name}」搬进城市啦！`, 'good'); confetti(16); refreshTop(); render(); }
      else toast(r.msg, 'bad');
    };
    panelContent.querySelectorAll('[data-ask]').forEach(b => b.onclick = () => {
      const rid = b.dataset.ask;
      let dq = Game.state.dailyQuestions.find(q => q.residentId === rid && !q.done);
      if (!dq) dq = Game.refillQuestion(rid);   // 当日未达上限，随时可继续提问
      if (dq) { closePanel(); Quiz.start(dq); }
    });
    panelContent.querySelectorAll('[data-dress]').forEach(b => b.onclick = () => renderDress(b.dataset.dress));
  }

  /* ---------- 装扮面板 ---------- */
  function renderDress(rid) {
    const S = Game.state;
    const r = S.residents.find(x => x.id === rid);
    panelTitle.innerHTML = `<i class="fas fa-shirt"></i> ${r.name} 的装扮`;
    const swatches = (slot, colors) => colors.map(c =>
      `<div class="swatch ${r[slot] === c ? 'sel' : ''}" style="background:${c}" data-slot="${slot}" data-color="${c}"></div>`).join('');
    const ownedShirtColors = S.outfits.filter(o => o.startsWith('shirt_')).map(o => CATALOG.findOutfit(o).color);
    const hatItems = CATALOG.OUTFITS.filter(o => o.type === 'hat');
    let html = `
      <div style="text-align:center;margin-bottom:10px">${portrait(r, 1.6)}</div>
      <div class="form-row"><label>👕 上衣颜色</label><div class="color-swatches">${swatches('shirt', [...CATALOG.FREE_COLORS, ...ownedShirtColors])}</div></div>
      <div class="form-row"><label>👖 裤子颜色</label><div class="color-swatches">${swatches('pants', CATALOG.FREE_COLORS)}</div></div>
      <div class="form-row"><label>🎩 帽子（用城市收入解锁）</label>
        <div class="shop-grid">
          <div class="shop-item ${!r.hat ? 'locked' : ''}" data-hat=""><div class="s-icon">🚫</div><div class="s-name">不戴帽子</div><div class="s-cost owned">免费</div></div>
          ${hatItems.map(h => {
            const owned = S.outfits.includes(h.id);
            return `<div class="shop-item" data-hat="${h.id}"><div class="s-icon">${Assets.iconHTML(h.id, h.emoji, 40)}</div><div class="s-name">${h.name}</div>
              <div class="s-cost ${owned ? 'owned' : ''}">${owned ? (r.hat === h.id ? '✅ 戴着呢' : '已拥有') : '💰' + h.cost}</div></div>`;
          }).join('')}
        </div>
      </div>
      <div class="form-row"><label>✨ 特色上衣（解锁后可选颜色）</label>
        <div class="shop-grid">
          ${CATALOG.OUTFITS.filter(o => o.type === 'color').map(o => {
            const owned = S.outfits.includes(o.id);
            return `<div class="shop-item" data-outfit="${o.id}"><div class="s-icon"><span style="display:inline-block;width:30px;height:30px;border-radius:8px;background:${o.color};box-shadow:0 2px 4px rgba(0,0,0,.25)"></span></div>
              <div class="s-name">${o.name}</div><div class="s-cost ${owned ? 'owned' : ''}">${owned ? '已拥有' : '💰' + o.cost}</div></div>`;
          }).join('')}
        </div>
      </div>
      <button class="btn btn-blue" id="btn-back-res" style="width:100%"><i class="fas fa-arrow-left"></i> 返回居民列表</button>`;
    panelContent.innerHTML = html;

    panelContent.querySelectorAll('.swatch').forEach(s => s.onclick = () => {
      Game.setResidentStyle(rid, { [s.dataset.slot]: s.dataset.color });
      renderDress(rid);
    });
    panelContent.querySelectorAll('[data-hat]').forEach(el => el.onclick = () => {
      const hid = el.dataset.hat;
      if (!hid) { Game.setResidentStyle(rid, { hat: null }); renderDress(rid); return; }
      if (Game.state.outfits.includes(hid)) { Game.setResidentStyle(rid, { hat: hid }); renderDress(rid); return; }
      const res = Game.buyOutfit(hid);
      if (res.ok) { Game.setResidentStyle(rid, { hat: hid }); toast('🎩 新帽子解锁！', 'good'); refreshTop(); renderDress(rid); }
      else toast(res.msg || '解锁失败', 'bad');
    });
    panelContent.querySelectorAll('[data-outfit]').forEach(el => el.onclick = () => {
      const oid = el.dataset.outfit;
      const o = CATALOG.findOutfit(oid);
      if (Game.state.outfits.includes(oid)) { Game.setResidentStyle(rid, { shirt: o.color }); renderDress(rid); return; }
      const res = Game.buyOutfit(oid);
      if (res.ok) { Game.setResidentStyle(rid, { shirt: o.color }); toast('👕 新上衣解锁！', 'good'); refreshTop(); renderDress(rid); }
      else toast(res.msg || '解锁失败', 'bad');
    });
    $('btn-back-res').onclick = renderResidents;
  }

  /* ---------- 建造面板 ---------- */
  let buildTab = 'business';
  function renderBuild() {
    const S = Game.state;
    panelTitle.innerHTML = '<i class="fas fa-hammer"></i> 建造中心';
    const cats = [['business', '💰商业'], ['public', '🏫公共'], ['house', '🏠住宅'], ['support', '🅿️配套'], ['deco', '🌳装饰']];
    const peak = Game.peakIncome(), nxt = Game.nextUnlock();
    let html = `<div class="card" style="background:#eef6ff;margin-bottom:8px"><div class="grow">
        <h4>💵 当前周收入 ${Game.weeklyIncome()} 元/周</h4>
        <p>${nxt ? `周收入达到 <b>${nxt.unlockIncome}</b> 元 → 解锁「${nxt.icon}${nxt.name}」` : '🎉 所有建筑已全部解锁！'}</p>
        <div class="xpbar"><div style="width:${nxt ? Math.min(100, peak / nxt.unlockIncome * 100) : 100}%"></div></div>
      </div></div>
      <div class="card" style="background:#f0f9ee;margin-bottom:8px"><div class="grow" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div>
          <h4>🗺️ 城市地块：${S.mapW} × ${S.mapH} 格</h4>
          <p>${Game.expandCost() != null ? `扩建一次 +8列+6行（还能扩 ${Game.EXPAND_MAX - Game.expandLevel()} 次）` : '🎉 地块已扩到最大！'}</p>
        </div>
        ${Game.expandCost() != null ? `<div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-green" id="btn-expand-land">🌱💰${Game.expandCost()} 扩建草地</button>
          <button class="btn btn-blue" id="btn-expand-water">🌊💰${Game.expandCost()} 扩建水域</button>
        </div>` : ''}
      </div></div>
      <div class="panel-tabs">${cats.map(c => `<button class="ptab ${buildTab === c[0] ? 'active' : ''}" data-tab="${c[0]}">${c[1]}</button>`).join('')}</div><div class="shop-grid">`;
    for (const b of CATALOG.BUILDINGS.filter(x => x.cat === buildTab)) {
      const locked = !Game.isUnlocked(b);
      const thumb = window.Assets && Assets.has(b.id)
        ? `<img src="/static/assets/${b.id}.webp" style="height:52px;width:auto;max-width:72px;object-fit:contain" alt="${b.name}">`
        : b.icon;
      html += `<div class="shop-item ${locked ? 'locked' : ''}" data-build="${locked ? '' : b.id}">
        <div class="s-icon">${thumb}</div><div class="s-name">${b.name}</div>
        <div class="s-desc">${b.desc}<br>占地${b.w}×${b.h}格</div>
        <div class="s-cost">${locked ? `🔒 周收入${b.unlockIncome}解锁` : '💰' + b.cost}</div>
      </div>`;
    }
    html += '</div>';
    panelContent.innerHTML = html;
    const doExpand = (type) => {
      const r = Game.expandLand(type);
      toast(r.msg, r.ok ? 'gold' : 'bad');
      if (r.ok) {
        confetti(20);
        if (window.CityMap && CityMap.fitView) CityMap.fitView();  // 重新取景看到新地块
        renderBuild();
        refreshTop();
      }
    };
    const exBtn = $('btn-expand-land');
    if (exBtn) exBtn.onclick = () => doExpand('land');
    const exWBtn = $('btn-expand-water');
    if (exWBtn) exWBtn.onclick = () => doExpand('water');
    panelContent.querySelectorAll('.ptab').forEach(t => t.onclick = () => { buildTab = t.dataset.tab; renderBuild(); });
    panelContent.querySelectorAll('[data-build]').forEach(el => el.onclick = () => {
      const bid = el.dataset.build;
      if (!bid) { toast('周收入还不够，多建商铺、多答题让居民升级吧！', 'bad'); return; }
      const b = CATALOG.findBuilding(bid);
      if (Game.state.money < b.cost) { toast(`「${b.name}」需要💰${b.cost}，先去答题/收税赚钱吧！`, 'bad'); return; }
      closePanel();
      CityMap.startPlacing(bid);
    });
  }

  /* ---------- 车库面板 ---------- */
  let vehTab = 'car';
  function renderVehicles() {
    const S = Game.state;
    panelTitle.innerHTML = '<i class="fas fa-car-side"></i> 城市车库';
    const tabs = [['car', '🚗汽车'], ['service', '🚒工程'], ['train', '🚄火车'], ['plane', '✈️飞机'], ['ship', '🚢轮船']];
    let html = `<p style="font-size:12.5px;color:#888;margin-bottom:8px">💡 解锁的车辆会停在城市的停车场和道路上，火车/飞机/轮船需要先建火车站/机场/港口</p>
      <div class="panel-tabs">${tabs.map(t => `<button class="ptab ${vehTab === t[0] ? 'active' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div><div class="shop-grid">`;
    for (const v of CATALOG.VEHICLES.filter(x => x.type === vehTab)) {
      const owned = S.vehicles.includes(v.id);
      const needB = v.need && !S.buildings.some(b => b.id === v.need);
      html += `<div class="shop-item ${needB ? 'locked' : ''}" data-veh="${v.id}">
        <div class="s-icon">${Assets.iconHTML('veh_' + v.id, v.icon, 46)}</div><div class="s-name">${v.name}</div>
        <div class="s-desc">${v.desc}</div>
        <div class="s-cost ${owned ? 'owned' : ''}">${owned ? '✅ 已拥有' : needB ? `🔒 需要${CATALOG.findBuilding(v.need).name}` : '💰' + v.cost}</div>
      </div>`;
    }
    html += '</div>';
    panelContent.innerHTML = html;
    panelContent.querySelectorAll('.ptab').forEach(t => t.onclick = () => { vehTab = t.dataset.tab; renderVehicles(); });
    panelContent.querySelectorAll('[data-veh]').forEach(el => el.onclick = () => {
      const r = Game.buyVehicle(el.dataset.veh);
      if (r.ok) { toast(`🎉 「${r.vehicle.name}」开进城市啦！`, 'good'); confetti(16); refreshTop(); renderVehicles(); }
      else if (r.msg) toast(r.msg, 'bad');
    });
  }

  /* ---------- 市政厅面板 ---------- */
  function renderTax() {
    const S = Game.state;
    panelTitle.innerHTML = '<i class="fas fa-landmark"></i> 市政厅';
    const resInc = Game.weeklyResidentIncome();
    const bizRev = Game.weeklyBusinessRevenue();
    const can = Game.canCollectTax();
    const rank = Game.cityRank();
    const nextRank = CATALOG.CITY_RANKS[CATALOG.CITY_RANKS.indexOf(rank) + 1];
    let html = `
      <div class="card"><div class="grow">
        <h4>${rank.icon} 城市等级：${rank.name}</h4>
        <p>${nextRank ? `周收入达到 ${nextRank.minIncome} 元/周升级为「${nextRank.icon}${nextRank.name}」` : '已经是最高等级——超级城市！'}</p>
        <div class="xpbar"><div style="width:${nextRank ? Math.min(100, Game.peakIncome() / nextRank.minIncome * 100) : 100}%"></div></div>
      </div></div>
      <div class="card"><div class="grow">
        <h4>💰 本周税收预算</h4>
        <p>💵 城市周收入（解锁/等级看这个，不含幸福度浮动）：<b>${Game.weeklyIncome()}元/周</b>（历史最高 ${Game.peakIncome()}元）<br>
        居民工资合计：${resInc}元/周 → 居民税(10%)：<b>${Math.round(resInc * 0.1)}元</b><br>
        产业营业额(含房租)：${bizRev}元/周 → 产业税(10%)：<b>${Math.round(bizRev * 0.1)}元</b><br>
        幸福度 ${Game.happiness()} → 消费热情 ×${(0.5 + Game.happiness() / 100).toFixed(2)}（多建公园、学校可以提高哦）</p>
      </div>
      <button class="btn btn-green" id="btn-collect" ${can ? '' : 'disabled'}>${can ? `收税 💰${Game.weeklyTax()}` : `还差${Game.daysUntilTax()}天`}</button></div>
      <div class="card"><div class="grow">
        <h4>📊 市长成绩单</h4>
        <p>累计答题 ${S.stats.totalAnswered} 道 · 答对 ${S.stats.totalRight} 道（正确率 ${S.stats.totalAnswered ? Math.round(S.stats.totalRight / S.stats.totalAnswered * 100) : 0}%）<br>累计收税 ${S.stats.taxCollected}元 · 建筑 ${S.buildings.length}座 · 车辆 ${S.vehicles.length}辆</p>
      </div></div>
      <div class="card"><div class="grow"><h4>📜 城市日志</h4>
        <p style="max-height:180px;overflow-y:auto">${S.log.length ? S.log.slice(0, 20).join('<br>') : '还没有大事记，快去经营城市吧！'}</p>
      </div></div>`;
    panelContent.innerHTML = html;
    const btn = $('btn-collect');
    if (btn) btn.onclick = () => {
      const r = Game.collectTax();
      if (r.ok) { toast(`💰 收税成功！居民税${r.resTax} + 商业税${r.bizTax} = ${r.total}元`, 'gold'); confetti(24); refreshTop(); renderTax(); }
      else toast(r.msg, 'bad');
    };
  }

  /* ---------- 礼物面板 ---------- */
  function renderGifts() {
    const S = Game.state;
    panelTitle.innerHTML = '<i class="fas fa-gift"></i> 礼物盒';
    let html = `<p style="font-size:12.5px;color:#888;margin-bottom:10px">💡 帮居民连续答对题目，他们会送你实物兑换卡！点「兑换」后找爸爸妈妈领取真的奖励～</p>`;
    if (!S.gifts.length) {
      html += `<div class="card"><div class="grow" style="text-align:center;padding:20px">
        <div style="font-size:44px">🎁</div><h4 style="justify-content:center">礼物盒空空的</h4>
        <p>连续答对10题就能获得第一张「小汽车玩具兑换卡」！</p></div></div>`;
    }
    S.gifts.forEach((g, i) => {
      html += `<div class="card" style="${g.claimed ? 'opacity:.55' : ''}">
        <div style="font-size:38px">${g.icon}</div>
        <div class="grow"><h4>${g.name} ${g.claimed ? '<span class="tag tag-green">已兑换</span>' : '<span class="tag tag-gold">待兑换</span>'}</h4>
        <p>${g.desc}<br>来自 ${g.from} · 第${g.day}天获得</p></div>
        ${g.claimed ? '' : `<button class="btn btn-green btn-small" data-claim="${i}">兑换</button>`}
      </div>`;
    });
    html += `<div class="card"><div class="grow"><h4>🏅 兑换卡获得条件</h4>
      <p>${Game.giftTable().map(g => `${g.icon} 同一居民连对${g.streak}题 → ${g.name}`).join('<br>')}</p></div></div>`;
    panelContent.innerHTML = html;
    panelContent.querySelectorAll('[data-claim]').forEach(b => b.onclick = () => {
      if (Game.claimGift(+b.dataset.claim)) {
        toast('🎉 兑换成功！快去找爸爸妈妈领取奖励吧！', 'gold');
        confetti(30);
        refreshTop(); renderGifts();
      }
    });
  }

  /* ---------- 每日英语跟读面板 ---------- */
  // TTS 播放状态 → 控制跟读面板“暂停/继续/停止”按钮（面板重绘不重复注册，挂 document 一次即可）
  document.addEventListener('tts-state', (e) => {
    const { speaking, paused } = e.detail;
    const stopBtn = document.getElementById('btn-read-stop');
    if (stopBtn) stopBtn.style.display = speaking ? '' : 'none';
    // 所有暂停/继续切换按钮（主控制栏 + 每段旁边）统一刷状态
    document.querySelectorAll('.btn-tts-pause').forEach(b => {
      b.style.display = speaking ? '' : 'none';
      b.innerHTML = paused ? '▶ 继续' : '⏸ 暂停';
      b.classList.toggle('btn-green', paused);
    });
    const hint = document.getElementById('read-tts-hint');
    if (hint && speaking) hint.style.display = 'none';
  });
  function renderReading() {
    const S = Game.state;
    panelTitle.innerHTML = '<i class="fas fa-microphone"></i> 每日英语跟读';
    const today = Game.todayReading();
    if (!today) { panelContent.innerHTML = '<div class="card"><div class="grow"><p>跟读短文加载失败，刷新页面试试。</p></div></div>'; return; }
    const p = today.passage;
    const st = today.status;
    const statusHtml = st === 'approved'
      ? '<span class="tag" style="background:#237841;color:#fff">✅ 今天已完成！家长已确认</span>'
      : st === 'pending'
        ? '<span class="tag" style="background:#e8590c;color:#fff">⏳ 等待家长确认中…（请爸爸妈妈打开 家长后台 点通过）</span>'
        : '<span class="tag tag-orange">🎯 今天还没完成跟读哦</span>';
    const paras = String(p.text).split(/\n\n+/).filter(t => t.trim());
    const parasHtml = paras.map((t, i) => `
      <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:14px">
        <div style="flex-shrink:0;display:flex;flex-direction:column;gap:4px;margin-top:4px">
          <button class="btn btn-blue btn-small btn-read-para" data-pi="${i}" title="慢速播放这一段">🔊</button>
          <button class="btn btn-small btn-tts-pause" title="暂停/继续" style="display:none;background:#e8590c;color:#fff;font-size:11px;padding:4px 6px">⏸ 暂停</button>
        </div>
        <p style="font-size:17px;line-height:1.9;font-weight:600;color:#1d3557;margin:0">${t}</p>
      </div>`).join('');
    panelContent.innerHTML = `
      <div class="card" style="background:#eef6ff"><div class="grow">
        <h4>📖 今日短文：${p.title} <span class="tag" style="background:#dbe9ff;color:#1d3557">约 ${p.text.split(/\s+/).length} 词</span></h4>
        <p style="margin-top:4px">① 点“听一听”认真听（也可以点每段前面的 🔊 一段一段听） ② 跟着大声读出来 ③ 读给爸爸妈妈听，完成后点下面的按钮</p>
        <div style="margin-top:6px">${statusHtml}</div>
      </div></div>
      <div class="card"><div class="grow">
        <div id="read-text">${parasHtml}</div>
        <details style="margin-top:4px"><summary style="cursor:pointer;font-size:13px;color:#888">🇨🇳 看中文大意</summary>
          <div style="font-size:13px;color:#999;margin-top:6px;line-height:1.8">${p.cn}</div>
        </details>
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
          <button class="btn btn-blue" id="btn-read-play"><i class="fas fa-volume-high"></i> 听一听（慢速）</button>
          <button class="btn btn-blue btn-small" id="btn-read-play2"><i class="fas fa-volume-high"></i> 正常速度</button>
          <button class="btn btn-small btn-tts-pause" style="display:none;background:#e8590c;color:#fff">⏸ 暂停</button>
          <button class="btn btn-small" id="btn-read-stop" style="background:#c92a2a;color:#fff;display:none"><i class="fas fa-stop"></i> 停止</button>
          ${st === 'todo' ? '<button class="btn btn-green" id="btn-read-done"><i class="fas fa-check"></i> 我完成跟读啦！</button>' : ''}
        </div>
        <p id="read-tts-hint" style="font-size:12px;color:#999;margin-top:8px;display:none">💡 如果点了没声音：请用 Chrome / Edge 浏览器，并确认系统音量已打开、没静音。</p>
      </div></div>
      <div class="card" style="background:#fff8e0"><div class="grow">
        <h4>🎁 奖励规则</h4>
        <p>每天 1 篇跟读，家长确认后奖励 <b>💰 20 元 + 😊 快乐值 +5</b>！坦白完成，诚实的小市长才是好市长～</p>
      </div></div>`;
    const playAndCheck = (text, rate) => {
      Quiz.speak(text, rate);
      setTimeout(() => {  // 1.8 秒后还没进入播放状态 → 显示排查提示
        const hint = $('read-tts-hint');
        if (hint && !Quiz.isSpeaking()) hint.style.display = '';
      }, 1800);
    };
    const SLOW = 0.6;   // 慢速（整篇慢速与逐段播放统一用这个）
    $('btn-read-play').onclick = () => playAndCheck(p.text, SLOW);
    $('btn-read-play2').onclick = () => playAndCheck(p.text, 0.95);
    $('btn-read-stop').onclick = () => Quiz.stopSpeak();
    panelContent.querySelectorAll('.btn-read-para').forEach(b => {
      b.onclick = () => playAndCheck(paras[+b.dataset.pi], SLOW);
    });
    panelContent.querySelectorAll('.btn-tts-pause').forEach(b => {
      b.onclick = () => { Quiz.isPaused() ? Quiz.resumeSpeak() : Quiz.pauseSpeak(); };
    });
    const doneBtn = $('btn-read-done');
    if (doneBtn) doneBtn.onclick = () => {
      if (Game.markReadingDone()) {
        toast('🎉 真棒！去请爸爸妈妈打开家长后台确认吧', 'gold');
        confetti(15);
        renderReading();
        refreshTop();
      }
    };
  }

  /* ---------- 设置面板 ---------- */
  function renderSettings() {
    const S = Game.state;
    panelTitle.innerHTML = '<i class="fas fa-gear"></i> 设置';
    const grades = [[3, '三年级'], [4, '四年级'], [5, '五年级'], [6, '六年级']];
    panelContent.innerHTML = `
      <div class="card"><div class="grow">
        <h4>🏙️ 城市名字</h4>
        <div class="form-row" style="margin-top:8px;display:flex;gap:8px">
          <input type="text" id="inp-cityname" value="${S.cityName}" maxlength="16" style="flex:1">
          <button class="btn btn-blue btn-small" id="btn-savename">保存</button>
        </div>
      </div></div>
      <div class="card"><div class="grow">
        <h4>📚 题目难度</h4>
        ${Game.config.grade != null
          ? `<p>现在的难度：<b>${grades.find(g => g[0] === S.grade)?.[1] || S.grade + '年级'}</b>（🔒 由爸爸妈妈在家长后台设定，需要调整请找家长哦）</p>`
          : `<p>现在的难度：<b>${grades.find(g => g[0] === S.grade)?.[1] || S.grade + '年级'}</b>，题目会随年级变难，知识范围也会扩大。</p>
        <div class="panel-tabs" style="margin-top:8px">${grades.map(g => `<button class="ptab ${S.grade === g[0] ? 'active' : ''}" data-grade="${g[0]}">${g[1]}</button>`).join('')}</div>`}
      </div></div>
      <div class="card" style="background:#e7f5ff"><div class="grow">
        <h4>☁️ 家庭账号（云存档）</h4>
        <p>${window.Cloud && Cloud.loggedIn
          ? `当前账号：<b>${Cloud.username}</b> · ${Cloud.online ? '🟢 云同步正常' : '📴 暂时离线（进度存本机，联网自动补传）'}<br>换任何设备打开游戏，登录这个账号就能接着玩。`
          : '未登录云账号，进度只存在本机。刷新页面可登录/注册家庭账号。'}</p>
        ${window.Cloud && Cloud.loggedIn ? `<div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-blue btn-small" id="btn-cloud-sync"><i class="fas fa-cloud-arrow-up"></i> 立即同步云端</button>
          <button class="btn btn-small" id="btn-cloud-logout"><i class="fas fa-right-from-bracket"></i> 退出账号</button>
        </div>` : ''}
      </div></div>
      <div class="card"><div class="grow">
        <h4>💾 存档</h4>
        <p>进度自动保存本机 + 自动同步云端（登录后）。也可以导出存档文件做额外备份。</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <button class="btn btn-green btn-small" id="btn-save-manual"><i class="fas fa-floppy-disk"></i> 立即保存</button>
          <button class="btn btn-blue btn-small" id="btn-save-export"><i class="fas fa-file-export"></i> 导出存档文件</button>
          <button class="btn btn-small" id="btn-save-import"><i class="fas fa-file-import"></i> 导入存档文件</button>
          <input type="file" id="file-save-import" accept=".json" style="display:none">
        </div>
        <button class="btn btn-red btn-small" id="btn-reset" style="margin-top:10px"><i class="fas fa-trash"></i> 重新开始游戏</button>
      </div></div>
      <div class="card" style="background:#f4f0fa"><div class="grow">
        <h4>🔐 家长后台</h4>
        <p>家长专属页面（账号密码登录）：确认跟读发奖励 / 查看作品集 / 学习概况 / 存档备份。首次打开需要设置家长账号。</p>
        <a class="btn btn-blue btn-small" href="/admin" target="_blank" style="margin-top:8px;text-decoration:none"><i class="fas fa-user-shield"></i> 打开家长后台</a>
      </div></div>
      <div class="card"><div class="grow">
        <h4>ℹ️ 关于 Rich's City</h4>
        <p>版本 1.0 · 一款为小市长打造的乐高风格学习城市游戏<br>答题赚钱 → 建造城市 → 提升周收入解锁新建筑 → 解锁车辆，努力建成超级城市吧！</p>
      </div></div>`;
    $('btn-savename').onclick = () => { Game.renameCity($('inp-cityname').value); toast('✅ 城市名字改好啦'); refreshTop(); };
    panelContent.querySelectorAll('[data-grade]').forEach(b => b.onclick = () => {
      Game.setGrade(+b.dataset.grade);
      toast(`📚 难度调整为${b.textContent}`);
      renderSettings();
    });
    $('btn-reset').onclick = () => {
      if (confirm('确定要删除存档、重新开始吗？所有进度都会消失！')) Game.resetGame();
    };
    // 存档：立即保存 / 导出 / 导入
    $('btn-save-manual').onclick = () => { Game.save(); toast('💾 已保存！进度安全啦', 'good'); };
    $('btn-save-export').onclick = () => SaveIO.exportSave() ? toast('📦 存档已导出，请保存好文件', 'good') : toast('导出失败', 'bad');
    $('btn-save-import').onclick = () => $('file-save-import').click();
    $('file-save-import').onchange = (e) => {
      const f = e.target.files[0];
      if (f) SaveIO.importSave(f, (ok, msg) => { toast(msg, ok ? 'good' : 'bad'); if (ok) setTimeout(() => location.reload(), 800); });
      e.target.value = '';
    };
    // 云端账号：立即同步 / 退出
    const cs = $('btn-cloud-sync');
    if (cs) cs.onclick = async () => {
      Game.save();
      const ok = await Cloud.pushNow();
      toast(ok ? '☁️ 已同步到云端' : '📴 同步失败，联网后会自动重试', ok ? 'good' : 'bad');
      renderSettings();
    };
    const cl = $('btn-cloud-logout');
    if (cl) cl.onclick = () => {
      if (confirm('退出后本机进度会清空（云端已保留），下次登录会自动拉回云存档。\n确定退出账号吗？')) Cloud.logout();
    };
  }

  /* ---------- 存档导出/导入（与 /admin 后台同格式） ---------- */
  const SaveIO = {
    exportSave() {
      const raw = localStorage.getItem(GameState.SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      const blob = new Blob([JSON.stringify({ _game: 'richs_city', _ver: 1, _exportedAt: new Date().toISOString(), save: s }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      const d = new Date(), pad = (n) => String(n).padStart(2, '0');
      a.href = URL.createObjectURL(blob);
      a.download = `richs_city_第${s.day}天_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      return true;
    },
    importSave(file, cb) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const s = data && data._game === 'richs_city' ? data.save : data;
          if (!s || !Array.isArray(s.buildings) || !Array.isArray(s.residents) || typeof s.day !== 'number') {
            return cb(false, '❌ 这不是有效的存档文件');
          }
          if (!confirm(`导入会覆盖当前进度（第${Game.state.day}天）！\n导入的存档：第${s.day}天 · 💰${s.money}元\n确定继续吗？`)) return cb(false, '已取消');
          localStorage.setItem(GameState.SAVE_KEY, JSON.stringify(s));
          cb(true, '✅ 存档导入成功，正在重新加载…');
        } catch (err) {
          cb(false, '❌ 文件解析失败，不是有效的存档');
        }
      };
      reader.readAsText(file);
    }
  };

  /* ---------- 建筑点击菜单 ---------- */
  function showBuildingMenu(b) {
    const info = Game.bInfo(b.id);
    const isOffice = b.id === 'office_wood';
    const modal = $('modal-box'), overlay = $('modal-overlay');
    let statLine = '';
    if (info.income) statLine += `💰 周收入 ${info.income}元${info.popCap ? '（房租）' : ''}（税收10%）<br>`;
    if (info.happy) statLine += `😊 幸福度 +${info.happy}<br>`;
    if (info.popCap) statLine += `🏠 提供住房 ${info.popCap}人<br>`;
    modal.innerHTML = `
      <div class="quiz-head"><div style="font-size:34px">${info.icon}</div>
        <div><div style="font-size:19px;font-weight:800">${b.name}</div><div class="q-sub">${info.desc || ''}</div></div></div>
      <div class="quiz-body">
        <p style="color:#666;font-size:14px;line-height:1.9">${statLine}📍 占地 ${b.w}×${b.h} 格</p>
        <div class="form-row" style="margin-top:10px"><label>✏️ 修改名字</label>
          <div style="display:flex;gap:8px"><input type="text" id="inp-bname" value="${b.name}" maxlength="12" style="flex:1"><button class="btn btn-blue btn-small" id="btn-bname">保存</button></div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-blue" id="btn-bmove"><i class="fas fa-arrows-up-down-left-right"></i> 移动位置</button>
        ${isOffice ? '' : `<button class="btn btn-red" id="btn-bdemolish"><i class="fas fa-trash"></i> 拆除(退一半钱)</button>`}
        <button class="btn" id="btn-bclose">关闭</button>
      </div>`;
    overlay.style.display = 'flex';
    const close = () => { overlay.style.display = 'none'; CityMap.deselect(); };
    $('btn-bclose').onclick = close;
    $('btn-bname').onclick = () => {
      if (Game.renameBuilding(b.uid, $('inp-bname').value)) { toast('✅ 名字改好啦'); CityMap.draw(); }
    };
    $('btn-bmove').onclick = () => { overlay.style.display = 'none'; CityMap.startMoving(b); };
    const dem = $('btn-bdemolish');
    if (dem) dem.onclick = () => {
      if (confirm(`确定拆除「${b.name}」吗？会退回一半建造费。`)) {
        const refund = Game.demolish(b.uid);
        toast(`🔨 已拆除，退回${refund}元`);
        close(); refreshTop();
      }
    };
  }

  /* ---------- 新建筑命名引导 ---------- */
  function promptRename(b) {
    setTimeout(() => showBuildingMenu(b), 350);
  }

  /* ---------- 城市名点击修改 ---------- */
  $('city-name').onclick = () => openPanel('settings');

  window.UI = { toast, hint, confetti, refreshTop, openPanel, closePanel, showBuildingMenu, promptRename, minifigSVG, portrait, renderPanel: render };
})();
