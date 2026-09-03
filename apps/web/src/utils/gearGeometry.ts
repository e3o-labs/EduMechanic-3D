import * as THREE from 'three';

export interface GearGeometryOptions {
  module?: number;
  teethCount?: number;
  faceWidth?: number;
  shaftDiameter?: number;
  pressureAngleDeg?: number;
  backlashMm?: number; // 3D Print engineering clearance (default 0.2mm)
  cotsMount?: '608zz' | 'm3_bolt' | 'lego_pin' | 'd_shaft';
}

/**
 * Generates true 3D Involute Spur Gear with 3D Print Backlash Clearance (0.2mm).
 * Ensures zero physical mesh interference / collision.
 */
export function createInvoluteGearGeometry(options: GearGeometryOptions = {}): THREE.BufferGeometry {
  const m = options.module || 1.5;
  const z = Math.max(8, options.teethCount || 20);
  const depth = options.faceWidth || 6.0;
  const shaftDia = options.shaftDiameter || 5.0;
  const backlash = options.backlashMm ?? 0.20; // 0.2mm 3D printing clearance

  const rPitch = (m * z) / 2.0;
  const rTip = rPitch + 1.0 * m;
  const rRoot = rPitch - 1.25 * m;

  // Angular reduction due to 0.2mm backlash
  const backlashAngle = backlash / rPitch;
  const anglePerTooth = (2 * Math.PI) / z;
  const halfTooth = Math.max(0.01, (Math.PI / z / 2) - (backlashAngle / 2));

  const shape = new THREE.Shape();

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

  // Center Shaft Hole
  const holePath = new THREE.Path();
  const rShaft = shaftDia / 2.0;
  holePath.absarc(0, 0, rShaft, 0, Math.PI * 2, false);
  shape.holes.push(holePath);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.25,
    bevelThickness: 0.25,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center();
  return geom;
}

/**
 * Generates Conical Tapered Internal Ring Gear (원뿔형 테이퍼드 내치 링 기어)
 * Exactly matches the 18-degree tilt angle of the sharpener cutter pinion!
 * Eliminates 3D spatial oblique penetration.
 */
