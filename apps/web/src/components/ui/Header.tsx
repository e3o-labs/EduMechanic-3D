'use client';

import React from 'react';
import { useStore } from '../../store/useStore';
import { Camera, Bookmark, Trophy, Globe, BarChart3 } from 'lucide-react';
import { dictionary, Locale } from '../../locales/dictionary';

export function Header() {
  const setPresetModalOpen = useStore((s) => s.setPresetModalOpen);
  const setPortfolioModalOpen = useStore((s) => s.setPortfolioModalOpen);
  const setTeacherModalOpen = useStore((s) => s.setTeacherModalOpen);
  const remixCount = useStore((s) => s.remixCount);
  const incrementRemix = useStore((s) => s.incrementRemix);
  const locale = useStore((s) => s.locale);
  const setLocale = useStore((s) => s.setLocale);

  const t = dictionary[locale];

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 py-2 flex items-center justify-between shrink-0 z-20 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-400 to-emerald-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-200">
          🤖
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs text-slate-800 tracking-tight">
              {t.app_title}
            </span>
            <span className="bg-sky-100 text-sky-700 border border-sky-200 text-[9px] font-bold px-2 py-0.5 rounded-full">
              K-12 STEM
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">{t.team_label} • {t.app_subtitle}</p>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-1.5">
        {/* Language Selector Dropdown */}
        <div className="relative flex items-center bg-slate-100 border border-slate-200 rounded-xl px-1.5 py-1">
          <Globe className="w-3 h-3 text-slate-500 mr-1" />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="bg-transparent text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ko">🇰🇷 한국어</option>
            <option value="en">🇺🇸 English</option>
            <option value="ja">🇯🇵 日本語</option>
          </select>
        </div>

        <button
          onClick={() => setPresetModalOpen(true)}
          className="bg-sky-50 active:bg-sky-100 text-sky-700 text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-sky-200 font-bold shadow-sm transition-all active:scale-95"
        >
          <Camera className="w-3.5 h-3.5 text-sky-500" />
          <span className="text-[11px] hidden sm:inline">사진 파싱</span>
        </button>

        <button
          onClick={() => setTeacherModalOpen(true)}
          className="bg-indigo-50 active:bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-indigo-200 font-bold shadow-sm transition-all active:scale-95"
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[11px]">{t.teacher_analytics}</span>
        </button>

        <button
          onClick={incrementRemix}
          className="bg-emerald-500 active:bg-emerald-600 text-white text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-md shadow-emerald-200 font-bold transition-all active:scale-95"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden sm:inline">{t.remix_btn}</span>
          <span className="bg-emerald-700 text-emerald-100 text-[9px] px-1.5 rounded-full ml-0.5 font-mono">
            {remixCount}
          </span>
        </button>

        <button
          onClick={() => setPortfolioModalOpen(true)}
          className="bg-amber-100 active:bg-amber-200 text-amber-800 w-8 h-8 rounded-xl flex items-center justify-center border border-amber-200 shadow-sm font-bold active:scale-95 transition-all"
        >
          <Trophy className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
