# 🗺️ EduMechanic 3D - 이력 관리 로드맵 (Roadmap)

본 문서는 `EduMechanic 3D` 프로젝트의 마일스톤, 예정된 작업 및 완료된 기능 이력을 추적 관리하는 **공식 로드맵 문서**입니다.  
상세 기능 및 시스템 아키텍처 명세는 [`docs/spec.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/spec.md)를 참조하며, 각 단계별 완료 이력은 [`docs/history/walkthroughs/`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/) 아래의 워크쓰루 상세 레포트를 참조합니다.

---

## 💡 핵심 워크플로우 & AI 에이전트 개발 전략

```
[1. 인지 (Vision)] ──► [2. 탐색/추론 (RAG)] ──► [3. 하이브리드 보정] ──► [4. 3D 파라메트릭 CAD 생성]
 (VLM 객체 세그먼트)     (특허/매뉴얼/기존 DB)    (실측값 vs 근사치)      (CadQuery ➔ STEP/GLB)
                                 ▲                                           │
                                 └────────── [데이터 재활용 루프] ──────────────┘
                                           (커뮤니티 DB 축적 ➔ Zero LLM 비용)
```

1. **Step 1 (Vision Perception Agent):** 사진 촬영 ➔ VLM 객체 세그먼테이션 및 기계 메커니즘 1차 라벨링.
2. **Step 2 (Mech RAG & Knowledge Agent):** 기존 유저 축적 3D DB 및 특허/매뉴얼 Vector DB 우선 검색 (Cache First).
3. **Step 3 (Hybrid Dimension Fixer):** 실측/특허 문서가 존재할 경우 **정밀 치수 매핑**, 없으면 **물리적 공학 근사치 추론**.
4. **Step 4 (3D Parametric CAD & Edu Agent):** CadQuery 기반 정밀 3D CAD 스크립트 실행, FDM/SLA 공차 적용 및 하브루타 AI 퀴즈 카드 자동 발행.
5. **Data Reuse & Token Cost Optimization:** 생성된 3D 탐구 카드는 DB/Vector Index에 저장되어, 향후 동일/유사 제품 조회 시 **LLM API 비용 0원(Cache hit)**으로 즉시 서빙.

---

## 🎯 전체 마일스톤 이행 현황 (Overall Status)

| Phase | 단계명 | 핵심 AI 에이전트 & 연동 목표 | 상태 | 완료 날짜 | 상세 이력 문서 |
| --- | --- | --- | --- | --- | --- |
| **Phase 1** | **3D Engine & Viewer Core / MVP** | 3D WebGL 캔버스, Zustand 상태, FastAPI 스켈레톤, CadQuery/VLM 스키마 하네스 | **✅ 완료** | 2026-08-06 | [`2026-08-06_phase1_mvp_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase1_mvp_construction.md) |
| **Phase 2** | **AI Agent Pipeline & Data Reuse** | 1~4단계 AI 에이전트 파이프라인, Mech RAG, 데이터 재활용 캐싱 & LLM 비용 최적화 | **✅ 완료** | 2026-08-06 | [`2026-08-06_phase2_ai_pipeline_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase2_ai_pipeline_construction.md) |
| **Phase 3** | **Real-Time Co-Create & Fork/Remix** | 모둠 실시간 3D Yjs 동기화, 탐구 카드 Fork/리믹스 생태계, 파스텔 Claymorphism UI | **✅ 완료** | 2026-08-06 | [`2026-08-06_phase3_cocreate_fork_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase3_cocreate_fork_construction.md) |
| **Phase 4** | **Field Validation & Performance** | 태블릿 WebGL 60 FPS 최적화, 교실 현장 알파 테스트, 3D 수행평가 배지 리포트 PDF | **✅ 완료** | 2026-08-06 | [`2026-08-06_phase4_field_validation_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase4_field_validation_construction.md) |
| **Phase 5** | **Cloud Deployment & LMS Integration** | Docker Compose 프로덕션 인프라, Vercel 명세, Google Classroom LMS API 연동 | **✅ 완료** | 2026-08-06 | [`2026-08-06_phase5_cloud_lms_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase5_cloud_lms_construction.md) |
| **Phase 6** | **WebXR AR Mode & 3D Printer Slicer** | WebXR 책상 증강현실 모드, Bambu/Cura 3D 프린터 3MF/STL 내보내기 | **✅ 완료** | 2026-08-06 | [`2026-08-06_phase6_ar_slicer_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase6_ar_slicer_construction.md) |
| **Phase 7** | **Voice Tutor Mechamong & 3D Interaction** | AI 음성 하브루타 튜터 '메카몽' STT/TTS 및 3D 음성 연동 인터랙션 | **✅ 완료** | 2026-08-06 | [`2026-08-06_phase7_voice_tutor_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase7_voice_tutor_construction.md) |

