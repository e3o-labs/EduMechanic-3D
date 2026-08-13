'use client';

import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { dictionary } from '../../locales/dictionary';
import {
  X,
  BarChart3,
  Users,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  Award,
  BookOpen,
  Pin,
  Flame,
} from 'lucide-react';

interface StudentMetric {
  id: string;
  name: string;
  group: string;
  card_title: string;
  explode_rate: number;
  pins_count: number;
  quiz_score: number;
  grade: string;
  submitted: boolean;
}

const MOCK_STUDENTS: StudentMetric[] = [
  {
    id: 'std_01',
    name: '김민준',
    group: '모둠 1',
    card_title: '수동 연필깎이 베벨 기어 메커니즘',
    explode_rate: 92,
    pins_count: 5,
    quiz_score: 100,
    grade: 'A+',
    submitted: true,
  },
  {
    id: 'std_02',
    name: '이서연',
    group: '모둠 1',
    card_title: '태엽 오르골 가버너 메커니즘',
    explode_rate: 88,
    pins_count: 4,
    quiz_score: 90,
    grade: 'A',
    submitted: true,
  },
  {
    id: 'std_03',
    name: '박지후',
    group: '모둠 2',
    card_title: '자전거 유성기어 변속기',
    explode_rate: 75,
    pins_count: 3,
    quiz_score: 80,
    grade: 'B+',
    submitted: true,
  },
  {
    id: 'std_04',
    name: '최유진',
    group: '모둠 2',
    card_title: '수동 연필깎이 베벨 기어 메커니즘',
    explode_rate: 95,
    pins_count: 6,
    quiz_score: 100,
    grade: 'A+',
    submitted: true,
  },
  {
    id: 'std_05',
    name: '정현우',
    group: '모둠 3',
    card_title: '태엽 오르골 가버너 메커니즘',
    explode_rate: 60,
    pins_count: 2,
    quiz_score: 70,
    grade: 'B',
    submitted: false,
  },
];

export function TeacherDashboardModal() {
  const isTeacherModalOpen = useStore((s) => s.isTeacherModalOpen);
  const setTeacherModalOpen = useStore((s) => s.setTeacherModalOpen);
  const locale = useStore((s) => s.locale);
  const t = dictionary[locale];

  const [selectedStudent, setSelectedStudent] = useState<StudentMetric>(MOCK_STUDENTS[0]);
  const [competencyReport, setCompetencyReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isTeacherModalOpen) return null;

  const handleGenerateCompetency = (student: StudentMetric) => {
    setSelectedStudent(student);
    setIsGenerating(true);
    setIsCopied(false);

    setTimeout(() => {
      let report = '';
      if (locale === 'en') {
        report = `[${student.name}] Demonstrated exceptional mechanical reasoning in 3D exploration of '${student.card_title}'. Achieved ${student.explode_rate}% part explosion breakdown rate, dropped ${student.pins_count} detailed question pins on bevel gear force transmission axes, and scored ${student.quiz_score}% on the AI STEM quiz, exhibiting outstanding engineering analytical skills.`;
      } else if (locale === 'ja') {
        report = `[${student.name}] 『${student.card_title}』の3D分解探究において優れた機械工学的思考力を発揮。部品分解探究率${student.explode_rate}%を達成し、ベベルギアの力伝達軸に${student.pins_count}個の質問ピンを設置して深く考察し、AI STEMクイズで${student.quiz_score}点を獲得して高い問題解決能力を示した。`;
      } else {
        report = `[${student.name}] '${student.card_title}' 3D 메커니즘 탐구 활동에서 ${student.explode_rate}%의 높은 부품 분해 탐구율을 기록함. 베벨 기어의 회전력 90도 직각 전달 축 및 주 부품에 ${student.pins_count}개의 3D 질문 핀을 찌르고 입체적인 작동 원리를 깊이 탐구하였으며, AI STEM 하브루타 퀴즈에서 ${student.quiz_score}점을 기록하여 역학적 공학 원리에 대한 우수한 지적 탐구열과 문제 해결 능력을 입증함.`;
      }
      setCompetencyReport(report);
      setIsGenerating(false);
    }, 600);
  };

  const handleCopyClipboard = () => {
    if (!competencyReport) return;
    navigator.clipboard.writeText(competencyReport);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xl shadow-inner">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                {t.teacher_dashboard_title}
              </h2>
              <p className="text-xs text-sky-100 font-medium">
                {t.teacher_dashboard_subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => setTeacherModalOpen(false)}
            className="w-9 h-9 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Top 4 Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">{t.avg_explode_rate}</p>
                <p className="text-lg font-black text-slate-800">82.0%</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <Pin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">{t.total_pins}</p>
                <p className="text-lg font-black text-slate-800">20개</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">{t.quiz_avg}</p>
                <p className="text-lg font-black text-slate-800">88.0점</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">{t.submission_rate}</p>
                <p className="text-lg font-black text-slate-800">80.0%</p>
              </div>
            </div>
          </div>

          {/* Student Progress & Metrics Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-500" />
                {t.student_progress_title}
              </h3>
              <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                5학년 2반 실과/과학과
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">{t.student_name}</th>
                    <th className="py-2.5 px-3">{t.group_name}</th>
                    <th className="py-2.5 px-3">{t.card_title}</th>
                    <th className="py-2.5 px-3">{t.explode_progress}</th>
                    <th className="py-2.5 px-3">{t.total_pins}</th>
                    <th className="py-2.5 px-3">{t.quiz_score}</th>
                    <th className="py-2.5 px-3">{t.grade_badge}</th>
                    <th className="py-2.5 px-3 text-right">AI 세특</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_STUDENTS.map((std) => (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-extrabold text-slate-800">{std.name}</td>
                      <td className="py-3 px-3 font-semibold text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[10px]">
                          {std.group}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700 max-w-[180px] truncate">
                        {std.card_title}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className="bg-gradient-to-r from-sky-400 to-emerald-400 h-full rounded-full"
                              style={{ width: `${std.explode_rate}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-700">
                            {std.explode_rate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-sky-600">
                        📍 {std.pins_count}개
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-emerald-600">
                        {std.quiz_score}점
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-md">
                          {std.grade}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleGenerateCompetency(std)}
                          className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-xl shadow-sm transition-all active:scale-95 inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          {t.generate_competency_btn}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Competency Generator Box */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-lg border border-indigo-900 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <h3 className="font-extrabold text-sm tracking-tight text-white">
                  {t.competency_box_title} ({selectedStudent.name})
                </h3>
              </div>
              {competencyReport && (
                <button
                  onClick={handleCopyClipboard}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t.copy_clipboard}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {isGenerating ? (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center gap-2 text-sky-200 text-xs font-semibold">
                <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                AI가 {selectedStudent.name} 학생의 3D 탐구 이력을 분석하여 생기부 세특 문구를 작성 중입니다...
              </div>
            ) : competencyReport ? (
              <div className="p-4 bg-white/10 rounded-2xl border border-white/15 text-xs sm:text-sm leading-relaxed text-slate-100 font-medium">
                {competencyReport}
              </div>
            ) : (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-400 text-center font-medium">
                위 테이블에서 학생의 [{t.generate_competency_btn}] 버튼을 클릭하면 AI 생기부 세특 문구가 자동으로 생성됩니다.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={() => setTeacherModalOpen(false)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-5 py-2 rounded-xl transition-all active:scale-95"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
