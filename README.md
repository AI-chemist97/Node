# ⬡ TWIN EDU : AI Digital Twin for English Literacy Simulation

<div align="center">
  <img src="https://img.shields.io/badge/Status-Live_Prototype-success?style=for-the-badge">
  <img src="https://img.shields.io/badge/Backend-Node.js%20|%20MySQL-336791?style=for-the-badge&logo=mysql&logoColor=white">
  <img src="https://img.shields.io/badge/AI-Gemini_API-google?style=for-the-badge&logo=googlegemini&logoColor=white">
</div>

<p align="center">
  <strong>"틀린 후에 작성하는 오답 노트는 늦습니다."</strong><br>
  학습자의 과거 데이터를 기반으로 <strong>오답 확률을 사전에 예보</strong>하는 실시간 DB 연동형 AI 학습 시뮬레이터입니다.
</p>

---

## 🚀 Project Technical Core: Full-Stack Integration
본 프로젝트는 단순한 UI 기획안이 아닌, **Node.js 서버와 MySQL 데이터베이스가 AI 모델과 유기적으로 결합된 실제 구동 프로토타입**입니다.

### 1. UID-Based Real-time Sync (실시간 데이터 동기화)
* **Mechanism**: 복잡한 JWT 인증 대신 **UID(고유 번호) 기반 고속 매칭 시스템**을 구축하여 시연성을 높였습니다. 
* **Implementation**: 유저 번호를 입력하면 서버를 통해 DB에 저장된 과거 풀이 로그와 소요 시간 데이터를 즉각 호출합니다. 

### 2. Gemini-Powered Error Forecasting (오답 사전 예보)
* **Mechanism**: Gemini 1.5 Pro의 대규모 컨텍스트를 활용하여 누적 데이터를 분석하고, 새로운 문항에 대한 **오답 선택 확률(%)**을 산출합니다. 
***Simulation**: 학습자가 빠지기 쉬운 논리적 함정(인과관계 왜곡 등)을 사전에 경고하여 실전 실수를 방지합니다. 

---

## 🏗️ System Architecture & Engineering
[cite_start]일주일간의 집중 개발 기간 동안 핵심 기술 파이프라인 구축에 집중했습니다. 

* **Multi-Agent System**:
    * **Pattern Analyst**: 사용자의 반복적 오류 습관을 정량적으로 정의합니다.
    * **Twin Simulator**: 분석된 데이터를 바탕으로 사고 방식을 복제하여 함정을 예측합니다. 
* **Optimization Strategy**:
    * **Context Caching**: 반복 호출되는 지문 분석 데이터를 캐싱하여 토큰 소비를 최소화하고 응답 속도를 향상시켰습니다.
    * **Structured Output**: AI 응답을 **JSON 모드**로 강제하여 서버-DB-UI 간의 데이터 무결성을 확보했습니다.

---

## 👥 Team Node (노드)
기술적 실행력과 기획의 조화를 지향하는 3인 팀입니다.

| Role | Name | Technical Contribution |
| :--- | :---: | :--- |
| **Lead Developer** | **남윤희** | **Full-stack Development.** 61억 건 데이터 처리 경력을 바탕으로 서버-DB 아키텍처 구현 및 AI 엔진 개발 전담. [cite: 1, 2, 18, 30] |
| **UIUX & Planning** | **이유민** | **Service Logic Design.** 사용자 인지 과정을 고려한 인터페이스 설계 및 공모전 리포트 총괄 작성. [cite: 23, 30] |
| **Tech Consultant** | **김민제** | **Reliability Advisor.** 프로젝트 아키텍처 타당성 검토 및 기술적 로드맵 지원. [cite: 28] |

---

## 🛠️ Tech Stack & Implementation
***Language**: `Python`, `JavaScript (Node.js)` 
***AI Engine**: `Gemini 1.5 Pro`, `Claude 3.5 Sonnet`, `LangChain` 
* **Infrastructure**: `Express (Node.js)`, `MySQL (Database)` 
* **Dev Workflow**: `Cursor`, `Claude Code` 

---

## 📈 Future Roadmap
***Security Enhancement**: 프로토타입의 UID 시스템을 JWT(JSON Web Token) 기반 보안 인증 체계로 고도화 예정. 
* **Multi-Domain Expansion**: 영어 독해를 넘어 수학, 과학 등 논리 구조 분석이 필요한 전 과목으로 트윈 모델 확장. 

<div align="right">
  © 2026 Team Node. Powered by <strong>Gemini API</strong>.
</div>
