"""
Teacher Analytics & AI Auto-Grading Engine for EduMechanic 3D
Calculates classroom/group 3D exploration metrics, performs automated student grading,
and generates AI-assisted Student Competency Reports (생기부 세특 자동 추천) for K-12 STEM education.
"""

from typing import Dict, Any, List
import random

class TeacherAnalyticsService:
    def __init__(self):
        self._students = [
            {
                "id": "std_01",
                "name": "김민준",
                "group": "모둠 1",
                "card_title": "수동 연필깎이 베벨 기어 메커니즘",
                "explode_rate": 92,
                "pins_count": 5,
                "quiz_score": 100,
                "grade": "A+",
                "submitted": True
            },
            {
                "id": "std_02",
                "name": "이서연",
                "group": "모둠 1",
                "card_title": "태엽 오르골 가버너 메커니즘",
                "explode_rate": 88,
                "pins_count": 4,
                "quiz_score": 90,
                "grade": "A",
                "submitted": True
            },
            {
                "id": "std_03",
                "name": "박지후",
                "group": "모둠 2",
                "card_title": "자전거 유성기어 변속기",
                "explode_rate": 75,
                "pins_count": 3,
                "quiz_score": 80,
                "grade": "B+",
                "submitted": True
            },
            {
                "id": "std_04",
                "name": "최유진",
                "group": "모둠 2",
                "card_title": "수동 연필깎이 베벨 기어 메커니즘",
                "explode_rate": 95,
                "pins_count": 6,
                "quiz_score": 100,
                "grade": "A+",
                "submitted": True
            },
            {
                "id": "std_05",
                "name": "정현우",
                "group": "모둠 3",
                "card_title": "태엽 오르골 가버너 메커니즘",
                "explode_rate": 60,
                "pins_count": 2,
                "quiz_score": 70,
                "grade": "B",
                "submitted": False
            }
        ]

    def get_dashboard_summary(self) -> Dict[str, Any]:
        total_students = len(self._students)
        submitted_count = sum(1 for s in self._students if s["submitted"])
        avg_explode_rate = round(sum(s["explode_rate"] for s in self._students) / total_students, 1)
        total_pins = sum(s["pins_count"] for s in self._students)
        avg_quiz_score = round(sum(s["quiz_score"] for s in self._students) / total_students, 1)
        submission_rate = round((submitted_count / total_students) * 100, 1)

        return {
            "classroom_name": "5학년 2반 실과/과학과",
            "assignment_title": "생활 속 기계 메커니즘 3D 역설계 및 탐구",
            "summary_stats": {
                "total_students": total_students,
                "submitted_count": submitted_count,
                "submission_rate": submission_rate,
                "avg_explode_rate": avg_explode_rate,
                "total_question_pins": total_pins,
                "avg_quiz_score": avg_quiz_score,
            },
            "students": self._students
        }

    def generate_competency_report(
        self,
        student_name: str,
        card_title: str = "수동 연필깎이 베벨 기어 메커니즘",
        explode_rate: int = 92,
        quiz_score: int = 100,
        pins_count: int = 5,
        lang: str = "ko"
    ) -> Dict[str, Any]:
        """
        Generates AI Student Competency Evaluation Report (생기부 세특 자동 추천)
        tailored to student's 3D exploration data and mechanical concepts.
        """
        if lang == "en":
            report_text = (
                f"[{student_name}] Demonstrated exceptional mechanical reasoning in 3D exploration of '{card_title}'. "
                f"Achieved {explode_rate}% part explosion breakdown rate, dropped {pins_count} detailed question pins on bevel gear "
                f"force transmission axes, and scored {quiz_score}% on the AI STEM quiz, exhibiting outstanding engineering analytical skills."
            )
        elif lang == "ja":
            report_text = (
                f"[{student_name}] 『{card_title}』の3D分解探究において優れた機械工学的思考力を 발휘함. "
                f"部品分解探究率{explode_rate}%を達成し、ベベルギアの力伝達軸に{pins_count}個の質問ピンを設置して深く考察し、"
                f"AI STEMクイズで{quiz_score}点を獲得して高い問題解決能力を示した。"
            )
        else:
            report_text = (
                f"[{student_name}] '{card_title}' 3D 메커니즘 탐구 활동에서 {explode_rate}%의 높은 부품 분해 탐구율을 기록함. "
                f"베벨 기어의 회전력 90도 직각 전달 축 및 주 부품에 {pins_count}개의 3D 질문 핀을 찌르고 입체적인 작동 원리를 깊이 탐구하였으며, "
                f"AI STEM 하브루타 퀴즈에서 {quiz_score}점을 기록하여 역학적 공학 원리에 대한 우수한 지적 탐구열과 문제 해결 능력을 입증함."
            )

        return {
            "student_name": student_name,
            "card_title": card_title,
            "competency_report": report_text,
            "recommended_tags": ["#STEM공학", "#3D역설계", "#베벨기어원리", "#하브루타퀴즈만점"],
            "achievement_level": "수우(Top 5%)" if quiz_score >= 90 else "우수(Top 20%)"
        }

    def auto_grade_submission(
        self,
        student_name: str,
        quiz_score: int,
        explode_rate: int,
        pins_count: int
    ) -> Dict[str, Any]:
        """
        Computes composite STEM performance score and grade.
        Formula: Score = (Quiz * 0.5) + (ExplodeRate * 0.3) + (min(Pins * 10, 20) * 0.2)
        """
        composite_score = round((quiz_score * 0.5) + (explode_rate * 0.3) + (min(pins_count * 5, 20)), 1)
        if composite_score >= 90:
            grade = "A+"
        elif composite_score >= 80:
            grade = "A"
        elif composite_score >= 70:
            grade = "B+"
        else:
            grade = "B"

        return {
            "student_name": student_name,
            "quiz_score": quiz_score,
            "explode_rate": explode_rate,
            "pins_count": pins_count,
            "composite_score": composite_score,
            "assigned_grade": grade,
            "status": "graded"
        }

analytics_service = TeacherAnalyticsService()
