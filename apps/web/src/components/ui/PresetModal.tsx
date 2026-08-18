'use client';

import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { MECHANICAL_PRESETS } from '../../data/presets';
import { MechanicalPreset, PartSpec } from '../../types';
import { X, Camera, Sparkles, Loader2 } from 'lucide-react';

export function PresetModal() {
  const isOpen = useStore((s) => s.isPresetModalOpen);
  const setOpen = useStore((s) => s.setPresetModalOpen);
  const setActivePreset = useStore((s) => s.setActivePreset);
  const setCustomPreset = useStore((s) => s.setCustomPreset);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  if (!isOpen) return null;

  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId);
    setOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingStatus('🤖 AI 메카몽이 사진을 분석하는 중입니다...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const thumbUrl = event.target?.result as string;

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', 'educational');

        // Attempt live API scan
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/scan`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const parsed = await res.json();
          setLoadingStatus('🔧 3D 파라메트릭 CAD 역설계 조립 중...');

          const parts: PartSpec[] = (parsed.components || []).map((comp: any, idx: number) => {
            const diam = comp.parameters?.outer_diameter || 40.0;
            const h = comp.parameters?.height || 20.0;
            const r = diam / 10;
            const expY = comp.explode_vector?.y !== undefined ? comp.explode_vector.y * 2.5 : (idx - 1) * 2.5;

            return {
              id: comp.part_id || `part_${idx}`,
              name: comp.name,
              function: comp.function_title || '기구 구동',
              desc: comp.description || '',
              geometryType: comp.geometry_type || 'cylinder',
              radiusTop: r,
              radiusBottom: comp.geometry_type === 'bevel_gear' ? r * 1.2 : r,
              height: Math.max(2.0, h / 6),
              explodeOffset: [comp.explode_vector?.x || 0, expY, comp.explode_vector?.z || 0],
              isRotating: comp.rotation_axis === 'Y' || comp.geometry_type?.includes('gear'),
            };
          });

          const customPreset: MechanicalPreset = {
            id: parsed.card_id || `custom_${Date.now()}`,
            title: parsed.title || `역설계 분석 (${file.name})`,
            subtitle: parsed.ai_summary || 'AI 비전 실시간 3D 역설계 모델',
            icon: '⚙️',
            thumb: thumbUrl,
            aiSummary: parsed.ai_summary || 'AI 역설계 분석 완료',
            principles: (parsed.components || []).map((c: any) => ({
              title: c.name,
              desc: c.stem_principle || c.function_title || c.description || '',
            })),
            parts: parts.length > 0 ? parts : MECHANICAL_PRESETS[0].parts,
            comments: [
              {
                author: 'AI 튜터 메카몽',
                time: '방금 전',
                text: '업로드해주신 사진에서 핵심 구동 메커니즘을 3D로 복원했어요! 돋보기로 부품을 눌러보세요.',
                part: parts[0]?.name || '전체',
              },
            ],
            quiz: {
              q: parsed.quiz?.question || '이 메커니즘의 동력 전달 원리는 무엇일까요?',
              options: parsed.quiz?.options || ['1. 기어 맞물림', '2. 벨트 마찰', '3. 유압 압력', '4. 전자기력'],
              correct: parsed.quiz?.correct_index ?? 0,
              explanation: parsed.quiz?.explanation || '톱니바퀴의 맞물림을 통해 회전 방향과 속도를 조절합니다.',
            },
          };

          setCustomPreset(customPreset);
        } else {
          throw new Error('API response not ok');
        }
      } catch (err) {
        console.warn('Live scan failed, using fallback preset:', err);
        setActivePreset('sharpener');
        useStore.getState().triggerScanAnimation(thumbUrl);
      } finally {
        setIsLoading(false);
        setOpen(false);
      }
    };

    reader.readAsDataURL(file);
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
            onClick={() => !isLoading && setOpen(false)}
            disabled={isLoading}
            className="w-8 h-8 text-slate-400 hover:text-slate-700 flex items-center justify-center rounded-full bg-slate-100 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Box */}
        <label className={`border-2 border-dashed ${isLoading ? 'border-amber-400 bg-amber-50/50' : 'border-sky-400 hover:border-sky-500 bg-sky-50/50'} rounded-3xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center`}>
          {isLoading ? (
            <div className="flex flex-col items-center py-2">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-2" />
              <span className="text-xs font-black text-amber-700">{loadingStatus}</span>
              <span className="text-[10px] text-slate-500 mt-1">Multi-Modal VLM & CadQuery 파이프라인 구동 중</span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xl mb-1">
                📸
              </div>
              <span className="text-xs font-black text-sky-700">카메라로 사진 찍기 또는 파일 선택</span>
              <span className="text-[10px] text-slate-500 mt-0.5">AI 메카몽이 3D 메커니즘을 자동 유추합니다</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isLoading} />
            </>
          )}
        </label>

        <div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">
            추천 탐구 기계 예시
          </span>
          <div className="grid grid-cols-2 gap-2">
            {MECHANICAL_PRESETS.map((item) => (
              <button
                key={item.id}
                onClick={() => !isLoading && handlePresetSelect(item.id)}
                disabled={isLoading}
                className="group relative h-28 rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-sky-400 text-left p-2.5 flex flex-col justify-between transition-all active:scale-95 shadow-2xs disabled:opacity-50"
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
