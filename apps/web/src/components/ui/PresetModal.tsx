'use client';

import React from 'react';
import { useStore } from '../../store/useStore';
import { MECHANICAL_PRESETS } from '../../data/presets';
import { X, Camera, Sparkles } from 'lucide-react';

export function PresetModal() {
  const isOpen = useStore((s) => s.isPresetModalOpen);
  const setOpen = useStore((s) => s.setPresetModalOpen);
  const setActivePreset = useStore((s) => s.setActivePreset);

  if (!isOpen) return null;

  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId);
    setOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const thumbUrl = event.target?.result as string;
        setActivePreset('sharpener');
        useStore.getState().triggerScanAnimation(thumbUrl);
        setOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 opacity-100 transition-opacity">
      <div className="bg-white border border-slate-200 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl text-slate-800 animate-slide-up">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              📸 궁금한 기계 사진 찍기 / 고르기
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              주변 기계 사진을 찍으면 AI가 속을 보여줘요!
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 text-slate-400 hover:text-slate-700 flex items-center justify-center rounded-full bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="border-2 border-dashed border-sky-400 hover:border-sky-500 bg-sky-50/50 rounded-3xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
          <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xl mb-1">
            📸
          </div>
          <span className="text-xs font-black text-sky-700">카메라로 사진 찍기 또는 파일 선택</span>
          <span className="text-[10px] text-slate-500 mt-0.5">AI 메카몽이 3D 메커니즘을 자동 유추합니다</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>

        <div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">
            추천 탐구 기계 예시
          </span>
          <div className="grid grid-cols-2 gap-2">
            {MECHANICAL_PRESETS.map((item) => (
              <button
                key={item.id}
                onClick={() => handlePresetSelect(item.id)}
                className="group relative h-28 rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-sky-400 text-left p-2.5 flex flex-col justify-between transition-all active:scale-95 shadow-2xs"
              >
                <img
                  src={item.thumb}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-30"
                />
                <div className="relative z-10">
                  <span className="text-[10px] bg-white/90 text-sky-700 font-bold px-2 py-0.5 rounded-full border border-sky-100">
                    STEM 3D
                  </span>
                </div>
                <div className="relative z-10 bg-slate-900/80 backdrop-blur-xs p-1.5 rounded-xl text-white">
                  <div className="text-[11px] font-black truncate">{item.title}</div>
                  <div className="text-[9px] text-slate-300 font-medium truncate">
                    {item.subtitle}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
