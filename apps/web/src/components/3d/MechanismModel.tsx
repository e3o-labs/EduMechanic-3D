'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import {
  createInvoluteGearGeometry,
  createHelicalCutterGeometry,
  createInternalRingGearGeometry,
  createConicalInternalRingGearGeometry,
  createPencilGeometry,
  createMusicboxDrumGeometry,
  createCombReedsGeometry,
  createAirGovernorGeometry,
  createWindingKeyGeometry,
} from '../../utils/gearGeometry';

import {
  getSpurMeshingParams,
  getInternalMeshingParams,
  getPlanetaryUnitParams,
  computeLineOfAction,
  LineOfActionData,
} from '../../utils/kinematics';
import {
  RotationalDynamicsSolver,
  DEFAULT_PHYSICS_CONFIGS,
  DynamicState,
} from '../../utils/physicsEngine';
import { ContactForcesOverlay } from './ContactForcesOverlay';

interface MechanismModelProps {
  onTelemetryUpdate?: (state: DynamicState) => void;
  showForceVectors?: boolean;
}

export function MechanismModel({
  onTelemetryUpdate,
  showForceVectors = true,
}: MechanismModelProps) {
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
  const sharpenerCarrierRef = useRef<THREE.Group>(null);
  const sharpenerCutterRef = useRef<THREE.Group>(null);
  const sharpenerCrankRef = useRef<THREE.Group>(null);

  // Musicbox refs
  const musicDrumRef = useRef<THREE.Group>(null);
  const musicWinderKeyRef = useRef<THREE.Group>(null);
  const musicIntermediateGearRef = useRef<THREE.Group>(null);
  const musicGovernorFanRef = useRef<THREE.Group>(null);

  // Bicycle refs
  const bicycleSunRef = useRef<THREE.Group>(null);
  const bicycleCarrierRef = useRef<THREE.Group>(null);
  const bicyclePlanetsRef = useRef<(THREE.Mesh | null)[]>([]);

  const factor = explodeValue / 100;
  const teethZ = Math.max(10, makerParams.teethCount);

  // =========================================================================
  // 1. ROTATIONAL DYNAMICS SOLVER INSTANTIATION
  // =========================================================================
  const dynamicsSolver = useMemo(() => {
    const config = DEFAULT_PHYSICS_CONFIGS[activePreset.id] || DEFAULT_PHYSICS_CONFIGS.sharpener;
    return new RotationalDynamicsSolver(config);
  }, [activePreset.id]);

  useEffect(() => {
    dynamicsSolver.reset();
  }, [activePreset.id, dynamicsSolver]);

  // =========================================================================
  // 2. KINEMATIC PHYSICAL PARAMETERS COMPUTATION
  // =========================================================================
  const sharpenerKinematics = useMemo(() => getInternalMeshingParams(1.2, 24, 8), []);
  const musicboxKinematics = useMemo(() => getSpurMeshingParams(1.2, 28, 10), []);
  const planetaryKinematics = useMemo(() => getPlanetaryUnitParams(1.2, 14, 10, 3), []);

  // Line of Action Data State
  const [lineOfActionData, setLineOfActionData] = useState<LineOfActionData | null>(null);

  // =========================================================================
  // 3. GEOMETRIES MEMOIZATION
  // =========================================================================
  // Sharpener: Conical Tapered Internal Ring Gear (18 deg) for zero 3D oblique collision!
  const sharpenerRingGeom = useMemo(() => {
    return createConicalInternalRingGearGeometry(1.2, 24, 18.0, 5.5, 3.5, 0.20);
  }, []);
  const sharpenerPinionGeom = useMemo(() => {
    return createInvoluteGearGeometry({ module: 1.2, teethCount: 8, faceWidth: 4.5, shaftDiameter: 3.0, backlashMm: 0.20 });
  }, []);
  const sharpenerCutterGeom = useMemo(() => createHelicalCutterGeometry(3.0, 11.0, 10, Math.PI / 2.8), []);
  const pencilGeoms = useMemo(() => createPencilGeometry(24.0, 2.2), []);

  const musicDrumGeom = useMemo(() => createMusicboxDrumGeometry(4.8, 16.0, 48), []);
  const musicCombGeom = useMemo(() => createCombReedsGeometry(15.0, 18), []);
  const musicWindingKeyGeom = useMemo(() => createWindingKeyGeometry(), []);
  const musicGovernorGeom = useMemo(() => createAirGovernorGeometry(3.8, 7.0), []);
  const musicDrumGearGeom = useMemo(() => createInvoluteGearGeometry({ module: 1.2, teethCount: 28, faceWidth: 4.5, shaftDiameter: 4.0 }), []);
  const musicStepupPinionGeom = useMemo(() => createInvoluteGearGeometry({ module: 1.2, teethCount: 10, faceWidth: 4.0, shaftDiameter: 3.0 }), []);

  const bicycleSunGeom = useMemo(() => createInvoluteGearGeometry({ module: 1.2, teethCount: 14, faceWidth: 6.0, shaftDiameter: 5.0 }), []);
  const bicyclePlanetGeom = useMemo(() => createInvoluteGearGeometry({ module: 1.2, teethCount: 10, faceWidth: 5.5, shaftDiameter: 4.0 }), []);
  const bicycleRingGeom = useMemo(() => createInternalRingGearGeometry(1.2, 34, 4.0, 6.0), []);

  // =========================================================================
  // 4. MULTI-BODY DYNAMICS FRAME LOOP (Newton-Euler Numerical Integration)
  // =========================================================================
  useFrame((_, delta) => {
    // Numerically step the rotational dynamic equations of motion
    const state = dynamicsSolver.update(delta, isSimulating);

    // Push telemetry state to parent HUD
    if (onTelemetryUpdate) {
      onTelemetryUpdate(state);
    }

    const currentTheta = state.theta;

    // --- A. Sharpener: Epicyclic Dynamic Rolling ---
    if (sharpenerCarrierRef.current && sharpenerCutterRef.current && sharpenerCrankRef.current) {
      sharpenerCarrierRef.current.rotation.x = currentTheta;
      sharpenerCrankRef.current.rotation.x = currentTheta;

      const spinAngle = currentTheta * sharpenerKinematics.spinRatio + sharpenerKinematics.initialPhase;
      sharpenerCutterRef.current.rotation.y = spinAngle;

      // Compute Line of Action at Pinion-Ring Contact
      if (showForceVectors) {
        const loa = computeLineOfAction(
          sharpenerKinematics.rPinion,
          sharpenerKinematics.rRing,
          state.torqueIn,
          spinAngle
        );
        setLineOfActionData(loa);
      }
    }

    // --- B. Music Box: Viscous & Aerodynamic Governor Drag ---
    if (musicDrumRef.current && musicIntermediateGearRef.current && musicGovernorFanRef.current) {
      musicDrumRef.current.rotation.x = currentTheta;
      if (musicWinderKeyRef.current) {
        musicWinderKeyRef.current.rotation.x = currentTheta * 0.5;
      }

      // Exact anti-interference meshing: opposite rotation + half-pitch phase offset
      const thetaPinion = -currentTheta * musicboxKinematics.ratio + musicboxKinematics.phaseOffset;
      musicIntermediateGearRef.current.rotation.x = thetaPinion;

      // 8x high-speed air governor fly-fan
      musicGovernorFanRef.current.rotation.y = thetaPinion * 8.0;

      if (showForceVectors) {
        const loa = computeLineOfAction(
          musicboxKinematics.rPitch1,
          musicboxKinematics.rPitch2,
          state.torqueIn,
          currentTheta
        );
        setLineOfActionData(loa);
      }
    }

    // --- C. Bicycle: 3-Planet Dynamics with Exact Assembly Constraint ---
    if (bicycleSunRef.current && bicycleCarrierRef.current) {
      bicycleCarrierRef.current.rotation.z = currentTheta;

      const sunRatio = 1.0 + planetaryKinematics.zRing / planetaryKinematics.zSun;
      bicycleSunRef.current.rotation.z = currentTheta * sunRatio;

      const planetRatio = planetaryKinematics.zRing / planetaryKinematics.zPlanet;
      bicyclePlanetsRef.current.forEach((mesh, idx) => {
        if (mesh) {
          const phase = planetaryKinematics.planetPhaseOffsets[idx];
          mesh.rotation.z = -currentTheta * planetRatio + phase;
        }
      });
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
        content: `이 위치(${partId})의 동역학 및 힘 전달 메커니즘이 궁금해요!`,
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
        colorToApply = '#10b981';
      } else if (partId.toLowerCase().includes('cutter') || partId.toLowerCase().includes('gear') || partId.toLowerCase().includes('blade') || partId.toLowerCase().includes('drum') || partId.toLowerCase().includes('comb')) {
        colorToApply = '#f59e0b';
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
      {/* 20-Degree Involute Line of Action and Contact Force Vector Overlay */}
      <ContactForcesOverlay
        data={lineOfActionData}
        visible={showForceVectors && isSimulating}
        position={[
          activePreset.id === 'sharpener' ? 5.5 : 8.5,
          activePreset.id === 'sharpener' ? sharpenerKinematics.orbitRadius : musicboxKinematics.rPitch1 * 0.5,
          0
        ]}
      />

      {/* ========================================================================= */}
      {/* 1. PRESET: SHARPENER (피치원 접촉 및 절삭 부하 동역학 연필깎이)          */}
      {/* ========================================================================= */}
      {activePreset.id === 'sharpener' && (
        <group>
          {/* Main Housing Shell */}
          <group position={[0, 0 + factor * 8, 0]}>
            <mesh onPointerDown={(e) => handlePointerDown(e, 'housing')}>
              <cylinderGeometry args={[16.0, 17.0, 22.0, 32, 1, true]} />
              {getPartMaterial('housing', 0x0284c7)}
            </mesh>
            <mesh position={[0, 11, 0]} onPointerDown={(e) => handlePointerDown(e, 'housing')}>
              <sphereGeometry args={[16.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              {getPartMaterial('housing', 0x0284c7)}
            </mesh>
          </group>

          {/* Clear Shavings Drawer */}
          <mesh position={[0, -12 - factor * 8, 0]} onPointerDown={(e) => handlePointerDown(e, 'drawer')}>
            <boxGeometry args={[22.0, 10.0, 24.0]} />
            {getPartMaterial('drawer', 0xe2e8f0, true)}
          </mesh>

          {/* Front Pencil Chuck */}
          <group position={[-16 - factor * 10, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh onPointerDown={(e) => handlePointerDown(e, 'chuck')}>
              <cylinderGeometry args={[7.5, 8.5, 5.0, 24]} />
              {getPartMaterial('chuck', 0x94a3b8)}
            </mesh>
            <mesh position={[4.5, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'chuck')}>
              <boxGeometry args={[3.0, 9.0, 1.2]} />
              {getPartMaterial('chuck', 0x64748b)}
            </mesh>
            <mesh position={[-4.5, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'chuck')}>
              <boxGeometry args={[3.0, 9.0, 1.2]} />
              {getPartMaterial('chuck', 0x64748b)}
            </mesh>
          </group>

          {/* Stationary Internal Ring Gear */}
          <mesh
            geometry={sharpenerRingGeom}
            position={[5.5, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'ring_gear')}
          >
            {getPartMaterial('ring_gear', 0x475569)}
          </mesh>

          {/* Rotating Planetary Carrier & Inclined Helical Cutter */}
          <group ref={sharpenerCarrierRef} position={[0, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'carrier')}>
              <cylinderGeometry args={[3.5, 4.5, 16.0, 24]} />
              {getPartMaterial('carrier', 0x10b981)}
            </mesh>

            <group
              position={[0, sharpenerKinematics.orbitRadius, 0]}
              rotation={[0, 0, (18 * Math.PI) / 180]}
            >
              <group ref={sharpenerCutterRef}>
                <mesh geometry={sharpenerCutterGeom} onPointerDown={(e) => handlePointerDown(e, 'cutter_blade')}>
                  {getPartMaterial('cutter_blade', 0xf59e0b)}
                </mesh>
                <mesh
                  geometry={sharpenerPinionGeom}
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
          <group ref={sharpenerCrankRef} position={[13.0 + factor * 8, 0, 0]}>
            <mesh position={[0, 5.0, 0]} onPointerDown={(e) => handlePointerDown(e, 'crank')}>
              <boxGeometry args={[2.0, 10.0, 1.4]} />
              {getPartMaterial('crank', 0x64748b)}
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'crank')}>
              <cylinderGeometry args={[1.5, 1.5, 6.0, 16]} />
              {getPartMaterial('crank', 0x94a3b8)}
            </mesh>
            <mesh position={[0, 9.5, 4.0]} rotation={[Math.PI / 2, 0, 0]} onPointerDown={(e) => handlePointerDown(e, 'crank')}>
              <cylinderGeometry args={[1.8, 1.4, 5.0, 16]} />
              {getPartMaterial('crank', 0xef4444)}
            </mesh>
          </group>
        </group>
      )}

      {/* ========================================================================= */}
      {/* 2. PRESET: MUSICBOX (공기역학 항력 및 태엽 탄성 동역학 오르골)           */}
      {/* ========================================================================= */}
      {activePreset.id === 'musicbox' && (
        <group>
          {/* Base Chassis Bed Plate */}
          <mesh position={[0, -5.5 - factor * 6, 0]} onPointerDown={(e) => handlePointerDown(e, 'base_bed')}>
            <boxGeometry args={[32.0, 2.5, 24.0]} />
            {getPartMaterial('base_bed', 0x475569)}
          </mesh>

          {/* Spring Barrel & Butterfly Winding Key */}
          <group position={[-10.0 - factor * 7, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'spring_drum')}>
              <cylinderGeometry args={[5.5, 5.5, 5.0, 24]} />
              {getPartMaterial('spring_drum', 0xb45309)}
            </mesh>
            <group ref={musicWinderKeyRef} position={[0, 5.5 + factor * 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh geometry={musicWindingKeyGeom} onPointerDown={(e) => handlePointerDown(e, 'winding_key')}>
                {getPartMaterial('winding_key', 0xd97706)}
              </mesh>
            </group>
          </group>

          {/* Melody Pin Drum */}
          <group ref={musicDrumRef} position={[0, 0, 0]}>
            <mesh geometry={musicDrumGeom} rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'pin_drum')}>
              {getPartMaterial('pin_drum', 0xf59e0b)}
            </mesh>
            <mesh geometry={musicDrumGearGeom} position={[8.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'drum_gear')}>
              {getPartMaterial('drum_gear', 0x38bdf8)}
            </mesh>
          </group>

          {/* Comb Reeds Plaque */}
          <mesh
            geometry={musicCombGeom}
            position={[0, -2.5, 6.0 + factor * 6]}
            rotation={[Math.PI / 2, 0, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'comb_reeds')}
          >
            {getPartMaterial('comb_reeds', 0x94a3b8)}
          </mesh>

          {/* Step-Up Pinion */}
          <group
            ref={musicIntermediateGearRef}
            position={[8.5, musicboxKinematics.centerDistance * 0.45, musicboxKinematics.centerDistance * 0.55]}
          >
            <mesh geometry={musicStepupPinionGeom} rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'stepup_gear')}>
              {getPartMaterial('stepup_gear', 0xec4899)}
            </mesh>
          </group>

          {/* High-Speed Air Drag Governor Fly-Fan */}
          <group
            ref={musicGovernorFanRef}
            position={[8.5, 8.5 + factor * 6, musicboxKinematics.centerDistance * 0.55]}
          >
            <mesh geometry={musicGovernorGeom} onPointerDown={(e) => handlePointerDown(e, 'governor_fan')}>
              {getPartMaterial('governor_fan', 0x10b981)}
            </mesh>
          </group>
        </group>
      )}

      {/* ========================================================================= */}
      {/* 3. PRESET: BICYCLE (다물체 유성기어 관성 및 토크 분배 동역학)            */}
      {/* ========================================================================= */}
      {activePreset.id === 'bicycle' && (
        <group>
          {/* Sun Gear in Center */}
          <group ref={bicycleSunRef}>
            <mesh geometry={bicycleSunGeom} onPointerDown={(e) => handlePointerDown(e, 'sun')}>
              {getPartMaterial('sun', 0xf59e0b)}
            </mesh>
          </group>

          {/* Planet Carrier with 3 Planets */}
          <group ref={bicycleCarrierRef}>
            {planetaryKinematics.planetAngles.map((angle, idx) => {
              const xPos = planetaryKinematics.carrierRadius * Math.cos(angle);
              const yPos = planetaryKinematics.carrierRadius * Math.sin(angle);
              return (
                <mesh
                  key={idx}
                  ref={(el) => {
                    bicyclePlanetsRef.current[idx] = el;
                  }}
                  geometry={bicyclePlanetGeom}
                  position={[xPos, yPos, 0]}
                  onPointerDown={(e) => handlePointerDown(e, `planet_${idx}`)}
                >
                  {getPartMaterial(`planet_${idx}`, 0x10b981)}
                </mesh>
              );
            })}

            {/* Carrier Arm Structure */}
            <mesh position={[0, 0, -3.2]}>
              <cylinderGeometry args={[planetaryKinematics.carrierRadius * 1.1, planetaryKinematics.carrierRadius * 1.1, 1.2, 32]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>

          {/* Stationary Outer Ring Gear */}
          <mesh
            geometry={bicycleRingGeom}
            position={[0, 0, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'ring')}
          >
            {getPartMaterial('ring', 0x38bdf8)}
          </mesh>
        </group>
      )}
    </group>
  );
}
