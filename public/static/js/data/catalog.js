/* ============================================================
 * Rich's City 游戏目录：建筑 / 车辆 / 装扮 / 职业 / 礼物
 * fl = 楼层数(决定等距视图中积木高度)，0.2以下为平铺地块
 * ============================================================ */
window.CATALOG = {};

/* ---------- 城市等级（按每周城市收入，不再看人口） ---------- */
CATALOG.CITY_RANKS = [
  { name: '小村庄', minIncome: 0, icon: '🏕️' },
  { name: '小镇', minIncome: 250, icon: '🏘️' },
  { name: '大镇', minIncome: 600, icon: '🏙️' },
  { name: '城市', minIncome: 1200, icon: '🌆' },
  { name: '大城市', minIncome: 2500, icon: '🌃' },
  { name: '超级城市', minIncome: 5000, icon: '🌌' }
];

/* ---------- 职业成长线 ---------- */
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
CATALOG.xpNeeded = (lv) => 4 + (lv - 1) * 2;

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

/* ---------- 招募新居民：本版本暂时关闭（固定 8 位家人）----------
 * 内容全部保留：下面 24 位候选居民、招募面板、美术需求清单都还在。
 * 想重新开启只需把下面这行改成 true，无需改动其它任何代码。 */
CATALOG.RECRUIT_ENABLED = false;

CATALOG.NEW_RESIDENT_POOL = [
  { name: '面包店王叔叔', emoji: '👨‍🍳', sprite: 'baker_wang' },
  { name: '医生李阿姨', emoji: '👩‍⚕️', sprite: 'doctor_li' },
  { name: '警察张叔叔', emoji: '👮', sprite: 'police_zhang' },
  { name: '老师刘阿姨', emoji: '👩‍🏫', sprite: 'teacher_liu' },
  { name: '司机赵师傅', emoji: '🧔', sprite: 'driver_zhao' },
  { name: '画家小周', emoji: '🧑‍🎨', sprite: 'painter_zhou' },
  { name: '工程师陈叔叔', emoji: '👷', sprite: 'engineer_chen' },
  { name: '飞行员高叔叔', emoji: '🧑‍✈️', sprite: 'pilot_gao' },
  { name: '厨师孙师傅', emoji: '🧑‍🍳', sprite: 'chef_sun' },
  { name: '科学家吴博士', emoji: '🧑‍🔬', sprite: 'scientist_wu' },
  { name: '邮递员小马', emoji: '🧑‍💼', sprite: 'postman_ma' },
  { name: '园丁老杨', emoji: '🧓', sprite: 'gardener_yang' },
  { name: '消防员郑叔叔', emoji: '🧑‍🚒', sprite: 'firefighter_zheng' },
  { name: '兽医小林', emoji: '🧑‍⚕️', sprite: 'vet_lin' },
  { name: '音乐家安妮', emoji: '👩‍🎤', sprite: 'singer_annie' },
  { name: '运动员大力', emoji: '🏃', sprite: 'athlete_dali' },
  { name: '甜品师小柔', emoji: '🧁', sprite: 'pastry_xiaorou' },
  { name: '摄影师阿凯', emoji: '📷', sprite: 'photographer_akai' },
  { name: '宇航员天翼', emoji: '🧑‍🚀', sprite: 'astronaut_tianyi' },
  { name: '船长老海', emoji: '⚓', sprite: 'captain_laohai' },
  { name: '魔术师奇奇', emoji: '🎩', sprite: 'magician_qiqi' },
  { name: '农场主福伯', emoji: '🌾', sprite: 'farmer_fubo' },
  { name: '程序员小极', emoji: '💻', sprite: 'coder_xiaoji' },
  { name: '篮球教练强哥', emoji: '🏀', sprite: 'coach_qiangge' }
];
CATALOG.residentCost = (pop) => 80 + Math.max(0, pop - 8) * 40;

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

