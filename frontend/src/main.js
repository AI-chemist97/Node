/* ============================================================
   TWIN EDU — app.js (v2.5 with Profile & Settings)
   핵심 로직: 탭 전환, 문제 초기화, 정답 판별, 터미널 로그, 모달
   추가: 프로필 관리, AI 엔진 설정, 실시간 싱크 반응
   ============================================================ */
import { createClient } from "@supabase/supabase-js";
import Chart from "chart.js/auto";
import "./style.css";
// ("use strict");

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

window.supabase = supabase;
window.Chart = Chart;
/* ──────────────────────────────────────────
   1. 문제 데이터 (영문법/독해 유형 5문항)
────────────────────────────────────────── */
const QUESTIONS = [
  {
    num: "01",
    title: "다음 문장에서 밑줄 친 부분 중 어법상 틀린 것을 고르시오.",
    formula:
      "The number of students who <u>is</u> attending the seminar has increased.",
    type: "영문법 · 주어-동사 수 일치",
    opts: [
      ["① who", false],
      ["② is", true],
      ["③ attending", false],
      ["④ has", false],
      ["⑤ increased", false],
    ],
    risk: 65,
    reason:
      "The number of 뒤의 관계절 내 동사 수 일치 오류입니다. 선행사가 복수명사(students)임을 인식하지 못하는 패턴이 감지됩니다.",
    solutions: [
      "The number of(단수) vs A number of(복수) 구별법 숙지",
      "관계대명사절 내의 동사는 선행사에 수 일치함을 복습",
      "복수 명사 뒤에 오는 단수 동사 함정 문제 주의",
    ],
  },
  {
    num: "02",
    title: "빈칸에 들어갈 가장 적절한 관계대명사를 고르시오.",
    formula:
      "The manager rejected the proposal _________ contents were not clearly defined.",
    type: "영문법 · 관계대명사",
    opts: [
      ["① which", false],
      ["② who", false],
      ["③ whose", true],
      ["④ that", false],
      ["⑤ whom", false],
    ],
    risk: 78,
    reason:
      "소유격 관계대명사의 쓰임에 대한 이해도가 낮습니다. 명사(contents)와의 소유 관계를 파악하지 못하고 목적격으로 오해하는 경향이 있습니다.",
    solutions: [
      "관계대명사 뒤에 완전한 명사구가 올 때 소유격(whose) 검토",
      "선행사 '의' 명사로 해석되는지 연결 연습",
      "격에 따른 관계대명사 선택 매트릭스 암기",
    ],
  },
  {
    num: "03",
    title: "밑줄 친 부분의 어법이 올바르지 않은 것을 고르시오.",
    formula:
      "Keep the door <u>locking</u> when you leave the office for the day.",
    type: "영문법 · 분사 (능동 vs 수동)",
    opts: [
      ["① Keep", false],
      ["② locking", true],
      ["③ when", false],
      ["④ leave", false],
      ["⑤ for the day", false],
    ],
    risk: 82,
    reason:
      "목적어(door)와 목적격 보어(locking)의 수동 관계를 능동으로 혼동하고 있습니다. 사물 목적어의 수동 패턴에서 취약점이 확인됩니다.",
    solutions: [
      "5형식 동사(Keep, Leave) + 목적어 + p.p. 형태 집중 훈련",
      "문장의 대상이 동작을 하는지(ing), 당하는지(ed) 판단 연습",
      "주요 빈출 타동사의 과거분사형 암기",
    ],
  },
  {
    num: "04",
    title: "다음 문장의 빈칸에 알맞은 형태를 고르시오.",
    formula:
      "Not only the students but also the teacher _________ excited about the field trip.",
    type: "영문법 · 상관접속사 수 일치",
    opts: [
      ["① are", false],
      ["② is", true],
      ["③ being", false],
      ["④ have", false],
      ["⑤ to be", false],
    ],
    risk: 55,
    reason:
      "상관접속사 Not only A but also B 구문에서 B에 동사를 일치시키는 원칙을 혼동하여 전체를 복수로 취급하는 오류가 빈번합니다.",
    solutions: [
      "상관접속사 주어 일치 원칙(가까운 주어 B에 일치) 정리",
      "Either A or B, Neither A nor B 구문과 함께 비교 학습",
      "단수 주어(the teacher)에 따른 동사 형태 재확인",
    ],
  },
  {
    num: "05",
    title: "문맥상 밑줄 친 단어의 쓰임이 적절하지 않은 것을 고르시오.",
    formula:
      "The artificial intelligence system was <u>designed</u> to enhance efficiency and <u>minimizing</u> human error.",
    type: "영문법 · 병렬 구조",
    opts: [
      ["① artificial", false],
      ["② designed", false],
      ["③ enhance", false],
      ["④ efficiency", false],
      ["⑤ minimizing", true],
    ],
    risk: 89,
    reason:
      "to부정사에 연결되는 동사원형의 병렬 구조를 파악하지 못하고 있습니다. and 뒤의 형태를 앞의 분사(designed)와 혼동하는 패턴입니다.",
    solutions: [
      "등위접속사(and, or) 앞뒤의 문법적 형태 일치 연습",
      "to (enhance) and (minimize) 구조 분석",
      "긴 문장에서의 병렬 구조 찾기 구문 독해 병행",
    ],
  },
];

