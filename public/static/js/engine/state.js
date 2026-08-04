/* ============================================================
 * 游戏状态与存档（localStorage 本地存档，单玩家）
 * ============================================================ */
(function () {
  const SAVE_KEY = 'richs_city_save_v1';

  /* ---------- 地形层：每行一个字符串，'g'=草地 'w'=水面 ---------- */
  /* 生成一条南北向的河：宽2格，可选拐弯；避开 avoid 建筑列表（迁移用） */
  function genTerrain(mapW, mapH, opts) {
    const rows = [];
    for (let y = 0; y < mapH; y++) rows.push('g'.repeat(mapW));
    const o = opts || {};
    const put = (x, y) => {
      if (x < 0 || y < 0 || x >= mapW || y >= mapH) return;
      rows[y] = rows[y].slice(0, x) + 'w' + rows[y].slice(x + 1);
    };
    // 选河道起始列：靠右侧，从 mapW-6 往外找一条不压建筑的垂直带
    let rx = -1;
    const cand = [];
    for (let x = mapW - 6; x >= 2 && cand.length < 8; x--) cand.push(x);
    for (const x of cand) {
      const clash = (o.avoid || []).some(b => x + 2 > b.x && x < b.x + b.w);
      if (!clash) { rx = x; break; }
    }
    if (rx < 0) return { rows, riverX: -1 };   // 实在没地方 → 全草地
    // 拐弯：新档拐 1~2 次，迁移档直河（不冒险压建筑）
    const bends = o.bends ? (1 + Math.floor(Math.random() * 2)) : 0;
    const bendYs = [];
    for (let i = 0; i < bends; i++) bendYs.push(4 + Math.floor(Math.random() * (mapH - 8)));
    bendYs.sort((a, b) => a - b);
    let x = rx;
    for (let y = 0; y < mapH; y++) {
      if (bendYs.includes(y)) {
        const shift = (Math.random() < 0.5 ? -2 : 2);
        const nx = Math.min(mapW - 4, Math.max(2, x + shift));
        // 拐弯行：把旧列到新列之间全部连通（保证船能游过去）
        const lo = Math.min(x, nx), hi = Math.max(x, nx) + 1;
        for (let xx = lo; xx <= hi; xx++) put(xx, y);
        x = nx;
      } else {
        put(x, y); put(x + 1, y);
      }
    }
    return { rows, riverX: rx };
  }

  function newGame() {
    const terr = genTerrain(32, 24, { bends: true, avoid: [{ x: 14, y: 10, w: 5, h: 3 }] });
    const buildings = [
      { uid: 'b1', id: 'office_wood', name: '市长办公室', x: 14, y: 10, w: 2, h: 2 },
      { uid: 'b2', id: 'parking', name: '办公室停车场', x: 16, y: 10, w: 3, h: 3 }
    ];
    let nextUid = 3;
    // 预置一座公路桥：找一行恰好是“宽2的直河”的位置横跨
    if (terr.riverX >= 0) {
      const midY = 12;
      let bestY = -1;
      for (let dy = 0; dy < 20; dy++) {
        for (const y of [midY + dy, midY - dy]) {
          if (y < 1 || y > 22) continue;
          const row = terr.rows[y];
          let x0 = row.indexOf('w');
          if (x0 >= 0 && row.lastIndexOf('w') === x0 + 1) { bestY = y; break; }
        }
        if (bestY >= 0) break;
      }
      if (bestY >= 0) {
        const x0 = terr.rows[bestY].indexOf('w');
        buildings.push({ uid: 'b' + (nextUid++), id: 'bridge_road', name: '迎宾桥', x: x0, y: bestY, w: 2, h: 1 });
      }
    }
    const residents = CATALOG.INITIAL_RESIDENTS.map(r => ({
      id: r.id, name: r.name, emoji: r.emoji,
      skin: r.skin, shirt: r.shirt, pants: r.pants, hat: r.hat,
      level: 1, xp: 0, streak: 0, bestStreak: 0,
      totalRight: 0, totalWrong: 0,
      claimedGifts: [] // 已领取的礼物streak档位
    }));
    return {
      version: 1,
      cityName: "Rich's City",
      grade: 3,                // 当前年级(题目难度)
      day: 1,                  // 游戏天数
      money: 100,
      joy: 50,                 // 快乐值
      residents,
      // 地图：32x24格。初始办公室+停车位；带一条河+一座预置公路桥
      mapW: 32, mapH: 24,
      terrain: terr.rows,
      buildings,
      nextUid,
      vehicles: [],            // 已解锁车辆id
      outfits: [],             // 已解锁装扮id
      gifts: [],               // 待兑换礼物 {name,icon,desc,from,day,claimed}
      lastTaxDay: 0,           // 上次收税的天数
      dailyQuestions: [],      // 今日各居民问题 {residentId, subject, done}
      askedToday: {},          // 今日各居民已答题数 {residentId: n}，每日上限50
      recentQuestions: [],     // 最近出过的题目(防重复)
      mastered: [],            // 已答对的题目(永久不再出现)
      wrongPool: [],           // 错题本：答错的题目完整对象，答对才移出
      reviewQueue: [],         // 遗忘曲线巩固队列 {key, day, snap}，7天后再考一次
      writings: [],            // 孩子的创作作品 {title, text, day, ts}
      reading: null,           // 今日跟读 {idx, day, status:'todo'|'pending'|'approved'}
      createdToday: 0,         // 今日已出创作题数（每日上限2）
      stats: { totalAnswered: 0, totalRight: 0, taxCollected: 0, peakIncome: 0 },
      log: []
    };
  }

  // 特殊建筑：市长办公室（不在商店出售）
  CATALOG.OFFICE = { id: 'office_wood', cat: 'special', name: '市长办公室', icon: '🏛️', cost: 0, w: 2, h: 2, fl: 1.4, color: '#a8763a', desc: '一切开始的地方' };

  function save(state) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      // 通知云同步引擎（cloud.js 监听后防抖推送云端）
      document.dispatchEvent(new CustomEvent('game-saved'));
    } catch (e) { console.warn('保存失败', e); }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.version) return null;
      migrate(s);
      return s;
    } catch (e) { return null; }
  }

  /* 老存档迁移：建筑尺寸调整后自动修正（如 停车场 2x1 → 3x3） */
  // 旧版本“人口解锁”阀值 → 新版本“周收入解锁”阀值，用于让老存档不丢已解锁内容
  const POP_TO_INCOME = [[0, 0], [10, 150], [12, 220], [14, 300], [16, 400], [18, 500], [20, 650],
                        [22, 800], [24, 1000], [30, 1500], [32, 1800], [36, 2400], [40, 3000],
                        [42, 3500], [45, 4200], [48, 5000], [60, 8000]];

  function migrate(s) {
    // 解锁机制改为周收入：按老存档人口换算出等价的历史最高周收入，已解锁的建筑不会被锁回去
    if (!s.stats) s.stats = { totalAnswered: 0, totalRight: 0, taxCollected: 0, peakIncome: 0 };
    if (typeof s.stats.peakIncome !== 'number') {
      const pop = (s.residents || []).length;
      let grandfather = 0;
      for (const [p, inc] of POP_TO_INCOME) if (pop >= p) grandfather = Math.max(grandfather, inc);
      s.stats.peakIncome = grandfather;
    }
    // 高频答题：补齐每日计数器
    if (!s.askedToday) s.askedToday = {};
    if (!s.mastered) s.mastered = [];
    if (!s.wrongPool) s.wrongPool = [];
    if (!s.reviewQueue) s.reviewQueue = [];
    if (!s.writings) s.writings = [];
    if (s.reading === undefined) s.reading = null;
    if (typeof s.createdToday !== 'number') s.createdToday = 0;
    // 地块扩建：老存档补上地图尺寸
    if (!s.mapW) { s.mapW = 32; s.mapH = 24; }
    // v4.0 地形层：老存档生成一条避开现有建筑的直河（没位置就全草地）
    if (!s.terrain || s.terrain.length !== s.mapH || (s.terrain[0] || '').length !== s.mapW) {
      const t = genTerrain(s.mapW, s.mapH, { bends: false, avoid: s.buildings });
      s.terrain = t.rows;
    }
    // 招募居民补上美术贴图 key（按名字匹配候选池）
    for (const r of s.residents) {
      if (r.sprite === undefined) {
        const c = CATALOG.NEW_RESIDENT_POOL.find(x => x.name === r.name);
        r.sprite = c ? (c.sprite || null) : null;
      }
    }
    const free = (x, y, w, h, ignoreUid) => {
      if (x < 0 || y < 0 || x + w > s.mapW || y + h > s.mapH) return false;
      return !s.buildings.some(b => b.uid !== ignoreUid &&
        x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y);
    };
    for (const b of s.buildings) {
      const info = CATALOG.findBuilding(b.id) || (b.id === 'office_wood' ? CATALOG.OFFICE : null);
      if (!info || b.id === 'road') continue;
      const tw = Math.max(info.w, info.h), th = Math.min(info.w, info.h);
      const rotated = b.w < b.h;
      const nw = rotated ? th : tw, nh = rotated ? tw : th;
      if (b.w === nw && b.h === nh) continue;
      // 尺寸变了：先试原地扩张，再螺旋找附近空位
      let placed = false;
      for (let rad = 0; rad <= Math.max(s.mapW, s.mapH) && !placed; rad++) {
        for (let dy = -rad; dy <= rad && !placed; dy++) {
          for (let dx = -rad; dx <= rad && !placed; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
            if (free(b.x + dx, b.y + dy, nw, nh, b.uid)) {
              b.x += dx; b.y += dy; b.w = nw; b.h = nh; placed = true;
            }
          }
        }
      }
    }
  }

  function reset() { localStorage.removeItem(SAVE_KEY); }

  window.GameState = { newGame, save, load, reset, SAVE_KEY };
})();
