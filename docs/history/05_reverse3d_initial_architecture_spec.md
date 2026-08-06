과거 사진으로부터 기계 구조를 추론하고 정밀 3D 파라메트릭 CAD(STEP) 변환 및 교육용 3D 인포그래픽으로 확장하는 AI 기반 3D 역설계 서비스(가칭: ReVerse-3D Engine)의 초기 기획 및 개발 설계 문서(Software Architecture & Specs)입니다.

개발 환경(Development Environment)으로 이관하여 실제 코딩과 파이프라인 구축을 진행할 수 있도록 그동안 논의된 핵심 로직과 기술 스택을 체계적으로 정리했습니다.

---

# [기획/설계 문서] AI 사진 기반 파라메트릭 역설계 및 듀얼모드 3D 플랫폼

## 1. 프로젝트 개요 (Project Overview)

* **프로젝트명:** ReVerse-3D Engine (가칭)
* **목적:** 사진 한 장으로부터 제품의 시각적 외형 복원을 넘어, 내부 메커니즘/기계 구조를 추론하고 실제 3D 프린터로 출력·조립 가능한 정밀 파라메트릭 CAD(STEP) 데이터 및 교육용 3D 콘텐츠 생성
* **핵심 타겟:**
1. **Pro Mode:** 하이엔드 키덜트, 올드카/클래식 기기 복원가, 스케일 모더, 3D 프린팅 메이커
2. **Edu Mode:** 초·중·고 STEM 교육기관, 대학 기계/디자인학과, 국립과학관/전시관



---

## 2. 코어 아키텍처 전략: Single-Core Dual-Frontend

핵심 분석 및 CAD 생성 파이프라인(Back-end)은 100% 공유하되, 유저 유형에 따라 **AI 프롬프트 설정과 프론트엔드 UI/UX만 분리**하여 개발 효율성을 극대화합니다.

```
                  ┌─────────────────────────────────────────────┐
                  │      통합 백엔드 코어 (Shared Core Engine)      │
                  │  - Vision VLM (부품 분할 및 치수 비율 추론)     │
                  │  - Mech RAG (특허/매뉴얼/작동 원리 DB 검색)     │
                  │  - CadQuery / OpenCASCADE (STEP CAD 자동 생성)  │
                  └──────────────────────┬──────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
       [Pro Mode: 역설계/메이커]                     [Edu Mode: STEM 교육용]
  - FDM/SLA 공차 미세 조정 (0.1~0.4mm)         - 작동 원리 시뮬레이션 및 회전 모션
  - 정밀 STEP/STL 3D 파일 다운로드             - 부품별 물리/공학 원리 카드
  - 규격 기성품(M3 나사, 베어링) BOM          - 인터랙티브 원리 퀴즈 & 학습 리포트

```

---

## 3. 시스템 워크플로우 (4-Layer Pipeline)

### Layer 1: Vision & Knowledge Inference (VLM + RAG)

* **Input:** 사진 파일 + 사용자가 입력한 대략적인 실제 크기(기준 치수 1개)
* **Processing:**
* **VLM (Claude 3.5 Sonnet / Qwen2-VL):** 객체 분할(Segmentation) 및 부품 간 결합 방식 추론
* **Mech RAG:** 유사 구조의 특허 데이터베이스, 서비스 매뉴얼 문서 RAG 검색을 통해 사진에 보이지 않는 내부 구조(기어비, 축 결합 등) 보완



### Layer 2: Geometry & Parametric CAD Engine

* **Processing:**
* VLM이 추론한 구조를 **구조화된 JSON 스키마**로 출력
* Python **CadQuery / OpenCASCADE** 스크립트 실행으로 정밀 솔리드 CAD(NURBS 기반 `.step`) 생성



### Layer 3: Printability & Assembly Optimization

* **Processing:**
* **공차 엔진:** FDM/SLA 출력 특성에 따른 결합 유격($0.15\text{mm} \sim 0.20\text{mm}$) 자동 적용
* **기성 부품(Hardware) 자동 타공:** M2/M3 나사 구멍 및 황동 인서트 치수 자동 반영
* **3MF/STL 익스포트:** 부품별 분할 파일 생성



