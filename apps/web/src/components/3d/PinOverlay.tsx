'use client';

import React from 'react';
import { Html } from '@react-three/drei';
import { useStore } from '../../store/useStore';

export function PinOverlay() {
  const pins = useStore((s) => s.pins);
  const setSelectedPartId = useStore((s) => s.setSelectedPartId);
  const setActiveTab = useStore((s) => s.setActiveTab);

  return (
    <group>
      {pins.map((pin) => (
        <group key={pin.id} position={pin.position}>
          <Html distanceFactor={15} center>
            <div
              onClick={() => {
                setSelectedPartId(pin.partId);
                setActiveTab('tab-team');
              }}
              className="cursor-pointer group flex flex-col items-center animate-bounce"
            >
              <div className="bg-sky-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-xl shadow-lg border border-white whitespace-nowrap flex items-center gap-1 hover:scale-105 transition-transform">
                <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                <span>{pin.content}</span>
              </div>
              <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-6 border-t-sky-500"></div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
