/* ============================================================
 * Rich's City 游戏目录：建筑 / 车辆 / 装扮 / 职业 / 礼物
 * ============================================================ */
window.CATALOG = {};

/* ---------- 城市等级 ---------- */
CATALOG.CITY_RANKS = [
  { name: '小村庄', minPop: 0, icon: '🏕️' },
  { name: '小镇', minPop: 12, icon: '🏘️' },
  { name: '大镇', minPop: 20, icon: '🏙️' },
  { name: '城市', minPop: 30, icon: '🌆' },
  { name: '大城市', minPop: 45, icon: '🌃' },
  { name: '超级城市', minPop: 65, icon: '🌌' }
];

/* ---------- 职业成长线（居民等级解锁） ----------
 * 每级需要答对题数递增；salary=每周为城市创造的收入 */
CATALOG.CAREERS = [
  { lv: 1, title: '见习居民', salary: 10, icon: '🙂' },
  { lv: 2, title: '快递员', salary: 18, icon: '📦' },
  { lv: 3, title: '面包师', salary: 28, icon: '🥐' },
  { lv: 4, title: '公交司机', salary: 40, icon: '🚌' },
  { lv: 5, title: '消防员', salary: 55, icon: '🚒' },
  { lv: 6, title: '警察', salary: 72, icon: '👮' },
  { lv: 7, title: '医生', salary: 95, icon: '🩺' },
  { lv: 8, title: '工程师', salary: 120, icon: '🛠️' },
  { lv: 9, title: '飞行员', salary: 150, icon: '✈️' },
  { lv: 10, title: '科学家', salary: 190, icon: '🔬' },
  { lv: 11, title: '企业家', salary: 240, icon: '💼' },
  { lv: 12, title: '宇航员', salary: 300, icon: '🚀' }
];
CATALOG.xpNeeded = (lv) => 4 + (lv - 1) * 2; // 每级需答对题数

/* ---------- 初始8位居民 ---------- */
CATALOG.INITIAL_RESIDENTS = [
  { id: 'dad', name: '爸爸', emoji: '👨', skin: '#f5c518', shirt: '#0d69ab', pants: '#333c8f', hat: null },
  { id: 'mom', name: '妈妈', emoji: '👩', skin: '#f5c518', shirt: '#d0408a', pants: '#4a2a7a', hat: null },
  { id: 'grandma', name: '奶奶', emoji: '👵', skin: '#f5c518', shirt: '#8a5fb0', pants: '#555', hat: null },
  { id: 'grandpa', name: '爷爷', emoji: '👴', skin: '#f5c518', shirt: '#5c7a4a', pants: '#444', hat: null },
  { id: 'laolao', name: '姥姥', emoji: '👵', skin: '#f5c518', shirt: '#c25a3a', pants: '#6b4a3a', hat: null },
  { id: 'laoye', name: '姥爷', emoji: '👴', skin: '#f5c518', shirt: '#3a6a8a', pants: '#333', hat: null },
  { id: 'auntie', name: '小姨', emoji: '👧', skin: '#f5c518', shirt: '#e46a9a', pants: '#2a6a5a', hat: null },
  { id: 'brother', name: '哥哥', emoji: '👦', skin: '#f5c518', shirt: '#3ab54a', pants: '#1a4a8a', hat: null }
];

/* 新居民候选名单（花城市收入招募） */
CATALOG.NEW_RESIDENT_POOL = [
  { name: '面包店王叔叔', emoji: '👨‍🍳' }, { name: '医生李阿姨', emoji: '👩‍⚕️' },
  { name: '警察张叔叔', emoji: '👮' }, { name: '老师刘阿姨', emoji: '👩‍🏫' },
  { name: '司机赵师傅', emoji: '🧔' }, { name: '画家小周', emoji: '🧑‍🎨' },
  { name: '工程师陈叔叔', emoji: '👷' }, { name: '飞行员高叔叔', emoji: '🧑‍✈️' },
  { name: '厨师孙师傅', emoji: '🧑‍🍳' }, { name: '科学家吴博士', emoji: '🧑‍🔬' },
  { name: '邮递员小马', emoji: '🧑‍💼' }, { name: '园丁老杨', emoji: '🧓' },
  { name: '消防员郑叔叔', emoji: '🧑‍🚒' }, { name: '兽医小林', emoji: '🧑‍⚕️' },
  { name: '音乐家安妮', emoji: '👩‍🎤' }, { name: '运动员大力', emoji: '🏃' }
];
CATALOG.residentCost = (pop) => 80 + Math.max(0, pop - 8) * 40; // 招募价格随人口上涨

