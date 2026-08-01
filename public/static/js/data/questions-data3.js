/* ============================================================
 * Rich's City 题库 v3 —— 五科体系重构
 *  英语：牛津树(ORT)/剑桥 Power Up 分级 → YLE Starters/Movers/Flyers
 *        g3=Starters打底 g4=Movers核心 g5=Movers+/Flyers- g6=Flyers
 *        （游戏内英语自动按 年级+1 取词，实现"稍微难一点"）
 *  通识：美国小学 Social Studies 五条线
 *        社区规则 / 世界地理 / 经济财商 / 多元文化 / 公民与全球议题
 *  科学：当下科技发展 60% + 基础原理 40%
 *  语文：想象力与语感鉴赏
 *  另含：创作题 prompts、每日跟读短文
 * ============================================================ */
(function () {

/* ==================== 1. ORT/YLE 英语扩词（去重合并进 ENGLISH_VOCAB） ==================== */
const V2 = {
g3: [ // Starters 补充
  ['beach','海滩'],['sea','大海'],['sand','沙子'],['boat','小船'],['kite','风筝'],
  ['ball','球'],['park','公园'],['zoo','动物园'],['shop','商店'],['street','街道'],
  ['train','火车'],['plane','飞机'],['clock','钟表'],['window','窗户'],['door','门'],
  ['garden','花园'],['juice','果汁'],['egg','鸡蛋'],['rice','米饭'],['noodles','面条'],
  ['robot','机器人'],['doll','玩具娃娃'],['game','游戏'],['song','歌曲'],['story','故事']
],
g4: [ // Movers 核心（孩子的主力档）
  ['weekend','周末'],['yesterday','昨天'],['tomorrow','明天'],['breakfast','早餐'],
  ['lunch','午餐'],['dinner','晚餐'],['homework','家庭作业'],['library','图书馆'],
  ['hospital','医院'],['market','市场'],['farm','农场'],['forest','森林'],
  ['river','河流'],['mountain','山'],['lake','湖'],['field','田野'],
  ['weather','天气'],['cloudy','多云的'],['sunny','晴朗的'],['rainy','下雨的'],
  ['windy','刮风的'],['snowy','下雪的'],['coat','外套'],['scarf','围巾'],
  ['gloves','手套'],['sweater','毛衣'],['dentist','牙医'],['nurse','护士'],
  ['driver','司机'],['farmer','农民'],['cook','厨师'],['firefighter','消防员'],
  ['headache','头疼'],['toothache','牙疼'],['careful','小心的'],['quiet','安静的'],
  ['loud','大声的'],['thirsty','口渴的'],['tired','疲倦的'],['busy','忙碌的'],
  ['easy','容易的'],['difficult','困难的'],['different','不同的'],['same','相同的'],
  ['favourite','最喜欢的'],['picnic','野餐'],['holiday','假日'],['ticket','票']
],
g5: [ // Movers+ / Flyers 基础
  ['environment','环境'],['temperature','温度'],['passenger','乘客'],['competition','比赛'],
  ['museum','博物馆'],['castle','城堡'],['island','岛屿'],['desert','沙漠'],
  ['ocean','海洋'],['planet','行星'],['message','消息'],['email','电子邮件'],
  ['screen','屏幕'],['program','程序'],['future','未来'],['dangerous','危险的'],
  ['famous','著名的'],['important','重要的'],['interesting','有趣的'],['delicious','美味的'],
  ['healthy','健康的'],['exercise','锻炼'],['medicine','药'],['dictionary','词典'],
  ['newspaper','报纸'],['magazine','杂志'],['subject','学科'],['history','历史'],
  ['geography','地理'],['nature','大自然'],['insect','昆虫'],['whale','鲸鱼'],
  ['penguin','企鹅'],['camel','骆驼'],['brave','勇敢的'],['polite','有礼貌的'],
  ['repair','修理'],['collect','收集'],['practise','练习'],['arrive','到达']
],
g6: [ // Flyers
  ['experiment','实验'],['astronaut','宇航员'],['universe','宇宙'],['gravity','重力'],
  ['energy','能量'],['electricity','电'],['invention','发明'],['engineer','工程师'],
  ['scientist','科学家'],['technology','科技'],['information','信息'],['knowledge','知识'],
  ['adventure','冒险'],['mystery','谜团'],['treasure','宝藏'],['journey','旅程'],
  ['foreign','外国的'],['language','语言'],['culture','文化'],['tradition','传统'],
  ['festival','节日'],['celebrate','庆祝'],['decide','决定'],['believe','相信'],
  ['imagine','想象'],['create','创造'],['explore','探索'],['discover','发现'],
  ['protect','保护'],['pollution','污染'],['recycle','回收利用'],['century','世纪'],
  ['ancient','古代的'],['modern','现代的'],['international','国际的'],['succeed','成功']
]
};
// 去重合并
(function mergeVocab() {
  const V = window.ENGLISH_VOCAB = window.ENGLISH_VOCAB || {};
  for (const g in V2) {
    V[g] = V[g] || [];
    const seen = new Set(V[g].map(p => p[0]));
    for (const pair of V2[g]) if (!seen.has(pair[0])) { V[g].push(pair); seen.add(pair[0]); }
  }
})();

/* ==================== 2. 静态扩容题（合并进 QUESTION_BANK） ==================== */
const EXT2 = { english: {}, general: {}, science: {}, chinese: {} };

/* ---- 英语：迷你阅读/句型理解（牛津树风格短句） ---- */
EXT2.english.g4 = [
  { q: '读一读："Tom goes to school by bus." Tom 是怎么去学校的？', opts: ['坐公交车', '走路', '骑自行车', '坐小汽车'], a: 0, tip: 'by bus 坐公交车。by + 交通工具表示出行方式。' },
  { q: '读一读："It is raining. Take your umbrella!" 你应该带什么？', opts: ['雨伞', '帽子', '风筝', '水杯'], a: 0, tip: 'umbrella 雨伞。下雨(raining)要带伞。' },
  { q: '读一读："Kipper has a new dog. Its name is Floppy." Floppy 是什么？', opts: ['一只狗', '一只猫', '一个男孩', '一个玩具'], a: 0, tip: '牛津树里 Floppy 就是 Kipper 家的小狗！' },
  { q: '读一读："I get up at seven o\'clock." 我几点起床？', opts: ['7点', '6点', '8点', '11点'], a: 0, tip: 'get up 起床，seven o\'clock 七点整。' },
  { q: '"Would you like some milk?" 最合适的回答是？', opts: ['Yes, please.', 'I am milk.', 'Goodbye!', 'It is a cat.'], a: 0, tip: '别人给你食物，想要就说 Yes, please. 不要就说 No, thanks.' },
  { q: '读一读："The cat is under the table." 猫在哪里？', opts: ['桌子下面', '桌子上面', '桌子旁边', '椅子上'], a: 0, tip: 'under 在……下面；on 在……上面。' },
  { q: '"How old are you?" 是在问什么？', opts: ['你几岁', '你好吗', '你叫什么', '你在哪'], a: 0, tip: 'How old 问年龄，回答 I am nine. （我九岁）' },
  { q: '读一读："Biff can swim but Chip can\'t." 谁会游泳？', opts: ['Biff', 'Chip', '两个都会', '两个都不会'], a: 0, tip: 'can 会，can\'t 不会。but 表示转折。' },
  { q: '"What\'s the weather like today?" 是在问什么？', opts: ['今天天气怎么样', '今天星期几', '现在几点了', '你喜欢什么'], a: 0, tip: '问天气用 What\'s the weather like? 回答如 It\'s sunny.' },
  { q: '读一读："I have two brothers and one sister." 我家有几个孩子（包括我）？', opts: ['4个', '3个', '2个', '5个'], a: 0, tip: '两个兄弟+一个姐妹+我自己 = 4 个孩子。读题要仔细！' }
];
EXT2.english.g5 = [
  { q: '读一读："Mum was angry because the children were late." 妈妈为什么生气？', opts: ['孩子们迟到了', '孩子们打架了', '天气不好', '晚饭凉了'], a: 0, tip: 'because 因为，late 迟到。' },
  { q: '读一读："The magic key began to glow!" 魔法钥匙怎么了？', opts: ['开始发光', '不见了', '碎掉了', '变大了'], a: 0, tip: '牛津树经典句！glow 发光，began to 开始。' },
  { q: '"I\'m looking forward to the picnic." 说话的人心情是？', opts: ['很期待', '很害怕', '很生气', '很无聊'], a: 0, tip: 'look forward to 期待、盼望着。' },
  { q: '读一读："First we bought tickets, then we got on the train." 我们先做了什么？', opts: ['买票', '上火车', '吃饭', '拍照'], a: 0, tip: 'first 首先，then 然后。顺序词帮你理清故事。' },
  { q: '"Shall we go to the museum tomorrow?" 说话的人在做什么？', opts: ['提议一起去博物馆', '拒绝去博物馆', '描述博物馆', '问路'], a: 0, tip: 'Shall we...? 是提议"我们……好吗？"' },
  { q: '读一读："Wilf was so tired that he fell asleep on the sofa." Wilf 怎么了？', opts: ['累得在沙发上睡着了', '在沙发上跳', '把沙发弄坏了', '找不到沙发'], a: 0, tip: 'so...that... 如此……以至于……；fall asleep 睡着。' },
  { q: '"Could you tell me the way to the station?" 说话的人想要什么？', opts: ['问去车站的路', '买车票', '找朋友', '借电话'], a: 0, tip: 'the way to... 去……的路。这是礼貌问路句型。' },
  { q: '读一读："Everyone was excited except Nadim." 谁不兴奋？', opts: ['Nadim', '所有人', '没有人', '老师'], a: 0, tip: 'except 除了……之外。' }
];
EXT2.english.g6 = [
  { q: '读一读："The explorers discovered an ancient city hidden in the jungle." 探险家发现了什么？', opts: ['丛林里隐藏的古城', '一条大河', '一座新桥', '一群动物'], a: 0, tip: 'discover 发现，ancient 古代的，hidden 隐藏的。' },
  { q: '"If it rains tomorrow, we will stay at home." 什么情况下我们待在家？', opts: ['明天下雨', '明天晴天', '今天下雨', '任何时候'], a: 0, tip: 'If... will... 如果……就……（条件句）。' },
  { q: '读一读："Although the robot was small, it was incredibly strong." 这句话强调机器人？', opts: ['虽然小但非常强壮', '又小又弱', '又大又强', '跑得很快'], a: 0, tip: 'although 虽然，incredibly 难以置信地。' },
  { q: '"The spaceship will be launched next month." 宇宙飞船什么时候发射？', opts: ['下个月', '上个月', '明天', '已经发射了'], a: 0, tip: 'launch 发射，next month 下个月。' },
  { q: '读一读："Reading gives us knowledge, and knowledge gives us power." 这句话的意思最接近？', opts: ['读书使人有力量', '读书让人疲劳', '知识没有用', '力量比知识重要'], a: 0, tip: '知识就是力量！knowledge 知识，power 力量。' },
  { q: '"He speaks not only English but also French." 他会说几种语言（至少）？', opts: ['2种', '1种', '3种', '0种'], a: 0, tip: 'not only... but also... 不但……而且……' }
];

/* ---- 通识：美国 Social Studies 五条线 ---- */
EXT2.general.g3 = [
  // 社区与规则
  { q: '在美国的学校里，孩子们每天早上对着国旗做什么？', opts: ['宣誓效忠(Pledge of Allegiance)', '唱生日歌', '做早操', '吃早餐'], a: 0, tip: '美国学生每天面向国旗念效忠宣誓，就像我们升国旗一样，是爱国教育。' },
  { q: '社区里的 community helpers（社区帮手）不包括下面哪个？', opts: ['电影明星', '消防员', '警察', '邮递员'], a: 0, tip: '社区帮手指为大家日常服务的人：消防员、警察、医生、邮递员、老师等。' },
  { q: '在图书馆里应该怎么做？', opts: ['小声说话，爱护书本', '大声打电话', '在书上画画', '跑来跑去'], a: 0, tip: '图书馆是公共场所，安静和爱护公物是基本的公民礼仪。' },
  { q: '红绿灯坏了的路口，谁来指挥交通？', opts: ['交通警察', '司机自己', '路人', '没有人'], a: 0, tip: '警察是社区安全的守护者，特殊情况由交警指挥。' },
  // 世界地理
  { q: '地球上一共有几大洲？', opts: ['7个', '5个', '6个', '8个'], a: 0, tip: '七大洲：亚洲、非洲、北美洲、南美洲、南极洲、欧洲、大洋洲。' },
  { q: '世界上最大的海洋是？', opts: ['太平洋', '大西洋', '印度洋', '北冰洋'], a: 0, tip: '太平洋(Pacific Ocean)最大，几乎占地球表面的三分之一。' },
  { q: '美国的首都是哪里？', opts: ['华盛顿', '纽约', '洛杉矶', '芝加哥'], a: 0, tip: '首都是华盛顿(Washington, D.C.)。纽约虽然更大更有名，但不是首都哦。' },
  { q: '自由女神像在哪个城市？', opts: ['纽约', '伦敦', '巴黎', '东京'], a: 0, tip: '自由女神像(Statue of Liberty)在纽约，是法国送给美国的礼物。' },
  // 经济财商
  { q: '"需要(needs)"和"想要(wants)"，下面哪个属于"需要"？', opts: ['喝水', '新款游戏机', '第10个玩具', '糖果'], a: 0, tip: '需要=生存必须的（水、食物、住所）；想要=让生活更有趣但没有也行的。' },
  { q: '把零花钱存起来的行为叫做？', opts: ['储蓄', '消费', '浪费', '借钱'], a: 0, tip: '储蓄(saving)是财商第一课：先存一部分，再花剩下的。' },
  { q: '人们把钱存在哪里最安全？', opts: ['银行', '床底下', '口袋里', '书包里'], a: 0, tip: '银行(bank)不仅安全，存钱还会有利息。' },
  { q: '你的城市里商店要交什么给市政厅？', opts: ['税', '礼物', '玩具', '作业'], a: 0, tip: '就像游戏里一样！商家纳税(tax)，政府用税收修路、建学校、发工资。' },
  // 多元文化
  { q: '美国的感恩节(Thanksgiving)人们通常吃什么？', opts: ['火鸡', '饺子', '寿司', '披萨'], a: 0, tip: '感恩节在11月第四个星期四，家人团聚吃火鸡(turkey)，感谢一年的收获。' },
  { q: '万圣节(Halloween)孩子们会说哪句话去要糖果？', opts: ['Trick or treat!', 'Happy birthday!', 'Good night!', 'Thank you!'], a: 0, tip: 'Trick or treat 意思是"不给糖就捣蛋"！孩子们穿上装扮挨家要糖。' },
  { q: '中国春节和西方圣诞节的共同点是？', opts: ['都是家人团聚的节日', '都在夏天', '都要吃火鸡', '都放鞭炮'], a: 0, tip: '世界各地的重要节日几乎都有"家人团聚"的主题，文化不同，爱是相通的。' },
  { q: '在日本，人们见面时常用什么方式打招呼？', opts: ['鞠躬', '贴面礼', '碰鼻子', '击掌'], a: 0, tip: '日本人鞠躬(bow)表示尊重；法国人贴面礼；新西兰毛利人碰鼻子。' },
  // 公民与全球议题
  { q: '垃圾分类中，喝完的矿泉水瓶属于？', opts: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], a: 0, tip: '塑料瓶可以回收再利用(recycle)，变成新的瓶子甚至衣服！' },
  { q: '同学摔倒了，最好的做法是？', opts: ['扶他起来问他疼不疼', '哈哈大笑', '假装没看见', '拍照发给别人'], a: 0, tip: '善良(kindness)和同理心是全世界通用的品质。' },
  { q: '地球在变暖，下面哪个做法对保护地球有帮助？', opts: ['随手关灯节约用电', '一直开着水龙头', '到处乱扔垃圾', '浪费粮食'], a: 0, tip: '节约能源可以减少碳排放，人人都能为地球出力。' },
  { q: '陌生网友说"告诉我你家地址，我送你游戏皮肤"，你应该？', opts: ['不告诉他，并告诉爸爸妈妈', '马上告诉他', '先要皮肤再说', '把学校地址给他'], a: 0, tip: '网络安全第一课：个人信息（地址、学校、电话）绝不告诉陌生人。' }
];
EXT2.general.g4 = [
  { q: '美国总统住在哪里？', opts: ['白宫', '国会大厦', '五角大楼', '帝国大厦'], a: 0, tip: '白宫(The White House)在华盛顿，既是总统的家也是办公室。' },
  { q: '美国国旗上的 50 颗星代表什么？', opts: ['50个州', '50位总统', '50年历史', '50座城市'], a: 0, tip: '美国由50个州(states)组成，一颗星代表一个州；13条纹代表最早的13个殖民地。' },
  { q: '世界上面积最大的国家是？', opts: ['俄罗斯', '中国', '美国', '加拿大'], a: 0, tip: '俄罗斯约1700万平方公里，横跨欧亚两大洲。中国排第三。' },
  { q: '尼罗河、亚马逊河、长江，哪条河在非洲？', opts: ['尼罗河', '亚马逊河', '长江', '都不在'], a: 0, tip: '尼罗河在非洲（最长的河），亚马逊河在南美洲（水量最大），长江在中国。' },
  { q: '埃及金字塔最初是用来做什么的？', opts: ['法老的陵墓', '住人的房子', '学校', '商场'], a: 0, tip: '金字塔(pyramids)是古埃及法老的陵墓，已有4500多年历史。' },
  { q: '商店里一个玩具进价10元、卖15元，商家赚的5元叫做？', opts: ['利润', '税', '工资', '罚款'], a: 0, tip: '利润(profit) = 卖价 - 成本。做生意就是靠合理的利润维持经营。' },
  { q: '同样的雨伞，晴天10元、暴雨天卖20元还抢着买，这说明价格受什么影响？', opts: ['供求关系', '雨伞颜色', '店主心情', '店铺大小'], a: 0, tip: '想买的人多、货少 → 价格上涨。这就是供给和需求(supply & demand)。' },
  { q: '预算(budget)的意思是？', opts: ['提前计划钱怎么花', '把钱全部花光', '找别人借钱', '把钱藏起来'], a: 0, tip: '做预算 = 提前规划收入和支出，是理财最重要的习惯。' },
  { q: '西方孩子过生日时的传统是？', opts: ['吹灭蜡烛前许愿', '吃长寿面', '收红包', '贴春联'], a: 0, tip: '各国庆祝方式不同：西方吹蜡烛许愿，中国吃长寿面，都是美好祝福。' },
  { q: '"投票选班长，得票最多的当选"体现了什么规则？', opts: ['少数服从多数', '个子高的说了算', '老师指定', '抽签决定'], a: 0, tip: '投票(voting)是民主决策的基本方式，美国孩子从小在班级里练习投票。' },
  { q: '为什么图书馆、公园对所有人免费开放？', opts: ['它们是税收支持的公共服务', '它们不用花钱建', '没人想去', '只对孩子免费'], a: 0, tip: '公共服务(public services)由大家交的税支撑，人人都能享用——就像你游戏里建的公园！' },
  { q: '联合国(UN)是做什么的组织？', opts: ['让世界各国和平合作', '卖玩具的公司', '一支球队', '一所学校'], a: 0, tip: '联合国有193个成员国，一起解决和平、环境、贫困等全球问题。' }
];
EXT2.general.g5 = [
  { q: '美国政府分成三个部分（三权分立），不包括？', opts: ['娱乐部门', '国会(立法)', '总统(行政)', '法院(司法)'], a: 0, tip: '三权分立：国会制定法律、总统执行法律、法院解释法律，互相制衡。' },
  { q: '"哥伦布1492年航行"最重要的影响是？', opts: ['让欧洲人知道了美洲大陆', '发明了轮船', '发现了月球', '建立了纽约'], a: 0, tip: '1492年哥伦布横渡大西洋到达美洲，从此新旧大陆的历史交织在一起。' },
  { q: '经度和纬度是用来做什么的？', opts: ['确定地球上任何一点的位置', '测量温度', '计算时间', '称重量'], a: 0, tip: '经纬度就像地球的坐标网格，GPS 导航就靠它定位。' },
  { q: '通货膨胀(inflation)简单说就是？', opts: ['钱越来越不值钱，东西变贵', '钱越来越值钱', '银行倒闭', '大家都发财'], a: 0, tip: '如果一根冰棍去年1元今年2元，同样的钱买到的东西变少了，这就是通胀。' },
  { q: '把100元存银行，年利率3%，一年后利息是多少？', opts: ['3元', '30元', '13元', '0.3元'], a: 0, tip: '利息 = 本金 × 利率 = 100 × 3% = 3元。钱能"生"钱，这就是复利的起点。' },
  { q: '世界三大主要宗教建筑：教堂、清真寺和什么？', opts: ['寺庙', '城堡', '灯塔', '体育场'], a: 0, tip: '教堂(基督教)、清真寺(伊斯兰教)、寺庙(佛教)。尊重不同信仰是全球公民素养。' },
  { q: '时差是怎么产生的？', opts: ['地球自转，各地日出时间不同', '每个国家钟表不一样', '飞机飞太快', '太阳有很多个'], a: 0, tip: '地球自转一圈24小时，全球分24个时区。北京中午时纽约还是深夜。' },
  { q: '奥运会每几年举办一届（夏季）？', opts: ['4年', '2年', '1年', '10年'], a: 0, tip: '夏季奥运会每4年一届，是全世界运动员的和平聚会。' },
  { q: '新闻说"某公司股票上涨"，股票代表什么？', opts: ['公司的一小部分所有权', '公司的产品', '一种彩票', '公司的债务'], a: 0, tip: '买股票 = 成为公司的小股东，公司经营好股票就可能升值。' },
  { q: '移民(immigrants)给美国带来的最大财富是？', opts: ['多元的文化和人才', '更多的汽车', '更大的国土', '更长的历史'], a: 0, tip: '美国被称为"大熔炉"，披萨、热狗、幸运饼干都是移民文化的融合。' }
];
EXT2.general.g6 = [
  { q: '《独立宣言》中最著名的一句是"人人生而___"？', opts: ['平等', '富有', '聪明', '高大'], a: 0, tip: '1776年《独立宣言》："All men are created equal（人人生而平等）"。' },
  { q: '全球变暖主要是因为大气中什么气体增多？', opts: ['二氧化碳', '氧气', '氮气', '水蒸气'], a: 0, tip: '烧煤烧油排放CO₂，像给地球盖了厚被子。所以各国都在发展清洁能源。' },
  { q: '"信用(credit)"在金融里指什么？', opts: ['先消费后还款的信任记录', '现金', '存款利息', '打折优惠'], a: 0, tip: '信用卡就是银行相信你会还钱。守信用的人未来贷款买房都更容易。' },
  { q: '硅谷(Silicon Valley)以什么闻名？', opts: ['科技公司云集', '出产黄金', '风景优美', '农业发达'], a: 0, tip: '苹果、谷歌等科技巨头都诞生在旧金山湾区的硅谷。' },
  { q: '一个国家的 GDP 衡量的是？', opts: ['一年创造的商品和服务总值', '人口数量', '国土面积', '军队规模'], a: 0, tip: 'GDP＝国内生产总值，衡量经济规模。你的城市周收入就像迷你GDP！' },
  { q: '"文化差异"面前最好的态度是？', opts: ['尊重和好奇', '嘲笑不同', '强迫别人跟自己一样', '拒绝交流'], a: 0, tip: '世界因不同而精彩。先了解"为什么不同"，再决定怎么看待。' },
  { q: '互联网上看到惊人消息，第一步应该？', opts: ['查证来源是否可靠', '马上转发', '完全相信', '编得更夸张再传'], a: 0, tip: '媒介素养(media literacy)：核实来源、交叉对比，不做谣言的传声筒。' },
  { q: '世界贸易让各国互相买卖商品，最大的好处是？', opts: ['各国发挥所长，大家都受益', '只有大国赚钱', '商品变贵', '交通变堵'], a: 0, tip: '比较优势：智利种樱桃、中国造高铁、美国做芯片，交换让全球生活更好。' }
];

/* ---- 科学：当下科技 60% + 基础原理 40% ---- */
EXT2.science.g3 = [
  { q: 'Siri、小爱同学能听懂你说话，靠的是什么技术？', opts: ['人工智能(AI)', '魔法', '里面藏着小人', '运气'], a: 0, tip: 'AI 通过大量学习人类语言，学会了"听懂"和"回答"。' },
  { q: '电动汽车和汽油车最大的不同是？', opts: ['用电池驱动，不烧汽油', '轮子更多', '不能上路', '没有方向盘'], a: 0, tip: '电动车用电池+电机，不排尾气，更环保。特斯拉、比亚迪都是电动车品牌。' },
  { q: '扫地机器人是怎么知道避开桌腿的？', opts: ['用传感器"看"周围', '桌腿会说话', '靠猜', '有人遥控'], a: 0, tip: '传感器(sensor)就像机器人的眼睛，激光和摄像头帮它画出房间地图。' },
  { q: '中国的空间站叫什么名字？', opts: ['天宫', '月宫', '龙宫', '故宫'], a: 0, tip: '天宫空间站在离地球约400公里的轨道上，宇航员在里面做实验、锻炼、看地球。' },
  { q: '太阳能板是把什么变成电？', opts: ['阳光', '声音', '风', '雨水'], a: 0, tip: '太阳能(solar energy)清洁又免费，很多屋顶和路灯都装了太阳能板。' },
  { q: '无人机不能用来做什么？', opts: ['代替人去上学', '航拍风景', '给偏远地区送药', '巡查森林火情'], a: 0, tip: '无人机(drone)用途超多，但上学还得靠自己！' },
  { q: '视频通话时，你的声音和画面是通过什么传到对方那里的？', opts: ['互联网', '风', '水管', '喊得很大声'], a: 0, tip: '声音图像变成数据，通过光纤和基站在互联网上飞速传输，一眨眼就到了。' },
  { q: '3D 打印机可以做什么？', opts: ['一层层"打印"出立体物品', '打印彩虹', '打印出真的小狗', '把纸变成钱'], a: 0, tip: '3D打印能做玩具、零件，甚至能打印房子和假肢！' }
];
EXT2.science.g4 = [
  { q: 'ChatGPT 这类 AI 是怎么学会回答问题的？', opts: ['学习了海量的文字资料', '偷看答案', '天生就会', '每次都上网抄'], a: 0, tip: '大语言模型通过阅读海量文本，学会了语言规律，但它也会出错，要动脑判断。' },
  { q: '电动汽车的"充电"最像下面哪件事？', opts: ['给手机充电', '给自行车打气', '给汽车加汽油', '给花浇水'], a: 0, tip: '电动车电池和手机电池原理相同（锂电池），只是大得多。' },
  { q: '嫦娥探月工程的"嫦娥六号"完成了什么壮举？', opts: ['从月球背面采样返回', '载人登月', '在月球种菜', '环绕太阳'], a: 0, tip: '2024年嫦娥六号首次从月球背面带回土壤样本，全世界第一次！' },
  { q: 'SpaceX 的火箭最特别的本领是？', opts: ['可以回收再利用', '永远不落地', '用水做燃料', '能飞出银河系'], a: 0, tip: '猎鹰火箭发射后能自己飞回来竖着降落，重复使用大大降低了成本。' },
  { q: '风力发电机的大风车转动时，是把什么变成电？', opts: ['风的动能', '声音', '热量', '光'], a: 0, tip: '风吹动叶片→带动发电机旋转→产生电能。能量在不断转化。' },
  { q: '为什么电池不能随便扔进普通垃圾桶？', opts: ['里面的重金属会污染土壤和水', '会爆炸吓人', '太重了', '捡垃圾的人不喜欢'], a: 0, tip: '一节电池能污染一大片土地，要投进有害垃圾/电池回收箱。' },
  { q: '人脸识别解锁手机，用到的是哪类技术？', opts: ['计算机视觉', '天气预报', '3D打印', '风力发电'], a: 0, tip: '计算机视觉让机器"看懂"图像：人脸解锁、自动驾驶识别行人都靠它。' },
  { q: '光合作用中，植物吸收二氧化碳，放出什么？', opts: ['氧气', '氮气', '烟', '水蒸气'], a: 0, tip: '植物是地球的"制氧工厂"，所以种树能对抗全球变暖。' }
];
EXT2.science.g5 = [
  { q: '自动驾驶汽车判断红绿灯，主要靠什么？', opts: ['摄像头+AI识别', '司机偷偷看', '和红绿灯打电话', '闻气味'], a: 0, tip: '摄像头拍下画面，AI在几十毫秒内识别出红灯绿灯并做出决策。' },
  { q: '韦伯太空望远镜(JWST)为什么放在太空里而不是地面上？', opts: ['避开大气层干扰，看得更远更清', '地面没地方放', '太空里不用付电费', '为了离月亮近'], a: 0, tip: '大气会扭曲和吸收星光。韦伯在150万公里外，能看到宇宙最早期的星系。' },
  { q: '锂电池反复充放电后会怎样？', opts: ['容量慢慢变小', '越用越大', '永远不变', '变成汽油'], a: 0, tip: '电池会老化，所以科学家在研究固态电池、钠电池等更耐用的新电池。' },
  { q: '"码"住信息的二维码，本质上是什么？', opts: ['黑白格子编成的数据', '随机涂鸦', '一幅画', '密码锁'], a: 0, tip: '二维码用黑白模块表示0和1，还有纠错设计——缺个角也能扫出来。' },
  { q: '基因(gene)决定了生物的什么？', opts: ['遗传特征，比如瞳孔颜色', '今天的心情', '考试分数', '朋友数量'], a: 0, tip: '基因是生命的说明书。杂交水稻就是利用基因规律培育的高产品种。' },
  { q: '5G 相比 4G 最大的进步是？', opts: ['更快、延迟更低、连接更多设备', '手机变便宜', '不用电', '信号变成五格'], a: 0, tip: '5G不只让下载快，还让自动驾驶、远程手术这类"零延迟"应用成为可能。' },
  { q: '声音在下面哪种环境中不能传播？', opts: ['真空', '水里', '钢铁里', '空气里'], a: 0, tip: '声音靠介质振动传播，太空是真空，所以宇航员靠无线电通话。' },
  { q: '南极冰川加速融化，最直接的后果是？', opts: ['海平面上升', '沙漠变绿洲', '火山爆发', '地球变方'], a: 0, tip: '冰川融水流入海洋，一些岛国和沿海城市正面临被淹没的风险。' }
];
EXT2.science.g6 = [
  { q: 'AI 生成的图片和文章越来越逼真，我们应该？', opts: ['学会辨别，重要信息多方核实', '完全相信AI', '禁止使用电脑', '不用思考了'], a: 0, tip: 'AI是强大工具但会"一本正经地胡说"。人类的批判性思维更重要了。' },
  { q: '可控核聚变被称为"人造太阳"，因为它模仿了？', opts: ['太阳发光发热的原理', '太阳的形状', '太阳的颜色', '日出日落'], a: 0, tip: '聚变=轻原子核合并释放巨大能量，燃料来自海水，几乎无污染——未来终极能源。' },
  { q: '量子计算机和普通电脑的本质区别是？', opts: ['利用量子叠加，可同时处理海量可能性', '屏幕更大', '颜色不同', '需要用煤'], a: 0, tip: '普通比特非0即1，量子比特可以"既0又1"，某些难题快亿万倍。' },
  { q: '脑机接口(BCI)技术目前最有意义的应用是？', opts: ['帮助瘫痪病人用意念控制设备', '让人不用上学', '控制别人思想', '玩游戏作弊'], a: 0, tip: 'Neuralink等公司已让瘫痪者用"想"来移动光标、打字，科技最美的样子是助人。' },
  { q: 'mRNA 疫苗的工作原理是？', opts: ['教身体细胞识别病毒特征，提前演练防御', '直接杀死所有细菌', '换掉人的血液', '让人不再感冒'], a: 0, tip: 'mRNA像一张"通缉令"，免疫系统看过后就认识病毒了。新冠疫苗就用了这技术。' },
  { q: '碳中和(carbon neutral)的意思是？', opts: ['排放的碳和吸收的碳互相抵消', '不再使用任何碳', '把碳都埋进土里', '禁止呼吸'], a: 0, tip: '减排+植树+碳捕捉，让净排放为零。中国承诺2060年前实现碳中和。' },
  { q: '为什么火星是人类移民的首选候选星球？', opts: ['有固体表面、有水冰、昼夜温差可接受', '离地球最近', '上面有城市', '空气和地球一样'], a: 0, tip: '火星一天24.6小时、两极有水冰。但大气稀薄，改造它需要几代人的努力。' },
  { q: '区块链最核心的特点是？', opts: ['记录公开透明、很难篡改', '速度最快', '免费上网', '自动赚钱'], a: 0, tip: '像一本所有人共同记账的账本，改一页需要改所有人的账本——所以可信。' }
];

/* ---- 语文：想象力与语感鉴赏 ---- */
EXT2.chinese.g3 = [
  { q: '"月亮像一只小船挂在夜空。"这句话把月亮比作什么？', opts: ['小船', '香蕉', '灯笼', '镜子'], a: 0, tip: '比喻要抓相似点：弯弯的月亮和小船形状很像。你还能把月亮比成什么？' },
  { q: '哪句话让"风"显得更调皮可爱？', opts: ['风把树叶挠得咯咯笑', '风吹动了树叶', '有风', '树叶动了'], a: 0, tip: '拟人：把风当成会"挠痒痒"的小孩，句子一下子活了。' },
  { q: '"小溪唱着歌跑下山坡。"这句用了什么方法？', opts: ['拟人', '打电话', '列数字', '问问题'], a: 0, tip: '小溪会"唱歌""跑"，把它当人来写，这就是拟人。' },
  { q: '形容雪下得大，哪个说法最有画面感？', opts: ['鹅毛般的大雪漫天飞舞', '雪下得很大', '下雪了', '雪很多'], a: 0, tip: '"鹅毛般"让人一下子"看见"了雪片的大和轻。好句子会画画。' },
  { q: '一（　）彩虹，括号里填哪个量词最合适？', opts: ['道', '只', '头', '朵'], a: 0, tip: '彩虹弯弯长长，用"道"。量词用得准，画面就准。' },
  { q: '"教室里静得连针掉在地上都听得见。"这句话在强调？', opts: ['教室非常安静', '有人扔针', '地板很硬', '同学耳朵好'], a: 0, tip: '夸张：用"听见针落地"放大"静"的感觉，比直接说"很安静"有力多了。' },
  { q: '下面哪个词最适合形容"春天的柳树"？', opts: ['婀娜多姿', '硬邦邦', '冷冰冰', '气呼呼'], a: 0, tip: '柳枝随风摆动像跳舞的姑娘，"婀娜多姿"最贴切。' },
  { q: '"太阳公公害羞地躲进了云朵里。"说的是什么天气变化？', opts: ['太阳被云遮住了', '太阳落山了', '下雨了', '起雾了'], a: 0, tip: '拟人化的表达：太阳"害羞躲起来"=云把太阳遮住了。' }
];
EXT2.chinese.g4 = [
  { q: '"飞流直下三千尺，疑是银河落九天"写的是什么景色？', opts: ['瀑布', '大雨', '流星', '河流'], a: 0, tip: '李白《望庐山瀑布》：把瀑布想象成从天上落下来的银河，想象力封神！' },
  { q: '哪句话把"时间过得快"写得最生动？', opts: ['时间像小马车，哒哒哒地跑远了', '时间过得很快', '一天又过去了', '现在很晚了'], a: 0, tip: '把抽象的时间变成看得见、听得见的马车，这就是想象力的魔法。' },
  { q: '"他的脸红得像熟透的苹果。"这样写的好处是？', opts: ['让"脸红"变得看得见、更形象', '说明他爱吃苹果', '说明苹果贵', '句子更长'], a: 0, tip: '比喻的作用：把不熟悉的感受，用熟悉的事物"翻译"出来。' },
  { q: '描写人物"着急"，哪个最传神？', opts: ['他急得像热锅上的蚂蚁团团转', '他很着急', '他有点急', '他说他急了'], a: 0, tip: '"热锅上的蚂蚁"有动作、有画面、有温度，读者跟着一起急。' },
  { q: '"春风又绿江南岸"中，哪个字用得最妙？', opts: ['绿', '又', '江', '岸'], a: 0, tip: '王安石反复推敲选了"绿"字——春风一吹，两岸"绿"了起来，颜色动了！' },
  { q: '写作文时"总分总"结构指的是？', opts: ['先总说、再分述、最后总结', '写三遍一样的话', '总是分开写', '随便写'], a: 0, tip: '像汉堡包：上面包(开头点题)+中间肉(具体展开)+下面包(结尾呼应)。' },
  { q: '"大漠孤烟直，长河落日圆"这幅画面给人的感觉是？', opts: ['辽阔壮美', '拥挤热闹', '阴暗可怕', '小巧精致'], a: 0, tip: '王维用"直"和"圆"两个简单的字，画出了沙漠最辽阔的一幕。诗就是画。' },
  { q: '想把"妈妈的手"写感人，最好的办法是？', opts: ['写具体的事：那双手为你做过什么', '只说"妈妈的手很好"', '写手的尺寸', '抄别人的作文'], a: 0, tip: '细节是文章的生命：洗碗时的水泡、缝衣服的针脚，具体才动人。' }
];
EXT2.chinese.g5 = [
  { q: '"落红不是无情物，化作春泥更护花"表达了什么？', opts: ['奉献精神：凋谢也要滋养新生命', '花瓣的颜色', '春天来了', '不喜欢花'], a: 0, tip: '龚自珍：飘落的花不是终点，而是新一轮生长的开始。' },
  { q: '"世界上最后一个人独自坐在房间里，这时响起了敲门声。"这个开头妙在？', opts: ['制造悬念，让人想不通又想知道', '句子很长', '写了房间', '有人敲门很正常'], a: 0, tip: '这是著名的"最短科幻小说"：矛盾产生悬念，悬念让人往下读。' },
  { q: '同样写离别，"挥手"与"挥挥衣袖，不带走一片云彩"，后者好在？', opts: ['轻盈洒脱的画面感和韵味', '字数更多', '有云彩', '更好背'], a: 0, tip: '徐志摩《再别康桥》：好的表达在"事实"之外传递了"情绪"。' },
  { q: '"横看成岭侧成峰，远近高低各不同"告诉我们什么道理？', opts: ['看问题的角度不同，结论就不同', '庐山很高', '爬山很累', '要多拍照'], a: 0, tip: '苏轼把哲理藏进风景：换个角度，世界就不一样。诗可以有思想。' },
  { q: '把"我很孤独"写得更有感染力的是？', opts: ['整个教室的笑声都很热闹，只是没有一句是对我说的', '我真的很孤独', '我一个人', '没人理我'], a: 0, tip: '高手不直接说情绪，而是让画面替自己说话——"反衬"的力量。' },
  { q: '科幻作家刘慈欣《三体》最了不起的地方是？', opts: ['用想象力探索宇宙和人类命运', '页数很多', '有外星人就行', '名字好听'], a: 0, tip: '想象力是科幻的翅膀，《三体》让全世界读者仰望同一片星空。' }
];
EXT2.chinese.g6 = [
  { q: '"黑夜给了我黑色的眼睛，我却用它寻找光明"妙在哪里？', opts: ['把"黑"翻转成希望，矛盾中见力量', '押韵', '写了眼睛', '句子短'], a: 0, tip: '顾城的诗：同一个"黑"字，从困境变成寻找光明的工具，翻转即诗意。' },
  { q: '写议论文时，"观点"和"论据"的关系像？', opts: ['屋顶和柱子：论据支撑观点', '左手和右手', '完全没关系', '谁长谁重要'], a: 0, tip: '观点是你要说服别人的话，论据是撑住它的事实和道理，缺一不可。' },
  { q: '"此时无声胜有声"常用来形容？', opts: ['沉默比语言更有力量的时刻', '声音太小', '设备坏了', '不想说话'], a: 0, tip: '白居易《琵琶行》：音乐停顿处，情感反而最浓。留白也是表达。' },
  { q: '好的故事结尾"出人意料，又在情理之中"，意思是？', opts: ['结局想不到，回头看又处处有伏笔', '结局随便写', '一定要大团圆', '越奇怪越好'], a: 0, tip: '欧·亨利式结尾：惊喜不是瞎编，前文早就悄悄埋好了种子。' },
  { q: '"腹有诗书气自华"是说？', opts: ['读书多的人由内而外有气质', '肚子大有气质', '书要放肚子上', '诗人都好看'], a: 0, tip: '苏轼：读过的书会变成你的谈吐、眼界和思考方式。' },
  { q: '鲁迅"横眉冷对千夫指，俯首甘为孺子牛"表现的是？', opts: ['对敌人硬气、对人民温柔的两面担当', '喜欢牛', '经常皱眉', '怕被指责'], a: 0, tip: '一硬一软的强烈对比，十四个字立起一个人格。' }
];

/* ==================== 3. 语文创作题 prompts ==================== */
window.CREATIVE_PROMPTS = [
  { title: '如果我会飞', starter: '早上醒来，我发现自己长出了一对翅膀……', hint: '你会飞去哪里？看到什么？遇到谁？' },
  { title: '会说话的书包', starter: '写作业的时候，书包突然开口说："小主人，我有一个秘密……"', hint: '书包的秘密是什么？' },
  { title: '我的城市我做主', starter: '如果我是市长，我最想为城市建造的东西是……', hint: '结合你在游戏里建的城市想一想！' },
  { title: '月球一日游', starter: '宇宙飞船降落在月球上，舱门缓缓打开……', hint: '月球上是什么样子？你会做什么？' },
  { title: '神奇的一粒种子', starter: '我把一粒奇怪的种子埋进花盆，第二天早上……', hint: '种子长出了什么？和普通植物有什么不同？' },
  { title: '和恐龙做朋友', starter: '公园的湖边，我遇到了一只迷路的小恐龙……', hint: '它为什么出现在这里？你们做了什么？' },
  { title: '爸爸妈妈变小了', starter: '一觉醒来，爸爸妈妈变得只有铅笔那么高……', hint: '这一天你要怎么照顾他们？' },
  { title: '雨点的旅行', starter: '我是一滴小雨点，从云朵上跳下来，落在了……', hint: '用雨点的眼睛看世界。' },
  { title: '机器人同桌', starter: '开学第一天，我的新同桌居然是个机器人……', hint: '它擅长什么？闹过什么笑话？' },
  { title: '如果动物开运动会', starter: '森林运动会开幕了！第一个项目是……', hint: '谁跑得快？谁闹了笑话？谁得了冠军？' },
  { title: '二十年后的我', starter: '二十年后的一天早晨，我推开办公室的门……', hint: '你在做什么工作？世界变成什么样了？' },
  { title: '一扇神秘的门', starter: '楼梯拐角出现了一扇从没见过的小门，我轻轻推开它……', hint: '门后面是什么世界？' },
  { title: '我最珍贵的宝贝', starter: '在我的抽屉深处，藏着一样最珍贵的宝贝……', hint: '它为什么珍贵？背后有什么故事？' },
  { title: '假如记忆可以下载', starter: '科学家发明了记忆下载器，我第一个想下载的本领是……', hint: '有了它生活会怎样？会有麻烦吗？' },
  { title: '城市的夜晚', starter: '夜深了，城市里的路灯悄悄聊起天来……', hint: '路灯们看到了什么白天没有的故事？' },
  { title: '我设计的新发明', starter: '我要发明一样让世界更美好的东西，它叫……', hint: '它长什么样？怎么用？帮助谁？' }
];

/* ==================== 4. 每日英语跟读短文（牛津树风格） ==================== */
window.READ_ALOUD = [
  {
    title: 'The Little Dog',
    text: "I have a little dog. His name is Max. He has soft brown fur, a black nose, and a tail that never stops wagging. Every morning, Max waits by my bed. When I open my eyes, he jumps up and licks my face. That is how my day begins.\n\nAfter school, we go to the park together. Max loves the park more than any place in the world. He runs after the ball, digs little holes under the big oak tree, and says hello to every dog he meets. Sometimes he runs so fast that his ears fly up like two small wings. All the children laugh when they see him.\n\nOne day, Max found a lost glove on the grass. He picked it up gently and carried it all the way to a little girl who was crying by the gate. It was her glove! She hugged Max and said he was a hero. Max wagged his tail so hard that his whole body shook.\n\nAt night, Max sleeps in a basket next to my bed. Before I turn off the light, I always tell him about my day, and he listens with one ear up. Mum says dogs cannot understand words, but I do not believe that. Max always knows when I am happy, and he always knows when I am sad. He is not just a pet. He is my best friend, and I think I am his best friend too.",
    cn: '我有一只叫Max的小狗，棕色软毛、黑鼻子、尾巴摇个不停。每天早上它在床边等我醒来。放学后我们一起去公园，它追球、刨土、和别的狗打招呼，跑快时耳朵像小翅膀一样飞起来。有一天它捡到一只手套，叼给了在门口哭的小女孩——那正是她丢的！晚上它睡在我床边的篮子里，听我讲一天的事。妈妈说狗听不懂话，但我不信：Max总知道我什么时候开心、什么时候难过。它不只是宠物，它是我最好的朋友。'
  },
  {
    title: 'A Rainy Day',
    text: "When I woke up on Saturday, the sky was grey and heavy. Big drops of rain tapped on my window like tiny fingers. I wanted to ride my bike, but Mum shook her head. 'Not today,' she said. 'Today the rain is the boss.'\n\nAt first I was upset. I pressed my nose against the cold glass and watched the water run down in little rivers. The garden looked different in the rain. The flowers bent their heads, the leaves shone like green mirrors, and a small bird hid under the roof of the bird house.\n\nThen Dad had an idea. 'A rainy day is a reading day,' he said. He made hot chocolate with little marshmallows, and we built a cosy tent out of blankets in the living room. Inside our tent, I read my favourite book about pirates and a treasure island. The rain drummed on the roof, and it really did sound like music — soft, then loud, then soft again.\n\nIn the afternoon, the rain grew tired. It became a quiet drizzle, and then it stopped. The sun pushed through the clouds, and the whole street sparkled. Best of all, there was a rainbow over the school, with every colour I could name.\n\nI put on my boots and jumped in every puddle on our street. Mum laughed and took a photo. A rainy day is not a bad day at all. It is just a different kind of good day.",
    cn: '星期六醒来天灰蒙蒙的，大雨点敲着窗户。我想骑车，妈妈说"今天雨说了算"。起初我很沮丧，趴在窗上看雨水流成小河，花儿低头，叶子像绿镜子。爸爸说"雨天就是阅读天"，给我们冲了热可可，在客厅用毯子搭了帐篷。我在帐篷里读海盗寻宝的书，雨敲屋顶的声音真的像音乐。下午雨停了，太阳穿出云层，学校上空挂起彩虹。我穿上雨靴跳遍了街上每个水坑。雨天根本不是坏日子，只是另一种好日子。'
  },
  {
    title: 'My Family Dinner',
    text: "Friday night is family dinner night at our house, and it is my favourite night of the week. Tonight, Dad is the chef. He puts on his funny apron with a picture of a dancing tomato, and he starts to cook his famous noodles.\n\nThe kitchen becomes the busiest place in the world. Dad chops the vegetables — tap, tap, tap. The pan hisses when the onions jump in. Soon the smell of garlic and ginger fills the whole house, and my tummy starts to growl like a small bear.\n\nEveryone in the family has a job. Mum makes a big colourful salad with tomatoes, cucumbers and sweet corn. Grandma stirs the soup slowly and tastes it with a little spoon. My job is to set the table. I fold the napkins into triangles and put the chopsticks in a straight line. Grandpa's job is the easiest one: he tells jokes and keeps everyone laughing.\n\nWhen everything is ready, we sit down together and say thank you for the food. Dad's noodles are soft and a little spicy. Grandma's soup is warm and sweet. We talk about our week — my spelling test, Dad's new project, and the little bird that Grandma saw in the garden.\n\nAfter dinner, nobody hurries away. We share a plate of orange slices and play a card game. Mum says the food is only half of the dinner. The other half is being together, and I think she is right.",
    cn: '周五晚是我家的家庭晚餐夜，也是我一周最爱的夜晚。今晚爸爸掌勺，穿上印着跳舞番茄的围裙做他的招牌面条。厨房成了世界上最忙的地方：切菜声、油锅声，蒜姜香味飘满屋子，我的肚子饿得像小熊叫。每个人都有分工：妈妈拌彩色沙拉，奶奶慢慢搅汤，我摆桌子叠餐巾，爷爷负责讲笑话。开饭时我们一起感谢食物，聊各自的一周。饭后没人急着走，大家分橙子、玩纸牌。妈妈说食物只是晚餐的一半，另一半是相聚——我觉得她说得对。'
  },
  {
    title: 'The Magic Kite',
    text: "Tom found the old kite in Grandpa's attic, under a box of dusty books. It was shaped like a golden bird, with long red ribbons for a tail. 'Be careful with it,' Grandpa said with a wink. 'That kite is not an ordinary kite.'\n\nOn a windy afternoon, Tom took the kite to the top of Green Hill. The moment he let go of it, the kite shot into the sky like it had been waiting for years. It flew higher than the trees, higher than the church tower, higher than any bird. The string hummed in Tom's hands like a guitar.\n\nThen something amazing happened. The kite touched a soft white cloud, and the cloud... smiled. It really did! Two dimples appeared, and the cloud puffed itself into the shape of a friendly face. The kite danced around it, drawing big loops and hearts in the blue sky.\n\nOther clouds drifted closer to watch. One was shaped like a rabbit, one like a ship, and one like a giant slice of bread. The kite played with them all afternoon, and Tom laughed until his cheeks hurt.\n\nWhen the sun began to set, the kite floated gently back down and landed at Tom's feet, like a bird coming home to its nest. Its ribbons were warm, and they smelled like rain and sunshine.\n\n'Did you have a good flight?' Grandpa asked at dinner. Tom just smiled. Some secrets are better kept between a boy and his magic kite.",
    cn: 'Tom在爷爷的阁楼里找到一只旧风筝，金鸟形状、红丝带尾巴。爷爷眨眨眼说"它可不是普通风筝"。刮风的下午，Tom在绿山顶放飞它——风筝像等了多年一样冲上天空，飞得比树、比教堂塔、比任何鸟都高。神奇的事发生了：风筝碰到一朵白云，白云竟然笑了，鼓成一张友好的脸！别的云也飘来围观：兔子云、帆船云、面包云。风筝和它们玩了一下午。日落时分，风筝轻轻落回Tom脚边，丝带温温的，闻起来像雨和阳光。晚饭时爷爷问"飞得开心吗？"Tom只是笑——有些秘密，属于男孩和他的魔法风筝。'
  },
  {
    title: 'At the Zoo',
    text: "On Sunday, our whole family went to the city zoo. I had been waiting for this day all week, and I even made a list of the animals I wanted to see. The gate looked like a giant elephant's head, and I knew we were going to have a wonderful day.\n\nFirst, we visited the monkey house. The monkeys were the funniest animals in the zoo. A big one swung from rope to rope, a small one rode on its mother's back, and a naughty one tried to grab a boy's yellow hat through the fence! The zookeeper told us that monkeys use their tails like an extra hand.\n\nNext came my favourite part — the elephants. An enormous elephant walked slowly to the pool, filled its long trunk with water, and sprayed it high into the air like a fountain. The water made a little rainbow, and everybody clapped. A baby elephant tried to copy its mother, but it only made a tiny splash. It was so cute that I wanted to take it home.\n\nWe also saw striped zebras eating grass, a tall giraffe reaching for the highest leaves, and a lazy panda sleeping with a bamboo stick still in its paw. At the penguin pool, the penguins waddled like little men in black and white suits, then dived into the water like arrows.\n\nOn the way home, I fell asleep in the car, dreaming of monkeys and rainbows. What a funny, happy day it was!",
    cn: '星期天全家去动物园，我期待了一整周，还列了想看的动物清单。先看猴子馆：大猴子荡绳子，小猴子骑在妈妈背上，调皮的那只还想隔着栏杆抓小男孩的黄帽子！饲养员说猴子的尾巴像第三只手。接着是我最爱的大象：大象用长鼻子吸水，喷向空中像喷泉，水花映出小彩虹，大家都鼓掌。小象学妈妈却只溅起一点水花，可爱极了。我们还看了斑马、伸脖子够树叶的长颈鹿、抱着竹子睡觉的熊猫，还有像穿黑白西装的小人一样摇摆走路的企鹅。回家路上我在车里睡着了，梦里全是猴子和彩虹。多开心的一天！'
  },
  {
    title: 'My New Bike',
    text: "For my birthday, I got the best present in the world — a brand new bike. It is bright red, with a silver bell and a little basket in the front. When I saw it standing in the garden with a big blue bow, I could not believe my eyes.\n\nAt first, riding was not easy. The bike wobbled left and right like a jelly, and I fell onto the grass twice. My knees were green, and my heart was beating fast. I wanted to give up. But Dad held the back of the seat and said, 'Look ahead, not down. I am right here behind you.'\n\nSo I looked ahead and pedalled. Round and round the garden we went, past the roses, past the vegetable patch, past Mum waving from the kitchen window. Then, on the fifth lap, I heard Dad's voice — but it came from far away. I turned my head. He was standing at the other end of the garden! I was riding all by myself!\n\n'You did it!' Dad shouted, and he ran after me, laughing. I rang my silver bell — ring, ring! — so the whole street could hear it. Even our cat looked up from the fence to watch me fly past.\n\nNow I ride my bike every day after homework. Next month, Dad says we can ride to the river together, just the two of us, with sandwiches in my little basket. He calls me a super rider. I think a super rider is just a kid who did not give up.",
    cn: '生日那天我收到了世界上最棒的礼物——崭新的红色自行车，银铃铛、前面还有小篮子。起初学骑并不容易，车子左摇右晃像果冻，我摔进草地两次，膝盖都绿了，差点想放弃。爸爸扶着车座说："往前看，别往下看，我就在你后面。"我看着前方蹬啊蹬，绕花园一圈又一圈。第五圈时，爸爸的声音突然从很远处传来——他站在花园另一头！我在独自骑车！"你做到了！"爸爸大喊着追过来。我把银铃按得叮叮响，连猫都从墙头抬起来看。现在我每天写完作业就骑车。爸爸叫我超级骑手。我觉得超级骑手就是不放弃的孩子。'
  },
  {
    title: 'The Lost Cat',
    text: "One cold evening in November, we found a little cat sitting by our front door. She was grey with white socks on her paws, and she was shivering. Her fur was wet from the rain, and her meow was so small that we almost did not hear it.\n\n'She looks hungry,' said Mum. We brought a saucer of warm milk and a piece of chicken. The little cat ate everything, then looked up at us with big green eyes, as if to say thank you.\n\nDad said she might belong to someone, so we made posters with her photo and put them on the lamp posts in our street. 'FOUND: small grey cat with white socks.' For three days, nobody called. The cat stayed in our garage in a box with an old soft blanket. Every morning I checked on her before school, and every afternoon she waited for me by the gate.\n\nOn the fourth day, the phone finally rang. But it was not someone looking for a cat. It was our neighbour, Mrs Green. 'That little cat has been living behind the supermarket for months,' she said. 'She has no home at all.'\n\nMum and Dad looked at each other for a long moment. Then Dad smiled and said the words I was hoping for: 'Well, she has a home now.'\n\nWe named her Socks. Now she sleeps at the end of my bed, purring like a small warm engine. Sometimes the best friends are the ones who find you.",
    cn: '十一月一个寒冷的傍晚，我们在家门口发现一只小灰猫，爪子像穿了白袜子，浑身被雨淋湿，喵喵声小得几乎听不见。妈妈说它饿了，我们端来温牛奶和鸡肉，它吃完用绿眼睛看着我们，好像在道谢。爸爸说它可能有主人，我们贴了寻主启事，三天没人打电话。小猫住在车库的纸箱里，每天放学都在门口等我。第四天电话响了——是邻居Green太太："那只猫在超市后面流浪好几个月了，根本没有家。"爸妈对视良久，爸爸笑着说出我最期待的话："那它现在有家了。"我们叫它Socks。现在它睡在我床尾，呼噜声像温暖的小马达。有时候，最好的朋友是自己找上门来的。'
  },
  {
    title: 'Snow Day',
    text: "When I pulled open the curtains that morning, I shouted so loudly that the whole house woke up. 'SNOW!' During the night, the sky had quietly emptied itself, and now everything — the road, the cars, the trees, the roofs — was covered in a thick white blanket. The world looked brand new and very, very quiet.\n\nSchool was closed, so my sister and I put on our warmest coats, two scarves each, and our woolly hats. Outside, the snow crunched under our boots like biscuits. Our breath made little clouds in the freezing air.\n\nFirst, we made snow angels. Then we had a snowball fight with the twins from next door — my sister throws surprisingly well, and I got snow right down my neck! It was so cold that we screamed and laughed at the same time.\n\nOur biggest project was the snowman. We rolled a small snowball across the garden, and it grew bigger and bigger, like magic. The bottom ball was as tall as my little sister. We gave the snowman two stone eyes, a carrot nose, and Dad's old green scarf. My sister named him Mr Frosty.\n\nIn the evening, Mum made hot soup, and we watched the garden turn blue in the winter light. Mr Frosty stood there proudly, guarding our house.\n\n'Will he still be here tomorrow?' my sister asked.\n\n'Maybe,' I said. 'But even if he melts, we will remember him.' Snow days do not last long. That is exactly what makes them special.",
    cn: '早上拉开窗帘我大喊一声"下雪啦！"整晚的雪把道路、汽车、树和屋顶盖上厚厚的白毯子，世界安静得像全新的。学校停课，我和妹妹裹上最厚的外套出门。雪在靴子下咯吱作响，呼出的气变成小云朵。我们先躺出雪天使，又和隔壁双胞胎打雪仗——雪灌进我脖子里，我们又叫又笑。最大的工程是堆雪人：雪球越滚越大，像魔法一样。我们给雪人石头眼睛、胡萝卜鼻子，还围上爸爸的旧绿围巾，妹妹给它取名Frosty先生。晚上喝着妈妈煮的热汤，看Frosty先生骄傲地守着院子。妹妹问："它明天还在吗？""也许吧，"我说，"就算融化了，我们也会记得它。"雪天不长久——这正是它特别的原因。'
  },
  {
    title: 'The Brave Ant',
    text: "In the corner of the playground, under the old apple tree, there lived a colony of ants. The smallest of them all was a little worker ant named Nina. Her legs were thin and her body was tiny, but everyone in the colony knew one thing about Nina: she never, ever gave up.\n\nOne autumn morning, Nina found a treasure — a huge crumb of a chocolate biscuit, dropped by a child at break time. It smelled wonderful. It was also five times bigger than Nina herself.\n\n'Leave it,' said the other ants. 'It is too heavy. Winter is coming, and we have no time.' But Nina thought about the long cold months ahead, when the colony would be hungry. She gripped the crumb with her strong little jaws and began to pull.\n\nStep by step, she dragged it across the sand. She pulled it over a lolly stick that lay across her path like a fallen tree. She pulled it around a puddle that was, for an ant, as big as a lake. When the crumb got stuck between two stones, she pushed from behind instead of pulling from the front. Clever Nina!\n\nThe journey home took the whole day. When she finally reached the nest, the sun was setting, and her six legs were shaking with tiredness. The other ants came out and stared. Then, one by one, they began to cheer.\n\nThat winter, when snow covered the playground, the colony shared the chocolate crumb, and it kept them going through the coldest days. Nina became a hero — not because she was big or strong, but because she simply refused to stop.",
    cn: '操场角落的老苹果树下住着一群蚂蚁，最小的工蚁叫Nina。她腿细身子小，但整个蚁群都知道：Nina从不放弃。秋天的早晨，Nina发现宝贝——一大块巧克力饼干屑，比她自己大五倍。其他蚂蚁说"太重了，别管它"。但Nina想到漫长的寒冬，咬住饼干屑开始拖。一步一步：翻过像倒下的大树一样的棒棒糖棍，绕过对蚂蚁来说像湖一样大的水坑；卡在石缝里时，她改成从后面推——聪明的Nina！回家花了一整天，到蚁巢时太阳落山，六条腿累得发抖。蚂蚁们出来看着她，然后一个接一个欢呼起来。那年冬天大雪盖住操场，蚁群分享着巧克力屑挺过了最冷的日子。Nina成了英雄——不因为她大或强壮，而因为她就是不肯停下。'
  },
  {
    title: 'Space Dream',
    text: "Last night I had the most amazing dream, and I want to remember it forever.\n\nIn my dream, I was an astronaut. I wore a white space suit with my name on the chest, and I climbed into a tall silver rocket. A voice counted down: ten, nine, eight... My heart counted with it. Three, two, one — LIFT OFF! The rocket roared like a thousand lions, and the Earth fell away below me.\n\nOut of my little round window, I saw our planet floating in the dark like a blue and green marble. I could see the oceans, the clouds, and the long river near my town, thin as a piece of thread. 'Everything I know is down there,' I whispered. 'My school, my house, my dog Max.'\n\nThen came the best part: floating. Inside the spaceship, there is no up and no down. I did three slow somersaults in the air without touching anything! My pencil floated past my nose, and drops of orange juice turned into little golden planets around my head.\n\nI landed my spaceship on the Moon, right next to a giant crater. When I jumped, I flew six metres high and came down slowly like a feather. The moon dust under my boots kept the shape of my footprints perfectly. I waved at the Earth, and I like to think that somewhere down there, someone waved back.\n\nWhen I woke up, my room felt very still, and gravity felt very strong. But I was smiling. One day, the dream will not be a dream. I am going to study hard, keep my eyes on the stars, and become a real astronaut.",
    cn: '昨晚我做了最神奇的梦，想永远记住它。梦里我是宇航员，穿着印有名字的白色宇航服，登上银色火箭。倒计时十、九、八……三、二、一——升空！火箭吼声像一千头狮子，地球在脚下远去。透过小圆窗，地球像蓝绿色的弹珠漂在黑暗里，海洋、云朵、家乡的河都看得见，细得像一根线。最棒的是失重漂浮：舱里没有上下，我连翻三个空翻，铅笔从鼻尖飘过，橙汁变成头顶的小金星球。我把飞船降落在月球环形山旁，一跳就飞六米高，又像羽毛一样慢慢落下，月尘完美保留着我的脚印。我向地球挥手，愿意相信下面有人也在向我挥手。醒来时房间安静，重力好重，但我在笑。总有一天梦不再是梦——我要努力学习，盯着星星，成为真正的宇航员。'
  },
  {
    title: 'The School Garden',
    text: "Behind our classroom, there is a small square of ground that used to be full of weeds and old leaves. This term, our teacher Miss Lee had a wonderful idea. 'Class,' she said, 'we are going to turn this corner into a real garden.'\n\nOn the first day of spring, we all brought tools from home. We pulled out the weeds, turned the soft brown soil, and picked out the stones. It was hard work, and my hands got dirty right up to the elbows — but nobody complained, not even Lily, who usually hates getting dirty.\n\nEach group planted something different. My group planted tomato seeds. Another group planted carrots, and the third group planted sunflowers along the fence. We made little name signs from ice cream sticks, so every plant knew where it belonged.\n\nAfter that, we took turns watering the garden every single day. We watched and waited. For two whole weeks, nothing happened, and some of us started to worry. Then, one Monday morning, Ben shouted from the window: 'Come and look!' Tiny green shoots had pushed up through the soil overnight, standing in neat little rows like tiny soldiers.\n\nAll through spring, our plants grew taller and stronger. The sunflowers grew taller than Miss Lee! In June, we picked our first tomatoes — small, red, and warm from the sun. We shared them at lunch, and everyone agreed: food you grow yourself tastes a hundred times sweeter.\n\nNext year, the new class will take care of the garden. We are leaving them a notebook with everything we learned, and one important sentence on the first page: 'Be patient — good things grow slowly.'",
    cn: '教室后面有块长满杂草的空地，这学期Lee老师说要把它变成真正的花园。开春第一天，我们带工具除草、翻土、捡石头，手脏到手肘也没人抱怨——连最怕脏的Lily都没有。每组种的不一样：我们组种番茄，别的组种胡萝卜和向日葵，还用雪糕棍做了名字牌。之后我们每天轮流浇水，等了整整两周毫无动静，有人开始担心。周一早上Ben在窗边大喊"快来看！"嫩绿的新芽一夜之间钻出土壤，像小士兵一样排成整齐的行。整个春天植物越长越壮，向日葵长得比老师还高！六月我们摘下第一批番茄，午餐时分着吃，大家一致同意：自己种的食物甜一百倍。明年新班级会接手花园，我们留给他们一本笔记，第一页写着："要有耐心——好东西都长得慢。"'
  },
  {
    title: "Grandma's Cookies",
    text: "Every Saturday afternoon, I visit Grandma, and every Saturday her little kitchen turns into the best-smelling place on Earth. Grandma bakes cookies — honey and butter cookies, from a recipe that is older than Dad.\n\nThe recipe lives in a small brown notebook with a cracked cover. Grandma's own grandmother wrote it down long ago, in beautiful old handwriting. 'One day this notebook will be yours,' Grandma always says, 'but first, your hands must learn the secrets.'\n\nSo Grandma teaches me. We measure the flour and sift it like soft white snow. We beat the butter and sugar until they turn pale and fluffy. Grandma lets me crack the eggs — I only dropped one on the floor once! Then comes the golden honey, slow and shiny, and the kitchen starts to smell like a summer meadow.\n\nWhile the cookies bake, we sit by the oven and Grandma tells me stories about when she was small: how she walked to school through the snow, how she once hid a puppy in her school bag, and how her grandmother baked these same cookies during the hard winters, when a single cookie was the greatest treasure a child could hold.\n\nDing! The oven timer rings. The cookies come out golden and warm, with crisp edges and soft hearts. I eat one, then one more, and Grandma laughs and pours me a glass of cold milk. 'Slow down, little mouse,' she says.\n\nWe always pack some cookies in a tin for me to take home. But everyone in my family agrees: cookies taste best in Grandma's kitchen, still warm, with stories baked inside them.",
    cn: '每周六下午我去看奶奶，她的小厨房就变成世界上最香的地方——奶奶烤蜂蜜黄油饼干，配方比爸爸年纪还大。配方写在一本封皮开裂的棕色小本子里，是奶奶的奶奶用漂亮的旧字体写下的。"这本子总有一天是你的，"奶奶总说，"但你的手要先学会里面的秘密。"于是奶奶教我：筛面粉像下雪，打黄油和糖直到蓬松发白，她让我磕鸡蛋——我只摔过一个在地上！蜂蜜倒进去时，厨房闻起来像夏天的草地。饼干烤着的时候，我们坐在烤箱边听奶奶讲小时候的故事：雪地里走路上学、把小狗藏进书包、还有在艰难的寒冬里，一块饼干就是孩子最大的宝贝。叮！饼干出炉，金黄温热、边脆心软。我吃了一块又一块，奶奶笑着倒来凉牛奶："慢点吃，小老鼠。"回家时总会带上一铁盒，但全家都同意：饼干还是在奶奶厨房里最好吃——温热的，里面烤着故事。'
  },
  {
    title: 'The Windy Hill',
    text: "Behind our town there is a tall green hill that everyone calls the Windy Hill. On its top stands one crooked old tree, bent sideways by years and years of wind. Dad says the tree looks like an old man who forgot to stand up straight. On Sunday, Dad, my dog Rex and I decided to climb all the way up.\n\nThe path started gently, winding between blackberry bushes and big grey rocks. Rex ran ahead, then ran back to check on us, so he really climbed the hill three times. Halfway up, the wind found us. It hummed in the grass, whistled past my ears, and pushed against my chest like a big invisible hand.\n\n'Lean into it!' Dad laughed, and we walked bent forward like penguins. Near the top, a cheeky gust grabbed my red cap and tossed it into the air. 'My hat!' I shouted. The cap rolled and tumbled down the slope, hopping over rocks like a rabbit.\n\nBefore I could move, Rex shot after it like a brown arrow. He chased it, jumped, missed, chased again, and finally caught it mid-air with a proud snap of his jaws. He trotted back and dropped the cap at my feet, wagging his tail. 'Good boy, Rex!' I said, and gave him his favourite biscuit.\n\nAt the very top, the wind suddenly felt friendly. We sat under the crooked tree and ate our sandwiches. Below us lay the whole town — tiny houses, tiny cars, and our own street looking like a line on a map. On the way down, the wind pushed our backs gently, as if to say: come again soon.",
    cn: '镇子后面有座人人都叫它"风山"的绿色高山，山顶立着一棵被常年大风吹弯的老树，爸爸说它像忘了站直的老爷爷。星期天，爸爸、小狗Rex和我决定爬到山顶。山路起初平缓，绕过黑莓丛和大石头，Rex跑前跑后，等于爬了三遍山。半山腰风来了：在草里嗡嗡响，从耳边呼啸而过，像一只看不见的大手推着我的胸口。"迎着风往前倾！"爸爸笑着说，我们像企鹅一样弯腰前进。快到山顶时，一阵调皮的风抢走我的红帽子扔向空中，帽子沿着山坡翻滚跳跃，像只兔子。Rex像棕色的箭一样冲出去，追、跳、扑空、再追，终于凌空一口咬住，得意地跑回来把帽子放在我脚边。"好样的Rex！"我给了它最爱的饼干。山顶的风忽然变温柔了。我们坐在歪脖子树下吃三明治，整个小镇在脚下：小房子、小汽车，我们家的街道细得像地图上的一条线。下山时风轻轻推着我们的背，好像在说：快点再来。'
  },
  {
    title: 'Night Sky',
    text: "In summer, when the nights are warm, Dad and I take two folding chairs and a blanket up to the flat roof of our house. We call it our observatory. From up there, away from the kitchen lights, the night sky opens above us like an enormous dark ocean full of silver fish.\n\nAt first, when you look up, you see maybe ten stars. But here is the secret Dad taught me: you have to wait. Slowly, your eyes drink in the darkness, and more and more stars appear — a hundred, a thousand, until the sky is crowded with tiny twinkling lamps.\n\nDad knows the star pictures, and now I know some too. We always find the Big Dipper first; it looks like a giant saucepan hanging over the neighbour's chimney. From its edge, we draw an invisible line to the North Star, the faithful star that never moves. Sailors trusted it for thousands of years, and I like knowing it is always there, like a nightlight for the whole world.\n\nSome nights we see the Moon so clearly that its grey seas and craters look close enough to touch. Once, we even saw a shooting star — a quick silver scratch across the dark. It was gone in one second. Dad said, 'Make a wish!' I did, but I cannot tell you what it was, or it will not come true.\n\nLying under all those stars makes me feel small, but in a good way — like being one tiny, lucky part of something enormous and beautiful. When my eyes grow heavy, Dad carries the chairs and I carry the blanket, and the stars keep watch until morning.",
    cn: '夏天夜晚暖和的时候，我和爸爸带两把折叠椅和一条毯子上平屋顶——我们叫它"天文台"。远离厨房灯光，夜空像装满银鱼的巨大黑海洋在头顶展开。刚抬头也许只看见十颗星星，但爸爸教了我一个秘密：要等。眼睛慢慢喝进黑暗，星星越来越多——一百颗、一千颗，直到满天都是闪烁的小灯。爸爸认识星座，现在我也认识一些了。我们总先找北斗七星，它像挂在邻居烟囱上的大汤锅；顺着勺边画一条隐形的线就找到北极星——那颗永远不动的忠实星星，水手们信赖了它几千年。我喜欢知道它一直在那里，像全世界的小夜灯。有的夜晚月亮清楚得仿佛伸手就能摸到环形山。有一次我们还看见了流星——黑暗中一道银色的快速划痕，一秒就消失了。爸爸喊"许愿！"我许了，但不能告诉你，说出来就不灵了。躺在满天星光下让我觉得自己很小，但是一种很好的小——像是庞大而美丽的事物中幸运的一小部分。'
  },
  {
    title: 'The Busy Market',
    text: "On Saturday morning, Mum and I go to the street market, and it is my favourite errand of the whole week. You can hear the market before you can see it — a happy noise of voices, bells, and someone playing a guitar near the fountain.\n\nThe fruit stalls come first, like a rainbow laid out on tables. Red apples stacked in perfect pyramids, golden bananas, purple grapes with silver dust on their skins. Mr Papa, the fruit seller, always gives me a strawberry to taste. 'Quality control!' he says with a wink, and Mum laughs every time.\n\nDeeper inside, the market gets even busier. The fish man shouts his prices in a singing voice while ice sparkles around the silver fish. At the bakery corner, a man pulls warm loaves out of a little oven, and the smell of fresh bread wraps around you like a scarf. We always buy one loaf, and we always eat the crusty end of it before we get home. That is our secret rule.\n\nMy favourite stall belongs to old Mrs Chen, who sells honey and dried flowers. Her table smells like a whole summer packed into little glass jars. She calls me 'young man' and lets me taste honey on a tiny wooden spoon — lavender honey, orange honey, forest honey. They all taste like sunshine, only different kinds.\n\nI hold Mum's hand as we squeeze through the crowd, carrying our full bags. My nose is busy, my ears are busy, my eyes are busy. 'Same time next week?' Mum asks when we reach our street. I nod. Some places never get boring, and the busy market is one of them.",
    cn: '周六早上我和妈妈逛街市，这是我一周里最爱的差事。还没看见市场先听见它——人声、铃声、喷泉边有人弹吉他的快乐喧闹。水果摊像铺在桌上的彩虹：红苹果码成金字塔，金黄的香蕉，蒙着银霜的紫葡萄。卖水果的Papa先生总给我一颗草莓尝，眨眨眼说"质检！"妈妈每次都笑。市场深处更热闹：鱼贩用唱歌一样的调子喊价，碎冰围着银色的鱼闪闪发光；面包角的师傅从小烤炉里拉出热面包，香味像围巾一样裹住你。我们总买一条，而且总在到家前把脆脆的面包头吃掉——这是我们的秘密规矩。我最爱陈奶奶的摊位，她卖蜂蜜和干花，桌子闻起来像装进玻璃小罐的整个夏天。她叫我"小伙子"，用小木勺让我尝薰衣草蜜、橙花蜜、森林蜜——都是阳光的味道，只是不同种类的阳光。我牵着妈妈的手挤过人群，鼻子、耳朵、眼睛都忙个不停。"下周同一时间？"妈妈问。我点头。有些地方永远不会腻，热闹的街市就是其中之一。'
  }
];

/* ==================== 5. 合并进 QUESTION_BANK（全局去重） ==================== */
(function mergeBank() {
  const BANK = window.QUESTION_BANK = window.QUESTION_BANK || {};
  for (const subj in EXT2) {
    BANK[subj] = BANK[subj] || {};
    for (const g in EXT2[subj]) {
      BANK[subj][g] = (BANK[subj][g] || []).concat(EXT2[subj][g]);
    }
  }
  // 全库按题面去重（保留先出现的）
  const seen = new Set();
  for (const subj in BANK) {
    for (const g in BANK[subj]) {
      BANK[subj][g] = BANK[subj][g].filter(item => {
        if (seen.has(item.q)) return false;
        seen.add(item.q);
        return true;
      });
    }
  }
})();

})();
