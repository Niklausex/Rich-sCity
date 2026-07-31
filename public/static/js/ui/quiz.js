/* ============================================================
 * 答题界面 v2：支持 选择 / 填空 / 连线 / 判断 四种题型
 * ============================================================ */
(function () {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal-box');

  function start(dq) {
    const r = Game.state.residents.find(x => x.id === dq.residentId);
    const q = Game.drawFor(dq);
    const subName = Questions.SUBJECT_NAMES[q.subject];
    const subIcon = Questions.SUBJECT_ICONS[q.subject];
    const typeName = Questions.TYPE_NAMES[q.type] || '题目';

    const header = `
      <div class="quiz-head">
        ${UI.portrait(r, 0.9)}
        <div>
          <div style="font-size:18px;font-weight:800">${r.name} 有问题请教市长！</div>
          <div class="q-sub"><i class="fas ${subIcon}"></i> ${subName} · <span class="tag tag-orange" style="font-size:11px">${typeName}</span> · 连对 <b>${r.streak}</b> <i class="fas fa-fire" style="color:#ffcf6a"></i></div>
        </div>
      </div>`;

    if (q.type === 'choice') renderChoice(dq, r, q, header);
    else if (q.type === 'fill') renderFill(dq, r, q, header);
    else if (q.type === 'judge') renderJudge(dq, r, q, header);
    else if (q.type === 'match') renderMatch(dq, r, q, header);
    overlay.style.display = 'flex';
  }

  /* ---------- 通用结果处理 ---------- */
  function finish(dq, r, q, correct, extraTipHtml) {
    const result = Game.answer(dq, q, correct);
    const resultEl = document.getElementById('quiz-result');
    const actions = document.getElementById('quiz-actions');

    if (correct) {
      resultEl.innerHTML = `<span style="color:#237841">🎉 答对啦！奖励 💰${result.moneyBonus} · ${r.name}的连对：${r.streak}</span>`;
      if (q.tip) resultEl.innerHTML += `<br><span style="font-size:13.5px;color:#888;font-weight:600">💡 ${q.tip}</span>`;
      UI.confetti(12);
    } else {
      resultEl.innerHTML = `<span style="color:#c22a24">😢 答错了，连对中断了</span><br>
        <span style="font-size:14px;color:#666;font-weight:600">💡 ${q.tip || '再想想哦'}</span>`;
    }
    if (extraTipHtml) resultEl.innerHTML += extraTipHtml;

    if (result.leveledUp) {
      const c = result.newCareer;
      setTimeout(() => { UI.toast(`🎊 ${r.name} 升级啦！新头衔：${c.icon}${c.title}（周薪${c.salary}元）`, 'gold'); UI.confetti(24); }, 500);
    }
    if (result.gift) {
      setTimeout(() => { UI.toast(`🎁 ${r.name} 送你「${result.gift.name}」！去礼物盒看看吧`, 'gold'); UI.confetti(30); }, 1100);
    }

    actions.innerHTML = '';
    const remaining = Game.pendingQuestions();
    const nextBtn = document.createElement('button');
    if (remaining.length) {
      nextBtn.className = 'btn btn-blue';
      nextBtn.innerHTML = `<i class="fas fa-forward"></i> 下一位居民（还有${remaining.length}人）`;
      nextBtn.onclick = () => start(remaining[0]);
    } else {
      nextBtn.className = 'btn btn-green';
      nextBtn.innerHTML = '✅ 今天的问题都答完啦';
      nextBtn.onclick = close;
    }
    actions.appendChild(nextBtn);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn'; closeBtn.textContent = '关闭'; closeBtn.onclick = close;
    actions.appendChild(closeBtn);
    UI.refreshTop();
  }

  function close() { overlay.style.display = 'none'; }

  function footer() {
    return `<div class="quiz-result" id="quiz-result"></div>
      </div><div class="modal-actions" id="quiz-actions"><button class="btn" id="quiz-later">待会再答</button></div>`;
  }
  function bindLater() { const b = document.getElementById('quiz-later'); if (b) b.onclick = close; }

  /* ---------- 选择题 ---------- */
  function renderChoice(dq, r, q, header) {
    const keys = ['A', 'B', 'C', 'D'];
    modal.innerHTML = `${header}<div class="quiz-body">
      <div class="quiz-q">${q.q}</div>
      <div class="quiz-opts">
        ${q.opts.map((o, i) => `<button class="quiz-opt" data-i="${i}"><span class="opt-key">${keys[i]}</span><span>${o}</span></button>`).join('')}
      </div>${footer()}`;
    bindLater();
    let done = false;
    modal.querySelectorAll('.quiz-opt').forEach(btn => btn.onclick = () => {
      if (done) return; done = true;
      const pick = +btn.dataset.i;
      const correct = pick === q.a;
      modal.querySelectorAll('.quiz-opt').forEach((b, i) => {
        if (i === q.a) b.classList.add('right');
        else if (i === pick && !correct) b.classList.add('wrong');
        b.style.pointerEvents = 'none';
      });
      finish(dq, r, q, correct);
    });
  }

  /* ---------- 填空题 ---------- */
  function renderFill(dq, r, q, header) {
    modal.innerHTML = `${header}<div class="quiz-body">
      <div class="quiz-q">${q.q.replace(/\n/g, '<br>')}</div>
      <div style="display:flex;gap:10px;justify-content:center;align-items:center;margin-bottom:6px">
        <input type="${q.inputMode === 'number' ? 'tel' : 'text'}" id="fill-input" class="fill-input" placeholder="在这里输入答案" autocomplete="off">
        <button class="btn btn-green" id="fill-submit">确定</button>
      </div>${footer()}`;
    bindLater();
    const input = document.getElementById('fill-input');
    setTimeout(() => input.focus(), 250);
    let done = false;
    const submit = () => {
      if (done) return;
      const val = input.value.trim().toLowerCase().replace(/\s+/g, '');
      if (!val) { UI.toast('先输入答案哦', 'bad'); return; }
      done = true;
      const ans = String(q.answer).toLowerCase().replace(/\s+/g, '');
      const correct = val === ans || (q.inputMode !== 'text' && parseFloat(val) === parseFloat(ans));
      input.disabled = true;
      input.style.borderColor = correct ? '#3ab54a' : '#e4574e';
      input.style.background = correct ? '#dcf5df' : '#ffe0df';
      document.getElementById('fill-submit').disabled = true;
      finish(dq, r, q, correct, correct ? '' : `<br><span style="font-size:14px;color:#0d69ab;font-weight:800">正确答案：${q.answer}</span>`);
    };
    document.getElementById('fill-submit').onclick = submit;
    input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  }

  /* ---------- 判断题 ---------- */
  function renderJudge(dq, r, q, header) {
    modal.innerHTML = `${header}<div class="quiz-body">
      <div class="quiz-q">${q.q}</div>
      <div style="display:flex;gap:14px;justify-content:center">
        <button class="quiz-opt judge-btn" data-v="true" style="flex:1;justify-content:center;font-size:20px">⭕ 对</button>
        <button class="quiz-opt judge-btn" data-v="false" style="flex:1;justify-content:center;font-size:20px">❌ 错</button>
      </div>${footer()}`;
    bindLater();
    let done = false;
    modal.querySelectorAll('.judge-btn').forEach(btn => btn.onclick = () => {
      if (done) return; done = true;
      const pick = btn.dataset.v === 'true';
      const correct = pick === q.answer;
      modal.querySelectorAll('.judge-btn').forEach(b => {
        const v = b.dataset.v === 'true';
        if (v === q.answer) b.classList.add('right');
        else if (v === pick && !correct) b.classList.add('wrong');
        b.style.pointerEvents = 'none';
      });
      finish(dq, r, q, correct);
    });
  }

  /* ---------- 连线题 ---------- */
  function renderMatch(dq, r, q, header) {
    const n = q.left.length;
    modal.innerHTML = `${header}<div class="quiz-body">
      <div class="quiz-q" style="font-size:17px">${q.q}<br><span style="font-size:13px;color:#999;font-weight:600">先点左边一个，再点右边对应的，连完${n}对后点「检查答案」</span></div>
      <div class="match-area">
        <svg id="match-svg"></svg>
        <div class="match-col" id="match-left">
          ${q.left.map((t, i) => `<button class="match-item" data-side="l" data-i="${i}">${t}</button>`).join('')}
        </div>
        <div class="match-col" id="match-right">
          ${q.right.map((t, i) => `<button class="match-item" data-side="r" data-i="${i}">${t}</button>`).join('')}
        </div>
      </div>
      <div style="text-align:center;margin-top:12px">
        <button class="btn btn-green" id="match-check" disabled>检查答案（0/${n}）</button>
        <button class="btn btn-small" id="match-clear" style="margin-left:8px">重新连</button>
      </div>${footer()}`;
    bindLater();

    const COLORS = ['#d01012', '#0d69ab', '#3ab54a', '#fe8a18', '#8a5fb0'];
    let selL = null;                 // 当前选中的左项
    const links = {};                // {leftIdx: rightIdx}
    let done = false;
    const area = modal.querySelector('.match-area');
    const svg = document.getElementById('match-svg');
    const checkBtn = document.getElementById('match-check');

    function itemEl(side, i) { return modal.querySelector(`.match-item[data-side="${side}"][data-i="${i}"]`); }

    function redrawLines() {
      const ar = area.getBoundingClientRect();
      svg.setAttribute('width', ar.width); svg.setAttribute('height', ar.height);
      svg.innerHTML = '';
      Object.entries(links).forEach(([li, ri], idx) => {
        const lr = itemEl('l', li).getBoundingClientRect();
        const rr = itemEl('r', ri).getBoundingClientRect();
        const x1 = lr.right - ar.left, y1 = lr.top + lr.height / 2 - ar.top;
        const x2 = rr.left - ar.left, y2 = rr.top + rr.height / 2 - ar.top;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', `M${x1},${y1} C${x1 + 30},${y1} ${x2 - 30},${y2} ${x2},${y2}`);
        line.setAttribute('stroke', COLORS[li % COLORS.length]);
        line.setAttribute('stroke-width', '3.5');
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke-linecap', 'round');
        svg.appendChild(line);
      });
      const cnt = Object.keys(links).length;
      checkBtn.disabled = cnt < n || done;
      checkBtn.textContent = `检查答案（${cnt}/${n}）`;
    }

    modal.querySelectorAll('.match-item').forEach(el => el.onclick = () => {
      if (done) return;
      const side = el.dataset.side, i = +el.dataset.i;
      if (side === 'l') {
        modal.querySelectorAll('.match-item[data-side="l"]').forEach(x => x.classList.remove('picked'));
        selL = i;
        el.classList.add('picked');
      } else {
        if (selL == null) { UI.toast('先点左边的一项哦', 'bad'); return; }
        // 若该右项已被其他左项连，取消旧连线
        for (const k in links) if (links[k] === i) delete links[k];
        links[selL] = i;
        itemEl('l', selL).classList.remove('picked');
        itemEl('l', selL).classList.add('linked');
        selL = null;
        redrawLines();
      }
    });

    document.getElementById('match-clear').onclick = () => {
      if (done) return;
      for (const k in links) delete links[k];
      selL = null;
      modal.querySelectorAll('.match-item').forEach(x => x.classList.remove('picked', 'linked', 'right-item', 'wrong-item'));
      redrawLines();
    };

    checkBtn.onclick = () => {
      if (done) return; done = true;
      let allRight = true;
      for (let i = 0; i < n; i++) {
        const pickedRight = q.right[links[i]];
        const isOk = pickedRight === q.answer[i];
        if (!isOk) allRight = false;
        itemEl('l', i).classList.add(isOk ? 'right-item' : 'wrong-item');
        if (links[i] != null) itemEl('r', links[i]).classList.add(isOk ? 'right-item' : 'wrong-item');
      }
      modal.querySelectorAll('.match-item').forEach(x => x.style.pointerEvents = 'none');
      document.getElementById('match-clear').style.display = 'none';
      checkBtn.disabled = true;
      finish(dq, r, q, allRight, allRight ? '' : `<br><span style="font-size:13.5px;color:#0d69ab;font-weight:700">正确连法：${q.tip}</span>`);
    };

    window.addEventListener('resize', redrawLines);
    setTimeout(redrawLines, 100);
  }

  window.Quiz = { start };
})();
