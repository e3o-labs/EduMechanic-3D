"""
Teacher Analytics & AI Auto-Grading Evaluation Engine for EduMechanic 3D.
Calculates team-level exploration metrics and generates AI-recommended student behavioral records (생기부 세특).
"""

from typing import List, Dict, Any

class TeacherAnalyticsService:
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """
        Calculates and returns real-time class & team 3D exploration stats.
        """
        teams = [
            {
                "team_id": "team_1",
                "team_name": "1모둠 (알파팀)",
                "topic": "수동 연필깎이 직각 베벨 기어 메커니즘",
                "members_count": 4,
                "exploration_rate": 95,
                "pins_count": 12,
                "quiz_accuracy": 100,
                "active_duration_min": 45,
                "status": "최우수 완료"
            },
            {
                "team_id": "team_2",
                "team_name": "2모둠 (베타팀)",
                "topic": "태엽 오르골 가버너 속도 제어 시스템",
                "members_count": 3,
                "exploration_rate": 82,
                "pins_count": 8,
                "quiz_accuracy": 85,
                "active_duration_min": 38,
                "status": "진행 중"
            },
            {
                "team_id": "team_3",
                "team_name": "3모둠 (감마팀)",
                "topic": "자전거 변속 유성 기어 감속비 연산",
                "members_count": 4,
                "exploration_rate": 70,
                "pins_count": 6,
                "quiz_accuracy": 75,
                "active_duration_min": 30,
                "status": "진행 중"
            },
            {
                "team_id": "team_4",
                "team_name": "4모둠 (델타팀)",
                "topic": "4절 링크 피스톤 수직 운동 변환",
                "members_count": 3,
                "exploration_rate": 88,
                "pins_count": 10,
                "quiz_accuracy": 90,
                "active_duration_min": 40,
                "status": "완료"
            }
        ]

        total_exploration = sum(t["exploration_rate"] for t in teams) // len(teams)
        avg_quiz_acc = sum(t["quiz_accuracy"] for t in teams) // len(teams)
        total_pins = sum(t["pins_count"] for t in teams)

        return {
            "class_name": "3학년 2반 과학 3D 공학 실습",
            "active_teams_count": len(teams),
            "average_exploration_rate": total_exploration,
            "average_quiz_accuracy": avg_quiz_acc,
            "total_pins_created": total_pins,
            "teams": teams
        }

    def generate_student_evaluation(
        self,
        student_name: str,
        team_name: str,
        topic: str,
        exploration_rate: int,
        pins_count: int,
        quiz_accuracy: int
    ) -> Dict[str, Any]:
        """
        Generates AI-recommended student behavioral record text (생기부 세특 문구)
        based on student activity metrics.
        """
        eval_sentences = []

        # 1. 3D Exploration & Engagement Assessment
        if exploration_rate >= 90:
            eval_sentences.append(
                f"'{topic}' 탐구 활동에서 3D 부품 분해도 및 X-Ray 모델을 {exploration_rate}% 이상 입체적으로 조작하며 기계의 동력 전달 및 회전 운동 원리를 완벽하게 구명함."
            )
        elif exploration_rate >= 75:
            eval_sentences.append(
                f"'{topic}' 3D 캔버스 실습을 통해 부품간 상호작용과 기어비 감속 원리를 적극적으로 시각화하여 관찰함."
            )
        else:
            eval_sentences.append(
                f"'{topic}' 3D 시뮬레이션을 활용하여 기계 부품의 분해 및 구동 과정을 차근차근 모니터링하며 기본 개념을 습득함."
            )

        # 2. Collaborative Inquiry & Pin Memo Assessment
        if pins_count >= 10:
            eval_sentences.append(
                f"{team_name}의 탐구 리더로서 부품 돋보기 기능과 3D 좌표 핀 메모({pins_count}개 작성)를 자유자재로 활용해 모둠원들에게 창의적인 공학적 질문을 제기하고 협동 학습을 주도함."
            )
        elif pins_count >= 5:
            eval_sentences.append(
                f"모둠 탐구 시 부품 표면에 3D 메모 핀({pins_count}개)을 공유하며 회전축 방향 변환 및 마찰력 저감에 대해 지적 호기심을 유발하고 토론에 참여함."
            )
        else:
            eval_sentences.append(
                f"3D 핀 작성 기능을 통해 부품 명칭과 기능을 기록하며 모둠원들과 탐구 내용을 공유함."
            )

        # 3. Quiz & STEM Competency Assessment
        if quiz_accuracy >= 90:
            eval_sentences.append(
                f"하브루타 AI 퀴즈 평가에서 {quiz_accuracy}%의 우수한 정답률을 기록하며, 기계 메커니즘의 수학적 비율과 토크 전달 관계를 정확히 논리적으로 설명하는 출중한 STEM 통합 공학 역량을 보임."
            )
        elif quiz_accuracy >= 75:
            eval_sentences.append(
                f"AI 퀴즈 풀이({quiz_accuracy}%)를 통하여 핵심 물리 법칙과 기어비 수식 관계를 성실히 이해하고 응용함."
            )
        else:
            eval_sentences.append(
                f"기본 피드백 퀴즈를 수행하며 기계 구동 개념에 대한 피드백을 수용하고 이해도를 높임."
            )

        full_evaluation_text = " ".join(eval_sentences)

        return {
            "student_name": student_name,
            "team_name": team_name,
            "topic": topic,
            "metrics": {
                "exploration_rate": exploration_rate,
                "pins_count": pins_count,
                "quiz_accuracy": quiz_accuracy
            },
            "recommended_eval_text": full_evaluation_text,
            "ai_competency_tags": ["STEM 공학 탐구력", "3D 공간지각력", "협동적 질문 제기", "논리적 퀴즈 해결"]
        }

analytics_evaluator = TeacherAnalyticsService()
