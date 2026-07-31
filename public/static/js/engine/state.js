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
        { uid: 'b2', id: 'parking', name: '办公室停车位', x: 16, y: 11, w: 2, h: 1 }
      ],
      nextUid: 3,
      vehicles: [],            // 已解锁车辆id
      outfits: [],             // 已解锁装扮id
      gifts: [],               // 待兑换礼物 {name,icon,desc,from,day,claimed}
      lastTaxDay: 0,           // 上次收税的天数
      dailyQuestions: [],      // 今日各居民问题 {residentId, subject, done}
      recentQuestions: [],     // 最近出过的题目(防重复)
      stats: { totalAnswered: 0, totalRight: 0, taxCollected: 0 },
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
      return s;
    } catch (e) { return null; }
  }

  function reset() { localStorage.removeItem(SAVE_KEY); }

  window.GameState = { newGame, save, load, reset, SAVE_KEY };
})();
