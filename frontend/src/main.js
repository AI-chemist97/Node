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
window.login = async () => {
  // 오버레이에 있는 입력창에서 ID를 가져옴
  const userId = document.getElementById("userInputId").value.trim();

  if (!userId) {
    alert("유저 ID를 입력해주세요.");
    return;
  }

  appendLog(`[AUTH] 유저 ${userId} 접속 시도...`, "info");

  // 데이터 로드
  await updateAIVisualization(userId);
  await loadQuestionsFromSupabase();

  isLoggedIn = true;
  updateUIByLoginStatus(); // 화면 잠금 해제
};
window.logout = logout;
window.supabase = supabase;
window.Chart = Chart;
let isLoggedIn = false; // 로그인 상태 관리
let QUESTIONS = []; // 하드코딩된 배열 삭제 후 빈 배열로 초기화
/* ──────────────────────────────────────────
   1.5. 서버 연결 설정 (추가됨)
────────────────────────────────────────── */
// 로그인 함수 (ID 입력 기반)
async function login() {
  const userId = document.getElementById("userInputId").value.trim();
  if (!userId) {
    alert("유저 ID를 입력해주세요.");
    return;
  }

  appendLog(`[AUTH] 유저 ${userId} 접속 시도...`, "info");

  // 데이터 동기화 시도
  await updateAIVisualization(userId);

  // 데이터 로드가 성공적이라 가정하고 로그인 처리 (실제로는 API 응답에 따라 조건문 처리 권장)
  isLoggedIn = true;
  updateUIByLoginStatus();
  appendLog(`[AUTH] 로그인 성공. 세션이 시작되었습니다.`, "ok");
}

// 로그아웃 함수
function logout() {
  if (!confirm("로그아웃 하시겠습니까?")) return;

  isLoggedIn = false;
  // 데이터 초기화
  QUESTIONS = [];
  answered = [];
  document.getElementById("userInputId").value = "";

  // UI 초기화
  updateUIByLoginStatus();
  appendLog(`[AUTH] 로그아웃 되었습니다.`, "system");

  // 첫 페이지(대시보드)로 강제 이동
  switchTab("dashboard");
}

// 로그인 상태에 따른 UI 가시성 제어
function updateUIByLoginStatus() {
  const loginOverlay = document.getElementById("loginOverlay");
  const mainContent = document.querySelector(".main-content");
  // const sidebarNav = document.querySelector(".sidebar-nav");
  const logoutBtnWrap = document.getElementById("logoutBtnWrap");

  if (isLoggedIn) {
    // 1. 로그인 성공 상태
    document.body.classList.add("logged-in"); // body에 클래스 추가
    loginOverlay.style.display = "none";
    mainContent.style.opacity = "1";
    mainContent.style.pointerEvents = "auto";
    // sidebarNav.style.display = "block";
    if (logoutBtnWrap) logoutBtnWrap.style.display = "block";

    // 모바일 전용: 로그인 성공하면 상단 입력창 구역을 아예 날려버림 (선택사항)
    const authArea = document.querySelector(".sidebar-auth-area");
    if (authArea) authArea.style.display = "none";
  } else {
    // 2. 로그아웃 상태
    document.body.classList.remove("logged-in"); // 클래스 제거
    loginOverlay.style.display = "flex";
    mainContent.style.opacity = "0.1";
    mainContent.style.pointerEvents = "none";
    // sidebarNav.style.display = "none";
    if (logoutBtnWrap) logoutBtnWrap.style.display = "none";
  }
}

