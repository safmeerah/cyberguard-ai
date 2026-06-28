/* ══════════════════════════════════════════════
   CyberGuard AI — Frontend Logic
   ══════════════════════════════════════════════ */

// ─── Matrix Rain Background ───────────────────
(function initMatrix() {
  const canvas = document.getElementById('matrixCanvas');
  const ctx    = canvas.getContext('2d');
  let cols, drops;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols  = Math.floor(canvas.width / 16);
    drops = Array(cols).fill(1);
  }

  function draw() {
    ctx.fillStyle = 'rgba(5, 11, 20, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff88';
    ctx.font      = '13px Share Tech Mono';

    const chars = '01アイウエオカキクケコサシスセソタチ@#$%&ABCDEF';
    for (let i = 0; i < drops.length; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(ch, i * 16, drops[i] * 16);
      if (drops[i] * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }

  window.addEventListener('resize', resize);
  resize();
  setInterval(draw, 60);
})();


// ─── Connection Status Check ──────────────────
async function checkConnection() {
  const badge     = document.getElementById('aiBadge');
  const badgeText = document.getElementById('aiBadgeText');
  const banner    = document.getElementById('connBanner');
  const bannerMsg = document.getElementById('connBannerText');

  try {
    const res  = await fetch('/api/status');
    const data = await res.json();
    if (data.ok) {
      badge.classList.remove('offline');
      badgeText.textContent = 'Meta Llama 3.1 · Online';
      banner.style.display  = 'none';
    } else {
      badge.classList.add('offline');
      badgeText.textContent = 'API Offline';
      bannerMsg.textContent = 'Cannot reach Hugging Face: ' + data.reason;
      banner.style.display  = 'flex';
    }
  } catch (err) {
    badge.classList.add('offline');
    badgeText.textContent = 'API Offline';
    bannerMsg.textContent = 'Network error — cannot reach the Hugging Face API.';
    banner.style.display  = 'flex';
  }
}

document.getElementById('connRetry').addEventListener('click', checkConnection);
checkConnection();


// ─── Tab Navigation ───────────────────────────
(function initTabs() {
  const navBtns   = document.querySelectorAll('.nav-btn:not(.nav-btn-soon)');
  const panels    = document.querySelectorAll('.tab-panel');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('tab-' + target);
      if (panel) panel.classList.add('active');
    });
  });

  // Coming Soon tabs — show their panel but don't mark as "active" in nav
  document.querySelectorAll('.nav-btn-soon').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('tab-' + target);
      if (panel) panel.classList.add('active');
    });
  });
})();


// ─── Utility: Format AI text into readable HTML ─
function formatAIText(text) {
  // Bold **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Numbered lists
  text = text.replace(/^\d+\.\s+/gm, '<br><strong>$&</strong>');
  // Bullets
  text = text.replace(/^[-•]\s+/gm, '<br>• ');
  // Line breaks
  text = text.replace(/\n{2,}/g, '<br><br>');
  text = text.replace(/\n/g, '<br>');
  return text.trim();
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


// ══════════════════════════════════════════════
// TAB 1: AI Chat
// ══════════════════════════════════════════════
(function initChat() {
  const messagesEl = document.getElementById('chatMessages');
  const inputEl    = document.getElementById('chatInput');
  const sendBtn    = document.getElementById('sendBtn');
  const quickBtns  = document.querySelectorAll('#tab-chat .quick-btn');

  let chatHistory = [];
  let isLoading   = false;

  function appendMessage(role, text, isHTML = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `message ${role === 'user' ? 'user-message' : 'ai-message'}`;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = role === 'user' ? 'YOU' : 'AI';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    const body = document.createElement('p');
    if (isHTML) {
      body.innerHTML = text;
    } else {
      body.textContent = text;
    }

    const time = document.createElement('span');
    time.className = 'msg-time';
    time.textContent = timestamp();

    bubble.appendChild(body);
    bubble.appendChild(time);
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function appendTyping() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message ai-message';
    wrapper.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = 'AI';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  async function sendMessage(text) {
    if (isLoading || !text.trim()) return;
    isLoading = true;
    sendBtn.disabled = true;

    appendMessage('user', text);
    chatHistory.push({ role: 'user', content: text });
    inputEl.value = '';
    appendTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: chatHistory.slice(-12) }),
      });
      const data = await res.json();
      removeTyping();

      if (data.error) {
        appendMessage('ai', '⚠ ' + data.error);
      } else if (data.response && data.response.startsWith('NETWORK_ERROR:')) {
        const clean = data.response.replace('NETWORK_ERROR: ', '');
        appendMessage('ai', formatAIText(clean), true);
        checkConnection();
      } else {
        appendMessage('ai', formatAIText(data.response), true);
        chatHistory.push({ role: 'assistant', content: data.response });
      }
    } catch (err) {
      removeTyping();
      appendMessage('ai', '⚠ Network error. Please check your connection and try again.');
    }

    isLoading = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

  sendBtn.addEventListener('click', () => sendMessage(inputEl.value.trim()));
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(inputEl.value.trim()); });
  quickBtns.forEach(btn => btn.addEventListener('click', () => sendMessage(btn.dataset.q)));
})();


