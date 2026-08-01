/* ============================================================
 * 题目引擎 v2：四种题型
 *  - choice 选择题（题库+数学生成）
 *  - fill   填空题（数学计算/英语单词）
 *  - match  连线题（英语配对/数学配对/常识配对）
 *  - judge  判断题（对错题）
 * ============================================================ */
(function () {
  const R = (n) => Math.floor(Math.random() * n);
  const RR = (min, max) => min + R(max - min + 1);
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; };

  function mkChoice(q, answer, tip, distractGen) {
    const set = new Set([answer]);
    let guard = 0;
    while (set.size < 4 && guard++ < 60) {
      const d = distractGen();
      if (d !== answer && d >= 0) set.add(d);
    }
    const opts = shuffle([...set].map(String));
    return { type: 'choice', q, opts, a: opts.indexOf(String(answer)), tip };
  }

  /* ============ 数学：选择题生成器（按年级） ============ */
  const MathGen = {
    3: [
      () => { const a = RR(100, 999), b = RR(100, 999); return mkChoice(`${a} + ${b} = ?`, a + b, `列竖式相加：${a} + ${b} = ${a + b}，注意进位哦。`, () => a + b + (R(2) ? RR(1, 30) : -RR(1, 30))); },
      () => { let a = RR(300, 999), b = RR(100, 299); return mkChoice(`${a} - ${b} = ?`, a - b, `列竖式相减：${a} - ${b} = ${a - b}，注意退位哦。`, () => a - b + (R(2) ? RR(1, 30) : -RR(1, 30))); },
      () => { const a = RR(2, 9), b = RR(2, 9); return mkChoice(`${a} × ${b} = ?`, a * b, `背乘法口诀就能算出：${a} × ${b} = ${a * b}。`, () => a * b + (R(2) ? RR(1, 8) : -RR(1, 8))); },
      () => { const b = RR(2, 9), c = RR(2, 9), a = b * c; return mkChoice(`${a} ÷ ${b} = ?`, c, `想乘法：${b} × ${c} = ${a}，所以 ${a} ÷ ${b} = ${c}。`, () => c + (R(2) ? RR(1, 4) : -RR(1, 4))); },
      () => { const a = RR(11, 99), b = RR(2, 9); return mkChoice(`${a} × ${b} = ?`, a * b, `先算 ${Math.floor(a / 10) * 10} × ${b} = ${Math.floor(a / 10) * 10 * b}，再算 ${a % 10} × ${b} = ${(a % 10) * b}，相加得 ${a * b}。`, () => a * b + (R(2) ? RR(2, 40) : -RR(2, 40))); },
      () => { const p = RR(3, 9), n = RR(4, 12); return mkChoice(`一支铅笔${p}元，买${n}支需要多少元？`, p * n, `${p} × ${n} = ${p * n}（元）。单价 × 数量 = 总价。`, () => p * n + (R(2) ? RR(1, 15) : -RR(1, 15))); },
      () => { const total = RR(4, 9) * RR(4, 9), per = [...Array(9)].map((_, i) => i + 2).filter(x => total % x === 0)[0]; const ans = total / per; return mkChoice(`${total}个苹果平均分给${per}个小朋友，每人分几个？`, ans, `${total} ÷ ${per} = ${ans}（个）。平均分用除法。`, () => ans + (R(2) ? RR(1, 4) : -RR(1, 4))); },
      () => { const h = RR(1, 11), m = [10, 15, 20, 30, 40, 45][R(6)]; const total = h * 60 + m; return mkChoice(`${h}小时${m}分钟一共是多少分钟？`, total, `1小时=60分钟，${h}小时=${h * 60}分钟，再加${m}分钟等于${total}分钟。`, () => total + (R(2) ? RR(5, 30) : -RR(5, 30))); },
      () => { const len = RR(2, 9); return mkChoice(`一个正方形的边长是${len}厘米，它的周长是多少厘米？`, len * 4, `正方形周长 = 边长 × 4 = ${len} × 4 = ${len * 4}（厘米）。`, () => len * 4 + (R(2) ? RR(1, 8) : -RR(1, 8))); },
      () => { const L = RR(4, 12), W = RR(2, L - 1); return mkChoice(`长方形长${L}厘米、宽${W}厘米，周长是多少厘米？`, (L + W) * 2, `长方形周长 = (长+宽) × 2 = (${L}+${W}) × 2 = ${(L + W) * 2}（厘米）。`, () => (L + W) * 2 + (R(2) ? RR(2, 10) : -RR(2, 10))); },
      () => { const km = RR(2, 9); return mkChoice(`${km}千米等于多少米？`, km * 1000, `1千米 = 1000米，${km}千米 = ${km * 1000}米。`, () => km * (R(2) ? 100 : 1000) + (R(3) === 0 ? RR(1, 9) * 100 : 0)); },
      () => { const b = RR(3, 9), q = RR(3, 9), r = RR(1, b - 1); const a = b * q + r; return mkChoice(`${a} ÷ ${b} 的余数是几？`, r, `${a} ÷ ${b} = ${q} 余 ${r}。因为 ${b} × ${q} = ${b * q}，${a} - ${b * q} = ${r}。`, () => RR(0, b - 1)); }
    ],
    4: [
      () => { const a = RR(100, 999), b = RR(11, 99); return mkChoice(`${a} × ${b} = ?`, a * b, `列竖式计算：${a} × ${b} = ${a * b}。`, () => a * b + (R(2) ? RR(10, 200) : -RR(10, 200))); },
      () => { const b = RR(11, 89), q = RR(11, 89), a = b * q; return mkChoice(`${a} ÷ ${b} = ?`, q, `试商：${b} × ${q} = ${a}，所以商是 ${q}。`, () => q + (R(2) ? RR(1, 9) : -RR(1, 9))); },
      () => { const L = RR(5, 20), W = RR(3, L); return mkChoice(`长方形长${L}米、宽${W}米，面积是多少平方米？`, L * W, `面积 = 长 × 宽 = ${L} × ${W} = ${L * W}（平方米）。`, () => L * W + (R(2) ? RR(2, 20) : -RR(2, 20))); },
      () => { const deg = [30, 45, 60, 90, 120, 150][R(6)]; const ans = 180 - deg; return mkChoice(`三角形两个角的和是${deg}°，第三个角是多少度？`, ans, `三角形内角和180°：180 - ${deg} = ${ans}°。`, () => ans + (R(2) ? RR(5, 30) : -RR(5, 30))); }
    ],
    5: [
      () => { const a = RR(11, 99) / 10, b = RR(2, 9); const ans = Math.round(a * b * 10) / 10; return mkChoice(`${a} × ${b} = ?`, ans, `先算 ${a * 10} × ${b} = ${a * 10 * b}，再把小数点向左移一位得 ${ans}。`, () => Math.round((ans * 10 + (R(2) ? RR(1, 20) : -RR(1, 20)))) / 10); },
      () => { const x = RR(3, 20), b = RR(2, 30); return mkChoice(`方程 x + ${b} = ${x + b}，x = ?`, x, `两边同时减${b}：x = ${x + b} - ${b} = ${x}。`, () => x + (R(2) ? RR(1, 6) : -RR(1, 6))); },
      () => { const base = RR(4, 16), h = RR(3, 12); const ans = base * h / 2; return mkChoice(`三角形底${base}厘米、高${h}厘米，面积是多少平方厘米？`, ans, `三角形面积 = 底 × 高 ÷ 2 = ${base} × ${h} ÷ 2 = ${ans}。`, () => ans + (R(2) ? RR(2, 12) : -RR(2, 12))); },
      () => { const x = RR(2, 12), a = RR(2, 9); return mkChoice(`方程 ${a}x = ${a * x}，x = ?`, x, `两边同时除以${a}：x = ${a * x} ÷ ${a} = ${x}。`, () => x + (R(2) ? RR(1, 5) : -RR(1, 5))); }
    ],
    6: [
      () => { const r = RR(2, 10); const ans = Math.round(3.14 * r * r * 100) / 100; return mkChoice(`半径为${r}厘米的圆，面积是多少平方厘米？(π取3.14)`, ans, `圆面积 = πr² = 3.14 × ${r} × ${r} = ${ans}。`, () => Math.round(3.14 * (r + RR(1, 3)) * r * 100) / 100); },
      () => { const total = RR(2, 9) * 100, p = [10, 20, 25, 50][R(4)]; const ans = total * p / 100; return mkChoice(`${total}元的玩具打${p === 10 ? '九' : p === 20 ? '八' : p === 25 ? '七五' : '五'}折出售，便宜了多少元？`, ans, `便宜了 ${total} × ${p}% = ${ans}（元）。`, () => ans + (R(2) ? RR(5, 50) : -RR(5, 50))); }
    ]
  };
  for (let g = 7; g <= 12; g++) MathGen[g] = MathGen[6];

  /* ============ 数学：填空题生成器 ============ */
  const MathFillGen = {
    3: [
      () => { const a = RR(100, 999), b = RR(100, 899); return { type: 'fill', q: `${a} + ${b} = ____`, answer: String(a + b), tip: `列竖式相加：${a} + ${b} = ${a + b}`, inputMode: 'number' }; },
      () => { const a = RR(2, 9), b = RR(2, 9); return { type: 'fill', q: `${a} × ${b} = ____`, answer: String(a * b), tip: `乘法口诀：${a} × ${b} = ${a * b}`, inputMode: 'number' }; },
      () => { const b = RR(2, 9), c = RR(2, 9); return { type: 'fill', q: `${b * c} ÷ ${b} = ____`, answer: String(c), tip: `想乘法：${b} × ${c} = ${b * c}`, inputMode: 'number' }; },
      () => { const a = RR(2, 9), b = RR(2, 9); return { type: 'fill', q: `____ × ${a} = ${a * b}`, answer: String(b), tip: `${a * b} ÷ ${a} = ${b}，所以填 ${b}`, inputMode: 'number' }; },
      () => { const a = RR(300, 999), b = RR(100, a - 100); return { type: 'fill', q: `${a} - ${b} = ____`, answer: String(a - b), tip: `列竖式相减：${a} - ${b} = ${a - b}`, inputMode: 'number' }; },
      () => { const a = RR(20, 99), b = RR(20, 99); return { type: 'fill', q: `${a} + ____ = ${a + b}`, answer: String(b), tip: `${a + b} - ${a} = ${b}，所以填 ${b}`, inputMode: 'number' }; }
    ],
    4: [
      () => { const a = RR(100, 999), b = RR(11, 99); return { type: 'fill', q: `${a} × ${b} = ____`, answer: String(a * b), tip: `列竖式：${a} × ${b} = ${a * b}`, inputMode: 'number' }; },
      () => { const b = RR(11, 89), q2 = RR(11, 89); return { type: 'fill', q: `${b * q2} ÷ ${b} = ____`, answer: String(q2), tip: `${b} × ${q2} = ${b * q2}`, inputMode: 'number' }; }
    ],
    5: [
      () => { const x = RR(3, 30), b = RR(2, 40); return { type: 'fill', q: `解方程：x + ${b} = ${x + b}\nx = ____`, answer: String(x), tip: `两边同时减${b}：x = ${x}`, inputMode: 'number' }; },
      () => { const x = RR(2, 15), a = RR(2, 9); return { type: 'fill', q: `解方程：${a}x = ${a * x}\nx = ____`, answer: String(x), tip: `两边同时除以${a}：x = ${x}`, inputMode: 'number' }; }
    ],
    6: [
      () => { const r = RR(2, 10); return { type: 'fill', q: `半径${r}厘米的圆，周长是____厘米(π取3.14)`, answer: String(Math.round(2 * 3.14 * r * 100) / 100), tip: `周长 = 2πr = 2 × 3.14 × ${r} = ${Math.round(2 * 3.14 * r * 100) / 100}`, inputMode: 'decimal' }; }
    ]
  };
  for (let g = 7; g <= 12; g++) MathFillGen[g] = MathFillGen[6];

  /* ============ 数学：判断题生成器 ============ */
  const MathJudgeGen = (grade) => {
    const correct = R(2) === 0;
    const a = RR(2, 9), b = RR(2, 9);
    const real = a * b;
    const shown = correct ? real : real + (R(2) ? RR(1, 5) : -RR(1, 5));
    return {
      type: 'judge',
      q: `${a} × ${b} = ${shown}，对吗？`,
      answer: correct,
      tip: `${a} × ${b} = ${real}${correct ? '，等式正确！' : `，不是${shown}哦。`}`
    };
  };

  /* ============ 连线题生成 ============ */
  // 连线素材库
  const MATCH_POOLS = {
    english_word: {
      title: '把英语单词和中文意思连起来',
      pairs: [
        ['apple', '苹果'], ['dog', '小狗'], ['cat', '小猫'], ['book', '书'], ['sun', '太阳'],
        ['moon', '月亮'], ['water', '水'], ['fish', '鱼'], ['bird', '小鸟'], ['tree', '树'],
        ['red', '红色'], ['blue', '蓝色'], ['green', '绿色'], ['hand', '手'], ['head', '头'],
        ['milk', '牛奶'], ['cake', '蛋糕'], ['car', '汽车'], ['plane', '飞机'], ['train', '火车'],
        ['run', '跑'], ['jump', '跳'], ['eat', '吃'], ['sleep', '睡觉'], ['school', '学校'],
        ['teacher', '老师'], ['father', '爸爸'], ['mother', '妈妈'], ['happy', '开心的'], ['big', '大的']
      ]
    },
    math_calc: {
      title: '把算式和得数连起来',
      gen() {
        const used = new Set(); const pairs = [];
        let guard = 0;
        while (pairs.length < 4 && guard++ < 40) {
          const a = RR(2, 9), b = RR(2, 9);
          const v = a * b;
          if (used.has(v)) continue;
          used.add(v);
          pairs.push([`${a} × ${b}`, String(v)]);
        }
        return pairs;
      }
    },
    animal_home: {
      title: '把小动物和它的家连起来',
      pairs: [
        ['小鸟', '鸟巢'], ['蜜蜂', '蜂巢'], ['鱼儿', '小河'], ['兔子', '洞穴'],
        ['蜘蛛', '蛛网'], ['马儿', '马厩'], ['狗狗', '狗窝'], ['蚂蚁', '蚁穴']
      ]
    },
    country_capital: {
      title: '把国家和首都连起来',
      pairs: [
        ['中国', '北京'], ['日本', '东京'], ['法国', '巴黎'], ['英国', '伦敦'],
        ['美国', '华盛顿'], ['俄罗斯', '莫斯科'], ['意大利', '罗马'], ['韩国', '首尔']
      ]
    },
    idiom_animal: {
      title: '把成语和它缺少的动物连起来',
      pairs: [
        ['守株待（ ）', '兔'], ['画（ ）点睛', '龙'], ['亡（ ）补牢', '羊'], ['对（ ）弹琴', '牛'],
        ['（ ）假虎威', '狐'], ['井底之（ ）', '蛙'], ['闻（ ）起舞', '鸡'], ['万（ ）奔腾', '马']
      ]
    },
    science_use: {
      title: '把物品和它的用途连起来',
      pairs: [
        ['温度计', '测量温度'], ['指南针', '辨别方向'], ['放大镜', '观察细小物体'], ['尺子', '测量长度'],
        ['天平', '称量质量'], ['雨量器', '测量降水'], ['听诊器', '听心跳声'], ['望远镜', '看远处物体']
      ]
    },
    vehicle_place: {
      title: '把交通工具和它出发的地方连起来',
      pairs: [
        ['飞机', '机场'], ['火车', '火车站'], ['轮船', '港口'], ['公交车', '公交站'],
        ['地铁', '地铁站'], ['火箭', '发射台']
      ]
    }
  };

  function genMatch(subject, grade) {
    // 按科目选择合适的素材
    let poolKeys;
    if (subject === 'english') poolKeys = ['english_word'];
    else if (subject === 'math') poolKeys = ['math_calc'];
    else if (subject === 'science') poolKeys = ['science_use', 'animal_home'];
    else if (subject === 'chinese') poolKeys = ['idiom_animal'];
    else poolKeys = ['country_capital', 'vehicle_place', 'animal_home'];
    const pool = MATCH_POOLS[poolKeys[R(poolKeys.length)]];
    let pairs = pool.gen ? pool.gen() : shuffle(pool.pairs).slice(0, 4);
    return {
      type: 'match',
      q: pool.title,
      left: pairs.map(p => p[0]),
      right: shuffle(pairs.map(p => p[1])),
      answer: pairs.map(p => p[1]), // left[i] 对应 answer[i]
      tip: pairs.map(p => `${p[0]} → ${p[1]}`).join('，')
    };
  }

  /* ============ 英语填空 ============ */
  const ENGLISH_FILL = [
    { q: '苹果的英语是 a p p ____ e（填一个字母）', answer: 'l', tip: 'apple 苹果' },
    { q: '"猫"的英语是 c ____ t（填一个字母）', answer: 'a', tip: 'cat 猫' },
    { q: '"狗"的英语单词是____（三个字母）', answer: 'dog', tip: 'dog 狗' },
    { q: '"太阳"的英语单词是____（三个字母）', answer: 'sun', tip: 'sun 太阳' },
    { q: '"书"的英语是 b o ____ k（填一个字母）', answer: 'o', tip: 'book 书' },
    { q: '"红色"的英语单词是____（三个字母）', answer: 'red', tip: 'red 红色' },
    { q: '"大的"的英语单词是____（三个字母）', answer: 'big', tip: 'big 大的' },
    { q: '"跑"的英语单词是____（三个字母）', answer: 'run', tip: 'run 跑' }
  ];

  /* ============ 英语词汇生成器（基于 ENGLISH_VOCAB 分级词表） ============ */
  function vocabFor(grade) {
    const V = window.ENGLISH_VOCAB || {};
    const cur = V['g' + grade];
    if (cur && cur.length) return cur;
    for (let g = grade; g >= 3; g--) if (V['g' + g] && V['g' + g].length) return V['g' + g];
    return V.g3 || [];
  }

  function misspell(word) {
    const vowels = 'aeiou';
    const chars = word.split('');
    const mode = R(4);
    if (mode === 0 && word.length >= 4) {
      const i = RR(1, word.length - 2);
      [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
    } else if (mode === 1) {
      const idxs = chars.map((c, i) => vowels.includes(c) ? i : -1).filter(i => i >= 0);
      if (idxs.length) { const i = idxs[R(idxs.length)]; let v; do { v = vowels[R(5)]; } while (v === chars[i]); chars[i] = v; }
      else { const i = R(chars.length); chars[i] = vowels[R(5)]; }
    } else if (mode === 2 && word.length >= 5) {
      chars.splice(RR(1, word.length - 2), 1);
    } else {
      const i = R(word.length);
      chars.splice(i, 0, chars[i]);
    }
    return chars.join('');
  }

  function genVocabChoice(grade, recent) {
    const list = vocabFor(grade);
    if (list.length < 4) return null;
    const pick = shuffle(list).slice(0, 4);
    const [word, cn] = pick[0];
    const mode = R(3);
    if (mode === 0) {
      const q = `英语单词 "${word}" 是什么意思？`;
      if (recent && recent.includes(q)) return null;
      const opts = shuffle(pick.map(p => p[1]));
      return { type: 'choice', q, opts, a: opts.indexOf(cn), tip: `${word} 的意思是"${cn}"。` };
    }
    if (mode === 1) {
      const q = `"${cn}"的英语单词是？`;
      if (recent && recent.includes(q)) return null;
      const opts = shuffle(pick.map(p => p[0]));
      return { type: 'choice', q, opts, a: opts.indexOf(word), tip: `"${cn}"的英语是 ${word}。` };
    }
    // 拼写辨析：正确拼写 vs 错误变体
    if (word.length < 4 || /[^a-z]/.test(word)) {
      const q = `"${cn}"的英语单词是？`;
      if (recent && recent.includes(q)) return null;
      const opts = shuffle(pick.map(p => p[0]));
      return { type: 'choice', q, opts, a: opts.indexOf(word), tip: `"${cn}"的英语是 ${word}。` };
    }
    const q = `下面哪个是"${cn}"的正确拼写？`;
    if (recent && recent.includes(q)) return null;
    const wrongs = new Set();
    let guard = 0;
    while (wrongs.size < 3 && guard++ < 40) {
      const w = misspell(word);
      if (w !== word) wrongs.add(w);
    }
    if (wrongs.size < 3) return null;
    const opts = shuffle([word, ...wrongs]);
    return { type: 'choice', q, opts, a: opts.indexOf(word), tip: `正确拼写是 ${word}（${cn}）。` };
  }

  function genVocabFill(grade, recent) {
    const list = vocabFor(grade);
    if (!list.length) return null;
    for (let t = 0; t < 8; t++) {
      const [word, cn] = list[R(list.length)];
      if (word.length < 3 || /[^a-z]/.test(word)) continue;
      const i = RR(1, word.length - 2);
      const shown = word.split('').map((c, j) => j === i ? '__' : c).join(' ');
      const q = `"${cn}"的英语是 ${shown}（填一个字母）`;
      if (recent && recent.includes(q)) continue;
      return { type: 'fill', q, answer: word[i], tip: `${word} ${cn}` };
    }
    return null;
  }

  function genVocabMatch(grade) {
    const list = vocabFor(grade);
    if (list.length < 4) return null;
    const pairs = shuffle(list).slice(0, 4).map(p => [p[0], p[1]]);
    return {
      type: 'match',
      q: '把英语单词和它的中文意思连起来',
      left: pairs.map(p => p[0]),
      right: shuffle(pairs.map(p => p[1])),
      answer: pairs.map(p => p[1]),
      tip: pairs.map(p => `${p[0]} → ${p[1]}`).join('，')
    };
  }

  /* ============ 判断题库（科学/通识） ============ */
  const JUDGE_BANK = {
    science: [
      { q: '月亮自己会发光。', answer: false, tip: '月亮不发光，它反射的是太阳光。' },
      { q: '水结冰后体积会变大。', answer: true, tip: '对！所以装满水的瓶子冷冻会胀破。' },
      { q: '鱼是用鳃呼吸的。', answer: true, tip: '对！鱼生活在水里，用鳃呼吸。' },
      { q: '声音是由物体振动产生的。', answer: true, tip: '对！振动停止，声音也停止。' },
      { q: '植物的根能进行光合作用。', answer: false, tip: '光合作用主要在叶子里进行，根负责吸水和固定。' },
      { q: '空气是蓝色的。', answer: false, tip: '空气无色透明，天空的蓝色是光散射形成的。' },
      { q: '磁铁隔着纸也能吸住回形针。', answer: true, tip: '对！磁力可以穿过纸等薄的非磁性物体。' },
      { q: '塑料尺子容易导电。', answer: false, tip: '塑料是绝缘体，不容易导电；金属才是导体。' }
    ],
    general: [
      { q: '过马路要走斑马线。', answer: true, tip: '对！红灯停绿灯行，走斑马线最安全。' },
      { q: '发生火灾拨打110。', answer: false, tip: '火警是119，报警才是110，急救是120。' },
      { q: '我国的首都是北京。', answer: true, tip: '对！中华人民共和国首都是北京。' },
      { q: '废旧电池属于可回收垃圾。', answer: false, tip: '废电池是有害垃圾，要投红色垃圾桶。' },
      { q: '一年有12个月。', answer: true, tip: '对！大月31天，小月30天，二月特殊。' },
      { q: '坐汽车时把头伸出窗外看风景是可以的。', answer: false, tip: '非常危险！坐车要系安全带，头手不能伸出窗外。' },
      { q: '大熊猫是我国的国宝。', answer: true, tip: '对！大熊猫是中国特有的珍稀动物。' },
      { q: '长江是我国最长的河流。', answer: true, tip: '对！长江约6300千米，是我国第一长河。' }
    ]
  };

  /* ============ 抽题主入口 ============ */
  const SUBJECTS = ['math', 'chinese', 'english', 'science', 'general'];
  const SUBJECT_NAMES = { math: '数学', chinese: '语文', english: '英语', science: '科学', general: '通识' };
  const SUBJECT_ICONS = { math: 'fa-calculator', chinese: 'fa-book', english: 'fa-language', science: 'fa-flask', general: 'fa-earth-asia' };
  const TYPE_NAMES = { choice: '选择题', fill: '填空题', match: '连线题', judge: '判断题' };

  function bankFor(subject, grade) {
    const bank = window.QUESTION_BANK[subject];
    if (!bank) return [];
    const cur = bank['g' + grade] || bank.g3 || [];
    if (cur.length) return cur;
    for (let g = grade; g >= 3; g--) if (bank['g' + g] && bank['g' + g].length) return bank['g' + g];
    return bank.g3 || [];
  }

  function drawChoiceFromBank(subject, grade, recent) {
    const bank = bankFor(subject, grade);
    if (!bank.length) return null;
    const fresh = bank.filter(x => !recent.includes(x.q));
    const pool = fresh.length ? fresh : bank;
    const item = pool[R(pool.length)];
    const idx = shuffle(item.opts.map((_, i) => i));
    return { type: 'choice', subject, q: item.q, opts: idx.map(i => item.opts[i]), a: idx.indexOf(item.a), tip: item.tip };
  }

  function drawQuestion(subject, grade, recent) {
    recent = recent || [];
    if (!subject) subject = SUBJECTS[R(SUBJECTS.length)];
    const g = MathGen[grade] ? grade : 3;

    // 题型概率：选择50% / 填空20% / 连线20% / 判断10%
    const roll = Math.random();
    let q = null;

    if (roll < 0.2) {
      // —— 连线 ——
      if (subject === 'english' && Math.random() < 0.7) q = genVocabMatch(g);
      if (!q) q = genMatch(subject, g);
    } else if (roll < 0.4) {
      // —— 填空 ——
      if (subject === 'math') {
        const gens = MathFillGen[g] || MathFillGen[3];
        q = gens[R(gens.length)]();
      } else if (subject === 'english') {
        q = genVocabFill(g, recent);
        if (!q) {
          const item = ENGLISH_FILL.filter(x => !recent.includes(x.q))[0] || ENGLISH_FILL[R(ENGLISH_FILL.length)];
          q = { type: 'fill', q: item.q, answer: item.answer, tip: item.tip, inputMode: 'text' };
        }
      } else {
        q = null; // 其他科目回退到选择
      }
    } else if (roll < 0.5) {
      // —— 判断 ——
      if (subject === 'math') q = MathJudgeGen(g);
      else if (JUDGE_BANK[subject]) {
        const bank = JUDGE_BANK[subject];
        const fresh = bank.filter(x => !recent.includes(x.q));
        const item = (fresh.length ? fresh : bank)[R((fresh.length ? fresh : bank).length)];
        q = { type: 'judge', q: item.q, answer: item.answer, tip: item.tip };
      }
    }

    // —— 选择题（默认/回退） ——
    if (!q) {
      if (subject === 'math') {
        const gens = MathGen[g];
        let guard = 0;
        do { q = gens[R(gens.length)](); guard++; } while (recent.includes(q.q) && guard < 10);
      } else {
        // 英语：60% 用词表生成器（可产出上千道不重复题），其余走静态题库
        if (subject === 'english' && Math.random() < 0.6) {
          for (let t = 0; t < 5 && !q; t++) q = genVocabChoice(g, recent);
        }
        if (!q) q = drawChoiceFromBank(subject, g, recent) || genVocabChoice(g, recent) || (() => { const gens = MathGen[g]; return gens[R(gens.length)](); })();
      }
    }
    q.subject = subject;
    return q;
  }

  window.Questions = { drawQuestion, SUBJECTS, SUBJECT_NAMES, SUBJECT_ICONS, TYPE_NAMES };
})();
