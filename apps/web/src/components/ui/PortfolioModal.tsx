'use client';

import React from 'react';
import { useStore } from '../../store/useStore';
import { X, Download, Link as LinkIcon, CheckCircle2, QrCode } from 'lucide-react';

export function PortfolioModal() {
  const isOpen = useStore((s) => s.isPortfolioModalOpen);
  const setOpen = useStore((s) => s.setPortfolioModalOpen);
  const activePreset = useStore((s) => s.activePreset);
  const remixCount = useStore((s) => s.remixCount);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 opacity-100 transition-opacity">
      <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 space-y-4 relative shadow-2xl text-slate-800 animate-scale-up">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 w-7 h-7 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1 pt-1">
          <div className="inline-block bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black px-3 py-1 rounded-full shadow-2xs">
            🏆 3D 과학 탐구 배지 카드
          </div>
          <h3 className="text-base font-black text-slate-800">{activePreset.title}</h3>
          <p className="text-[11px] text-slate-500 font-bold">탐구자: 5학년 2반 김민준 (모둠 B)</p>
        </div>

        <div className="bg-gradient-to-b from-sky-50 to-emerald-50 border-2 border-sky-100 rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-sky-200/60 pb-2 font-medium">
            <span>날짜: 2026.08.06</span>
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
              <CheckCircle2 className="w-3.5 h-3.5" /> AI 분석 & 3D 검증 완료
            </div>
            <div className="w-9 h-9 bg-white p-1 rounded-xl border border-slate-200 flex items-center justify-center shadow-2xs">
              <QrCode className="w-6 h-6 text-slate-800" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => alert('포트폴리오가 PDF로 다운로드되었습니다!')}
            className="flex-1 bg-emerald-500 active:bg-emerald-600 text-white text-xs font-black py-2.5 rounded-2xl flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> PDF 저장
          </button>
          <button
            onClick={() => alert('링크가 클립보드에 복사되었습니다. 선생님이나 친구들에게 공유하세요!')}
            className="flex-1 bg-sky-500 active:bg-sky-600 text-white text-xs font-black py-2.5 rounded-2xl flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
          >
            <LinkIcon className="w-3.5 h-3.5" /> 링크 공유
          </button>
        </div>
      </div>
    </div>
  );
}