/* ---------- 装扮商店 ---------- */
CATALOG.SKIN_COLORS = ['#f5c518', '#f0d5b0', '#c8935a', '#8a5a3a'];
CATALOG.FREE_COLORS = ['#d01012', '#0d69ab', '#3ab54a', '#f5c518', '#fe8a18', '#8a5fb0', '#e46a9a', '#555555'];
CATALOG.OUTFITS = [
  { id: 'shirt_white', type: 'color', slot: 'shirt', name: '白衬衫', color: '#f2f2f2', cost: 20 },
  { id: 'shirt_black', type: 'color', slot: 'shirt', name: '酷黑上衣', color: '#222', cost: 20 },
  { id: 'shirt_cyan', type: 'color', slot: 'shirt', name: '天青上衣', color: '#2ab5b5', cost: 25 },
  { id: 'shirt_gold', type: 'color', slot: 'shirt', name: '土豪金上衣', color: '#e0b110', cost: 60 },
  { id: 'hat_cap', type: 'hat', name: '棒球帽', emoji: '🧢', cost: 30 },
  { id: 'hat_top', type: 'hat', name: '绅士礼帽', emoji: '🎩', cost: 50 },
  { id: 'hat_cowboy', type: 'hat', name: '牛仔帽', emoji: '🤠', cost: 45 },
  { id: 'hat_crown', type: 'hat', name: '国王皇冠', emoji: '👑', cost: 150 },
  { id: 'hat_grad', type: 'hat', name: '博士帽', emoji: '🎓', cost: 80 },
  { id: 'hat_helmet', type: 'hat', name: '工程安全帽', emoji: '⛑️', cost: 35 },
  { id: 'hat_party', type: 'hat', name: '派对帽', emoji: '🥳', cost: 40 },
  { id: 'hat_santa', type: 'hat', name: '圣诞帽', emoji: '🎅', cost: 55 }
];

/* ---------- 建筑目录 ----------
 * cat: business商业 / public公共 / support配套 / house住宅
 * income: 商业周营业额(税前) | happy: 幸福度加成 | popCap: 提供人口容量
 * w,h: 占地格数; unlockPop: 人口达标解锁 */
