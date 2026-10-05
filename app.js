/* 천 년 전 편지의 비밀 — 화면 전환과 활동 동작 */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const app = $('#app');
  const KEY = 'silla-letter-v1';

  // ---------- 상태 ----------
  const state = { done: [false, false, false, false, false], solved: {}, classSize: 14, sound: true, unlockAll: false };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* 저장소를 못 써도 수업은 진행 */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ } };
  let picked = [];
  let view = { name: 'cover' };

  // ---------- 소리 ----------
  let actx;
  function tone(freqs, dur) {
    if (!state.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        const t = actx.currentTime + i * (dur || 0.12);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.12) * 1.8);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + (dur || 0.12) * 2);
      });
    } catch (e) { /* 소리 없이 진행 */ }
  }
  const sfx = {
    ok: () => tone([660, 880]), no: () => tone([220, 180], 0.1), tap: () => tone([520], 0.06),
    open: () => tone([523, 659, 784, 1047], 0.16)
  };

  // ---------- 공통 ----------
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const starTotal = () => Object.keys(state.solved).length;
  const allDone = () => state.done.every(Boolean);
  const letterPara = (i, open) => LETTER.paras[i].replace(/\[\[(.+?)\]\]/, (m, k) => open ? `<mark>${k}</mark>` : `<span class="hole">${'?'.repeat(Math.max(2, k.replace(/ /g, '').length))}</span>`);

  function letterHTML(revealFrom) {
    return `<div class="letter paper">
      <p class="l-to">${LETTER.to}</p>
      ${LETTER.paras.map((p, i) => `<p class="l-para ${state.done[i] ? 'on' : 'off'}">${state.done[i] ? letterPara(i, true) : letterPara(i, false)}</p>`).join('')}
      <p class="l-from">${revealFrom ? LETTER.from : '보낸 사람: <span class="hole">???</span>'}</p>
    </div>`;
  }

  function go(v) { view = v; render(); window.scrollTo(0, 0); }

  function render() {
    $('#topbar').hidden = view.name === 'cover';
    $('#starCount').textContent = starTotal();
    $('#btnSound').textContent = state.sound ? '🔔' : '🔕';
    $('#sealsMini').innerHTML = SEALS.map((s, i) => `<span class="${state.done[i] ? 'on' : ''}" title="${s.title}">${state.done[i] ? s.icon : '🔒'}</span>`).join('');
    ({ cover, prologue, hub, seal, unseal, finale })[view.name]();
  }

  // ---------- 표지 · 프롤로그 ----------
  function cover() {
    app.innerHTML = `<section class="cover">
      <p class="eyebrow">5학년 2학기 사회 · 고대 사람들의 생각과 생활 모습</p>
      <h1>천 년 전<br><em>편지</em>의 비밀</h1>
      <p class="lead">통일 신라의 발전과 사람들의 생활 모습을 알아볼까요</p>
      <img class="cover-img" src="img/dabotap.png" alt="불국사 다보탑">
      <button class="btn big" data-go="prologue">탐험 시작하기</button>
      ${starTotal() ? '<button class="btn ghost" data-go="hub">이어서 하기</button>' : ''}
    </section>`;
  }

  function prologue() {
    app.innerHTML = `<section class="stage">
      <div class="story">
        <h2>경주의 옛 탑에서 편지 한 통이 발견되었다!</h2>
        <p>그런데… 천 년의 세월 동안 먹물이 번져 중요한 낱말을 읽을 수가 없습니다.<br>
        편지는 <b>다섯 개의 봉인</b>으로 잠겨 있고, 봉인을 풀 때마다 글이 한 단락씩 되살아납니다.</p>
      </div>
      ${letterHTML(false)}
      <div class="mission paper">
        <span class="tag">오늘의 임무</span>
        <strong>다섯 개의 봉인을 풀어 편지를 복원하고, 통일 신라의 발전과 사람들의 생활 모습을 알아봅시다.</strong>
      </div>
      <div class="stage-nav"><span></span><button class="btn big" data-go="hub">봉인 지도로 ▶</button></div>
    </section>`;
  }

  // ---------- 봉인 지도 ----------
  function hub() {
    const next = state.done.indexOf(false);
    app.innerHTML = `<section class="stage">
      <div class="story"><h2>봉인 지도</h2><p>${allDone() ? '모든 봉인이 풀렸습니다! 이제 편지를 완성해 봅시다.' : '빛나는 봉인을 눌러 비밀을 풀어 보세요.'}</p></div>
      <div class="sealmap">
        ${SEALS.map((s, i) => {
          const open = state.unlockAll || i <= next || next === -1;
          return `<button class="seal ${state.done[i] ? 'done' : ''} ${i === next ? 'now' : ''}" ${open ? '' : 'disabled'} data-seal="${i}">
            <span class="s-num">${s.review ? '복습' : '새로운 배움'}</span>
            <span class="s-icon">${open ? s.icon : '🔒'}</span>
            <span class="s-title">${i + 1}. ${s.title}</span>
            <span class="s-key">${state.done[i] ? s.key : '?'}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="stage-nav">
        <button class="btn ghost" data-act="letter">📜 지금까지 복원된 편지</button>
        ${allDone() ? '<button class="btn big glow" data-go="finale">편지 완성하기 ✨</button>' : '<span></span>'}
      </div>
    </section>`;
  }

  // ---------- 봉인 풀기(활동) ----------
  function seal() {
    const s = SEALS[view.i], st = s.steps[view.step], sid = `${view.i}-${view.step}`;
    const isReview = st.review === undefined ? s.review : st.review;
    const media = st.img && !st.imgAfter ? `<figure class="media ${st.imgTall ? 'tall' : ''} ${st.imgSmall ? 'small' : ''}"><img src="img/${st.img}" alt=""></figure>` : '';
    app.innerHTML = `<section class="stage">
      <div class="stage-head">
        <span class="tag ${isReview ? '' : 'new'}">${isReview ? '복습' : '새로운 배움'}</span>
        <b>봉인 ${view.i + 1}. ${s.title}</b>
        <span class="dots">${s.steps.map((_, k) => `<i class="${k === view.step ? 'cur' : ''} ${state.solved[`${view.i}-${k}`] ? 'ok' : ''}"></i>`).join('')}</span>
      </div>
      <div class="card paper ${media ? 'has-media' : ''}">
        ${media}
        <div class="work">
          <h3 class="q">${st.q}</h3>
          ${st.quote ? `<blockquote>${st.quote}</blockquote>` : ''}
          <div id="body"></div>
          <div class="fb" id="fb" hidden></div>
        </div>
      </div>
      <div class="stage-nav">
        <button class="btn ghost" data-act="prev">◀ 이전</button>
        <button class="btn big" id="btnNext" data-act="next">${view.step === s.steps.length - 1 ? '봉인 풀기 🔓' : '다음 ▶'}</button>
      </div>
    </section>`;
    const body = $('#body'), fb = $('#fb');
    const solve = (extraHtml) => {
      if (!state.solved[sid]) { state.solved[sid] = 1; save(); $('#starCount').textContent = starTotal(); }
      fb.hidden = false; fb.className = 'fb good';
      fb.innerHTML = `<span class="stamp">⭐ 해결!</span> ${st.explain || ''}${extraHtml || ''}`;
      $('#btnNext').classList.add('glow');
      $$('.dots i')[view.step].classList.add('ok');
      sfx.ok();
    };
    const miss = (msg) => { fb.hidden = false; fb.className = 'fb bad'; fb.textContent = msg || '다시 한번 생각해 봐요!'; sfx.no(); };
    STEP[st.type](st, body, solve, miss);
  }

  const STEP = {
    choice(st, body, solve, miss) {
      body.innerHTML = `<div class="opts ${st.poll ? 'poll' : ''} ${st.opts.length >= 4 ? 'two' : ''}">${st.opts.map((o, i) => `<button class="opt" data-i="${i}">${o.t}</button>`).join('')}</div>`;
      body.onclick = e => {
        const b = e.target.closest('.opt'); if (!b) return;
        const o = st.opts[+b.dataset.i];
        if (st.poll) { $$('.opt', body).forEach(x => x.classList.remove('picked')); b.classList.add('picked'); solve(); return; }
        if (o.ok) { b.classList.add('right'); $$('.opt', body).forEach(x => x.disabled = true); solve(); }
        else { b.classList.add('wrong'); b.disabled = true; miss(o.fb); }
      };
    },
    order(st, body, solve, miss) {
      let n = 0;
      body.innerHTML = `<ol class="slots">${st.items.map(() => '<li></li>').join('')}</ol>
        <div class="chips">${shuffle(st.items.map((t, i) => ({ t, i }))).map(c => `<button class="chip" data-i="${c.i}">${c.t}</button>`).join('')}</div>`;
      body.onclick = e => {
        const b = e.target.closest('.chip'); if (!b) return;
        if (+b.dataset.i === n) {
          $$('.slots li', body)[n].textContent = st.items[n]; $$('.slots li', body)[n].classList.add('fill');
          b.remove(); n++; sfx.tap();
          if (n === st.items.length) solve();
        } else { b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 500); miss('아직 차례가 아니에요. 그 전에 무슨 일이 있었을까요?'); }
      };
    },
    blank(st, body, solve, miss) {
      const answers = []; let n = 0;
      const html = st.text.replace(/\[\[(.+?)\]\]/g, (m, k) => { answers.push(k); return `<span class="hole big" data-k="${answers.length - 1}">?</span>`; });
      body.innerHTML = `<blockquote class="source">${html}<cite>『삼국유사』</cite></blockquote>
        <div class="chips">${st.bank.map(w => `<button class="chip">${w}</button>`).join('')}</div>`;
      body.onclick = e => {
        const b = e.target.closest('.chip'); if (!b) return;
        if (b.textContent === answers[n]) {
          const h = $(`.hole[data-k="${n}"]`, body); h.textContent = answers[n]; h.classList.add('fill');
          b.remove(); n++; sfx.tap();
          if (n === answers.length) solve();
        } else { b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 500); miss(`${n + 1}번째 빈칸에 어울리지 않아요. 별처럼, 기러기처럼 많은 것은?`); }
      };
    },
    sort(st, body, solve, miss) {
      let n = 0; const items = shuffle(st.items);
      const show = () => {
        body.innerHTML = `<p class="count">${n + 1} / ${items.length}</p>
          <div class="sort-item">${items[n][0]}</div>
          <div class="opts ${st.buckets.length === 2 ? 'two' : 'three'}">${st.buckets.map((b, i) => `<button class="opt" data-i="${i}">${b}</button>`).join('')}</div>
          <ul class="sorted">${items.slice(0, n).map(it => `<li><b>${st.buckets[it[1]]}</b> ${it[0]}</li>`).join('')}</ul>`;
      };
      show();
      body.onclick = e => {
        const b = e.target.closest('.opt'); if (!b) return;
        if (+b.dataset.i === items[n][1]) {
          n++; sfx.tap();
          if (n === items.length) {
            body.innerHTML = `<ul class="sorted">${items.map(it => `<li><b>${st.buckets[it[1]]}</b> ${it[0]}</li>`).join('')}</ul>`;
            solve();
          } else show();
        } else { b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 500); miss(); }
      };
    },
    gallery(st, body, solve) {
      let seen = 0;
      body.innerHTML = `<div class="gallery">${st.cards.map(c => `<button class="flip"><img src="img/${c.img}" alt=""><span>눌러서 확인</span><b>${c.t}</b></button>`).join('')}</div>`;
      body.onclick = e => {
        const b = e.target.closest('.flip'); if (!b || b.classList.contains('on')) return;
        b.classList.add('on'); sfx.tap();
        if (++seen === st.cards.length) solve();
      };
    },
    talk(st, body, solve) {
      let seen = 0;
      body.innerHTML = `<p class="say">${st.html}</p>
        ${st.reveals.map((r, i) => `<div class="reveal"><button class="reveal-btn" data-i="${i}">🔍 ${r.label}</button><div class="reveal-body" hidden>${r.html}${r.img ? `<img src="img/${r.img}" alt="">` : ''}</div></div>`).join('')}`;
      body.onclick = e => {
        const b = e.target.closest('.reveal-btn'); if (!b || b.disabled) return;
        b.disabled = true; b.nextElementSibling.hidden = false; sfx.tap();
        if (++seen === st.reveals.length) solve();
      };
    },
    clues(st, body, solve) {
      let n = 0;
      body.innerHTML = `<ol class="clues">${st.clues.map((c, i) => `<li class="clue"><button data-i="${i}" ${i ? 'disabled' : ''}>단서 ${i + 1} 열기</button><span hidden>${c}</span></li>`).join('')}</ol>
        <button class="btn answer" id="ansBtn" disabled>정답 공개</button>
        <div class="answer-box" id="ansBox" hidden><span>정답</span><strong>${st.answer}</strong>${st.img ? `<img src="img/${st.img}" alt="">` : ''}</div>`;
      body.onclick = e => {
        const c = e.target.closest('.clue button');
        if (c) {
          c.hidden = true; c.nextElementSibling.hidden = false; sfx.tap(); n++;
          const nx = $(`.clue button[data-i="${n}"]`, body); if (nx) nx.disabled = false;
          $('#ansBtn').disabled = false;
          return;
        }
        if (e.target.id === 'ansBtn') {
          $$('.clue button', body).forEach(b => { b.hidden = true; b.nextElementSibling.hidden = false; });
          e.target.hidden = true; $('#ansBox').hidden = false; solve();
        }
      };
    },
    sea(st, body, solve, miss) {
      body.innerHTML = `<div class="seamap">
        <svg viewBox="0 0 600 380" role="img" aria-label="간단히 나타낸 바닷길 지도">
          <rect width="600" height="380" rx="18" fill="#cfe6ee"/>
          <path d="M0 0H190Q215 60 170 120Q150 170 185 210Q160 280 110 330Q70 370 0 380Z" fill="#e7dcbc"/>
          <path d="M285 0H395Q405 60 390 120Q400 190 385 250Q360 285 320 290Q290 270 300 215Q270 160 290 110Q260 50 285 0Z" fill="#bfd8a0"/>
          <path d="M470 250Q520 215 600 190V330Q540 350 490 330Q455 300 470 250Z" fill="#e7dcbc"/>
          <text x="70" y="150" class="land">당</text><text x="318" y="120" class="land">통일 신라</text><text x="520" y="285" class="land">일본</text>
          <g class="routes" id="routes">
            <path d="M178 200Q250 290 318 312"/><path d="M318 312Q400 345 478 300"/><path d="M318 312Q350 290 372 250"/>
          </g>
          <text class="ship" id="ship" x="230" y="262">⛵</text><text class="ship" id="ship2" x="400" y="335">⛵</text>
        </svg>
        <button class="spot" style="left:55%;top:20%" data-i="0">한주<small>(한강 유역)</small></button>
        <button class="spot" style="left:63%;top:62%" data-i="1">금성<small>(경주)</small></button>
        <button class="spot" style="left:53%;top:84%" data-i="2">완도<small>(남쪽 바다)</small></button>
      </div>`;
      body.onclick = e => {
        const b = e.target.closest('.spot'); if (!b) return;
        if (b.dataset.i === '2') {
          b.classList.add('right'); b.innerHTML = '청해진<small>(완도)</small>';
          $('.seamap', body).classList.add('open');
          solve(`<img class="fb-img" src="img/${st.img}" alt="청해진 유적지(장도)"><small class="cap">청해진 유적지(전라남도 완도 장도)</small>`);
        } else { b.classList.add('wrong'); miss('당과 일본을 오가는 배가 모두 지나가는 길목은 어디일까요?'); }
      };
    }
  };

  // ---------- 봉인 해제 ----------
  function unseal() {
    const s = SEALS[view.i];
    const first = !state.done[view.i];
    state.done[view.i] = true; save();
    app.innerHTML = `<section class="stage center">
      <div class="burst"><span>${s.icon}</span></div>
      <h2 class="unseal-title">봉인 ${view.i + 1} 해제!</h2>
      <p class="keyline">열쇠말 <strong>${s.key}</strong></p>
      <div class="letter paper restored"><p class="l-para on">${letterPara(view.i, true)}</p></div>
      <p class="say">편지의 ${view.i + 1}번째 단락이 되살아났습니다. 함께 소리 내어 읽어 볼까요?</p>
      <div class="stage-nav"><span></span><button class="btn big glow" data-go="${allDone() ? 'finale' : 'hub'}">${allDone() ? '편지 완성하기 ✨' : '봉인 지도로 ▶'}</button></div>
    </section>`;
    $('#sealsMini').children[view.i].className = 'on'; $('#sealsMini').children[view.i].textContent = s.icon;
    if (first) sfx.open();
  }

  // ---------- 마무리: 편지 완성 → 최종 관문 → 배움 노트 ----------
  function finale() {
    const p = view.page || 0;
    if (p === 0) {
      app.innerHTML = `<section class="stage">
        <div class="story"><h2>편지가 모두 복원되었습니다!</h2><p>한 단락씩 함께 읽어 봅시다. 이 편지를 쓴 사람은 누구일까요?</p></div>
        <div id="lt">${letterHTML(false)}</div>
        <div class="keys">${SEALS.map(s => `<span>${s.icon} ${s.key}</span>`).join('')}</div>
        <div class="stage-nav"><button class="btn" id="whoBtn">✉️ 보낸 사람 밝히기</button><button class="btn big" data-fin="1">최종 관문으로 ▶</button></div>
      </section>`;
      $('#whoBtn').onclick = e => { $('#lt').innerHTML = letterHTML(true) + `<p class="fineprint">${LETTER.note}</p>`; e.target.disabled = true; sfx.open(); };
    } else if (p === 1) {
      app.innerHTML = `<section class="stage">
        <div class="story"><h2>최종 관문 · 기억의 다섯 문</h2><p>편지를 지키려면 배운 내용을 기억해야 합니다. 문제를 풀고 카드를 눌러 정답을 확인하세요.</p></div>
        <div class="quiz">${FINAL_QUIZ.map((q, i) => `<div class="qcard paper" data-i="${i}">
          <span class="qn">${i + 1}</span><p>${q.q.replace(/\( ___ \)/g, '<span class="hole">　　</span>')}</p>
          <div class="qa">${q.ox ? '<button class="ox" data-v="O">O</button><button class="ox" data-v="X">X</button>' : '<button class="btn small show">정답 보기</button>'}</div>
          <div class="qans" hidden><b>${q.a}</b>${q.why ? `<small>${q.why}</small>` : ''}</div>
        </div>`).join('')}</div>
        <div class="stage-nav"><button class="btn ghost" data-fin="0">◀ 편지</button><button class="btn big" data-fin="2">배움 노트 ▶</button></div>
      </section>`;
      $('.quiz').onclick = e => {
        const card = e.target.closest('.qcard'); if (!card) return;
        const q = FINAL_QUIZ[+card.dataset.i], ox = e.target.closest('.ox');
        if (ox) { if (ox.dataset.v === q.a) { ox.classList.add('right'); sfx.ok(); } else { ox.classList.add('wrong'); sfx.no(); return; } }
        else if (!e.target.closest('.show')) return; else sfx.ok();
        $('.qans', card).hidden = false; card.classList.add('open');
      };
    } else {
      app.innerHTML = `<section class="stage">
        <div class="story"><h2>배움 노트</h2><p>오늘 찾은 다섯 개의 열쇠말로 통일 신라를 정리해 봅시다.</p></div>
        <div class="note paper">
          <ol>
            <li>신라는 당과 동맹을 맺어 백제·고구려를 무너뜨리고, 당을 몰아내어 <mark>삼국 통일</mark>을 이루었다.</li>
            <li>고구려·백제 사람도 <mark>하나</mark>로 아우르고, 촌락 문서를 만들고 9주를 두는 등 제도를 정비했다.</li>
            <li><mark>불교</mark>가 널리 퍼져 불국사, 석굴암 같은 절과 탑, 불상이 많이 만들어졌다.</li>
            <li>당·일본은 물론 멀리 서역과도 <mark>교류</mark>했다. (혜초, 최치원, 신라방)</li>
            <li>장보고의 <mark>청해진</mark>은 당과 일본을 잇는 해상 무역의 중심지였다.</li>
          </ol>
          <p class="oneline">통일 신라 사람들은 <b>하나로 어우러져</b> <b>불교문화</b>를 꽃피우고 <b>세계와 교류</b>하며 살았습니다.</p>
        </div>
        <div class="mission paper"><span class="tag">다음 시간에는</span><strong>고구려의 옛 땅에 세워진 나라, 발해의 발전과 사람들의 생활 모습을 알아봅시다.</strong></div>
        <div class="stage-nav"><button class="btn ghost" data-fin="1">◀ 최종 관문</button><button class="btn" data-go="hub">봉인 지도</button></div>
      </section>`;
    }
  }

  // ---------- 모달: 편지 · 뽑기 · 설정 ----------
  const modal = $('#modal'), mbox = $('#modalBox');
  function openModal(html) { mbox.innerHTML = html + '<button class="btn close" data-act="close">닫기</button>'; modal.hidden = false; }
  function pickModal() {
    openModal(`<h3>🎲 발표자 뽑기</h3><div class="pick-num" id="pickNum">?</div>
      <p class="fineprint" id="pickInfo">우리 반 ${state.classSize}명 · 뽑힌 번호 ${picked.length}명</p>
      <button class="btn big" id="pickGo">뽑기!</button>`);
    $('#pickGo').onclick = () => {
      if (picked.length >= state.classSize) picked = [];
      const pool = []; for (let i = 1; i <= state.classSize; i++) if (!picked.includes(i)) pool.push(i);
      const win = pool[Math.floor(Math.random() * pool.length)];
      let t = 0; $('#pickGo').disabled = true;
      const iv = setInterval(() => {
        $('#pickNum').textContent = 1 + Math.floor(Math.random() * state.classSize); sfx.tap();
        if (++t > 12) {
          clearInterval(iv); picked.push(win); $('#pickNum').textContent = win; $('#pickNum').classList.add('hit'); sfx.ok();
          $('#pickInfo').textContent = `우리 반 ${state.classSize}명 · 뽑힌 번호 ${picked.length}명`;
          $('#pickGo').disabled = false; setTimeout(() => $('#pickNum') && $('#pickNum').classList.remove('hit'), 600);
        }
      }, 80);
    };
  }
  function setModal() {
    openModal(`<h3>⚙️ 설정</h3>
      <label class="row">우리 반 학생 수 <input type="number" id="setN" min="2" max="40" value="${state.classSize}"></label>
      <label class="row"><input type="checkbox" id="setU" ${state.unlockAll ? 'checked' : ''}> 모든 봉인을 순서 없이 열 수 있게 하기</label>
      <button class="btn danger" id="setR">처음부터 다시 하기(기록 지우기)</button>`);
    $('#setN').onchange = e => { state.classSize = Math.min(40, Math.max(2, +e.target.value || 14)); picked = []; save(); };
    $('#setU').onchange = e => { state.unlockAll = e.target.checked; save(); if (view.name === 'hub') render(); };
    $('#setR').onclick = () => { state.done = [false, false, false, false, false]; state.solved = {}; picked = []; save(); modal.hidden = true; go({ name: 'cover' }); };
  }

  // ---------- 이벤트 ----------
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-go],[data-seal],[data-act],[data-fin]'); if (!t) return;
    if (t.dataset.go) return go({ name: t.dataset.go });
    if (t.dataset.seal) return go({ name: 'seal', i: +t.dataset.seal, step: 0 });
    if (t.dataset.fin) return go({ name: 'finale', page: +t.dataset.fin });
    const a = t.dataset.act;
    if (a === 'close') modal.hidden = true;
    if (a === 'letter') openModal('<h3>📜 지금까지 복원된 편지</h3>' + letterHTML(false));
    if (a === 'next') view.step < SEALS[view.i].steps.length - 1 ? go({ name: 'seal', i: view.i, step: view.step + 1 }) : go({ name: 'unseal', i: view.i });
    if (a === 'prev') view.step > 0 ? go({ name: 'seal', i: view.i, step: view.step - 1 }) : go({ name: 'hub' });
  });
  modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
  $('#btnHome').onclick = () => go({ name: 'hub' });
  $('#btnLetter').onclick = () => openModal('<h3>📜 지금까지 복원된 편지</h3>' + letterHTML(false));
  $('#btnPick').onclick = pickModal;
  $('#btnSet').onclick = setModal;
  $('#btnSound').onclick = () => { state.sound = !state.sound; save(); $('#btnSound').textContent = state.sound ? '🔔' : '🔕'; sfx.tap(); };
  $('#btnFull').onclick = () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); };
  document.addEventListener('keydown', e => {
    if (!modal.hidden) { if (e.key === 'Escape') modal.hidden = true; return; }
    if (view.name !== 'seal' || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') $('[data-act="next"]').click();
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') $('[data-act="prev"]').click();
  });

  // 별 배경
  $('.stars').innerHTML = Array.from({ length: 60 }, () => `<i style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${(Math.random() * 4).toFixed(1)}s;opacity:${(0.3 + Math.random() * 0.7).toFixed(2)}"></i>`).join('');
  render();
})();