/* ---------- 建筑目录（40+种） ---------- */
CATALOG.BUILDINGS = [
  // —— 住宅 ——
  { id: 'house_wood', cat: 'house', name: '木屋', icon: '🛖', cost: 60, popCap: 2, income: 15, w: 2, h: 2, fl: 1, color: '#a8763a', desc: '温馨小木屋，房租15元/周（可住2人）', unlockIncome: 0 },
  { id: 'house_brick', cat: 'house', name: '砖房', icon: '🏠', cost: 150, popCap: 4, income: 35, w: 2, h: 2, fl: 1.6, color: '#c25a3a', desc: '结实砖房，房租35元/周（可住4人）', unlockIncome: 150 },
  { id: 'house_villa', cat: 'house', name: '小别墅', icon: '🏡', cost: 400, popCap: 6, income: 90, happy: 3, w: 3, h: 2, fl: 2, color: '#5c8a4a', desc: '带花园的别墅，房租90元/周，幸福度+3', unlockIncome: 400 },
  { id: 'apartment', cat: 'house', name: '公寓楼', icon: '🏢', cost: 900, popCap: 12, income: 200, w: 2, h: 3, fl: 4, color: '#4a7a9a', desc: '高层公寓，房租200元/周（可住12人）', unlockIncome: 1000 },
  { id: 'mansion', cat: 'house', name: '豪华庄园', icon: '🏰', cost: 1800, popCap: 8, income: 380, happy: 5, w: 3, h: 3, fl: 2.6, color: '#8a6aa0', desc: '气派的大庄园，房租380元/周，幸福度+5', unlockIncome: 1500 },
  { id: 'skyhome', cat: 'house', name: '摩天住宅', icon: '🌇', cost: 3200, popCap: 20, income: 680, w: 3, h: 3, fl: 7, color: '#5a8ab5', desc: '入云的摩天大楼，房租680元/周（可住20人）', unlockIncome: 4200 },
  // —— 商业 ——
  { id: 'store', cat: 'business', name: '便利店', icon: '🏪', cost: 100, income: 40, w: 2, h: 2, fl: 1, color: '#3ab54a', desc: '24小时便利店，营业额40元/周', unlockIncome: 0 },
  { id: 'bakery', cat: 'business', name: '面包店', icon: '🥐', cost: 180, income: 70, w: 2, h: 2, fl: 1, color: '#e0a04a', desc: '香喷喷的面包店，营业额70元/周', unlockIncome: 0 },
  { id: 'coffee', cat: 'business', name: '咖啡店', icon: '☕', cost: 150, income: 55, w: 2, h: 1, fl: 1, color: '#8a5a3a', desc: '飘着咖啡香，营业额55元/周', unlockIncome: 0 },
  { id: 'toy_store', cat: 'business', name: '玩具店', icon: '🧸', cost: 260, income: 95, w: 2, h: 2, fl: 1.4, color: '#e06a9a', desc: '小朋友最爱！营业额95元/周', unlockIncome: 150 },
  { id: 'restaurant', cat: 'business', name: '餐厅', icon: '🍽️', cost: 320, income: 120, w: 2, h: 2, fl: 1.4, color: '#d05a4a', desc: '生意红火的餐厅，营业额120元/周', unlockIncome: 220 },
  { id: 'pizza', cat: 'business', name: '披萨店', icon: '🍕', cost: 350, income: 130, w: 2, h: 2, fl: 1.2, color: '#e07a2a', desc: '香喷喷的披萨，营业额130元/周', unlockIncome: 220 },
  { id: 'supermarket', cat: 'business', name: '大超市', icon: '🛒', cost: 450, income: 165, w: 3, h: 2, fl: 1.4, color: '#2a9a6a', desc: '什么都能买到，营业额165元/周', unlockIncome: 300 },
  { id: 'cinema', cat: 'business', name: '电影院', icon: '🎬', cost: 600, income: 200, w: 3, h: 2, fl: 2.2, color: '#5a4a8a', desc: '放最新动画电影，营业额200元/周', unlockIncome: 400 },
  { id: 'arcade', cat: 'business', name: '电玩城', icon: '🕹️', cost: 750, income: 250, w: 2, h: 2, fl: 2, color: '#7a3ab0', desc: '好玩的游戏机，营业额250元/周', unlockIncome: 500 },
  { id: 'bank', cat: 'business', name: '银行', icon: '🏦', cost: 1200, income: 380, w: 2, h: 2, fl: 3, color: '#9a8a4a', desc: '存钱的地方，营业额380元/周', unlockIncome: 800 },
  { id: 'mall', cat: 'business', name: '购物中心', icon: '🛍️', cost: 1500, income: 450, w: 3, h: 3, fl: 3, color: '#c04a8a', desc: '超大购物中心，营业额450元/周', unlockIncome: 1000 },
  { id: 'hotel', cat: 'business', name: '大酒店', icon: '🏨', cost: 2600, income: 700, w: 3, h: 3, fl: 5.5, color: '#8a6a2a', desc: '五星级大酒店，营业额700元/周', unlockIncome: 2400 },
  { id: 'zoo', cat: 'business', name: '动物园', icon: '🦁', cost: 2200, income: 600, w: 4, h: 3, fl: 0.2, color: '#6a9a4a', desc: '狮子老虎大熊猫！营业额600元/周', unlockIncome: 1800 },
  { id: 'amusement', cat: 'business', name: '游乐园', icon: '🎡', cost: 5000, income: 1200, w: 4, h: 3, fl: 2.4, color: '#e46aaa', desc: '超好玩的游乐园，营业额1200元/周', unlockIncome: 5000 },
  { id: 'aquarium', cat: 'business', name: '海洋馆', icon: '🐋', cost: 4200, income: 950, w: 4, h: 3, fl: 2, color: '#2a7ab5', desc: '看鲸鱼和海豚，营业额950元/周', unlockIncome: 3500 },
  // —— 公共 ——
  { id: 'road', cat: 'public', name: '道路', icon: '🛣️', cost: 5, happy: 0, w: 1, h: 1, fl: 0, color: '#5c5c5c', desc: '连接城市的道路，居民和汽车都爱走', unlockIncome: 0 },
  { id: 'rail', cat: 'public', name: '铁轨', icon: '🛤️', cost: 30, happy: 0, w: 1, h: 1, fl: 0, color: '#8a7050', desc: '铺在草地上的铁轨，火车沿轨道跑（需要火车站）', unlockIncome: 800 },
  { id: 'bridge_road', cat: 'public', name: '公路桥', icon: '🌉', cost: 200, happy: 3, w: 2, h: 1, fl: 0.5, color: '#9a9aa5', desc: '只能造在河面上，汽车和居民可以过河', unlockIncome: 300 },
  { id: 'bridge_rail', cat: 'public', name: '铁路桥', icon: '🌁', cost: 300, happy: 3, w: 2, h: 1, fl: 0.5, color: '#7a8595', desc: '只能造在河面上，火车轰隆隆过大桥', unlockIncome: 1000 },
  { id: 'park', cat: 'public', name: '小公园', icon: '🌳', cost: 80, happy: 5, w: 2, h: 2, fl: 0.2, color: '#4a9a4a', desc: '绿树成荫，幸福度+5', unlockIncome: 0 },
  { id: 'flower', cat: 'public', name: '花园', icon: '🌷', cost: 100, happy: 5, w: 1, h: 1, fl: 0.2, color: '#c05a8a', desc: '五彩的花朵，幸福度+5', unlockIncome: 0 },
  { id: 'fountain', cat: 'public', name: '喷泉广场', icon: '⛲', cost: 160, happy: 7, w: 2, h: 2, fl: 0.3, color: '#5a9ab5', desc: '哗啦啦的喷泉，幸福度+7', unlockIncome: 0 },
  { id: 'playground', cat: 'public', name: '游乐场', icon: '🛝', cost: 150, happy: 8, w: 2, h: 2, fl: 0.3, color: '#e08a3a', desc: '孩子们的最爱，幸福度+8', unlockIncome: 0 },
  { id: 'kindergarten', cat: 'public', name: '幼儿园', icon: '🧸', cost: 250, happy: 8, w: 2, h: 2, fl: 1.2, color: '#e0a05a', desc: '小小朋友的乐园，幸福度+8', unlockIncome: 150 },
  { id: 'school', cat: 'public', name: '学校', icon: '🏫', cost: 350, happy: 12, w: 3, h: 2, fl: 2, color: '#c2803a', desc: '知识的殿堂，幸福度+12', unlockIncome: 220 },
  { id: 'post_office', cat: 'public', name: '邮局', icon: '📮', cost: 300, happy: 7, w: 2, h: 2, fl: 1.4, color: '#3a8a5a', desc: '寄信送包裹，幸福度+7', unlockIncome: 300 },
  { id: 'hospital', cat: 'public', name: '医院', icon: '🏥', cost: 500, happy: 15, w: 3, h: 2, fl: 3, color: '#e05a5a', desc: '守护健康，幸福度+15', unlockIncome: 400 },
  { id: 'library', cat: 'public', name: '图书馆', icon: '📚', cost: 420, happy: 10, w: 2, h: 2, fl: 2, color: '#7a5aa0', desc: '书的海洋，幸福度+10', unlockIncome: 400 },
  { id: 'fire_station', cat: 'public', name: '消防局', icon: '🚒', cost: 450, happy: 10, w: 2, h: 2, fl: 1.8, color: '#d02a2a', desc: '城市安全卫士，幸福度+10', unlockIncome: 650 },
  { id: 'police', cat: 'public', name: '警察局', icon: '🚓', cost: 450, happy: 10, w: 2, h: 2, fl: 1.8, color: '#2a4a9a', desc: '维护治安，幸福度+10', unlockIncome: 650 },
  { id: 'museum', cat: 'public', name: '博物馆', icon: '🏛️', cost: 1500, happy: 20, w: 3, h: 2, fl: 2.4, color: '#9a8a5a', desc: '收藏历史珍宝，幸福度+20', unlockIncome: 1500 },
  { id: 'stadium', cat: 'public', name: '体育场', icon: '🏟️', cost: 1800, happy: 25, w: 4, h: 3, fl: 2, color: '#3a8a6a', desc: '举办比赛，幸福度+25', unlockIncome: 1500 },
  { id: 'tv_tower', cat: 'public', name: '电视塔', icon: '🗼', cost: 2800, happy: 28, w: 2, h: 2, fl: 9, color: '#c04a4a', desc: '城市地标！幸福度+28', unlockIncome: 3000 },
  // —— 配套 ——
  { id: 'parking', cat: 'support', name: '停车场', icon: '🅿️', cost: 60, happy: 2, w: 3, h: 3, fl: 0, color: '#5a6a7a', desc: '停放城市车辆，幸福度+2', unlockIncome: 0 },
  { id: 'bus_stop', cat: 'support', name: '公交站', icon: '🚏', cost: 90, happy: 4, w: 1, h: 1, fl: 0.6, color: '#3a7ab0', desc: '方便出行，幸福度+4', unlockIncome: 150 },
  { id: 'gas', cat: 'support', name: '加油站', icon: '⛽', cost: 200, happy: 3, income: 50, w: 2, h: 2, fl: 0.8, color: '#c05a2a', desc: '给汽车加油，营业额50元/周', unlockIncome: 220 },
  { id: 'solar', cat: 'support', name: '太阳能电站', icon: '🔆', cost: 300, happy: 4, w: 2, h: 1, fl: 0.3, color: '#2a5a8a', desc: '清洁能源，幸福度+4', unlockIncome: 300 },
  { id: 'wind_turbine', cat: 'support', name: '风力发电机', icon: '🌀', cost: 350, happy: 5, w: 1, h: 1, fl: 4, color: '#e8e8e8', desc: '大风车转呀转，幸福度+5', unlockIncome: 300 },
  { id: 'train_station', cat: 'support', name: '火车站', icon: '🚉', cost: 1200, happy: 15, w: 4, h: 2, fl: 1.8, color: '#6a5a4a', desc: '火车开进城！幸福度+15，解锁火车', unlockIncome: 1000 },
  { id: 'harbor', cat: 'support', name: '港口', icon: '⚓', cost: 3000, happy: 20, w: 4, h: 2, fl: 1, color: '#2a5a7a', desc: '轮船码头，幸福度+20，解锁轮船', unlockIncome: 2400 },
  { id: 'airport', cat: 'support', name: '飞机场', icon: '🛫', cost: 4000, happy: 30, w: 5, h: 3, fl: 1.4, color: '#4a6a8a', desc: '飞向蓝天！幸福度+30，解锁飞机', unlockIncome: 3000 },
  { id: 'rocket_pad', cat: 'support', name: '火箭发射台', icon: '🚀', cost: 8000, happy: 40, w: 3, h: 3, fl: 6, color: '#7a4a2a', desc: '飞向太空！幸福度+40，解锁火箭', unlockIncome: 8000 },
  // —— 装饰小物（1×1，便宜，随手点缀城市；有美术贴图时自动换成贴图）——
  { id: 'deco_tree_big', cat: 'deco', name: '大树', icon: '🌳', cost: 12, happy: 1, w: 1, h: 1, fl: 0.3, spr: 0.92, color: '#3f8f3f', desc: '圆滚滚的大树，幸福度+1', unlockIncome: 0 },
  { id: 'deco_tree_pine', cat: 'deco', name: '松树', icon: '🌲', cost: 12, happy: 1, w: 1, h: 1, fl: 0.3, spr: 0.88, color: '#2f7a4f', desc: '尖尖的松树，幸福度+1', unlockIncome: 0 },
  { id: 'deco_bush', cat: 'deco', name: '灌木丛', icon: '🌿', cost: 8, happy: 1, w: 1, h: 1, fl: 0.25, spr: 0.72, color: '#5aa54a', desc: '带小花的灌木，幸福度+1', unlockIncome: 0 },
  { id: 'deco_flowerbed', cat: 'deco', name: '花坛', icon: '💐', cost: 15, happy: 2, w: 1, h: 1, fl: 0.25, spr: 1.0, color: '#c05a8a', desc: '五彩花坛，幸福度+2', unlockIncome: 0 },
  { id: 'deco_rock', cat: 'deco', name: '石头堆', icon: '🪨', cost: 8, happy: 1, w: 1, h: 1, fl: 0.25, spr: 0.62, color: '#8a8a8a', desc: '灰色圆石堆，幸福度+1', unlockIncome: 0 },
  { id: 'deco_streetlight', cat: 'deco', name: '路灯', icon: '🏮', cost: 20, happy: 2, w: 1, h: 1, fl: 0.3, spr: 0.55, color: '#6a6a7a', desc: '暖黄路灯，幸福度+2', unlockIncome: 0 },
  { id: 'deco_bench', cat: 'deco', name: '长椅', icon: '🪑', cost: 15, happy: 2, w: 1, h: 1, fl: 0.25, spr: 0.62, color: '#a8763a', desc: '休息长椅，幸福度+2', unlockIncome: 0 },
  { id: 'deco_trashbin', cat: 'deco', name: '垃圾桶', icon: '🗑️', cost: 10, happy: 1, w: 1, h: 1, fl: 0.25, spr: 0.3, color: '#3a7a4a', desc: '保持整洁，幸福度+1', unlockIncome: 0 },
  { id: 'deco_hydrant', cat: 'deco', name: '消防栓', icon: '🧯', cost: 12, happy: 1, w: 1, h: 1, fl: 0.25, spr: 0.32, color: '#d02a2a', desc: '红色消防栓，幸福度+1', unlockIncome: 0 },
  { id: 'deco_fence', cat: 'deco', name: '白围栏', icon: '🚧', cost: 8, happy: 1, w: 1, h: 1, fl: 0.25, spr: 0.95, color: '#e8e8e8', desc: '一段白栅栏，幸福度+1', unlockIncome: 0 },
  { id: 'deco_pond', cat: 'deco', name: '小水池', icon: '💧', cost: 25, happy: 3, w: 1, h: 1, fl: 0.2, spr: 1.0, color: '#5a9ab5', desc: '圆形小水池，幸福度+3', unlockIncome: 0 },
  { id: 'deco_bridge', cat: 'deco', name: '小木桥', icon: '🌉', cost: 25, happy: 2, w: 1, h: 1, fl: 0.25, spr: 1.0, color: '#b0844a', desc: '一格小木桥，幸福度+2', unlockIncome: 150 },
  { id: 'deco_billboard', cat: 'deco', name: '广告牌', icon: '📋', cost: 30, happy: 2, w: 1, h: 1, fl: 0.4, spr: 0.75, color: '#d0d0d0', desc: '可以改名字的广告牌，幸福度+2', unlockIncome: 150 },
  { id: 'deco_traffic_light', cat: 'deco', name: '红绿灯', icon: '🚦', cost: 20, happy: 2, w: 1, h: 1, fl: 0.35, spr: 0.5, color: '#4a4a5a', desc: '路口红绿灯，幸福度+2', unlockIncome: 150 },
];

