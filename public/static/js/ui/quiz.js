/* ============================================================
 * 答题界面 v2：支持 选择 / 填空 / 连线 / 判断 四种题型
 * ============================================================ */
(function () {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal-box');

  /* ---------- 英语朗读引擎（浏览器内置 TTS，免费无需联网 API）----------
   * 修复的坑：
   * 1. Chrome：cancel() 后立刻 speak() 会被静默吞掉 → speak 前等 150ms
   * 2. Chrome：单条语音约 15 秒被自动掐断 → 按句切块排队播放
   * 3. Chrome：播放中会莫名 paused → 定时 resume() 保活
   * 4. 语音列表异步加载（getVoices 首次为空）→ 监听 voiceschanged 缓存
   */
  let VOICES = [];
  function loadVoices() { try { VOICES = speechSynthesis.getVoices() || []; } catch (e) {} }
  if (window.speechSynthesis) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }
  function pickVoice() {
    if (!VOICES.length) loadVoices();
    return VOICES.find(x => /en[-_]US/i.test(x.lang) && /Google US|Samantha|female/i.test(x.name)) ||
           VOICES.find(x => /en[-_]US/i.test(x.lang)) ||
           VOICES.find(x => /^en/i.test(x.lang)) || null;
  }

  let speakSession = 0;      // 会话号：新的播放/停止会作废旧队列
  let keepAlive = null;
  let speakingNow = false;
  let pausedByUser = false;  // 用户主动暂停（keepAlive 的 resume 不能踢掉它）
  let resumeHook = null;     // 句间空隙暂停时挂起的队列继续函数

  function ttsEvent() {
    document.dispatchEvent(new CustomEvent('tts-state', { detail: { speaking: speakingNow, paused: pausedByUser } }));
  }

  function stopSpeak() {
    speakSession++;
    speakingNow = false;
    pausedByUser = false;
    resumeHook = null;
    if (keepAlive) { clearInterval(keepAlive); keepAlive = null; }
    try { speechSynthesis.cancel(); } catch (e) {}
    ttsEvent();
  }

  function pauseSpeak() {
    if (!speakingNow || pausedByUser) return;
    pausedByUser = true;
    try { speechSynthesis.pause(); } catch (e) {}
    ttsEvent();
  }

  function resumeSpeak() {
    if (!pausedByUser) return;
    pausedByUser = false;
    if (resumeHook) {           // 在句间空隙暂停的：直接继续队列
      const h = resumeHook; resumeHook = null;
      ttsEvent();
      h();
    } else {                    // 句中暂停的：原生 resume
      try { speechSynthesis.resume(); } catch (e) {}
      ttsEvent();
    }
  }

  function speak(text, rate, onEnd) {
    if (!window.speechSynthesis) { UI.toast('这个浏览器不支持语音朗读，换 Chrome/Edge 试试', 'bad'); return; }
    stopSpeak();
    const session = speakSession;
    // 按句切块（每块 ≤ 180 字符），避免长文被 Chrome 掐断
    const sentences = String(text).replace(/\s*\n+\s*/g, ' ').match(/[^.!?]+[.!?]+["'”]?\s*/g) || [String(text)];
    const chunks = [];
    let cur = '';
    for (const sTxt of sentences) {
      if (cur && (cur + sTxt).length > 180) { chunks.push(cur); cur = sTxt; }
      else cur += sTxt;
    }
    if (cur.trim()) chunks.push(cur);

    let i = 0;
    const next = () => {
      if (session !== speakSession) return;           // 已被新播放/停止作废
      if (pausedByUser) { resumeHook = next; return; }// 句间空隙被暂停：挂起，等 resumeSpeak 继续
      if (i >= chunks.length) {                       // 播完
        speakingNow = false;
        pausedByUser = false;
        if (keepAlive) { clearInterval(keepAlive); keepAlive = null; }
        ttsEvent();
        if (onEnd) onEnd();
        return;
      }
      const u = new SpeechSynthesisUtterance(chunks[i++]);
      u.lang = 'en-US';
      u.rate = rate || 0.85;
      const v = pickVoice();
      if (v) u.voice = v;
      u.onend = () => setTimeout(next, 200);          // 句间停顿 200ms
      u.onerror = (e) => {
        // interrupted/canceled 是正常打断；其他错误跳过本句继续
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        setTimeout(next, 200);
      };
      try { speechSynthesis.speak(u); } catch (err) { setTimeout(next, 200); }
    };

    // Chrome bug：cancel 后必须等一拍再 speak，否则被静默吞掉
    setTimeout(() => {
      if (session !== speakSession) return;
      speakingNow = true;
      ttsEvent();
      next();
      // 保活：Chrome 播放 ~15s 会自动 pause，定时踢一脚（用户主动暂停时不能踢）
      keepAlive = setInterval(() => {
        if (session !== speakSession || !speechSynthesis.speaking || pausedByUser) return;
        try { speechSynthesis.resume(); } catch (e) {}
      }, 5000);
    }, 150);
  }
  function isSpeaking() { return speakingNow; }
  function isPaused() { return pausedByUser; }

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
          <div class="q-sub"><i class="fas ${subIcon}"></i> ${subName} · <span class="tag tag-orange" style="font-size:11px">${typeName}</span>${q.review === 'consolidate' ? ' · <span class="tag" style="font-size:11px;background:#5f3dc4;color:#fff">🔁 巩固复习</span>' : (q.review ? ' · <span class="tag" style="font-size:11px;background:#e8590c;color:#fff">📖 错题复习</span>' : '')} · 连对 <b>${r.streak}</b> <i class="fas fa-fire" style="color:#ffcf6a"></i></div>
        </div>
      </div>`;

    if (q.type === 'choice') renderChoice(dq, r, q, header);
    else if (q.type === 'fill') renderFill(dq, r, q, header);
    else if (q.type === 'judge') renderJudge(dq, r, q, header);
    else if (q.type === 'match') renderMatch(dq, r, q, header);
    else if (q.type === 'create') renderCreate(dq, r, q, header);
    overlay.style.display = 'flex';
    // 听音题：自动播放一遍
    if (q.say && q.qkey && q.qkey.startsWith('listen:')) setTimeout(() => speak(q.say), 400);
  }

  // 题目含英语朗读内容时，插入 🔊 按钮
  function speakBtnHtml(q) {
    if (!q.say) return '';
    return `<button class="btn btn-blue btn-small" id="btn-speak" style="margin:2px 0 8px"><i class="fas fa-volume-high"></i> 再听一遍</button>`;
  }
  function bindSpeak(q) {
    const b = document.getElementById('btn-speak');
    if (b) b.onclick = () => speak(q.say);
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
    // 同一居民继续提问（每日上限50道）
    if (Game.canAsk(r.id)) {
      const againBtn = document.createElement('button');
      againBtn.className = 'btn btn-blue';
      againBtn.innerHTML = `<i class="fas fa-rotate-right"></i> 再来一题（今天 ${Game.askedCount(r.id)}/${Game.DAILY_LIMIT}）`;
      againBtn.onclick = () => { const ndq = Game.refillQuestion(r.id); if (ndq) start(ndq); else close(); };
      actions.appendChild(againBtn);
    }
    const remaining = Game.pendingQuestions().filter(x => x.residentId !== r.id);
    const nextBtn = document.createElement('button');
    if (remaining.length) {
      nextBtn.className = 'btn btn-green';
      nextBtn.innerHTML = `<i class="fas fa-forward"></i> 换一位居民（还有${remaining.length}人等着）`;
      nextBtn.onclick = () => start(remaining[0]);
      actions.appendChild(nextBtn);
    } else if (!Game.canAsk(r.id)) {
      nextBtn.className = 'btn btn-green';
      nextBtn.innerHTML = '✅ 今天的问题都答完啦';
      nextBtn.onclick = close;
      actions.appendChild(nextBtn);
    }
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
      <div style="text-align:center">${speakBtnHtml(q)}</div>
      <div class="quiz-opts">
        ${q.opts.map((o, i) => `<button class="quiz-opt" data-i="${i}"><span class="opt-key">${keys[i]}</span><span>${o}</span></button>`).join('')}
      </div>${footer()}`;
    bindLater();
    bindSpeak(q);
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
      <div style="text-align:center">${speakBtnHtml(q)}</div>
      <div style="display:flex;gap:10px;justify-content:center;align-items:center;margin-bottom:6px">
        <input type="${q.inputMode === 'number' ? 'tel' : 'text'}" id="fill-input" class="fill-input" placeholder="在这里输入答案" autocomplete="off">
        <button class="btn btn-green" id="fill-submit">确定</button>
      </div>${footer()}`;
    bindLater();
    bindSpeak(q);
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
      <div style="text-align:center">${speakBtnHtml(q)}</div>
      <div style="display:flex;gap:14px;justify-content:center">
        <button class="quiz-opt judge-btn" data-v="true" style="flex:1;justify-content:center;font-size:20px">⭕ 对</button>
        <button class="quiz-opt judge-btn" data-v="false" style="flex:1;justify-content:center;font-size:20px">❌ 错</button>
      </div>${footer()}`;
    bindLater();
    bindSpeak(q);
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

  /* ---------- 创作题：小小作家（打字自由表达，不判对错，完成就奖励） ---------- */
  function renderCreate(dq, r, q, header) {
    modal.innerHTML = `${header}<div class="quiz-body">
      <div class="quiz-q">${q.q}</div>
      <div style="background:#fff8e6;border:2px dashed #f5b942;border-radius:12px;padding:10px 14px;margin-bottom:10px;text-align:left">
        <div style="font-size:14px;color:#8a6d1a;font-weight:700">✨ 开头提示：${q.starter || ''}</div>
        ${q.hint ? `<div style="font-size:13px;color:#b0964f;margin-top:4px">💡 ${q.hint}</div>` : ''}
      </div>
      <textarea id="create-input" rows="5" placeholder="把你的想法打字写在这里（至少20个字）…"
        style="width:100%;box-sizing:border-box;font-size:16px;font-family:inherit;padding:10px 12px;border:2.5px solid #cfd8e3;border-radius:12px;resize:vertical;outline:none;line-height:1.6"></textarea>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
        <span id="create-count" style="font-size:12.5px;color:#999;font-weight:600">0 字</span>
        <button class="btn btn-green" id="create-submit" disabled><i class="fas fa-paper-plane"></i> 完成创作</button>
      </div>${footer()}`;
    bindLater();
    const input = document.getElementById('create-input');
    const countEl = document.getElementById('create-count');
    const submitBtn = document.getElementById('create-submit');
    setTimeout(() => input.focus(), 250);
    input.oninput = () => {
      const len = input.value.trim().length;
      countEl.textContent = `${len} 字${len < 20 ? `（再写 ${20 - len} 个字就可以交啦）` : ' ✔'}`;
      submitBtn.disabled = len < 20;
    };
    let done = false;
    submitBtn.onclick = () => {
      if (done) return; done = true;
      const text = input.value.trim();
      input.disabled = true; submitBtn.disabled = true;
      input.style.borderColor = '#3ab54a'; input.style.background = '#f2fbf3';
      const result = Game.submitWriting(dq, q, text);
      const resultEl = document.getElementById('quiz-result');
      resultEl.innerHTML = `<span style="color:#237841">🎉 真棒的想象力！作品已收进「我的作品集」，奖励 💰${result.moneyBonus}</span>
        <br><span style="font-size:13px;color:#888;font-weight:600">爸爸妈妈可以在设置→家长区 看到你的作品哦</span>`;
      UI.confetti(16);
      renderAfterActions(dq, r);
    };
  }

  // 创作题提交后的后续按钮（复用 finish 中的逻辑）
  function renderAfterActions(dq, r) {
    const actions = document.getElementById('quiz-actions');
    actions.innerHTML = '';
    if (Game.canAsk(r.id)) {
      const againBtn = document.createElement('button');
      againBtn.className = 'btn btn-blue';
      againBtn.innerHTML = `<i class="fas fa-rotate-right"></i> 再来一题（今天 ${Game.askedCount(r.id)}/${Game.DAILY_LIMIT}）`;
      againBtn.onclick = () => { const ndq = Game.refillQuestion(r.id); if (ndq) start(ndq); else close(); };
      actions.appendChild(againBtn);
    }
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn'; closeBtn.textContent = '关闭'; closeBtn.onclick = close;
    actions.appendChild(closeBtn);
    UI.refreshTop();
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

  window.Quiz = { start, speak, stopSpeak, pauseSpeak, resumeSpeak, isSpeaking, isPaused };
})();
