# EduMechanic 3D — Development & Validation Harness

이 디렉토리는 **현재 코드가 무엇을 구현했고 무엇을 실제로 검증했는지** 확인하기 위한 개발/검증 하네스다. 하네스 통과 자체를 실물 기계의 성공 보장으로 해석하지 않는다.

현재 전략과 작업 우선순위는 `PROJECT_STATE.md`와 `docs/handoffs/ACTIVE.md`를 따른다.

## Evidence rule

- **E0 Implemented**: 코드 존재
- **E1 Tested**: unit/integration test 통과
- **E2 Independent computational validation**: 별도 공식/검증 경로로 교차 확인
- **E3 Physical single-run validation**: 실제 출력·조립·구동 1회 측정
- **E4 Repeated physical validation**: 여러 조건에서 반복 검증

동일 알고리즘을 구현 코드와 테스트 코드가 반복 계산한 결과만으로 `physically proven`, `100% guaranteed`라고 표현하지 않는다.

## 현재 실제 하네스

### `cad_sandbox/`

- CadQuery/메쉬 생성 경로의 기본 실행 검증
- 생성물 존재 여부, 체적 등 기하 기준 검사
- CAD 실행 성공과 기계적 기능 성공을 구분한다.

### `vlm_evaluator/`

- VLM 응답 schema 검증
- provider/live 호출 경로 검증
- 현재는 범용 역설계 정확도를 증명하는 데이터셋 평가 체계가 아니다.

### `dfam_evaluator/`

- 오버행/DFAM 관련 규칙 평가
- 현재 규칙 기반 검사이며 실제 프린터별 성공률을 보장하지 않는다.

### `kinematics_evaluator/`

- 기어 맞물림, 중심거리, 3D clearance 등 기구학 검사
- 형상·기구학 타당성과 재료 강도/파손 해석은 별개다.

### `physics_evaluator/`

- 회전 동역학 수식과 수치 적분 검증
- Phase 16A에서는 **단위 정규화와 독립 reference case 검증**이 우선 작업이다.
- 현재 solver를 범용 multi-body dynamics/FEA로 간주하지 않는다.

### `slicer_evaluator/`

- 3MF/슬라이싱 산출물 구조와 레이어 기반 검사
- 실제 slicer/프린터 출력 결과와의 calibration은 별도 증거가 필요하다.

### `analytics_evaluator/`

- 교육 analytics/grading 로직 테스트

### `db_evaluator/`

- DB persistence 관련 테스트

### `mocks/`

- Yjs/WebSocket 등 개발용 mock

## 현재 존재하지 않는 항목

다음 항목은 과거 문서에 존재하는 것처럼 기술됐지만 현재 main tree에는 없다. 구현 전에는 실제 하네스로 표기하지 않는다.

- `harness/datasets/`
- `harness/cots_matcher/`
- `harness/synthetic_data_evaluator/`

Phase 16C에서 synthetic dataset이 실제 생성되기 시작하면 `synthetic_data_evaluator/`를 추가하며, dataset leakage, deterministic seed, label↔geometry consistency를 검증한다.

## Phase 16 검증 순서

```text
Schema / Unit Contract
        ↓
Parametric Geometry
        ↓
Mechanism Constraints
        ↓
Kinematics
        ↓
Manufacturing Heuristics
        ↓
Synthetic Dataset Consistency
        ↓
Physical Validation (별도 실험)
```

## 현재 실행 예

```bash
# VLM schema
python harness/vlm_evaluator/validate_schema.py

# CAD sandbox
python harness/cad_sandbox/run_cad_test.py

# Kinematics
python harness/kinematics_evaluator/evaluate_meshing.py
python harness/kinematics_evaluator/evaluate_3d_clearance.py

# Physics
python harness/physics_evaluator/evaluate_dynamics.py

# DFAM / Slicing
python harness/dfam_evaluator/evaluate_dfam.py
python harness/slicer_evaluator/evaluate_3mf.py

# Core pytest suites
pytest tests/unit tests/integration
```

실행 명령은 실제 dependency/environment에 따라 조정할 수 있다. 없는 fixture나 dataset 경로를 문서상 예제로 만들어내지 않는다.

## AI 개발 세션 규칙

Gemini/Antigravity 세션은 루트 `GEMINI.md`를 읽고 `docs/handoffs/ACTIVE.md`의 단일 work package만 구현한다. 새로운 기능 제안은 PR의 `Proposal`에 남기고 다음 work package를 자동으로 시작하지 않는다.