### Layer 4: Presentation & WebGL Canvas (Web App)

* **Processing:**
* **Three.js / React Three Fiber (R3F):** 분해도(Exploded View) 실시간 컨트롤
* **인터랙티브 툴팁:** 3D Raycasting으로 부품 클릭 시 공학 스펙 / 원리 팝업



---

## 4. 추천 기술 스택 (Tech Stack)

| 구분 | 기술 스택 | 선정 이유 |
| --- | --- | --- |
| **Frontend** | **Next.js 14, Tailwind CSS, Zustand** | SSR 및 상태 관리 최적화 |
| **3D Canvas Engine** | **Three.js / React Three Fiber (R3F)** | WebGL 기반 실시간 분해도, 회전 애니메이션, Raycasting 지원 |
| **Backend API** | **FastAPI (Python 3.11)** | CadQuery, OpenCASCADE, PyVista 등 파이썬 CAD 라이브러리와 직접 연동 |
| **Task Queue** | **Redis + Celery** | 무거운 CAD 파라메트릭 연산 및 3D 파일 변환 비동기 연산 처리 |
| **AI / VLM** | **Claude 3.5 Sonnet API / Qwen2-VL** | 시각적 메커니즘 분석 및 JSON 파라메트릭 스키마 생성 |
| **CAD Engine** | **CadQuery, OpenCASCADE (`python-occ`)** | 메쉬(Mesh)가 아닌 정밀 파라메트릭 CAD(STEP) 코드 기반 자동화 |
| **Database** | **PostgreSQL + pgvector** | 유저 데이터 및 특허/매뉴얼 RAG 임베딩 벡터 저장 |

---

## 5. AI-to-CAD 인터페이스 사양 (JSON Schema)

백엔드 AI 엔진이 사진을 분석한 후 CadQuery 엔진으로 전달하는 표준 JSON 스키마 구조입니다.

```json
{
  "project_id": "proj_vintage_gearbox_001",
  "mode": "pro_reverse_engineering",
  "assembly_name": "Planetary Gearbox Assembly",
  "base_unit": "mm",
  "global_tolerance": 0.20,
  "components": [
    {
      "id": "part_sun_gear",
      "name": "Central Sun Gear",
      "geometry_type": "spur_gear",
      "parameters": {
        "module": 1.5,
        "teeth_count": 12,
        "face_width": 10.0,
        "bore_diameter": 6.2
      },
      "features": [
        {
          "type": "d_cut_shaft",
          "flat_distance": 5.5
        }
      ],
      "edu_metadata": {
        "physics_principle": "동력 전달 및 회전속도 변환",
        "description": "입력축의 회전력을 피니언 기어로 전달하는 중심 기어입니다."
      }
    }
  ]
}

```

---

## 6. 초기 개발 로드맵 (4-Phase Roadmap)

* **Phase 1: 백엔드 CAD 생성 파이프라인 구축 (PoC)**
* FastAPI + CadQuery 연동 환경 구축
* 샘플 JSON 입력 시 정밀 `.step` 및 `.gltf` 파일 변환 테스트


* **Phase 2: VLM & RAG 추론 모듈 개발**
* 이미지 입력 시 표준 JSON 스키마를 안정적으로 출력하는 AI 프롬프트 튜닝
* 백엔드 자가 치유(Self-Healing) 오류 처리 루프 구현


* **Phase 3: WebGL 3D 캔버스 & 듀얼 모드 UI 개발**
* Next.js + R3F 기반 분해도, 공차 조절, 구동 애니메이션 뷰어 구현
* Pro/Edu 모드 전환 인터페이스 완성


* **Phase 4: 실제 3D 프린팅 출력 검증 & 알파 테스트**
* 생성된 STEP 데이터를 FDM/SLA 3D 프린터로 실제 출력하여 체결 공차 오차 측정 및 보정



---