// ══════════════════════════════════════════════
// TAB 2: Threat Library
// ══════════════════════════════════════════════
(function initThreats() {
  const cards       = document.querySelectorAll('.threat-card');
  const resultEl    = document.getElementById('threatResult');
  const resultTitle = document.getElementById('threatResultTitle');
  const resultBody  = document.getElementById('threatResultBody');
  const closeBtn    = document.getElementById('closeThreat');

  let active = null;

  async function analyzeThreat(threatName, card) {
    if (active === threatName) return;
    active = threatName;

    cards.forEach(c => c.style.borderColor = '');
    card.style.borderColor = 'var(--accent)';

    resultTitle.textContent = threatName;
    resultBody.innerHTML = '<div class="loading-block"><div class="spinner"></div><span>Analyzing threat…</span></div>';
    resultEl.style.display = 'block';
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try {
      const res  = await fetch('/api/threat-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threat: threatName }),
      });
      const data = await res.json();
      resultBody.innerHTML = formatAIText(data.analysis || data.error || 'No response received.');
    } catch (err) {
      resultBody.innerHTML = '⚠ Failed to fetch analysis. Please try again.';
    }
  }

  cards.forEach(card => {
    card.addEventListener('click', () => analyzeThreat(card.dataset.threat, card));
  });

  closeBtn.addEventListener('click', () => {
    resultEl.style.display = 'none';
    active = null;
    cards.forEach(c => c.style.borderColor = '');
  });
})();


