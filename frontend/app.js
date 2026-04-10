/* ============================================================
   TWIN EDU — app.js (v2.5 with Profile & Settings)
   핵심 로직: 탭 전환, 문제 초기화, 정답 판별, 터미널 로그, 모달
   추가: 프로필 관리, AI 엔진 설정, 실시간 싱크 반응
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────
   1. 문제 데이터 (JSON Interface)
────────────────────────────────────────── */
const QUESTIONS = [
  {
    num: '01',
    title: '함수 <em>f(x)</em>가 미분가능하고 <em>f(1) = 2</em>일 때, 다음 극한값을 구하시오.',
    formula: 'lim(h→0) [ f(1+3h) − f(1) ] / h',
    type: '미적분 · 극한과 미분',
    opts: [
      ['① 3f\'(1)', false],
      ['② 2f\'(1)', false],
      ['③ f\'(1)', false],
      ['④ 6', true],
      ['⑤ 4', false],
    ],
    risk: 42,
    reason: '극한의 정의를 이용한 미분 계수 변형 문제입니다. h → 0 에서 3h를 t로 치환하면 lim(t→0) [f(1+t)−f(1)] / (t/3) = 3f\'(1) 임을 인식해야 합니다. 김노드 학생의 경우 치환 단계를 생략하고 직접 계산하려는 패턴이 감지되어 오류 가능성이 있습니다.',
    solutions: [
      '극한의 정의 lim(h→0) [f(a+h)−f(a)]/h = f\'(a) 를 반드시 암기',
      '3h → t 치환 후 분모 분자 동시 변환 연습',
      '유사 유형 5문항 추가 풀이 권장 (미분계수 변형)',
    ]
  },
  {
    num: '02',
    title: '다음 부정적분을 구하시오. (단, C는 적분 상수)',
    formula: '∫ (2x + 1) / √(x² + x + 3) dx',
    type: '미적분 · 치환적분',
    opts: [
      ['① √(x² + x + 3) + C', false],
      ['② 2√(x² + x + 3) + C', true],
      ['③ (x² + x + 3)^(3/2) + C', false],
      ['④ ln|x² + x + 3| + C', false],
      ['⑤ (x + 1/2)√(x² + x + 3) + C', false],
    ],
    risk: 78,
    reason: '분자가 분모 내부 함수의 도함수와 일치하는 패턴을 인식해야 합니다. (x² + x + 3)\' = 2x + 1 이므로 t = x² + x + 3 으로 치환하면 ∫ dt/√t = 2√t + C 가 됩니다. 트윈 분석 결과, 김노드 학생은 분자-분모 도함수 관계 파악 단계에서 평균 3.2분을 소요하며 오답 패턴이 반복됩니다.',
    solutions: [
      '분자가 분모 내 함수의 도함수인지 먼저 확인하는 습관 형성',
      '치환 변수 t 설정 → dt 계산 → 대입 3단계 프로세스 암기',
      '∫ f\'(x)/√f(x) dx = 2√f(x) + C 공식 카드 작성 권장',
    ]
  },
  {
    num: '03',
    title: '등비수열 {aₙ}에서 a₂ = 6, a₅ = 48일 때, 첫째항 a₁의 값을 구하시오.',
    formula: 'a₅ / a₂ = r³ = 8  →  r = 2',
    type: '수열 · 등비수열',
    opts: [
      ['① 1', false],
      ['② 2', false],
      ['③ 3', true],
      ['④ 4', false],
      ['⑤ 6', false],
    ],
    risk: 35,
    reason: '등비수열의 일반항 관계를 이용하는 기본 문제입니다. a₅/a₂ = r³ = 8에서 r = 2를 구하고, a₂ = a₁·r = 6에서 a₁ = 3을 도출합니다. 트윈 분석 결과 이 유형에서 김노드 학생의 정답률은 높으나, 간혹 공비를 잘못 계산하는 경우가 있습니다.',
    solutions: [
      'aₙ = a₁·r^(n-1) 공식을 이용한 비율 계산 연습',
      '두 항의 비를 통해 공비를 먼저 구하는 순서 고정',
      '계산 실수 방지를 위해 검산 단계 추가',
    ]
  },
  {
    num: '04',
    title: '확률변수 X가 정규분포 N(50, 10²)을 따를 때, P(40 ≤ X ≤ 70)의 값을 구하시오. (단, Z는 표준정규분포를 따름)',
    formula: 'P(40 ≤ X ≤ 70) = P(−1 ≤ Z ≤ 2)',
    type: '확률과 통계 · 정규분포',
    opts: [
      ['① P(0 ≤ Z ≤ 1) + P(0 ≤ Z ≤ 2)', true],
      ['② P(0 ≤ Z ≤ 1) − P(0 ≤ Z ≤ 2)', false],
      ['③ 2·P(0 ≤ Z ≤ 1)', false],
      ['④ P(0 ≤ Z ≤ 2) − P(0 ≤ Z ≤ 1)', false],
      ['⑤ P(0 ≤ Z ≤ 3)', false],
    ],
    risk: 65,
    reason: '표준화 공식 Z = (X − μ)/σ 를 적용하고, 정규분포의 대칭성을 이용해 P(−1 ≤ Z ≤ 0) = P(0 ≤ Z ≤ 1) 임을 활용해야 합니다. 트윈 분석 결과, 음수 Z 범위 처리 시 대칭성 적용 오류가 감지되었습니다.',
    solutions: [
      '표준화 Z = (X − μ)/σ 공식 반복 적용 연습',
      '정규분포 대칭성: P(−a ≤ Z ≤ 0) = P(0 ≤ Z ≤ a) 암기',
      '표준정규분포표 읽는 연습 — 범위 분할 방법 정리',
    ]
  },
  {
    num: '05',
    title: '함수 f(x) = x³ − 3x² + k가 극값을 가지지 않도록 하는 정수 k의 최솟값을 구하시오.',
    formula: 'f\'(x) = 3x² − 6x = 3x(x − 2) ≥ 0',
    type: '미적분 · 극값과 미분',
    opts: [
      ['① k = −4', false],
      ['② k = 0', false],
      ['③ k = 1', false],
      ['④ k = 3', false],
      ['⑤ 극값을 가지지 않는 정수 k는 존재하지 않는다', true],
    ],
    risk: 85,
    reason: '이 문제는 함정이 포함된 고난도 문항입니다. f\'(x) = 3x(x−2)이므로 f\'(x) = 0의 근이 x = 0, 2로 항상 존재하며, k값에 관계없이 극값을 가집니다. 트윈 분석 결과, 김노드 학생은 "극값을 가지지 않으려면 판별식 D ≤ 0"이라는 잘못된 접근법을 반복 적용하는 패턴이 강하게 감지됩니다. 이 문제에서 k는 극값 존재 여부에 영향을 미치지 않습니다.',
    solutions: [
      '극값 존재 조건: f\'(x) = 0의 근 존재 + 부호 변화 동시 확인',
      'f\'(x)의 근이 k와 무관함을 먼저 확인하는 습관 형성',
      '판별식 D ≤ 0 조건은 이차함수 f\'(x)가 이차식일 때만 적용',
      '유사 함정 문제 집중 훈련 권장',
    ]
  }
];

