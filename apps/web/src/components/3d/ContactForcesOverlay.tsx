'use client';

import React from 'react';
import * as THREE from 'three';
import { LineOfActionData } from '../../utils/kinematics';

interface ContactForcesOverlayProps {
  data: LineOfActionData | null;
  position?: [number, number, number];
  rotation?: [number, number, number];
  visible?: boolean;
}

export function ContactForcesOverlay({
  data,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  visible = true,
}: ContactForcesOverlayProps) {
  if (!visible || !data) return null;

  const { startPoint, endPoint, contactPoint, normalForceVector, normalForceMagnitude } = data;

  // Calculate length and midpoint of Line of Action
  const pStart = new THREE.Vector3(...startPoint);
  const pEnd = new THREE.Vector3(...endPoint);
  const lengthLoA = pStart.distanceTo(pEnd);
  const midLoA = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);

  // Normal Force Vector Length
  const forceLen = Math.min(Math.max(normalForceMagnitude * 0.4, 0.5), 6.0);

  return (
    <group position={position} rotation={rotation}>
      {/* 20-deg Involute Line of Action (Action Line: Semi-transparent Yellow Cylinder Beam) */}
      <group position={[midLoA.x, midLoA.y, midLoA.z]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, lengthLoA, 8]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.65} />
        </mesh>
      </group>

      {/* Moving Contact Point Marker (Bright Orange Sphere) */}
      <mesh position={contactPoint}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#fb923c" />
      </mesh>

      {/* Normal Force Vector Arrow (Cyan Beam + Cone Arrowhead) */}
      {normalForceMagnitude > 0.05 && (
        <group position={contactPoint}>
          {/* Shaft */}
          <mesh position={[normalForceVector[0] * 0.5, 0, normalForceVector[2] * 0.5]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, forceLen, 8]} />
            <meshBasicMaterial color="#00f0ff" />
          </mesh>
          {/* Arrowhead Cone */}
          <mesh
            position={[normalForceVector[0], 0, normalForceVector[2]]}
            rotation={[0, 0, -Math.PI / 2]}
          >
            <coneGeometry args={[0.35, 0.9, 12]} />
            <meshBasicMaterial color="#00f0ff" />
          </mesh>
        </group>
      )}
    </group>
  );
}