// ══════════════════════════════════════════════
// TAB 3: Security Quiz
// ══════════════════════════════════════════════
(function initQuiz() {
  const newQuestionBtn = document.getElementById('newQuestionBtn');
  const nextBtn        = document.getElementById('nextQuestionBtn');
  const topicSelect    = document.getElementById('quizTopic');
  const quizCard       = document.getElementById('quizCard');
  const quizLoading    = document.getElementById('quizLoading');
  const quizContent    = document.getElementById('quizContent');
  const quizQuestion   = document.getElementById('quizQuestion');
  const quizOptions    = document.getElementById('quizOptions');
  const quizFeedback   = document.getElementById('quizFeedback');
  const scoreEl        = document.getElementById('quizScore');
  const totalEl        = document.getElementById('quizTotal');
  const resetBtn       = document.getElementById('resetScore');
  const startPrompt    = document.getElementById('quizStartPrompt');

  let score = 0, total = 0;

  resetBtn.addEventListener('click', () => { score = 0; total = 0; scoreEl.textContent = 0; totalEl.textContent = 0; });

  async function loadQuestion() {
    const topic = topicSelect.value;
    startPrompt.style.display = 'none';
    quizCard.style.display = 'block';
    quizLoading.style.display = 'flex';
    quizContent.style.display = 'none';
    nextBtn.style.display = 'none';
    quizFeedback.style.display = 'none';

    try {
      const res  = await fetch(`/api/quiz?topic=${encodeURIComponent(topic)}`);
      const data = await res.json();

      quizLoading.style.display = 'none';
      quizContent.style.display = 'block';

      if (data.parse_error || !data.question) {
        quizQuestion.textContent = 'Could not parse quiz question. Please try again.';
        quizOptions.innerHTML = '';
        return;
      }

      quizQuestion.textContent = data.question;
      quizOptions.innerHTML = '';

      const optKeys = ['A', 'B', 'C', 'D'];
      const options = data.options || {};

      optKeys.forEach(key => {
        if (!options[key]) return;
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.innerHTML = `<span class="opt-key">${key}</span><span>${options[key]}</span>`;
        btn.dataset.key = key;

        btn.addEventListener('click', () => {
          const allOpts = quizOptions.querySelectorAll('.quiz-option');
          allOpts.forEach(o => { o.disabled = true; });

          total++;
          if (key === data.correct) {
            btn.classList.add('correct');
            score++;
            quizFeedback.className = 'quiz-feedback correct-fb';
            quizFeedback.innerHTML = `<strong>✓ Correct!</strong> ${data.explanation || ''}`;
          } else {
            btn.classList.add('wrong');
            const correctBtn = quizOptions.querySelector(`[data-key="${data.correct}"]`);
            if (correctBtn) correctBtn.classList.add('correct');
            quizFeedback.className = 'quiz-feedback wrong-fb';
            quizFeedback.innerHTML = `<strong>✗ Incorrect.</strong> The correct answer is <strong>${data.correct}</strong>. ${data.explanation || ''}`;
          }

          scoreEl.textContent = score;
          totalEl.textContent = total;
          quizFeedback.style.display = 'block';
          nextBtn.style.display = 'inline-flex';
        });

        quizOptions.appendChild(btn);
      });
    } catch (err) {
      quizLoading.style.display = 'none';
      quizContent.style.display = 'block';
      quizQuestion.textContent = '⚠ Failed to load question. Please try again.';
      quizOptions.innerHTML = '';
    }
  }

  newQuestionBtn.addEventListener('click', loadQuestion);
  nextBtn.addEventListener('click', loadQuestion);
})();