/* ──────────────────────────────────────────
   1.5. 서버 연결 설정 (추가됨)
────────────────────────────────────────── */

async function updateAIVisualization(userId = "115") {
  const statsRow = document.getElementById("statsRow");
  const dataContainer = document.getElementById("dashboardDataContainer");
  const statusArea = document.getElementById("dashboardLoadingOrEmpty");
  const statusMsg = document.getElementById("dashboardStatusMsg");
  const statusIcon = document.getElementById("dashboardStatusIcon");
  const riskBadgeCount = document.getElementById("riskBadgeCount");
  if (!statsRow) {
    console.error("HTML에 'statsRow' ID를 가진 요소가 없습니다. 확인 바람!");
    return;
  }
  try {
    // [Step 0] 로딩 애니메이션(스피너) 주입

    const nameDisplays = document.querySelectorAll(".profile-name-display");
    const riskCountEl = document.getElementById("heroRiskCount");
    const initialEl = document.getElementById("profileInitial");
    // [1] 로딩 상태 시작
    dataContainer.style.display = "none";
    statusArea.style.display = "block";
    statusIcon.innerHTML = '<div class="spinner spinner-lg"></div>';
    statusMsg.textContent = "AI 분석 데이터를 동기화 중입니다...";
    // 글자 대신 뺑글뺑글 도는 스피너 넣기
    nameDisplays.forEach((el) => {
      el.innerHTML = '<div class="spinner"></div>';
    });
    if (riskCountEl) {
      riskCountEl.innerHTML = '<div class="spinner spinner-lg"></div>';
    }
    if (initialEl) {
      initialEl.innerHTML =
        '<div class="spinner" style="width:14px; height:14px;"></div>';
    }

    // 로딩 처리
    statsRow.innerHTML = '<div class="spinner spinner-lg"></div>';
    // [Step 1] API 호출 (유저 정보 + AI 통계)
    // 두 API를 동시에 호출해서 속도를 높입니다 (Promise.all 활용)
    const [resUser, resStats] = await Promise.all([
      fetch(`${API_BASE_URL}/api/users/${userId}`),
      fetch(`${API_BASE_URL}/api/user-stats/${userId}`),
    ]);

    const users = await resUser.json();
    const stats = await resStats.json();
    console.log(users);

    if (users.error || stats.error) {
      appendLog(`[ERROR] 유저 데이터 로드 실패`, "error");
      nameDisplays.forEach((el) => (el.textContent = "정보 없음"));
      if (riskCountEl) riskCountEl.textContent = "-";
      return;
    }
    const riskCount = stats.weak_category ? stats.weak_category.length : 0;

    const heroTitleContainer = document.getElementById("heroTitleContainer");
    if (heroTitleContainer) {
      heroTitleContainer.innerHTML = `
        <h1 class="hero-title">
          ${users.name} 님의 트윈이<br />
          <span class="hero-accent">${riskCount}개 오답 위험</span>을 예보했습니다
        </h1>`;
    }
    // 2. 서브 텍스트 및 상태 태그 변경
    const heroSubText = document.getElementById("heroSubText");
    if (heroSubText) {
      heroSubText.innerHTML = `AI 분신이 오늘 영어 시뮬레이션을 완료했습니다.<br />지금 바로 위험 구간을 확인하고 선제 학습을 시작하세요.`;
    }

    const statusText = document.getElementById("statusText");
    if (statusText) statusText.textContent = "AI 트윈 동기화 완료";

    // 3. 버튼 영역 보이기 (display: none 해제)
    const heroActions = document.getElementById("heroActions");
    if (heroActions) heroActions.style.display = "flex";

    document.getElementById("inputName").value = users.name || "";
    document.getElementById("inputSchool").value =
      users.school_name ||
      (users.grade?.includes("중") ? "가상중학교" : "가상고등학교");
    document.getElementById("selectGrade").value = users.grade_num || "2"; // 학년 숫자만 저장된 컬럼 가정
    document.getElementById("inputRegion").value = users.region || "서울";
    document.getElementById("inputEmail").value = users.email || "";
    document.getElementById("inputUniversity").value =
      users.target_university || "미래국립대학교";
    document.getElementById("inputMajor").value =
      users.target_major || "공학계열";
    // 4. 차트 및 레이더 표시
    const radarMessage = document.getElementById("radarMessage");
    const userRadarChart = document.getElementById("userRadarChart");
    const syncOrb = document.getElementById("syncOrb");

    if (radarMessage) radarMessage.style.display = "none";
    if (userRadarChart) userRadarChart.style.display = "block";
    if (syncOrb) syncOrb.style.display = "flex";
    const syncPct = Math.round((Number(stats.predicted_score) || 0) * 100);

    // [Step 3] 오답 위험 카운트 업데이트
    if (riskCountEl) {
      // 숫자 애니메이션 효과
      animateNumber(riskCountEl, 0, riskCount, 800, "");
    }
    // A. Stats Row (4개 카드)
    document.getElementById("statsRow").innerHTML =
      `${createStatCardHTML("stat-blue", "정답 예측 건수", stats.correct_predict || 0, "", "check")}
      ${createStatCardHTML("stat-red", "오답 위험 건수", riskCount, riskCount > 0 ? "주의 필요" : "안전 구역", "alert")}
      ${createStatCardHTML("stat-purple", "오늘 학습 시간", "2h 34m", "목표 달성 중", "clock")}
      ${createStatCardHTML("stat-green", "트윈 싱크율", syncPct, "+5% 이번 주", "pulse", "%")}`;

    // 데이터 컨테이너 보여주기
    if (dataContainer) dataContainer.style.display = "block";
    // [Step 2] 이름 및 프로필 업데이트 (스피너가 텍스트로 대체됨)
    const userName = users.name || `유저 ${userId}`;
    const userGrade = users.grade || "학년 정보 없음";
    nameDisplays.forEach((el) => {
      el.textContent = userName;
    });
    if (initialEl) {
      document.getElementById("profileName").textContent = userName;
      document.getElementById("profileGrade").textContent = userGrade;
      initialEl.textContent = userName.charAt(0);
    }

    // B. Twin Sync Bar (막대 그래프)
    const syncData = [
      {
        label: "영문법 (수 일치/시제)",
        val: (stats.grammar_score || 0) * 100,
        color: "#2563eb",
      },
      {
        label: "구문 독해 (관계사)",
        val: (stats.structure_score || 0) * 100,
        color: "#7c3aed",
      },
      {
        label: "작문",
        val: (stats.reading_score || 0) * 100,
        color: "#059669",
      },
      {
        label: "어휘 숙련도",
        val: (stats.vocabulary_score || 0) * 100,
        color: "#d97706",
      },
    ];
    console.log(syncData);
    document.getElementById("syncBars").innerHTML = syncData
      .map(
        (d) => `
      <div class="sync-bar-item">
        <div class="sync-bar-label"><span>${d.label}</span><span class="sync-bar-pct">${Math.round(d.val)}%</span></div>
        <div class="sync-bar-track"><div class="sync-bar-fill" style="width: ${d.val}%; background: ${d.color}"></div></div>
      </div>
    `,
      )
      .join("");

    // C. 위험 알림 & 패턴 리스트
    if (riskBadgeCount) riskBadgeCount.textContent = `${riskCount}건`;
    const riskList = document.getElementById("riskList");
    if (stats.weak_tag_names && stats.weak_tag_names.length > 0) {
      riskList.innerHTML = stats.weak_tag_names
        .map(
          (name) => `
        <div class="risk-item"><span class="risk-item-body">${name}</span><span class="risk-item-pct">위험</span></div>
      `,
        )
        .join("");
    } else {
      riskList.innerHTML =
        '<div style="color:gray; padding:20px; text-align:center;">감지된 위험 요소가 없습니다.</div>';
    }

    // 패턴 리스트 (데이터가 있을 때 예시 패턴 생성)
    document.getElementById("patternList").innerHTML = `
      ${createPatternItemHTML("warn", "풀이 시간 이상 감지", `Q.05 평균 풀이 시간 ${Math.floor(Math.random() * 3 + 3)}분 초과`)}
      ${createPatternItemHTML("info", "반복 오답 유형 감지", "수동태-능동태 전환 문제에서 실수 패턴 감지")}
      ${createPatternItemHTML("ok", "강점 유형 확인", "어휘 및 숙어 문제에서 높은 정답률 유지")}
    `;

    // UI 전환
    statusArea.style.display = "none";
    dataContainer.style.display = "block";
    const riskBadge = document.querySelector(".badge-red");
    if (riskBadge) riskBadge.textContent = `${riskCount}건`;

    // [Step 4] 점수 및 싱크율 업데이트
    const score = Math.round((Number(stats.predicted_score) || 0) * 100);
    const syncPercentEl = document.getElementById("syncPercent");
    if (syncPercentEl) {
      animateNumber(syncPercentEl, 0, score, 1000, "");
    }

    // [Step 5] 취약 영역 리스트 및 차트 갱신

    renderRadarChart(stats);

    appendLog(
      `[SYSTEM] 유저 ${userName} AI 트윈 동기화 완료 (점수: ${score}%)`,
      "ok",
    );
  } catch (err) {
    console.error("데이터 로드 실패:", err);
    appendLog(`[ERROR] 네트워크 연결 실패`, "error");
    document
      .querySelectorAll(".profile-name-display")
      .forEach((el) => (el.textContent = "에러"));
    if (document.getElementById("heroRiskCount")) {
      document.getElementById("heroRiskCount").textContent = "!";
      statusArea.style.display = "block";
      dataContainer.style.display = "none";
      statusIcon.innerHTML = "🔍";
      statusMsg.textContent = "해당 유저의 분석 데이터를 찾을 수 없습니다.";
    }
  }
}

