/* ============================================================
 * 城市地图渲染：Canvas 乐高底板风格 + 拖拽/缩放/建造交互
 * ============================================================ */
(function () {
  const canvas = document.getElementById('map-canvas');
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('map-container');

  let TILE = 34;               // 当前格子像素
  let camX = 0, camY = 0;      // 相机偏移(像素)
  let dragging = false, dragMoved = false, lastMX = 0, lastMY = 0;

  // 建造模式
  let placing = null; // { bid, w, h, rotated, gx, gy, valid } 或 { moveUid,... }
  let selectedUid = null;
  let hoverGxGy = null;

  function resize() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    draw();
  }
  window.addEventListener('resize', resize);

  function fitView() {
    const S = Game.state;
    TILE = Math.max(18, Math.min(44, Math.floor(Math.min(canvas.width / S.mapW, canvas.height / S.mapH))));
    camX = (canvas.width - S.mapW * TILE) / 2;
    camY = (canvas.height - S.mapH * TILE) / 2;
    draw();
  }

  /* ---------- 绘制 ---------- */
  function draw() {
    const S = Game.state;
    if (!S) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 草地背景
    ctx.fillStyle = '#3f9e3f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 底板
    const bx = camX, by = camY, bw = S.mapW * TILE, bh = S.mapH * TILE;
    ctx.fillStyle = '#66bb44';
    roundRect(bx - 6, by - 6, bw + 12, bh + 12, 10); ctx.fill();
    ctx.fillStyle = '#7ec850';
    ctx.fillRect(bx, by, bw, bh);

    // 乐高凸点底板（性能：格子大时才画）
    if (TILE >= 20) {
      for (let gy = 0; gy < S.mapH; gy++) {
        for (let gx = 0; gx < S.mapW; gx++) {
          const cx = bx + gx * TILE + TILE / 2, cy = by + gy * TILE + TILE / 2;
          if (cx < -TILE || cy < -TILE || cx > canvas.width + TILE || cy > canvas.height + TILE) continue;
          ctx.beginPath();
          ctx.arc(cx, cy, TILE * 0.16, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.14)';
          ctx.fill();
        }
      }
    }

    // 建筑（按y排序，制造前后层次）
    const list = [...S.buildings].sort((a, b) => (a.y + a.h) - (b.y + b.h));
    for (const b of list) drawBuilding(b);

    // 已解锁车辆停在停车场/道路上（装饰性展示）
    drawVehicles();

    // 建造预览
    if (placing && placing.gx != null) drawGhost();

    // 选中高亮
    if (selectedUid) {
      const b = S.buildings.find(x => x.uid === selectedUid);
      if (b) {
        ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3.5;
        ctx.setLineDash([8, 5]);
        ctx.strokeRect(camX + b.x * TILE - 2, camY + b.y * TILE - 2, b.w * TILE + 4, b.h * TILE + 4);
        ctx.setLineDash([]);
      }
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBuilding(b) {
    const info = Game.bInfo(b.id);
    const x = camX + b.x * TILE, y = camY + b.y * TILE, w = b.w * TILE, h = b.h * TILE;
    if (x + w < 0 || y + h < 0 || x > canvas.width || y > canvas.height) return;
    const color = info ? info.color : '#888';

    if (b.id === 'road') { drawRoad(x, y, w, h); return; }

    // 乐高积木块：阴影 + 主体 + 顶部凸点
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    roundRect(x + 3, y + 5, w - 2, h - 2, 6); ctx.fill();

    ctx.fillStyle = color;
    roundRect(x + 1, y + 1, w - 2, h - 2, 6); ctx.fill();

    // 亮边(左上)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 4, y + h - 5); ctx.lineTo(x + 4, y + 4); ctx.lineTo(x + w - 5, y + 4); ctx.stroke();

    // 顶部凸点
    if (TILE >= 20) {
      for (let sy = 0; sy < b.h; sy++) for (let sx = 0; sx < b.w; sx++) {
        const cx = x + sx * TILE + TILE / 2, cy = y + sy * TILE + TILE / 2;
        ctx.beginPath(); ctx.arc(cx, cy - 1.5, TILE * 0.17, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, TILE * 0.17, 0, Math.PI * 2);
        ctx.fillStyle = shade(color, -18); ctx.fill();
      }
    }

    // 图标
    const iconSize = Math.min(w, h) * 0.52;
    ctx.font = `${iconSize}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(info ? info.icon : '❓', x + w / 2, y + h / 2 - 2);

    // 名字
    if (TILE >= 24) {
      ctx.font = `800 ${Math.max(10, TILE * 0.30)}px "PingFang SC","Microsoft YaHei",sans-serif`;
      const label = b.name;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(x + w / 2 - tw / 2 - 5, y + h - TILE * 0.44, tw + 10, TILE * 0.40, 5); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x + w / 2, y + h - TILE * 0.24);
    }
  }

  function drawRoad(x, y, w, h) {
    ctx.fillStyle = '#5c5c5c';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#f5c518'; ctx.lineWidth = Math.max(1.5, TILE * 0.06);
    ctx.setLineDash([TILE * 0.24, TILE * 0.2]);
    ctx.beginPath();
    ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawVehicles() {
    const S = Game.state;
    if (!S.vehicles.length) return;
    // 找停车场和道路格
    const spots = [];
    for (const b of S.buildings) {
      if (b.id === 'parking' || b.id === 'road') {
        for (let sy = 0; sy < b.h; sy++) for (let sx = 0; sx < b.w; sx++) spots.push({ x: b.x + sx, y: b.y + sy });
      }
    }
    const shown = S.vehicles.slice(0, spots.length);
    ctx.font = `${TILE * 0.62}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    shown.forEach((vid, i) => {
      const v = CATALOG.findVehicle(vid);
      const s = spots[i];
      if (v && s) ctx.fillText(v.icon, camX + s.x * TILE + TILE / 2, camY + s.y * TILE + TILE / 2);
    });
  }

  function drawGhost() {
    const p = placing;
    const info = p.bid ? CATALOG.findBuilding(p.bid) : Game.bInfo(p.moveInfoId);
    const w = p.w * TILE, h = p.h * TILE;
    const x = camX + p.gx * TILE, y = camY + p.gy * TILE;
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = p.valid ? '#3ab54a' : '#e4574e';
    roundRect(x, y, w, h, 6); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = `${Math.min(w, h) * 0.5}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(info ? info.icon : '❓', x + w / 2, y + h / 2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 5]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
  }

  /* ---------- 交互 ---------- */
  function toGrid(px, py) {
    return { gx: Math.floor((px - camX) / TILE), gy: Math.floor((py - camY) / TILE) };
  }

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
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
      const { gx, gy } = toGrid(p.x, p.y);
      placing.gx = Math.max(0, Math.min(Game.state.mapW - placing.w, gx));
      placing.gy = Math.max(0, Math.min(Game.state.mapH - placing.h, gy));
      placing.valid = Game.isAreaFree(placing.gx, placing.gy, placing.w, placing.h, placing.moveUid);
      draw();
      if (e.touches) e.preventDefault();
      return;
    }
    if (dragging) {
      const dx = p.x - lastMX, dy = p.y - lastMY;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
      camX += dx; camY += dy;
      lastMX = p.x; lastMY = p.y;
      draw();
      if (e.touches) e.preventDefault();
    }
  }

  function onUp(e) {
    canvas.classList.remove('grabbing');
    const wasDrag = dragMoved;
    dragging = false; dragMoved = false;

    if (placing) {
      // 点击（非拖动地图，建造模式中的click都算确认）
      if (placing.gx != null && placing.valid) {
        if (placing.moveUid) {
          const r = Game.moveBuilding(placing.moveUid, placing.gx, placing.gy);
          if (r.ok) { UI.toast('✅ 搬好啦！', 'good'); endPlacing(); UI.refreshTop(); }
        } else {
          const r = Game.buyAndPlace(placing.bid, placing.gx, placing.gy, placing.rotated);
          if (r.ok) {
            UI.toast(`🏗️ 「${CATALOG.findBuilding(placing.bid).name}」建好啦！`, 'good');
            UI.confetti(18);
            endPlacing();
            UI.refreshTop();
            UI.promptRename(r.building);
          } else if (r.msg) UI.toast(r.msg, 'bad');
        }
      } else if (placing.gx != null && !placing.valid) {
        UI.toast('这里放不下，绿色才可以放哦', 'bad');
      }
      return;
    }

    if (!wasDrag && e) {
      // 单击选择建筑
      const pos = pointerPos(e.changedTouches ? { touches: e.changedTouches } : e);
      const { gx, gy } = toGrid(pos.x, pos.y);
      const b = [...Game.state.buildings].reverse().find(b => gx >= b.x && gx < b.x + b.w && gy >= b.y && gy < b.y + b.h);
      if (b) { selectedUid = b.uid; draw(); UI.showBuildingMenu(b); }
      else { selectedUid = null; draw(); }
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
    const old = TILE;
    TILE = Math.max(12, Math.min(64, TILE * factor));
    const scale = TILE / old;
    const cx = center ? center.x : canvas.width / 2;
    const cy = center ? center.y : canvas.height / 2;
    camX = cx - (cx - camX) * scale;
    camY = cy - (cy - camY) * scale;
    draw();
  }

  document.getElementById('zoom-in').onclick = () => zoom(1.2);
  document.getElementById('zoom-out').onclick = () => zoom(0.84);
  document.getElementById('zoom-fit').onclick = fitView;

  /* ---------- 建造模式 API ---------- */
  function startPlacing(bid) {
    const info = CATALOG.findBuilding(bid);
    placing = { bid, w: info.w, h: info.h, rotated: false, gx: null, gy: null, valid: false };
    canvas.classList.add('placing');
    document.getElementById('place-toolbar').style.display = 'flex';
    document.getElementById('place-info').textContent = `${info.icon} 建造「${info.name}」— 点击地图放置`;
    UI.hint(`把「${info.name}」放到地图上：绿色可以放，红色不能放`);
  }

  function startMoving(b) {
    placing = { moveUid: b.uid, moveInfoId: b.id, w: b.w, h: b.h, gx: b.x, gy: b.y, valid: true };
    canvas.classList.add('placing');
    document.getElementById('place-toolbar').style.display = 'flex';
    document.getElementById('place-info').textContent = `📦 移动「${b.name}」— 点击新位置`;
    UI.hint(`点击地图，把「${b.name}」搬到新位置`);
    draw();
  }

  function endPlacing() {
    placing = null;
    canvas.classList.remove('placing');
    document.getElementById('place-toolbar').style.display = 'none';
    UI.hint(null);
    draw();
  }

  document.getElementById('btn-place-cancel').onclick = endPlacing;
  document.getElementById('btn-place-rotate').onclick = () => {
    if (placing && !placing.moveUid) {
      placing.rotated = !placing.rotated;
      [placing.w, placing.h] = [placing.h, placing.w];
      if (placing.gx != null) placing.valid = Game.isAreaFree(placing.gx, placing.gy, placing.w, placing.h);
      draw();
    }
  };

  window.CityMap = { resize, fitView, draw, startPlacing, startMoving, endPlacing, deselect() { selectedUid = null; draw(); } };
})();
