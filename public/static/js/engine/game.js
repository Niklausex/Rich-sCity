/* ============================================================
 * 游戏核心引擎：经济 / 天数循环 / 答题 / 建造 / 礼物
 * ============================================================ */
(function () {
  let S = null; // 当前状态

  const G = {
    get state() { return S; },

    init() {
      S = GameState.load();
      let isNew = false;
      if (!S) { S = GameState.newGame(); isNew = true; this.newDayQuestions(); GameState.save(S); }
      return isNew;
    },

    save() { GameState.save(S); },

    /* ---------- 计算属性 ---------- */
    // 建筑对象查找（含特殊办公室）
    bInfo(id) { return id === 'office_wood' ? CATALOG.OFFICE : CATALOG.findBuilding(id); },

    // 人口容量 = 基础8 + 住宅提供
    popCap() {
      let cap = 8;
      for (const b of S.buildings) { const info = this.bInfo(b.id); if (info && info.popCap) cap += info.popCap; }
      return cap;
    },

    // 幸福度 = 基础30 + 公共/配套建筑加成，封顶100
    happiness() {
      let h = 30;
      for (const b of S.buildings) { const info = this.bInfo(b.id); if (info && info.happy) h += info.happy; }
      return Math.min(100, h);
    },

    // 居民周收入合计（工资）
    weeklyResidentIncome() {
      return S.residents.reduce((sum, r) => {
        const career = CATALOG.CAREERS[Math.min(r.level, CATALOG.CAREERS.length) - 1];
        return sum + career.salary;
      }, 0);
    },

    // 产业基础周收入（商铺营业额 + 住宅房祟，不含幸福度浮动）
    baseBusinessIncome() {
      let rev = 0;
      for (const b of S.buildings) { const info = this.bInfo(b.id); if (info && info.income) rev += info.income; }
      return rev;
    },

    // 商业周营业额（受幸福度影响：幸福度越高消费越多，0.5x ~ 1.5x）
    weeklyBusinessRevenue() {
      const factor = 0.5 + this.happiness() / 100;
      return Math.round(this.baseBusinessIncome() * factor);
    },

    /* 城市周收入（解锁、城市等级的唯一指标）
     * = 居民工资合计 + 产业基础收入（不受幸福度浮动影响，数字稳定好理解） */
    weeklyIncome() { return this.weeklyResidentIncome() + this.baseBusinessIncome(); },

    // 历史最高周收入：解锁看这个，拆房子也不会把已解锁的建筑锁回去
    peakIncome() {
      const now = this.weeklyIncome();
      if (!S.stats.peakIncome || S.stats.peakIncome < now) S.stats.peakIncome = now;
      return S.stats.peakIncome;
    },

    // 某建筑是否已解锁
    isUnlocked(info) { return !info || !info.unlockIncome || this.peakIncome() >= info.unlockIncome; },

    // 下一个将解锁的建筑（给 UI 做目标提示）
    nextUnlock() {
      const peak = this.peakIncome();
      let best = null;
      for (const b of CATALOG.BUILDINGS) {
        if (b.unlockIncome > peak && (!best || b.unlockIncome < best.unlockIncome)) best = b;
      }
      return best;
    },

    // 预期周税收 = 居民收入10% + 商业营业额10%
    weeklyTax() {
      return Math.round(this.weeklyResidentIncome() * 0.1 + this.weeklyBusinessRevenue() * 0.1);
    },

    cityRank() {
      const inc = this.peakIncome();
      let rank = CATALOG.CITY_RANKS[0];
      for (const r of CATALOG.CITY_RANKS) if (inc >= r.minIncome) rank = r;
      return rank;
    },

    canCollectTax() { return S.day - S.lastTaxDay >= 7; },
    daysUntilTax() { return Math.max(0, 7 - (S.day - S.lastTaxDay)); },

    /* ---------- 收税 ---------- */
    collectTax() {
      if (!this.canCollectTax()) return { ok: false, msg: `还要等 ${this.daysUntilTax()} 天才能收税` };
      const resTax = Math.round(this.weeklyResidentIncome() * 0.1);
      const bizTax = Math.round(this.weeklyBusinessRevenue() * 0.1);
      const total = resTax + bizTax;
      S.money += total;
      S.lastTaxDay = S.day;
      S.stats.taxCollected += total;
      this.pushLog(`第${S.day}天收税：居民税${resTax}元 + 商业税${bizTax}元 = ${total}元`);
      this.save();
      return { ok: true, resTax, bizTax, total };
    },

    /* ---------- 每日问题 ---------- */
    DAILY_LIMIT: 50,   // 每位居民每天最多提问 50 道
    // 科目权重：偏向 英语/科学/通识
    SUBJECT_WEIGHTS: { english: 30, science: 25, general: 25, math: 12, chinese: 8 },
    rollSubject() {
      const W = this.SUBJECT_WEIGHTS;
      const total = Object.values(W).reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      for (const [s, w] of Object.entries(W)) { r -= w; if (r < 0) return s; }
      return 'english';
    },
    newDayQuestions() {
      // 每天每位居民都可以提问，上限 DAILY_LIMIT 道；初始先挂一道
      S.askedToday = {};                       // {residentId: 今日已答题数}
      S.dailyQuestions = S.residents.map(r => ({
        residentId: r.id,
        subject: this.rollSubject(),
        done: false
      }));
    },
    askedCount(rid) { return (S.askedToday && S.askedToday[rid]) || 0; },
    canAsk(rid) { return this.askedCount(rid) < this.DAILY_LIMIT; },
    // 答完一题后，若未达上限继续给该居民挂新问题
    refillQuestion(rid) {
      if (!this.canAsk(rid)) return null;
      const dq = { residentId: rid, subject: this.rollSubject(), done: false };
      S.dailyQuestions.push(dq);
      return dq;
    },

    pendingQuestions() { return S.dailyQuestions.filter(q => !q.done && this.canAsk(q.residentId)); },

    // 抽取某居民今天的题
    drawFor(dq) {
      const q = Questions.drawQuestion(dq.subject, S.grade, S.recentQuestions);
      return q;
    },

    // 回答结果处理
    answer(dq, question, correct) {
      const r = S.residents.find(x => x.id === dq.residentId);
      dq.done = true;
      if (!S.askedToday) S.askedToday = {};
      S.askedToday[r.id] = (S.askedToday[r.id] || 0) + 1;
      S.stats.totalAnswered++;
      // 记录防重复（扩大到300条，适配高频答题）
      S.recentQuestions.push(question.q);
      if (S.recentQuestions.length > 300) S.recentQuestions.shift();

      const result = { correct, leveledUp: false, gift: null, joyDelta: 0, moneyBonus: 0 };
      if (correct) {
        S.stats.totalRight++;
        r.totalRight++;
        r.streak++;
        if (r.streak > r.bestStreak) r.bestStreak = r.streak;
        r.xp++;
        result.joyDelta = 2;
        S.joy = Math.min(100, S.joy + 2);
        // 答对小奖励金
        result.moneyBonus = 2 + r.level;
        S.money += result.moneyBonus;
        // 升级判定
        const need = CATALOG.xpNeeded(r.level);
        if (r.xp >= need && r.level < CATALOG.CAREERS.length) {
          r.xp = 0; r.level++;
          result.leveledUp = true;
          result.newCareer = CATALOG.CAREERS[r.level - 1];
          this.pushLog(`${r.name} 升到 ${r.level} 级，成为「${result.newCareer.title}」！`);
        }
        // 礼物判定（达到streak档位且未领取）
        for (const g of CATALOG.GIFTS) {
          if (r.streak >= g.streak && !r.claimedGifts.includes(g.streak)) {
            r.claimedGifts.push(g.streak);
            const gift = { name: g.name, icon: g.icon, desc: g.desc, from: r.name, day: S.day, claimed: false };
            S.gifts.push(gift);
            result.gift = gift;
            this.pushLog(`${r.name} 送给市长一张「${g.name}」！(连对${g.streak}题)`);
            break;
          }
        }
      } else {
        r.totalWrong++;
        r.streak = 0;
        result.joyDelta = -1;
        S.joy = Math.max(0, S.joy - 1);
      }
      this.save();
      return result;
    },

    /* ---------- 睡觉/新的一天 ---------- */
    sleep() {
      S.day++;
      this.newDayQuestions();
      this.save();
      return { day: S.day, questions: S.dailyQuestions.length };
    },

    /* ---------- 建造 ---------- */
    isAreaFree(x, y, w, h, ignoreUid) {
      if (x < 0 || y < 0 || x + w > S.mapW || y + h > S.mapH) return false;
      for (const b of S.buildings) {
        if (ignoreUid && b.uid === ignoreUid) continue;
        if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) return false;
      }
      return true;
    },

    buyAndPlace(bid, x, y, rotated) {
      const info = CATALOG.findBuilding(bid);
      if (!info) return { ok: false, msg: '未知建筑' };
      if (!this.isUnlocked(info)) return { ok: false, msg: `周收入达到 ${info.unlockIncome} 元/周才能解锁「${info.name}」` };
      if (S.money < info.cost) return { ok: false, msg: '资金不够，快去答题、收税赚钱吧！' };
      const w = rotated ? info.h : info.w, h = rotated ? info.w : info.h;
      if (!this.isAreaFree(x, y, w, h)) return { ok: false, msg: '这里放不下，换个位置试试' };
      S.money -= info.cost;
      const b = { uid: 'b' + (S.nextUid++), id: bid, name: info.name, x, y, w, h };
      S.buildings.push(b);
      this.pushLog(`建造了「${info.name}」，花费${info.cost}元`);
      this.save();
      return { ok: true, building: b };
    },

    moveBuilding(uid, x, y) {
      const b = S.buildings.find(x2 => x2.uid === uid);
      if (!b) return { ok: false };
      if (!this.isAreaFree(x, y, b.w, b.h, uid)) return { ok: false, msg: '这里放不下' };
      b.x = x; b.y = y;
      this.save();
      return { ok: true };
    },

    renameBuilding(uid, name) {
      const b = S.buildings.find(x => x.uid === uid);
      if (b && name.trim()) { b.name = name.trim().slice(0, 12); this.save(); return true; }
      return false;
    },

    demolish(uid) {
      const i = S.buildings.findIndex(x => x.uid === uid);
      if (i < 0) return false;
      const b = S.buildings[i];
      if (b.id === 'office_wood') return false; // 办公室不能拆
      const info = this.bInfo(b.id);
      const refund = Math.floor((info ? info.cost : 0) / 2);
      S.money += refund;
      S.buildings.splice(i, 1);
      this.pushLog(`拆除了「${b.name}」，退回${refund}元`);
      this.save();
      return refund;
    },

    /* ---------- 招募新居民（由 CATALOG.RECRUIT_ENABLED 控制，本版本暂关）---------- */
    recruitEnabled() { return !!CATALOG.RECRUIT_ENABLED; },

    recruitResident() {
      if (!this.recruitEnabled()) return { ok: false, msg: '本版本暂不开放招募新居民（后续版本开启）' };
      const cost = CATALOG.residentCost(S.residents.length);
      if (S.money < cost) return { ok: false, msg: `招募需要${cost}元，资金不够` };
      if (S.residents.length >= this.popCap()) return { ok: false, msg: '住房不够啦！先建造住宅（木屋/砖房等）' };
      const used = new Set(S.residents.map(r => r.name));
      const candidates = CATALOG.NEW_RESIDENT_POOL.filter(c => !used.has(c.name));
      if (!candidates.length) return { ok: false, msg: '暂时没有新居民想搬来了（后续版本会更多）' };
      const c = candidates[Math.floor(Math.random() * candidates.length)];
      S.money -= cost;
      const colors = CATALOG.FREE_COLORS;
      S.residents.push({
        id: 'r' + Date.now(), name: c.name, emoji: c.emoji, sprite: c.sprite || null,
        skin: '#f5c518', shirt: colors[Math.floor(Math.random() * colors.length)],
        pants: colors[Math.floor(Math.random() * colors.length)], hat: null,
        level: 1, xp: 0, streak: 0, bestStreak: 0, totalRight: 0, totalWrong: 0, claimedGifts: []
      });
      this.pushLog(`新居民「${c.name}」搬进了城市！花费${cost}元`);
      this.save();
      return { ok: true, resident: c, cost };
    },

    /* ---------- 装扮 ---------- */
    buyOutfit(oid) {
      const o = CATALOG.findOutfit(oid);
      if (!o) return { ok: false };
      if (S.outfits.includes(oid)) return { ok: false, msg: '已经拥有了' };
      if (S.money < o.cost) return { ok: false, msg: '资金不够' };
      S.money -= o.cost;
      S.outfits.push(oid);
      this.pushLog(`解锁装扮「${o.name}」`);
      this.save();
      return { ok: true };
    },

    setResidentStyle(rid, patch) {
      const r = S.residents.find(x => x.id === rid);
      if (!r) return false;
      Object.assign(r, patch);
      this.save();
      return true;
    },

    /* ---------- 车辆 ---------- */
    buyVehicle(vid) {
      const v = CATALOG.findVehicle(vid);
      if (!v) return { ok: false };
      if (S.vehicles.includes(vid)) return { ok: false, msg: '已经拥有了' };
      if (v.need && !S.buildings.some(b => b.id === v.need)) {
        const nb = CATALOG.findBuilding(v.need);
        return { ok: false, msg: `需要先建造「${nb.name}」才能解锁` };
      }
      if (S.money < v.cost) return { ok: false, msg: '资金不够，继续努力答题赚钱！' };
      S.money -= v.cost;
      S.vehicles.push(vid);
      S.joy = Math.min(100, S.joy + 3);
      this.pushLog(`解锁了「${v.name}」！`);
      this.save();
      return { ok: true, vehicle: v };
    },

    /* ---------- 礼物 ---------- */
    claimGift(idx) {
      const g = S.gifts[idx];
      if (g && !g.claimed) { g.claimed = true; this.save(); return true; }
      return false;
    },

    /* ---------- 其他 ---------- */
    renameCity(name) { if (name.trim()) { S.cityName = name.trim().slice(0, 16); this.save(); } },
    setGrade(g) { S.grade = g; this.save(); },
    pushLog(msg) { S.log.unshift(`[第${S.day}天] ${msg}`); if (S.log.length > 60) S.log.pop(); },
    resetGame() { GameState.reset(); location.reload(); }
  };

  window.Game = G;
})();
