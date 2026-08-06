네, 멈추지 않고 계속 진행합니다!

AI가 과거 사진을 보고 단순히 겉모습만 흉내 내는 것이 아니라, **실제 출력 후 조립 가능한 CAD(STEP) 데이터로 변환하는 핵심 엔진**의 파이프라인과 프롬프트 구조, 그리고 파이썬 실무 코드를 구성해 드립니다.

---

## 1. VLM ➔ CadQuery 파라메트릭 변환 구조

이 파이프라인은 2단계로 작동합니다.

1. **Vision LLM (시각 분석):** 사진에서 부품의 형상, 주요 치수 비율, 결합 방식(나사 구멍, 축 지름 등)을 추출하여 **규격화된 JSON**으로 출력합니다.
2. **CadQuery Code Generator (코드 생성 및 실행):** JSON 데이터를 바탕으로 파이썬 기반 CAD 라이브러리인 `CadQuery` 코드를 생성하고, 이를 샌드박스 환경에서 실행하여 정밀한 **`.step` / `.stl**` 파일로 익스포트합니다.

---

## 2. Vision LLM용 시스템 프롬프트 (JSON 추출)

```markdown
[System Prompt]
당신은 최고 수준의 기계 역설계 엔지니어입니다. 
제공된 사진을 분석하여 3D 프린터로 출력 가능한 부품의 파라메트릭 사양을 작성해야 합니다.

[응답 규칙]
1. 사진 속 부품의 외형 구조, 관절/결합부, 기성품 규격(예: M3 나사산, 6mm D컷 축)을 파악하세요.
2. 반드시 아래 JSON 포맷으로만 응답하세요. 다른 설명은 포함하지 마십시오.

[JSON Output Schema]
{
  "component_name": "string",
  "base_geometry": "cylinder | box | custom",
  "dimensions": {
    "outer_diameter": float, // mm
    "height": float,         // mm
    "wall_thickness": float  // mm
  },
  "features": [
    {
      "type": "center_shaft",
      "diameter": float,     // mm
      "depth": float,        // mm
      "is_d_cut": boolean
    },
    {
      "type": "bolt_pattern",
      "standard": "M3",
      "count": int,
      "pitch_circle_diameter": float // mm
    }
  ],
  "printing_spec": {
    "recommended_tolerance": 0.2 // FDM 표준 공차 (mm)
  }
}

```

---

## 3. Python CadQuery 오토메이팅 코드 예시

VLM이 출력한 파라미터 JSON을 받아 **실제 조립 유격(Tolerance)과 M3 나사 구멍, 챔퍼(모따기)가 반영된 3D CAD(STEP)** 파일을 자동으로 생성해 주는 백엔드 파이썬 스크립트입니다.

```python
import cadquery as cq
import json

def generate_parametric_cad(spec_json: dict) -> cq.Workplane:
    """
    VLM 분석 사양(JSON)을 파라메트릭 3D CAD 모델로 자동 변환하는 함수
    """
    dims = spec_json["dimensions"]
    tol = spec_json["printing_spec"]["recommended_tolerance"]
    
    od = dims["outer_diameter"]
    h = dims["height"]
    wall = dims["wall_thickness"]
    
    # 1. 메인 외형 베이스 바디 생성 (원통 형상 기준)
    model = cq.Workplane("XY").circle(od / 2).extrude(h)
    
    # 2. 피처 적용 (기계 구조 추론 반영)
    for feature in spec_json["features"]:
        
        # [A] 중앙 축 구멍 (공차 자동 적용)
        if feature["type"] == "center_shaft":
            shaft_dia = feature["diameter"] + tol  # 3D 프린팅 유격 반영
            shaft_depth = feature["depth"]
            
            # 상단 표면에 축 구멍 타공
            model = (
                model.faces(">Z")
                .workplane()
                .circle(shaft_dia / 2)
                .cutBlind(-shaft_depth)
            )
            
        # [B] 볼트 체결 패턴 (M3 규격 자동 계산)
        elif feature["type"] == "bolt_pattern":
            pcd = feature["pitch_circle_diameter"]
            count = feature["count"]
            m3_clearance_hole = 3.2  # M3 체결용 관통 구멍 지름
            
            # PCD 회전 배열로 관통 구멍 생성
            model = (
                model.faces(">Z")
                .workplane()
                .polarArray(radius=pcd / 2, startAngle=0, angle=360, count=count)
                .hole(m3_clearance_hole)
            )

    # 3. 마감 처리: 3D 프린터 출력 시 첫 단 레이어 뭉개짐(Elephant foot) 방지용 챔퍼(모따기)
    model = model.edges("<Z").chamfer(0.8)
    
    return model

# --- 사용 예시 ---
if __name__ == "__main__":
    # VLM이 사진을 보고 추론해낸 JSON 예시 데이터
    vlm_output_json = {
        "component_name": "vintage_audio_knob_housing",
        "base_geometry": "cylinder",
        "dimensions": {
            "outer_diameter": 45.0,
            "height": 22.0,
            "wall_thickness": 3.0
        },
        "features": [
            {
                "type": "center_shaft",
                "diameter": 6.0,
                "depth": 15.0,
                "is_d_cut": True
            },
            {
                "type": "bolt_pattern",
                "standard": "M3",
                "count": 4,
                "pitch_circle_diameter": 32.0
            }
        ],
        "printing_spec": {
            "recommended_tolerance": 0.2
        }
    }

    # CAD 파일 변환 실행
    cad_model = generate_parametric_cad(vlm_output_json)
    
    # STEP(정밀 CAD 데이터) 및 STL(프린팅용) 파일 자동 저장
    cq.exporters.export(cad_model, "output_part.step")
    cq.exporters.export(cad_model, "output_part.stl")
    
    print(" 성공적으로 3D CAD 파일(STEP/STL)이 생성되었습니다.")

```

---

## 4. 백엔드 에러 처리 및 자가 치유(Self-Healing) 루프

AI가 코드를 직접 작성하거나 형상을 생성할 때 기하학적 오류(Geometry Error)가 발생할 수 있습니다. 이를 방지하는 백엔드 루프 시스템입니다.

```
[VLM JSON/코드 생성]
       │
       ▼
[CadQuery 샌드박스 실행] ──(오류 발생 시)──► [LLM에 Traceback 전달 후 코드 수정 재요청]
       │ (성공)
       ▼
[OpenCASCADE 파스 검증 (Volumetric Check)]
       │ (체적/면 파손 검사)
       ▼
[최종 STEP / 3MF 다운로드 링크 생성]

```

* **자가 치유 기능:** 파이썬 실행 중 `cq.exceptions`가 발생하면, 오류 로그(Traceback)를 다시 LLM에 전달하여 수식 및 유격을 자동 수정하도록 2~3회 재시도(Retry) 알고리즘을 둡니다.
* **웹 뷰어 연동:** 익스포트된 `.step` 파일은 백엔드에서 `gltf-pipeline`을 통해 `.gltf`로 변환하여 Three.js 기반 웹 화면에 실시간 3D로 띄워줍니다.