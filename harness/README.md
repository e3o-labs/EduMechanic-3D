# EduMechanic 3D - 개발 & 테스트 하네스 (Harness) 가이드

본 디렉토리는 `EduMechanic 3D` 본 프로젝트의 안정적인 개발, 테스트 및 AI 파이프라인 검증을 위한 **테스트 하네스 모듈**을 포함합니다.

---

## 🛠️ 하네스 구성요소 (Harness Subsystems)

### 1. `cad_sandbox/` (CAD 생성 및 샌드박스 안전 검증 하네스)
* **목적:** VLM이 생성한 CadQuery 스크립트의 안전한 격리 실행 및 기하학적 체적(Manifold) 검증.
* **주요 기능:**
  * Python `subprocess` / `restricted_eval` 기반 샌드박스 실행기.
  * OpenCASCADE 기하 파손(Self-intersection, Degenerate edges) 감지.
  * 0.2mm FDM/SLA 결합 공차 오차 측정 및 Self-Healing 재시도 매직 트리거.

### 2. `vlm_evaluator/` (AI 비전 추론 정밀도 평가 하네스)
* **목적:** 업로드된 기계 사진 ➔ VLM 추론 JSON 사양 ➔ 3D CAD 모델 변환 파이프라인의 성공률 평가.
* **주요 기능:**
  * `vlm_schema_validator.py`: VLM 응답 JSON이 표준 스키마(`docs/spec.md` 3.1절)를 준수하는지 검증.
  * Benchmarking Runner: 10종의 Golden Sample 기계 사진에 대한 파싱 정확도 측정.

### 3. `dfam_evaluator/` (적층제조 최적화 & 공차 정밀도 검증 하네스) [Phase 11]
* **목적:** 3D 프린팅 출력 성공률 95% 보장을 위한 오버행, 최소 벽 두께, 눈물방울 홀(Tear-drop), Chamfer 형상 및 공차(0.15~0.35mm) 자동 검증.
* **주요 기능:**
  * Mesh Overhang Analyzer ($>45^\circ$ 검출)
  * Tolerance Fitment Checker (회전축 슬립핏 $+0.30\text{mm}$, 프레스핏 $+0.15\text{mm}$)
  * Watertight Solid Volume & Non-manifold 결함 Zero 검증.

### 4. `slicer_evaluator/` (3MF 슬라이싱 아카이브 & 메타데이터 검증기) [Phase 11]
* **목적:** Bambu Studio, OrcaSlicer, PrusaSlicer, Cura 호환 3MF 멀티 플레이트 컨테이너 무결성 검증.
* **주요 기능:**
  * 3MF 패키지 내 모델 XML, 슬라이서 매니페스트, 레이어 높이(0.16mm), 인필(15% Gyroid) 프로파일 자동 검증.

### 5. `cots_matcher/` (상용 표준 부품 규격 적합성 검증기) [Phase 11]
* **목적:** M3 볼트, 608ZZ 베어링, TT 모터, 레고 테크닉 핀 홀 규격의 치수 일치도 자동 평가.

### 6. `datasets/` (Golden Test Dataset)
* 테스트용 대표 기계 부품 샘플 (연필깎이, 태엽 오르골, 유성기어, 4절 링크, 제네바 기구) 이미지 및 정답 JSON 기준서 저장.

### 7. `mocks/` (프론트엔드 및 실시간 공유 Mock 서버)
* **목적:** 백엔드 없이 프론트엔드 3D 캔버스 및 실시간 멀티유저 협업 기능을 독립 개발/테스트.
* **주요 기능:**
  * Mock WebSocket Server: Yjs 기반 3D 핀 메모 및 마우스 커서 동기화 시뮬레이터.
  * Mock REST API: Fast API `GET /api/v1/scan` 및 `POST /api/v1/pin` 목업 응답.

---

## 🚀 하네스 실행 방법 (Quick Start)

```bash
# 1. VLM 스키마 검증 테스트
python harness/vlm_evaluator/validate_schema.py

# 2. CadQuery 샌드박스 3D 익스포트 테스트
python harness/cad_sandbox/run_cad_test.py --input harness/datasets/sharpener_gold.json

# 3. 프론트엔드 목업 서버 구동
node harness/mocks/server.js
```