async function loadQuestionsFromSupabase() {
  appendLog("[SYSTEM] 데이터베이스에서 문항 동기화 중...", "info");

  try {
    const { data, error } = await supabase
      .from("problems")
      .select("*")
      .limit(5);

    if (error) throw error;

    if (data && data.length > 0) {
      // 데이터 매핑: DB 컬럼명을 프론트엔드용 객체 키로 변환
      QUESTIONS = data.map((item, index) => {
        return {
          num: (index + 1).toString().padStart(2, "0"),
          title: "다음 질문에 대한 가장 적절한 답을 고르시오.",
          formula: item.formula,
          type: item.tags || "기타",

          // 핵심 수정: 인덱스 i를 사용하여 정답 여부 판단
          opts: (item.options || []).map((opt, i) => {
            const text = typeof opt === "object" ? opt.text : opt;

            return [
              text,
              // item.correct_answer가 숫자(0,1,2,3)라면 i와 비교
              // 혹시 모르니 Number()로 형변환하여 엄격하게 비교함
              i === Number(item.correct_answer),
            ];
          }),

          risk: item.risk || Math.floor(Math.random() * 40) + 40,
          reason: "패턴 분석 결과 취약 구간으로 확인되었습니다.",
          solutions: ["해당 문법 개념 재확인", "유사 문제 풀이 권장"],
        };
      });

      // 무작위 셔플
      QUESTIONS.sort(() => Math.random() - 0.5);
      console.log(QUESTIONS);

      // UI 컴포넌트 갱신
      buildRiskList();
      updateQuickNav();

      // 데이터 로드 성공 후 첫 번째 문제 바로 표시 (에러 방지)
      if (QUESTIONS.length > 0) initQuiz(0);

      appendLog(
        `[SUCCESS] ${QUESTIONS.length}개의 문항 로드 및 매핑 완료`,
        "ok",
      );
    }
  } catch (err) {
    appendLog(`[ERROR] DB 로드 실패: ${err.message}`, "error");
  }
}
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
    console.log(users.name);
    document.getElementById("profileCardInitial").textContent =
      users.name.charAt(0);

    document.getElementById("profileCardName").textContent = users.name;
    document.getElementById("profileCardDetail").textContent =
      `${users.grade} · ${users.region}`;
    document.getElementById("profileCardGoal").textContent =
      `목표: ${users.target_university} ${users.target_major}`;
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
  // QUESTIONS가 없거나 비어있는 경우 처리
  if (!QUESTIONS || QUESTIONS.length === 0) {
    appendLog("[WARN] 표시할 문항 데이터가 없습니다.", "warn");
    return;
  }
  const q = QUESTIONS[idx];
  if (!q) {
    console.error(`Index ${idx} 에 해당하는 문제가 없습니다.`);
    return;
  }
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
   5. 정답 판별 및 흐름 제어 (수정됨)
────────────────────────────────────────── */
async function selectOption(btn, isCorrect, optIdx) {
  const q = QUESTIONS[currentQ];
  const allBtns = document.querySelectorAll(".q-opt-btn");

  allBtns.forEach((b) => {
    b.disabled = true;
    // 정답인 버튼은 무조건 초록색(correct)으로 표시 (사용자 선택 여부 상관없이)
    if (b.dataset.correct === "true") {
      b.classList.add("correct");
    }
  });
  if (!isCorrect) btn.classList.add("wrong");

  answered[currentQ] = isCorrect ? "correct" : "wrong";

  // 1. 서버 점수 동기화 (기존 로직 유지)
  const category = q.type.split(" · ")[0];
  await syncScoreToServer(isCorrect, category);

  // 2. 마지막 문제인지 체크
  if (currentQ === QUESTIONS.length - 1) {
    // 모든 문제를 다 풀었을 때: 로딩 후 리포트로 이동
    showFinalLoadingAndGoToReport();
  } else {
    // 다음 문제가 있을 때: 1.5초 후 자동으로 다음 문제 이동 (사용자 편의성)
    setTimeout(() => {
      nextQuestion();
      appendLog(
        `[SYSTEM] 다음 문항 Q.${QUESTIONS[currentQ].num} 분석 시작`,
        "info",
      );
    }, 1500);
  }
}

/* ──────────────────────────────────────────
   로딩 애니메이션 후 리포트 이동 (새로 추가)
────────────────────────────────────────── */
function showFinalLoadingAndGoToReport() {
  const simulatorTab = document.getElementById("tab-simulator");

  // 1. 시뮬레이터 화면을 로딩 상태로 변경
  simulatorTab.innerHTML = `
    <div class="placeholder-section">
      <div class="spinner spinner-lg"></div>
      <h2 style="margin-top: 20px;">AI 트윈이 학습 결과를 분석 중입니다...</h2>
      <p>패턴 데이터베이스 동기화 및 취약 구간 리포트를 생성하고 있습니다.</p>
    </div>
  `;

  appendLog(`[PROCESS] 전 세션 학습 데이터 통합 분석 중...`, "twin");
  appendLog(`[PROCESS] 맞춤형 교육 솔루션 생성 완료 ▋`, "ok");

  // 2. 3초 뒤에 리포트 탭으로 강제 이동
  setTimeout(() => {
    switchTab("report");
    renderFinalReport(); // 리포트 내용 렌더링 함수 호출
  }, 3000);
}

