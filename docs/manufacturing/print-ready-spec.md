# EduMechanic Classroom FDM 3D Printing Specification (v1.1)

## 1. 목적과 범위

이 문서는 EduMechanic-3D가 생성한 기계 부품/조립체를 일반적인 0.4mm 노즐 FDM 환경에 맞게 **계산상 사전 검증(computational prevalidation)**하기 위한 제조 기준선이다.

이 기준선은 출력 성공 가능성을 높이기 위한 설계 규칙이지, G1~G4 자동 검사만으로 실물 출력·조립·구동을 보장하는 인증 규격이 아니다. 실제 성공 주장은 `PROJECT_STATE.md`의 증거 등급을 따른다.

- E0: 구현
- E1: 자동 테스트
- E2: 독립 계산 검증
- E3: 실제 출력·조립·구동 1회 검증
- E4: 여러 장비/조건 반복 검증

`Print Ready`라는 기존 enum/호환 명칭이 코드에 남더라도, E3 이전에는 사용자 의미를 **Computationally Prevalidated**로 해석한다.

## 2. 기본 프린터/소재 설계 프로필

현재 기본값은 특정 프린터의 보증치가 아니라 프로젝트의 시작 profile이다.

| 항목 | 기본값 | 비고 |
| --- | ---: | --- |
| 소재 | PLA | 장비/필라멘트별 calibration 필요 |
| 노즐 | 0.40 mm | 기본 profile |
| 레이어 높이 | 0.20 mm | 0.16~0.24 mm 범위 실험 가능 |
| 기본 벽 두께 목표 | >= 1.20 mm | local wall-thickness 측정 구현 수준을 별도 확인 |
| 구조부 벽 두께 목표 | >= 1.60 mm | 하중 검증/FEA를 의미하지 않음 |
| 내부 채움 | 25% | 출력물 특성에 따라 조정 |
| 기준 build volume | 180 x 180 x 180 mm | baseline envelope |

## 3. 결합 공차 프로필

단일 `global_tolerance`를 모든 결합에 적용하지 않는다. 아래 값은 프로젝트 시작점이며 프린터/소재별 calibration coupon 결과로 보정될 수 있다.

| Fit type | 기본 diametral clearance |
| --- | ---: |
| Press fit | +0.12 mm |
| Snug fit | +0.20 mm |
| Sliding fit | +0.30 mm |
| Rotating fit | +0.38 mm |
| Gear tooth backlash | 0.25 mm |

### 적용 원칙

- 외경/홀 치수 오차는 방향이 다를 수 있으므로 기능별 공차를 둔다.
- 베어링/축/핀 같은 COTS 결합은 실제 부품 치수와 출력 calibration을 우선한다.
- 자동 검사 통과가 실제 마찰계수나 장기간 마모 성능을 검증하지는 않는다.

## 4. DFAM 기본 규칙

현재 자동화에서 사용할 설계 기준:

1. 최대 오버행 기준: 45° baseline
2. 하단 elephant-foot 완화를 위한 chamfer 사용
3. 최소 feature/벽 두께 기준 적용
4. build volume 초과 방지
5. 출력 방향과 support 필요성 평가

수평 홀 teardrop, bridge limit 등의 고급 규칙은 실제 generator가 해당 형상을 생성하고 evaluator가 검증할 때만 `지원됨`으로 표시한다.

## 5. Readiness Tier

| Tier | 의미 | 허용되는 주장 |
| --- | --- | --- |
| `Concept` | 사진/아이디어 기반 추정, 핵심 치수 미확정 | 교육용 시각화/개념 모델 |
| `Prototype` | 주요 치수/관계가 정의되고 일부 검증 통과 | 시험 출력 후보 |
| `Print Ready` (legacy name) | G1~G4 계산 검증 통과 | **Computationally Prevalidated**. 실제 성공 보장 아님 |

실제 출력·조립·구동을 확인하면 별도 evidence metadata에 E3 이상을 기록한다. enum 이름 변경은 API 호환성을 고려해 별도 migration 작업으로 다룬다.

## 6. 제조 검증 게이트

```text
[CAD Solid / Assembly]
       │
       ▼
 G1 Geometry Integrity
       │
       ▼
 G2 Printer Constraints
       │
       ▼
 G3 Assembly / Interference
       │
       ▼
 G4 Slicing / Layer Validation
       │
       ▼
 Computationally Prevalidated
       │
       ├─ physical print / fit test
       └─ repeated calibration
```

### G1 — Geometry Integrity

검사 목표:

- watertight
- positive volume
- winding/normal consistency
- degenerate/disconnected geometry 탐지

G1은 기하 무결성을 검증하며 기계적 강도를 검증하지 않는다.

### G2 — Printer Constraints

검사 목표:

- build volume
- overhang proxy
- bed contact
- wall-thickness 조건

**현재 구현 주의:** 기존 validator의 wall-thickness 검사는 local wall thickness의 정밀 측정이 아니라 bounding extent 기반 proxy를 포함한다. Phase 16A에서 결과에 heuristic임을 명시하고 향후 ray/thickness field 기반 검사로 교체한다.

### G3 — Assembly & Interference

검사 목표:

- 부품 간 충돌/간섭
- gear center distance
- shaft/bore clearance

**현재 구현 주의:** 기존 collision 검사는 AABB와 제한된 interior sample을 사용하는 approximate check다. 미세 tooth interference 또는 복잡한 접촉을 완전 증명하지 않는다. exact mesh boolean / signed-distance 기반 검사는 후속 개선 대상으로 둔다.

### G4 — Slicing & Layer Validation

검사 목표:

- layer section 생성 가능 여부
- unsupported/floating island 탐지
- 대략적인 filament/time metric

실제 Cura/PrusaSlicer/Bambu Studio 등의 결과와 동일함을 주장하려면 외부 slicer 교차 검증이 필요하다.

## 7. 물리적 검증 프로토콜

E3 이상을 얻기 위한 최소 기록:

- printer model / nozzle
- filament material/brand 또는 material profile
- layer height / wall / infill
- CAD revision / seed / grammar version
- 실측 shaft/hole/center-distance 치수
- 조립 성공 여부
- 손 회전/구동 여부와 실패 위치
- 사진 또는 측정 기록

E4를 주장하려면 서로 다른 출력 또는 조건에서 반복 시험하고 허용오차 범위를 기록한다.

## 8. Phase 16과의 관계

이 문서의 제조 규칙은 `docs/architecture/mechanism-grammar-v0.1.md`의 C4 Manufacturing Constraints로 사용한다. Synthetic dataset에서는 G1~G4를 통과한 sample과 의도적으로 실패시킨 negative sample을 구분하여 label에 실패 이유를 기록한다.
