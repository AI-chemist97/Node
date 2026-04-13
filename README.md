# ⬡ TWIN EDU : AI Digital Twin for English Literacy Simulation

<div align="center">
  <img src="https://img.shields.io/badge/Status-Live_Prototype-success?style=for-the-badge">
  <img src="https://img.shields.io/badge/Backend-FastAPI%20|%20Supabase-00a300?style=for-the-badge&logo=fastapi&logoColor=white">
  <img src="https://img.shields.io/badge/AI-Gemini_Flash-google?style=for-the-badge&logo=googlegemini&logoColor=white">
</div>

<p align="center">
  <strong>"틀린 후에 작성하는 오답 노트는 늦습니다."</strong><br>
  학습자의 사고 패턴을 데이터로 모델링하여 <strong>오답 확률을 사전에 예보</strong>하는 실시간 데이터 연동형 AI 학습 시뮬레이터입니다.
</p>

---

## 📌 Project Overview
본 프로젝트는 영어 독해 학습 과정에서 발생하는 **'사고의 관성'**을 해결하기 위한 시스템입니다. 학습자가 문장을 해석할 수 있음에도 불구하고 특정 논리 구조(인과관계 왜곡, 지엽 정보 일반화 등)에서 반복적으로 오답을 선택하는 문제를 **AI 디지털 트윈** 기술로 교정합니다.

## 🎯 Problem Statement
* **사고의 관성**: 동일한 논리 구조에서 학습자의 주관이 개입되어 발생하는 반복적 오답.
* **분석의 불명확성**: 단순 실수와 구조적 사고 오류를 객관적으로 구분하기 어려움.
* **사후 학습의 한계**: 해설 중심의 사후 학습으로는 동일 유형의 재발 방지에 한계 존재.

---

## 💡 Core Solution: Digital Twin Sync
사용자의 문제 풀이 데이터를 실시간으로 수집하여 디지털 트윈을 구축하고, 오답 발생 구조를 정밀 분석합니다.

1. **사고 패턴 동기화 (Twin Sync)**: 유저 고유 ID 기반으로 과거 풀이 로그 및 소요 시간을 실시간 연동하여 개인별 오답 패턴을 수치화합니다.
2. **비동기 UX 흐름**: 문제 완료 시 "AI 분석 중" 로딩 섹션을 통해 데이터 동기화 과정을 시각화하고, 분석 리포트로 자동 전환합니다.
3. **AI 피드백 생성**: Gemini 1.5 Flash를 활용하여 취약 영역에 대한 실시간 보완 학습 가이드를 생성합니다.

---

## 🏗️ System Architecture & Engineering
단순 기획안이 아닌, **FastAPI 백엔드와 Supabase DB가 AI 모델과 유기적으로 결합된 실제 구동 프로토타입**입니다.

### 1. Data Pipeline & Real-time Sync
* **Mechanism**: 유저 고유 ID 기반 매칭 시스템을 통해 실시간 DB 연동 환경 구축.
* **Implementation**: 서버 API(POST/PATCH)를 통해 개인별 오답 프로필을 벡터화하여 저장 및 호출.

### 2. AI Utilization & Optimization
* **Model**: **Gemini 1.5 Flash** (빠른 추론 성능 및 대규모 컨텍스트 처리 최적화).
* **Optimization**: 
    * **Structured Output**: AI 응답을 JSON 모드로 제어하여 서버-UI 간 데이터 무결성 확보.
    * **Few-shot Prompting**: 논리 오류 유형 분류의 정확도와 재현성 극대화.
    * **Context Caching**: 반복 호출되는 지문 데이터의 토큰 비용 절감 및 응답 지연 최소화.

---

## 🛠️ Tech Stack
* **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS, Vite)
* **Backend**: Python (FastAPI), Uvicorn
* **Database**: Supabase (PostgreSQL)
* **AI Engine**: Google Gemini API (1.5 Flash)
* **Dev Tools**: Cursor, Claude Code, Gemini, Chat gpt, Git

---

## 👥 Team Node
기술적 실행력과 기획의 조화를 지향하는 전문 인력으로 구성되었습니다.

| Role | Name | Contribution |
| :--- | :--- | :--- |
| **Lead Developer** | **남윤희** | **Full-stack Development.** 대용량 데이터 처리 및 파이프라인 최적화 경험을 바탕으로 서버-DB 아키텍처 및 AI 엔진 개발 전담. |
| **UI/UX & Planning** | **이유민** | **Service Logic Design.** 사용자 인지 과정을 고려한 인터페이스 설계 및 데이터 시각화 로직 기획. |
| **Tech Consultant** | **김민제** | **Reliability Advisor.** 프로젝트 아키텍처 타당성 검토 및 기술적 고도화 전략 지원. |

---

## 📈 Expected Impact
* **선제적 오답 방어**: 인지하지 못한 사고 오류를 '위험 확률'로 미리 인지시켜 실전 실수 감소.
* **메타인지 형성**: 시각화된 '트윈 싱크율' 데이터를 통해 자신의 독해 습관을 객관적으로 파악.
* **학습 효율 극대화**: AI가 예보한 고위험 문항에 학습 자원을 집중하여 성적 향상 폭 가속화.

<div align="right">
  © 2026 Team Node. Powered by <strong>Gemini API</strong>.
</div>
