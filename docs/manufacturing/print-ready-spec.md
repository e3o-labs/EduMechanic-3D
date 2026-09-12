# EduMechanic Classroom FDM 3D Printing Specification (v1.0)

## 1. 개요 (Overview)
본 명세서는 **EduMechanic-3D** 시스템에서 생성된 3D 메커니즘 모델이 일반 교육 현장(초·중·고교 메이커스페이스, 발명교실, 일반 가정)의 보급형 FDM 3D 프린터에서 **실제로 출력 ➔ 조립 ➔ 물리적으로 구동**될 수 있도록 보장하는 엔지니어링 제조 기준선(Manufacturing Baseline)을 정의합니다.

단순한 3D 시각화나 기하학적 형상(Mesh) 생성을 넘어, 실제 슬라이서 및 적층 제조(Additive Manufacturing) 환경의 물리적 한계(노즐 압출 폭, 열수축, 레이어 간 결합력, 중력에 의한 처짐)를 파라메트릭 CAD 모델링 단계부터 반영합니다.

---

## 2. 기본 프린터 및 소재 프로필 (Baseline Hardware & Material)

### 2.1. 대상 하드웨어 (Target Hardware)
- **표준 대상 기종**: Bambu Lab A1 / A1 mini / P1P, Prusa MK3S+ / MK4, Creality Ender-3 v2 / v3 KE, Anycubic Kobra 등 보급형 0.4mm 노즐 FDM 프린터
- **최소 유효 빌드 볼륨 (Build Volume)**: $180\text{ mm} \times 180\text{ mm} \times 180\text{ mm}$ (초소형 베드에서도 출력 분할 없이 일체형/모듈러 출력 보장)

### 2.2. 소재 및 슬라이스 파라미터 (Material & Slicing Baseline)
| 항목 | 표준 기준값 | 교육용 허용 범위 | 엔지니어링 근거 및 주의사항 |
| :--- | :--- | :--- | :--- |
| **소재 (Filament)** | **PLA (Polylactic Acid)** | PLA, PLA+, PETG | 수축률이 낮고 독성이 없어 학교 교실 환경에 가장 적합. |
| **노즐 직경 (Nozzle Dia)** | **$0.40\text{ mm}$** | $0.40\text{ mm}$ 단일화 | 전 세계 교육 현장의 95% 이상이 $0.4\text{mm}$ 노즐 채택. |
| **레이어 높이 (Layer Height)**| **$0.20\text{ mm}$** | $0.16 \sim 0.24\text{ mm}$ | 기어 치형 분해능과 출력 시간의 최적 절충점. |
| **기본 외벽 두께 (Wall Thick)**| **최소 $1.20\text{ mm}$ (3 외벽)**| $1.2 \sim 1.6\text{ mm}$ | $0.4\text{mm}$ 노즐 $\times 3\text{ perimeters}$. 비구조재 기본. |
| **하중 지지벽 (Structural Wall)**| **최소 $1.60 \sim 2.00\text{ mm}$** | $1.6 \sim 2.4\text{ mm}$ (4~5 외벽)| 감속 기어 이뿌리(Tooth root), 베어링 포켓, 축 결합부. |
| **상단/하단 솔리드 레이어**| **최소 5 레이어 ($1.00\text{ mm}$)**| 4~6 레이어 ($0.8 \sim 1.2\text{ mm}$)| 압출 처짐(Pillowing) 방지 및 축 방향 지지 강도 확보. |
| **내부 채움 (Infill)** | **$25\%$ Gyroid / Grid** | $20\% \sim 35\%$ | 등방성 전단 강도 확보를 위해 자이로이드(Gyroid) 권장. |

---

## 3. 결합 공차 체계 (Fit Profiles & Tolerances)

> [!IMPORTANT]
> `global_tolerance = 0.20mm`와 같은 일괄 단일 공차 적용은 금지합니다.
> FDM 출력물의 특성(외경은 팽창하고 홀 내경은 수축하는 Hole Shrinkage 현상)에 맞추어 결합 기능별 공차를 차등 적용해야 합니다.

### 3.1. 용도별 공차 명세 (Fit Profiles)
1. **Press Fit (억지 끼워맞춤)**:
   - **적용 대상**: 608ZZ / 625ZZ 볼베어링 외륜 압입, 고정 핀, 비회전 축 결합.
   - **설계 간극 (Diametral Clearance)**: $+0.10\text{ mm} \sim +0.14\text{ mm}$
   - **특성**: 엄지손가락 또는 소형 고무망치로 밀어 넣어 흔들림 없이 완전 고정.
2. **Snug Fit (중간/타이트 끼워맞춤)**:
   - **적용 대상**: M3 육각 너트 포켓, 분리 가능한 조립 핀, 위치 결정 다월.
   - **설계 간극**: $+0.18\text{ mm} \sim +0.22\text{ mm}$
   - **특성**: 별도의 공구 없이 손으로 밀어 넣고 탈착 가능.
3. **Sliding Fit (미끄럼 끼워맞춤)**:
   - **적용 대상**: 크랭크 슬라이더 가이드 레일, 신축 링크.
   - **설계 간극**: $+0.28\text{ mm} \sim +0.32\text{ mm}$
   - **특성**: 덜컹거림(Play)을 최소화하면서 1차원 직선 운동이 부드럽게 작동.
