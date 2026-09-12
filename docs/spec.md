# [기획/개발 명세서] EduMechanic 3D: 초·중·고 STEM AI 탐구 놀이터

**문서버전:** v1.0

**작성일자:** 2026년 8월 6일

**수신:** 안티그래비티(Anti-Gravity) 개발팀

**참조:** 제품 기획 / UX 디자인 / 백엔드 엔지니어링

---

## 1. 프로젝트 개요 (Project Overview)

### 1.1 프로젝트 정의

`EduMechanic 3D`는 초·중·고(K-12) 학생들을 위한 **AI 기반 3D 메커니즘 탐구 및 협동 학습 플랫폼**입니다. 학생들이 생활 속 기계 사진을 촬영하면, AI가 내부 기계 구조(기어, 축, 스프링 등)를 유추하여 3D 시각화로 변환합니다. 학생들은 3D 캔버스 상에서 부품을 분해/구동하고, 모둠원들과 실시간으로 메모를 공유하며 탐구 포트폴리오를 구축합니다.

### 1.2 핵심 가치 및 목표 (Key Value & Goals)

* **어려운 기계 원리의 시각화:** 직관적인 3D 분해도 및 구동 시뮬레이션을 통해 물리·공학 원리 이해도 증대
* **모바일/태블릿 최적화 (Mobile & Tablet First):** 교실 및 야외 현장 학습 환경에 최적화된 터치 UX 제공
* **협력적 지식 구축 (Collaborative Learning):** 실시간 3D 핀 메모 동기화 및 메커니즘 리믹스(Fork) 기능 지원
* **가미피케이션 (Gamification):** AI 메카몽 튜터 퀴즈, 탐구 배지 및 수행평가 포트폴리오 자동 발행

---

## 2. UI/UX & 디자인 시스템 명세

### 2.1 Visual Tone & Manner

* **Theme:** Light & Fresh (밝고 친근한 3D 학습 공간)
* **Background:** Light Sky Tint (`#F0F9FF`) 및 Soft Warm Gray (`#F8FAFC`)
* **Primary Color:** Sky Blue (`#0284C7` / `#38BDF8`)
* **Secondary Color:** Mint Emerald (`#10B981`), Amber Yellow (`#F59E0B`)
* **Styling:** 클레이모피즘(Claymorphism) 스타일의 도톰한 터치 버튼, 라운드 카드(`rounded-2xl` ~ `rounded-3xl`), 높은 명암비의 스포티한 폰트 적용

### 2.2 용어 체계 매핑 (Terminology Mapping)

학생 대상 서비스이므로 산업용 CAD/엔지니어링 용어를 친근한 동작 중심 언어로 매핑하여 적용합니다.

| 공학/개발 용어 | 서비스 표기 용어 (K-12 Target) | UI 비주얼 가이드 |
| --- | --- | --- |
| **Exploded View** | **부품 펼쳐보기 (분해도)** | 슬라이더 바 (0% ~ 100%) |
| **Drive Simulation** | **스위치 온! 움직여보기** | 메인 재생/일시정지 버튼 |
| **X-Ray / Wireframe** | **속 들여다보기** | 반투명 와이어프레임 토글 |
| **Fork / Remix** | **내 탐구장에 담기 & 개조하기** | 아카이빙/포크 아이콘 |
| **Raycasting / Inspector** | **🔍 부품 돋보기** | 3D 터치 레이어 하이라이트 |
| **AI Analysis Engine** | **🤖 AI 튜터 메카몽의 비밀 발견** | 마스코트 아바타 팁 카드 |
| **Portfolio Export** | **🏆 나만의 3D 과학 탐구 배지 카드** | PDF/웹 공유 카드 |

---

## 3. 시스템 아키텍처 및 기술 스택 (Tech Stack)

