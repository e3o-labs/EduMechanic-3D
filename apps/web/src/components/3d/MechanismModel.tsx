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
  createMusicboxDrumGeometry,
  createCombReedsGeometry,
  createAirGovernorGeometry,
  createWindingKeyGeometry,
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
  
  // Sharpener refs
  const carrierRef = useRef<THREE.Group>(null);
  const cutterRollerRef = useRef<THREE.Group>(null);
  const crankHandleRef = useRef<THREE.Group>(null);

  // Musicbox refs
  const drumRef = useRef<THREE.Group>(null);
  const winderKeyRef = useRef<THREE.Group>(null);
  const governorFanRef = useRef<THREE.Group>(null);
  const intermediateGearRef = useRef<THREE.Group>(null);

  // Bicycle refs
  const sunGearRef = useRef<THREE.Group>(null);
  const planetCarrierRef = useRef<THREE.Group>(null);

  const factor = explodeValue / 100;
  const teethZ = Math.max(10, makerParams.teethCount);

  // --- Geometries Memoization ---
  // Sharpener
  const helicalCutterGeom = useMemo(() => createHelicalCutterGeometry(3.0, 11.0, 10, Math.PI / 2.8), []);
  const internalRingGeom = useMemo(() => createInternalRingGearGeometry(7.2, 10.0, 24, 4.5), []);
  const pinionGearGeom = useMemo(() => createInvoluteGearGeometry({ module: 1.2, teethCount: 8, faceWidth: 4.0, shaftDiameter: 3.0 }), []);
  const pencilGeoms = useMemo(() => createPencilGeometry(24.0, 2.2), []);

  // Musicbox
  const musicDrumGeom = useMemo(() => createMusicboxDrumGeometry(4.8, 16.0, 48), []);
  const combReedsGeom = useMemo(() => createCombReedsGeometry(15.0, 18), []);
  const governorGeom = useMemo(() => createAirGovernorGeometry(3.8, 7.0), []);
  const windingKeyGeom = useMemo(() => createWindingKeyGeometry(), []);
  const drumDriveGearGeom = useMemo(() => createInvoluteGearGeometry({ module: 1.2, teethCount: 28, faceWidth: 4.5, shaftDiameter: 4.0 }), []);
  const intermediatePinionGeom = useMemo(() => createInvoluteGearGeometry({ module: 1.2, teethCount: 10, faceWidth: 4.0, shaftDiameter: 3.0 }), []);
  const governorWormGearGeom = useMemo(() => createInvoluteGearGeometry({ module: 1.0, teethCount: 14, faceWidth: 3.5, shaftDiameter: 2.5 }), []);

  // Parametric Spur Gear (Maker Tab Custom)
  const customSpurGearGeom = useMemo(() => {
    return createInvoluteGearGeometry({
      module: 1.5,
      teethCount: teethZ,
      faceWidth: 7.0,
      shaftDiameter: makerParams.shaftDiameter,
      cotsMount: makerParams.cotsMount,
    });
  }, [teethZ, makerParams.shaftDiameter, makerParams.cotsMount]);

  const sunGearGeom = useMemo(() => createInvoluteGearGeometry({ module: 1.2, teethCount: 14, faceWidth: 6.0, shaftDiameter: 5.0 }), []);
  const planetGearGeom = useMemo(() => createInvoluteGearGeometry({ module: 1.2, teethCount: 10, faceWidth: 5.5, shaftDiameter: 4.0 }), []);

  // --- Kinematic True Simulation Loop ---
  useFrame((_, delta) => {
    if (!isSimulating) return;

    const baseSpeed = delta * 2.2; // rad/s

    // 1. Sharpener Epicyclic Kinematics
    if (carrierRef.current) carrierRef.current.rotation.x += baseSpeed;
    if (crankHandleRef.current) crankHandleRef.current.rotation.x += baseSpeed;
    if (cutterRollerRef.current) cutterRollerRef.current.rotation.y += baseSpeed * 4.0; // 4.0x planetary spin

    // 2. Musicbox Reduction & High-Speed Governor Kinematics
    if (drumRef.current) {
      drumRef.current.rotation.x += baseSpeed * 0.8; // Steady drum rotation
    }
    if (winderKeyRef.current) {
      winderKeyRef.current.rotation.x += baseSpeed * 0.4; // Slowly unwinding spring
    }
    if (intermediateGearRef.current) {
      intermediateGearRef.current.rotation.x -= baseSpeed * 0.8 * (28 / 10); // Intermediate step-up
    }
    if (governorFanRef.current) {
      governorFanRef.current.rotation.y += baseSpeed * 0.8 * 8.0; // 8x High-Speed Air Drag Stabilization
    }

    // 3. Bicycle Planetary Kinematics
    if (sunGearRef.current) sunGearRef.current.rotation.z += baseSpeed * 2.8;
    if (planetCarrierRef.current) planetCarrierRef.current.rotation.z += baseSpeed * 0.9;
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
    const isHousing = partId.toLowerCase().includes('housing') || partId.toLowerCase().includes('하우징') || partId.toLowerCase().includes('body') || partId.toLowerCase().includes('bed');

    let colorToApply = isSelected ? '#38bdf8' : baseColor;
    let emissiveColor = isSelected ? '#0284c7' : '#000000';
    let emissiveVal = isSelected ? 0.4 : 0;

    if (makerParams.showPrintabilityHeatmap) {
      if (isHousing || isGlass) {
        colorToApply = '#10b981'; // 100% Watertight (Green)
      } else if (partId.toLowerCase().includes('cutter') || partId.toLowerCase().includes('gear') || partId.toLowerCase().includes('blade') || partId.toLowerCase().includes('drum') || partId.toLowerCase().includes('comb')) {
        colorToApply = '#f59e0b'; // Overhang Flutes/Pins (Amber)
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
      {/* 1. PRESET: SHARPENER (실제 유성 헬리컬 롤러 커터 연필깎이) */}
      {/* ========================================================================= */}
      {activePreset.id === 'sharpener' && (
        <group>
          {/* Main Housing Shell */}
          <group position={[0, 0 + factor * 8, 0]}>
            <mesh onPointerDown={(e) => handlePointerDown(e, 'housing')}>
              <cylinderGeometry args={[11.5, 12.5, 20.0, 32, 1, true]} />
              {getPartMaterial('housing', 0x0284c7)}
            </mesh>
            <mesh position={[0, 10, 0]} onPointerDown={(e) => handlePointerDown(e, 'housing')}>
              <sphereGeometry args={[11.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              {getPartMaterial('housing', 0x0284c7)}
            </mesh>
          </group>

          {/* Clear Shavings Drawer */}
          <mesh position={[0, -11 - factor * 8, 0]} onPointerDown={(e) => handlePointerDown(e, 'drawer')}>
            <boxGeometry args={[18.0, 10.0, 20.0]} />
            {getPartMaterial('drawer', 0xe2e8f0, true)}
          </mesh>

          {/* Front Pencil Chuck */}
          <group position={[-14 - factor * 10, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh onPointerDown={(e) => handlePointerDown(e, 'chuck')}>
              <cylinderGeometry args={[6.5, 7.5, 5.0, 24]} />
              {getPartMaterial('chuck', 0x94a3b8)}
            </mesh>
            <mesh position={[4.0, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'chuck')}>
              <boxGeometry args={[3.0, 8.0, 1.2]} />
              {getPartMaterial('chuck', 0x64748b)}
            </mesh>
            <mesh position={[-4.0, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'chuck')}>
              <boxGeometry args={[3.0, 8.0, 1.2]} />
              {getPartMaterial('chuck', 0x64748b)}
            </mesh>
          </group>

          {/* Stationary Internal Ring Gear */}
          <mesh
            geometry={internalRingGeom}
            position={[4.0, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'ring_gear')}
          >
            {getPartMaterial('ring_gear', 0x475569)}
          </mesh>

          {/* Rotating Carrier & Inclined Helical Cutter */}
          <group ref={carrierRef} position={[0, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'carrier')}>
              <cylinderGeometry args={[3.2, 4.2, 14.0, 24]} />
              {getPartMaterial('carrier', 0x10b981)}
            </mesh>

            <group position={[0, 3.8, 0]} rotation={[0, 0, (18 * Math.PI) / 180]}>
              <group ref={cutterRollerRef}>
                <mesh geometry={helicalCutterGeom} onPointerDown={(e) => handlePointerDown(e, 'cutter_blade')}>
                  {getPartMaterial('cutter_blade', 0xf59e0b)}
                </mesh>
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

          {/* Hexagonal Pencil */}
          <group position={[-6.0, 0, 0]}>
            <mesh geometry={pencilGeoms.body} onPointerDown={(e) => handlePointerDown(e, 'pencil')}>
              {getPartMaterial('pencil', 0xfacc15)}
            </mesh>
            <mesh geometry={pencilGeoms.cone} position={[12.0, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'pencil')}>
              {getPartMaterial('pencil', 0xfde68a)}
            </mesh>
            <mesh geometry={pencilGeoms.lead} position={[14.2, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'pencil')}>
              {getPartMaterial('pencil', 0x1e293b)}
            </mesh>
          </group>

          {/* Rear Crank Handle */}
          <group ref={crankHandleRef} position={[12.0 + factor * 8, 0, 0]}>
            <mesh position={[0, 4.5, 0]} onPointerDown={(e) => handlePointerDown(e, 'crank')}>
              <boxGeometry args={[2.0, 9.0, 1.4]} />
              {getPartMaterial('crank', 0x64748b)}
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'crank')}>
              <cylinderGeometry args={[1.5, 1.5, 6.0, 16]} />
              {getPartMaterial('crank', 0x94a3b8)}
            </mesh>
            <mesh position={[0, 8.5, 4.0]} rotation={[Math.PI / 2, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'crank')}>
              <cylinderGeometry args={[1.8, 1.4, 5.0, 16]} />
              {getPartMaterial('crank', 0xef4444)}
            </mesh>
          </group>
        </group>
      )}

      {/* ========================================================================= */}
      {/* 2. PRESET: MUSICBOX (태엽 오르골 정밀 풀 어셈블리 & 다단 감속/거버너) */}
      {/* ========================================================================= */}
      {activePreset.id === 'musicbox' && (
        <group>
          {/* [Part 1] Heavy Cast Chassis Base Bed Plate (주물 베이스 플레이트) */}
          <mesh position={[0, -4.5 - factor * 6, 0]} onPointerDown={(e) => handlePointerDown(e, 'base_bed')}>
            <boxGeometry args={[26.0, 2.5, 18.0]} />
            {getPartMaterial('base_bed', 0x475569)}
          </mesh>

          {/* [Part 2] Spring Barrel Housing & Butterfly Winding Key */}
          <group position={[-8.5 - factor * 7, 0, 0]}>
            {/* Spring Drum Cylinder */}
            <mesh rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'spring_drum')}>
              <cylinderGeometry args={[5.0, 5.0, 5.0, 24]} />
              {getPartMaterial('spring_drum', 0xb45309)}
            </mesh>
            {/* Butterfly Winding Key on Top/Bottom */}
            <group ref={winderKeyRef} position={[0, 5.0 + factor * 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh geometry={windingKeyGeom} onPointerDown={(e) => handlePointerDown(e, 'winding_key')}>
                {getPartMaterial('winding_key', 0xd97706)}
              </mesh>
            </group>
          </group>

          {/* [Part 3] Melody Pin Cylinder Drum (돌기 핀 드럼) */}
          <group ref={drumRef} position={[1.5, 0, 0]}>
            <mesh geometry={musicDrumGeom} rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'pin_drum')}>
              {getPartMaterial('pin_drum', 0xf59e0b)}
            </mesh>
            {/* Main Drum Spur Drive Gear */}
            <mesh geometry={drumDriveGearGeom} position={[8.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'drum_gear')}>
              {getPartMaterial('drum_gear', 0x38bdf8)}
            </mesh>
          </group>

          {/* [Part 4] 18-Tooth Tuned Steel Comb Reeds Plaque (금속 빗살 음판) */}
          <mesh
            geometry={combReedsGeom}
            position={[1.5, -2.5, 5.5 + factor * 6]}
            rotation={[Math.PI / 2, 0, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'comb_reeds')}
          >
            {getPartMaterial('comb_reeds', 0x94a3b8)}
          </mesh>

          {/* [Part 5] Multi-Stage Speed Step-Up Gear Train */}
          <group ref={intermediateGearRef} position={[10.5, 3.5 + factor * 4, 0]}>
            <mesh geometry={intermediatePinionGeom} rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'stepup_gear')}>
              {getPartMaterial('stepup_gear', 0xec4899)}
            </mesh>
          </group>

          {/* [Part 6] High-Speed Air Drag Governor Fly-Fan (8x Speed Stabilizer) */}
          <group
            ref={governorFanRef}
            position={[10.5, 7.5 + factor * 6, 0]}
          >
            <mesh geometry={governorGeom} onPointerDown={(e) => handlePointerDown(e, 'governor_fan')}>
              {getPartMaterial('governor_fan', 0x10b981)}
            </mesh>
            {/* Worm Drive Shaft Pinion */}
            <mesh geometry={governorWormGearGeom} position={[0, -3.5, 0]} rotation={[Math.PI / 2, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'governor_fan')}>
              {getPartMaterial('governor_fan', 0x64748b)}
            </mesh>
          </group>
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
