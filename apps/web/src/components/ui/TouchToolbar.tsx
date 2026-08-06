'use client';

import React from 'react';
import { useStore } from '../../store/useStore';
import { Play, Pause, MapPin, SlidersHorizontal } from 'lucide-react';

export function TouchToolbar() {
  const explodeValue = useStore((s) => s.explodeValue);
  const setExplodeValue = useStore((s) => s.setExplodeValue);
  const isSimulating = useStore((s) => s.isSimulating);
  const toggleSimulating = useStore((s) => s.toggleSimulating);
  const pinMode = useStore((s) => s.pinMode);
  const togglePinMode = useStore((s) => s.togglePinMode);

  return (
    <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-3 shadow-xl flex flex-col gap-2">
      {/* Explode Slider */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-600 shrink-0 flex items-center gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-500" /> 부품 펼쳐보기
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={explodeValue}
          onChange={(e) => setExplodeValue(Number(e.target.value))}
          className="w-full accent-sky-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
        />
        <span className="text-[11px] font-mono text-sky-600 font-black w-8 text-right">
          {explodeValue}%
        </span>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <button
          onClick={toggleSimulating}
          className={`flex-1 border text-xs py-2 rounded-2xl font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
            isSimulating
              ? 'bg-amber-500 text-white border-amber-600'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {isSimulating ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>일시정지</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-emerald-500" />
              <span>스위치 온! 움직여보기</span>
            </>
          )}
        </button>

          <button
            onClick={togglePinMode}
            className={`flex-1 border text-xs py-2 rounded-2xl font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
              pinMode
                ? 'bg-sky-500 text-white border-sky-600'
                : 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{pinMode ? '터치하여 핀 찍기' : '질문 핀 찌르기'}</span>
          </button>

          <button
            onClick={() => {
              const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
              window.open(`${backendUrl}/api/v1/cards/sharpener/export-3mf`, '_blank');
            }}
            className="px-3 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs py-2 rounded-2xl font-black flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
            title="3D 프린터 전송 3MF 출력"
          >
            <span>🖨️ 3D 프린터 출력</span>
          </button>
        </div>
      </div>
    );
  }