```
[Mobile/Tablet Client] ──(HTTP/WS)──► [API Gateway (FastAPI)]
  - Next.js 14 / React 18                │
  - React Three Fiber (R3F)              ├──► [AI/VLM Pipeline]
  - Yjs (CRDT Real-time Sync)            │     - Claude 3.5 / Qwen2-VL
                                         │     - Mech RAG (Patent/Manual DB)
[Data Persistence]                       │
  - PostgreSQL (Relational Data)         ├──► [CAD Engine Core]
  - Redis (Session/Socket Queue)         │     - CadQuery / OpenCASCADE
  - AWS S3 (GLTF/3MF/Image Assets)       │     - GLTF-Pipeline (Mesh Optim)

```

| 영역 | 사용 기술 | 선정 이유 |
| --- | --- | --- |
| **Frontend** | Next.js 14, Tailwind CSS, Zustand | Mobile/Tablet 웹 PWA 대응 및 모듈화 |
| **3D Engine** | Three.js / React Three Fiber (R3F) | WebGL 기반 터치 인터랙션, OrbitControls, Raycasting 구현 |
| **Real-time Sync** | **Yjs + WebSockets (y-websocket)** | 모둠원 간 3D 캔버스 핀 메모, 마우스/터치 커서 실시간 동기화 |
| **Backend API** | FastAPI (Python 3.11) | CadQuery/PyVista 연동 및 비동기 파이프라인 처리 |
| **AI Engine** | Vision LLM + RAG (Vector DB) | 사진 분석 ➔ 메커니즘 추론 ➔ JSON 스키마 자동 파싱 |
| **CAD Pipeline** | CadQuery / OpenCASCADE | 정밀 STEP CAD 연산 후 웹 표준 GLB/GLTF 변환 백엔드 |

---

## 4. 주요 기능 명세 (Feature Specifications)

### F-01: AI 비전 스캔 & 메커니즘 추론 엔진

* **개요:** 사용자가 카메라로 찍은 제품 사진에서 외형 객체 인식 및 내부 기계 구조(기어비, 축, 힌지)를 유추합니다.
* **주요 로직:**
1. 클라이언트에서 이미지 업로드 (`POST /api/v1/scan`)
2. VLM이 사진을 세그먼테이션하고, RAG DB(특허/매뉴얼)를 참조하여 내부 부품 구조 추론
3. JSON 스키마 형태로 파싱 후 CadQuery 모듈로 전달 ➔ 3D GLB 모델 및 3D 스펙 데이터 반환



### F-02: 인터랙티브 3D 캔버스 (Touch Viewport)

* **터치 컨트롤:**
* One-finger Drag: 3D 회전 (Orbit)
* Two-finger Pinch: 확대/축소 (Zoom)
* Two-finger Drag: 이동 (Pan)


* **조작 모드:**
* **부품 펼쳐보기:** 분해 오프셋 Vector($\vec{D}$) 계산에 따른 부품 이동 ($\vec{P} = \vec{P}_0 + t \cdot \vec{D}$)
* **스위치 온! 구동:** 기어 및 축 오브젝트 회전 축 애니메이션 적용
* **속 들여다보기:** `MeshPhysicalMaterial` 와이어프레임 토글
* **부품 돋보기:** Raycaster로 3D 메쉬 클릭 시 하이라이트(Emissive Color) 및 상세 카드 바인딩



### F-03: 모둠 실시간 공동 탐구 (Collaborative Playground)

* **동시 접속 시각화:** 같은 학급/모둠 코드 접속자의 프로필과 3D 터치 핀 위치가 실시간 렌더링
* **3D 메모 핀 (3D Pinning):** 3D 메쉬 표면에 월드 좌표(Vector3) 형태의 핀 생성 후 질문/의견 작성
* **시점 공유 (Camera Sync):** 핀 클릭 시 다른 모둠원의 3D 카메라 위치/타겟이 해당 부품 위치로 이동

### F-04: 리믹스 (Fork/Remix) & 포트폴리오 생성

* **리믹스(Fork):** 타인이 작성한 3D 탐구 카드를 내 워크스페이스로 복제하여 부품 변경 및 커스텀 메모 추가
* **포트폴리오 카드 (PDF/Image):** 탐구 이력, AI 퀴즈 결과, 3D 캡처 이미지를 결합한 수행평가 제출용 리포트 자동 생성

