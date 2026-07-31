/* ============================================================
 * 美术资产加载器
 *  - 已交付资产：BUILDING_SPRITES / CHAR_SPRITES（webp，已抠图）
 *  - 待交付资产：opt(id) 乐观加载，文件放进 /static/assets/ 就自动生效，
 *    没有文件时静默回退到 emoji / 代码绘制（见 docs/ART_ASSETS.md）
 * Assets.img(id)   -> HTMLImageElement | null（已登记资产）
 * Assets.opt(id)   -> HTMLImageElement | null（可选资产，缺失返回 null）
 * Assets.has(id)   -> 是否为已登记资产
 * Assets.charSprite(resident) -> 角色贴图 id 或 null
 * ============================================================ */
(function () {
  const BUILDING_SPRITES = [
    'airport', 'amusement', 'apartment', 'aquarium', 'arcade', 'bakery', 'bank',
    'bus_stop', 'cinema', 'coffee', 'fire_station', 'flower', 'fountain', 'gas',
    'harbor', 'hospital', 'hotel', 'house_brick', 'house_villa', 'house_wood',
    'kindergarten', 'library', 'mall', 'mansion', 'museum', 'office_wood', 'park',
    'parking', 'pizza', 'playground', 'police', 'post_office', 'restaurant',
    'rocket_pad', 'school', 'skyhome', 'solar', 'stadium', 'store', 'supermarket',
    'toy_store', 'train_station', 'tv_tower', 'wind_turbine', 'zoo'
  ];
  const CHAR_SPRITES = ['dad', 'mom', 'grandma', 'grandpa', 'laolao', 'laoye', 'auntie', 'brother'];

  const KNOWN = new Set();
  BUILDING_SPRITES.forEach(id => KNOWN.add(id));
  CHAR_SPRITES.forEach(id => KNOWN.add('char_' + id));

  const cache = {};   // id -> Image
  function img(id) {
    if (!KNOWN.has(id)) return opt(id);   // 未登记的 id 走可选资产通道
    let im = cache[id];
    if (!im) {
      im = new Image();
      im.src = '/static/assets/' + id + '.webp';
      cache[id] = im;
    }
    return (im.complete && im.naturalWidth > 0) ? im : null;
  }

  function has(id) { return KNOWN.has(id); }

  /* ---------- 可选资产（尚未交付的美术素材） ----------
   * 由 /static/assets/manifest.json 驱动（npm run assets:index 生成）：
   * 只请求清单里真实存在的文件，素材缺失时静默回退，不产生 404。*/
  let MANIFEST = null;          // id -> 'webp' | 'png'
  const optCache = {};          // id -> Image
  fetch('/static/assets/manifest.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : null)
    .then(j => { MANIFEST = (j && j.assets) || {}; })
    .catch(() => { MANIFEST = {}; });

  function opt(id) {
    if (!id) return null;
    if (KNOWN.has(id)) return img(id);
    if (!MANIFEST || !MANIFEST[id]) return null;
    let im = optCache[id];
    if (!im) {
      im = new Image();
      im.src = '/static/assets/' + id + '.' + MANIFEST[id];
      optCache[id] = im;
    }
    return (im.complete && im.naturalWidth > 0) ? im : null;
  }

  /* 某可选素材是否已交付（DOM 侧用它决定是否渲染 <img>） */
  function ready(id) { return !!(MANIFEST && MANIFEST[id]) || KNOWN.has(id); }

  /* 居民贴图：初始8位家人 id 即 dad/mom/…；招募居民用 r.sprite（待交付，缺失自动回退SVG小人） */
  function charSprite(r) {
    const key = 'char_' + r.id;
    if (KNOWN.has(key)) return key;
    if (r.sprite) {
      const k2 = 'char_' + r.sprite;
      return opt(k2) ? k2 : null;
    }
    return null;
  }

  /* 车辆贴图 id（待交付） */
  function vehSprite(vid) { const k = 'veh_' + vid; return opt(k) ? k : null; }
  /* 帽子贴图 id（待交付） */
  function hatSprite(hid) { return hid && opt(hid) ? hid : null; }

  /* 预加载全部已交付资产（后台静默） */
  function preloadAll() { for (const id of KNOWN) img(id); }

  /* 生成图标 DOM：素材已交付则用 <img>，否则直接输出 emoji（不会产生 404） */
  function iconHTML(id, emoji, sizePx, extraStyle) {
    if (!ready(id)) return emoji || '';
    const px = sizePx || 40;
    const ext = KNOWN.has(id) ? 'webp' : MANIFEST[id];
    return `<img src="/static/assets/${id}.${ext}" alt="" style="height:${px}px;width:auto;` +
      `max-width:${Math.round(px * 1.7)}px;object-fit:contain;display:block;${extraStyle || ''}">`;
  }

  window.Assets = { img, opt, has, ready, charSprite, vehSprite, hatSprite, preloadAll, iconHTML, BUILDING_SPRITES, CHAR_SPRITES };
})();