// ══════════════════════════════════════════════
// TAB 4: Password Strength Checker
// ══════════════════════════════════════════════
(function initPasswordChecker() {
  const pwInput    = document.getElementById('pwInput');
  const pwToggle   = document.getElementById('pwToggle');
  const fill       = document.getElementById('strengthFill');
  const label      = document.getElementById('strengthLabel');
  const statsEl    = document.getElementById('pwStats');
  const tipEl      = document.getElementById('pwTip');

  const COMMON = new Set([
    'password','123456','password1','12345678','qwerty','abc123','monkey','1234567',
    'letmein','trustno1','dragon','baseball','iloveyou','master','sunshine','ashley',
    'bailey','passw0rd','shadow','123123','654321','superman','qazwsx','michael','football'
  ]);

  const criteria = {
    length:   { el: document.getElementById('crit-length'),   test: p => p.length >= 12 },
    upper:    { el: document.getElementById('crit-upper'),    test: p => /[A-Z]/.test(p) },
    lower:    { el: document.getElementById('crit-lower'),    test: p => /[a-z]/.test(p) },
    number:   { el: document.getElementById('crit-number'),   test: p => /[0-9]/.test(p) },
    special:  { el: document.getElementById('crit-special'),  test: p => /[^A-Za-z0-9]/.test(p) },
    nocommon: { el: document.getElementById('crit-nocommon'), test: p => !COMMON.has(p.toLowerCase()) },
  };

  function entropy(p) {
    let pool = 0;
    if (/[a-z]/.test(p)) pool += 26;
    if (/[A-Z]/.test(p)) pool += 26;
    if (/[0-9]/.test(p)) pool += 10;
    if (/[^A-Za-z0-9]/.test(p)) pool += 32;
    return pool > 0 ? (p.length * Math.log2(pool)).toFixed(1) : 0;
  }

  function crackTime(entropyBits) {
    const guessesPerSec = 1e10;
    const seconds = Math.pow(2, entropyBits) / guessesPerSec;
    if (seconds < 1)         return 'Instant';
    if (seconds < 60)        return `${seconds.toFixed(0)} seconds`;
    if (seconds < 3600)      return `${(seconds / 60).toFixed(0)} minutes`;
    if (seconds < 86400)     return `${(seconds / 3600).toFixed(0)} hours`;
    if (seconds < 2592000)   return `${(seconds / 86400).toFixed(0)} days`;
    if (seconds < 31536000)  return `${(seconds / 2592000).toFixed(0)} months`;
    if (seconds < 3153600000)return `${(seconds / 31536000).toFixed(0)} years`;
    return 'Centuries+';
  }

  function poolSize(p) {
    let pool = 0;
    if (/[a-z]/.test(p)) pool += 26;
    if (/[A-Z]/.test(p)) pool += 26;
    if (/[0-9]/.test(p)) pool += 10;
    if (/[^A-Za-z0-9]/.test(p)) pool += 32;
    return pool;
  }

  const levels = [
    { score: 0, label: '—',        color: 'inherit' },
    { score: 1, label: 'Very Weak', color: 'var(--danger)' },
    { score: 2, label: 'Weak',      color: '#ff8800' },
    { score: 3, label: 'Fair',      color: 'var(--warn)' },
    { score: 4, label: 'Strong',    color: '#88ff00' },
    { score: 5, label: 'Very Strong', color: 'var(--accent)' },
  ];

  pwToggle.addEventListener('click', () => {
    const isText = pwInput.type === 'text';
    pwInput.type = isText ? 'password' : 'text';
    pwToggle.textContent = isText ? '👁' : '🙈';
  });

  pwInput.addEventListener('input', () => {
    const pw = pwInput.value;

    if (!pw) {
      fill.dataset.level = 0;
      label.textContent = '—';
      label.style.color = 'var(--text-mid)';
      statsEl.style.display = 'none';
      tipEl.style.display = 'none';
      Object.values(criteria).forEach(c => {
        c.el.classList.remove('pass', 'fail');
        c.el.querySelector('.crit-icon').textContent = '○';
      });
      return;
    }

    let passCount = 0;
    Object.entries(criteria).forEach(([, c]) => {
      const ok = c.test(pw);
      c.el.classList.toggle('pass', ok);
      c.el.classList.toggle('fail', !ok);
      c.el.querySelector('.crit-icon').textContent = ok ? '✓' : '✗';
      if (ok) passCount++;
    });

    const lvl = Math.min(passCount, 5);
    fill.dataset.level = lvl;
    const levelInfo = levels[lvl];
    label.textContent = levelInfo.label;
    label.style.color  = levelInfo.color;

    const ent  = entropy(pw);
    const pool = poolSize(pw);
    document.getElementById('statEntropy').textContent   = `${ent} bits`;
    document.getElementById('statLength').textContent    = `${pw.length} chars`;
    document.getElementById('statCrackTime').textContent = crackTime(parseFloat(ent));
    document.getElementById('statPool').textContent      = `${pool} chars`;
    statsEl.style.display = 'grid';

    if (lvl <= 2) {
      tipEl.style.display = 'block';
      tipEl.textContent = lvl <= 1
        ? '⚠ This password is extremely weak — do not use it.'
        : '⚠ Try adding uppercase letters, numbers, and symbols to strengthen it.';
    } else {
      tipEl.style.display = 'none';
    }
  });
})();