async function renderFinalReport() {
  const reportTab = document.getElementById("tab-report");
  const correctCount = answered.filter((a) => a === "correct").length;
  const total = QUESTIONS.length;
  const score = Math.round((correctCount / total) * 100);
  // 틀린 카테고리만 추출
  const wrongCategories = QUESTIONS.filter(
    (_, i) => answered[i] === "wrong",
  ).map((q) => q.type.split(" · ")[0]);

  reportTab.innerHTML = `
    <div class="settings-container">
      <div class="hero-section" style="background: linear-gradient(135deg, var(--blue-dark), var(--purple));">
        <div class="hero-left">
          <h1 class="hero-title">시뮬레이션 분석 완료</h1>
          <p class="hero-sub">학습자님의 트윈이 분석한 오늘의 최종 성적표입니다.</p>
          <div class="hero-actions">
            <button class="btn-primary" onclick="location.reload()">다시 도전하기</button>
          </div>
        </div>
        <div class="hero-right">
          <div class="orb-inner" style="width: 120px; height: 120px;">
            <span class="orb-label">SCORE</span>
            <span class="orb-value">${score}</span>
          </div>
        </div>
      </div>

      <div class="two-col-grid">
        <div class="section-card">
          <div class="card-header"><h2 class="card-title">정답률 상세</h2></div>
          <div style="font-size: 40px; font-weight: 800; text-align: center; padding: 20px; color: var(--blue);">
            ${correctCount} <span style="font-size: 20px; color: var(--text-sub);">/ ${total}</span>
          </div>
        </div>
        <div class="section-card">
          <div class="card-header"><h2 class="card-title">AI 집중 권고 사항</h2></div>
          <ul class="modal-solution" style="list-style: none; padding: 0;">
            ${score < 100 ? "<li>⚠️ 오답 문항의 패턴 분석 결과, 특정 유형의 반복 실수가 감지되었습니다.</li>" : "<li>✅ 모든 유형에서 완벽한 숙련도를 보이고 있습니다.</li>"}
            <li>취약 영역 점수 동기화가 서버에 완료되었습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
  // AI API 호출 (백엔드)
  let aiAdvice = "";
  try {
    const aiRes = await fetch(`${API_BASE_URL}/api/ai-advice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wrong_topics: wrongCategories }),
    });
    const aiData = await aiRes.json();
    aiAdvice = aiData.advice;
  } catch (err) {
    aiAdvice =
      "문법 및 구조 분석 결과, 특정 유형의 반복 실수가 감지되었습니다. 취약 구간에 대한 집중 복습이 필요합니다.";
  }
  // 화면 렌더링
  reportTab.innerHTML = `
    <div class="settings-container">
       <div class="hero-section" style="...">
          </div>
       <div class="section-card" style="border-left: 5px solid var(--blue);">
          <div class="card-header"><h2 class="card-title">🤖 AI 트윈의 실시간 총평</h2></div>
          <p>"${aiAdvice}"</p>
       </div>
       </div>
  `;
}
/* ──────────────────────────────────────────
   실시간 점수 서버 반영 로직 (PATCH)
────────────────────────────────────────── */
async function syncScoreToServer(isCorrect, category) {
  const userId = document.getElementById("userInputId")?.value.trim() || "115";

  // 5개 카테고리 컬럼명 매핑
  const fieldMap = {
    문법: "grammar_score",
    독해: "reading_score",
    어휘: "vocabulary_score",
    구조: "structure_score",
    논리: "logic_score",
  };

  const columnName = fieldMap[category] || "grammar_score";

  try {
    appendLog(`[SYNC] ${category} 영역 분석 데이터 서버 전송...`, "info");

    const response = await fetch(`${API_BASE_URL}/api/user-stats/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field: columnName,
        is_correct: isCorrect,
        inc_value: isCorrect ? 0.05 : -0.02, // 정답 시 +5%, 오답 시 -2%
      }),
    });

    if (response.ok) {
      appendLog(`[SUCCESS] AI 트윈 데이터 동기화 완료`, "ok");
      // 데이터가 바뀌었으므로 대시보드(차트 등)를 비동기로 다시 그림
      await updateAIVisualization(userId);
    }
  } catch (err) {
    console.error("Score Sync Error:", err);
    appendLog(`[ERROR] 데이터 동기화 실패`, "error");
  }
}
/* ──────────────────────────────────────────
   실시간 데이터 업데이트 로직 (새로 추가)
────────────────────────────────────────── */
function updateLiveDashboard() {
  const correctCount = answered.filter((a) => a === "correct").length;
  const wrongCount = answered.filter((a) => a === "wrong").length;

  // 1. 상단 통계 카드 업데이트 (애니메이션 효과 포함)
  const correctEl = document.getElementById("correctCount");
  const riskEl = document.getElementById("riskCount");

  if (correctEl)
    animateNumber(
      correctEl,
      parseInt(correctEl.textContent) || 0,
      correctCount,
      600,
      "",
    );
  if (riskEl) {
    // 오답 위험 건수를 현재 오답 수에 따라 실시간 조정 (가상 로직)
    const currentRiskItems = QUESTIONS.length - (correctCount + wrongCount);
    animateNumber(
      riskEl,
      parseInt(riskEl.textContent) || 0,
      wrongCount,
      600,
      "",
    );
  }

  // 2. 트윈 싱크율 실시간 재계산
  const syncPercentEl = document.getElementById("syncPercent");
  if (syncPercentEl) {
    const baseSync = 87; // 초기값
    const newSync = baseSync + correctCount * 1.2 - wrongCount * 0.8;
    animateNumber(
      syncPercentEl,
      parseInt(syncPercentEl.textContent) || 0,
      Math.round(newSync),
      800,
      "",
    );
  }

  // 3. 터미널 추가 분석 로그
  setTimeout(() => {
    appendLog(`[SYNC] 실시간 트윈 동기화율 업데이트 완료`, "twin");
    appendLog(`[SYSTEM] 대시보드 데이터 동기화 ▋`, "system");
  }, 1000);
}
function showResultMsg(isCorrect, q) {
  const msg = document.getElementById("qResultMsg");
  if (!msg) return;

  // q.opts 배열에서 [텍스트, true] 형태인 요소를 찾습니다.
  const correctOpt = q.opts.find((opt) => opt[1] === true);
  const correctAnswerText = correctOpt ? correctOpt[0] : "정답 없음";

  if (isCorrect) {
    msg.className = "q-result-msg show-correct";
    msg.innerHTML = `✓ <strong>정답입니다!</strong>`;
  } else {
    msg.className = "q-result-msg show-wrong";
    msg.innerHTML = `✗ <strong>오답입니다.</strong> 정답은 <strong>"${correctAnswerText}"</strong> 입니다.`;
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

  // 자동 스크롤
  terminal.scrollTop = terminal.scrollHeight;

  let i = 0;
  // 속도 조절: 한글 포함 여부에 따라 속도 최적화
  const speed = 15;

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
/**
 * 트윈 심층 분석 모달 열기
 * 1. 보안을 위해 textContent와 DocumentFragment 사용
 * 2. 애니메이션 최적화 (50ms)
 * 3. 시스템 로그 기록 포함
 */
function openAnalysisModal() {
  const q = QUESTIONS[currentQ];
  const overlay = document.getElementById("analysisModalOverlay");
  const bar = document.getElementById("modalRiskBar");
  const ul = document.getElementById("modalSolutions");

  // 1. 텍스트 및 데이터 바인딩
  document.getElementById("modalTitle").textContent =
    `Q.${q.num} 오답 원인 분석`;
  document.getElementById("modalRiskBadge").textContent =
    `오답 확률 ${q.risk}%`;
  document.getElementById("modalReason").textContent = q.reason;

  // 2. 솔루션 리스트 초기화 및 생성 (성능 최적화 버전)
  ul.innerHTML = "";
  const fragment = document.createDocumentFragment();
  q.solutions.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s;
    fragment.appendChild(li);
  });
  ul.appendChild(fragment);

  // 3. 모달 표시 및 애니메이션 초기화
  bar.style.width = "0%";
  overlay.classList.add("open");

  // 4. 게이지 애니메이션 실행
  setTimeout(() => {
    bar.style.width = q.risk + "%";
  }, 50);

  // 5. 로그 기록 (분석용)
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

/* ──────────────────────────────────────────
   프로필 정보 DB 업데이트 및 UI 반영
────────────────────────────────────────── */
/* ──────────────────────────────────────────
   프로필 정보 저장 (백엔드 PATCH API 사용)
────────────────────────────────────────── */
window.saveProfile = async () => {
  // 현재 조회 중인 유저 ID 가져오기 (기본값 115)
  const userId = document.getElementById("userInputId")?.value.trim() || "115";
  const schoolName =
    document.getElementById("inputSchool").value || "서울고등학교";
  const rawGrade = document.getElementById("selectGrade").value;

  const formattedGrade = schoolName.includes("중학")
    ? `중학교 ${rawGrade}학년`
    : `고등학교 ${rawGrade}학년`;
  // 1. 폼 데이터 수집
  const profileData = {
    name: document.getElementById("inputName").value || "김노드",
    school_name: schoolName,
    grade: formattedGrade, // 가공된 학년 데이터 삽입
    region: document.getElementById("inputRegion").value,
    target_university: document.getElementById("inputUniversity").value,
    target_major: document.getElementById("inputMajor").value,
  };

  try {
    appendLog(`[SYSTEM] 유저 ${userId} 데이터 서버 전송 중...`, "info");

    // 2. 백엔드 페치(fetch) API 호출 (PATCH 방식)
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData), // 수집한 데이터를 JSON으로 변환
    });

    if (!response.ok) {
      const errorDetail = await response.json();
      throw new Error(errorDetail.error || "서버 응답 오류");
    }

    const result = await response.json();
    console.log("서버 저장 완료:", result);

    // 3. UI 요소 즉시 업데이트
    const initial = profileData.name.charAt(0);

    // 사이드바 업데이트
    document.getElementById("profileInitial").textContent = initial;
    document.getElementById("profileName").textContent = profileData.name;
    document.getElementById("profileGrade").textContent =
      `고등학교 ${profileData.grade}학년`;

    // 설정 페이지 프로필 카드 업데이트
    if (document.getElementById("profileCardName")) {
      document.getElementById("profileCardInitial").textContent = initial;
      document.getElementById("profileCardName").textContent = profileData.name;
      document.getElementById("profileCardDetail").textContent =
        `고등학교 ${profileData.grade}학년 · ${profileData.region}`;
      document.getElementById("profileCardGoal").textContent =
        `목표: ${profileData.target_university} ${profileData.target_major}`;
    }

    // 성공 로그 및 효과
    if (typeof updateSyncRing === "function") updateSyncRing();
    appendLog(`[SUCCESS] 서버 동기화 완료 — ${profileData.name}`, "twin");
    if (typeof showSaveStatus === "function") showSaveStatus();

    // 모달 닫기
    closeProfileModal();
  } catch (err) {
    appendLog(`[ERROR] 서버 저장 실패: ${err.message}`, "error");
    console.error("Fetch API Error:", err);
    alert("정보를 저장하는 중 서버 에러가 발생했습니다.");
  }
};
// 회원가입/로그인 UI 전환
window.toggleAuthMode = (isSignup) => {
  document.getElementById("loginFields").style.display = isSignup
    ? "none"
    : "block";
  document.getElementById("signupFields").style.display = isSignup
    ? "block"
    : "none";
  document.getElementById("authTitle").textContent = isSignup
    ? "트윈 만들기"
    : "환영합니다!";
  document.getElementById("authSub").textContent = isSignup
    ? "기초 정보를 입력하고 AI 분석을 시작하세요."
    : "AI 디지털 트윈 학습을 위해 로그인하세요.";
};

// 회원가입 처리
window.handleSignup = async () => {
  const id = document.getElementById("signupId").value.trim();
  const name = document.getElementById("signupName").value.trim();

  if (!id || !name) return alert("모든 항목을 입력해주세요.");

  try {
    const res = await fetch(`${API_BASE_URL}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id, name: name }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    alert("회원가입이 완료되었습니다! 생성된 ID로 로그인해주세요.");
    toggleAuthMode(false); // 로그인 모드로 전환
    document.getElementById("userInputId").value = id;
  } catch (err) {
    alert("이미 존재하는 ID이거나 오류가 발생했습니다.");
  }
};
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
document.addEventListener("DOMContentLoaded", async () => {
  setCurrentDate();
  fetchQuestionsFromServer();
  buildRiskList();
  animateSyncBars();
  await loadQuestionsFromSupabase();
  startAmbientLogs();
  updateUIByLoginStatus(); // 초기 비로그인 상태 세팅
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
