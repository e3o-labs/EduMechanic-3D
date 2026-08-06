'use client';

import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { MechanismModel } from './MechanismModel';
import { PinOverlay } from './PinOverlay';
import { useStore } from '../../store/useStore';
import { TouchToolbar } from '../ui/TouchToolbar';
import { VoiceTutorButton } from '../ui/VoiceTutorButton';
import { ChevronRight, Box, Camera, Eye } from 'lucide-react';

export function CanvasViewport() {
  const activePreset = useStore((s) => s.activePreset);
  const isXray = useStore((s) => s.isXray);
  const toggleXray = useStore((s) => s.toggleXray);
  const selectedPartId = useStore((s) => s.selectedPartId);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const isScanning = useStore((s) => s.isScanning);
  const scanningThumb = useStore((s) => s.scanningThumb);
  const setPresetModalOpen = useStore((s) => s.setPresetModalOpen);

  const controlsRef = useRef<OrbitControlsImpl>(null);

  const selectedPart = activePreset.parts.find((p) => p.id === selectedPartId);

  const resetCamera = (mode: 'iso' | 'top') => {
    if (!controlsRef.current) return;
    if (mode === 'iso') {
      controlsRef.current.object.position.set(25, 20, 30);
      controlsRef.current.target.set(0, 0, 0);
    } else if (mode === 'top') {
      controlsRef.current.object.position.set(0, 40, 0);
      controlsRef.current.target.set(0, 0, 0);
    }
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full flex-1 bg-sky-50/50 overflow-hidden">
      {/* Three.js R3F Canvas */}
      <div className="w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [25, 20, 30], fov: 45 }}
          shadows
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#f0f9ff']} />
          <ambientLight intensity={0.85} />
          <directionalLight position={[20, 40, 20]} intensity={0.7} castShadow />
          <directionalLight position={[-20, -10, -20]} intensity={0.4} color="#38bdf8" />
          <gridHelper args={[60, 30, '#94a3b8', '#cbd5e1']} position={[0, -8, 0]} />

          <MechanismModel />
          <PinOverlay />

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2 + 0.1}
          />
        </Canvas>
      </div>

      {/* AI SCANNING ANIMATION OVERLAY */}
      {isScanning && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-30 transition-opacity">
          <div className="relative w-48 h-48 border-2 border-dashed border-emerald-400 rounded-3xl flex items-center justify-center p-2 mb-3 bg-white/90 shadow-2xl">
            <img
              src={scanningThumb}
              alt="Scanning Thumb"
              className="w-full h-full object-cover rounded-2xl opacity-80"
            />
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-500 to-emerald-500 shadow-md animate-pulse"></div>
            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              🤖 AI 메카몽이 구조 탐구 중...
            </div>
          </div>
          <p className="text-xs text-emerald-300 font-bold animate-pulse bg-slate-900/80 px-3 py-1 rounded-full border border-emerald-500/30">
            내부 톱니와 결합 구조를 풀어내는 중! (85%)
          </p>
        </div>
      )}

      {/* HUD TOP BAR */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="pointer-events-auto bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-md">
          <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-bold">
            💡
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-800">{activePreset.title}</h2>
            <p className="text-[10px] text-slate-500 font-medium">{activePreset.subtitle}</p>
          </div>
        </div>

        {/* Camera Preset Buttons */}
        <div className="pointer-events-auto flex items-center gap-1 bg-white/90 backdrop-blur-md border border-slate-200/80 p-1 rounded-2xl shadow-md">
          <button
            onClick={() => resetCamera('iso')}
            className="w-7 h-7 text-[10px] bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 rounded-xl flex items-center justify-center font-bold transition-colors"
            title="입체뷰"
          >
            ISO
          </button>
          <button
            onClick={() => resetCamera('top')}
            className="w-7 h-7 text-[10px] bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 rounded-xl flex items-center justify-center font-bold transition-colors"
            title="정면뷰"
          >
            TOP
          </button>
          <button
            onClick={toggleXray}
            className={`w-7 h-7 text-xs rounded-xl flex items-center justify-center transition-colors ${
              isXray ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-sky-50'
            }`}
            title="속 들여다보기"
          >
            <Box className="w-3.5 h-3.5" />
          </button>
        </div>

        <VoiceTutorButton />
      </div>

      {/* CANVAS BOTTOM TOOLBAR AREA */}
      <div className="absolute bottom-4 left-3 right-3 pointer-events-none flex flex-col gap-2 z-10">
        {/* Quick Part Inspector Alert */}
        {selectedPart && (
          <div className="pointer-events-auto bg-sky-600/95 backdrop-blur-md border border-sky-400 text-white rounded-2xl p-2.5 text-xs shadow-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping"></div>
              <div>
                <span className="text-[10px] text-sky-100 font-bold block">선택한 부품</span>
                <span className="font-extrabold text-white text-xs">{selectedPart.name}</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('tab-inspect')}
              className="bg-white text-sky-700 text-[10px] font-black px-3 py-1.5 rounded-xl active:scale-95 transition-transform shadow-sm flex items-center gap-1"
            >
              🔍 돋보기 보기 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        <TouchToolbar />
      </div>
    </div>
  );
}
