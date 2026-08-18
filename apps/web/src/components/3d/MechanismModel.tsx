'use client';

import React, { useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

export function MechanismModel() {
  const activePreset = useStore((s) => s.activePreset);
  const explodeValue = useStore((s) => s.explodeValue);
  const isSimulating = useStore((s) => s.isSimulating);
  const isXray = useStore((s) => s.isXray);
  const selectedPartId = useStore((s) => s.selectedPartId);
  const setSelectedPartId = useStore((s) => s.setSelectedPartId);
  const pinMode = useStore((s) => s.pinMode);
  const addPin = useStore((s) => s.addPin);

  const groupRef = useRef<THREE.Group>(null);
  const rotatingGroupRef = useRef<THREE.Group>(null);

  const factor = explodeValue / 100;

  useFrame((_, delta) => {
    if (isSimulating && rotatingGroupRef.current) {
      rotatingGroupRef.current.rotation.y += delta * 2.5;
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>, partId: string) => {
    e.stopPropagation();
    if (pinMode) {
      const point = e.point;
      addPin({
        id: 'pin_' + Date.now(),
        partId,
        position: [point.x, point.y, point.z],
        content: `이 위치(${partId})의 동작 원리가 궁금해요!`,
        author: '김민준',
        createdAt: '방금 전',
      });
    } else {
      setSelectedPartId(partId);
    }
  };

  const getPartMaterial = (partId: string, baseColor: number | string) => {
    const isSelected = selectedPartId === partId;
    const isHousing = partId.toLowerCase().includes('housing') || partId.toLowerCase().includes('하우징');
    return (
      <meshStandardMaterial
        color={isSelected ? '#38bdf8' : baseColor}
        roughness={isXray ? 0.1 : 0.3}
        metalness={0.4}
        wireframe={isXray}
        transparent={isXray || isHousing}
        opacity={isHousing ? 0.4 : isXray ? 0.6 : 1.0}
        emissive={isSelected ? '#0284c7' : '#000000'}
        emissiveIntensity={isSelected ? 0.4 : 0}
      />
    );
  };

  const isBuiltin = ['sharpener', 'musicbox', 'bicycle'].includes(activePreset.id);

  return (
    <group ref={groupRef}>
      {/* 1. Preset: Sharpener */}
      {activePreset.id === 'sharpener' && (
        <group>
          {/* Housing */}
          <mesh
            position={[0, 0 + factor * 8, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'housing')}
          >
            <cylinderGeometry args={[8, 8, 14, 24, 1, true]} />
            {getPartMaterial('housing', 0x38bdf8)}
          </mesh>

          {/* Bevel Gear */}
          <mesh
            position={[0, 0, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'bevel')}
          >
            <cylinderGeometry args={[4, 5, 2.5, 16]} />
            {getPartMaterial('bevel', 0xf59e0b)}
          </mesh>

          {/* Cutter (Rotating) */}
          <group ref={rotatingGroupRef} position={[0, -2 - factor * 6, 0]}>
            <mesh
              rotation={[0, 0, Math.PI / 6]}
              onPointerDown={(e) => handlePointerDown(e, 'cutter')}
            >
              <cylinderGeometry args={[2, 3, 7, 12]} />
              {getPartMaterial('cutter', 0x10b981)}
            </mesh>
          </group>

          {/* Crank Handle */}
          <mesh
            position={[0, 5 + factor * 4, 7 + factor * 6]}
            rotation={[Math.PI / 2, 0, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'crank')}
          >
            <cylinderGeometry args={[0.8, 0.8, 6, 12]} />
            {getPartMaterial('crank', 0x64748b)}
          </mesh>
        </group>
      )}

      {/* 2. Preset: Music Box */}
      {activePreset.id === 'musicbox' && (
        <group>
          {/* Main Spring Drum */}
          <mesh
            position={[-7 - factor * 6, 0, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'spring')}
          >
            <cylinderGeometry args={[4, 4, 3, 24]} />
            {getPartMaterial('spring', 0x4f46e5)}
          </mesh>

          {/* Pin Cylinder (Rotating) */}
          <group ref={rotatingGroupRef} position={[0, 0, 0]}>
            <mesh onPointerDown={(e) => handlePointerDown(e, 'cylinder')}>
              <cylinderGeometry args={[3.5, 3.5, 10, 24]} />
              {getPartMaterial('cylinder', 0xf59e0b)}
            </mesh>
          </group>

          {/* Metal Comb */}
          <mesh
            position={[0, 2 + factor * 5, 4 + factor * 3]}
            onPointerDown={(e) => handlePointerDown(e, 'comb')}
          >
            <boxGeometry args={[8, 0.5, 3]} />
            {getPartMaterial('comb', 0x64748b)}
          </mesh>

          {/* Fan Governor */}
          <mesh
            position={[7 + factor * 6, 0, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'governor')}
          >
            <boxGeometry args={[0.2, 4, 2]} />
            {getPartMaterial('governor', 0x10b981)}
          </mesh>
        </group>
      )}

      {/* 3. Preset: Bicycle Planetary Gear */}
      {activePreset.id === 'bicycle' && (
        <group>
          {/* Center Sun Gear */}
          <mesh
            position={[0, 0, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'sun')}
          >
            <cylinderGeometry args={[3, 3, 2, 24]} />
            {getPartMaterial('sun', 0xef4444)}
          </mesh>

          {/* Planet Gears (Rotating) */}
          <group ref={rotatingGroupRef}>
            {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, i) => {
              const radius = 6 + factor * 5;
              const x = Math.cos(angle) * radius;
              const z = Math.sin(angle) * radius;
              return (
                <mesh
                  key={i}
                  position={[x, 0, z]}
                  onPointerDown={(e) => handlePointerDown(e, 'planet')}
                >
                  <cylinderGeometry args={[2, 2, 2, 16]} />
                  {getPartMaterial('planet', 0xf59e0b)}
                </mesh>
              );
            })}
          </group>

          {/* Outer Ring Gear */}
          <mesh
            position={[0, 0, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'ring')}
          >
            <cylinderGeometry args={[10 + factor * 4, 10 + factor * 4, 2.5, 32, 1, true]} />
            {getPartMaterial('ring', 0x0284c7)}
          </mesh>
        </group>
      )}

      {/* 4. Dynamic AI-Parsed VLM Mechanism */}
      {!isBuiltin && (
        <group>
          {activePreset.parts.map((part, idx) => {
            const colors = ['#38bdf8', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];
            const partColor = part.color || colors[idx % colors.length];
            const offset = part.explodeOffset || [0, (idx - 1) * 2.5, 0];
            const posX = offset[0] * factor * 5;
            const posY = offset[1] * factor * 5;
            const posZ = offset[2] * factor * 5;

            const rTop = part.radiusTop || (part.geometryType === 'cylinder' ? 5 : 3.5);
            const rBottom = part.radiusBottom || (part.geometryType === 'cylinder' ? 5 : 3.5);
            const h = part.height || 3.0;

            const isRot = part.isRotating || part.id.includes('gear') || part.id.includes('shaft');

            if (isRot) {
              return (
                <group key={part.id} ref={rotatingGroupRef} position={[posX, posY, posZ]}>
                  <mesh onPointerDown={(e) => handlePointerDown(e, part.id)}>
                    <cylinderGeometry args={[rTop, rBottom, h, 20]} />
                    {getPartMaterial(part.id, partColor)}
                  </mesh>
                </group>
              );
            }

            return (
              <mesh
                key={part.id}
                position={[posX, posY, posZ]}
                onPointerDown={(e) => handlePointerDown(e, part.id)}
              >
                {part.geometryType === 'box' ? (
                  <boxGeometry args={[rTop * 2, h, rBottom * 2]} />
                ) : (
                  <cylinderGeometry args={[rTop, rBottom, h, 24, 1, part.id.includes('housing')]} />
                )}
                {getPartMaterial(part.id, partColor)}
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}