---

## 📋 단계별 상세 체크리스트 (Milestones & Checklist)

### Phase 1: 3D Engine & Viewer Core (MVP 구축) - ✅ 완료 (2026-08-06)
- [x] **Next.js 14 + React Three Fiber 프론트엔드 모듈 구축** (`apps/web`)
  - [x] Three.js OrbitControls, ISO/TOP/X-Ray 카메라 프리셋 연동
  - [x] 수동 연필깎이, 태엽 오르골, 자전거 유성기어 3D 메커니즘 프리셋 구현
  - [x] $0 \sim 100\%$ 부품 펼쳐보기(Exploded View) 오프셋 슬라이더 수식 연동
  - [x] 구동 모션 애니메이션 및 X-Ray 반투명 와이어프레임 토글
  - [x] 3D 월드 좌표 질문 핀 (`PinOverlay.tsx`) 표시
  - [x] Zustand 전역 상태 관리 (`useStore.ts`) 및 Claymorphism UI 컴포넌트
- [x] **FastAPI 백엔드 & 파라메트릭 CAD 서비스 연동** (`apps/api`)
  - [x] 사진 업로드 VLM 파싱 엔드포인트 (`POST /api/v1/scan`)
  - [x] 명세서 6절 기준 Pydantic 스키마 정의 (`VLMParsingResult`)
  - [x] CadQuery 파라메트릭 CAD 연산 및 $0.20\text{mm}$ 공차 적용 모듈
- [x] **자동화 테스트 하네스 구축** (`harness/`)
  - [x] VLM JSON 스키마 자동 검증기 (`harness/vlm_evaluator/validate_schema.py`)
  - [x] CadQuery 파라메트릭 스크립트 실행 검증기 (`harness/cad_sandbox/run_cad_test.py`)
- 🔗 **상세 완료 이력 보기:** [`docs/history/walkthroughs/2026-08-06_phase1_mvp_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase1_mvp_construction.md)

---

### Phase 2: AI Agent Pipeline & Data Reuse Loop - ✅ 완료 (2026-08-06)
- [x] **Step 1: Vision Perception Agent 구축**
  - [x] 사진 이미지 파싱, 부품 세그먼테이션 및 메커니즘 라벨링 (`app/services/vlm/agent.py`)
- [x] **Step 2 & 3: Mech RAG & Hybrid Inference Agent 구축**
  - [x] 특허/매뉴얼 RAG 및 유저 탐구 카드 검색 기반 치수 보정 알고리즘
- [x] **Step 4: Parametric CAD & Edu Metadata Agent 구축**
  - [x] CadQuery 파라메트릭 CAD 연산 및 Self-Healing 오류 자동 재시도 루프 (`app/services/cad/converter.py`)
  - [x] STEM 공학 원리 해설 및 하브루타식 AI 탐구 퀴즈 자동 생성
- [x] **LLM 비용 최적화 & 데이터 재활용 시스템 (Cache-First Architecture)**
  - [x] 이미지 해시/임베딩 검색 기반 Zero LLM Token Cost 캐싱 엔진 (`app/services/rag/cache_engine.py`)
  - [x] Phase 2 벤치마크 평가 하네스 작성 및 통과 (`harness/vlm_evaluator/benchmarks.py`)
- 🔗 **상세 완료 이력 보기:** [`docs/history/walkthroughs/2026-08-06_phase2_ai_pipeline_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase2_ai_pipeline_construction.md)

---

### Phase 3: Real-Time Co-Create & Fork/Remix Ecosystem - ✅ 완료 (2026-08-06)
- [x] **Yjs + WebSockets (`y-websocket`) 실시간 동기화**
  - [x] 모둠원 간 3D 터치 핀 위치, 질문 메모, 카메라 시점 실시간 CRDT 동기화 (`apps/web/src/hooks/useYjsSync.ts`)
  - [x] Yjs WebSocket 하네스 목업 서버 구축 (`harness/mocks/yjs_websocket_server.js`)