### F-05: AI 대화형 파라메트릭 역설계 & 공동 학습 (Snap & Co-Learn)

* **대화형 파라메터 수정:** AI 하브루타 대화를 통해 기어 잇수($z$), 모듈($m$), 축 직경($d$), 링크 길이($L$)를 실시간 조절하고 3D 기구학적 맞물림을 동적 업데이트
* **원리 실시간 시뮬레이션:** 기어비 변경에 따른 회전 속도/토크 관계, 링크 메커니즘의 궤적(Trajectory) 3D 실시간 연산

### F-06: DFAM 기반 3D 프린팅 자동 검증 & 슬라이싱 패키저 (Snap-to-Print)

* **DFAM 지능형 검사:** 오버행($>45^\circ$), 최소 벽 두께($<1.2\text{mm}$), FDM 수축 보정 공차($+0.2\sim+0.35\text{mm}$) 및 수평 홀 눈물방울(Tear-drop) 형상 자동 주입
* **표준 COTS 결합:** 608ZZ 베어링, M3 볼트, 레고 테크닉 홀 규격을 지원하여 출력물과 실물 부품의 하이브리드 조립 지원
* **3MF/STL 멀티 플레이트 패키징:** Bambu Studio / Cura / PrusaSlicer 규격 번들 압축 파일 원클릭 다운로드

---

## 5. 데이터베이스 ERD 설계 명세

```
[Users] 1 ─── N [Classrooms] 1 ─── N [ClassMembers]
  │
  └─── 1 ─── N [ExplorationCards] 1 ─── N [CardPins]
                     │
                     └─── 1 ─── N [CardRemixHistory]

```

### 핵심 테이블 정의

#### 1) `ExplorationCards` (3D 탐구 카드)

```sql
CREATE TABLE exploration_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- 예: 연필깎이, 오르골, 자전거
    original_image_url TEXT NOT NULL,
    gltf_model_url TEXT NOT NULL,
    ai_summary TEXT,
    stem_principles JSONB, -- STEM 물리 원리 배열
    is_public BOOLEAN DEFAULT true,
    forked_from_id UUID REFERENCES exploration_cards(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

```

#### 2) `CardPins` (3D 실시간 핀 메모)

```sql
CREATE TABLE card_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES exploration_cards(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    part_id VARCHAR(50) NOT NULL, -- 선택된 3D 메쉬 파트 ID
    position_x FLOAT NOT NULL,    -- 3D World Position X
    position_y FLOAT NOT NULL,    -- 3D World Position Y
    position_z FLOAT NOT NULL,    -- 3D World Position Z
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

```

---

## 6. API 인터페이스 명세 (VLM Parsing JSON Schema)

백엔드 AI 엔진이 분석을 완료한 후 프론트엔드 및 CAD 엔진으로 전달하는 표준 JSON 스키마 사양입니다.

```json
{
  "card_id": "card_sharpener_001",
  "title": "수동 연필깎이 메커니즘",
  "category": "K-12 STEM Mechanical",
  "ai_summary": "손잡이를 돌리면 직각 베벨 기어가 힘의 방향을 90도 변환하여 칼날을 회전시켜요!",
  "components": [
    {
      "part_id": "part_bevel_gear",
      "name": "중앙 경사 베벨 기어",
      "function_title": "동력 90도 직각 전달",
      "description": "손잡이의 회전력을 직각으로 꺾어 칼날 축으로 전달해 주는 핵심 기어입니다.",
      "explode_vector": { "x": 1.0, "y": 0.5, "z": 0.0 },
      "rotation_axis": "Y",
      "stem_principle": "회전 운동 방향 전환 (Bevel Gear Principle)"
    }
  ],
  "quiz": {
    "question": "손잡이를 2바퀴 돌릴 때 칼날이 6바퀴 돌았습니다. 회전 속도는 몇 배 빨라졌을까요?",
    "options": ["1. 2배", "2. 3배", "3. 6배", "4. 12배"],
    "correct_index": 1,
    "explanation": "2바퀴 입력 시 6바퀴가 회전하므로 회전 속도는 3배 증가합니다!"
  }
}

```

