# [기획/아키텍처 명세서] Snap-to-Print Full-Cycle 메이커스 파이프라인 & 생태계 협업 전략

**문서 버전:** v1.0  
**작성 일자:** 2026년 8월 30일  
**적용 마일스톤:** Phase 11 (Snap-to-Print Full-Cycle Makers Pipeline)  
**참조 문서:** [`docs/spec.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/docs/spec.md), [`roadmap.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/roadmap.md), [`harness/README.md`](file:///Users/Agent/ps-workspace/EduMechanic-3D/harness/README.md)

---

## 1. 개요 및 배경 (Executive Summary)

`EduMechanic 3D`의 Phase 11 확장은 기존의 "사진 촬영 ➔ 메커니즘 3D 시각화 및 웹 탐구"에서 한 단계 더 나아가, **"사진 촬영 ➔ AI 원리 추론 ➔ 하브루타 대화형 파라메트릭 튜닝 ➔ DFAM 3D 프린팅 자동 검증 ➔ 실물 출력 및 조립/검증"**으로 이어지는 완전한 **Digital-to-Physical Full-Cycle STEAM 메이커스 파이프라인**을 구축하는 것을 목표로 합니다.

학생들은 단순히 정형화된 모델을 보는 것에 그치지 않고, AI 튜터 '메카몽'과 문답을 주고받으며 기어비, 회전축 크기, 링크 길이를 수정하고, 이를 실제 3D 프린터(FDM/SLA)로 출력하여 손으로 만져보고 작동을 검증하는 진정한 의미의 구성주의(Constructivism) 공학 교육을 경험합니다.

---

## 2. End-to-End 사용자 경험 여정 (User Journey)

```
 [1. Snap (촬영)]  ──►  [2. Infer & Visualize]  ──►  [3. Co-Learn & Tune]  ──►  [4. DFAM Validate]  ──►  [5. Print & Assemble]
  실생활 기계 촬영        VLM 메커니즘 역설계          AI 하브루타 파라메터          오버행/공차 자동 보정         3MF 슬라이싱 & 실물
 (연필깎이, 힌지 등)     (부품/축/기어비 분해)        (감속비, 축경, 홀 조절)       (Tear-drop, Chamfer)          팹랩/학교 프린터 출력
```

1. **Step 1: Snap & Detect (촬영 및 역설계)**
   * 스마트폰/태블릿 카메라로 실생활 기계 부품(연필깎이, 자전거 변속기, 자물쇠, 캠 기구 등) 촬영 및 업로드.
2. **Step 2: Mechanism Inference (원리 추론 & 3D 분해)**
   * VLM이 외형 객체를 인식하고 Mech RAG(특허/도면 DB)를 결합하여 내부 구동 메커니즘을 유추한 뒤 3D 인터랙티브 캔버스에 렌더링.
3. **Step 3: Interactive Co-Learning (AI 하브루타 & 파라메터 튜닝)**
   * 메카몽 튜터와의 대화(*"더 큰 힘을 내려면 기어를 어떻게 바꿔야 할까?"*)를 통해 잇수($z$), 모듈($m$), 축경($d$)을 실시간 조절하고 기구학적(Kinematic) 맞물림 애니메이션 검증.
4. **Step 4: DFAM Auto-Optimization (적층제조 최적화 및 공차 주입)**
   * FDM 출력 실패를 원천 차단하는 지능형 형상 보정(오버행 경고, 수평 홀 눈물방울 형상화, 바닥 모따기, 슬립핏/프레스핏 공차 자동 할당).
5. **Step 5: 1-Click Slicing & Physical Assembly (출력 및 조립)**
   * Bambu Studio, OrcaSlicer, Cura 규격 3MF/STL 패키지를 원클릭 다운로드하거나 학교 메이커스페이스 프린터 팜으로 원격 전송하여 실물 제작.

---

## 3. 핵심 기술 아키텍처 및 품질 보장 체계 (Technical & Quality Architecture)

### 3.1 CSG/B-Rep 기반 CadQuery 파라메트릭 CAD
* **표준 공학 수식 인벌류트(Involute) 치형 생성:** 메시 생성형 AI(NeRF/Point Cloud)의 고질적인 표면 꼬임이나 치수 찌그러짐 없이, 완벽한 수학적 인벌류트 곡선 기반 톱니 솔리드 생성.
* **Snap-to-Standard 정규화 엔진:** VLM의 부정확한 픽셀 추론치(예: 지름 31.8mm)를 공학 표준 규격(모듈 $m=1.5$, 잇수 $z=20$, 피치원 지름 $d=30.0\text{mm}$)으로 자동 스냅.
* **100% Watertight Solid (수밀체 보장):** 비다양체(Non-manifold), 뒤집힌 면(Flipped Normal) 0건 달성으로 슬라이서 에러 완전 배제.

### 3.2 DFAM (Design for Additive Manufacturing) 지능형 보정 규칙

| 보정 규칙 | 기술적 처리 방식 | 해결되는 3D 프린팅 문제 |
| :--- | :--- | :--- |
| **수평 홀 눈물방울 (Tear-drop)** | 지름 $\ge 5\text{mm}$ 수평 관통 홀의 상단부를 $45^\circ$ 아치형 곡면으로 절삭 | 서포트 없이 원형 관통축을 깨끗하게 출력 |
| **코끼리발 방지 (Chamfer)** | 베드 접촉면 외곽 모서리에 `chamfer(0.8mm)` 자동 적용 | 첫 레이어 과압출로 인한 조립부 치수 팽창 방지 |
| **적응형 공차 엔진 (Tolerance Engine)** | • 회전축/슬립핏: $+0.30\text{mm}$<br>• 고정축/프레스핏: $+0.15\text{mm}$<br>• 프린터 프리셋(Bambu vs Ender) 가변 연산 | FDM 수축으로 인한 축 헛돌림 및 끼임 불량 원천 해결 |
| **최소 벽 두께 방어** | 노즐 직경($0.4\text{mm}$) 기준 3벽($1.2\text{mm}$) 미만 형상 감지 시 자동 보강 | 부품 파손 및 적층 누락 방지 |

### 3.3 Micro-Print & 표준 COTS 결합 하이브리드 아키텍처
* **Micro-Scale 고속 출력 모드:** 40~50분 정규 수업 시간 내 출력을 완료하기 위해, 하우징 전체가 아닌 **'핵심 기구학 부품(기어, 캠, 링크)'**만을 $10\sim 20\text{분}$ 내 초고속 출력할 수 있는 미니어처 스케일링 지원.
* **표준 COTS (Commercial Off-The-Shelf) 하드웨어 연동:**
  * 표준 볼트/너트: M3 규격 홀 및 카운터보어 자동 생성
  * 표준 베어링: 608ZZ ($\varnothing 8 \times \varnothing 22 \times 7\text{mm}$) 마운트 규격 매핑
  * 표준 모터/핀: TT 모터 D-Shaft 및 레고 테크닉(LEGO Technic) 핀 호환 홀 지원

---

## 4. 글로벌 3D 커뮤니티 및 팹랩(FabLab) 협업 전략

### 4.1 글로벌 3D 커뮤니티 (MakerWorld, Printables, Thingiverse)
* **1-Click Publish to MakerWorld / Printables:** 학생이 설계한 메커니즘을 3MF 프로젝트 파일(플레이트 배치, 레이어 높이, 자이로이드 인필 포함) 및 AI 조립 지침서와 함께 커뮤니티에 원클릭 포스팅.
* **Maker's Supply 하드웨어 제휴 (Commerce Affiliate):** Bambu Lab의 Maker's Supply 부품 샵(모터, 베어링, 배터리 키트)과 연동하여 원클릭 번들 구매 링크 제공 및 제휴 수익 창출.
* **전국/글로벌 AI 3D 메이커스 에듀 챌린지 주최:** 우수 학생 메커니즘에 대한 커뮤니티 부스트 포인트 및 교구재 지원 콘테스트 운영.

### 4.2 팹랩 / 메이커스페이스 / 초중고 학교 현장
* **팹랩 3D 프린터 팜(OctoPrint / Moonraker / Klipper) 관제 큐 연동:** 교실 캔버스에서 학생들의 출력 요청을 팹랩 내 다수 3D 프린터로 자동 분배.
* **B2B / B2G 에듀케이션 SaaS 라이선스:** 시도 교육청, 디지털 새싹 캠프, 늘봄학교, 팹랩 운영 기관 대상 'AI 역설계 & 3D 메이커스 교재/교구 패키지' 공급.
* **모델링 장벽 해소 원데이 클래스:** 기존 CAD 툴(Fusion360 등)의 높은 진입장벽 없이 사진 한 장으로 10분 만에 원리 학습 및 출력까지 완료하는 단기 완성형 커리큘럼 제공.

---

## 5. 하네스(Harness) 테스트 & 자동화 검증 체계

Phase 11의 신뢰성을 보장하기 위해 기존 `harness/` 체계에 DFAM 및 슬라이싱 검증 모듈을 확장합니다.

```
harness/
├── cad_sandbox/          # CadQuery CSG 격리 실행 및 B-Rep 수밀성(Watertight) 검사
├── dfam_evaluator/       # [NEW] 오버행, 최소 두께, Tear-drop 형상 및 공차 보정 검증기
├── slicer_evaluator/     # [NEW] 3MF 멀티 플레이트 아카이브 구조 및 메타데이터 무결성 검증기
├── cots_matcher/         # [NEW] M3 / 608ZZ / LEGO 규격 치수 적합성 정밀 검사기
├── vlm_evaluator/        # VLM 사진 추론 ➔ 파라메트릭 CAD 변환 정확도 평가
└── datasets/             # Golden Dataset (연필깎이, 오르골, 유성기어, 제네바 기구 등)
```
