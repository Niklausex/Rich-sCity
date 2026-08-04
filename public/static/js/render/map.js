/* ============================================================
 * 城市地图渲染 v2：等距2.5D乐高积木风格
 * - 立体积木建筑(三面体+凸点+窗户)
 * - 乐高小人在地图上走动、生活(气泡/问号)
 * - 汽车沿道路行驶、飞机飞过天空
 * - 云朵漂浮、昼夜光影
 * ============================================================ */
(function () {
  const canvas = document.getElementById('map-canvas');
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('map-container');

  /* ---------- 等距参数 ---------- */
  let TW = 64;                       // 菱形格宽(px)，高=宽/2
  const FLOOR_H = 0.55;              // 每层楼高 = TW * FLOOR_H
  let camX = 0, camY = 0;
  let dragging = false, dragMoved = false, lastMX = 0, lastMY = 0;
  let placing = null, selectedUid = null;
  let time = 0;

  const TH = () => TW / 2;
  const iso = (gx, gy) => ({ x: camX + (gx - gy) * TW / 2, y: camY + (gx + gy) * TH() / 2 });
  const unIso = (px, py) => {
    const ix = px - camX, iy = py - camY;
    return { gx: (ix / (TW / 2) + iy / (TH() / 2)) / 2, gy: (iy / (TH() / 2) - ix / (TW / 2)) / 2 };
  };

  /* ---------- 颜色工具 ---------- */
  function shade(hex, amt) {
    let r, g, b;
    if (hex[0] === '#') { const n = parseInt(hex.slice(1), 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
    else return hex;
    r = Math.max(0, Math.min(255, r + amt)); g = Math.max(0, Math.min(255, g + amt)); b = Math.max(0, Math.min(255, b + amt));
    return `rgb(${r},${g},${b})`;
  }

  function resize() { canvas.width = container.clientWidth; canvas.height = container.clientHeight; }
  window.addEventListener('resize', resize);

  function fitView() {
    const S = Game.state;
    TW = Math.max(34, Math.min(78, Math.floor(canvas.width / S.mapW * 1.55)));
    const c = iso(S.mapW / 2, S.mapH / 2);
    camX += canvas.width / 2 - c.x;
    camY += canvas.height / 2 - c.y + TW * 0.5;
  }

  /* ============================================================
   * 居民行走系统
   * ============================================================ */
  const walkers = [];  // {rid, x, y, tx, ty, speed, phase, pauseT, bubble, bubbleT, dir}
  const BUBBLES = ['🍞', '☕', '🎵', '💬', '🌸', '⚽', '📖', '🍦', '🛒', '🎈'];

  /* 某格被哪座建筑占用（无则 null） */
  function buildingAt(gx, gy) {
    const S = Game.state;
    for (const b of S.buildings) {
      if (gx >= b.x && gx < b.x + b.w && gy >= b.y && gy < b.y + b.h) return b;
    }
    return null;
  }

  /* 可通行：草地 + 道路。所有建筑（含公园/停车场等平铺地块）都不可进入，
     避免小人被贴图遮住、看起来"走进建筑里面/底部" */
  function isWalkable(gx, gy) {
    const S = Game.state;
    if (gx < 0 || gy < 0 || gx >= S.mapW || gy >= S.mapH) return false;
    const b = buildingAt(gx, gy);
    if (Game.isWater(gx, gy)) return !!b && b.id === 'bridge_road';  // 水面只能走公路桥
    return !b || b.id === 'road';
  }

  function isRoad(gx, gy) {
    return Game.state.buildings.some(b => (b.id === 'road' || b.id === 'bridge_road') && gx >= b.x && gx < b.x + b.w && gy >= b.y && gy < b.y + b.h);
  }

  function isRail(gx, gy) {
    return Game.state.buildings.some(b => (b.id === 'rail' || b.id === 'bridge_rail') && gx >= b.x && gx < b.x + b.w && gy >= b.y && gy < b.y + b.h);
  }

  /* 以 (gx,gy) 为起点螺旋查找最近的可通行格（用于出生/被建筑压住时脱困） */
  function nearestWalkable(gx, gy) {
    const S = Game.state;
    const maxR = Math.max(S.mapW, S.mapH);
    for (let rad = 0; rad <= maxR; rad++) {
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
          const x = gx + dx, y = gy + dy;
          if (isWalkable(x, y)) return { gx: x, gy: y };
        }
      }
    }
    return { gx: 0, gy: 0 };
  }

  function syncWalkers() {
    const S = Game.state;
    for (const r of S.residents) {
      if (!walkers.find(w => w.rid === r.id)) {
        // 出生在办公室门口最近的可走格子
        const office = S.buildings[0];
        const spot = nearestWalkable(office.x + Math.floor(office.w / 2), office.y + office.h);
        walkers.push({
          rid: r.id, x: spot.gx + 0.5, y: spot.gy + 0.5, tx: spot.gx, ty: spot.gy,
          speed: 0.35 + Math.random() * 0.25, phase: Math.random() * 10,
          pauseT: Math.random() * 2, bubble: null, bubbleT: 0, dir: 1
        });
      }
    }
    for (let i = walkers.length - 1; i >= 0; i--) if (!S.residents.find(r => r.id === walkers[i].rid)) walkers.splice(i, 1);
  }

  /* 被新建筑压住 / 目标格已被占用时脱困 */
  function unstick(w) {
    const cx = Math.floor(w.x), cy = Math.floor(w.y);
    if (!isWalkable(cx, cy)) {
      const spot = nearestWalkable(cx, cy);
      w.x = spot.gx + 0.5; w.y = spot.gy + 0.5;
      w.tx = spot.gx; w.ty = spot.gy;
      w.pauseT = 0.2;
      return true;
    }
    if (!isWalkable(w.tx, w.ty)) { w.tx = cx; w.ty = cy; w.pauseT = 0.1; return true; }
    return false;
  }

  function pickTarget(w) {
    const cx = Math.floor(w.x), cy = Math.floor(w.y);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => Math.random() - 0.5);
    // 优先走道路
    for (const d of dirs) if (isRoad(cx + d[0], cy + d[1]) && Math.random() < 0.85) return { tx: cx + d[0], ty: cy + d[1] };
    for (const d of dirs) if (isWalkable(cx + d[0], cy + d[1])) return { tx: cx + d[0], ty: cy + d[1] };
    return null;
  }

  function updateWalkers(dt) {
    for (const w of walkers) {
      w.phase += dt * 7;
      if (w.bubbleT > 0) { w.bubbleT -= dt; if (w.bubbleT <= 0) w.bubble = null; }
      else if (Math.random() < dt * 0.05) { w.bubble = BUBBLES[Math.floor(Math.random() * BUBBLES.length)]; w.bubbleT = 2.5; }

      if (unstick(w)) continue;
      if (w.pauseT > 0) { w.pauseT -= dt; continue; }
      const dx = w.tx + 0.5 - w.x, dy = w.ty + 0.5 - w.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.04) {
        const t = pickTarget(w);
        if (t) { w.tx = t.tx; w.ty = t.ty; w.pauseT = Math.random() < 0.3 ? 0.6 + Math.random() * 1.6 : 0; }
        else w.pauseT = 1;
      } else {
        const mv = Math.min(dist, w.speed * dt);
        w.x += dx / dist * mv; w.y += dy / dist * mv;
        w.dir = (dx - dy) >= 0 ? 1 : -1;
      }
    }
  }

  /* ============================================================
   * 车辆行驶系统（汽车沿道路开）
   * ============================================================ */
  const cars = []; // {vid, x, y, tx, ty, px, py(上一格), speed}
  function syncCars() {
    const S = Game.state;
    const drivable = S.vehicles.filter(v => { const info = CATALOG.findVehicle(v); return info && (info.type === 'car' || info.type === 'service'); });
    const roads = [];
    for (const b of S.buildings) if (b.id === 'road') roads.push({ x: b.x, y: b.y });
    for (const vid of drivable) {
      if (!cars.find(c => c.vid === vid)) {
        const r = roads.length ? roads[Math.floor(Math.random() * roads.length)] : null;
        cars.push({ vid, x: r ? r.x + 0.5 : -1, y: r ? r.y + 0.5 : -1, tx: r ? r.x : 0, ty: r ? r.y : 0, px: -9, py: -9, speed: 1.1 + Math.random() * 0.8, onRoad: !!r });
      }
    }
    for (let i = cars.length - 1; i >= 0; i--) if (!drivable.includes(cars[i].vid)) cars.splice(i, 1);
    // 若有车没路，尝试重新放到路上
    for (const c of cars) if (!c.onRoad && roads.length) { const r = roads[Math.floor(Math.random() * roads.length)]; c.x = r.x + 0.5; c.y = r.y + 0.5; c.tx = r.x; c.ty = r.y; c.onRoad = true; }
  }

  function updateCars(dt) {
    for (const c of cars) {
      if (!c.onRoad) continue;
      // 脚下的路被拆了 → 下一帧由 syncCars 重新安排到别的路上
      if (!isRoad(Math.floor(c.x), Math.floor(c.y))) { c.onRoad = false; continue; }
      const dx = c.tx + 0.5 - c.x, dy = c.ty + 0.5 - c.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.05) {
        const cx = c.tx, cy = c.ty;
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(d => isRoad(cx + d[0], cy + d[1]) && !(cx + d[0] === c.px && cy + d[1] === c.py));
        let next = null;
        if (dirs.length) next = dirs[Math.floor(Math.random() * dirs.length)];
        else if (isRoad(c.px, c.py)) next = [c.px - cx, c.py - cy];
        if (next) { c.px = cx; c.py = cy; c.tx = cx + next[0]; c.ty = cy + next[1]; }
      } else {
        const mv = Math.min(dist, c.speed * dt);
        c.x += dx / dist * mv; c.y += dy / dist * mv;
      }
    }
  }

  /* ============================================================
   * 火车沿铁轨开（与汽车同模式）
   * ============================================================ */
  const trains = []; // {vid, x, y, tx, ty, px, py, speed, onRail}
  function syncTrains() {
    const S = Game.state;
    const owned = S.vehicles.filter(v => { const i = CATALOG.findVehicle(v); return i && i.type === 'train'; });
    if (!owned.length) { trains.length = 0; return; }
    const rails = [];
    for (const b of S.buildings) if (b.id === 'rail' || b.id === 'bridge_rail')
      for (let gy = b.y; gy < b.y + b.h; gy++) for (let gx = b.x; gx < b.x + b.w; gx++) rails.push({ x: gx, y: gy });
    for (const vid of owned) {
      if (!trains.find(t => t.vid === vid)) {
        const r = rails.length ? rails[Math.floor(Math.random() * rails.length)] : null;
        trains.push({ vid, x: r ? r.x + 0.5 : -1, y: r ? r.y + 0.5 : -1, tx: r ? r.x : 0, ty: r ? r.y : 0, px: -9, py: -9, speed: 1.7 + Math.random() * 0.9, onRail: !!r });
      }
    }
    for (let i = trains.length - 1; i >= 0; i--) if (!owned.includes(trains[i].vid)) trains.splice(i, 1);
    for (const t of trains) if (!t.onRail && rails.length) { const r = rails[Math.floor(Math.random() * rails.length)]; t.x = r.x + 0.5; t.y = r.y + 0.5; t.tx = r.x; t.ty = r.y; t.onRail = true; }
  }

  function updateTrains(dt) {
    for (const t of trains) {
      if (!t.onRail) continue;
      if (!isRail(Math.floor(t.x), Math.floor(t.y))) { t.onRail = false; continue; }
      const dx = t.tx + 0.5 - t.x, dy = t.ty + 0.5 - t.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.05) {
        const cx = t.tx, cy = t.ty;
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(d => isRail(cx + d[0], cy + d[1]) && !(cx + d[0] === t.px && cy + d[1] === t.py));
        let next = null;
        if (dirs.length) next = dirs[Math.floor(Math.random() * dirs.length)];
        else if (isRail(t.px, t.py)) next = [t.px - cx, t.py - cy];
        if (next) { t.px = cx; t.py = cy; t.tx = cx + next[0]; t.ty = cy + next[1]; }
      } else {
        const mv = Math.min(dist, t.speed * dt);
        t.x += dx / dist * mv; t.y += dy / dist * mv;
      }
    }
  }

  /* ============================================================
   * 轮船在河面巡游（需要港口紧邻水面才出航）
   * ============================================================ */
  const ships = []; // {vid, x, y, tx, ty, px, py, speed, onWater}
  function harborByWater() {
    const S = Game.state;
    return S.buildings.some(b => {
      if (b.id !== 'harbor') return false;
      for (let gx = b.x - 1; gx <= b.x + b.w; gx++) if (Game.isWater(gx, b.y - 1) || Game.isWater(gx, b.y + b.h)) return true;
      for (let gy = b.y - 1; gy <= b.y + b.h; gy++) if (Game.isWater(b.x - 1, gy) || Game.isWater(b.x + b.w, gy)) return true;
      return false;
    });
  }
  function syncShips() {
    const S = Game.state;
    const owned = S.vehicles.filter(v => { const i = CATALOG.findVehicle(v); return i && i.type === 'ship'; });
    if (!owned.length || !harborByWater()) { ships.length = 0; return; }
    let waters = null;
    const collect = () => {
      if (waters) return waters;
      waters = [];
      for (let gy = 0; gy < S.mapH; gy++) for (let gx = 0; gx < S.mapW; gx++) if (Game.isWater(gx, gy)) waters.push({ x: gx, y: gy });
      return waters;
    };
    for (const vid of owned) {
      if (!ships.find(s => s.vid === vid)) {
        const ws = collect();
        const r = ws.length ? ws[Math.floor(Math.random() * ws.length)] : null;
        ships.push({ vid, x: r ? r.x + 0.5 : -1, y: r ? r.y + 0.5 : -1, tx: r ? r.x : 0, ty: r ? r.y : 0, px: -9, py: -9, speed: 0.5 + Math.random() * 0.3, onWater: !!r });
      }
    }
    for (let i = ships.length - 1; i >= 0; i--) if (!owned.includes(ships[i].vid)) ships.splice(i, 1);
  }

  function updateShips(dt) {
    for (const s of ships) {
      if (!s.onWater) continue;
      if (!Game.isWater(Math.floor(s.x), Math.floor(s.y))) { s.onWater = false; continue; }
      const dx = s.tx + 0.5 - s.x, dy = s.ty + 0.5 - s.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.05) {
        const cx = s.tx, cy = s.ty;
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(d => Game.isWater(cx + d[0], cy + d[1]) && !(cx + d[0] === s.px && cy + d[1] === s.py));
        let next = null;
        if (dirs.length) next = dirs[Math.floor(Math.random() * dirs.length)];
        else if (Game.isWater(s.px, s.py)) next = [s.px - cx, s.py - cy];
        if (next) { s.px = cx; s.py = cy; s.tx = cx + next[0]; s.ty = cy + next[1]; }
      } else {
        const mv = Math.min(dist, s.speed * dt);
        s.x += dx / dist * mv; s.y += dy / dist * mv;
      }
    }
  }

  /* ---------- 飞机飞过天空（有贴图用贴图，否则 emoji） ---------- */
  let flyer = null; // {vid, icon, x, y, vx}
  function updateFlyer(dt) {
    const S = Game.state;
    if (!flyer) {
      const planes = S.vehicles.map(CATALOG.findVehicle).filter(v => v && (v.type === 'plane' || v.type === 'rocket'));
      if (planes.length && Math.random() < dt * 0.06) {
        const p = planes[Math.floor(Math.random() * planes.length)];
        flyer = { vid: p.id, icon: p.icon, x: -120, y: 40 + Math.random() * canvas.height * 0.25, vx: 60 + Math.random() * 50 };
      }
    } else {
      flyer.x += flyer.vx * dt;
      if (flyer.x > canvas.width + 140) flyer = null;
    }
  }

  /* ---------- 云朵 ---------- */
  const clouds = [];
  for (let i = 0; i < 4; i++) clouds.push({ x: Math.random() * 1600, y: 20 + Math.random() * 130, s: 0.7 + Math.random() * 0.9, v: 6 + Math.random() * 8 });

  /* ============================================================
   * 绘制
   * ============================================================ */
  function diamond(cx, cy, w, h) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - h / 2);
    ctx.lineTo(cx + w / 2, cy);
    ctx.lineTo(cx, cy + h / 2);
    ctx.lineTo(cx - w / 2, cy);
    ctx.closePath();
  }

  function drawGround() {
    const S = Game.state;
    // 天空
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#8fd3f4'); sky.addColorStop(0.55, '#c8ecf8'); sky.addColorStop(1, '#e8f8e0');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // 云
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const cl of clouds) {
      const x = cl.x % (canvas.width + 300) - 150;
      ctx.beginPath();
      ctx.ellipse(x, cl.y, 42 * cl.s, 16 * cl.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 30 * cl.s, cl.y - 9 * cl.s, 30 * cl.s, 14 * cl.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 30 * cl.s, cl.y + 3 * cl.s, 26 * cl.s, 12 * cl.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 底板侧壁（乐高底板厚度）
    const p0 = iso(0, 0), p1 = iso(S.mapW, 0), p2 = iso(S.mapW, S.mapH), p3 = iso(0, S.mapH);
    const d = TW * 0.22;
    ctx.fillStyle = '#4e8c34';
    ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p2.x, p2.y + d); ctx.lineTo(p3.x, p3.y + d); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3e7229';
    ctx.beginPath(); ctx.moveTo(p2.x, p2.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p1.x, p1.y + d); ctx.lineTo(p2.x, p2.y + d); ctx.closePath(); ctx.fill();

    // 草地格子（有 ground_grass 贴图就用贴图，否则代码绘制）
    const grassA = Assets.opt('ground_grass'), grassB = Assets.opt('ground_grass2') || grassA;
    const waterA = Assets.opt('river_tile'), waterB = Assets.opt('river_tile2') || waterA;
    for (let gy = 0; gy < S.mapH; gy++) {
      for (let gx = 0; gx < S.mapW; gx++) {
        const p = iso(gx + 0.5, gy + 0.5);
        if (p.x < -TW || p.x > canvas.width + TW || p.y < -TW || p.y > canvas.height + TW) continue;
        // 河水：和草地同层同画法，贴图交替铺（无贴图时代码画蓝色菱形 + 微波光）
        if (Game.isWater(gx, gy)) {
          const wim = (gx + gy) % 2 ? waterA : waterB;
          if (wim) { ctx.drawImage(wim, p.x - TW / 2, p.y - TH() / 2, TW, TH()); continue; }
          diamond(p.x, p.y, TW, TH());
          ctx.fillStyle = (gx + gy) % 2 ? '#3fa9e8' : '#38a1e1';
          ctx.fill();
          if (TW >= 40) {
            ctx.beginPath();
            ctx.ellipse(p.x + Math.sin(time * 1.2 + gx * 2 + gy) * TW * 0.06, p.y, TW * 0.14, TW * 0.04, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill();
          }
          continue;
        }
        const gim = (gx + gy) % 2 ? grassA : grassB;
        if (gim) { ctx.drawImage(gim, p.x - TW / 2, p.y - TH() / 2, TW, TH()); continue; }
        diamond(p.x, p.y, TW, TH());
        ctx.fillStyle = (gx + gy) % 2 ? '#7ec850' : '#79c24b';
        ctx.fill();
        // 乐高凸点(椭圆)
        if (TW >= 40) {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y - 1.2, TW * 0.11, TW * 0.055, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, TW * 0.11, TW * 0.055, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(90,150,60,0.85)'; ctx.fill();
        }
      }
    }
  }

  /* ---------- 平铺地面贴图（停车场等）：贴图等距角度和网格不一致时压扁校正 ----------
   * parking.webp 实测：520×351，沥青菱形 x:1..518 / y:20..349（宽517 高329，比例0.636），
   * 底角在 (266,349)。游戏网格菱形比例是 0.5 → 垂直压扁 517/(2*329)=0.786，
   * 并把沥青底角精确钉在占地菱形前角 pC 上，彻底解决"悬空/偏小"。 */
  const FLAT_SPRITES = { parking: { imW: 520, imH: 351, lotW: 517, lotH: 329, anchorX: 266, anchorY: 349 } };
  function drawFlatSprite(b, im, pB2, pC, pD, selected) {
    const g = FLAT_SPRITES[b.id];
    const footW = pB2.x - pD.x;
    const s = footW / g.lotW;                       // 横向：沥青宽 = 占地菱形宽
    const k = (footW / 2 * (b.h / b.w)) / (g.lotH * s); // 纵向压扁到网格比例
    const w = g.imW * s, h = g.imH * s * k;
    const dx = pC.x - g.anchorX * s;
    const dy = pC.y + 2 - g.anchorY * s * k;        // +2px 让路缘石微微咬进草地
    if (selected) { ctx.save(); ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 16; }
    ctx.drawImage(im, dx, dy, w, h);
    if (selected) ctx.restore();
  }

  /* ---------- 建筑贴图渲染（美术资产） ---------- */
  function drawBuildingSprite(b, im, pB2, pC, pD, selected) {
    if (FLAT_SPRITES[b.id]) { drawFlatSprite(b, im, pB2, pC, pD, selected); return; }
    // 贴图宽度对齐等距占地菱形宽度，底部锚在前角 pC
    const info = Game.bInfo(b.id);
    const spr = (info && info.spr) || 1;      // 真实比例系数（垃圾桶/长椅等小物不占满格）
    const footW = pB2.x - pD.x;
    const w = footW * 1.1 * spr;
    const h = w * (im.naturalHeight / im.naturalWidth);
    const cx = (pD.x + pB2.x) / 2;
    const midY = (pD.y + pB2.y) / 2;
    // 小物锚在格子中心附近，建筑锚在前角
    const by = spr < 1 ? midY + (pC.y - midY) * (0.35 + spr * 0.5) : pC.y + TH() * 0.22;
    // 柔和接地阴影
    ctx.beginPath();
    ctx.ellipse(cx, spr < 1 ? by - 1 : pC.y - (pC.y - midY) / 2, footW * 0.5 * spr, footW * 0.16 * spr, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30,60,20,0.18)'; ctx.fill();
    if (selected) {
      ctx.save();
      ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 16;
      ctx.drawImage(im, cx - w / 2, by - h, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(im, cx - w / 2, by - h, w, h);
    }
  }

  /* ---------- 立体积木建筑 ---------- */
  function drawBuildingIso(b, selected) {
    const info = Game.bInfo(b.id);
    if (!info) return;
    const fl = info.fl != null ? info.fl : 1;
    const z = fl * TW * FLOOR_H;
    const pA = iso(b.x, b.y), pB = iso(b.x + b.w, b.y), pC = iso(b.x + b.w, b.y + b.h), pD = iso(b.x, b.y + b.h);
    const sprH = TW * (b.w + b.h) * 1.4; // 贴图可能很高，放宽裁剪上界
    if (pC.y < -sprH || pA.y > canvas.height + z + 60 || pD.x > canvas.width + 60 || pB.x < -60) return;
    const color = info.color;

    if (b.id === 'road') { drawRoadIso(b, pA, pB, pC, pD); return; }
    if (b.id === 'rail') { drawRailIso(b); return; }

    // —— 优先使用美术贴图（已交付资产 + manifest 里新放进来的贴图）——
    const bim = Assets.opt(b.id);
    if (bim) {
      drawBuildingSprite(b, bim, pB, pC, pD, selected);
      drawNamePlate(b, pA, pC);
      return;
    }

    // —— 装饰小物（无贴图时）：不画彩色地块，只画阴影 + 大 emoji ——
    if (info.cat === 'deco') {
      const cx = (pA.x + pC.x) / 2, cy = (pA.y + pC.y) / 2;
      ctx.fillStyle = 'rgba(30,60,20,0.22)';
      ctx.beginPath(); ctx.ellipse(cx, cy, TW * 0.3, TW * 0.15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.font = `${Math.round(TW * 0.85)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(info.icon, cx, cy - 2);
      if (selected) {
        ctx.strokeStyle = '#f5c518'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(cx, cy, TW * 0.34, TW * 0.18, 0, 0, Math.PI * 2); ctx.stroke();
      }
      return;
    }

    // 地基阴影
    ctx.fillStyle = 'rgba(30,60,20,0.25)';
    ctx.beginPath(); ctx.moveTo(pA.x + 4, pA.y + 3); ctx.lineTo(pB.x + 4, pB.y + 3); ctx.lineTo(pC.x + 4, pC.y + 3); ctx.lineTo(pD.x + 4, pD.y + 3); ctx.closePath(); ctx.fill();

    if (fl <= 0.35) {
      // —— 平铺地块(公园/停车场等)：彩色地板+装饰 ——
      ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); ctx.lineTo(pC.x, pC.y); ctx.lineTo(pD.x, pD.y); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = shade(color, -30); ctx.lineWidth = 1.5; ctx.stroke();
      if (b.id === 'parking') {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
        for (let i = 1; i < b.w; i++) {
          const q1 = iso(b.x + i, b.y), q2 = iso(b.x + i, b.y + b.h);
          ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
        }
      }
      drawIconAndLabel(b, info, 0, pA, pB, pC, pD, true);
      return;
    }

    // —— 立体积木 ——
    const zA = { x: pA.x, y: pA.y - z }, zB = { x: pB.x, y: pB.y - z }, zC = { x: pC.x, y: pC.y - z }, zD = { x: pD.x, y: pD.y - z };
    // 右面(东南)
    ctx.beginPath(); ctx.moveTo(pB.x, pB.y); ctx.lineTo(pC.x, pC.y); ctx.lineTo(zC.x, zC.y); ctx.lineTo(zB.x, zB.y); ctx.closePath();
    ctx.fillStyle = shade(color, -42); ctx.fill();
    // 左面(西南)
    ctx.beginPath(); ctx.moveTo(pD.x, pD.y); ctx.lineTo(pC.x, pC.y); ctx.lineTo(zC.x, zC.y); ctx.lineTo(zD.x, zD.y); ctx.closePath();
    ctx.fillStyle = shade(color, -16); ctx.fill();

    // 窗户（楼层≥1的建筑）
    if (fl >= 1 && TW >= 36) {
      const floors = Math.max(1, Math.round(fl));
      drawWindows(pD, pC, zD, floors, b.h, shade(color, -16));
      drawWindows(pC, pB, zC, floors, b.w, shade(color, -42), true);
    }

    // 顶面
    ctx.beginPath(); ctx.moveTo(zA.x, zA.y); ctx.lineTo(zB.x, zB.y); ctx.lineTo(zC.x, zC.y); ctx.lineTo(zD.x, zD.y); ctx.closePath();
    ctx.fillStyle = shade(color, 26); ctx.fill();
    ctx.strokeStyle = shade(color, -50); ctx.lineWidth = 1.2; ctx.stroke();
    // 侧棱高光
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(zD.x, zD.y); ctx.lineTo(pD.x, pD.y); ctx.stroke();

    // 顶部乐高凸点
    if (TW >= 36) {
      for (let sy = 0; sy < b.h; sy++) for (let sx = 0; sx < b.w; sx++) {
        const p = iso(b.x + sx + 0.5, b.y + sy + 0.5);
        const cy = p.y - z;
        ctx.beginPath(); ctx.ellipse(p.x, cy - TW * 0.045, TW * 0.13, TW * 0.065, 0, 0, Math.PI * 2);
        ctx.fillStyle = shade(color, 48); ctx.fill();
        ctx.beginPath(); ctx.ellipse(p.x, cy, TW * 0.13, TW * 0.065, 0, Math.PI, 0, true);
        ctx.fillStyle = shade(color, 6); ctx.fill();
        ctx.beginPath(); ctx.ellipse(p.x, cy - TW * 0.045, TW * 0.13, TW * 0.065, 0, 0, Math.PI * 2);
        ctx.strokeStyle = shade(color, -20); ctx.lineWidth = 0.8; ctx.stroke();
      }
    }

    drawIconAndLabel(b, info, z, pA, pB, pC, pD, false);
  }

  function drawWindows(pBot1, pBot2, pTop1, floors, tiles, faceColor, isRight) {
    const winPerTile = 2;
    const n = tiles * winPerTile;
    const zH = pBot1.y - pTop1.y;
    const fh = zH / floors;
    for (let f = 0; f < floors; f++) {
      for (let i = 0; i < n; i++) {
        const t1 = (i + 0.25) / n, t2 = (i + 0.75) / n;
        const bx1 = pBot1.x + (pBot2.x - pBot1.x) * t1, by1 = pBot1.y + (pBot2.y - pBot1.y) * t1;
        const bx2 = pBot1.x + (pBot2.x - pBot1.x) * t2, by2 = pBot1.y + (pBot2.y - pBot1.y) * t2;
        const yTop = -(f + 0.72) * fh, yBot = -(f + 0.3) * fh;
        ctx.beginPath();
        ctx.moveTo(bx1, by1 + yTop); ctx.lineTo(bx2, by2 + yTop);
        ctx.lineTo(bx2, by2 + yBot); ctx.lineTo(bx1, by1 + yBot);
        ctx.closePath();
        ctx.fillStyle = isRight ? '#9ed9f0' : '#c3ecfa';
        ctx.fill();
      }
    }
  }

  function drawRoadIso(b, pA, pB, pC, pD) {
    const bx = b.x, by = b.y;
    const nRoads = (isRoad(bx + 1, by) ? 1 : 0) + (isRoad(bx - 1, by) ? 1 : 0) +
                   (isRoad(bx, by + 1) ? 1 : 0) + (isRoad(bx, by - 1) ? 1 : 0);
    // 有路面贴图就用贴图（三向以上路口优先斑马线贴图），标线仍由代码画，保证拼接方向正确
    const rim = (nRoads >= 3 ? Assets.opt('road_crosswalk') : null) || Assets.opt('road_tile');
    if (rim) {
      const p = iso(bx + 0.5, by + 0.5);
      ctx.drawImage(rim, p.x - TW / 2, p.y - TH() / 2, TW, TH());
      if (nRoads < 3) drawRoadMarks(b);
      return;
    }
    ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); ctx.lineTo(pC.x, pC.y); ctx.lineTo(pD.x, pD.y); ctx.closePath();
    ctx.fillStyle = '#5a5a5a'; ctx.fill();
    ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 1; ctx.stroke();
    drawRoadMarks(b);
  }

  /* ---------- 铁轨（独立铺在地块上，按邻接自动选直轨/弯轨/道口并做等距旋转） ----------
   * 贴图实测（素某4 新批次）：rail_tile 轨道沿 y 轴(NE↔SW)，rail_curve 连 -x/-y(NW&NE)，rail_cross 铁轨沿 y 轴。
   * 等距世界旋转90°在屏幕坐标里是线性变换 M=[[0,-2],[0.5,0]]（菱形映射回菱形），
   * 用 ctx.transform 即可得到全部 4 个朝向，比水平镜像更通用（镜像凑不齐弯轨4向）。 */
  function railRot(k) {
    if (k === 1) ctx.transform(0, 0.5, -2, 0, 0, 0);        // 世界旋转90°
    else if (k === 2) ctx.transform(-1, 0, 0, -1, 0, 0);    // 180°
    else if (k === 3) ctx.transform(0, -0.5, 2, 0, 0, 0);   // 270°
  }
  function drawRailIso(b) {
    const x = b.x, y = b.y;
    const rN = isRail(x, y - 1), rS = isRail(x, y + 1), rE = isRail(x + 1, y), rW = isRail(x - 1, y);
    const railY = rN || rS, railX = rE || rW;
    const p = iso(x + 0.5, y + 0.5);
    let im = null, k = 0;
    if (railY && railX) {
      im = Assets.opt('rail_curve');
      if (rW && rN) k = 0;            // 连 -x/-y（原图）
      else if (rN && rE) k = 1;       // -y/+x
      else if (rE && rS) k = 2;       // +x/+y
      else k = 3;                     // +y/-x
    } else {
      // 直轨（孤立轨默认沿 y 轴）；有垂直方向的公路 → 道口贴图
      const perp = railX ? (isRoad(x, y + 1) || isRoad(x, y - 1)) : (isRoad(x + 1, y) || isRoad(x - 1, y));
      im = (perp ? Assets.opt('rail_cross') : null) || Assets.opt('rail_tile');
      k = railX ? 1 : 0;              // 原图沿 y 轴，x 轴方向旋转90°
    }
    if (im) {
      ctx.save();
      ctx.translate(p.x, p.y);
      railRot(k);
      ctx.drawImage(im, -TW / 2, -TH() / 2, TW, TH());
      ctx.restore();
      return;
    }
    // 代码兜底：两条深色钢轨 + 枕木色底
    const along = railX ? [[x, y + 0.5], [x + 1, y + 0.5]] : [[x + 0.5, y], [x + 0.5, y + 1]];
    ctx.strokeStyle = '#6b5744'; ctx.lineWidth = TW * 0.16;
    const e1 = iso(along[0][0], along[0][1]), e2 = iso(along[1][0], along[1][1]);
    ctx.beginPath(); ctx.moveTo(e1.x, e1.y); ctx.lineTo(e2.x, e2.y); ctx.stroke();
    ctx.strokeStyle = '#8d8d95'; ctx.lineWidth = Math.max(1.5, TW * 0.04);
    ctx.beginPath(); ctx.moveTo(e1.x, e1.y - TW * 0.03); ctx.lineTo(e2.x, e2.y - TW * 0.03); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(e1.x, e1.y + TW * 0.03); ctx.lineTo(e2.x, e2.y + TW * 0.03); ctx.stroke();
  }

  /* 道路标线：按邻接方向代码绘制（任意拼接方向都不会歪） */
  function drawRoadMarks(b) {
    const cx = b.x, cy = b.y;
    const c = iso(cx + 0.5, cy + 0.5);
    ctx.strokeStyle = '#f5c518'; ctx.lineWidth = Math.max(1.5, TW * 0.045);
    ctx.setLineDash([TW * 0.14, TW * 0.12]);
    let drew = false;
    if (isRoad(cx + 1, cy) || isRoad(cx - 1, cy)) {
      const e1 = iso(cx, cy + 0.5), e2 = iso(cx + 1, cy + 0.5);
      ctx.beginPath(); ctx.moveTo(e1.x, e1.y); ctx.lineTo(e2.x, e2.y); ctx.stroke(); drew = true;
    }
    if (isRoad(cx, cy + 1) || isRoad(cx, cy - 1)) {
      const e1 = iso(cx + 0.5, cy), e2 = iso(cx + 0.5, cy + 1);
      ctx.beginPath(); ctx.moveTo(e1.x, e1.y); ctx.lineTo(e2.x, e2.y); ctx.stroke(); drew = true;
    }
    if (!drew) { ctx.beginPath(); ctx.arc(c.x, c.y, TW * 0.05, 0, Math.PI * 2); ctx.stroke(); }
    ctx.setLineDash([]);
  }

  function drawIconAndLabel(b, info, z, pA, pB, pC, pD, flat) {
    const cx = (pA.x + pC.x) / 2, cy = (pA.y + pC.y) / 2 - z;
    const size = Math.min(b.w, b.h) * TW * (flat ? 0.42 : 0.4);
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(info.icon, cx, cy - (flat ? 2 : size * 0.28));
    drawNamePlate(b, pA, pC);
  }

  function drawNamePlate(b, pA, pC) {
    if (TW < 44) return;
    const cx = (pA.x + pC.x) / 2;
    ctx.font = `800 ${Math.max(10, TW * 0.17)}px "PingFang SC","Microsoft YaHei",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw2 = ctx.measureText(b.name).width;
    const ly = pC.y + TW * 0.06;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const r = 5, x0 = cx - tw2 / 2 - 6, y0 = ly - TW * 0.11, w0 = tw2 + 12, h0 = TW * 0.24;
    ctx.beginPath(); ctx.roundRect(x0, y0, w0, h0, r); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(b.name, cx, ly + h0 / 2 - TW * 0.11);
  }

  /* ---------- 乐高小人 ---------- */
  function drawWalker(w) {
    const S = Game.state;
    const r = S.residents.find(x => x.id === w.rid);
    if (!r) return;
    const p = iso(w.x, w.y);
    if (p.x < -40 || p.x > canvas.width + 40 || p.y < -40 || p.y > canvas.height + 40) return;
    const moving = w.pauseT <= 0 && (Math.abs(w.tx + 0.5 - w.x) > 0.05 || Math.abs(w.ty + 0.5 - w.y) > 0.05);
    const bob = moving ? Math.abs(Math.sin(w.phase)) * TW * 0.03 : 0;
    const H = TW * 0.62;          // 小人总高
    const gy = p.y - bob;         // 脚底
    const legSwing = moving ? Math.sin(w.phase) * H * 0.10 : 0;
    const uw = H * 0.34;          // 身体半宽

    // —— 优先使用角色贴图 ——
    const spriteId = Assets.charSprite(r);
    const sprite = spriteId ? Assets.img(spriteId) : null;
    if (sprite) {
      const sh = TW * 0.92;                                   // 角色贴图高度
      const sw = sh * (sprite.naturalWidth / sprite.naturalHeight);
      const sway = moving ? Math.sin(w.phase) * 0.06 : 0;     // 走路左右小摆
      ctx.save();
      // 影子
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, sh * 0.2, sh * 0.07, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();
      ctx.translate(p.x, gy);
      ctx.rotate(sway);
      if (w.dir > 0) ctx.scale(-1, 1);                        // 原图朝左下，向右走镜像
      ctx.drawImage(sprite, -sw / 2, -sh, sw, sh);
      ctx.restore();
      // 头顶帽子（装扮）
      const headY2 = gy - sh * 0.9;
      if (r.hat) {
        drawHat(r.hat, p.x, headY2 - H * 0.12, H * 0.34);
      }
      queueOverlay(() => drawWalkerOverlays(w, r, p, gy, headY2 + H * 0.05, H));
      return;
    }

    ctx.save();
    // 影子
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, H * 0.28, H * 0.1, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();

    // 腿(两条，走路摆动)
    const legH = H * 0.3, legW = H * 0.15;
    ctx.fillStyle = r.pants;
    ctx.fillRect(p.x - legW - 1, gy - legH + legSwing * 0.5, legW, legH - legSwing * 0.5);
    ctx.fillRect(p.x + 1, gy - legH - legSwing * 0.5, legW, legH + legSwing * 0.5);
    // 胯
    ctx.fillRect(p.x - legW - 1, gy - legH - H * 0.06, legW * 2 + 2, H * 0.08);

    // 身体(梯形，乐高经典)
    const bodyTop = gy - legH - H * 0.06 - H * 0.3;
    ctx.beginPath();
    ctx.moveTo(p.x - uw * 0.72, bodyTop);
    ctx.lineTo(p.x + uw * 0.72, bodyTop);
    ctx.lineTo(p.x + uw, gy - legH - H * 0.05);
    ctx.lineTo(p.x - uw, gy - legH - H * 0.05);
    ctx.closePath();
    ctx.fillStyle = r.shirt; ctx.fill();
    ctx.strokeStyle = shade(r.shirt, -36); ctx.lineWidth = 1; ctx.stroke();
    // 手臂
    const armSwing = moving ? Math.sin(w.phase + Math.PI) * H * 0.06 : 0;
    ctx.strokeStyle = r.shirt; ctx.lineWidth = H * 0.11; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x - uw * 0.8, bodyTop + H * 0.06); ctx.lineTo(p.x - uw * 1.05, bodyTop + H * 0.24 + armSwing); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x + uw * 0.8, bodyTop + H * 0.06); ctx.lineTo(p.x + uw * 1.05, bodyTop + H * 0.24 - armSwing); ctx.stroke();
    // 手
    ctx.fillStyle = r.skin;
    ctx.beginPath(); ctx.arc(p.x - uw * 1.05, bodyTop + H * 0.26 + armSwing, H * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + uw * 1.05, bodyTop + H * 0.26 - armSwing, H * 0.06, 0, Math.PI * 2); ctx.fill();

    // 头(乐高圆柱头)
    const headR = H * 0.17;
    const headY = bodyTop - headR - H * 0.03;
    ctx.beginPath(); ctx.arc(p.x, headY, headR, 0, Math.PI * 2);
    ctx.fillStyle = r.skin; ctx.fill();
    ctx.strokeStyle = shade(r.skin, -46); ctx.lineWidth = 0.8; ctx.stroke();
    // 脸
    if (TW >= 36) {
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(p.x - headR * 0.36, headY - headR * 0.1, headR * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x + headR * 0.36, headY - headR * 0.1, headR * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(p.x, headY + headR * 0.15, headR * 0.42, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    // 帽子
    if (r.hat) {
      drawHat(r.hat, p.x, headY - headR * 1.1, H * 0.32);
    } else {
      // 头顶凸点
      ctx.beginPath(); ctx.ellipse(p.x, headY - headR, headR * 0.42, headR * 0.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = shade(r.skin, -18); ctx.fill();
    }

    ctx.restore();
    queueOverlay(() => drawWalkerOverlays(w, r, p, gy, headY - headR, H));
  }

  /* 帽子：有 hat_xxx 贴图用贴图，否则画 emoji */
  function drawHat(hatId, cx, cy, size) {
    const him = Assets.opt(hatId);
    if (him) {
      const w = size * 1.5, h = w * (him.naturalHeight / him.naturalWidth);
      ctx.drawImage(him, cx - w / 2, cy - h * 0.62, w, h);
      return;
    }
    const hatE = CATALOG.findOutfit(hatId);
    if (!hatE) return;
    ctx.font = `${size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(hatE.emoji, cx, cy);
  }

  /* 小人的名字/❓/气泡统一放到最上层绘制，避免被后画的建筑贴图挡住 */
  const overlayQueue = [];
  function queueOverlay(fn) { overlayQueue.push(fn); }
  function flushOverlays() { for (const fn of overlayQueue) fn(); overlayQueue.length = 0; }

  /* 小人公共覆盖层：名字 + ❓ + 生活气泡 */
  function drawWalkerOverlays(w, r, p, gy, headTop, H) {
    const S = Game.state;
    // 名字
    if (TW >= 44) {
      ctx.font = `800 ${TW * 0.14}px "PingFang SC",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
      ctx.strokeText(r.name, p.x, gy + TW * 0.14);
      ctx.fillStyle = '#2a4a1a';
      ctx.fillText(r.name, p.x, gy + TW * 0.14);
    }

    // 待答问题(❓弹跳) 或 生活气泡
    const dq = S.dailyQuestions.find(q => q.residentId === r.id && !q.done);
    if (dq) {
      const qb = Math.sin(time * 4) * 4;
      const qy = headTop - H * 0.4 + qb;
      ctx.beginPath(); ctx.arc(p.x, qy, H * 0.19, 0, Math.PI * 2);
      ctx.fillStyle = '#fe8a18'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = `800 ${H * 0.24}px sans-serif`; ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', p.x, qy + 1);
      w._qHit = { x: p.x, y: (qy + headTop) / 2, r: H * 0.6 };
    } else {
      w._qHit = null;
      if (w.bubble) {
        const by = headTop - H * 0.45;
        ctx.beginPath(); ctx.arc(p.x + H * 0.22, by, H * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = `${H * 0.24}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(w.bubble, p.x + H * 0.22, by + 1);
      }
    }
  }

  /* ---------- 行驶车辆 ---------- */
  function drawCar(c) {
    if (!c.onRoad) return;
    const v = CATALOG.findVehicle(c.vid);
    if (!v) return;
    const p = iso(c.x, c.y);
    if (p.x < -40 || p.x > canvas.width + 40) return;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, TW * 0.2, TW * 0.07, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill();
    const vim = Assets.opt('veh_' + c.vid);
    if (vim) {
      const w = TW * 0.85, h = w * (vim.naturalHeight / vim.naturalWidth);
      ctx.save();
      ctx.translate(p.x, p.y);
      if (c.tx - c.x + (c.y - c.ty) >= 0) ctx.scale(-1, 1);   // 朝右上行驶时镜像
      ctx.drawImage(vim, -w / 2, -h + TW * 0.06, w, h);
      ctx.restore();
      return;
    }
    ctx.font = `${TW * 0.42}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v.icon, p.x, p.y - TW * 0.14);
  }

  /* ---------- 行驶的火车（沿铁轨，画法同汽车但更大） ---------- */
  function drawTrain(t) {
    if (!t.onRail) return;
    const v = CATALOG.findVehicle(t.vid);
    if (!v) return;
    const p = iso(t.x, t.y);
    if (p.x < -60 || p.x > canvas.width + 60) return;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, TW * 0.3, TW * 0.09, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill();
    const vim = Assets.opt('veh_' + t.vid);
    if (vim) {
      const w = TW * 1.3, h = w * (vim.naturalHeight / vim.naturalWidth);
      ctx.save();
      ctx.translate(p.x, p.y);
      if (t.tx - t.x + (t.y - t.ty) >= 0) ctx.scale(-1, 1);
      ctx.drawImage(vim, -w / 2, -h + TW * 0.06, w, h);
      ctx.restore();
      return;
    }
    ctx.font = `${TW * 0.5}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v.icon, p.x, p.y - TW * 0.18);
  }

  /* ---------- 巡游的轮船（在河面，带上下起伏 + 尾波） ---------- */
  function drawShip(s) {
    if (!s.onWater) return;
    const v = CATALOG.findVehicle(s.vid);
    if (!v) return;
    const p = iso(s.x, s.y);
    if (p.x < -60 || p.x > canvas.width + 60) return;
    const bob = Math.sin(time * 1.5 + s.x * 3 + s.y * 2) * 2;
    // 尾波（白色椭圆代替阴影）
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, TW * 0.28, TW * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
    const vim = Assets.opt('veh_' + s.vid);
    if (vim) {
      const w = TW * 1.1, h = w * (vim.naturalHeight / vim.naturalWidth);
      ctx.save();
      ctx.translate(p.x, p.y + bob);
      if (s.tx - s.x + (s.y - s.ty) >= 0) ctx.scale(-1, 1);
      ctx.drawImage(vim, -w / 2, -h + TW * 0.04, w, h);
      ctx.restore();
      return;
    }
    ctx.font = `${TW * 0.5}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v.icon, p.x, p.y + bob - TW * 0.18);
  }

  /* ---------- 停靠的大型载具(火车/飞机/轮船/火箭) ---------- */
  function drawDocked() {
    const S = Game.state;
    const docks = { train_station: 'train', harbor: 'ship', airport: 'plane', rocket_pad: 'rocket' };
    for (const b of S.buildings) {
      const t = docks[b.id];
      if (!t) continue;
      const owned = S.vehicles.map(CATALOG.findVehicle).filter(v => v && v.type === t);
      if (!owned.length) continue;
      const info = Game.bInfo(b.id);
      const z = (info.fl || 1) * TW * FLOOR_H;
      owned.slice(0, 2).forEach((v, i) => {
        const p = iso(b.x + 0.5 + i * 1.4, b.y + b.h - 0.4);
        const bob = t === 'ship' ? Math.sin(time * 1.5 + i) * 2 : 0;
        const vim = Assets.opt('veh_' + v.id);
        if (vim) {
          const w = TW * 1.5, h = w * (vim.naturalHeight / vim.naturalWidth);
          ctx.drawImage(vim, p.x - w / 2, p.y - z - h + bob, w, h);
          return;
        }
        ctx.font = `${TW * 0.55}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(v.icon, p.x, p.y - z - TW * 0.28 + bob);
      });
    }
  }

  /* ---------- 建造预览 ---------- */
  function drawGhost() {
    const p = placing;
    if (p.gx == null) return;
    const info = p.bid ? CATALOG.findBuilding(p.bid) : Game.bInfo(p.moveInfoId);
    const pA = iso(p.gx, p.gy), pB = iso(p.gx + p.w, p.gy), pC = iso(p.gx + p.w, p.gy + p.h), pD = iso(p.gx, p.gy + p.h);
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); ctx.lineTo(pC.x, pC.y); ctx.lineTo(pD.x, pD.y); ctx.closePath();
    ctx.fillStyle = p.valid ? '#3ab54a' : '#e4574e'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    const cx = (pA.x + pC.x) / 2, cy = (pA.y + pC.y) / 2;
    // 幽灵预览：有贴图画半透明贴图，否则画emoji
    const gid = p.bid || p.moveInfoId;
    const gim = gid && Assets.has(gid) ? Assets.img(gid) : null;
    if (gim) {
      ctx.globalAlpha = 0.75;
      const footW = pB.x - pD.x;
      const gspr = (info && info.spr) || 1;
      const w = footW * 1.1 * gspr;
      const h = w * (gim.naturalHeight / gim.naturalWidth);
      ctx.drawImage(gim, (pD.x + pB.x) / 2 - w / 2, pC.y + TH() * 0.22 - h, w, h);
      ctx.globalAlpha = 1;
    } else {
      ctx.font = `${TW * 0.6}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(info ? info.icon : '❓', cx, cy - TW * 0.2);
    }
  }

  /* ---------- 等距深度排序 ----------
   * a 在 b 之后画（a 在前景）当且仅当 a 的占地矩形整体位于 b 的南面或东面。
   * 用插入排序（n 很小），对"互不比较"的非传递情况也能稳定收敛。 */
  const EPS = 1e-6;
  function isoCmp(a, b) {
    if (a.x1 <= b.x0 + EPS || a.y1 <= b.y0 + EPS) return -1; // a 在 b 的西/北 → 先画
    if (b.x1 <= a.x0 + EPS || b.y1 <= a.y0 + EPS) return 1;  // b 在 a 的西/北 → 后画
    return (a.x0 + a.y0) - (b.x0 + b.y0) || a.tie - b.tie;   // 占地重叠(小人站在路上等)
  }
  function sortIso(arr) {
    for (let i = 1; i < arr.length; i++) {
      const cur = arr[i];
      let j = i - 1;
      while (j >= 0 && isoCmp(arr[j], cur) > 0) { arr[j + 1] = arr[j]; j--; }
      arr[j + 1] = cur;
    }
  }

  /* ---------- 主绘制循环 ---------- */
  let lastT = 0;
  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    time += dt;
    const S = Game.state;
    if (!S) { requestAnimationFrame(loop); return; }

    syncWalkers(); syncCars(); syncTrains(); syncShips();
    updateWalkers(dt); updateCars(dt); updateTrains(dt); updateShips(dt); updateFlyer(dt);
    for (const cl of clouds) cl.x += cl.v * dt;

    drawGround();

    // 深度排序（等距画家算法）：用"占地矩形"判断前后，而不是简单的 gx+gy，
    // 否则站在大建筑正前方的小人会被建筑贴图盖住（看起来走进了建筑里）
    const items = [];
    for (const b of S.buildings) items.push({
      x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h, tie: 0,
      f: () => drawBuildingIso(b, b.uid === selectedUid)
    });
    for (const w of walkers) items.push({
      x0: w.x - 0.02, y0: w.y - 0.02, x1: w.x + 0.02, y1: w.y + 0.02, tie: 1,
      f: () => drawWalker(w)
    });
    for (const c of cars) if (c.onRoad) items.push({
      x0: c.x - 0.02, y0: c.y - 0.02, x1: c.x + 0.02, y1: c.y + 0.02, tie: 2,
      f: () => drawCar(c)
    });
    for (const t of trains) if (t.onRail) items.push({
      x0: t.x - 0.02, y0: t.y - 0.02, x1: t.x + 0.02, y1: t.y + 0.02, tie: 2,
      f: () => drawTrain(t)
    });
    for (const s of ships) if (s.onWater) items.push({
      x0: s.x - 0.02, y0: s.y - 0.02, x1: s.x + 0.02, y1: s.y + 0.02, tie: 2,
      f: () => drawShip(s)
    });
    sortIso(items);
    for (const it of items) it.f();

    drawDocked();
    flushOverlays();

    // 选中框
    if (selectedUid) {
      const b = S.buildings.find(x => x.uid === selectedUid);
      if (b) {
        const pA = iso(b.x, b.y), pB = iso(b.x + b.w, b.y), pC = iso(b.x + b.w, b.y + b.h), pD = iso(b.x, b.y + b.h);
        ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.setLineDash([8, 5]);
        ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); ctx.lineTo(pC.x, pC.y); ctx.lineTo(pD.x, pD.y); ctx.closePath(); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (placing) drawGhost();

    // 飞机飞过（有贴图用贴图并朝右飞，否则 emoji）
    if (flyer) {
      const fim = Assets.opt('veh_' + flyer.vid);
      if (fim) {
        const fw = TW * 1.6, fh = fw * (fim.naturalHeight / fim.naturalWidth);
        ctx.save();
        ctx.translate(flyer.x, flyer.y);
        ctx.rotate(-0.05);           // 微微抬头爬升
        ctx.scale(-1, 1);            // 贴图默认朝左，镜像成朝右飞
        ctx.drawImage(fim, -fw / 2, -fh / 2, fw, fh);
        ctx.restore();
      } else {
        ctx.font = '34px serif'; ctx.textAlign = 'center';
        ctx.fillText(flyer.icon, flyer.x, flyer.y);
      }
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ============================================================
   * 交互
   * ============================================================ */
  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  function onDown(e) {
    const p = pointerPos(e);
    dragging = true; dragMoved = false;
    lastMX = p.x; lastMY = p.y;
    if (!placing) canvas.classList.add('grabbing');
  }

  function onMove(e) {
    const p = pointerPos(e);
    if (placing) {
      const g = unIso(p.x, p.y);
      placing.gx = Math.max(0, Math.min(Game.state.mapW - placing.w, Math.floor(g.gx - placing.w / 2 + 0.5)));
      placing.gy = Math.max(0, Math.min(Game.state.mapH - placing.h, Math.floor(g.gy - placing.h / 2 + 0.5)));
      placing.valid = Game.isAreaFree(placing.gx, placing.gy, placing.w, placing.h, placing.moveUid, placing.bid || placing.moveInfoId);
      if (e.touches) e.preventDefault();
      return;
    }
    if (dragging) {
      const dx = p.x - lastMX, dy = p.y - lastMY;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
      camX += dx; camY += dy;
      lastMX = p.x; lastMY = p.y;
      if (e.touches) e.preventDefault();
    }
  }

  function onUp(e) {
    if (!Game.state) return; // 登录门期间游戏尚未初始化
    canvas.classList.remove('grabbing');
    const wasDrag = dragMoved;
    dragging = false; dragMoved = false;

    if (placing) {
      if (placing.gx != null && placing.valid) {
        if (placing.moveUid) {
          const r = Game.moveBuilding(placing.moveUid, placing.gx, placing.gy);
          if (r.ok) { UI.toast('✅ 搬好啦！', 'good'); endPlacing(); UI.refreshTop(); }
        } else {
          const r = Game.buyAndPlace(placing.bid, placing.gx, placing.gy, placing.rotated);
          if (r.ok) {
            UI.toast(`🏗️ 「${CATALOG.findBuilding(placing.bid).name}」建好啦！`, 'good');
            UI.confetti(18); endPlacing(); UI.refreshTop(); UI.promptRename(r.building);
          } else if (r.msg) UI.toast(r.msg, 'bad');
        }
      } else if (placing.gx != null) UI.toast('这里放不下，绿色才可以放哦', 'bad');
      return;
    }

    if (!wasDrag && e) {
      const pos = pointerPos(e);
      // 1) 点居民的❓答题
      for (const w of walkers) {
        if (w._qHit && Math.hypot(pos.x - w._qHit.x, pos.y - w._qHit.y) < w._qHit.r) {
          const dq = Game.state.dailyQuestions.find(q => q.residentId === w.rid && !q.done);
          if (dq) { Quiz.start(dq); return; }
        }
      }
      // 2) 点建筑
      const g = unIso(pos.x, pos.y);
      const gx = Math.floor(g.gx), gy = Math.floor(g.gy);
      const hit = [...Game.state.buildings].reverse().find(b => gx >= b.x && gx < b.x + b.w && gy >= b.y && gy < b.y + b.h);
      if (hit) { selectedUid = hit.uid; UI.showBuildingMenu(hit); }
      else selectedUid = null;
    }
  }

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: true });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', (e) => onUp(e), { passive: true });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 1.12 : 0.9, pointerPos(e));
  }, { passive: false });

  function zoom(factor, center) {
    const old = TW;
    TW = Math.max(22, Math.min(120, TW * factor));
    const scale = TW / old;
    const cx = center ? center.x : canvas.width / 2;
    const cy = center ? center.y : canvas.height / 2;
    camX = cx - (cx - camX) * scale;
    camY = cy - (cy - camY) * scale;
  }

  document.getElementById('zoom-in').onclick = () => zoom(1.2);
  document.getElementById('zoom-out').onclick = () => zoom(0.84);
  document.getElementById('zoom-fit').onclick = () => { resize(); fitView(); };

  /* ---------- 建造模式 API ---------- */
  function startPlacing(bid) {
    const info = CATALOG.findBuilding(bid);
    placing = { bid, w: info.w, h: info.h, rotated: false, gx: null, gy: null, valid: false };
    canvas.classList.add('placing');
    document.getElementById('place-toolbar').style.display = 'flex';
    document.getElementById('place-info').textContent = `${info.icon} 建造「${info.name}」— 移动后点击放置`;
    UI.hint(`把「${info.name}」放到地图上：绿色可以放，红色不能放`);
  }

  function startMoving(b) {
    placing = { moveUid: b.uid, moveInfoId: b.id, w: b.w, h: b.h, gx: b.x, gy: b.y, valid: true };
    canvas.classList.add('placing');
    document.getElementById('place-toolbar').style.display = 'flex';
    document.getElementById('place-info').textContent = `📦 移动「${b.name}」— 点击新位置`;
    UI.hint(`点击地图，把「${b.name}」搬到新位置`);
  }

  function endPlacing() {
    placing = null;
    canvas.classList.remove('placing');
    document.getElementById('place-toolbar').style.display = 'none';
    UI.hint(null);
  }

  document.getElementById('btn-place-cancel').onclick = endPlacing;
  document.getElementById('btn-place-rotate').onclick = () => {
    if (placing && !placing.moveUid) {
      placing.rotated = !placing.rotated;
      [placing.w, placing.h] = [placing.h, placing.w];
      if (placing.gx != null) placing.valid = Game.isAreaFree(placing.gx, placing.gy, placing.w, placing.h, null, placing.bid);
    }
  };

  window.CityMap = {
    resize, fitView,
    draw() { /* rAF循环自动重绘 */ },
    startPlacing, startMoving, endPlacing,
    deselect() { selectedUid = null; }
  };

  resize();
})();
