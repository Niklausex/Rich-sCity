/* ============================================================
 * 入口：初始化游戏 → 渲染 → 绑定全局按钮
 * ============================================================ */
(function () {
  Assets.preloadAll(); // 后台预加载全部美术贴图

  // 云登录门（注册/登录 + 云存档协调）完成后才初始化游戏
  Cloud.ensureLogin(() => {
    const isNew = Game.init();
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('game-root').style.display = 'grid';
    CityMap.resize();
    CityMap.fitView();
    UI.refreshTop();

    if (isNew) {
      Game.save(); // 新建档立即上云，其他设备马上能看到
      showWelcome();
    } else {
      const pq = Game.pendingQuestions().length;
      if (pq) UI.toast(`👋 市长早上好！今天有 ${pq} 位居民有问题找你`, 'good');
    }
  });

  /* 顶栏保存按钮：立即保存（本地+云端） */
  document.getElementById('btn-save-now').onclick = async () => {
    Game.save();
    if (Cloud.loggedIn) {
      UI.toast('💾 已保存，正在同步云端…', 'good');
      const ok = await Cloud.pushNow();
      if (ok) UI.toast('☁️ 云端同步完成！换设备也不会丢', 'good');
      else if (!Cloud.online) UI.toast('📴 网络不通，已存本机，联网后自动补传', 'bad');
    } else {
      UI.toast('💾 已保存在本机', 'good');
    }
  };

  /* 云同步状态提示：token 失效提醒重登 */
  document.addEventListener('cloud-state', (e) => {
    if (e.detail.state === 'logout') UI.toast('☁️ 登录已过期，进度暂存本机；刷新页面重新登录后会自动同步', 'bad');
  });

  /* 家长在后台改了游戏规则 → 实时生效并提示孩子 */
  document.addEventListener('cloud-config', () => {
    UI.toast('🎛️ 爸爸妈妈更新了游戏规则，已生效！', 'good');
    UI.refreshTop();
  });

  /* 家长后台（/admin 另一标签页）改了存档 → 本页自动刷新同步 */
  window.addEventListener('storage', (e) => {
    if (e.key === GameState.SAVE_KEY && e.newValue) {
      UI.toast('👨‍👩‍👦 家长后台更新了进度，正在同步…', 'good');
      setTimeout(() => location.reload(), 1200);
    }
  });

  /* 睡觉按钮：进入新的一天 */
  document.getElementById('btn-sleep').onclick = () => {
    const pq = Game.pendingQuestions().length;
    if (pq && !confirm(`还有 ${pq} 位居民的问题没回答，确定要睡觉吗？\n（没答的问题明天会换成新的）`)) return;
    const r = Game.sleep();
    UI.refreshTop();
    showNewDay(r);
  };

  function showNewDay(r) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-box');
    const canTax = Game.canCollectTax() && Game.weeklyTax() > 0;
    modal.innerHTML = `
      <div class="quiz-head" style="background:linear-gradient(135deg,#2b2f77,#5a5fd0)">
        <div style="font-size:38px">🌅</div>
        <div><div style="font-size:20px;font-weight:800">第 ${r.day} 天，新的一天！</div>
        <div class="q-sub">Rich's City 的太阳升起来啦</div></div>
      </div>
      <div class="quiz-body" style="text-align:center">
        <p style="font-size:16px;font-weight:700;color:#444;line-height:2">
          📋 今天有 <b style="color:#0d69ab">${r.questions}</b> 位居民有问题请教市长<br>
          ${canTax ? '💰 <b style="color:#c78a00">可以收税啦！</b>去市政厅看看<br>' : `💰 距离下次收税还有 ${Game.daysUntilTax()} 天<br>`}
          😊 城市幸福度 ${Game.happiness()} · ❤️ 快乐值 ${Game.state.joy}
        </p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-blue" id="btn-day-quiz"><i class="fas fa-circle-question"></i> 去答题</button>
        ${canTax ? '<button class="btn btn-green" id="btn-day-tax"><i class="fas fa-landmark"></i> 去收税</button>' : ''}
        <button class="btn" id="btn-day-close">先逛逛</button>
      </div>`;
    overlay.style.display = 'flex';
    document.getElementById('btn-day-close').onclick = () => overlay.style.display = 'none';
    document.getElementById('btn-day-quiz').onclick = () => {
      overlay.style.display = 'none';
      const pq = Game.pendingQuestions();
      if (pq.length) Quiz.start(pq[0]);
    };
    const taxBtn = document.getElementById('btn-day-tax');
    if (taxBtn) taxBtn.onclick = () => { overlay.style.display = 'none'; UI.openPanel('tax'); };
  }

  function showWelcome() {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-box');
    modal.innerHTML = `
      <div class="quiz-head" style="background:linear-gradient(135deg,#d01012,#fe8a18)">
        <div style="font-size:38px">🎉</div>
        <div><div style="font-size:20px;font-weight:800">欢迎来到 Rich's City！</div>
        <div class="q-sub">小市长，你的城市之旅开始啦</div></div>
      </div>
      <div class="quiz-body">
        <p style="font-size:15px;font-weight:700;color:#444;line-height:2.1">
          🏚️ 你有一间<b>木质办公室</b>和一个<b>停车位</b>，还有 💰<b>100元</b>启动资金<br>
          👨‍👩‍👧‍👦 城里住着8位家人：爸爸、妈妈、奶奶、爷爷、姥姥、姥爷、小姨、哥哥<br><br>
          <b>市长每天要做的事：</b><br>
          1️⃣ 回答居民的问题（答对居民会升级、挣更多钱）<br>
          2️⃣ 每7天收一次税（居民收入10% + 商业营业额10%）<br>
          3️⃣ 用钱建造商店、公园、住宅，规划你的城市<br>
          4️⃣ 招募新居民、解锁真实车辆（高铁、C919、航母…）<br>
          5️⃣ 连续答对题目，居民会送你<b>实物玩具兑换卡</b>！🎁
        </p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-green" id="btn-welcome-go" style="font-size:17px">🚀 开始当市长！</button>
      </div>`;
    overlay.style.display = 'flex';
    document.getElementById('btn-welcome-go').onclick = () => {
      overlay.style.display = 'none';
      const pq = Game.pendingQuestions();
      if (pq.length) {
        UI.toast(`👋 有 ${pq.length} 位居民有问题找市长，点左边「居民」看看`, 'good');
        setTimeout(() => Quiz.start(pq[0]), 800);
      }
    };
  }
})();
