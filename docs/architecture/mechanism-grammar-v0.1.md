# Mechanism Grammar & Synthetic Data Architecture v0.1

## 1. 목적

EduMechanic-3D의 핵심 알고리즘을 `자유형 AI CAD 생성`이 아니라 **제약이 있는 기계 설계 공간을 생성·검증·역추정하는 시스템**으로 정의한다.

기본 파이프라인:

```text
Mechanism Grammar
  → Parameter Sampler
  → Constraint Solver
  → Parametric CAD
  → Geometry/Kinematics/Manufacturing Validation
  → Verified Mechanism Asset
  → Domain Randomization / Rendering
  → Synthetic Dataset
  → Reverse Mapping
```

## 2. 단위 계약

- CAD/제조 geometry schema: 기본 길이 단위 `mm`
- 각도: `deg` 또는 `rad`를 필드명에서 명시
- 동역학 solver 내부: SI 단위만 사용
  - length `m`
  - mass `kg`
  - time `s`
  - force `N`
  - torque `N·m`
  - inertia `kg·m²`
- CAD→physics 경계에 명시적 conversion function을 둔다.
- `N·mm`와 `kg·mm²` 값을 그대로 나누는 계산은 금지한다.

## 3. Grammar Schema 개념

### Primitive v0.1

현재 실제 구현 기반으로 제한한다.

- `spur_gear`
- `shaft`
- `bushing` / `bearing_mount`
- `housing` / `frame`
- `crank`

Planned but NOT v0.1:

- bevel/helical/internal gear generalization
- link
- spring
- cam
- rack

### Relation v0.1

- `coaxial(a, b)`
- `fixed(a, b)`
- `revolute(a, b, axis)`
- `gear_mesh(a, b)`
- `supported_by(part, frame)`

각 relation은 단순 metadata가 아니라 constraint를 생성해야 한다.

## 4. 첫 Mechanism Family

### single_stage_spur_gearbox

필수 구성:

- driver spur gear
- driven spur gear
- 2 shafts
- frame/housing
- optional crank

핵심 파라미터:

- module `m`
- teeth `z1`, `z2`
- face width
- shaft diameter
- backlash
- rotating fit clearance
- frame thickness

Derived values:

- `d1 = m*z1`
- `d2 = m*z2`
- `center_distance = m*(z1+z2)/2`
- `ratio = z2/z1`

## 5. Constraint 계층

### C1. Schema constraints

- 파라미터 타입/범위
- 필수 relation 존재
- 지원하지 않는 geometry 거부

### C2. Geometric constraints

- positive dimensions
- watertight/manifold
- bore < root diameter와 같은 기본 공간 조건
- 부품 간 금지 영역 침범 금지

### C3. Kinematic constraints

- spur gear 동일 module/pressure-angle compatibility
- 중심거리 일치
- 회전비 일치
- phase/mesh consistency
- undercut/contact-ratio 등은 v0.1에서 구현 수준을 명시하고, 검증하지 못하면 pass 조건으로 가장하지 않는다.

### C4. Manufacturing constraints

- build volume
- clearances / fit profile
- overhang / supportability
- 실제 local wall thickness를 계산하지 않는 proxy는 `heuristic`으로 표기
- approximate collision sampling은 exact boolean collision과 구분

### C5. Physics constraints

v0.1의 physics는 **설계 공간 필터와 교육용 동역학**을 위한 제한 모델이다.

- torque/inertia 단위 일관성
- kinematic ratio consistency
- speed/torque propagation
- 입력/부하 파라미터의 출처 구분: measured / literature / assumed

응력, 피로, 열, 재료 파손을 아직 검증하지 않는다.

## 6. Candidate Generation 알고리즘

AI가 CAD 코드를 직접 발명하기 전에 deterministic/search 기반 후보를 만든다.

```text
input target intent
  → choose mechanism family
  → sample discrete params (z1, z2, component options)
  → sample/optimize continuous params (m, width, clearances)
  → derive dependent dimensions
  → run C1..C5
  → reject invalid candidates with reasons
  → score valid candidates
```

초기 구현은 exhaustive/grid/random seeded search로 충분하다. 학습 기반 optimizer는 데이터가 쌓인 뒤 검토한다.

## 7. Verified Asset Contract

검증을 통과한 asset은 최소 다음을 포함한다.

- `grammar_version`
- `family`
- `seed`
- primitive list + parameters
- relation graph
- derived dimensions
- validation results per constraint
- evidence level
- STL/STEP/GLB artifact references
- known limitations

`verified`는 해당 constraint set을 통과했다는 뜻이며 실물 성공 보장을 뜻하지 않는다.

## 8. Synthetic Data Contract

### 생성 축

- gear teeth/module/ratio
- housing proportions
- camera pose
- object pose
- lighting/material/background
- partial occlusion
- manufacturing-valid / intentionally-invalid samples

### Ground truth

- RGB
- segmentation mask
- depth
- camera intrinsics/extrinsics
- component id/type
- 6D pose
- CAD parameters
- mechanism relation graph
- derived gear metrics
- constraint pass/fail + reason

### Dataset split

같은 seed/near-duplicate geometry가 train/validation/test에 걸쳐 누출되지 않도록 geometry family hash 기준으로 분리한다.

## 9. Reverse Mapping

목표는 `image → arbitrary CAD`가 아니다.

```text
image
 → family classifier
 → observable parameter estimator
 → grammar candidate generator
 → constraint filter
 → render/feature comparison
 → ranked candidates + confidence
```

절대 스케일을 알 수 없는 단일 사진에서는 scale을 추측값으로 확정하지 않는다. reference object, 사용자 치수, multi-view가 없으면 상대비/후보 범위로 반환한다.

## 10. v0.1 완료 조건

1. single-stage spur gearbox용 grammar schema가 존재한다.
2. 동일 seed에서 동일 assembly가 재생성된다.
3. invalid parameter set을 rejection reason과 함께 거부한다.
4. 1,000개 synthetic variants를 생성할 수 있다.
5. valid dataset에는 모든 필수 constraint를 통과한 sample만 포함된다.
6. 생성 label과 geometry에서 주요 파라미터를 자동 재검증하는 evaluator가 존재한다.

이 조건이 충족되기 전에는 메커니즘 family 확장을 우선하지 않는다.
