/* ============================================================
 * 游戏状态与存档（localStorage 本地存档，单玩家）
 * ============================================================ */
(function () {
  const SAVE_KEY = 'richs_city_save_v1';

  function newGame() {
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
      // 地图：32x24格。初始办公室+停车位
      mapW: 32, mapH: 24,
      buildings: [
        { uid: 'b1', id: 'office_wood', name: '市长办公室', x: 14, y: 10, w: 2, h: 2 },
        { uid: 'b2', id: 'parking', name: '办公室停车场', x: 16, y: 10, w: 3, h: 3 }
      ],
      nextUid: 3,
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
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { console.warn('保存失败', e); }
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
