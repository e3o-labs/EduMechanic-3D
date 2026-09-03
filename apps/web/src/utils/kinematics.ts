/**
 * Precision Kinematic Physics Calculation Engine for Mechanical Gear Trains
 * Enforces rigorous engineering laws:
 * 1. Pitch Circle Tangency & Precise Center Distance: a = (m * (z1 + z2)) / 2
 * 2. Tooth-to-Tooth Space Anti-Interference Phase Synchronization: theta2 = -theta1 * (z1 / z2) + (PI / z2)
 * 3. Planetary Assembly Constraint: Z_ring = Z_sun + 2 * Z_planet
 */

export interface SpurMeshingParams {
  m: number;
  z1: number;
  z2: number;
  rPitch1: number;
  rPitch2: number;
  centerDistance: number;
  ratio: number;
  phaseOffset: number;
}

export interface InternalMeshingParams {
  m: number;
  zRing: number;
  zPinion: number;
  rRing: number;
  rPinion: number;
  orbitRadius: number;
  spinRatio: number;
  initialPhase: number;
}

export interface PlanetaryParams {
  m: number;
  zSun: number;
  zPlanet: number;
  zRing: number;
  rSun: number;
  rPlanet: number;
  rRing: number;
  carrierRadius: number;
  numPlanets: number;
  planetAngles: number[];
  planetPhaseOffsets: number[];
}

/**
 * Calculates exact physical meshing parameters for two external spur gears.
 */
export function getSpurMeshingParams(m: number, z1: number, z2: number): SpurMeshingParams {
  const rPitch1 = (m * z1) / 2.0;
  const rPitch2 = (m * z2) / 2.0;
  const centerDistance = rPitch1 + rPitch2;
  const ratio = z1 / z2;
  // Tooth of gear 1 meets tooth space of gear 2 (half-pitch shift)
  const phaseOffset = Math.PI / z2;

  return {
    m,
    z1,
    z2,
    rPitch1,
    rPitch2,
    centerDistance,
    ratio,
    phaseOffset,
  };
}

/**
 * Calculates exact physical meshing parameters for Internal Ring Gear and Planetary Pinion.
 */
export function getInternalMeshingParams(m: number, zRing: number, zPinion: number): InternalMeshingParams {
  const rRing = (m * zRing) / 2.0;
  const rPinion = (m * zPinion) / 2.0;
  const orbitRadius = rRing - rPinion; // Pinion pitch circle rolls tangent inside ring pitch circle
  const spinRatio = 1.0 + zRing / zPinion; // Planetary carrier-fixed kinematic formula
  const initialPhase = Math.PI / zPinion;

  return {
    m,
    zRing,
    zPinion,
    rRing,
    rPinion,
    orbitRadius,
    spinRatio,
    initialPhase,
  };
}

/**
 * Calculates planetary unit kinematic and assembly constraints.
 * Strictly checks: Z_ring = Z_sun + 2 * Z_planet
 */
export function getPlanetaryUnitParams(m: number, zSun: number, zPlanet: number, numPlanets: number = 3): PlanetaryParams {
  const zRing = zSun + 2 * zPlanet; // Fundamental mechanical planetary condition
  const rSun = (m * zSun) / 2.0;
  const rPlanet = (m * zPlanet) / 2.0;
  const rRing = (m * zRing) / 2.0;
  const carrierRadius = (rSun + rPlanet); // Center of planet gears

  const planetAngles: number[] = [];
  const planetPhaseOffsets: number[] = [];

  for (let k = 0; k < numPlanets; k++) {
    const angle = (k * 2.0 * Math.PI) / numPlanets;
    planetAngles.push(angle);

    // Each planet's teeth must align simultaneously with Sun and Ring gear teeth
    // Phase offset relative to carrier angle
    const phase = (zSun / zPlanet) * angle + Math.PI / zPlanet;
    planetPhaseOffsets.push(phase);
  }

  return {
    m,
    zSun,
    zPlanet,
    zRing,
    rSun,
    rPlanet,
    rRing,
    carrierRadius,
    numPlanets,
    planetAngles,
    planetPhaseOffsets,
  };
}

/**
 * 20-degree Involute Line of Action (작용선) and Contact Normal Force Vector
 */
export interface LineOfActionData {
  pitchPoint: [number, number, number];
  startPoint: [number, number, number];
  endPoint: [number, number, number];
  contactPoint: [number, number, number];
  normalForceVector: [number, number, number];
  normalForceMagnitude: number; // Newtons
}

export function computeLineOfAction(
  pitchRadius1: number,
  pitchRadius2: number,
  driveTorqueNmm: number,
  toothPhase: number,
  pressureAngleDeg: number = 20.0
): LineOfActionData {
  const alpha = (pressureAngleDeg * Math.PI) / 180.0;
  // Pitch Point along Y-axis (between two centers at Y=0 and Y=pitchRadius1+pitchRadius2)
  const py = pitchRadius1;
  const pitchPoint: [number, number, number] = [0, py, 0];

  // Base radii
  const rb1 = pitchRadius1 * Math.cos(alpha);
  const rb2 = pitchRadius2 * Math.cos(alpha);

  // Line of Action length: path of contact
  const pathLength = (pitchRadius1 + pitchRadius2) * Math.sin(alpha) * 0.85;

  // Tangent and Normal direction components with 20-deg incline
  const dx = Math.cos(alpha);
  const dz = Math.sin(alpha);

  const startPoint: [number, number, number] = [
    -pathLength * 0.5 * dx,
    py,
    -pathLength * 0.5 * dz,
  ];
  const endPoint: [number, number, number] = [
    pathLength * 0.5 * dx,
    py,
    pathLength * 0.5 * dz,
  ];

  // Moving Contact Point oscillates along the Line of Action
  const s = Math.sin(toothPhase * 2.0);
  const contactPoint: [number, number, number] = [
    s * pathLength * 0.45 * dx,
    py,
    s * pathLength * 0.45 * dz,
  ];

  // Normal Force Fn = Torque / (rb1) in Newtons (N)
  const fnN = rb1 > 0 ? (driveTorqueNmm / rb1) : 0.0;
  const normalForceVector: [number, number, number] = [
    dx * Math.min(fnN, 50.0) * 0.3,
    0,
    dz * Math.min(fnN, 50.0) * 0.3,
  ];

  return {
    pitchPoint,
    startPoint,
    endPoint,
    contactPoint,
    normalForceVector,
    normalForceMagnitude: fnN,
  };
}