// ══════════════════════════════════════════════
// TAB 5: URL Analyzer
// ══════════════════════════════════════════════
(function initURLAnalyzer() {
  const urlInput   = document.getElementById('urlInput');
  const analyzeBtn = document.getElementById('analyzeUrlBtn');
  const resultEl   = document.getElementById('urlResult');
  const resultBody = document.getElementById('urlResultBody');
  const loadingEl  = document.getElementById('urlLoading');

  async function analyze() {
    const url = urlInput.value.trim();
    if (!url) return;

    resultEl.style.display  = 'none';
    loadingEl.style.display = 'flex';
    analyzeBtn.disabled     = true;

    try {
      const res  = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      loadingEl.style.display = 'none';
      resultEl.style.display  = 'block';
      resultBody.innerHTML    = formatAIText(data.analysis || data.error || 'No response.');
    } catch (err) {
      loadingEl.style.display = 'none';
      resultEl.style.display  = 'block';
      resultBody.textContent  = '⚠ Network error. Please try again.';
    }
    analyzeBtn.disabled = false;
  }

  analyzeBtn.addEventListener('click', analyze);
  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') analyze(); });
})();


// ══════════════════════════════════════════════
// TAB 6: CVE Lookup
// ══════════════════════════════════════════════
(function initCVELookup() {
  const cveInput   = document.getElementById('cveInput');
  const lookupBtn  = document.getElementById('lookupCveBtn');
  const resultEl   = document.getElementById('cveResult');
  const resultTitle= document.getElementById('cveResultTitle');
  const resultBody = document.getElementById('cveResultBody');
  const loadingEl  = document.getElementById('cveLoading');
  const examples   = document.querySelectorAll('.cve-examples .quick-btn');

  async function lookup(cve) {
    if (!cve) return;
    cveInput.value = cve;

    resultEl.style.display  = 'none';
    loadingEl.style.display = 'flex';
    lookupBtn.disabled      = true;

    try {
      const res  = await fetch('/api/explain-cve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cve }),
      });
      const data = await res.json();
      loadingEl.style.display = 'none';
      resultEl.style.display  = 'block';
      resultTitle.textContent = data.cve || cve;
      resultBody.innerHTML    = formatAIText(data.explanation || data.error || 'No response.');
    } catch (err) {
      loadingEl.style.display = 'none';
      resultEl.style.display  = 'block';
      resultBody.textContent  = '⚠ Network error. Please try again.';
    }
    lookupBtn.disabled = false;
  }

  lookupBtn.addEventListener('click', () => lookup(cveInput.value.trim()));
  cveInput.addEventListener('keydown', e => { if (e.key === 'Enter') lookup(cveInput.value.trim()); });
  examples.forEach(btn => btn.addEventListener('click', () => lookup(btn.dataset.cve)));
})();


// ══════════════════════════════════════════════
// TAB 7: Daily Tips
// ══════════════════════════════════════════════
(function initTips() {
  const tipContent = document.getElementById('tipContent');
  const tipDate    = document.getElementById('tipDate');
  const newTipBtn  = document.getElementById('newTipBtn');

  async function loadTip() {
    tipContent.innerHTML = '<div class="loading-block"><div class="spinner"></div><span>Generating tip…</span></div>';
    newTipBtn.disabled   = true;

    try {
      const res  = await fetch('/api/security-tip');
      const data = await res.json();
      tipDate.textContent    = data.date || '';
      tipContent.innerHTML   = formatAIText(data.tip || '⚠ Could not load tip.');
    } catch (err) {
      tipContent.textContent = '⚠ Network error. Please try again.';
    }
    newTipBtn.disabled = false;
  }

  newTipBtn.addEventListener('click', loadTip);
  loadTip(); // auto-load on page ready
})();
