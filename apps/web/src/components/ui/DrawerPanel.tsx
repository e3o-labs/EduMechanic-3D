'use client';

import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { DrawerTabType } from '../../types';
import { Search, MessageSquare, Puzzle, Trophy, Send, CheckCircle2 } from 'lucide-react';

export function DrawerPanel() {
  const activePreset = useStore((s) => s.activePreset);
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const selectedPartId = useStore((s) => s.selectedPartId);
  const setPortfolioModalOpen = useStore((s) => s.setPortfolioModalOpen);
  const addComment = useStore((s) => s.addComment);

  const [newComment, setNewComment] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showQuizFeedback, setShowQuizFeedback] = useState(false);

  const selectedPart = activePreset.parts.find((p) => p.id === selectedPartId) || activePreset.parts[1];

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment({
      author: '김민준',
      time: '방금 전',
      text: newComment,
      part: selectedPart.name,
    });
    setNewComment('');
  };

  const handleQuizSubmit = (idx: number) => {
    setSelectedOption(idx);
    setShowQuizFeedback(true);
  };

  return (
    <div className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col shrink-0 h-[48vh] md:h-full z-20 shadow-lg">
      {/* PANEL TAB HEADERS */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-2 py-2 shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tab-inspect')}
          className={`tab-btn text-[11px] font-black px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0 ${
            activeTab === 'tab-inspect'
              ? 'text-sky-700 bg-sky-100 border border-sky-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-3 h-3" /> 부품과 원리
        </button>

        <button
          onClick={() => setActiveTab('tab-team')}
          className={`tab-btn text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0 ${
            activeTab === 'tab-team'
              ? 'text-sky-700 bg-sky-100 border border-sky-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-3 h-3" /> 함께 탐구하기
          <span className="bg-sky-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
            {activePreset.comments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tab-quiz')}
          className={`tab-btn text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0 ${
            activeTab === 'tab-quiz'
              ? 'text-sky-700 bg-sky-100 border border-sky-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Puzzle className="w-3 h-3" /> AI 탐구 퀴즈
        </button>
      </div>

      {/* TAB CONTENT SCROLL CONTAINER */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
        {activeTab === 'tab-inspect' && (
          <div className="space-y-3">
            {/* AI Summary */}
            <div className="bg-white border-2 border-sky-100 rounded-3xl p-3.5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-sky-600 flex items-center gap-1">
                  🤖 AI 튜터 메카몽의 발견
                </span>
                <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-full border border-sky-100">
                  정확도 98.4%
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {activePreset.aiSummary}
              </p>
            </div>

            {/* STEM Principles */}
            <div className="bg-white border-2 border-emerald-100 rounded-3xl p-3.5 space-y-2 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                💡 기계 속 신기한 과학 원리
              </h3>
              <div className="space-y-2 text-xs">
                {activePreset.principles.map((item, idx) => (
                  <div key={idx} className="bg-emerald-50/60 p-2.5 rounded-2xl border border-emerald-100/80">
                    <span className="font-extrabold text-emerald-800 block text-[11px]">
                      {idx + 1}. {item.title}
                    </span>
                    <span className="text-slate-600 text-[11px] font-medium leading-tight block mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Part Inspector */}
            <div className="bg-gradient-to-br from-sky-50 to-emerald-50 border-2 border-sky-200 rounded-3xl p-3.5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-sky-800 flex items-center gap-1">
                  🔍 부품 돋보기 보기
                </h4>
                <span className="text-[9px] bg-sky-200 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                  회전 메커니즘
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded-2xl border border-sky-100 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">부품 이름</span>
                  <span className="font-extrabold text-slate-800">{selectedPart.name}</span>
                </div>
                <div className="bg-white p-2 rounded-2xl border border-sky-100 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">하는 일</span>
                  <span className="font-extrabold text-emerald-600">{selectedPart.function}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-normal bg-white/80 p-2.5 rounded-2xl border border-sky-100 font-medium">
                {selectedPart.desc}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'tab-team' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                💬 5학년 2반 모둠 B 실시간 대화
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                4명 참여 중
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {activePreset.comments.map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-700">{item.author}</span>
                    <span className="text-slate-400">{item.time}</span>
                  </div>
                  <p className="text-slate-800 font-medium text-[11px]">{item.text}</p>
                  {item.part && (
                    <span className="inline-block text-[9px] bg-sky-50 text-sky-600 font-bold px-2 py-0.5 rounded-full border border-sky-100">
                      📍 {item.part}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleCommentSubmit} className="pt-2 border-t border-slate-200 flex gap-1.5">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="3D 부품에 궁금한 점을 질문해보세요..."
                className="flex-1 bg-white border border-slate-300 text-xs text-slate-800 rounded-2xl px-3 py-2.5 focus:outline-none focus:border-sky-500 shadow-2xs"
              />
              <button
                type="submit"
                className="bg-sky-500 active:bg-sky-600 text-white text-xs px-3.5 py-2.5 rounded-2xl font-black shadow-sm transition-all active:scale-95 flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>등록</span>
              </button>
            </form>
          </div>
        )}

        {activeTab === 'tab-quiz' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-3.5 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-800 flex items-center gap-1">
                  🧩 AI 수수께끼 탐구 퀴즈
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                  난이도: ★☆☆
                </span>
              </div>

              <p className="text-xs font-bold text-slate-800 leading-snug">
                "{activePreset.quiz.q}"
              </p>

              <div className="space-y-1.5">
                {activePreset.quiz.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuizSubmit(idx)}
                    className={`w-full text-left text-xs p-2.5 rounded-2xl font-bold transition-colors border ${
                      selectedOption === idx
                        ? idx === activePreset.quiz.correct
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-rose-500 text-white border-rose-600'
                        : 'bg-white hover:bg-amber-100/50 text-slate-700 border-amber-100'
                    }`}
                  >
                    {idx + 1}. {opt}
                  </button>
                ))}
              </div>

              {showQuizFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs leading-normal font-bold ${
                    selectedOption === activePreset.quiz.correct
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {selectedOption === activePreset.quiz.correct
                    ? '🎉 정답이에요! ' + activePreset.quiz.explanation
                    : '😅 다시 한 번 생각해 볼까요? ' + activePreset.quiz.explanation}
                </div>
              )}
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-3xl p-3.5 space-y-2 shadow-sm">
              <h4 className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span>🏆 나만의 3D 과학 탐구 카드</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  완성됨
                </span>
              </h4>
              <p className="text-[11px] text-slate-600 font-medium">
                오늘 탐구한 3D 기계와 질문 메모가 모아져 학교 제출용 탐구 배지 카드로 모였어요.
              </p>
              <button
                onClick={() => setPortfolioModalOpen(true)}
                className="w-full bg-emerald-500 active:bg-emerald-600 text-white text-xs font-black py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Trophy className="w-3.5 h-3.5" /> 탐구 배지 카드 확인 & 제출
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