// 헬퍼: 통계 카드 HTML
function createStatCardHTML(type, label, val, change, iconType, unit = "") {
  return `
    <div class="stat-card ${type}">
      <div class="stat-body">
        <p class="stat-label">${label}</p>
        <p class="stat-value">${val}${unit ? `<span style="font-size:1rem">${unit}</span>` : ""}</p>
        <p class="stat-change">${change}</p>
      </div>
    </div>`;
}
// 헬퍼: 패턴 아이템 HTML
function createPatternItemHTML(type, title, desc) {
  const iconPath =
    type === "warn"
      ? "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      : "M20 6L9 17l-5-5";
  return `
    <div class="pattern-item">
      <div class="pattern-icon pattern-${type}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="${iconPath}"/></svg>
      </div>
      <div class="pattern-body"><p class="pattern-title">${title}</p><p class="pattern-desc">${desc}</p></div>
    </div>`;
}

async function fetchQuestionsFromServer() {
  if (!API_BASE_URL) return; // 주소 없으면 기존 로컬 데이터 사용

  try {
    const response = await fetch(`${API_BASE_URL}/api/questions`);

    const serverData = await response.json();
    // console.log("서버데이터", serverData);
    if (serverData && serverData.length > 0) {
      // 서버에서 받은 데이터로 QUESTIONS 배열을 덮어씌웁니다.
      // 데이터 형식이 EdNet 규격일 경우 매핑 로직이 추가로 필요할 수 있습니다.
      // console.log("서버 데이터 로드 완료:", serverData);
      // QUESTIONS.push(...serverData); // 기존 데이터에 추가할 경우
    }
  } catch (error) {
    appendLog("[ERROR] 서버 연결 실패. 로컬 모드로 동작합니다.", "error");
  }
}