CATALOG.BUILDINGS = [
  // —— 住宅（提供人口容量）——
  { id: 'house_wood', cat: 'house', name: '木屋', icon: '🛖', cost: 60, popCap: 2, w: 2, h: 2, color: '#a8763a', desc: '温馨小木屋，可住2人', unlockPop: 0 },
  { id: 'house_brick', cat: 'house', name: '砖房', icon: '🏠', cost: 150, popCap: 4, w: 2, h: 2, color: '#c25a3a', desc: '结实砖房，可住4人', unlockPop: 10 },
  { id: 'house_villa', cat: 'house', name: '小别墅', icon: '🏡', cost: 400, popCap: 6, w: 3, h: 2, color: '#5c8a4a', desc: '带花园的漂亮别墅，可住6人', unlockPop: 16 },
  { id: 'apartment', cat: 'house', name: '公寓楼', icon: '🏢', cost: 900, popCap: 12, w: 2, h: 3, color: '#4a7a9a', desc: '高层公寓，可住12人', unlockPop: 24 },
  // —— 商业（产生营业额→税收）——
  { id: 'store', cat: 'business', name: '便利店', icon: '🏪', cost: 100, income: 40, w: 2, h: 2, color: '#3ab54a', desc: '24小时便利店，每周营业额40元', unlockPop: 0 },
  { id: 'bakery', cat: 'business', name: '面包店', icon: '🥐', cost: 180, income: 70, w: 2, h: 2, color: '#e0a04a', desc: '香喷喷的面包店，每周营业额70元', unlockPop: 0 },
  { id: 'restaurant', cat: 'business', name: '餐厅', icon: '🍽️', cost: 320, income: 120, w: 2, h: 2, color: '#d05a4a', desc: '生意红火的餐厅，每周营业额120元', unlockPop: 12 },
  { id: 'cinema', cat: 'business', name: '电影院', icon: '🎬', cost: 600, income: 200, w: 3, h: 2, color: '#5a4a8a', desc: '放最新动画电影，每周营业额200元', unlockPop: 16 },
  { id: 'mall', cat: 'business', name: '购物中心', icon: '🛍️', cost: 1500, income: 450, w: 3, h: 3, color: '#c04a8a', desc: '超大购物中心，每周营业额450元', unlockPop: 24 },
  { id: 'hotel', cat: 'business', name: '大酒店', icon: '🏨', cost: 2600, income: 700, w: 3, h: 3, color: '#8a6a2a', desc: '五星级大酒店，每周营业额700元', unlockPop: 36 },
  { id: 'amusement', cat: 'business', name: '游乐园', icon: '🎡', cost: 5000, income: 1200, w: 4, h: 3, color: '#e46aaa', desc: '超好玩的游乐园，每周营业额1200元', unlockPop: 48 },
  // —— 公共（提升幸福度）——
  { id: 'road', cat: 'public', name: '道路', icon: '🛣️', cost: 5, happy: 0, w: 1, h: 1, color: '#666', desc: '连接城市的道路', unlockPop: 0 },
  { id: 'park', cat: 'public', name: '小公园', icon: '🌳', cost: 80, happy: 5, w: 2, h: 2, color: '#4a9a4a', desc: '绿树成荫，幸福度+5', unlockPop: 0 },
  { id: 'playground', cat: 'public', name: '游乐场', icon: '🛝', cost: 150, happy: 8, w: 2, h: 2, color: '#e08a3a', desc: '孩子们的最爱，幸福度+8', unlockPop: 0 },
  { id: 'school', cat: 'public', name: '学校', icon: '🏫', cost: 350, happy: 12, w: 3, h: 2, color: '#c2803a', desc: '知识的殿堂，幸福度+12', unlockPop: 12 },
  { id: 'hospital', cat: 'public', name: '医院', icon: '🏥', cost: 500, happy: 15, w: 3, h: 2, color: '#e05a5a', desc: '守护健康，幸福度+15', unlockPop: 16 },
  { id: 'library', cat: 'public', name: '图书馆', icon: '📚', cost: 420, happy: 10, w: 2, h: 2, color: '#7a5aa0', desc: '书的海洋，幸福度+10', unlockPop: 16 },
  { id: 'fire_station', cat: 'public', name: '消防局', icon: '🚒', cost: 450, happy: 10, w: 2, h: 2, color: '#d02a2a', desc: '城市安全卫士，幸福度+10', unlockPop: 20 },
  { id: 'police', cat: 'public', name: '警察局', icon: '🚓', cost: 450, happy: 10, w: 2, h: 2, color: '#2a4a9a', desc: '维护治安，幸福度+10', unlockPop: 20 },
  { id: 'stadium', cat: 'public', name: '体育场', icon: '🏟️', cost: 1800, happy: 25, w: 4, h: 3, color: '#3a8a6a', desc: '举办比赛，幸福度+25', unlockPop: 30 },
  { id: 'museum', cat: 'public', name: '博物馆', icon: '🏛️', cost: 1500, happy: 20, w: 3, h: 2, color: '#9a8a5a', desc: '收藏历史珍宝，幸福度+20', unlockPop: 30 },
  // —— 配套 ——
  { id: 'parking', cat: 'support', name: '停车场', icon: '🅿️', cost: 60, happy: 2, w: 2, h: 1, color: '#5a6a7a', desc: '停放城市车辆，幸福度+2', unlockPop: 0 },
  { id: 'bus_stop', cat: 'support', name: '公交站', icon: '🚏', cost: 90, happy: 4, w: 1, h: 1, color: '#3a7ab0', desc: '方便出行，幸福度+4', unlockPop: 10 },
  { id: 'gas', cat: 'support', name: '加油站', icon: '⛽', cost: 200, happy: 3, income: 50, w: 2, h: 2, color: '#c05a2a', desc: '给汽车加油，营业额50元/周', unlockPop: 12 },
  { id: 'train_station', cat: 'support', name: '火车站', icon: '🚉', cost: 1200, happy: 15, w: 4, h: 2, color: '#6a5a4a', desc: '火车开进城！幸福度+15，解锁火车', unlockPop: 24 },
  { id: 'airport', cat: 'support', name: '飞机场', icon: '🛫', cost: 4000, happy: 30, w: 5, h: 3, color: '#4a6a8a', desc: '飞向蓝天！幸福度+30，解锁飞机', unlockPop: 40 },
  { id: 'harbor', cat: 'support', name: '港口', icon: '⚓', cost: 3000, happy: 20, w: 4, h: 2, color: '#2a5a7a', desc: '轮船码头，幸福度+20，解锁轮船', unlockPop: 36 }
];

