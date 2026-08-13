"""
Automated Test Harness for Phase 10: Teacher Analytics Dashboard & Auto-Grading Engine
Verifies analytics dashboard endpoint logic, AI competency generator, and automated grading calculations.
"""

import sys
import os

# Add apps/api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../apps/api")))

from app.services.analytics.grading_engine import TeacherAnalyticsService

def test_analytics_dashboard_summary():
    service = TeacherAnalyticsService()
    data = service.get_dashboard_summary()
    assert "summary_stats" in data
    assert data["summary_stats"]["total_students"] == 5
    assert data["summary_stats"]["submission_rate"] == 80.0
    print("✅ [PASS] test_analytics_dashboard_summary passed!")

def test_competency_report_generation():
    service = TeacherAnalyticsService()
    report_ko = service.generate_competency_report(
        student_name="김민준",
        card_title="수동 연필깎이 베벨 기어 메커니즘",
        explode_rate=92,
        quiz_score=100,
        pins_count=5,
        lang="ko"
    )
    assert report_ko["student_name"] == "김민준"
    assert "92%" in report_ko["competency_report"]
    assert "100점" in report_ko["competency_report"]
    print("✅ [PASS] test_competency_report_generation passed!")

def test_auto_grading_engine():
    service = TeacherAnalyticsService()
    graded = service.auto_grade_submission(
        student_name="김민준",
        quiz_score=100,
        explode_rate=92,
        pins_count=5
    )
    assert graded["assigned_grade"] == "A+"
    assert graded["composite_score"] >= 90.0
    print("✅ [PASS] test_auto_grading_engine passed!")

if __name__ == "__main__":
    print("🚀 Starting Phase 10 Teacher Analytics & Auto-Grading Test Harness...")
    test_analytics_dashboard_summary()
    test_competency_report_generation()
    test_auto_grading_engine()
    print("🎉 All Phase 10 Analytics Harness Tests Passed Successfully!")
