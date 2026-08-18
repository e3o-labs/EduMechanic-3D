'use client';

import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import {
  X,
  Download,
  Link as LinkIcon,
  CheckCircle2,
  QrCode,
  Save,
  FolderOpen,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Loader2,
} from 'lucide-react';

export function PortfolioModal() {
  const isOpen = useStore((s) => s.isPortfolioModalOpen);
  const setOpen = useStore((s) => s.setPortfolioModalOpen);
  const activePreset = useStore((s) => s.activePreset);
  const remixCount = useStore((s) => s.remixCount);
  const currentUser = useStore((s) => s.currentUser);
  const savedCards = useStore((s) => s.savedCards);
  const saveCurrentCard = useStore((s) => s.saveCurrentCard);
  const loadSavedCard = useStore((s) => s.loadSavedCard);
  const pins = useStore((s) => s.pins);

  const [tab, setTab] = useState<'current' | 'history'>('current');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoadingCard, setIsLoadingCard] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveCard = async () => {
    setIsSaving(true);
    const cardId = await saveCurrentCard();
    setIsSaving(false);
    if (cardId) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleLoadCard = async (id: string) => {
    setIsLoadingCard(id);
    await loadSavedCard(id);
    setIsLoadingCard(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 opacity-100 transition-opacity">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-5 space-y-4 relative shadow-2xl text-slate-800 animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('current')}
              className={`text-xs font-black px-3 py-1.5 rounded-xl transition-all ${
                tab === 'current'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              🏆 탐구 배지 카드
            </button>
            <button
              onClick={() => setTab('history')}
              className={`text-xs font-black px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                tab === 'history'
                  ? 'bg-sky-100 text-sky-900 border border-sky-300 shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>저장소 ({savedCards.length})</span>
            </button>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 1: Current Badge Card */}
        {tab === 'current' && (
          <div className="space-y-3 overflow-y-auto pr-0.5">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-800">{activePreset.title}</h3>
              <p className="text-[11px] text-slate-500 font-bold">
                탐구자: {currentUser.name} ({currentUser.team_name})
              </p>
            </div>

            <div className="bg-gradient-to-b from-sky-50 to-emerald-50 border-2 border-sky-100 rounded-2xl p-4 space-y-3 text-xs shadow-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-sky-200/60 pb-2 font-medium">
                <span>날짜: 2026.08.18</span>
                <span className="text-sky-600 font-black">담기 {remixCount}회 연계</span>
              </div>

              <div className="space-y-1 text-[11px]">
                <p className="text-slate-800 font-bold">💡 내가 찾아낸 과학 비밀:</p>
                <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-sky-100 font-medium">
                  {activePreset.principles[0]?.desc || '돌아가는 방향을 90도 직각으로 바꿔주는 베벨 기어 시스템'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-black">
                  <CheckCircle2 className="w-3.5 h-3.5" /> AI 분석 & 3D 질문 핀 {pins.length}개 완료
                </div>
                <div className="w-9 h-9 bg-white p-1 rounded-xl border border-slate-200 flex items-center justify-center shadow-2xs">
                  <QrCode className="w-6 h-6 text-slate-800" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleSaveCard}
                disabled={isSaving}
                className={`w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-200'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> 내 포트폴리오에 저장 완료!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> 나만의 3D 탐구 카드 DB 저장하기
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                    window.open(`${backendUrl}/api/v1/cards/${activePreset.id}/pdf`, '_blank');
                  }}
                  className="flex-1 bg-emerald-500 active:bg-emerald-600 text-white text-xs font-black py-2.5 rounded-2xl flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" /> PDF 저장
                </button>
                <button
                  onClick={() => alert('링크가 클립보드에 복사되었습니다. 선생님이나 친구들에게 공유하세요!')}
                  className="flex-1 bg-sky-500 active:bg-sky-600 text-white text-xs font-black py-2.5 rounded-2xl flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95"
                >
                  <LinkIcon className="w-3.5 h-3.5" /> 링크 공유
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Saved Cards History */}
        {tab === 'history' && (
          <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-0.5">
            {savedCards.length === 0 ? (
              <div className="text-center py-8 space-y-2 text-slate-400">
                <FolderOpen className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold">아직 저장된 3D 탐구 카드가 없어요.</p>
                <p className="text-[11px]">배지 탭에서 'DB 저장하기'를 눌러 보관해 보세요!</p>
              </div>
            ) : (
              savedCards.map((card) => (
                <div
                  key={card.id}
                  className="border border-slate-200 rounded-2xl p-3 bg-slate-50/70 hover:bg-sky-50/50 hover:border-sky-300 transition-all flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0 overflow-hidden shadow-2xs">
                      {card.thumb_url ? (
                        <img src={card.thumb_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        '⚙️'
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-800 truncate">{card.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {card.created_at}
                        </span>
                        <span className="flex items-center gap-0.5 text-sky-600 font-bold">
                          <MapPin className="w-2.5 h-2.5" /> 핀 {card.pins_count}개
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLoadCard(card.id)}
                    disabled={isLoadingCard === card.id}
                    className="bg-white hover:bg-sky-500 hover:text-white text-sky-700 border border-sky-200 text-xs font-black px-2.5 py-1.5 rounded-xl shrink-0 flex items-center gap-1 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoadingCard === card.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>불러오기</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