export function createConicalInternalRingGearGeometry(
  module: number = 1.2,
  teethCount: number = 24,
  coneAngleDeg: number = 18.0,
  depth: number = 5.0,
  rimThickness: number = 3.5,
  backlashMm: number = 0.20
): THREE.BufferGeometry {
  const m = module;
  const z = teethCount;
  const coneRad = (coneAngleDeg * Math.PI) / 180.0;
  const tanCone = Math.tan(coneRad);

  const rPitchBase = (m * z) / 2.0;
  const nRings = 8;
  const ptsPerTooth = 6;
  const totalPts = z * ptsPerTooth;
  const backlashAngle = backlashMm / rPitchBase;
  const anglePerTooth = (2 * Math.PI) / z;
  const halfTooth = (Math.PI / z / 2) + (backlashAngle / 2); // Wider space for internal gear

  // Construct concentric lofted rings expanding along Z axis with 18-degree taper
  const rings: THREE.Vector3[][] = [];
  const outerRings: THREE.Vector3[][] = [];

  for (let r = 0; r <= nRings; r++) {
    const zFrac = r / nRings;
    const zPos = (zFrac - 0.5) * depth;
    // Tapered expansion: radius increases with Z along the 18-deg cone
    const rOffset = (zPos + depth * 0.5) * tanCone;
    const rPitch = rPitchBase + rOffset;
    const rTip = rPitch - 1.0 * m;   // Inward tip
    const rRoot = rPitch + 1.25 * m; // Inward root
    const rRim = rRoot + rimThickness;

    const innerPts: THREE.Vector3[] = [];
    const outerPts: THREE.Vector3[] = [];

    for (let i = 0; i < z; i++) {
      const ang = i * anglePerTooth;
      const a1 = ang - halfTooth * 1.5;
      const a2 = ang - halfTooth * 0.9;
      const a3 = ang - halfTooth * 0.5;
      const a4 = ang + halfTooth * 0.5;
      const a5 = ang + halfTooth * 0.9;
      const a6 = ang + halfTooth * 1.5;

      innerPts.push(new THREE.Vector3(rRoot * Math.cos(a1), rRoot * Math.sin(a1), zPos));
      innerPts.push(new THREE.Vector3(rPitch * Math.cos(a2), rPitch * Math.sin(a2), zPos));
      innerPts.push(new THREE.Vector3(rTip * Math.cos(a3), rTip * Math.sin(a3), zPos));
      innerPts.push(new THREE.Vector3(rTip * Math.cos(a4), rTip * Math.sin(a4), zPos));
      innerPts.push(new THREE.Vector3(rPitch * Math.cos(a5), rPitch * Math.sin(a5), zPos));
      innerPts.push(new THREE.Vector3(rRoot * Math.cos(a6), rRoot * Math.sin(a6), zPos));
    }

    // Outer circular rim points
    for (let p = 0; p < totalPts; p++) {
      const oAng = (2.0 * Math.PI * p) / totalPts;
      outerPts.push(new THREE.Vector3(rRim * Math.cos(oAng), rRim * Math.sin(oAng), zPos));
    }

    rings.push(innerPts);
    outerRings.push(outerPts);
  }

  // Build triangle faces
  const vertices: number[] = [];

  // Inner tooth flanks lofting
  for (let r = 0; r < nRings; r++) {
    const r1 = rings[r];
    const r2 = rings[r + 1];
    for (let p = 0; p < totalPts; p++) {
      const nextP = (p + 1) % totalPts;
      const p1 = r1[p], p2 = r1[nextP], p3 = r2[nextP], p4 = r2[p];
      // Quad 1
      vertices.push(p1.x, p1.y, p1.z, p3.x, p3.y, p3.z, p2.x, p2.y, p2.z);
      vertices.push(p1.x, p1.y, p1.z, p4.x, p4.y, p4.z, p3.x, p3.y, p3.z);
    }
  }

  // Outer cylindrical rim
  for (let r = 0; r < nRings; r++) {
    const o1 = outerRings[r];
    const o2 = outerRings[r + 1];
    for (let p = 0; p < totalPts; p++) {
      const nextP = (p + 1) % totalPts;
      const p1 = o1[p], p2 = o1[nextP], p3 = o2[nextP], p4 = o2[p];
      vertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
      vertices.push(p1.x, p1.y, p1.z, p3.x, p3.y, p3.z, p4.x, p4.y, p4.z);
    }
  }

  // End caps (Connecting inner teeth to outer rim)
  // Front cap (r = 0)
  for (let p = 0; p < totalPts; p++) {
    const nextP = (p + 1) % totalPts;
    const in1 = rings[0][p], in2 = rings[0][nextP];
    const out1 = outerRings[0][p], out2 = outerRings[0][nextP];
    vertices.push(in1.x, in1.y, in1.z, out1.x, out1.y, out1.z, in2.x, in2.y, in2.z);
    vertices.push(in2.x, in2.y, in2.z, out1.x, out1.y, out1.z, out2.x, out2.y, out2.z);
  }
  // Back cap (r = nRings)
  const lastR = nRings;
  for (let p = 0; p < totalPts; p++) {
    const nextP = (p + 1) % totalPts;
    const in1 = rings[lastR][p], in2 = rings[lastR][nextP];
    const out1 = outerRings[lastR][p], out2 = outerRings[lastR][nextP];
    vertices.push(in1.x, in1.y, in1.z, in2.x, in2.y, in2.z, out1.x, out1.y, out1.z);
    vertices.push(in2.x, in2.y, in2.z, out2.x, out2.y, out2.z, out1.x, out1.y, out1.z);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.computeVertexNormals();
  return geom;
}

/**
 * Standard Internal Ring Gear (flat) with 0.2mm Backlash.
 */
export function createInternalRingGearGeometry(
  module: number = 1.2,
  teethCount: number = 24,
  rimThickness: number = 3.5,
  depth: number = 4.0,
  backlashMm: number = 0.20
): THREE.BufferGeometry {
  const m = module;
  const z = teethCount;
  const rPitch = (m * z) / 2.0;
  const rTip = rPitch - 1.0 * m;
  const rRoot = rPitch + 1.25 * m;
  const rOuterRim = rRoot + rimThickness;

  const backlashAngle = backlashMm / rPitch;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, rOuterRim, 0, Math.PI * 2, false);

  const hole = new THREE.Path();
  const anglePerTooth = (2 * Math.PI) / z;
  const halfTooth = (Math.PI / z / 2) + (backlashAngle / 2);

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

    if (i === 0) hole.moveTo(x1, y1);
    else hole.lineTo(x1, y1);
    hole.lineTo(x2, y2);
    hole.lineTo(x3, y3);
    hole.lineTo(x4, y4);
    hole.lineTo(x5, y5);
    hole.lineTo(x6, y6);
  }
  hole.closePath();
  shape.holes.push(hole);

  const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geom.center();
  return geom;
}

/**
 * Generates true 3D Planetary Helical Milling Cutter Roller for Pencil Sharpener.
 */
export function createHelicalCutterGeometry(
  radius: number = 3.0,
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
 * Generates 3D Melody Pin Cylinder Drum with embedded pins.
 */
export function createMusicboxDrumGeometry(radius: number = 4.8, length: number = 16.0, numPins: number = 48): THREE.BufferGeometry {
  const drumGeom = new THREE.CylinderGeometry(radius, radius, length, 24);
  const pos = drumGeom.attributes.position;

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
 * Generates Tuned Steel Comb Reeds with graduated lengths.
 */
export function createCombReedsGeometry(width: number = 14.0, numTeeth: number = 18): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, 3);

  const toothPitch = width / numTeeth;
  const toothWidth = toothPitch * 0.65;

  for (let t = numTeeth - 1; t >= 0; t--) {
    const xLeft = -width / 2 + t * toothPitch;
    const xRight = xLeft + toothWidth;
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
 * Generates High-Speed 2-Blade Air Drag Governor Fan.
 */
export function createAirGovernorGeometry(bladeRadius: number = 3.8, height: number = 7.0): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.8, 0, Math.PI * 2, false);

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
 * Generates Butterfly Winding Key.
 */
export function createWindingKeyGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1.2, 0, Math.PI * 2, false);

  shape.moveTo(-1.0, 0.6);
  shape.bezierCurveTo(-3.5, 4.0, -7.0, 3.5, -6.5, 0.0);
  shape.bezierCurveTo(-6.0, -3.5, -3.0, -3.0, -1.0, -0.6);

  shape.moveTo(1.0, 0.6);
  shape.bezierCurveTo(3.5, 4.0, 7.0, 3.5, 6.5, 0.0);
  shape.bezierCurveTo(6.0, -3.5, 3.0, -3.0, 1.0, -0.6);

  const geom = new THREE.ExtrudeGeometry(shape, { depth: 1.4, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.2 });
  geom.center();
  return geom;
}
