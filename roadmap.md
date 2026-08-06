# 🗺️ EduMechanic 3D - 이력 관리 로드맵 (Roadmap)

본 문서는 `EduMechanic 3D` 프로젝트의 마일스톤, 예정된 작업 및 완료된 기능 이력을 추적 관리하는 **공식 로드맵 문서**입니다.  
상세 기능 및 시스템 아키텍처 명세는 [`docs/spec.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/spec.md)를 참조하며, 각 단계별 완료 이력은 [`docs/history/walkthroughs/`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/) 아래의 워크쓰루 상세 레포트를 참조합니다.

---

## 🎯 전체 마일스톤 이행 현황 (Overall Status)

| Phase | 단계명 | 목표 개발 기간 | 상태 | 완료 날짜 | 상세 이력 문서 |
| --- | --- | --- | --- | --- | --- |
| **Phase 1** | **3D Engine & Viewer Core / MVP 구축** | 1~2주차 | **✅ 완료** | 2026-08-06 | [`2026-08-06_phase1_mvp_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase1_mvp_construction.md) |
| **Phase 2** | **AI VLM & CAD Pipeline Integration** | 3~4주차 | 🔄 예정 | - | *(완료 시 업데이트)* |
| **Phase 3** | **Real-time Collaboration & UI Polish** | 5~6주차 | 🔄 예정 | - | *(완료 시 업데이트)* |
| **Phase 4** | **Field Testing & Optimization** | 7~8주차 | 🔄 예정 | - | *(완료 시 업데이트)* |

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

### Phase 2: AI VLM & CAD Pipeline Integration (예정)
- [ ] **Claude 3.5 Sonnet / Qwen2-VL 라이브 API 파이프라인 연동**
  - [ ] 이미지 업로드 ➔ VLM 세그먼테이션 ➔ JSON 파싱 자동화
- [ ] **Mech RAG (PostgreSQL pgvector) 특허/매뉴얼 검색 엔진 연결**
  - [ ] 내부 비가시 영역 기어비 및 결합 구조 자동 유추 RAG 구축
- [ ] **OpenCASCADE NURBS STEP ➔ GLB 실시간 변환 파이프라인**
  - [ ] CadQuery 연산 결과물의 웹 표준 GLB 압축 및 S3 저장 연동
- [ ] **자가 치유(Self-Healing) 오류 복구 백엔드 루프 구축**
  - [ ] Geometry 연산 에러 발생 시 Traceback을 AI로 재전달하여 2~3회 자동 재시도
- 🔗 **상세 완료 이력 보기:** *(Phase 2 완료 후 워크쓰루 레포트 첨부 예정)*

---

### Phase 3: Real-time Collaboration & UI Polish (예정)
- [ ] **Yjs + WebSockets (`y-websocket`) 실시간 동기화 개발**
  - [ ] 모둠원 간 3D 터치 핀 위치, 질문 메모, 카메라 시점 실시간 동기화
  - [ ] 동시 접속자 마우스/터치 커서 시각화
- [ ] **메커니즘 리믹스(Fork) 데이터베이스 연동**
  - [ ] 다른 유저의 3D 탐구 카드를 내 워크스페이스로 복제 및 커스텀
- [ ] **K-12 맞춤형 파스텔 톤앤매너 UI Polish 및 PWA 대응**
- 🔗 **상세 완료 이력 보기:** *(Phase 3 완료 후 워크쓰루 레포트 첨부 예정)*

---

### Phase 4: Field Testing & Optimization (예정)
- [ ] **모바일/태블릿(iPad, Galaxy Tab) 환경 60 FPS 렌더링 최적화**
  - [ ] Draw call 줄이기 및 Mesh LOD(Level of Detail) 적용
- [ ] **수행평가용 3D 과학 탐구 배지 카드 PDF 익스포트 엔진 구축**
- [ ] **초·중·고 STEM 현장 교사 및 학생 대상 알파 테스트 진행**
- 🔗 **상세 완료 이력 보기:** *(Phase 4 완료 후 워크쓰루 레포트 첨부 예정)*

---
*본 로드맵은 기능 구현 완료 시 실시간으로 체크박스 및 이력 워크쓰루 링크를 업데이트합니다.*