/* ---------- 车辆/载具收藏（35款，参考真实车型/机型） ---------- */
CATALOG.VEHICLES = [
  // 汽车
  { id: 'wuling', type: 'car', name: '五菱宏光MINI EV', icon: '🚗', cost: 80, desc: '国民小电车，小巧灵活', need: null },
  { id: 'mini', type: 'car', name: 'MINI Cooper', icon: '🚗', cost: 130, desc: '英伦经典小钢炮', need: null },
  { id: 'corolla', type: 'car', name: '丰田卡罗拉', icon: '🚙', cost: 150, desc: '全球最畅销家用车之一', need: null },
  { id: 'su7', type: 'car', name: '小米SU7', icon: '🚘', cost: 240, desc: '会联网的智能电动车', need: null },
  { id: 'model3', type: 'car', name: '特斯拉 Model 3', icon: '🚘', cost: 280, desc: '会自动驾驶的电动车', need: null },
  { id: 'byd_han', type: 'car', name: '比亚迪·汉', icon: '🚔', cost: 260, desc: '中国造豪华电动轿车', need: null },
  { id: 'gclass', type: 'car', name: '奔驰大G(G63)', icon: '🚙', cost: 500, desc: '方盒子越野硬汉', need: null },
  { id: 'landcruiser', type: 'car', name: '丰田兰德酷路泽', icon: '🚙', cost: 420, desc: '越野之王，翻山越岭', need: null },
  { id: 'cybertruck', type: 'car', name: '特斯拉Cybertruck', icon: '🛻', cost: 650, desc: '像太空车的电动皮卡', need: null },
  { id: 'gt3rs', type: 'car', name: '保时捷911 GT3 RS', icon: '🏎️', cost: 900, desc: '赛道传奇，极速312km/h', need: null },
  { id: 'lafa', type: 'car', name: '法拉利 LaFerrari', icon: '🏎️', cost: 1500, desc: '意大利梦想超跑', need: null },
  { id: 'chiron', type: 'car', name: '布加迪Chiron', icon: '🏎️', cost: 2200, desc: '极速420km/h的地表最强', need: null },
  // 工程/服务车
  { id: 'taxi', type: 'service', name: '出租车', icon: '🚕', cost: 120, desc: '滴滴——城市出行好帮手', need: null },
  { id: 'bus', type: 'service', name: '城市公交车', icon: '🚌', cost: 180, desc: '一次能坐好多人', need: null },
  { id: 'schoolbus', type: 'service', name: '美式校车', icon: '🚌', cost: 220, desc: '接送小朋友上学', need: null },
  { id: 'police_car', type: 'service', name: '警车', icon: '🚓', cost: 250, desc: '呜哇呜哇——维护治安', need: null },
  { id: 'ambulance', type: 'service', name: '救护车', icon: '🚑', cost: 260, desc: '争分夺秒救助病人', need: null },
  { id: 'firetruck', type: 'service', name: '消防云梯车', icon: '🚒', cost: 300, desc: '和消防局更配哦', need: null },
  { id: 'garbage', type: 'service', name: '垃圾清运车', icon: '🚛', cost: 200, desc: '保持城市干净整洁', need: null },
  { id: 'excavator', type: 'service', name: '卡特彼勒挖掘机', icon: '🚜', cost: 350, desc: '嗡嗡嗡，挖呀挖呀挖', need: null },
  { id: 'tractor', type: 'service', name: '约翰迪尔拖拉机', icon: '🚜', cost: 280, desc: '田野里的大力士', need: null },
  // 火车（需火车站）
  { id: 'steam', type: 'train', name: '蒸汽小火车', icon: '🚂', cost: 600, desc: '呜呜——复古蒸汽火车', need: 'train_station' },
  { id: 'green_train', type: 'train', name: '绿皮火车', icon: '🚃', cost: 700, desc: '爷爷坐过的经典火车', need: 'train_station' },
  { id: 'harmony', type: 'train', name: '和谐号CRH380A', icon: '🚅', cost: 1000, desc: '流线型白色子弹头', need: 'train_station' },
  { id: 'fuxing', type: 'train', name: '复兴号CR400AF', icon: '🚄', cost: 1200, desc: '中国高铁，时速350公里！', need: 'train_station' },
  { id: 'maglev', type: 'train', name: '上海磁悬浮', icon: '🚝', cost: 1600, desc: '悬浮飞驰，时速430公里！', need: 'train_station' },
  // 飞机（需机场）
  { id: 'balloon', type: 'plane', name: '热气球', icon: '🎈', cost: 500, desc: '慢悠悠飘上天空', need: 'airport' },
  { id: 'helicopter', type: 'plane', name: '直-20直升机', icon: '🚁', cost: 1800, desc: '可以垂直起降', need: 'airport' },
  { id: 'c919', type: 'plane', name: '国产大飞机C919', icon: '✈️', cost: 3000, desc: '中国自主研制的大客机', need: 'airport' },
  { id: 'b747', type: 'plane', name: '波音747', icon: '🛩️', cost: 4000, desc: '经典"空中女王"', need: 'airport' },
  { id: 'a380', type: 'plane', name: '空客A380', icon: '✈️', cost: 4500, desc: '世界最大双层客机', need: 'airport' },
  { id: 'y20', type: 'plane', name: '运-20运输机', icon: '🛫', cost: 3800, desc: '"胖妞"大力士运输机', need: 'airport' },
  // 轮船（需港口）
  { id: 'sailboat', type: 'ship', name: '帆船', icon: '⛵', cost: 800, desc: '乘风破浪的白帆船', need: 'harbor' },
  { id: 'speedboat', type: 'ship', name: '快艇', icon: '🚤', cost: 1200, desc: '海上飞驰的小快艇', need: 'harbor' },
  { id: 'xuelong', type: 'ship', name: '雪龙2号破冰船', icon: '🚢', cost: 3500, desc: '去南极科考的破冰船', need: 'harbor' },
  { id: 'cruise', type: 'ship', name: '爱达·魔都号邮轮', icon: '🛳️', cost: 5000, desc: '国产大型豪华邮轮', need: 'harbor' },
  { id: 'liaoning', type: 'ship', name: '山东舰航母', icon: '🚢', cost: 8000, desc: '中国首艘国产航空母舰', need: 'harbor' },
  // 火箭（需发射台）
  { id: 'cz5', type: 'rocket', name: '长征五号火箭', icon: '🚀', cost: 10000, desc: '"胖五"送卫星上太空', need: 'rocket_pad' },
  { id: 'shenzhou', type: 'rocket', name: '神舟飞船', icon: '🛸', cost: 12000, desc: '载着航天员遨游太空', need: 'rocket_pad' }
];

/* ---------- 礼物系统 ---------- */
CATALOG.GIFTS = [
  { streak: 10, name: '小汽车玩具兑换卡', icon: '🚗', desc: '连续答对10题获得！可以找爸爸妈妈兑换一辆玩具小汽车' },
  { streak: 20, name: '乐高小套装兑换卡', icon: '🧱', desc: '连续答对20题获得！可以兑换一盒乐高小套装' },
  { streak: 30, name: '冰淇淋兑换卡', icon: '🍦', desc: '连续答对30题获得！可以兑换一个美味冰淇淋' },
  { streak: 50, name: '游乐园门票兑换卡', icon: '🎢', desc: '连续答对50题获得！可以兑换一次游乐园之旅' },
  { streak: 100, name: '超级大奖兑换卡', icon: '🏆', desc: '连续答对100题！和爸爸妈妈商量一个大心愿吧！' }
];

CATALOG.findBuilding = (id) => CATALOG.BUILDINGS.find(b => b.id === id);
CATALOG.findVehicle = (id) => CATALOG.VEHICLES.find(v => v.id === id);
CATALOG.findOutfit = (id) => CATALOG.OUTFITS.find(o => o.id === id);
