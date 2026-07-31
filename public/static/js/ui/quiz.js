/* ============================================================
 * 答题界面：居民提问 → 选择答案 → 结果反馈(讲解/升级/礼物)
 * ============================================================ */
(function () {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal-box');

  function start(dq) {
    const r = Game.state.residents.find(x => x.id === dq.residentId);
    const q = Game.drawFor(dq);
    const subName = Questions.SUBJECT_NAMES[q.subject];
    const subIcon = Questions.SUBJECT_ICONS[q.subject];
    const keys = ['A', 'B', 'C', 'D'];

    modal.innerHTML = `
      <div class="quiz-head">
        ${UI.minifigSVG(r, 0.9)}
        <div>
          <div style="font-size:18px;font-weight:800">${r.name} 有问题请教市长！</div>
          <div class="q-sub"><i class="fas ${subIcon}"></i> ${subName}题 · 连对 <b>${r.streak}</b> 题 <i class="fas fa-fire" style="color:#ffcf6a"></i></div>
        </div>
      </div>
      <div class="quiz-body">
        <div class="quiz-q">${q.q}</div>
        <div class="quiz-opts">
          ${q.opts.map((o, i) => `<button class="quiz-opt" data-i="${i}"><span class="opt-key">${keys[i]}</span><span>${o}</span></button>`).join('')}
        </div>
        <div class="quiz-result" id="quiz-result"></div>
      </div>
      <div class="modal-actions" id="quiz-actions">
        <button class="btn" id="quiz-later">待会再答</button>
      </div>`;
    overlay.style.display = 'flex';

    let answered = false;
    document.getElementById('quiz-later').onclick = () => { overlay.style.display = 'none'; };

    modal.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        const pick = +btn.dataset.i;
        const correct = pick === q.a;
        // 标色
        modal.querySelectorAll('.quiz-opt').forEach((b, i) => {
          if (i === q.a) b.classList.add('right');
          else if (i === pick && !correct) b.classList.add('wrong');
          b.style.pointerEvents = 'none';
        });

        const result = Game.answer(dq, q, correct);
        const resultEl = document.getElementById('quiz-result');
        const actions = document.getElementById('quiz-actions');

        if (correct) {
          resultEl.innerHTML = `<span style="color:#237841">🎉 答对啦！奖励 💰${result.moneyBonus} · ${r.name}的连对：${r.streak}</span>`;
          UI.confetti(12);
        } else {
          resultEl.innerHTML = `<span style="color:#c22a24">😢 答错了，连对中断了</span><br>
            <span style="font-size:14px;color:#666;font-weight:600">💡 ${q.tip || '再想想哦'}</span>`;
        }
        if (correct && q.tip) {
          resultEl.innerHTML += `<br><span style="font-size:13.5px;color:#888;font-weight:600">💡 ${q.tip}</span>`;
        }

        actions.innerHTML = '';
        // 升级提示
        if (result.leveledUp) {
          const c = result.newCareer;
          setTimeout(() => {
            UI.toast(`🎊 ${r.name} 升级啦！新头衔：${c.icon}${c.title}（周薪${c.salary}元）`, 'gold');
            UI.confetti(24);
          }, 500);
        }
        // 礼物提示
        if (result.gift) {
          setTimeout(() => {
            UI.toast(`🎁 ${r.name} 送你「${result.gift.name}」！去礼物盒看看吧`, 'gold');
            UI.confetti(30);
          }, 1100);
        }

        const remaining = Game.pendingQuestions();
        const nextBtn = document.createElement('button');
        if (remaining.length) {
          nextBtn.className = 'btn btn-blue';
          nextBtn.innerHTML = `<i class="fas fa-forward"></i> 下一位居民（还有${remaining.length}人）`;
          nextBtn.onclick = () => start(remaining[0]);
        } else {
          nextBtn.className = 'btn btn-green';
          nextBtn.innerHTML = '✅ 今天的问题都答完啦';
          nextBtn.onclick = () => { overlay.style.display = 'none'; };
        }
        actions.appendChild(nextBtn);
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn';
        closeBtn.textContent = '关闭';
        closeBtn.onclick = () => { overlay.style.display = 'none'; };
        actions.appendChild(closeBtn);

        UI.refreshTop();
      };
    });
  }

  window.Quiz = { start };
})();
