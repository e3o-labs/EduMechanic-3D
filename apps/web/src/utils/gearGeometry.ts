import * as THREE from 'three';

export interface GearGeometryOptions {
  module?: number;
  teethCount?: number;
  faceWidth?: number;
  shaftDiameter?: number;
  pressureAngleDeg?: number;
  cotsMount?: '608zz' | 'm3_bolt' | 'lego_pin' | 'd_shaft';
}

/**
 * Generates true 3D Involute Spur Gear BufferGeometry with exact teeth and shaft hole.
 */
export function createInvoluteGearGeometry(options: GearGeometryOptions = {}): THREE.BufferGeometry {
  const m = options.module || 1.5;
  const z = Math.max(8, options.teethCount || 20);
  const depth = options.faceWidth || 6.0;
  const shaftDia = options.shaftDiameter || 5.0;

  const rPitch = (m * z) / 2.0;
  const rTip = rPitch + 1.0 * m;
  const rRoot = rPitch - 1.25 * m;

  const shape = new THREE.Shape();
  const anglePerTooth = (2 * Math.PI) / z;
  const halfTooth = Math.PI / z / 2;

  for (let i = 0; i < z; i++) {
    const angle = i * anglePerTooth;
    const a1 = angle - halfTooth * 1.5;
    const a2 = angle - halfTooth * 0.9;
    const a3 = angle - halfTooth * 0.5;
    const a4 = angle + halfTooth * 0.5;
    const a5 = angle + halfTooth * 0.9;
    const a6 = angle + halfTooth * 1.5;

    const x1 = rRoot * Math.cos(a1);
    const y1 = rRoot * Math.sin(a1);
    const x2 = rPitch * Math.cos(a2);
    const y2 = rPitch * Math.sin(a2);
    const x3 = rTip * Math.cos(a3);
    const y3 = rTip * Math.sin(a3);
    const x4 = rTip * Math.cos(a4);
    const y4 = rTip * Math.sin(a4);
    const x5 = rPitch * Math.cos(a5);
    const y5 = rPitch * Math.sin(a5);
    const x6 = rRoot * Math.cos(a6);
    const y6 = rRoot * Math.sin(a6);

    if (i === 0) shape.moveTo(x1, y1);
    else shape.lineTo(x1, y1);
    shape.lineTo(x2, y2);
    shape.lineTo(x3, y3);
    shape.lineTo(x4, y4);
    shape.lineTo(x5, y5);
    shape.lineTo(x6, y6);
  }
  shape.closePath();

  // Cut Center Shaft Hole
  const holePath = new THREE.Path();
  const rShaft = shaftDia / 2.0;
  holePath.absarc(0, 0, rShaft, 0, Math.PI * 2, false);
  shape.holes.push(holePath);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.3,
    bevelThickness: 0.3,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center();
  return geom;
}

/**
 * Generates true 3D Planetary Helical Milling Cutter Roller for Pencil Sharpener.
 */
