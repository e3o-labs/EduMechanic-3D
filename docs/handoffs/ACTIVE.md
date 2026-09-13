# ACTIVE Development Work Package

## EM3D-016B — Mechanism Grammar v0.1

**Owner:** Gemini / Antigravity implementation session  
**Planning baseline:** `PROJECT_STATE.md`, `docs/architecture/mechanism-grammar-v0.1.md`  
**Status:** READY FOR IMPLEMENTATION

## Goal

자유형 AI CAD 생성이 아니라 **검증 가능한 설계 문법 + 제약 조건 + 결정론적 생성**을 EduMechanic-3D의 핵심 생성 경로로 만든다.

이번 단계는 하나의 mechanism family만 다룬다:

`single_stage_spur_gearbox`

Synthetic image 생성, Blender/BlenderProc, reverse mapping은 이번 범위에 포함하지 않는다.

## In scope

### A. Grammar schema v0.1

Python/Pydantic 기준 schema를 먼저 정의하고, 프론트엔드에서 직접 소비해야 하는 경우에만 대응 TypeScript 타입을 둔다.

필수 primitive:

- `spur_gear`
- `shaft`
- `bushing` 또는 `bearing_mount`
- `housing` / `frame`
- `crank` (optional)

필수 relation:

- `coaxial`
- `fixed`
- `revolute`
- `gear_mesh`
- `supported_by`

Mechanism root에는 최소 다음 metadata를 포함한다.

- `grammar_version`
- `family`
- `seed`
- component list
- relation list
- derived parameters
- validation/evidence metadata

### B. Strict supported-type registry

16A에서 특정 unsupported geometry를 차단했지만 generic fallback 가능성이 남아 있다.

이번 단계에서:

- CAD generator/converter가 지원하는 geometry type을 명시 whitelist/registry로 관리한다.
- 오타, unknown primitive, 아직 지원하지 않는 geometry는 모두 fail-closed 한다.
- unknown geometry를 generic cylinder로 조용히 생성하지 않는다.
- 기존 generic cylinder가 실제 기능상 필요하면 `generic_cylinder`처럼 명시 지원 타입으로 승격하고 schema에 등록한다.

### C. Single-stage spur gearbox constraint solver

최소 제약:

1. 두 기어의 module 일치
2. pressure angle 호환
3. 잇수와 모든 치수는 양수/허용범위
4. pitch diameter 계산 `d = m*z`
5. center distance 계산 `a = m*(z1+z2)/2`
6. 주어진 center distance가 derived 값과 tolerance 내 일치
7. bore/shaft 관계가 fit profile과 기본 공간 조건을 만족
8. frame/housing이 두 shaft center를 재현할 수 있음
9. required relation 누락 시 reject
10. unsupported primitive/relation은 reject

아직 정확히 검증하지 않는 항목은 pass 조건으로 가장하지 않는다:

- full AGMA/ISO rating
- 실제 contact ratio 검증이 미구현인 경우
- undercut/profile shift 일반해
- tooth-root stress / fatigue
- exact mesh boolean contact dynamics

### D. Machine-readable rejection

constraint 실패는 단순 문자열 하나가 아니라 최소 다음을 반환한다.

- `code`
- `path` 또는 관련 component/relation id
- `message`
- `severity`
- observed value
- expected/range 또는 derived value (가능한 경우)

예:

```json
{
  "code": "GEAR_MODULE_MISMATCH",
  "path": "relations.mesh_01",
  "message": "Mating spur gears must use the same module",
  "severity": "error",
  "observed": [1.0, 1.5],
  "expected": "equal"
}
```

### E. Deterministic generation contract

- 동일 grammar JSON + 동일 seed는 동일 derived parameters / assembly를 만든다.
- derived 값은 LLM이 자유 생성하지 않고 deterministic function으로 계산한다.
- stochastic parameter sampling이 들어가면 seeded RNG를 사용한다.
- generated output에 `grammar_version`, `seed`, generator version을 남긴다.

### F. Existing CAD integration

