/* ============================================================
 * 题目引擎：数学题程序化生成 + 题目抽取(避免重复)
 * 年级体系：3=三年级(默认) 4,5,6=小学高年级 7~9=初中 10~12=高中(预留)
 * ============================================================ */
(function () {
  const R = (n) => Math.floor(Math.random() * n);
  const RR = (min, max) => min + R(max - min + 1);
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* 生成带干扰项的选择题 */
  function mkChoice(q, answer, tip, distractGen) {
    const set = new Set([answer]);
    let guard = 0;
    while (set.size < 4 && guard++ < 60) {
      const d = distractGen();
      if (d !== answer && d >= 0) set.add(d);
    }
    const opts = shuffle([...set].map(String));
    return { q, opts, a: opts.indexOf(String(answer)), tip };
  }

  /* ---------- 数学题生成器（按年级） ---------- */
  const MathGen = {
    // 三年级：万以内加减、乘法口诀内乘除、简单应用题、时间、长度
    3: [
      () => { const a = RR(100, 999), b = RR(100, 999); return mkChoice(`${a} + ${b} = ?`, a + b, `列竖式相加：${a} + ${b} = ${a + b}，注意进位哦。`, () => a + b + (R(2) ? RR(1, 30) : -RR(1, 30))); },
      () => { let a = RR(300, 999), b = RR(100, 299); return mkChoice(`${a} - ${b} = ?`, a - b, `列竖式相减：${a} - ${b} = ${a - b}，注意退位哦。`, () => a - b + (R(2) ? RR(1, 30) : -RR(1, 30))); },
      () => { const a = RR(2, 9), b = RR(2, 9); return mkChoice(`${a} × ${b} = ?`, a * b, `乘法口诀：${a}${['','','二','三','四','五','六','七','八','九'][b] || b}${a * b < 10 ? '得' : ''}${a * b}。`, () => a * b + (R(2) ? RR(1, 8) : -RR(1, 8))); },
      () => { const b = RR(2, 9), c = RR(2, 9), a = b * c; return mkChoice(`${a} ÷ ${b} = ?`, c, `想乘法：${b} × ${c} = ${a}，所以 ${a} ÷ ${b} = ${c}。`, () => c + (R(2) ? RR(1, 4) : -RR(1, 4))); },
      () => { const a = RR(11, 99), b = RR(2, 9); return mkChoice(`${a} × ${b} = ?`, a * b, `${a} × ${b}：先算 ${Math.floor(a / 10) * 10} × ${b} = ${Math.floor(a / 10) * 10 * b}，再算 ${a % 10} × ${b} = ${(a % 10) * b}，相加得 ${a * b}。`, () => a * b + (R(2) ? RR(2, 40) : -RR(2, 40))); },
      () => { const p = RR(3, 9), n = RR(4, 12); return mkChoice(`一支铅笔${p}元，买${n}支需要多少元？`, p * n, `${p} × ${n} = ${p * n}（元）。单价 × 数量 = 总价。`, () => p * n + (R(2) ? RR(1, 15) : -RR(1, 15))); },
      () => { const total = RR(4, 9) * RR(4, 9), per = [...Array(9)].map((_, i) => i + 2).filter(x => total % x === 0)[0]; const ans = total / per; return mkChoice(`${total}个苹果平均分给${per}个小朋友，每人分几个？`, ans, `${total} ÷ ${per} = ${ans}（个）。平均分用除法。`, () => ans + (R(2) ? RR(1, 4) : -RR(1, 4))); },
      () => { const h = RR(1, 11), m = [10, 15, 20, 30, 40, 45][R(6)]; const total = h * 60 + m; return mkChoice(`${h}小时${m}分钟一共是多少分钟？`, total, `1小时=60分钟，${h}小时=${h * 60}分钟，再加${m}分钟等于${total}分钟。`, () => total + (R(2) ? RR(5, 30) : -RR(5, 30))); },
      () => { const a = RR(2, 9); const len = RR(2, 9); return mkChoice(`一个正方形的边长是${len}厘米，它的周长是多少厘米？`, len * 4, `正方形周长 = 边长 × 4 = ${len} × 4 = ${len * 4}（厘米）。`, () => len * 4 + (R(2) ? RR(1, 8) : -RR(1, 8)) * (R(2) ? 1 : a % 3 + 1)); },
      () => { const L = RR(4, 12), W = RR(2, L - 1); return mkChoice(`长方形长${L}厘米、宽${W}厘米，周长是多少厘米？`, (L + W) * 2, `长方形周长 = (长+宽) × 2 = (${L}+${W}) × 2 = ${(L + W) * 2}（厘米）。`, () => (L + W) * 2 + (R(2) ? RR(2, 10) : -RR(2, 10))); },
      () => { const km = RR(2, 9); return mkChoice(`${km}千米等于多少米？`, km * 1000, `1千米 = 1000米，${km}千米 = ${km * 1000}米。`, () => km * (R(2) ? 100 : 1000) + (R(3) === 0 ? RR(1, 9) * 100 : 0)); },
      () => { const b = RR(3, 9), q = RR(3, 9), r = RR(1, b - 1); const a = b * q + r; return mkChoice(`${a} ÷ ${b} 的余数是几？`, r, `${a} ÷ ${b} = ${q} 余 ${r}。因为 ${b} × ${q} = ${b * q}，${a} - ${b * q} = ${r}。`, () => RR(0, b - 1)); },
      () => { const a = RR(10, 60), b = RR(10, 60), c = RR(10, 60); return mkChoice(`${a} + ${b} + ${c} = ?`, a + b + c, `从左到右依次相加：${a} + ${b} = ${a + b}，再加 ${c} 得 ${a + b + c}。`, () => a + b + c + (R(2) ? RR(1, 12) : -RR(1, 12))); },
      () => { const f = RR(2, 8); return mkChoice(`把一个西瓜平均切成${f * 2}块，吃了${f}块，吃了这个西瓜的几分之几？`, `${f}/${f * 2}（也就是1/2）`, `吃了${f}块，一共${f * 2}块，就是 ${f}/${f * 2}，约分后是 1/2。`, () => `${RR(1, 5)}/${RR(6, 12)}`); }
    ],
    // 四年级：大数、三位数乘两位数、除数是两位数、角度、面积
    4: [
      () => { const a = RR(100, 999), b = RR(11, 99); return mkChoice(`${a} × ${b} = ?`, a * b, `列竖式计算：${a} × ${b} = ${a * b}。`, () => a * b + (R(2) ? RR(10, 200) : -RR(10, 200))); },
      () => { const b = RR(11, 89), q = RR(11, 89), a = b * q; return mkChoice(`${a} ÷ ${b} = ?`, q, `试商：${b} × ${q} = ${a}，所以商是 ${q}。`, () => q + (R(2) ? RR(1, 9) : -RR(1, 9))); },
      () => { const L = RR(5, 20), W = RR(3, L); return mkChoice(`长方形长${L}米、宽${W}米，面积是多少平方米？`, L * W, `面积 = 长 × 宽 = ${L} × ${W} = ${L * W}（平方米）。`, () => L * W + (R(2) ? RR(2, 20) : -RR(2, 20))); },
      () => { const deg = [30, 45, 60, 90, 120, 150][R(6)]; const ans = 180 - deg; return mkChoice(`三角形两个角分别是${Math.floor(deg / 2)}°和${deg - Math.floor(deg / 2)}°，第三个角是多少度？`, ans, `三角形内角和180°：180 - ${deg} = ${ans}°。`, () => ans + (R(2) ? RR(5, 30) : -RR(5, 30))); },
      () => { const a = RR(2, 9) * 10000; return mkChoice(`${a}读作什么？`, `${['','一','二','三','四','五','六','七','八','九'][a / 10000]}万`, `${a} = ${a / 10000}个万，读作“${['','一','二','三','四','五','六','七','八','九'][a / 10000]}万”。`, () => `${['一','二','三','四','五','六','七','八','九'][R(9)]}${['万','千','十万'][R(3)]}`); }
    ],
    // 五年级：小数乘除、简易方程、多边形面积
    5: [
      () => { const a = RR(11, 99) / 10, b = RR(2, 9); const ans = Math.round(a * b * 10) / 10; return mkChoice(`${a} × ${b} = ?`, ans, `先算 ${a * 10} × ${b} = ${a * 10 * b}，再把小数点向左移一位得 ${ans}。`, () => Math.round((ans + (R(2) ? RR(1, 5) : -RR(1, 5)) / 10 * 10) * 10) / 10); },
      () => { const x = RR(3, 20), b = RR(2, 30); return mkChoice(`方程 x + ${b} = ${x + b}，x = ?`, x, `两边同时减${b}：x = ${x + b} - ${b} = ${x}。`, () => x + (R(2) ? RR(1, 6) : -RR(1, 6))); },
      () => { const base = RR(4, 16), h = RR(3, 12); const ans = base * h / 2; return mkChoice(`三角形底${base}厘米、高${h}厘米，面积是多少平方厘米？`, ans, `三角形面积 = 底 × 高 ÷ 2 = ${base} × ${h} ÷ 2 = ${ans}。`, () => ans + (R(2) ? RR(2, 12) : -RR(2, 12))); },
      () => { const x = RR(2, 12), a = RR(2, 9); return mkChoice(`方程 ${a}x = ${a * x}，x = ?`, x, `两边同时除以${a}：x = ${a * x} ÷ ${a} = ${x}。`, () => x + (R(2) ? RR(1, 5) : -RR(1, 5))); }
    ],
    // 六年级：分数运算、百分数、圆、比例
    6: [
      () => { const r = RR(2, 10); const ans = Math.round(3.14 * r * r * 100) / 100; return mkChoice(`半径为${r}厘米的圆，面积是多少平方厘米？(π取3.14)`, ans, `圆面积 = πr² = 3.14 × ${r} × ${r} = ${ans}。`, () => Math.round(3.14 * (r + RR(1, 3)) * r * 100) / 100); },
      () => { const total = RR(2, 9) * 100, p = [10, 20, 25, 50][R(4)]; const ans = total * p / 100; return mkChoice(`${total}元的玩具打${p === 10 ? '九' : p === 20 ? '八' : p === 25 ? '七五' : '五'}折出售，便宜了多少元？`, ans, `便宜了 ${total} × ${p}% = ${ans}（元）。`, () => ans + (R(2) ? RR(5, 50) : -RR(5, 50))); }
    ]
  };
  // 7年级以上暂用6年级生成器（后续迭代扩充）
  for (let g = 7; g <= 12; g++) MathGen[g] = MathGen[6];

  function genMath(grade) {
    const g = MathGen[grade] ? grade : 3;
    const gens = MathGen[g];
    return gens[R(gens.length)]();
  }

  /* ---------- 题目抽取 ---------- */
  const SUBJECTS = ['math', 'chinese', 'english', 'science', 'general'];
  const SUBJECT_NAMES = { math: '数学', chinese: '语文', english: '英语', science: '科学', general: '通识' };
  const SUBJECT_ICONS = { math: 'fa-calculator', chinese: 'fa-book', english: 'fa-language', science: 'fa-flask', general: 'fa-earth-asia' };

  function bankFor(subject, grade) {
    const bank = window.QUESTION_BANK[subject];
    if (!bank) return [];
    // 汇集 <= 当前年级的题（当前年级题占大头）
    const cur = bank['g' + grade] || bank.g3 || [];
    if (cur.length) return cur;
    // 找最近的可用年级
    for (let g = grade; g >= 3; g--) if (bank['g' + g] && bank['g' + g].length) return bank['g' + g];
    return bank.g3 || [];
  }

  /* 抽题：subject 可指定，recent 为最近出过的题目文案数组（避免重复） */
  function drawQuestion(subject, grade, recent) {
    recent = recent || [];
    if (!subject) subject = SUBJECTS[R(SUBJECTS.length)];
    if (subject === 'math') {
      let q, guard = 0;
      do { q = genMath(grade); guard++; } while (recent.includes(q.q) && guard < 10);
      q.subject = 'math';
      return q;
    }
    const bank = bankFor(subject, grade);
    if (!bank.length) return Object.assign(genMath(grade), { subject: 'math' });
    const fresh = bank.filter(x => !recent.includes(x.q));
    const pool = fresh.length ? fresh : bank;
    const item = pool[R(pool.length)];
    // 打乱选项
    const idx = shuffle(item.opts.map((_, i) => i));
    return {
      subject,
      q: item.q,
      opts: idx.map(i => item.opts[i]),
      a: idx.indexOf(item.a),
      tip: item.tip
    };
  }

  window.Questions = { drawQuestion, SUBJECTS, SUBJECT_NAMES, SUBJECT_ICONS };
})();
