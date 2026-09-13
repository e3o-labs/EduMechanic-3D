# EduMechanic-3D Project State

**Baseline date:** 2026-09-13  
**Current strategic milestone:** Phase 16B — Mechanism Grammar v0.1

## 1. 현재 사실 기준선

현재 저장소에는 다음 기반이 실제 코드로 존재한다.

- 파라메트릭 기계 부품: spur gear, shaft, bushing, gearbox frame, hand crank
- 인벌류트 기어 형상 및 중심거리/기어비 계산
- 제한된 프리셋에 대한 1-DOF 회전 동역학 시각화
- G1~G4 형태의 기하/프린터/조립/슬라이싱 계산 사전 검증기
- STEP/STL/GLB 및 제조 패키지 생성 경로
- VLM 기반 사진 분석 → 구조화 JSON 경로
- SI 단위 경계를 가진 rotational dynamics solver
- unsupported bevel/helical/worm geometry의 명시적 reject 경로
- 제조 결과에서 `Computationally Prevalidated`와 실물 검증을 구분하는 문구

그러나 다음은 아직 **증명되거나 완성된 기능으로 취급하지 않는다.**

- 범용 multi-body dynamics solver
- 실제 하중·응력·파손·피로 수명 예측
- 현재 preset physics parameter의 실물 측정 기반 현실성
- 임의의 단일 사진에서 내부 구조와 절대 치수를 정확히 복원하는 범용 역설계
- G1~G4 통과만으로 실물 출력·조립·구동 성공을 보장하는 것
- Mechanism Grammar의 실제 schema/constraint solver 구현
- 사전 생성 모델을 이용한 synthetic dataset 생성 파이프라인
- synthetic data로 학습/평가된 reverse-mapping 모델

## 2. 전략적 기준선

기존의 주된 흐름인

`사진 → VLM 추론 → 자유형 CAD 생성 → Print Ready 주장`

을 핵심 알고리즘으로 두지 않는다.

Phase 16부터는 다음 구조를 기준으로 한다.

`Mechanism Grammar → Parameter Sampler → Constraint Solver → Parametric CAD → Kinematic/Manufacturing Validation → Verified Asset → Synthetic Data → Image-to-Design Reverse Mapping`

AI는 기계를 처음부터 임의 생성하는 역할보다 **검증된 설계 공간에서 후보를 찾고 파라미터를 추정하는 역할**을 우선한다.

## 3. Phase 16 진행 상태

### 16A. Correctness Baseline — ✅ COMPLETED

PR #2 / merge commit `24214df4e0f868197b684e9d1630e3557a1fa9ed`

완료 사항:

- 물리 엔진 SI 단위 경계 적용
- hand-calculated physics reference test 추가
- bevel/helical/worm의 silent spur fallback 차단
- 제조 검증기의 heuristic/proxy 성격 공개
- `100% guaranteed`, `simulation-grade`, `physically proven` 수준의 과장 표현 교정
- legacy rectangular-slot gear generator와 canonical spur gear 구현 분리

상세 종료 기록: `docs/handoffs/history/2026-09-13_EM3D-016A_correctness-baseline.md`

잔여 주의사항:

- unknown geometry 전체에 대한 whitelist 기반 fail-closed는 16B에서 강화
- 기본 physics preset 값 자체의 물리 현실성은 아직 E3 실물 검증이 아님
- CI status baseline은 16B에서 추가 검토

### 16B. Mechanism Grammar v0.1 — 🚀 ACTIVE

첫 범위는 크게 잡지 않는다.

- Primitive v0.1: `spur_gear`, `shaft`, `bushing/bearing_mount`, `housing/frame`, optional `crank`
- Relation v0.1: `coaxial`, `fixed`, `revolute`, `gear_mesh`, `supported_by`
- Mechanism family v0.1: **single-stage spur gearbox**
- supported geometry/primitive/relation registry를 명시하고 unknown은 fail-closed
- deterministic derived parameters + machine-readable rejection reason
- 가능한 물리 파라미터에 provenance 경계(`measured`, `literature`, `manufacturer_spec`, `assumed`) 마련
- 핵심 grammar/constraint/unit regression을 자동화 검증에 연결

링크/스프링/캠/베벨/헬리컬/planetary/two-stage는 v0.1 완료 전 범위에 넣지 않는다.

**Exit criterion:** grammar JSON 하나로 유효한 single-stage spur gearbox assembly를 재현할 수 있고, 동일 seed는 동일 결과를 만들며, 잘못된 파라미터/타입/관계는 machine-readable reason과 함께 거부한다.

현재 개발 시작점은 `docs/handoffs/ACTIVE.md`의 **EM3D-016B**다.

### 16C. Synthetic Data MVP — ⏳ PLANNED

16B가 완료되기 전에는 구현하지 않는다.

검증을 통과한 mechanism asset에서 자동으로 변형 데이터를 만든다.

필수 ground-truth label 후보:

- component id/type
- CAD parameters
- pose / transform
- joint/relationship graph
- teeth count, module, pitch diameter, gear ratio
- collision/clearance result
- validation tier와 실패 이유

이미지 계열은 MVP에서 최소 RGB + segmentation + depth를 목표로 하며 렌더러는 16B 완료 후 결정한다.

**Exit criterion 후보:** 하나의 spur gearbox grammar에서 재현 가능한 seed 기반 변형 1,000개를 생성하고, invalid sample이 valid dataset에 섞이지 않는다.

### 16D. Reverse Mapping Experiment — ⏳ PLANNED

사진에서 자유형 CAD를 직접 쓰게 하지 않는다.

1. mechanism family 분류
2. 관찰 가능한 파라미터 추정
3. grammar 후보 생성
4. constraint solver로 불가능 후보 제거
5. 이미지/치수 오차가 가장 작은 후보 랭킹

절대 스케일 근거가 없으면 단일 사진에서 절대 치수를 확정하지 않는다.

## 4. 증거 등급

- **E0 — Implemented:** 코드가 존재한다.
- **E1 — Tested:** unit/integration test가 통과한다.
- **E2 — Independently computationally validated:** 별도 공식/도구/검증 경로로 결과를 교차 확인했다.
- **E3 — Physical single-run validated:** 실제 출력·조립·구동을 1회 측정했다.
- **E4 — Repeated physical validated:** 여러 출력기/조건에서 반복 측정하여 허용범위를 확보했다.

사용자에게 실물 성공을 사실처럼 말하려면 최소 E3 근거가 필요하다. 일반적 보장을 말하려면 E4와 범위가 명시되어야 한다.

## 5. 역할과 진행 방식

- GPT: 이 파일, architecture 문서, ACTIVE work package의 기획과 acceptance criteria를 관리한다.
- Gemini/Antigravity: ACTIVE work package만 구현한다.
- 완료 후 Gemini PR을 GPT가 코드·테스트·주장 수준 관점에서 재검토한 뒤 다음 work package를 연다.
- Human owner: 실제 제작/실험 결과와 범위 변경을 승인한다.