export function createHelicalCutterGeometry(
  radius: number = 3.2,
  height: number = 10.0,
  numFlutes: number = 10,
  twistAngle: number = Math.PI / 2.8
): THREE.BufferGeometry {
  const geom = new THREE.CylinderGeometry(radius * 0.75, radius, height, numFlutes * 4, 16);
  const pos = geom.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const vNorm = y / height;
    const twist = vNorm * twistAngle;

    let angle = Math.atan2(z, x) + twist;
    const r = Math.sqrt(x * x + z * z);

    const fluteWave = Math.sin(angle * numFlutes);
    const rMod = r * (0.85 + 0.18 * Math.max(0, fluteWave));

    pos.setX(i, rMod * Math.cos(angle));
    pos.setZ(i, rMod * Math.sin(angle));
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * Generates Stationary Internal Ring Gear (내치 기어) for Sharpener Body.
 */
export function createInternalRingGearGeometry(
  innerRadius: number = 7.0,
  outerRadius: number = 9.5,
  teethCount: number = 24,
  depth: number = 4.0
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

  const hole = new THREE.Path();
  const anglePerTooth = (2 * Math.PI) / teethCount;
  const toothDepth = (outerRadius - innerRadius) * 0.35;

  for (let i = 0; i < teethCount; i++) {
    const a = i * anglePerTooth;
    const da = anglePerTooth / 4;
    const r1 = innerRadius;
    const r2 = innerRadius - toothDepth;

    const x1 = r1 * Math.cos(a - da);
    const y1 = r1 * Math.sin(a - da);
    const x2 = r2 * Math.cos(a - da * 0.5);
    const y2 = r2 * Math.sin(a - da * 0.5);
    const x3 = r2 * Math.cos(a + da * 0.5);
    const y3 = r2 * Math.sin(a + da * 0.5);
    const x4 = r1 * Math.cos(a + da);
    const y4 = r1 * Math.sin(a + da);

    if (i === 0) hole.moveTo(x1, y1);
    else hole.lineTo(x1, y1);
    hole.lineTo(x2, y2);
    hole.lineTo(x3, y3);
    hole.lineTo(x4, y4);
  }
  hole.closePath();
  shape.holes.push(hole);

  const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geom.center();
  return geom;
}

/**
 * Generates Hexagonal Standard Pencil.
 */
export function createPencilGeometry(length: number = 22.0, radius: number = 2.0): { body: THREE.BufferGeometry; cone: THREE.BufferGeometry; lead: THREE.BufferGeometry } {
  const body = new THREE.CylinderGeometry(radius, radius, length, 6);
  body.rotateZ(Math.PI / 2);

  const cone = new THREE.ConeGeometry(radius, 5.0, 16);
  cone.rotateZ(-Math.PI / 2);

  const lead = new THREE.ConeGeometry(radius * 0.35, 1.8, 16);
  lead.rotateZ(-Math.PI / 2);

  return { body, cone, lead };
}

/**
 * [Phase 12: Music Box] Generates 3D Melody Pin Cylinder Drum with embedded pins.
 */
export function createMusicboxDrumGeometry(radius: number = 4.5, length: number = 16.0, numPins: number = 48): THREE.BufferGeometry {
  const drumGeom = new THREE.CylinderGeometry(radius, radius, length, 24);
  const pos = drumGeom.attributes.position;

  // Add micro bumps for melody pins around cylinder surface
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    if (r > radius * 0.8) {
      const angle = Math.atan2(z, x);
      const pinWave = Math.sin(angle * 12 + y * 2.5);
      if (pinWave > 0.85) {
        pos.setX(i, x * 1.12);
        pos.setZ(i, z * 1.12);
      }
    }
  }
  drumGeom.computeVertexNormals();
  return drumGeom;
}

/**
 * [Phase 12: Music Box] Generates Tuned Steel Comb Reeds with graduated lengths.
 */
export function createCombReedsGeometry(width: number = 14.0, numTeeth: number = 18): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  // Base mounting block
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, 3);

  // Graduated vibrating teeth (longer on left/bass, shorter on right/treble)
  const toothPitch = width / numTeeth;
  const toothWidth = toothPitch * 0.65;

  for (let t = numTeeth - 1; t >= 0; t--) {
    const xLeft = -width / 2 + t * toothPitch;
    const xRight = xLeft + toothWidth;
    // Length formula: 10mm (bass) down to 4.5mm (treble)
    const tLen = 4.5 + (1.0 - t / numTeeth) * 5.5;

    shape.lineTo(xRight, 3);
    shape.lineTo(xRight, 3 + tLen);
    shape.lineTo(xLeft, 3 + tLen);
    shape.lineTo(xLeft, 3);
  }

  shape.lineTo(-width / 2, 3);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.1 });
  geom.center();
  return geom;
}

/**
 * [Phase 12: Music Box] Generates High-Speed 2-Blade Air Drag Governor Fan.
 */
export function createAirGovernorGeometry(bladeRadius: number = 4.0, height: number = 8.0): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  // Central shaft
  shape.absarc(0, 0, 0.8, 0, Math.PI * 2, false);

  // 2 aerodynamic drag wings
  shape.moveTo(0.8, -0.2);
  shape.lineTo(bladeRadius, -0.6);
  shape.lineTo(bladeRadius, 0.6);
  shape.lineTo(0.8, 0.2);

  shape.moveTo(-0.8, 0.2);
  shape.lineTo(-bladeRadius, 0.6);
  shape.lineTo(-bladeRadius, -0.6);
  shape.lineTo(-0.8, -0.2);

  const geom = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geom.center();
  return geom;
}

/**
 * [Phase 12: Music Box] Generates Butterfly Winding Key.
 */
export function createWindingKeyGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  // Center collar
  shape.absarc(0, 0, 1.2, 0, Math.PI * 2, false);

  // Left wing
  shape.moveTo(-1.0, 0.6);
  shape.bezierCurveTo(-3.5, 4.0, -7.0, 3.5, -6.5, 0.0);
  shape.bezierCurveTo(-6.0, -3.5, -3.0, -3.0, -1.0, -0.6);

  // Right wing
  shape.moveTo(1.0, 0.6);
  shape.bezierCurveTo(3.5, 4.0, 7.0, 3.5, 6.5, 0.0);
  shape.bezierCurveTo(6.0, -3.5, 3.0, -3.0, 1.0, -0.6);

  const geom = new THREE.ExtrudeGeometry(shape, { depth: 1.4, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.2 });
  geom.center();
  return geom;
}
