# EduMechanic 3D (ReVerse-3D Engine)

초·중·고(K-12) STEM 교육을 위한 3D 메커니즘 탐구 프로젝트다. 현재 기술 전략은 **AI가 임의의 기계를 직접 생성하는 방식**보다, 검증 가능한 기계 설계 문법과 제약 조건을 기반으로 모델을 생성하고 그 결과를 synthetic data와 역추정에 활용하는 방향을 우선한다.

## Current direction

```text
Mechanism Grammar
  → Constraint Solver
  → Parametric CAD
  → Kinematic / Manufacturing Validation
  → Verified Asset
  → Synthetic Data
  → Image-to-Design Reverse Mapping
```

현재 상태와 완료/미검증 범위는 `PROJECT_STATE.md`가 기준이다.

## AI 개발 역할 분리

- **GPT:** 기획, 아키텍처, 물리/제조 기준, acceptance criteria, 다음 work package 정의
- **Gemini / Antigravity:** `docs/handoffs/ACTIVE.md`의 work package 구현 및 테스트
- **Human:** 범위 변경과 실제 제작/실험 결과 승인

Gemini 개발 세션은 루트 `GEMINI.md`를 프로젝트 컨텍스트로 사용한다.

## Recommended read order

1. `PROJECT_STATE.md` — 현재 사실 기준선과 Phase 16 목표
2. `docs/architecture/mechanism-grammar-v0.1.md` — 핵심 알고리즘/설계 문법
3. `docs/handoffs/ACTIVE.md` — 현재 Gemini 구현 작업
4. `GEMINI.md` — Gemini 개발 계약
5. `harness/README.md` — 검증 하네스와 증거 등급
6. `docs/manufacturing/print-ready-spec.md` — 제조 사전 검증 기준
7. `roadmap.md`, `docs/history/**` — 과거 단계와 이력 참고

## Repository layout

```text
EduMechanic-3D/
├── GEMINI.md
├── PROJECT_STATE.md
├── README.md
├── roadmap.md
├── spec.md
├── apps/
│   ├── web/                     # Next.js / Three.js / R3F
│   └── api/                     # FastAPI / VLM / CAD services
├── docs/
│   ├── architecture/
│   │   └── mechanism-grammar-v0.1.md
│   ├── handoffs/
│   │   └── ACTIVE.md
│   ├── manufacturing/
│   │   └── print-ready-spec.md
│   └── history/
├── harness/
│   ├── cad_sandbox/
│   ├── vlm_evaluator/
│   ├── dfam_evaluator/
│   ├── kinematics_evaluator/
│   ├── physics_evaluator/
│   ├── slicer_evaluator/
│   ├── analytics_evaluator/
│   ├── db_evaluator/
│   └── mocks/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

`harness/datasets`, `harness/cots_matcher`, `harness/synthetic_data_evaluator`는 현재 구현된 디렉터리가 아니며 필요한 단계에서 실제 코드/데이터와 함께 추가한다.

## Current implementation entry points

- CAD components: `apps/api/app/services/cad/components/`
- CAD converter: `apps/api/app/services/cad/converter.py`
- Manufacturing validator: `apps/api/app/services/cad/validator.py`
- Web kinematics: `apps/web/src/utils/kinematics.ts`
- Web rotational dynamics: `apps/web/src/utils/physicsEngine.ts`
- Reference manufacturing integration test: `tests/integration/test_reference_mechanism_print_ready.py`

## Development rule

새 기능을 만들기 전에 `docs/handoffs/ACTIVE.md`를 확인한다. ACTIVE 범위를 넘는 구현은 다음 work package 제안으로 남긴다. 테스트 통과와 실물 검증을 구분하고, 실험 근거가 없는 `100% 보장`, `physically proven`, `engineering-grade` 표현은 사용하지 않는다.