/* ──────────────────────────────────────────
   2. 전역 상태
────────────────────────────────────────── */
let currentQ = 0;
let myRadarChart = null; // 오각형 차트를 파괴하고 새로 그리기 위해 필요하다능
let answered = new Array(QUESTIONS.length).fill(null);
let logQueue = [];
let isTyping = false;
// let currentModal = null;

// 설정 상태
let settings = {
  precision: 70,
  dataSource: "week",
  alerts: { dashboard: true, terminal: false, sound: false },
  syncSensitivity: 60,
};

/* ──────────────────────────────────────────
   3. 탭 전환 (switchTab)
────────────────────────────────────────── */
function switchTab(tabName) {
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.remove("active"));
  const target = document.getElementById("tab-" + tabName);
  if (target) target.classList.add("active");

  document.querySelectorAll(".tab-btn").forEach((btn, i) => {
    const tabs = ["dashboard", "simulator", "report", "settings"];
    btn.classList.toggle("active", tabs[i] === tabName);
  });

  document.querySelectorAll(".nav-item").forEach((item, i) => {
    const tabs = ["dashboard", "simulator", "report", "settings"];
    item.classList.toggle("active", tabs[i] === tabName);
  });

  if (tabName === "simulator") {
    initQuiz(currentQ);
    appendLog("[TWIN] 시뮬레이터 세션 시작 — 실시간 모니터링 활성화", "twin");
    appendLog(
      `[PRED] 현재 문항 Q.${QUESTIONS[currentQ].num} 분석 준비 완료`,
      "info",
    );
  }
}

/* ──────────────────────────────────────────
   4. 문제 초기화 (initQuiz)
────────────────────────────────────────── */
// 유저 입력 버튼 클릭 시 실행되는 함수라능
/* main.js 내부 로직 통합 */

window.loadTargetUser = async () => {
  const inputVal = document.getElementById("userInputId").value.trim();
  const userId = inputVal || "115"; // 입력 없으면 기본 115번

  appendLog(`[SYSTEM] 유저 ${userId} 데이터 동기화 시도...`, "info");
  await updateAIVisualization(userId);
};

// [Step 2] 추천 문제 불러와서 시뮬레이터 세팅
async function startAISimulator(userId) {
  const response = await fetch(
    `${API_BASE_URL}/api/recommend-problems/${userId}`,
  );
  const problems = await response.json();

  if (problems && problems.length > 0) {
    // 서버에서 가져온 문제로 글로벌 QUESTIONS 배열 업데이트
    // (기존 QUESTIONS 구조에 맞게 매핑 필요)
    setupSimulator(problems);
    switchTab("simulator");
  }
}

