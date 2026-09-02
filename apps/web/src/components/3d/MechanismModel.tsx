'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import {
  createInvoluteGearGeometry,
  createHelicalCutterGeometry,
  createInternalRingGearGeometry,
  createPencilGeometry,
} from '../../utils/gearGeometry';

export function MechanismModel() {
  const activePreset = useStore((s) => s.activePreset);
  const explodeValue = useStore((s) => s.explodeValue);
  const isSimulating = useStore((s) => s.isSimulating);
  const isXray = useStore((s) => s.isXray);
  const selectedPartId = useStore((s) => s.selectedPartId);
  const setSelectedPartId = useStore((s) => s.setSelectedPartId);
  const pinMode = useStore((s) => s.pinMode);
  const addPin = useStore((s) => s.addPin);
  const makerParams = useStore((s) => s.makerParams);

  const groupRef = useRef<THREE.Group>(null);
  const carrierRef = useRef<THREE.Group>(null);
  const cutterRollerRef = useRef<THREE.Group>(null);
  const crankHandleRef = useRef<THREE.Group>(null);
  const sunGearRef = useRef<THREE.Group>(null);
  const planetCarrierRef = useRef<THREE.Group>(null);

  const factor = explodeValue / 100;
  const teethZ = Math.max(10, makerParams.teethCount);

  // --- Real Geometries Generated Mathematically ---
  const helicalCutterGeom = useMemo(() => {
    return createHelicalCutterGeometry(3.0, 11.0, 10, Math.PI / 2.8);
  }, []);

  const internalRingGeom = useMemo(() => {
    return createInternalRingGearGeometry(7.2, 10.0, 24, 4.5);
  }, []);

  const pinionGearGeom = useMemo(() => {
    return createInvoluteGearGeometry({ module: 1.2, teethCount: 8, faceWidth: 4.0, shaftDiameter: 3.0 });
  }, []);

  const spurGearGeom = useMemo(() => {
    return createInvoluteGearGeometry({
      module: 1.5,
      teethCount: teethZ,
      faceWidth: 7.0,
      shaftDiameter: makerParams.shaftDiameter,
      cotsMount: makerParams.cotsMount,
    });
  }, [teethZ, makerParams.shaftDiameter, makerParams.cotsMount]);

  const sunGearGeom = useMemo(() => {
    return createInvoluteGearGeometry({ module: 1.2, teethCount: 14, faceWidth: 6.0, shaftDiameter: 5.0 });
  }, []);

  const planetGearGeom = useMemo(() => {
    return createInvoluteGearGeometry({ module: 1.2, teethCount: 10, faceWidth: 5.5, shaftDiameter: 4.0 });
  }, []);

  const pencilGeoms = useMemo(() => {
    return createPencilGeometry(24.0, 2.2);
  }, []);

  // --- True Planetary Helical Milling Kinematic Simulation ---
  useFrame((_, delta) => {
    if (!isSimulating) return;

    const crankSpeed = delta * 2.5; // rad/s
    const ringTeeth = 24;
    const pinionTeeth = 8;
    const spinRatio = 1.0 + ringTeeth / pinionTeeth; // Planetary ratio: 4.0x spin per orbital revolution

    // 1. Sharpener Epicyclic Kinematics
    if (carrierRef.current) {
      // Orbital Revolution of Carrier Frame around pencil center
      carrierRef.current.rotation.x += crankSpeed;
    }
    if (crankHandleRef.current) {
      crankHandleRef.current.rotation.x += crankSpeed;
    }
    if (cutterRollerRef.current) {
      // High-speed Self-Spin of Helical Roller around its tilted axis
      cutterRollerRef.current.rotation.y += crankSpeed * spinRatio;
    }

    // 2. Musicbox / Bicycle Kinematics
    if (sunGearRef.current) {
      sunGearRef.current.rotation.z += crankSpeed * 2.8;
    }
    if (planetCarrierRef.current) {
      planetCarrierRef.current.rotation.z += crankSpeed * 0.9;
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
        content: `이 위치(${partId})의 기구학 동작 원리가 궁금해요!`,
        author: '김민준',
        createdAt: '방금 전',
      });
    } else {
      setSelectedPartId(partId);
    }
  };

  const getPartMaterial = (partId: string, baseColor: number | string, isGlass: boolean = false) => {
    const isSelected = selectedPartId === partId;
    const isHousing = partId.toLowerCase().includes('housing') || partId.toLowerCase().includes('하우징') || partId.toLowerCase().includes('body');

    let colorToApply = isSelected ? '#38bdf8' : baseColor;
    let emissiveColor = isSelected ? '#0284c7' : '#000000';
    let emissiveVal = isSelected ? 0.4 : 0;

    // DFAM Printability Heatmap
    if (makerParams.showPrintabilityHeatmap) {
      if (isHousing || isGlass) {
        colorToApply = '#10b981'; // 100% Watertight (Green)
      } else if (partId.toLowerCase().includes('cutter') || partId.toLowerCase().includes('gear') || partId.toLowerCase().includes('blade')) {
        colorToApply = '#f59e0b'; // Overhang Helical Teeth (Amber)
      } else {
        colorToApply = '#10b981';
      }
      emissiveColor = colorToApply as string;
      emissiveVal = 0.25;
    }

    return (
      <meshStandardMaterial
        color={colorToApply}
        roughness={isGlass ? 0.05 : isXray ? 0.1 : 0.3}
        metalness={isGlass ? 0.1 : 0.6}
        wireframe={isXray}
        transparent={isXray || isHousing || isGlass}
        opacity={isGlass ? 0.45 : isHousing ? 0.5 : isXray ? 0.6 : 1.0}
        emissive={emissiveColor}
        emissiveIntensity={emissiveVal}
      />
    );
  };

  return (
    <group ref={groupRef}>
      {/* ========================================================================= */}
      {/* 1. PRESET: SHARPENER (실제 유성 헬리컬 롤러 커터 연필깎이 풀 어셈블리) */}
      {/* ========================================================================= */}
      {activePreset.id === 'sharpener' && (
        <group>
          {/* [Part 1] Main Retro-styled Body Housing Shell */}
          <group position={[0, 0 + factor * 8, 0]}>
            <mesh onPointerDown={(e) => handlePointerDown(e, 'housing')}>
              <cylinderGeometry args={[11.5, 12.5, 20.0, 32, 1, true]} />
              {getPartMaterial('housing', 0x0284c7)}
            </mesh>
            {/* Top Arched Dome */}
            <mesh position={[0, 10, 0]} onPointerDown={(e) => handlePointerDown(e, 'housing')}>
              <sphereGeometry args={[11.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              {getPartMaterial('housing', 0x0284c7)}
            </mesh>
          </group>

          {/* [Part 2] Clear Acrylic Shavings Drawer Bin (하단 톱밥 서랍함) */}
          <mesh
            position={[0, -11 - factor * 8, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'drawer')}
          >
            <boxGeometry args={[18.0, 10.0, 20.0]} />
            {getPartMaterial('drawer', 0xe2e8f0, true)}
          </mesh>

          {/* [Part 3] Front Chrome Pencil Clamping Chuck & Entry Port (전면 척) */}
          <group position={[-14 - factor * 10, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh onPointerDown={(e) => handlePointerDown(e, 'chuck')}>
              <cylinderGeometry args={[6.5, 7.5, 5.0, 24]} />
              {getPartMaterial('chuck', 0x94a3b8)}
            </mesh>
            {/* Clamping Pinch Levers */}
            <mesh position={[4.0, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'chuck')}>
              <boxGeometry args={[3.0, 8.0, 1.2]} />
              {getPartMaterial('chuck', 0x64748b)}
            </mesh>
            <mesh position={[-4.0, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'chuck')}>
              <boxGeometry args={[3.0, 8.0, 1.2]} />
              {getPartMaterial('chuck', 0x64748b)}
            </mesh>
          </group>

          {/* [Part 4] Stationary Internal Ring Gear (하우징 내부 고정 링 기어) */}
          <mesh
            geometry={internalRingGeom}
            position={[4.0, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'ring_gear')}
          >
            {getPartMaterial('ring_gear', 0x475569)}
          </mesh>

          {/* [Part 5] Rotating Planetary Carrier & Inclined Helical Cutter Spindle */}
          <group ref={carrierRef} position={[0, 0, 0]}>
            {/* Carrier Spindle Body */}
            <mesh rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'carrier')}>
              <cylinderGeometry args={[3.2, 4.2, 14.0, 24]} />
              {getPartMaterial('carrier', 0x10b981)}
            </mesh>

            {/* Inclined Helical Milling Cutter (18-degree Cone Pitch Angle) */}
            <group position={[0, 3.8, 0]} rotation={[0, 0, (18 * Math.PI) / 180]}>
              <group ref={cutterRollerRef}>
                {/* 10-Flute Helical Cutter Blade */}
                <mesh geometry={helicalCutterGeom} onPointerDown={(e) => handlePointerDown(e, 'cutter_blade')}>
                  {getPartMaterial('cutter_blade', 0xf59e0b)}
                </mesh>
                {/* Pinion Gear riding on the stationary ring gear */}
                <mesh
                  geometry={pinionGearGeom}
                  position={[0, 5.5, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                  onPointerDown={(e) => handlePointerDown(e, 'pinion')}
                >
                  {getPartMaterial('pinion', 0xec4899)}
                </mesh>
              </group>
            </group>
          </group>

          {/* [Part 6] Hexagonal Wooden Pencil Being Sharpened */}
          <group position={[-6.0, 0, 0]}>
            <mesh geometry={pencilGeoms.body} onPointerDown={(e) => handlePointerDown(e, 'pencil')}>
              {getPartMaterial('pencil', 0xfacc15)}
            </mesh>
            {/* Sharpened Wood Cone Tip */}
            <mesh geometry={pencilGeoms.cone} position={[12.0, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'pencil')}>
              {getPartMaterial('pencil', 0xfde68a)}
            </mesh>
            {/* Graphite Core */}
            <mesh geometry={pencilGeoms.lead} position={[14.2, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'pencil')}>
              {getPartMaterial('pencil', 0x1e293b)}
            </mesh>
          </group>

          {/* [Part 7] Rear Ergonomic Crank Handle & Rotating Knob */}
          <group
            ref={crankHandleRef}
            position={[12.0 + factor * 8, 0, 0]}
            rotation={[0, 0, 0]}
          >
            {/* Handle Arm */}
            <mesh position={[0, 4.5, 0]} onPointerDown={(e) => handlePointerDown(e, 'crank')}>
              <boxGeometry args={[2.0, 9.0, 1.4]} />
              {getPartMaterial('crank', 0x64748b)}
            </mesh>
            {/* Central Drive Shaft */}
            <mesh rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'crank')}>
              <cylinderGeometry args={[1.5, 1.5, 6.0, 16]} />
              {getPartMaterial('crank', 0x94a3b8)}
            </mesh>
            {/* Ergonomic Turning Grip Knob */}
            <mesh position={[0, 8.5, 4.0]} rotation={[Math.PI / 2, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'crank')}>
              <cylinderGeometry args={[1.8, 1.4, 5.0, 16]} />
              {getPartMaterial('crank', 0xef4444)}
            </mesh>
          </group>
        </group>
      )}

      {/* ========================================================================= */}
      {/* 2. PRESET: MUSICBOX (태엽 오르골 기어 트레인 & 가버너) */}
      {/* ========================================================================= */}
      {activePreset.id === 'musicbox' && (
        <group>
          <mesh position={[-6 - factor * 5, 0, 0]} rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'drum')}>
            <cylinderGeometry args={[4.5, 4.5, 12, 24]} />
            {getPartMaterial('drum', 0xf59e0b)}
          </mesh>

          <mesh geometry={spurGearGeom} onPointerDown={(e) => handlePointerDown(e, 'gear_main')}>
            {getPartMaterial('gear_main', 0x38bdf8)}
          </mesh>

          <mesh geometry={sunGearGeom} position={[8 + factor * 6, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'pinion')}>
            {getPartMaterial('pinion', 0xec4899)}
          </mesh>
        </group>
      )}

      {/* ========================================================================= */}
      {/* 3. PRESET: BICYCLE (유성기어 변속기 - Sun & 3-Planet Gears) */}
      {/* ========================================================================= */}
      {activePreset.id === 'bicycle' && (
        <group>
          <group ref={sunGearRef}>
            <mesh geometry={sunGearGeom} onPointerDown={(e) => handlePointerDown(e, 'sun')}>
              {getPartMaterial('sun', 0xf59e0b)}
            </mesh>
          </group>

          <group ref={planetCarrierRef}>
            {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, idx) => (
              <mesh
                key={idx}
                geometry={planetGearGeom}
                position={[8 * Math.cos(angle), 8 * Math.sin(angle), 0]}
                onPointerDown={(e) => handlePointerDown(e, `planet_${idx}`)}
              >
                {getPartMaterial(`planet_${idx}`, 0x10b981)}
              </mesh>
            ))}
          </group>

          <mesh onPointerDown={(e) => handlePointerDown(e, 'ring')}>
            <torusGeometry args={[12 + factor * 4, 1.2, 16, 48]} />
            {getPartMaterial('ring', 0x38bdf8)}
          </mesh>
        </group>
      )}
    </group>
  );
}