/* ──────────────────────────────────────────
   1.5. 서버 연결 설정 (추가됨)
────────────────────────────────────────── */
// config.js가 없을 경우를 대비한 안전장치
const API_BASE_URL = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : "https://node-t696.onrender.com";

async function fetchQuestionsFromServer() {
  if (!API_BASE_URL) return; // 주소 없으면 기존 로컬 데이터 사용
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/questions`);
    const serverData = await response.json();
    
    if (serverData && serverData.length > 0) {
      // 서버에서 받은 데이터로 QUESTIONS 배열을 덮어씌웁니다.
      // 데이터 형식이 EdNet 규격일 경우 매핑 로직이 추가로 필요할 수 있습니다.
      console.log("서버 데이터 로드 완료:", serverData);
      // QUESTIONS.push(...serverData); // 기존 데이터에 추가할 경우
    }
  } catch (error) {
    appendLog('[ERROR] 서버 연결 실패. 로컬 모드로 동작합니다.', 'error');
  }
}

/* ──────────────────────────────────────────
   2. 전역 상태
────────────────────────────────────────── */
let currentQ = 0;
let answered = new Array(QUESTIONS.length).fill(null);
let logQueue = [];
let isTyping = false;
let currentModal = null;

// 설정 상태
let settings = {
  precision: 70,
  dataSource: 'week',
  alerts: { dashboard: true, terminal: false, sound: false },
  syncSensitivity: 60
};

/* ──────────────────────────────────────────
   3. 탭 전환 (switchTab)
────────────────────────────────────────── */
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('tab-' + tabName);
  if (target) target.classList.add('active');

  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    const tabs = ['dashboard', 'simulator', 'report', 'settings'];
    btn.classList.toggle('active', tabs[i] === tabName);
  });

  document.querySelectorAll('.nav-item').forEach((item, i) => {
    const tabs = ['dashboard', 'simulator', 'report', 'settings'];
    item.classList.toggle('active', tabs[i] === tabName);
  });

  if (tabName === 'simulator') {
    initQuiz(currentQ);
    appendLog('[TWIN] 시뮬레이터 세션 시작 — 실시간 모니터링 활성화', 'twin');
    appendLog(`[PRED] 현재 문항 Q.${QUESTIONS[currentQ].num} 분석 준비 완료`, 'info');
  }
}

/* ──────────────────────────────────────────
   4. 문제 초기화 (initQuiz)
────────────────────────────────────────── */
function initQuiz(idx) {
  const q = QUESTIONS[idx];
  currentQ = idx;

  document.getElementById('qNum').textContent = 'Q.' + q.num;
  document.getElementById('qType').textContent = q.type;
  document.getElementById('qTitle').innerHTML = q.title;
  document.getElementById('qFormula').textContent = q.formula;

  const riskVal = document.getElementById('qRiskVal');
  const riskBadge = document.getElementById('qRiskBadge');
  riskVal.textContent = q.risk;
  riskBadge.style.display = 'inline-flex';
  riskBadge.classList.remove('high-risk');
  if (q.risk >= 70) {
    riskBadge.style.background = 'var(--red-light)';
    riskBadge.style.color = 'var(--red)';
    riskBadge.classList.add('high-risk');
  } else if (q.risk >= 50) {
    riskBadge.style.background = 'var(--amber-light)';
    riskBadge.style.color = 'var(--amber)';
  } else {
    riskBadge.style.background = 'var(--green-light)';
    riskBadge.style.color = 'var(--green)';
  }

  const forecast = document.getElementById('forecastText');
  if (q.risk >= 70) {
    forecast.textContent = `⚠️ 트윈 경고: 이 문제에서 오답 확률이 ${q.risk}%입니다. 풀이 전 수식을 반드시 확인하세요.`;
  } else if (q.risk >= 50) {
    forecast.textContent = `🔶 트윈 주의: 오답 확률 ${q.risk}% — 유사 유형에서 실수 패턴이 감지됩니다.`;
  } else {
    forecast.textContent = `✅ 트윈 안전: 오답 확률 ${q.risk}% — 이 유형은 강점 영역입니다. 자신 있게 풀어보세요.`;
  }

  setTimeout(() => {
    const fill = document.getElementById('gaugeFill');
    const val = document.getElementById('gaugeVal');
    fill.style.width = q.risk + '%';
    animateNumber(val, 0, q.risk, 1200, '%');
  }, 100);

  updateRiskCircle(q.risk);

  const optsEl = document.getElementById('qOptions');
  optsEl.innerHTML = '';
  q.opts.forEach(([text, isCorrect], i) => {
    const btn = document.createElement('button');
    btn.className = 'q-opt-btn';
    btn.innerHTML = `<span class="opt-num">${i + 1}</span><span>${text}</span>`;
    btn.dataset.correct = isCorrect;
    btn.onclick = () => selectOption(btn, isCorrect, i);
    optsEl.appendChild(btn);
  });

  const resultMsg = document.getElementById('qResultMsg');
  resultMsg.className = 'q-result-msg';
  resultMsg.textContent = '';

  if (answered[idx]) {
    restoreAnswerState(idx);
  }

  document.getElementById('qCounter').textContent = `${idx + 1} / ${QUESTIONS.length}`;
  updateStepIndicator();
  updateQuickNav();

  const riskLevel = q.risk >= 70 ? '고위험' : q.risk >= 50 ? '주의' : '안전';
  appendLog(`[TWIN] Q.${q.num} 로드 — 오답 확률 ${q.risk}% (${riskLevel})`, 'twin');
  appendLog(`[SCAN] 유형: ${q.type}`, 'info');
  if (q.risk >= 70) {
    appendLog(`[WARN] 위험 문항 감지 — 집중 모니터링 활성화`, 'warn');
  }
}

/* ──────────────────────────────────────────
   5. 정답 판별 (selectOption)
────────────────────────────────────────── */
function selectOption(btn, isCorrect, optIdx) {
  const q = QUESTIONS[currentQ];

  const allBtns = document.querySelectorAll('.q-opt-btn');
  allBtns.forEach(b => {
    b.disabled = true;
    if (b.dataset.correct === 'true') {
      b.classList.add('correct');
    }
  });

  if (isCorrect) {
    btn.classList.add('correct');
    answered[currentQ] = 'correct';
    showResultMsg(true, q);
    appendLog(`[TWIN] ✓ 패턴 일치 — Q.${q.num} 정답 확인`, 'ok');
    appendLog(`[ANAL] 풀이 패턴이 트윈 예측과 일치합니다.`, 'info');
    appendLog(`[SYNC] 트윈 싱크율 +0.3% 업데이트`, 'twin');
  } else {
    btn.classList.add('wrong');
    answered[currentQ] = 'wrong';
    showResultMsg(false, q);
    appendLog(`[TWIN] ✗ 트윈 예측 실패 — Q.${q.num} 오답 감지`, 'error');
    appendLog(`[ANAL] 오답 패턴 기록 중... 데이터베이스 업데이트`, 'warn');
    appendLog(`[RISK] 해당 유형 위험도 +5% 조정`, 'error');
    appendLog(`[TWIN] 트윈 분석 보기를 클릭하여 오답 원인을 확인하세요.`, 'twin');
  }

  updateQuickNav();
  updateStepIndicator();
}

function showResultMsg(isCorrect, q) {
  const msg = document.getElementById('qResultMsg');
  if (isCorrect) {
    msg.className = 'q-result-msg show-correct';
    msg.textContent = '✓ 정답입니다! 트윈 예측과 풀이 패턴이 일치합니다.';
  } else {
    msg.className = 'q-result-msg show-wrong';
    msg.textContent = `✗ 오답입니다. 트윈이 예측한 오답 확률: ${q.risk}% — 분석 보기를 클릭하세요.`;
  }
}

function restoreAnswerState(idx) {
  const q = QUESTIONS[idx];
  const allBtns = document.querySelectorAll('.q-opt-btn');
  allBtns.forEach(b => {
    b.disabled = true;
    if (b.dataset.correct === 'true') b.classList.add('correct');
  });
  const msg = document.getElementById('qResultMsg');
  if (answered[idx] === 'correct') {
    msg.className = 'q-result-msg show-correct';
    msg.textContent = '✓ 정답입니다! 트윈 예측과 풀이 패턴이 일치합니다.';
  } else {
    msg.className = 'q-result-msg show-wrong';
    msg.textContent = `✗ 오답입니다. 트윈이 예측한 오답 확률: ${q.risk}% — 분석 보기를 클릭하세요.`;
  }
}

/* ──────────────────────────────────────────
   6. 문항 이동
────────────────────────────────────────── */
function prevQuestion() {
  if (currentQ > 0) initQuiz(currentQ - 1);
}
function nextQuestion() {
  if (currentQ < QUESTIONS.length - 1) initQuiz(currentQ + 1);
}

/* ──────────────────────────────────────────
   7. 스텝 인디케이터 업데이트
────────────────────────────────────────── */
function updateStepIndicator() {
  const container = document.getElementById('stepIndicator');
  container.innerHTML = '';
  QUESTIONS.forEach((q, i) => {
    const dot = document.createElement('div');
    dot.className = 'step-dot';
    if (i === currentQ) {
      dot.classList.add(q.risk >= 70 ? 'risk' : 'active');
    } else if (answered[i]) {
      dot.classList.add('done');
    } else if (q.risk >= 70) {
      dot.style.background = 'rgba(239,68,68,.3)';
    }
    dot.title = `Q.${q.num} — 위험도 ${q.risk}%`;
    dot.onclick = () => initQuiz(i);
    container.appendChild(dot);
  });
}

/* ──────────────────────────────────────────
   8. 빠른 이동 버튼 업데이트
────────────────────────────────────────── */
function updateQuickNav() {
  const container = document.getElementById('quickNavBtns');
  container.innerHTML = '';
  QUESTIONS.forEach((q, i) => {
    const btn = document.createElement('button');
    btn.className = 'qnav-btn';
    btn.textContent = q.num;
    if (i === currentQ) btn.classList.add('active');
    if (q.risk >= 70) btn.classList.add('risk-q');
    if (answered[i]) btn.classList.add('done-q');
    btn.onclick = () => initQuiz(i);
    container.appendChild(btn);
  });
}

/* ──────────────────────────────────────────
   9. 위험도 원형 게이지
────────────────────────────────────────── */
function updateRiskCircle(risk) {
  const circle = document.getElementById('riskCircle');
  const valEl = document.getElementById('riskMeterVal');
  const labelEl = document.getElementById('riskMeterLabel');
  const circumference = 314;
  const offset = circumference - (circumference * risk / 100);

  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
    animateNumber(valEl, 0, risk, 1000, '');
  }, 150);

  if (risk >= 70) {
    circle.style.stroke = '#f85149';
    labelEl.textContent = '⚠ 고위험 문항';
    labelEl.style.color = '#f85149';
  } else if (risk >= 50) {
    circle.style.stroke = '#d29922';
    labelEl.textContent = '⚡ 주의 필요';
    labelEl.style.color = '#d29922';
  } else {
    circle.style.stroke = '#3fb950';
    labelEl.textContent = '✓ 안전 구간';
    labelEl.style.color = '#3fb950';
  }
}

/* ──────────────────────────────────────────
   10. 터미널 로그 (appendLog + 타이핑 효과)
────────────────────────────────────────── */
function appendLog(text, type = 'system') {
  logQueue.push({ text, type });
  if (!isTyping) processLogQueue();
}

function processLogQueue() {
  if (logQueue.length === 0) { isTyping = false; return; }
  isTyping = true;
  const { text, type } = logQueue.shift();
  typeLog(text, type, () => {
    setTimeout(processLogQueue, 80);
  });
}

function typeLog(text, type, callback) {
  const terminal = document.getElementById('terminalBody');
  const line = document.createElement('div');
  line.className = `log-line log-${type} log-cursor`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;

  let i = 0;
  const speed = text.length > 60 ? 12 : 18;
  const timer = setInterval(() => {
    line.textContent = text.slice(0, i + 1);
    i++;
    if (i >= text.length) {
      clearInterval(timer);
      line.classList.remove('log-cursor');
      terminal.scrollTop = terminal.scrollHeight;
      if (callback) callback();
    }
  }, speed);
}

function clearLog() {
  const terminal = document.getElementById('terminalBody');
  terminal.innerHTML = '';
  logQueue = [];
  isTyping = false;
  appendLog('[SYSTEM] 로그 초기화 완료', 'system');
  appendLog('[TWIN] 모니터링 재개 ▋', 'twin');
}

/* ──────────────────────────────────────────
   11. 모달 시스템 (분석 모달)
────────────────────────────────────────── */
function openAnalysisModal() {
  const q = QUESTIONS[currentQ];
  const overlay = document.getElementById('analysisModalOverlay');

  document.getElementById('modalTitle').textContent = `Q.${q.num} 오답 원인 분석`;
  document.getElementById('modalRiskBadge').textContent = `오답 확률 ${q.risk}%`;
  document.getElementById('modalReason').textContent = q.reason;

  const bar = document.getElementById('modalRiskBar');
  bar.style.width = '0%';

  const ul = document.getElementById('modalSolutions');
  ul.innerHTML = '';
  q.solutions.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    ul.appendChild(li);
  });

  overlay.classList.add('open');

  setTimeout(() => {
    bar.style.width = q.risk + '%';
  }, 50);

  appendLog(`[MODAL] 트윈 심층 분석 열람 — Q.${q.num}`, 'twin');
  appendLog(`[ANAL] 오답 원인 패턴 분석 완료`, 'info');
}

function closeAnalysisModal(e) {
  if (e && e.target !== document.getElementById('analysisModalOverlay')) return;
  document.getElementById('analysisModalOverlay').classList.remove('open');
}

/* ──────────────────────────────────────────
   12. 프로필 관리 모달
────────────────────────────────────────── */
function openProfileModal() {
  const overlay = document.getElementById('profileModalOverlay');
  overlay.classList.add('open');
}

function closeProfileModal(e) {
  if (e && e.target !== document.getElementById('profileModalOverlay')) return;
  document.getElementById('profileModalOverlay').classList.remove('open');
}

function saveProfile() {
  const name = document.getElementById('inputName').value || '김노드';
  const school = document.getElementById('inputSchool').value || '서울고등학교';
  const grade = document.getElementById('selectGrade').value;
  const region = document.getElementById('inputRegion').value || '서울';
  const email = document.getElementById('inputEmail').value;
  const university = document.getElementById('inputUniversity').value;
  const major = document.getElementById('inputMajor').value;

  const initial = name.charAt(0);
  document.getElementById('profileInitial').textContent = initial;
  document.getElementById('profileName').textContent = name;
  document.getElementById('profileGrade').textContent = `고등학교 ${grade}학년`;
  
  document.getElementById('profileCardInitial').textContent = initial;
  document.getElementById('profileCardName').textContent = name;
  document.getElementById('profileCardDetail').textContent = `고등학교 ${grade}학년 · ${region}`;
  document.getElementById('profileCardGoal').textContent = `목표: ${university} ${major}`;

  updateSyncRing();
  appendLog(`[TWIN] 프로필 정보 업데이트 — ${name} (${university} ${major})`, 'twin');
  appendLog(`[SYNC] 트윈 동기화율 +1.2% 조정`, 'ok');
  showSaveStatus();

  closeProfileModal();
}

function updateSyncRing() {
  const syncRing = document.querySelector('.sync-ring');
  if (syncRing) {
    syncRing.style.animation = 'none';
    setTimeout(() => {
      syncRing.style.animation = 'spinRing 2s linear infinite';
    }, 10);
  }
}

function showSaveStatus() {
  const status = document.getElementById('saveStatus');
  if (status) {
    status.style.opacity = '1';
    setTimeout(() => {
      status.style.opacity = '0.5';
    }, 2000);
  }
}

/* ──────────────────────────────────────────
   13. AI 엔진 설정 로직
────────────────────────────────────────── */
function updatePrecision(value) {
  settings.precision = value;
  const label = value >= 50 ? '정교한 분석' : '빠른 분석';
  document.getElementById('precisionValue').textContent = `${label} (${value}%)`;
  appendLog(`[TWIN] 분석 정확도 조정 — ${label} (${value}%)`, 'twin');
  updateSyncRing();
}

function toggleDataSource(source) {
  const weekBtn = document.getElementById('toggleWeek');
  const allBtn = document.getElementById('toggleAll');
  const label = document.getElementById('dataSourceLabel');

  if (source === 'week') {
    weekBtn.classList.add('active');
    allBtn.classList.remove('active');
    settings.dataSource = 'week';
    label.textContent = '최근 1주일 데이터 기반';
    appendLog(`[TWIN] 데이터 소스 변경 — 최근 1주일 기반 (빠른 반응)`, 'info');
  } else {
    allBtn.classList.add('active');
    weekBtn.classList.remove('active');
    settings.dataSource = 'all';
    label.textContent = '전체 누적 데이터 기반';
    appendLog(`[TWIN] 데이터 소스 변경 — 전체 누적 데이터 기반 (정교한 분석)`, 'info');
  }
  updateSyncRing();
}

function toggleAlert(type) {
  const btn = document.getElementById('alert' + type.charAt(0).toUpperCase() + type.slice(1));
  btn.classList.toggle('active');
  settings.alerts[type] = btn.classList.contains('active');
  const status = btn.classList.contains('active') ? '활성화' : '비활성화';
  appendLog(`[TWIN] 알림 설정 변경 — ${type} ${status}`, 'info');
}

function updateSyncSensitivity(value) {
  settings.syncSensitivity = value;
  const levels = ['낮음', '낮음-중간', '중간', '중간-높음', '높음'];
  const level = levels[Math.floor(value / 20)];
  document.getElementById('syncValue').textContent = `${level} 민감도 (${value}%)`;
  appendLog(`[TWIN] 싱크 민감도 조정 — ${level} (${value}%)`, 'twin');
  updateSyncRing();
}

function confirmResetTwin() {
  if (confirm('정말로 트윈을 초기화하시겠습니까?\\n모든 학습 데이터가 삭제됩니다.')) {
    appendLog(`[WARN] 트윈 초기화 시작...`, 'warn');
    appendLog(`[TWIN] 모든 학습 데이터 삭제 중...`, 'error');
    setTimeout(() => {
      appendLog(`[SYSTEM] 새로운 트윈 생성 완료`, 'system');
      appendLog(`[TWIN] 트윈 초기화 완료 — 새로운 학습 시작`, 'ok');
      answered = new Array(QUESTIONS.length).fill(null);
    }, 1500);
  }
}

/* ──────────────────────────────────────────
   14. 위험 알림 리스트 (대시보드)
────────────────────────────────────────── */
function buildRiskList() {
  const container = document.getElementById('riskList');
  const riskItems = QUESTIONS
    .filter(q => q.risk >= 60)
    .sort((a, b) => b.risk - a.risk);

  riskItems.forEach(q => {
    const item = document.createElement('div');
    item.className = 'risk-item';
    item.innerHTML = `
      <span class="risk-item-num">Q.${q.num}</span>
      <div class="risk-item-body">
        <p class="risk-item-title">${q.type}</p>
        <p class="risk-item-type">${q.title.replace(/<[^>]*>/g, '').slice(0, 40)}...</p>
      </div>
      <span class="risk-item-pct">${q.risk}%</span>
    `;
    item.onclick = () => {
      switchTab('simulator');
      const qIdx = QUESTIONS.findIndex(x => x.num === q.num);
      if (qIdx >= 0) initQuiz(qIdx);
    };
    container.appendChild(item);
  });
}

/* ──────────────────────────────────────────
   15. 숫자 애니메이션 유틸
────────────────────────────────────────── */
function animateNumber(el, from, to, duration, suffix) {
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(from + (to - from) * eased);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ──────────────────────────────────────────
   16. 싱크 바 애니메이션 (대시보드)
────────────────────────────────────────── */
function animateSyncBars() {
  document.querySelectorAll('.sync-bar-fill').forEach(bar => {
    const w = bar.dataset.width;
    setTimeout(() => { bar.style.width = w + '%'; }, 300);
  });
}

/* ──────────────────────────────────────────
   17. 날짜 표시
────────────────────────────────────────── */
function setCurrentDate() {
  const el = document.getElementById('currentDate');
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  el.textContent = now.toLocaleDateString('ko-KR', options);
}

/* ──────────────────────────────────────────
   18. 주기적 터미널 로그
────────────────────────────────────────── */
const AMBIENT_LOGS = [
  { text: '[TWIN] 학습 패턴 실시간 분석 중...', type: 'twin' },
  { text: '[SCAN] 뇌파 시뮬레이션 데이터 동기화 완료', type: 'info' },
  { text: '[TWIN] 오늘 학습 집중도 지수: 82.4%', type: 'twin' },
  { text: '[PRED] 다음 문항 오답 예측 모델 갱신 중', type: 'info' },
  { text: '[SYNC] 트윈 싱크율 실시간 업데이트: 87.3%', type: 'ok' },
  { text: '[ANAL] 풀이 속도 패턴 분석 완료', type: 'info' },
  { text: '[TWIN] 집중력 저하 감지 — 짧은 휴식 권장', type: 'warn' },
  { text: '[PRED] 치환적분 유형 위험도 재계산 중...', type: 'warn' },
];
let ambientIdx = 0;

function startAmbientLogs() {
  setInterval(() => {
    const simTab = document.getElementById('tab-simulator');
    if (simTab && simTab.classList.contains('active')) {
      const log = AMBIENT_LOGS[ambientIdx % AMBIENT_LOGS.length];
      appendLog(log.text, log.type);
      ambientIdx++;
    }
  }, 6000);
}

/* ──────────────────────────────────────────
   19. 초기화 (DOMContentLoaded)
────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setCurrentDate();
  fetchQuestionsFromServer();
  buildRiskList();
  animateSyncBars();
  startAmbientLogs();

  setTimeout(() => {
    const correctEl = document.getElementById('correctCount');
    const riskEl = document.getElementById('riskCount');
    if (correctEl) animateNumber(correctEl, 0, 12, 1200, '');
    if (riskEl) animateNumber(riskEl, 0, 3, 800, '');
  }, 400);

  setTimeout(() => {
    appendLog('[TWIN] 대시보드 로드 완료 — 오늘의 학습 현황 분석 중', 'twin');
    appendLog('[PRED] 위험 문항 3개 예보 완료 (Q.02, Q.04, Q.05)', 'warn');
  }, 800);

  const profileOverlay = document.getElementById('profileModalOverlay');
  const analysisOverlay = document.getElementById('analysisModalOverlay');
  if (profileOverlay) profileOverlay.addEventListener('click', (e) => {
    if (e.target.id === 'profileModalOverlay') closeProfileModal();
  });
  if (analysisOverlay) analysisOverlay.addEventListener('click', (e) => {
    if (e.target.id === 'analysisModalOverlay') closeAnalysisModal();
  });

  console.log('%c TWIN EDU Core v2.5 ', 'background:#2563eb;color:white;font-size:14px;padding:4px 8px;border-radius:4px;');
  console.log('%c 디지털 트윈 학습 플랫폼 초기화 완료', 'color:#2563eb;font-size:12px;');
  console.log('%c 프로필 관리 및 AI 엔진 설정 모듈 로드됨', 'color:#7c3aed;font-size:12px;');
});