4. **Rotating Fit (회전 틈새 끼워맞춤)**:
   - **적용 대상**: 베어링 없는 플라스틱-플라스틱 회전축, 프레임 관통 축 부싱 홀.
   - **설계 간극**: $+0.35\text{ mm} \sim +0.42\text{ mm}$
   - **특성**: FDM 레이어 적층면의 미세 마찰 요철을 극복하고 매끄러운 자중/수동 회전 보장.
5. **Gear Tooth Backlash (기어 치면 백래시)**:
   - **설계 기준값**: **최소 $0.25\text{ mm} \sim 0.30\text{ mm}$**
   - **적용 방식**: 피치원 상 치두께($s$)를 공칭 치두께($\frac{\pi m}{2}$)에서 $\Delta s = \text{backlash}$ 만큼 차감하여 치형 생성.

---

## 4. 서포트리스(Support-Free) 및 DFAM 설계 규칙

1. **최대 오버행 각도 (Max Overhang Angle)**:
   - Z축 수직선 기준 최대 **$45.0^\circ$** 초과 금지.
   - $45^\circ$ 이상의 경사면은 챔퍼(Chamfer) 또는 필렛(Fillet)으로 자체 지지형(Self-supporting) 형상화.
2. **수평 홀 티어드롭 (Horizontal Hole Teardrop)**:
   - 지름 $5.0\text{ mm}$ 이상의 수평 출력 관통 홀은 상단 정점에 $45^\circ$ 각도의 눈물방울(Teardrop) 아치를 적용하여 서포트 없이 원형 단면 보존.
3. **코끼리발 방지 챔퍼 (Anti-Elephant's Foot Chamfer)**:
   - 히팅 베드와 접촉하는 최하단 바닥면 에지에는 **$0.80\text{ mm} \times 45^\circ$** 외경 모따기를 자동 적용하여 첫 레이어 과압출(Squish)로 인한 치수 팽창 및 기어 씹힘 방지.
4. **최소 피처 및 브릿지 (Minimum Feature & Bridge)**:
   - 최소 양각 형상(Embossing): 폭 $0.80\text{ mm}$ 이상, 높이 $0.60\text{ mm}$ 이상.
   - 최대 허용 수평 브릿지 길이: $15.0\text{ mm}$ (냉각 팬 100% 가동 조건).

---

## 5. 모델 신뢰도 3등급 체계 (Print Readiness Tiers)

| 등급 | 코드명 | 정의 및 조건 | 출력 가능 여부 | 사용자 액션 가이드 |
| :---: | :---: | :--- | :---: | :--- |
| **Tier 1** | **`Concept`** | - 사진 단 한 장 또는 아이디어 텍스트 기반 VLM 추론 상태.<br>- 절대 치수 미확정, 부품 간 정밀 간극 미검증. | **출력 불가**<br>(Print Blocked) | "교육용 3D 시각화 및 원리 탐구용 모델입니다. 출력을 원하시면 기준 치수를 입력해 주세요." |
| **Tier 2** | **`Prototype`** | - 기준 큐브, 실측 축 직경 또는 다각도 사진 입력 완료.<br>- 부품 간 조립 관계 형성 완료.<br>- G1/G2 통과, G3/G4 조건부 통과. | **시험 출력 권장**<br>(Test Print Only) | "핵심 치수가 보정되었습니다. 간이 치수 확인용 시험 출력이 가능합니다." |
| **Tier 3** | **`Print Ready`** | - 기계공학적 인벌류트 파라메트릭 솔리드 생성.<br>- **G1~G4 제조 검증 게이트 100% Pass**.<br>- 하드웨어 BOM 및 단계별 조립 가이드 패키징 완료. | **실물 출력 보장**<br>(100% Print Ready) | "0.4mm 노즐 FDM 프린터에서 출력 후 즉시 조립 및 구동할 수 있습니다. 3MF/BOM 다운로드 가능." |

---

## 6. 제조 검증 게이트 (Manufacturability Validation Gates)

```
[CAD Solid / Assembly]
       │
       ▼
 [Gate G1: Geometry Integrity]
       ├─ Watertight (비다양체 에지 = 0)
       ├─ Positive Volume (체적 > 0)
       └─ Normal Orientation (법선 일관성)
       │ (Pass)
       ▼
 [Gate G2: Printer Constraints]
       ├─ Min Wall Thickness (>= 1.2mm)
       ├─ Overhang Ratio (45도 초과 면적 < 5%)
       └─ Build Volume Check (<= 180x180x180mm)
       │ (Pass)
       ▼
 [Gate G3: Assembly & Interference]
       ├─ Part-to-Part Collision Volume = 0
       ├─ Center Distance a = m*(z1+z2)/2 정확도
       └─ Shaft-Hole Fit Clearance >= 0.35mm
       │ (Pass)
       ▼
 [Gate G4: Slicing & Layer Validation]
       ├─ Slicing Success (레이어별 2D 슬라이스 유효)
       ├─ Unsupported Islands = 0
       └─ Filament Mass & Print Time 계산
       │ (Pass)
       ▼
  ==> [PRINT READY CERTIFIED]
```
