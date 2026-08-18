"""
Test Suite for Multi-Modal VLM Providers, Self-Healing JSON Parser, and Live Voice Tutor
"""
import sys
import os
import json
import asyncio

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../apps/api")))

from app.core.config import Settings
from app.services.vlm.vlm_providers import (
    MockVLMProvider,
    GeminiVLMProvider,
    OpenAIVLMProvider,
    AnthropicVLMProvider,
)
from app.services.vlm.agent import VisionPerceptionAgent, STEM_REVERSE_ENGINEERING_SYSTEM_PROMPT
from app.services.vlm.voice_tutor import VoiceTutorAgent

def test_provider_resolution():
    print("\n--- Test 1: Provider Settings Resolution ---")
    s1 = Settings(VLM_PROVIDER="auto", GEMINI_API_KEY="test_gemini")
    assert s1.get_active_provider() == "gemini", f"Expected gemini, got {s1.get_active_provider()}"

    s2 = Settings(VLM_PROVIDER="auto", OPENAI_API_KEY="test_openai")
    assert s2.get_active_provider() == "openai", f"Expected openai, got {s2.get_active_provider()}"

    s3 = Settings(VLM_PROVIDER="auto", ANTHROPIC_API_KEY="test_claude")
    assert s3.get_active_provider() == "anthropic", f"Expected anthropic, got {s3.get_active_provider()}"

    s4 = Settings(VLM_PROVIDER="auto")
    assert s4.get_active_provider() == "mock", f"Expected mock, got {s4.get_active_provider()}"

    print("✅ Provider resolution test passed!")


def test_self_healing_json():
    print("\n--- Test 2: Self-Healing JSON Parsing ---")
    agent = VisionPerceptionAgent(provider=MockVLMProvider())

    # Case A: Markdown code fence ```json ... ```
    dirty_json_1 = """
    Here is your mechanical reverse-engineering JSON:
    ```json
    {
      "card_id": "card_test_01",
      "title": "기어 테스트",
      "category": "K-12 STEM",
      "ai_summary": "테스트 요약",
      "global_tolerance": 0.20,
      "components": [],
      "quiz": {"question": "q", "options": ["a", "b"], "correct_index": 0, "explanation": "exp"}
    }
    ```
    I hope this helps!
    """
    cleaned_1 = agent.clean_and_repair_json(dirty_json_1)
    assert cleaned_1["card_id"] == "card_test_01"
    assert cleaned_1["title"] == "기어 테스트"

    # Case B: Trailing comma in JSON
    dirty_json_2 = """
    {
      "card_id": "card_test_02",
      "title": "트레일링 콤마 테스트",
      "category": "K-12 STEM",
      "ai_summary": "요약",
      "global_tolerance": 0.20,
      "components": [
        {"name": "기어1",}
      ],
      "quiz": {"question": "q", "options": ["a"], "correct_index": 0, "explanation": "exp",}
    }
    """
    cleaned_2 = agent.clean_and_repair_json(dirty_json_2)
    assert cleaned_2["card_id"] == "card_test_02"
    assert len(cleaned_2["components"]) == 1

    print("✅ Self-healing JSON parsing test passed!")


async def test_vlm_agent_analysis():
    print("\n--- Test 3: VLM Agent Multi-Modal Analysis ---")
    agent = VisionPerceptionAgent(provider=MockVLMProvider())

    sample_img_bytes = b"fake_png_header_and_data_for_testing"
    result = await agent.analyze_machine_image(sample_img_bytes, "pencil_sharpener.png")

    assert result.card_id is not None
    assert len(result.components) >= 2
    assert result.quiz is not None
    assert 0 <= result.quiz.correct_index < len(result.quiz.options)
    print(f"✅ VLM Agent Analysis Passed! Card: {result.title}, Components: {len(result.components)}, Quiz: {result.quiz.question}")


async def test_voice_tutor_agent():
    print("\n--- Test 4: Voice Habrutha Tutor Mechamong ---")
    tutor = VoiceTutorAgent(provider=MockVLMProvider())

    # Query 1: Explode inquiry
    res1 = await tutor.answer_voice_query("부품을 분해해서 내부를 보고 싶어요", "수동 연필깎이")
    assert res1["tutor_name"] == "메카몽"
    assert res1["action_trigger"]["type"] == "set_explode"
    assert res1["action_trigger"]["value"] == 75

    # Query 2: Rotation inquiry
    res2 = await tutor.answer_voice_query("기어가 어떻게 회전하나요?", "수동 연필깎이")
    assert res2["action_trigger"]["type"] == "toggle_simulate"

    # Query 3: General inquiry
    res3 = await tutor.answer_voice_query("전체 구조가 궁금해", "수동 연필깎이")
    assert "action_trigger" in res3

    print(f"✅ Voice Tutor Agent Test Passed! (Sample Response: {res1['answer_text'][:30]}...)")


async def main():
    print("🚀 Starting Track 1: Multi-Modal VLM & Live Voice Tutor Test Suite...")
    test_provider_resolution()
    test_self_healing_json()
    await test_vlm_agent_analysis()
    await test_voice_tutor_agent()
    print("\n🎉 All Track 1 VLM Live Tests Passed Successfully!")

if __name__ == "__main__":
    asyncio.run(main())