- [x] **메커니즘 리믹스(Fork) 생태계 구축**
  - [x] 다른 유저의 3D 탐구 카드를 내 워크스페이스로 복제(Fork)하는 API 구축 (`POST /api/v1/cards/{id}/fork`)
- [x] **K-12 맞춤형 PWA 및 UI Polish**
  - [x] Web App PWA manifest (`apps/web/public/manifest.json`) 적용 및 Next.js 14 프로덕션 빌드 통과
- 🔗 **상세 완료 이력 보기:** [`docs/history/walkthroughs/2026-08-06_phase3_cocreate_fork_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase3_cocreate_fork_construction.md)

---

### Phase 4: Field Validation & Performance Optimization - ✅ 완료 (2026-08-06)
- [x] **모바일/태블릿(iPad, Galaxy Tab) 환경 60 FPS 렌더링 최적화**
  - [x] R3F `dpr={[1, 1.5]}` 적응형 픽셀 비율 및 `high-performance` 렌더러 적용 (`CanvasViewport.tsx`)
- [x] **수행평가용 3D 과학 탐구 배지 카드 PDF 익스포트 엔진 구축**
  - [x] 백엔드 PDF 리포트 생성기 (`app/services/pdf/exporter.py`) 및 `GET /api/v1/cards/{id}/pdf` 엔드포인트 연동
- [x] **E2E 테스트 스위트 작성**
  - [x] Playwright E2E 테스트 스크립트 작성 (`tests/e2e/canvas.spec.ts`)
- 🔗 **상세 완료 이력 보기:** [`docs/history/walkthroughs/2026-08-06_phase4_field_validation_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase4_field_validation_construction.md)

---

### Phase 5: Cloud Deployment & LMS Integration - ✅ 완료 (2026-08-06)
- [x] **멀티 컨테이너 Docker Compose 프로덕션 인프라 수립**
  - [x] `web`, `api`, `yjs-ws`, `db` (pgvector:pg16), `redis` 오케스트레이션 정의 (`docker-compose.yml`)
  - [x] Next.js multi-stage `Dockerfile` (`apps/web/Dockerfile`) 및 FastAPI `Dockerfile` (`apps/api/Dockerfile`)
- [x] **Vercel Cloud Deployment Spec**
  - [x] Next.js 14 Vercel 배포 설정 (`apps/web/vercel.json`)
- [x] **Google Classroom LMS Integration API**
  - [x] 학생 3D 탐구 카드 & AI 퀴즈 성적 제출 엔드포인트 구현 (`POST /api/v1/lms/submit`)
- 🔗 **상세 완료 이력 보기:** [`docs/history/walkthroughs/2026-08-06_phase5_cloud_lms_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase5_cloud_lms_construction.md)

---

### Phase 6: WebXR AR Mode & 3D Printer Slicer - ✅ 완료 (2026-08-06)
- [x] **WebXR AR Spatial Desk Exploration**
  - [x] 카메라 세션 히트테스트 앵커 조준 컴포넌트 구축 (`apps/web/src/components/3d/ARCanvasViewport.tsx`)
- [x] **3D Printer 3MF / STL Slicer Exporter**
  - [x] Bambu Studio / Cura 3MF 내보내기 API 연동 (`POST /api/v1/cards/{id}/export-3mf`, `app/services/cad/slicer.py`)
- 🔗 **상세 완료 이력 보기:** [`docs/history/walkthroughs/2026-08-06_phase6_ar_slicer_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase6_ar_slicer_construction.md)

---

### Phase 7: Voice Tutor Mechamong & 3D Interaction - ✅ 완료 (2026-08-06)
- [x] **AI Voice Habrutha Tutor Agent "Mechamong"**
  - [x] 음성 대화 에이전트 서비스 (`apps/api/app/services/vlm/voice_tutor.py`) 및 `/api/v1/voice/ask` 엔드포인트 구축
- [x] **Frontend Voice Interaction UI**
  - [x] 3D HUD 마이크 Floating UI 버튼 (`apps/web/src/components/ui/VoiceTutorButton.tsx`) 및 3D 액션 연동
- 🔗 **상세 완료 이력 보기:** [`docs/history/walkthroughs/2026-08-06_phase7_voice_tutor_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase7_voice_tutor_construction.md)

---
*모든 마일스톤(Phase 1 ~ Phase 7) 구축이 성공적으로 완료되었습니다.*
