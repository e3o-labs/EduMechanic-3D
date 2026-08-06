'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function VoiceTutorButton() {
  const [isListening, setIsListening] = useState(false);
  const [tutorReply, setTutorReply] = useState<string | null>(null);
  const activePreset = useStore((s) => s.activePreset);
  const setExplodeValue = useStore((s) => s.setExplodeValue);
  const toggleXray = useStore((s) => s.toggleXray);
  const toggleSimulating = useStore((s) => s.toggleSimulating);

  const startVoiceDialogue = async () => {
    setIsListening(true);
    setTutorReply("음성을 듣고 있어요... ('분해해줘', '회전원리 말해줘' 등을 질문해 보세요!)");

    // Simulate STT speech input & Voice Tutor API call
    setTimeout(async () => {
      setIsListening(false);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/api/v1/voice/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_text: '부품 분해 원리가 궁금해요',
            card_title: activePreset.title,
          }),
        });
        const data = await res.json();
        setTutorReply(data.answer_text);

        // Apply 3D action trigger
        if (data.action_trigger?.type === 'set_explode') {
          setExplodeValue(data.action_trigger.value);
        } else if (data.action_trigger?.type === 'toggle_simulate') {
          toggleSimulating();
        } else if (data.action_trigger?.type === 'toggle_xray') {
          toggleXray();
        }
      } catch (e) {
        setTutorReply("메카몽: 3D 기어 부품을 분해해서 보여줄게! 질문해 줘서 고마워!");
        setExplodeValue(60);
      }
    }, 1800);
  };

  return (
    <div className="pointer-events-auto relative">
      {tutorReply && (
        <div className="absolute bottom-14 right-0 w-72 bg-white/95 backdrop-blur-md border border-amber-200 rounded-3xl p-3.5 shadow-2xl space-y-2 text-left animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
            <span className="text-xs font-black text-amber-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              AI 튜터 메카몽의 답변
            </span>
            <button
              onClick={() => setTutorReply(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs font-medium text-slate-700 leading-relaxed">{tutorReply}</p>
          <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
            <Volume2 className="w-3 h-3 animate-pulse" /> 음성 해설 재생 중...
          </div>
        </div>
      )}

      <button
        onClick={startVoiceDialogue}
        disabled={isListening}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl border border-white/40 backdrop-blur-md transition-all active:scale-95 ${
          isListening
            ? 'bg-red-500 text-white animate-bounce shadow-red-500/50 ring-4 ring-red-300'
            : 'bg-gradient-to-tr from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 shadow-orange-500/30'
        }`}
        title="AI 튜터 메카몽 음성 대화하기"
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5 animate-pulse" />
        )}
      </button>
    </div>
  );
}