유효 grammar는 기존 canonical 구현을 재사용한다.

- `InvoluteSpurGear`
- shaft
- bushing
- gearbox frame
- optional crank

Grammar/constraint layer를 구현하기 위해 동일 CAD generator를 새로 복제하지 않는다.

### G. Test harness + CI baseline

필수 테스트:

- valid minimal gearbox fixture → accept
- same seed reproducibility
- module mismatch → reject
- center distance mismatch → reject
- invalid bore/shaft fit → reject
- missing required relation → reject
- unknown primitive → reject
- unknown geometry_type → reject, generic fallback 금지
- unsupported relation → reject
- 기존 16A physics/unit tests와 reference gearbox tests regression 통과

가능하면 GitHub Actions workflow를 추가하여 최소한 다음을 PR에서 실행한다.

- Python unit + relevant integration tests
- TypeScript typecheck
- physics unit contract test

CI 환경에서 CadQuery/OpenCASCADE 설치 비용이 지나치게 크면, schema/constraint tests와 순수 계산 테스트를 필수 CI로 하고 CAD-heavy integration은 별도 job 또는 명시적 로컬 evidence로 분리한다. 단, CI가 실행하지 못하는 항목을 실행된 것처럼 표시하지 않는다.

### H. Physical parameter provenance

동역학/제조/grammar에서 물리 수치가 들어갈 경우 가능한 범위에서 출처를 표시할 수 있는 구조를 마련한다.

권장 enum:

- `measured`
- `literature`
- `manufacturer_spec`
- `assumed`

이번 단계에서 실제 모든 preset 값을 조사할 필요는 없다. 다만 `assumed` 값을 측정값처럼 취급하지 않도록 metadata 경계를 마련한다.

## Out of scope

이번 work package에서 하지 않는다.

- synthetic RGB/depth/segmentation renderer
- Blender / BlenderProc 도입
- 1,000 sample dataset 생성
- image → design reverse mapping
- two-stage / planetary family 구현
- bevel/helical/worm generator 신규 구현
- link/spring/cam grammar
- FEA / fatigue / material failure prediction
- 기존 VLM을 grammar estimator로 연결하는 작업
- 대규모 UI 재설계

## Acceptance criteria

1. `single_stage_spur_gearbox`를 표현하는 versioned grammar schema가 존재한다.
2. valid fixture 하나가 schema + constraint validation을 통과한다.
3. 동일 input + seed가 동일 derived output을 만든다.
4. module mismatch가 machine-readable reason과 함께 reject된다.
5. center-distance mismatch가 reason과 함께 reject된다.
6. invalid shaft/bore fit가 reason과 함께 reject된다.
7. missing required relation이 reject된다.
8. unknown primitive/geometry/relation이 전부 fail-closed 된다.
9. valid grammar가 기존 canonical CAD component path를 통해 assembly 생성 경로로 연결된다.
10. 기존 spur gear / manufacturing / 16A physics unit tests가 regression 없이 유지된다.
11. 새 grammar/constraint 핵심 테스트가 CI 또는 명확한 자동화 검증 경로에 연결된다.
12. 아직 검증하지 않는 undercut/contact ratio/strength 등을 `validated`로 표시하지 않는다.
13. 구현 범위가 `single_stage_spur_gearbox`를 넘어 확장되지 않는다.

## Required evidence in PR

PR 본문에 반드시 다음을 포함한다.

- `Implemented`
- `Grammar schema example`
- `Constraint rules implemented`
- `Valid fixture result`
- `Invalid fixtures and rejection codes`
- `Determinism evidence`
- `Supported-type registry / unknown fail-closed evidence`
- `Tests run locally`
- `CI checks actually run`
- `Known limitations / Not validated`
- `Physical parameter provenance handling`
- `Proposal for EM3D-016C` — 구현하지 말고 제안만 작성

## Stop condition

Acceptance criteria가 충족되면 멈춘다.

다음 단계는 Synthetic Data MVP이지만 GPT/기획 리뷰 전에는 renderer나 dataset generation을 구현하지 않는다.