function renderRadarChart(stats) {
  const canvas = document.getElementById("userRadarChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (myRadarChart) myRadarChart.destroy();

  myRadarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["문법", "구조", "독해", "어휘", "논리"],
      datasets: [
        {
          label: "지식 숙련도",
          data: [
            (stats.grammar_score || 0) * 100,
            (stats.structure_score || 0) * 100,
            (stats.reading_score || 0) * 100,
            (stats.vocabulary_score || 0) * 100,
            (stats.logic_score || 0) * 100,
          ],
          // 데이터 영역 색상 (메인 블루)
          backgroundColor: "rgba(37, 99, 235, 0.5)",
          borderColor: "#60a5fa",
          borderWidth: 3,
          // 꼭짓점 스타일링
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#2563eb",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      scales: {
        r: {
          min: 0,
          max: 100,
          beginAtZero: true,
          // 오각형 거미줄(그리드) 설정
          grid: {
            color: "rgba(255, 255, 255, 0.15)", // 연한 흰색 라인
            circular: false, // 이 부분을 false로 해야 원형이 아닌 '다각형'으로 그려짐!
          },
          // 중심에서 뻗어나가는 선
          angleLines: {
            display: true,
            color: "rgba(255, 255, 255, 0.3)",
            lineWidth: 1,
          },
          // 텍스트 라벨 (문법, 구조 등)
          pointLabels: {
            color: "#ffffff",
            font: {
              size: 14,
              weight: "bold",
              family: "Noto Sans KR",
            },
            padding: 15, // 도형과 글자 사이 간격
          },
          ticks: {
            display: false, // 숫자 숨김
            stepSize: 20, // 그리드 간격 (5단계 오각형 생성)
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context) => ` 숙련도: ${context.raw}%`,
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}
function initQuiz(idx) {
  const q = QUESTIONS[idx];
  currentQ = idx;

  document.getElementById("qNum").textContent = "Q." + q.num;
  document.getElementById("qType").textContent = q.type;
  document.getElementById("qTitle").innerHTML = q.title;
  document.getElementById("qFormula").textContent = q.formula;

  const riskVal = document.getElementById("qRiskVal");
  const riskBadge = document.getElementById("qRiskBadge");
  riskVal.textContent = q.risk;
  riskBadge.style.display = "inline-flex";
  riskBadge.classList.remove("high-risk");
  if (q.risk >= 70) {
    riskBadge.style.background = "var(--red-light)";
    riskBadge.style.color = "var(--red)";
    riskBadge.classList.add("high-risk");
  } else if (q.risk >= 50) {
    riskBadge.style.background = "var(--amber-light)";
    riskBadge.style.color = "var(--amber)";
  } else {
    riskBadge.style.background = "var(--green-light)";
    riskBadge.style.color = "var(--green)";
  }

  const forecast = document.getElementById("forecastText");
  if (q.risk >= 70) {
    forecast.textContent = `⚠️ 트윈 경고: 이 문제에서 오답 확률이 ${q.risk}%입니다. 풀이 전 수식을 반드시 확인하세요.`;
  } else if (q.risk >= 50) {
    forecast.textContent = `🔶 트윈 주의: 오답 확률 ${q.risk}% — 유사 유형에서 실수 패턴이 감지됩니다.`;
  } else {
    forecast.textContent = `✅ 트윈 안전: 오답 확률 ${q.risk}% — 이 유형은 강점 영역입니다. 자신 있게 풀어보세요.`;
  }

  setTimeout(() => {
    const fill = document.getElementById("gaugeFill");
    const val = document.getElementById("gaugeVal");
    fill.style.width = q.risk + "%";
    animateNumber(val, 0, q.risk, 1200, "%");
  }, 100);

  updateRiskCircle(q.risk);

  const optsEl = document.getElementById("qOptions");
  optsEl.innerHTML = "";
  q.opts.forEach(([text, isCorrect], i) => {
    const btn = document.createElement("button");
    btn.className = "q-opt-btn";
    btn.innerHTML = `<span class="opt-num">${i + 1}</span><span>${text}</span>`;
    btn.dataset.correct = isCorrect;
    btn.onclick = () => selectOption(btn, isCorrect, i);
    optsEl.appendChild(btn);
  });

  const resultMsg = document.getElementById("qResultMsg");
  resultMsg.className = "q-result-msg";
  resultMsg.textContent = "";

  if (answered[idx]) {
    restoreAnswerState(idx);
  }

  document.getElementById("qCounter").textContent =
    `${idx + 1} / ${QUESTIONS.length}`;
  updateStepIndicator();
  updateQuickNav();

  const riskLevel = q.risk >= 70 ? "고위험" : q.risk >= 50 ? "주의" : "안전";
  appendLog(
    `[TWIN] Q.${q.num} 로드 — 오답 확률 ${q.risk}% (${riskLevel})`,
    "twin",
  );
  appendLog(`[SCAN] 유형: ${q.type}`, "info");
  if (q.risk >= 70) {
    appendLog(`[WARN] 위험 문항 감지 — 집중 모니터링 활성화`, "warn");
  }
}

/* ──────────────────────────────────────────
   5. 정답 판별 (selectOption)
────────────────────────────────────────── */
function selectOption(btn, isCorrect, optIdx) {
  const q = QUESTIONS[currentQ];

  const allBtns = document.querySelectorAll(".q-opt-btn");
  allBtns.forEach((b) => {
    b.disabled = true;
    if (b.dataset.correct === "true") {
      b.classList.add("correct");
    }
  });

  if (isCorrect) {
    btn.classList.add("correct");
    answered[currentQ] = "correct";
    showResultMsg(true, q);
    appendLog(`[TWIN] ✓ 패턴 일치 — Q.${q.num} 정답 확인`, "ok");
    appendLog(`[ANAL] 풀이 패턴이 트윈 예측과 일치합니다.`, "info");
    appendLog(`[SYNC] 트윈 싱크율 +0.3% 업데이트`, "twin");
  } else {
    btn.classList.add("wrong");
    answered[currentQ] = "wrong";
    showResultMsg(false, q);
    appendLog(`[TWIN] ✗ 트윈 예측 실패 — Q.${q.num} 오답 감지`, "error");
    appendLog(`[ANAL] 오답 패턴 기록 중... 데이터베이스 업데이트`, "warn");
    appendLog(`[RISK] 해당 유형 위험도 +5% 조정`, "error");
    appendLog(
      `[TWIN] 트윈 분석 보기를 클릭하여 오답 원인을 확인하세요.`,
      "twin",
    );
  }

  updateQuickNav();
  updateStepIndicator();
}

function showResultMsg(isCorrect, q) {
  const msg = document.getElementById("qResultMsg");
  if (isCorrect) {
    msg.className = "q-result-msg show-correct";
    msg.textContent = "✓ 정답입니다! 트윈 예측과 풀이 패턴이 일치합니다.";
  } else {
    msg.className = "q-result-msg show-wrong";
    msg.textContent = `✗ 오답입니다. 트윈이 예측한 오답 확률: ${q.risk}% — 분석 보기를 클릭하세요.`;
  }
}

function restoreAnswerState(idx) {
  const q = QUESTIONS[idx];
  const allBtns = document.querySelectorAll(".q-opt-btn");
  allBtns.forEach((b) => {
    b.disabled = true;
    if (b.dataset.correct === "true") b.classList.add("correct");
  });
  const msg = document.getElementById("qResultMsg");
  if (answered[idx] === "correct") {
    msg.className = "q-result-msg show-correct";
    msg.textContent = "✓ 정답입니다! 트윈 예측과 풀이 패턴이 일치합니다.";
  } else {
    msg.className = "q-result-msg show-wrong";
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
  const container = document.getElementById("stepIndicator");
  container.innerHTML = "";
  QUESTIONS.forEach((q, i) => {
    const dot = document.createElement("div");
    dot.className = "step-dot";
    if (i === currentQ) {
      dot.classList.add(q.risk >= 70 ? "risk" : "active");
    } else if (answered[i]) {
      dot.classList.add("done");
    } else if (q.risk >= 70) {
      dot.style.background = "rgba(239,68,68,.3)";
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
  const container = document.getElementById("quickNavBtns");
  container.innerHTML = "";
  QUESTIONS.forEach((q, i) => {
    const btn = document.createElement("button");
    btn.className = "qnav-btn";
    btn.textContent = q.num;
    if (i === currentQ) btn.classList.add("active");
    if (q.risk >= 70) btn.classList.add("risk-q");
    if (answered[i]) btn.classList.add("done-q");
    btn.onclick = () => initQuiz(i);
    container.appendChild(btn);
  });
}

/* ──────────────────────────────────────────
   9. 위험도 원형 게이지
────────────────────────────────────────── */
function updateRiskCircle(risk) {
  const circle = document.getElementById("riskCircle");
  const valEl = document.getElementById("riskMeterVal");
  const labelEl = document.getElementById("riskMeterLabel");
  const circumference = 314;
  const offset = circumference - (circumference * risk) / 100;

  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
    animateNumber(valEl, 0, risk, 1000, "");
  }, 150);

  if (risk >= 70) {
    circle.style.stroke = "#f85149";
    labelEl.textContent = "⚠ 고위험 문항";
    labelEl.style.color = "#f85149";
  } else if (risk >= 50) {
    circle.style.stroke = "#d29922";
    labelEl.textContent = "⚡ 주의 필요";
    labelEl.style.color = "#d29922";
  } else {
    circle.style.stroke = "#3fb950";
    labelEl.textContent = "✓ 안전 구간";
    labelEl.style.color = "#3fb950";
  }
}

/* ──────────────────────────────────────────
   10. 터미널 로그 (appendLog + 타이핑 효과)
────────────────────────────────────────── */
function appendLog(text, type = "system") {
  logQueue.push({ text, type });
  if (!isTyping) processLogQueue();
}

function processLogQueue() {
  if (logQueue.length === 0) {
    isTyping = false;
    return;
  }
  isTyping = true;
  const { text, type } = logQueue.shift();
  typeLog(text, type, () => {
    setTimeout(processLogQueue, 80);
  });
}

function typeLog(text, type, callback) {
  const terminal = document.getElementById("terminalBody");
  const line = document.createElement("div");
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
      line.classList.remove("log-cursor");
      terminal.scrollTop = terminal.scrollHeight;
      if (callback) callback();
    }
  }, speed);
}

function clearLog() {
  const terminal = document.getElementById("terminalBody");
  terminal.innerHTML = "";
  logQueue = [];
  isTyping = false;
  appendLog("[SYSTEM] 로그 초기화 완료", "system");
  appendLog("[TWIN] 모니터링 재개 ▋", "twin");
}

/* ──────────────────────────────────────────
   11. 모달 시스템 (분석 모달)
────────────────────────────────────────── */
function openAnalysisModal() {
  const q = QUESTIONS[currentQ];
  const overlay = document.getElementById("analysisModalOverlay");

  document.getElementById("modalTitle").textContent =
    `Q.${q.num} 오답 원인 분석`;
  document.getElementById("modalRiskBadge").textContent =
    `오답 확률 ${q.risk}%`;
  document.getElementById("modalReason").textContent = q.reason;

  const bar = document.getElementById("modalRiskBar");
  bar.style.width = "0%";

  const ul = document.getElementById("modalSolutions");
  ul.innerHTML = "";
  q.solutions.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s;
    ul.appendChild(li);
  });

  overlay.classList.add("open");

  setTimeout(() => {
    bar.style.width = q.risk + "%";
  }, 50);

  appendLog(`[MODAL] 트윈 심층 분석 열람 — Q.${q.num}`, "twin");
  appendLog(`[ANAL] 오답 원인 패턴 분석 완료`, "info");
}

function closeAnalysisModal(e) {
  if (e && e.target !== document.getElementById("analysisModalOverlay")) return;
  document.getElementById("analysisModalOverlay").classList.remove("open");
}

/* ──────────────────────────────────────────
   12. 프로필 관리 모달
────────────────────────────────────────── */
function openProfileModal() {
  const overlay = document.getElementById("profileModalOverlay");
  overlay.classList.add("open");
}

function closeProfileModal(e) {
  if (e && e.target !== document.getElementById("profileModalOverlay")) return;
  document.getElementById("profileModalOverlay").classList.remove("open");
}

function saveProfile() {
  const userName = document.getElementById("inputName").value || "김노드";
  const school = document.getElementById("inputSchool").value || "서울고등학교";
  const grade = document.getElementById("selectGrade").value;
  const region = document.getElementById("inputRegion").value || "서울";
  const email = document.getElementById("inputEmail").value;
  const university = document.getElementById("inputUniversity").value;
  const major = document.getElementById("inputMajor").value;

  const initial = userName.charAt(0);
  document.getElementById("profileInitial").textContent = initial;
  document.getElementById("profileName").textContent = userName;
  document.getElementById("heroName").textContent = userName;
  document.getElementById("profileGrade").textContent = `고등학교 ${grade}학년`;

  document.getElementById("profileCardInitial").textContent = initial;
  document.getElementById("profileCardName").textContent = userName;
  document.getElementById("profileCardDetail").textContent =
    `고등학교 ${grade}학년 · ${region}`;
  document.getElementById("profileCardGoal").textContent =
    `목표: ${university} ${major}`;

  updateSyncRing();
  appendLog(
    `[TWIN] 프로필 정보 업데이트 — ${name} (${university} ${major})`,
    "twin",
  );
  appendLog(`[SYNC] 트윈 동기화율 +1.2% 조정`, "ok");
  showSaveStatus();

  closeProfileModal();
}

function updateSyncRing() {
  const syncRing = document.querySelector(".sync-ring");
  if (syncRing) {
    syncRing.style.animation = "none";
    setTimeout(() => {
      syncRing.style.animation = "spinRing 2s linear infinite";
    }, 10);
  }
}

function showSaveStatus() {
  const status = document.getElementById("saveStatus");
  if (status) {
    status.style.opacity = "1";
    setTimeout(() => {
      status.style.opacity = "0.5";
    }, 2000);
  }
}

/* ──────────────────────────────────────────
   13. AI 엔진 설정 로직
────────────────────────────────────────── */
function updatePrecision(value) {
  settings.precision = value;
  const label = value >= 50 ? "정교한 분석" : "빠른 분석";
  document.getElementById("precisionValue").textContent =
    `${label} (${value}%)`;
  appendLog(`[TWIN] 분석 정확도 조정 — ${label} (${value}%)`, "twin");
  updateSyncRing();
}

function toggleDataSource(source) {
  const weekBtn = document.getElementById("toggleWeek");
  const allBtn = document.getElementById("toggleAll");
  const label = document.getElementById("dataSourceLabel");

  if (source === "week") {
    weekBtn.classList.add("active");
    allBtn.classList.remove("active");
    settings.dataSource = "week";
    label.textContent = "최근 1주일 데이터 기반";
    appendLog(`[TWIN] 데이터 소스 변경 — 최근 1주일 기반 (빠른 반응)`, "info");
  } else {
    allBtn.classList.add("active");
    weekBtn.classList.remove("active");
    settings.dataSource = "all";
    label.textContent = "전체 누적 데이터 기반";
    appendLog(
      `[TWIN] 데이터 소스 변경 — 전체 누적 데이터 기반 (정교한 분석)`,
      "info",
    );
  }
  updateSyncRing();
}

function toggleAlert(type) {
  const btn = document.getElementById(
    "alert" + type.charAt(0).toUpperCase() + type.slice(1),
  );
  btn.classList.toggle("active");
  settings.alerts[type] = btn.classList.contains("active");
  const status = btn.classList.contains("active") ? "활성화" : "비활성화";
  appendLog(`[TWIN] 알림 설정 변경 — ${type} ${status}`, "info");
}

function updateSyncSensitivity(value) {
  settings.syncSensitivity = value;
  const levels = ["낮음", "낮음-중간", "중간", "중간-높음", "높음"];
  const level = levels[Math.floor(value / 20)];
  document.getElementById("syncValue").textContent =
    `${level} 민감도 (${value}%)`;
  appendLog(`[TWIN] 싱크 민감도 조정 — ${level} (${value}%)`, "twin");
  updateSyncRing();
}

function confirmResetTwin() {
  if (
    confirm(
      "정말로 트윈을 초기화하시겠습니까?\\n모든 학습 데이터가 삭제됩니다.",
    )
  ) {
    appendLog(`[WARN] 트윈 초기화 시작...`, "warn");
    appendLog(`[TWIN] 모든 학습 데이터 삭제 중...`, "error");
    setTimeout(() => {
      appendLog(`[SYSTEM] 새로운 트윈 생성 완료`, "system");
      appendLog(`[TWIN] 트윈 초기화 완료 — 새로운 학습 시작`, "ok");
      answered = new Array(QUESTIONS.length).fill(null);
    }, 1500);
  }
}

/* ──────────────────────────────────────────
   14. 위험 알림 리스트 (대시보드)
────────────────────────────────────────── */
function buildRiskList() {
  const container = document.getElementById("riskList");
  const riskItems = QUESTIONS.filter((q) => q.risk >= 60).sort(
    (a, b) => b.risk - a.risk,
  );

  riskItems.forEach((q) => {
    const item = document.createElement("div");
    item.className = "risk-item";
    item.innerHTML = `
      <span class="risk-item-num">Q.${q.num}</span>
      <div class="risk-item-body">
        <p class="risk-item-title">${q.type}</p>
        <p class="risk-item-type">${q.title.replace(/<[^>]*>/g, "").slice(0, 40)}...</p>
      </div>
      <span class="risk-item-pct">${q.risk}%</span>
    `;
    item.onclick = () => {
      switchTab("simulator");
      const qIdx = QUESTIONS.findIndex((x) => x.num === q.num);
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
  document.querySelectorAll(".sync-bar-fill").forEach((bar) => {
    const w = bar.dataset.width;
    setTimeout(() => {
      bar.style.width = w + "%";
    }, 300);
  });
}

/* ──────────────────────────────────────────
   17. 날짜 표시
────────────────────────────────────────── */
function setCurrentDate() {
  const el = document.getElementById("currentDate");
  const now = new Date();
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  };
  el.textContent = now.toLocaleDateString("ko-KR", options);
}

/* ──────────────────────────────────────────
   18. 주기적 터미널 로그
────────────────────────────────────────── */
const AMBIENT_LOGS = [
  { text: "[TWIN] 학습 패턴 실시간 분석 중...", type: "twin" },
  { text: "[SCAN] 뇌파 시뮬레이션 데이터 동기화 완료", type: "info" },
  { text: "[TWIN] 오늘 학습 집중도 지수: 82.4%", type: "twin" },
  { text: "[PRED] 다음 문항 오답 예측 모델 갱신 중", type: "info" },
  { text: "[SYNC] 트윈 싱크율 실시간 업데이트: 87.3%", type: "ok" },
  { text: "[ANAL] 풀이 속도 패턴 분석 완료", type: "info" },
  { text: "[TWIN] 집중력 저하 감지 — 짧은 휴식 권장", type: "warn" },
  { text: "[PRED] 치환적분 유형 위험도 재계산 중...", type: "warn" },
];
let ambientIdx = 0;

function startAmbientLogs() {
  setInterval(() => {
    const simTab = document.getElementById("tab-simulator");
    if (simTab && simTab.classList.contains("active")) {
      const log = AMBIENT_LOGS[ambientIdx % AMBIENT_LOGS.length];
      appendLog(log.text, log.type);
      ambientIdx++;
    }
  }, 6000);
}

/* ──────────────────────────────────────────
   19. 초기화 (DOMContentLoaded)
────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  setCurrentDate();
  fetchQuestionsFromServer();
  buildRiskList();
  animateSyncBars();
  startAmbientLogs();
  updateAIVisualization("115");
  setTimeout(() => {
    const correctEl = document.getElementById("correctCount");
    const riskEl = document.getElementById("riskCount");
    if (correctEl) animateNumber(correctEl, 0, 12, 1200, "");
    if (riskEl) animateNumber(riskEl, 0, 3, 800, "");
  }, 400);

  setTimeout(() => {
    appendLog("[TWIN] 대시보드 로드 완료 — 오늘의 학습 현황 분석 중", "twin");
    appendLog("[PRED] 위험 문항 3개 예보 완료 (Q.02, Q.04, Q.05)", "warn");
  }, 800);

  const profileOverlay = document.getElementById("profileModalOverlay");
  const analysisOverlay = document.getElementById("analysisModalOverlay");
  if (profileOverlay)
    profileOverlay.addEventListener("click", (e) => {
      if (e.target.id === "profileModalOverlay") closeProfileModal();
    });
  if (analysisOverlay)
    analysisOverlay.addEventListener("click", (e) => {
      if (e.target.id === "analysisModalOverlay") closeAnalysisModal();
    });

  console.log(
    "%c TWIN EDU Core v2.5 ",
    "background:#2563eb;color:white;font-size:14px;padding:4px 8px;border-radius:4px;",
  );
  console.log(
    "%c 디지털 트윈 학습 플랫폼 초기화 완료",
    "color:#2563eb;font-size:12px;",
  );
  console.log(
    "%c 프로필 관리 및 AI 엔진 설정 모듈 로드됨",
    "color:#7c3aed;font-size:12px;",
  );
});
window.switchTab = switchTab;
window.loadTargetUser = loadTargetUser;
window.prevQuestion = prevQuestion;
window.nextQuestion = nextQuestion;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.openAnalysisModal = openAnalysisModal;
window.closeAnalysisModal = closeAnalysisModal;
