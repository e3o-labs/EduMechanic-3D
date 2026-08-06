# 🤖 EduMechanic 3D (ReVerse-3D Engine)

초·중·고(K-12) STEM 교육을 위한 **AI 기반 3D 메커니즘 역설계 & 인터랙티브 공동 탐구 플랫폼** 프로젝트 디렉토리 구조 및 개발 환경 명세입니다.

---

## 📂 디렉토리 구조 (Repository Directory Layout)

```
EduMechanic-3D/
├── README.md                         # 프로젝트 종합 가이드 (루트)
├── roadmap.md                        # [메인] 이력 관리 로드맵 & 마일스톤 체크리스트
├── spec.md                           # [메인] 통합 개발/기획 명세서 (최종 표준)
├── edumechanic_3d_mobile_demo.html   # 모바일 3D 실습 데모 프로토타입
│
├── docs/                             # 📄 프로젝트 공식 문서
│   ├── spec.md                       # 통합 개발/기획 명세서 (최종 표준)
│   ├── roadmap.md                    # 이력 관리 로드맵 & 마일스톤 체크리스트
│   └── history/                      # 기획 이력 및 워크쓰루 아카이브
│       ├── walkthroughs/             # Phase별 구현 완료 이력 워크쓰루 레포트
│       │   └── 2026-08-06_phase1_mvp_construction.md
│       ├── 01_master_spec_archive.md
│       ├── 02_cadquery_parametric_engine.md
│       ├── 03_webgl_canvas_interactive_demo.md
│       ├── 04_dual_mode_architecture_strategy.md
│       ├── 05_reverse3d_initial_architecture_spec.md
│       └── 06_stem_k12_product_strategy.md
│
├── apps/                             # 📱 서비스 애플리케이션 모듈
│   ├── web/                          # Next.js 14 + Three.js / R3F 웹 프론트엔드
│   │   └── public/demos/
│   │       └── edumechanic_3d_mobile_demo.html # 3D 모바일 실습 프로토타입 데모
│   └── api/                          # FastAPI 백엔드 (VLM + RAG + CadQuery 연동)
│
├── harness/                          # 🛠️ 개발 & 테스트 하네스 (Harness Tools)
│   ├── cad_sandbox/                  # CadQuery 안전 실행 샌드박스 & 체적 검증기
│   ├── vlm_evaluator/                # VLM JSON 스키마 자동 검증기
│   ├── datasets/                     # 벤치마킹용 샘플 이미지 & Golden JSON
│   └── mocks/                        # Yjs WebSocket & REST API 목업 서버
│
├── tests/                            # 🧪 테스트 스위트 (Unit, Integration, E2E)
│   ├── unit/                         # 파이썬/JS 단체 테스트
│   ├── integration/                  # CAD 파이프라인 통합 테스트
│   └── e2e/                          # Playwright 3D Canvas E2E 테스트
│
└── README.md                         # 본 안내 문서
```

---

## 🌟 빠른 시작 가이드 (Getting Started)

1. **개발 로드맵 & 이행 체크리스트:** [`roadmap.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/roadmap.md)
2. **최신 통합 명세서 확인:** [`docs/spec.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/spec.md)
3. **Phase 1 MVP 구현 이력 레포트:** [`docs/history/walkthroughs/2026-08-06_phase1_mvp_construction.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/history/walkthroughs/2026-08-06_phase1_mvp_construction.md)
4. **모바일 3D 데모 실행:** 브라우저로 [`apps/web/public/demos/edumechanic_3d_mobile_demo.html`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/web/public/demos/edumechanic_3d_mobile_demo.html) 열기
5. **하네스 환경 가이드:** [`harness/README.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/harness/README.md)
