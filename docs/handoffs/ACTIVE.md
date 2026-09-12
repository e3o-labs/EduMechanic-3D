# ACTIVE Development Work Package

## EM3D-016A — Correctness Baseline

**Owner:** Gemini / Antigravity implementation session  
**Planning baseline:** `PROJECT_STATE.md`, `docs/architecture/mechanism-grammar-v0.1.md`  
**Status:** READY FOR IMPLEMENTATION

## Goal

새 기능을 늘리기 전에 현재 코드에서 **물리 단위 오류, 지원 범위 위장, 제조 검증 과장**을 제거하여 이후 Mechanism Grammar와 synthetic data가 신뢰할 수 있는 기준선 위에 올라가게 한다.

## In scope

### A. Physics unit contract

대상:

- `apps/web/src/utils/physicsEngine.ts`
- `harness/physics_evaluator/evaluate_dynamics.py`
- 관련 UI telemetry/test

요구:

- solver 내부의 torque/inertia 계산 단위를 SI로 정규화하거나, 명시적 conversion layer를 둔다.
- `N·mm`, `kg·mm²` 입력이 존재한다면 변환 과정이 코드에서 보이도록 한다.
- 테스트는 구현식 복사만 하지 말고 최소 1개 hand-calculated reference case를 검증한다.

### B. Unsupported geometry fail-closed

대상:

- `apps/api/app/services/cad/converter.py`

현재 `bevel_gear`가 spur gear generator로 dispatch되는 경로를 허용하지 않는다.

v0.1에서는 bevel gear를 구현 범위에서 제외한다. 지원되지 않는 요청에는 명시적인 오류/unsupported result를 반환한다. spur gear 생성으로 조용히 대체하지 않는다.

### C. Manufacturing claim correction

대상:

- `apps/api/app/services/cad/validator.py`
- 관련 schema/UI/test

요구:

- G1~G4 통과만으로 `실물 출력·조립·기계 구동이 보장됩니다`, `100%` 같은 문구를 반환하지 않는다.
- 현재 G2 wall thickness 검사가 bounding extent proxy임을 코드/결과에 표현한다.
- 현재 G3 collision 검사가 sampled/approximate 방식임을 결과에 표현한다.
- 기존 tier enum을 즉시 깨뜨릴 필요는 없지만, `Print Ready` 결과는 최소 `computationally prevalidated` 의미로 문구를 교정한다.

### D. Legacy gear generator separation

대상:

- `apps/api/app/services/cad/involute_gear.py`
- `apps/api/app/services/cad/components/gears/spur_gear.py`

요구:

- 기준 구현이 `components/gears/spur_gear.py`임을 명확히 한다.
- legacy 파일이 사용 중인지 검색하고, 사용되지 않으면 deprecated 표시 또는 안전한 제거 계획을 남긴다.
- 직사각형 tooth-space 방식 코드를 `exact involute`라고 부르지 않는다.

## Out of scope

이번 work package에서 하지 않는다.

- Mechanism Grammar schema 구현
- synthetic dataset renderer 구현
- Blender/BlenderProc 도입
- link/spring/cam/bevel/helical 신규 generator 구현
- FEA/응력/피로 해석
- VLM 모델 재학습
- UI 대규모 리디자인

## Acceptance criteria

1. Physics solver에서 단위 변환 경계가 코드와 테스트로 확인된다.
2. hand-calculated reference case에서 각가속도가 기대값과 허용오차 내 일치한다.
3. `bevel_gear` 요청이 spur gear로 생성되지 않는다.
4. 코드/사용자 결과에서 G1~G4만으로 물리적 성공을 `보장`한다고 말하지 않는다.
5. G2 wall thickness와 G3 collision의 현재 heuristic 성격이 결과 또는 문서에 드러난다.
6. 기존 spur gear unit/integration tests가 유지되거나 변경 이유가 설명된다.
7. 전체 관련 테스트 결과를 PR 본문에 기록한다.
8. `PROJECT_STATE.md`의 전략 범위를 무단 확장하지 않는다.

## Required evidence in PR

PR 본문에 반드시 다음을 포함한다.

- `Implemented`
- `Tests run`
- `Hand-calculated physics reference`
- `Unsupported paths now rejected`
- `Claims corrected`
- `Known limitations`
- `Proposal for EM3D-016B` — 구현하지 말고 제안만 작성

## Stop condition

Acceptance criteria가 충족되면 멈춘다. 다음 단계 Mechanism Grammar 구현은 GPT/기획 리뷰 후 별도 ACTIVE work package로 연다.
