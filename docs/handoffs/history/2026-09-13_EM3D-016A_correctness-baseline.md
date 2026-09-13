# EM3D-016A — Correctness Baseline

**Status:** COMPLETED  
**Implementation PR:** #2  
**Merged commit:** `24214df4e0f868197b684e9d1630e3557a1fa9ed`  
**Completed:** 2026-09-13

## Goal

새 기능을 늘리기 전에 현재 코드에서 물리 단위 오류, 지원 범위 위장, 제조 검증 과장을 제거하여 이후 Mechanism Grammar와 synthetic data가 신뢰할 수 있는 기준선 위에 올라가게 한다.

## Completed scope

- Rotational dynamics solver의 CAD 단위 입력을 SI 계산 경계로 명시 변환
- hand-calculated reference case 추가
- `bevel_gear`, `helical_gear`, `worm_gear`의 silent spur fallback 차단
- G1~G4 결과를 `Computationally Prevalidated` 의미로 교정
- G2 wall-thickness proxy / G3 sampled collision approximation 공개
- legacy rectangular-slot gear generator를 deprecated 처리
- canonical spur gear 구현을 `components/gears/spur_gear.py`로 명확화

## Evidence

PR #2 기록 기준:

- Python unit/integration: 11 passed
- TypeScript typecheck: passed
- TypeScript physics tests: passed
- Python physics evaluator: hand-calculated reference / terminal velocity / coasting / power balance passed
- DFAM evaluator: passed
- Codex PR review: completed with no surfaced blocking finding

## Evidence level

- 단위 계약과 수학적 일관성: E1~E2
- 제조 G1~G4: 계산 사전 검증 수준
- 실제 출력·조립·구동: E3 미확보

## Known residuals carried into 16B

1. 특정 unsupported 타입만 차단되었으며 임의의 unknown `geometry_type`은 generic fallback 경로가 남을 수 있다. 16B에서 supported-type whitelist 기반 fail-closed로 강화한다.
2. 동역학 기본 파라미터 값 자체의 실물 현실성은 아직 측정/문헌 근거가 부족하다. Grammar metadata에서 `measured | literature | assumed` 출처를 분리한다.
3. GitHub Actions 상태 체크가 아직 기준선으로 존재하지 않는다. 16B에서 핵심 schema/constraint/unit 테스트를 CI에 연결한다.

## Closure decision

16A acceptance criteria는 충족된 것으로 판단한다. 이후 개발은 `docs/handoffs/ACTIVE.md`의 EM3D-016B를 따른다.
