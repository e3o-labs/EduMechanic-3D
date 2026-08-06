"""
Benchmark Evaluator Harness for EduMechanic 3D Phase 2
Evaluates VLM perception, CadQuery GLB converter, and Cache-First data reuse token savings.
"""
import sys
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "apps" / "api"))
from app.services.vlm.agent import VisionPerceptionAgent
from app.services.rag.cache_engine import DataReuseCacheEngine
from app.services.cad.converter import CadQuery3DConverter

async def run_phase2_benchmark():
    print("🚀 [Phase 2 Benchmark] Starting 4-Step AI Pipeline & Data Reuse Evaluation...")

    vlm_agent = VisionPerceptionAgent()
    cache_engine = DataReuseCacheEngine()
    cad_converter = CadQuery3DConverter()

    sample_img = b"FAKE_MECHANICAL_IMAGE_BINARY_DATA_SHARPENER_001"

    # Test 1: First Upload (Cache Miss, VLM Run)
    print("\n--- Test 1: Initial Upload (Cache Miss) ---")
    res1 = cache_engine.get_cached_result(sample_img)
    assert res1 is None, "Cache should be empty initially"

    parsed_result = await vlm_agent.analyze_machine_image(sample_img, "sharpener.jpg")
    assert parsed_result.components[0].part_id == "part_housing"
    print(f"✅ Step 1 & 3 Passed: VLM parsed {len(parsed_result.components)} components.")

    # Step 4 CAD Converter Test
    for comp in parsed_result.components:
        cad_res = cad_converter.generate_and_convert(comp)
        assert cad_res["status"] == "success"
        print(f"✅ Step 4 Passed: Component {comp.name} CAD script generated & mesh calculated ({cad_res['mesh_faces']} faces).")

    cache_engine.store_result(sample_img, parsed_result)

    # Test 2: Second Upload (Cache Hit, Zero LLM Token Cost)
    print("\n--- Test 2: Repeated Upload (Cache Hit - Zero Token Cost) ---")
    res2 = cache_engine.get_cached_result(sample_img)
    assert res2 is not None, "Cache should hit on repeated image upload"
    assert res2.card_id == parsed_result.card_id
    print(f"✅ Cache Hit Verified! Instant 3D Exploration Card served without LLM token cost.")

    stats = cache_engine.get_stats()
    print(f"\n📊 Benchmark Stats: {stats}")
    print("🎉 Phase 2 Benchmark Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(run_phase2_benchmark())