---

## 7. 안티그래비티 개발팀 이행 로드맵 (4-Phase Roadmap)

```
[Phase 1: 백엔드 & 3D 엔진] ➔ [Phase 2: VLM AI 파이프라인] ➔ [Phase 3: 모바일 UI & Yjs] ➔ [Phase 4: QA & 알파테스트]
  (3D GLB 파싱 및 R3F)       (사진 스캔 ➔ JSON 변환)     (동시 접속 & 핀 메모)      (교실 태블릿 현장 검증)

```

* **Phase 1 (1~2주차) - 3D Engine & Viewer Core:**
* Next.js + React Three Fiber 기반 3D 뷰어 컴포넌트 구축
* 분해도(Explode), X-Ray, 회전 애니메이션 모듈 개발


* **Phase 2 (3~4주차) - AI VLM & CAD Pipeline Integration:**
* 이미지 업로드 스캔 API 개발
* VLM ➔ JSON ➔ CadQuery ➔ GLB 파이프라인 연동


* **Phase 3 (5~6주차) - Real-time Collaboration & UI Polish:**
* Yjs 및 WebSocket 기반 3D 핀 메모 실시간 동기화 개발
* 파스텔 톤앤매너, 모바일/태블릿 터치 UX 반응형 적용


* **Phase 4 (7~8주차) - Field Testing & Optimization:**
* 태블릿(iPad/Galaxy Tab) 환경 성능 최적화 (60 FPS 유지)
* 학교 현장 교사/학생 대상 알파 테스트 및 포트폴리오 PDF 익스포트 검증

---

## 8. 제조 가능성 및 실물 3D 프린팅 표준 (Manufacturing & Print Ready Specification)

### 8.1 EduMechanic Classroom FDM Profile v1
* **표준 노즐 / 레이어**: 0.40mm 노즐, 0.20mm 레이어 높이, 소재 PLA
* **기본 벽 두께**: 일반 벽 최소 1.20mm (3외벽), 하중 지지/치형 벽 1.60~2.00mm
* **인필**: 25% Gyroid / Grid

### 8.2 결합 공차 체계 (Fit Profiles)
* **Press Fit (억지 끼워맞춤)**: +0.10 ~ +0.14mm (베어링/고정축 압입)
* **Snug Fit (중간 끼워맞춤)**: +0.18 ~ +0.22mm (M3 너트 포켓, 탈착 핀)
* **Sliding Fit (미끄럼 끼워맞춤)**: +0.28 ~ +0.32mm (가이드 레일, 슬라이더)
* **Rotating Fit (회전 틈새 끼워맞춤)**: +0.35 ~ +0.42mm (수지 회전축)
* **Gear Backlash (치면 백래시)**: 최소 0.25 ~ 0.30mm

### 8.3 모델 신뢰도 3단계 등급 (Print Readiness Tiers)
1. **Concept**: 사진 1장/아이디어 기반. 시각화 전용, 출력 미보장.
2. **Prototype**: 기준 치수/다각도 정보 반영. 치수 확인용 간이 시험 출력 가능.
3. **Print Ready**: 파라메트릭 CAD 솔리드 확정 + G1~G4 제조 검증 게이트 100% 통과 + BOM 패키지 완료. 실제 출력·조립·구동 보장.

### 8.4 4단계 제조 검증 파이프라인 (G1 ~ G4)
* **G1 Geometry**: Watertight, 2-Manifold, Positive Volume, No Degenerate Faces
* **G2 Printer**: Minimum Wall, Support-Free Overhang (<=45°), Build Volume Bounds (<=180mm³)
* **G3 Assembly**: Collision Volume = 0, Fit Clearance Verification, Gear Center Distance
* **G4 Slicing**: Layer Generation, 0 Unsupported Islands, Filament Mass (g) & Print Time Calculation