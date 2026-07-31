/* ============================================================
 * 美术资产加载器：建筑 + 人物贴图 (webp, 已抠图)
 * Assets.img(id) -> HTMLImageElement | null (未加载完成返回null)
 * Assets.has(id) -> 是否存在该贴图
 * Assets.charSprite(resident) -> 初始8位家人有专属贴图
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
    if (!KNOWN.has(id)) return null;
    let im = cache[id];
    if (!im) {
      im = new Image();
      im.src = '/static/assets/' + id + '.webp';
      cache[id] = im;
    }
    return (im.complete && im.naturalWidth > 0) ? im : null;
  }

  function has(id) { return KNOWN.has(id); }

  /* 居民贴图：初始8位家人 id 就是 dad/mom/... */
  function charSprite(r) {
    const key = 'char_' + r.id;
    return KNOWN.has(key) ? key : null;
  }

  /* 预加载全部（后台静默） */
  function preloadAll() { for (const id of KNOWN) img(id); }

  window.Assets = { img, has, charSprite, preloadAll, BUILDING_SPRITES, CHAR_SPRITES };
})();
