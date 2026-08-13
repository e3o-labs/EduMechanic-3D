"""
Automated Test Harness for Phase 10 Teacher Analytics & AI Auto-Grading Evaluator.
"""

import os
import sys

# Add apps/api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../apps/api')))

from app.services.analytics.evaluator import analytics_evaluator

def test_teacher_analytics_dashboard_summary():
    summary = analytics_evaluator.get_dashboard_summary()
    assert summary["active_teams_count"] == 4
    assert summary["average_exploration_rate"] >= 70
    assert summary["total_pins_created"] > 0
    assert len(summary["teams"]) == 4
    print("✅ test_teacher_analytics_dashboard_summary PASSED")

def test_ai_student_evaluation_generation():
    res = analytics_evaluator.generate_student_evaluation(
        student_name="김민준",
        team_name="1모둠 (알파팀)",
        topic="수동 연필깎이 직각 베벨 기어 메커니즘",
        exploration_rate=95,
        pins_count=12,
        quiz_accuracy=100
    )
    assert res["student_name"] == "김민준"
    assert "베벨 기어" in res["recommended_eval_text"] or "탐구" in res["recommended_eval_text"]
    assert len(res["ai_competency_tags"]) >= 4
    print("✅ test_ai_student_evaluation_generation PASSED")

if __name__ == "__main__":
    test_teacher_analytics_dashboard_summary()
    test_ai_student_evaluation_generation()
    print("🎉 ALL PHASE 10 ANALYTICS EVALUATOR HARNESS TESTS PASSED!")
