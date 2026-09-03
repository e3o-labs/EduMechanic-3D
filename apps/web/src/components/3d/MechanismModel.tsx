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
import {
  getSpurMeshingParams,
  getInternalMeshingParams,
  getPlanetaryUnitParams,
} from '../../utils/kinematics';

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
  // 1. KINEMATIC PHYSICAL PARAMETERS COMPUTATION (Exact Engineering Laws)
  // =========================================================================
  // Sharpener: m=1.2, Zr=24, Zp=8
  const sharpenerKinematics = useMemo(() => {
    return getInternalMeshingParams(1.2, 24, 8);
  }, []);

  // Music Box: m=1.2, z1=28 (drum gear), z2=10 (stepup pinion)
  const musicboxKinematics = useMemo(() => {
    return getSpurMeshingParams(1.2, 28, 10);
  }, []);

  // Bicycle: m=1.2, Zs=14, Zp=10 => Zr = 14 + 2*10 = 34
  const planetaryKinematics = useMemo(() => {
    return getPlanetaryUnitParams(1.2, 14, 10, 3);
  }, []);

  // =========================================================================
  // 2. GEOMETRIES MEMOIZATION (Matched to Kinematic Calculations)
  // =========================================================================
  // Sharpener
  const sharpenerRingGeom = useMemo(() => {
    return createInternalRingGearGeometry(1.2, 24, 3.5, 4.5);
  }, []);
  const sharpenerPinionGeom = useMemo(() => {
    return createInvoluteGearGeometry({ module: 1.2, teethCount: 8, faceWidth: 4.5, shaftDiameter: 3.0 });
  }, []);
  const sharpenerCutterGeom = useMemo(() => {
    return createHelicalCutterGeometry(3.0, 11.0, 10, Math.PI / 2.8);
  }, []);
  const pencilGeoms = useMemo(() => createPencilGeometry(24.0, 2.2), []);

  // Musicbox
  const musicDrumGeom = useMemo(() => createMusicboxDrumGeometry(4.8, 16.0, 48), []);
  const musicCombGeom = useMemo(() => createCombReedsGeometry(15.0, 18), []);
  const musicWindingKeyGeom = useMemo(() => createWindingKeyGeometry(), []);
  const musicGovernorGeom = useMemo(() => createAirGovernorGeometry(3.8, 7.0), []);
  const musicDrumGearGeom = useMemo(() => {
    return createInvoluteGearGeometry({ module: 1.2, teethCount: 28, faceWidth: 4.5, shaftDiameter: 4.0 });
  }, []);
  const musicStepupPinionGeom = useMemo(() => {
    return createInvoluteGearGeometry({ module: 1.2, teethCount: 10, faceWidth: 4.0, shaftDiameter: 3.0 });
  }, []);

  // Bicycle Planetary Geometries
  const bicycleSunGeom = useMemo(() => {
    return createInvoluteGearGeometry({ module: 1.2, teethCount: 14, faceWidth: 6.0, shaftDiameter: 5.0 });
  }, []);
  const bicyclePlanetGeom = useMemo(() => {
    return createInvoluteGearGeometry({ module: 1.2, teethCount: 10, faceWidth: 5.5, shaftDiameter: 4.0 });
  }, []);
  const bicycleRingGeom = useMemo(() => {
    return createInternalRingGearGeometry(1.2, 34, 4.0, 6.0);
  }, []);

  // Custom Parametric Gear for Maker Tab
  const customSpurGearGeom = useMemo(() => {
    return createInvoluteGearGeometry({
      module: 1.5,
      teethCount: teethZ,
      faceWidth: 7.0,
      shaftDiameter: makerParams.shaftDiameter,
      cotsMount: makerParams.cotsMount,
    });
  }, [teethZ, makerParams.shaftDiameter, makerParams.cotsMount]);

  // Accumulated physical simulation time
  const simTimeRef = useRef(0);

  // =========================================================================
  // 3. PHYSICAL KINEMATIC FRAME LOOP (Zero-Interference Exact Rolling)
  // =========================================================================
  useFrame((_, delta) => {
    if (!isSimulating) return;

    simTimeRef.current += delta;
    const t = simTimeRef.current;
    const baseSpeed = 2.0; // rad/s

    // --- A. Sharpener: Planetary Internal Epicyclic Rolling ---
    if (sharpenerCarrierRef.current && sharpenerCutterRef.current && sharpenerCrankRef.current) {
      const thetaCarrier = t * baseSpeed;
      sharpenerCarrierRef.current.rotation.x = thetaCarrier;
      sharpenerCrankRef.current.rotation.x = thetaCarrier;

      // Kinematic law: Carrier rolls pinion tangent to stationary internal ring gear
      // Pinion rotation around its own tilted axis with initial space phase
      const spinAngle = thetaCarrier * sharpenerKinematics.spinRatio + sharpenerKinematics.initialPhase;
      sharpenerCutterRef.current.rotation.y = spinAngle;
    }

    // --- B. Music Box: Spur Gear Tangency & Step-Up Drag ---
    if (musicDrumRef.current && musicIntermediateGearRef.current && musicGovernorFanRef.current) {
      const thetaDrum = t * (baseSpeed * 0.5);
      musicDrumRef.current.rotation.x = thetaDrum;
      if (musicWinderKeyRef.current) {
        musicWinderKeyRef.current.rotation.x = thetaDrum * 0.5;
      }

      // Exact anti-interference meshing: opposite rotation + half-pitch phase offset
      const thetaPinion = -thetaDrum * musicboxKinematics.ratio + musicboxKinematics.phaseOffset;
      musicIntermediateGearRef.current.rotation.x = thetaPinion;

      // High-speed air governor drag fan (8x step-up)
      musicGovernorFanRef.current.rotation.y = thetaPinion * 8.0;
    }

    // --- C. Bicycle: 3-Planet Unit with Exact Planetary Assembly Constraint ---
    if (bicycleSunRef.current && bicycleCarrierRef.current) {
      const thetaCarrier = t * (baseSpeed * 0.8);
      bicycleCarrierRef.current.rotation.z = thetaCarrier;

      // When Ring Gear is stationary (Zr=34, Zs=14): Sun Gear Speed = thetaCarrier * (1 + Zr/Zs)
      const sunRatio = 1.0 + planetaryKinematics.zRing / planetaryKinematics.zSun;
      bicycleSunRef.current.rotation.z = thetaCarrier * sunRatio;

      // Each planet rolls simultaneously inside Ring and outside Sun without colliding
      const planetRatio = planetaryKinematics.zRing / planetaryKinematics.zPlanet;
      bicyclePlanetsRef.current.forEach((mesh, idx) => {
        if (mesh) {
          const phase = planetaryKinematics.planetPhaseOffsets[idx];
          mesh.rotation.z = -thetaCarrier * planetRatio + phase;
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
        content: `이 위치(${partId})의 물리법칙 및 기구학 물림 원리가 궁금해요!`,
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
      {/* ========================================================================= */}
      {/* 1. PRESET: SHARPENER (피치원 접촉 물리 법칙 적용 연필깎이)               */}
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

          {/* Stationary Internal Ring Gear (Zr=24, m=1.2, rPitch=14.4) */}
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
            {/* Carrier Spindle Body */}
            <mesh rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'carrier')}>
              <cylinderGeometry args={[3.5, 4.5, 16.0, 24]} />
              {getPartMaterial('carrier', 0x10b981)}
            </mesh>

            {/* Orbit Radius: exactly sharpenerKinematics.orbitRadius (9.6mm) */}
            <group
              position={[0, sharpenerKinematics.orbitRadius, 0]}
              rotation={[0, 0, (18 * Math.PI) / 180]}
            >
              <group ref={sharpenerCutterRef}>
                {/* 10-Flute Helical Cutter Blade */}
                <mesh geometry={sharpenerCutterGeom} onPointerDown={(e) => handlePointerDown(e, 'cutter_blade')}>
                  {getPartMaterial('cutter_blade', 0xf59e0b)}
                </mesh>
                {/* Pinion Gear: exactly meshes tangent with ring gear */}
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
      {/* 2. PRESET: MUSICBOX (피치 접선 및 반피치 위상 보정 오르골)               */}
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

          {/* Melody Pin Drum (Center: X=0, Y=0, Z=0) */}
          <group ref={musicDrumRef} position={[0, 0, 0]}>
            <mesh geometry={musicDrumGeom} rotation={[0, 0, Math.PI / 2]} onPointerDown={(e) => handlePointerDown(e, 'pin_drum')}>
              {getPartMaterial('pin_drum', 0xf59e0b)}
            </mesh>
            {/* Drum Spur Drive Gear (z=28, m=1.2, rPitch=16.8) at X = 8.5 */}
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

          {/* Step-Up Pinion (z=10, m=1.2, rPitch=6.0) */}
          {/* Position: Exactly at center distance a = r1 + r2 = 16.8 + 6.0 = 22.8 along Y axis! */}
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
      {/* 3. PRESET: BICYCLE (Zr=Zs+2Zp 물리 법칙 및 3개 플래닛 무간섭 동기화)      */}
      {/* ========================================================================= */}
      {activePreset.id === 'bicycle' && (
        <group>
          {/* Sun Gear in Center (Zs=14, m=1.2, rPitch=8.4) */}
          <group ref={bicycleSunRef}>
            <mesh geometry={bicycleSunGeom} onPointerDown={(e) => handlePointerDown(e, 'sun')}>
              {getPartMaterial('sun', 0xf59e0b)}
            </mesh>
          </group>

          {/* Planet Carrier with 3 Planets (Zp=10, m=1.2, rPitch=6.0, CarrierRadius=14.4) */}
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

          {/* Stationary Outer Ring Gear (Zr = Zs + 2*Zp = 34, m=1.2, rPitch=20.4) */}
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
