# [Walkthrough] EduMechanic 3D MVP Construction & Verification

`EduMechanic 3D` 프로토타입 데모를 **모듈식 Next.js 14 + R3F 3D 웹 앱** 및 **FastAPI + CadQuery 백엔드 하네스 모듈**을 포함한 **EduMechanic 3D MVP 시스템**으로 변환 구축하였습니다.

---

## 🚀 Accomplished Work

### 1. Frontend Modular Architecture (`apps/web`)
- **Next.js 14 App Router & R3F Integration**:
  - [`apps/web/src/app/page.tsx`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/web/src/app/page.tsx): Client-side dynamic loading for Three.js R3F Canvas to prevent SSR hydration mismatches.
  - [`apps/web/src/components/3d/CanvasViewport.tsx`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/web/src/components/3d/CanvasViewport.tsx): R3F Canvas root with OrbitControls, directional lighting, and camera presets (ISO, TOP, X-Ray).
  - [`apps/web/src/components/3d/MechanismModel.tsx`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/web/src/components/3d/MechanismModel.tsx): Procedural 3D mechanism models (`sharpener`, `musicbox`, `bicycle`) with Exploded View slider translation, continuous rotation animation, wireframe X-Ray, and raycasting selection emissive highlights.
  - [`apps/web/src/components/3d/PinOverlay.tsx`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/web/src/components/3d/PinOverlay.tsx): Drei `Html` 3D world coordinate question pins.
- **Claymorphic UI & State Management**:
  - [`apps/web/src/store/useStore.ts`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/web/src/store/useStore.ts): Global Zustand state store managing presets, 3D pins, simulation toggles, and drawer tab switching.
  - [`apps/web/src/components/ui/TouchToolbar.tsx`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/web/src/components/ui/TouchToolbar.tsx): Explode slider ($0\% \sim 100\%$), Drive simulation toggle, and Question Pin mode toggle.
  - [`apps/web/src/components/ui/DrawerPanel.tsx`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/web/src/components/ui/DrawerPanel.tsx): 3-tab drawer (`🔍 부품과 원리`, `💬 함께 탐구하기`, `🧩 AI 탐구 퀴즈`).
  - [`apps/web/src/components/ui/PresetModal.tsx`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/web/src/components/ui/PresetModal.tsx): Preset machine selector & mock camera scan trigger.
  - [`apps/web/src/components/ui/PortfolioModal.tsx`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/web/src/components/ui/PortfolioModal.tsx): 3D Science Exploration Badge Card modal with PDF & link sharing.

### 2. Backend & CAD Engine (`apps/api`)
- **FastAPI Engine**:
  - [`apps/api/app/main.py`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/api/app/main.py): FastAPI entry point with CORS middleware.
  - [`apps/api/app/api/v1/scan.py`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/api/app/api/v1/scan.py): Image upload VLM parsing endpoint returning JSON specs and GLB URLs.
  - [`apps/api/app/schemas/spec.py`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/api/app/schemas/spec.py): Pydantic schema for `VLMParsingResult` complying with `spec.md` Section 6.
  - [`apps/api/app/services/cad/generator.py`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/api/app/services/cad/generator.py): CadQuery parametric CAD generator incorporating $0.20\text{mm}$ tolerance and M3 bolt clearances.

### 3. Test Harness Subsystems (`harness/`)
- [`harness/vlm_evaluator/validate_schema.py`](file:///Users/Agent/ps-workspace/EduMechanic-3D/harness/vlm_evaluator/validate_schema.py): VLM response JSON schema validator.
- [`harness/cad_sandbox/run_cad_test.py`](file:///Users/Agent/ps-workspace/EduMechanic-3D/harness/cad_sandbox/run_cad_test.py): CadQuery execution sandbox and parametric script builder.

---

## 🧪 Validation Results

### 1. Frontend Build Verification
Ran Next.js production build (`npm run build`) in [`apps/web`](file:///Users/Agent/ps-workspace/EduMechanic-3D/apps/web):
```bash
  ▲ Next.js 14.2.3
   Creating an optimized production build ...
 ✓ Compiled successfully
 ✓ Generating static pages (4/4)
```
- Zero TypeScript compiler errors
- Zero linting or bundling errors

### 2. Backend Harness Verification
Ran Python test harness suite in `.venv`:
```bash
.venv/bin/python harness/vlm_evaluator/validate_schema.py
# Output: ✅ VLM Schema Validation Passed! Card ID: card_sharpener_001, Parts Count: 1

.venv/bin/python harness/cad_sandbox/run_cad_test.py
# Output: ✅ CadQuery Generator Harness Passed! Applied Tolerance: 0.2mm
```

---

## 🎯 Summary
The MVP application architecture for **EduMechanic 3D** is now established, compiled, and tested.