/* ---------- 车辆/载具收藏（参考真实车型/机型） ---------- */
CATALOG.VEHICLES = [
  // 汽车
  { id: 'wuling', type: 'car', name: '五菱宏光MINI EV', icon: '🚗', cost: 80, color: '#7ec8e0', desc: '国民小电车，小巧灵活', need: null },
  { id: 'corolla', type: 'car', name: '丰田卡罗拉', icon: '🚙', cost: 150, color: '#c0c0c0', desc: '全球最畅销的家用轿车之一', need: null },
  { id: 'model3', type: 'car', name: '特斯拉 Model 3', icon: '🚘', cost: 280, color: '#d02a2a', desc: '会自动驾驶的电动车', need: null },
  { id: 'byd_han', type: 'car', name: '比亚迪·汉', icon: '🚔', cost: 260, color: '#2a3a6a', desc: '中国造的豪华电动轿车', need: null },
  { id: 'landcruiser', type: 'car', name: '丰田兰德酷路泽', icon: '🚙', cost: 420, color: '#6a7a4a', desc: '越野之王，翻山越岭', need: null },
  { id: 'gt3rs', type: 'car', name: '保时捷911 GT3 RS', icon: '🏎️', cost: 900, color: '#e0641e', desc: '赛道传奇跑车，极速312km/h', need: null },
  { id: 'lafa', type: 'car', name: '法拉利 LaFerrari', icon: '🏎️', cost: 1500, color: '#d01012', desc: '意大利梦想超跑', need: null },
  // 工程/服务车
  { id: 'firetruck', type: 'service', name: '消防云梯车', icon: '🚒', cost: 300, color: '#d02a2a', desc: '配合消防局使用更配哦', need: null },
  { id: 'schoolbus', type: 'service', name: '美式校车', icon: '🚌', cost: 220, color: '#f5c518', desc: '接送小朋友上学', need: null },
  { id: 'excavator', type: 'service', name: '卡特彼勒挖掘机', icon: '🚜', cost: 350, color: '#e0a020', desc: '嗡嗡嗡，挖呀挖呀挖', need: null },
  // 火车（需火车站）
  { id: 'fuxing', type: 'train', name: '复兴号CR400AF', icon: '🚄', cost: 1200, color: '#d04a4a', desc: '中国高铁，时速350公里！', need: 'train_station' },
  { id: 'harmony', type: 'train', name: '和谐号CRH380A', icon: '🚅', cost: 1000, color: '#e8e8e8', desc: '流线型白色子弹头', need: 'train_station' },
  { id: 'steam', type: 'train', name: '蒸汽小火车', icon: '🚂', cost: 600, color: '#3a3a3a', desc: '呜呜——复古蒸汽火车', need: 'train_station' },
  // 飞机（需机场）
  { id: 'c919', type: 'plane', name: '国产大飞机C919', icon: '✈️', cost: 3000, color: '#4a8ac0', desc: '中国自主研制的大客机', need: 'airport' },
  { id: 'a380', type: 'plane', name: '空客A380', icon: '✈️', cost: 4500, color: '#3a6a9a', desc: '世界最大的双层客机', need: 'airport' },
  { id: 'b747', type: 'plane', name: '波音747', icon: '🛩️', cost: 4000, color: '#5a7a9a', desc: '经典“空中女王”', need: 'airport' },
  { id: 'helicopter', type: 'plane', name: '直-20直升机', icon: '🚁', cost: 1800, color: '#4a6a4a', desc: '可以垂直起降的直升机', need: 'airport' },
  // 轮船（需港口）
  { id: 'liaoning', type: 'ship', name: '山东舰航母', icon: '🚢', cost: 8000, color: '#5a6a7a', desc: '中国首艘国产航空母舰', need: 'harbor' },
  { id: 'cruise', type: 'ship', name: '爱达·魔都号邮轮', icon: '🛳️', cost: 5000, color: '#e8e8f0', desc: '国产大型豪华邮轮', need: 'harbor' }
];

/* ---------- 礼物系统（居民连对赠礼） ---------- */
CATALOG.GIFTS = [
  { streak: 10, name: '小汽车玩具兑换卡', icon: '🚗', desc: '连续答对10题获得！可以找爸爸妈妈兑换一辆玩具小汽车' },
  { streak: 20, name: '乐高小套装兑换卡', icon: '🧱', desc: '连续答对20题获得！可以兑换一盒乐高小套装' },
  { streak: 30, name: '冰淇淋兑换卡', icon: '🍦', desc: '连续答对30题获得！可以兑换一个美味冰淇淋' },
  { streak: 50, name: '游乐园门票兑换卡', icon: '🎢', desc: '连续答对50题获得！可以兑换一次游乐园之旅' },
  { streak: 100, name: '超级大奖兑换卡', icon: '🏆', desc: '连续答对100题！超级大奖，和爸爸妈妈商量一个大心愿吧！' }
];

/* ---------- 建筑查找辅助 ---------- */
CATALOG.findBuilding = (id) => CATALOG.BUILDINGS.find(b => b.id === id);
CATALOG.findVehicle = (id) => CATALOG.VEHICLES.find(v => v.id === id);
CATALOG.findOutfit = (id) => CATALOG.OUTFITS.find(o => o.id === id);
