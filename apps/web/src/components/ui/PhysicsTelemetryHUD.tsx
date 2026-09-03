'use client';

import React from 'react';
import { DynamicState } from '../../utils/physicsEngine';

interface PhysicsTelemetryHUDProps {
  state: DynamicState;
  showForces: boolean;
  onToggleForces: () => void;
  presetTitle: string;
}

export function PhysicsTelemetryHUD({
  state,
  showForces,
  onToggleForces,
  presetTitle,
}: PhysicsTelemetryHUDProps) {
  const isRunning = state.rpm > 0.5;

  return (
    <div className="absolute left-6 bottom-24 z-30 pointer-events-auto select-none">
      <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/70 rounded-2xl p-4 shadow-2xl w-80 text-white transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
              실시간 동역학 텔레메트리
            </span>
          </div>
          <span className="text-[10px] font-mono bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/30">
            {presetTitle}
          </span>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* RPM */}
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <div className="text-[10px] text-slate-400 font-medium">회전 속도 (Speed)</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black font-mono text-emerald-400">
                {state.rpm.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400">RPM</span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              {(state.omega).toFixed(2)} rad/s
            </div>
          </div>

          {/* Drive Torque */}
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <div className="text-[10px] text-slate-400 font-medium">구동 토크 (Torque)</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black font-mono text-amber-400">
                {state.torqueIn.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400">N·mm</span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              부하: {state.torqueLoad.toFixed(1)} N·mm
            </div>
          </div>

          {/* Power */}
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <div className="text-[10px] text-slate-400 font-medium">전달 동력 (Power)</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black font-mono text-sky-400">
                {(state.powerMilliwatts).toFixed(0)}
              </span>
              <span className="text-[10px] text-slate-400">mW</span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              P = τ × ω
            </div>
          </div>

          {/* Dynamic Equilibrium Index */}
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <div className="text-[10px] text-slate-400 font-medium">동역학 평형 지수</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black font-mono text-indigo-400">
                {state.equilibriumRatio}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1 mt-1 overflow-hidden">
              <div
                className="bg-indigo-500 h-1 transition-all duration-300"
                style={{ width: `${state.equilibriumRatio}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Drag Breakdown */}
        <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 text-[11px] mb-3">
          <div className="flex justify-between text-slate-400 mb-1">
            <span>공기/마찰 저항 항력 (Drag):</span>
            <span className="font-mono text-red-400 font-semibold">
              {state.torqueDrag.toFixed(2)} N·mm
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>축적 운동 에너지 (Kinetic Energy):</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {state.kineticEnergyMilliJoules.toFixed(2)} mJ
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onToggleForces}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              showForces
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
            }`}
          >
            <i className="fa-solid fa-arrows-to-dot text-[11px]" />
            <span>20° 작용선 및 접촉력 벡터</span>
          </button>
        </div>
      </div>
    </div>
  );
}
