/**
 * Test Suite: Rotational Dynamics Physics Engine & SI Unit Contract
 * Validates:
 * 1. Unit conversion consistency (N·mm <-> N·m, kg·mm² <-> kg·m², W <-> mW, J <-> mJ)
 * 2. Hand-calculated reference case (Exact analytical acceleration, velocity, power, energy)
 * 3. Terminal velocity convergence without unit skew
 */
import { Units, RotationalDynamicsSolver, MechanismPhysicsConfig } from './physicsEngine';

function assertApprox(actual: number, expected: number, tol = 1e-4, msg = ''): void {
  const diff = Math.abs(actual - expected);
  if (diff > tol) {
    throw new Error(`Assertion failed: expected ${expected}, got ${actual} (diff=${diff} > tol=${tol}). ${msg}`);
  }
}

function testUnitConversions(): void {
  console.log('🧪 Testing unit conversion layer...');

  // Torque
  assertApprox(Units.torqueNmmToNm(1000), 1.0, 1e-9, '1000 N·mm == 1 N·m');
  assertApprox(Units.torqueNmToNmm(1.0), 1000, 1e-9, '1 N·m == 1000 N·mm');

  // Inertia
  assertApprox(Units.inertiaKgMm2ToKgM2(1000000), 1.0, 1e-9, '1e6 kg·mm² == 1 kg·m²');
  assertApprox(Units.inertiaKgMm2ToKgM2(40.0), 4.0e-5, 1e-9, '40 kg·mm² == 4e-5 kg·m²');
  assertApprox(Units.inertiaKgM2ToKgMm2(4.0e-5), 40.0, 1e-9, '4e-5 kg·m² == 40 kg·mm²');

  // Power & Energy
  assertApprox(Units.wattsToMilliwatts(0.005), 5.0, 1e-9, '0.005 W == 5 mW');
  assertApprox(Units.milliwattsToWatts(5.0), 0.005, 1e-9, '5 mW == 0.005 W');
  assertApprox(Units.joulesToMilliJoules(0.002), 2.0, 1e-9, '0.002 J == 2 mJ');
  assertApprox(Units.milliJoulesToJoules(2.0), 0.002, 1e-9, '2 mJ == 0.002 J');

  // Speed
  assertApprox(Units.radSToRpm(2 * Math.PI), 60.0, 1e-6, '2*pi rad/s == 60 RPM');
  assertApprox(Units.rpmToRadS(60.0), 2 * Math.PI, 1e-6, '60 RPM == 2*pi rad/s');

  console.log('  ✓ Unit conversion routines verified.');
}

function testHandCalculatedReferenceCase(): void {
  console.log('🧪 Testing hand-calculated physics reference case...');

  // Reference Setup:
  // Uniform cylinder: mass m = 0.05 kg, radius r = 0.04 m (40 mm)
  // Inertia I = 0.5 * m * r^2 = 0.5 * 0.05 * 0.0016 = 4.0e-5 kg·m² = 40.0 kg·mm²
  // Drive torque = 2.0 N·mm = 2.0e-3 N·m
  // Coulomb friction = 0.4 N·mm = 0.4e-3 N·m
  // Net torque = 1.6e-3 N·m
  // Hand-calculated expected alpha = 1.6e-3 / 4.0e-5 = 40.0 rad/s²
  const config: MechanismPhysicsConfig = {
    inertiaTotalKgMm2: 40.0,
    driveTorqueNominalNmm: 2.0,
    coulombFrictionNmm: 0.4,
    viscousDampingNmm: 0.0,
    aeroDragCoeffNmm: 0.0,
    loadType: 'custom',
  };

  const solver = new RotationalDynamicsSolver(config);
  assertApprox(solver.getInertiaSI(), 4.0e-5, 1e-9, 'Inertia in SI must be 4.0e-5 kg·m²');

  const dt = 0.02; // 20 ms
  const state = solver.update(dt, true);

  // Expected values after single step dt = 0.02s from rest:
  // alpha = 40.0 rad/s²
  // omega = alpha * dt = 40.0 * 0.02 = 0.8 rad/s
  // rpm = 0.8 * 60 / (2*pi) ≈ 7.639437 RPM
  // theta = omega * dt = 0.8 * 0.02 = 0.016 rad
  // power = tau_in * omega = 2.0e-3 N·m * 0.8 rad/s = 1.6e-3 W = 1.6 mW
  // kinetic energy = 0.5 * I * omega^2 = 0.5 * 4.0e-5 * 0.64 = 1.28e-5 J = 0.0128 mJ
  assertApprox(state.alpha, 40.0, 1e-4, 'Alpha must match hand calculation: 40.0 rad/s²');
  assertApprox(state.omega, 0.8, 1e-4, 'Omega must match hand calculation: 0.8 rad/s');
  assertApprox(state.rpm, (0.8 * 60) / (2 * Math.PI), 1e-3, 'RPM must match hand calculation');
  assertApprox(state.powerMilliwatts, 1.6, 1e-4, 'Power must match hand calculation: 1.6 mW');
  assertApprox(state.kineticEnergyMilliJoules, 0.0128, 1e-5, 'Kinetic energy must match: 0.0128 mJ');

  console.log(`  ✓ Hand-calculated acceleration: ${state.alpha.toFixed(2)} rad/s² (expected 40.00)`);
  console.log(`  ✓ Hand-calculated velocity:     ${state.omega.toFixed(2)} rad/s (expected 0.80)`);
  console.log(`  ✓ Hand-calculated power:        ${state.powerMilliwatts.toFixed(2)} mW (expected 1.60)`);
  console.log(`  ✓ Hand-calculated kinetic energy: ${state.kineticEnergyMilliJoules.toFixed(4)} mJ (expected 0.0128)`);
}

function testTerminalVelocityEquilibrium(): void {
  console.log('🧪 Testing terminal velocity equilibrium convergence...');

  // Setup identical parameters to musicbox governor:
  // Drive torque = 28 N·mm (0.028 N·m)
  // Coulomb = 1.5 N·mm (0.0015 N·m)
  // Damping c_v = 0.4 N·mm·s/rad (0.0004 N·m·s/rad)
  // Aero drag c_d = 0.85 N·mm·s²/rad² (0.00085 N·m·s²/rad²)
  // Theoretical terminal velocity when net torque == 0:
  // 0.85 * w^2 + 0.4 * w - 26.5 = 0
  const a = 0.85;
  const b = 0.4;
  const c = -26.5;
  const wExpected = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a); // ~5.3533 rad/s

  const config: MechanismPhysicsConfig = {
    inertiaTotalKgMm2: 8.2, // 8.2e-6 kg·m²
    driveTorqueNominalNmm: 28.0,
    coulombFrictionNmm: 1.5,
    viscousDampingNmm: 0.4,
    aeroDragCoeffNmm: 0.85,
    loadType: 'custom',
  };

  const solver = new RotationalDynamicsSolver(config);
  const dt = 0.01;
  let lastState = solver.getState();

  // With realistic small inertia, it converges smoothly to terminal velocity
  for (let i = 0; i < 500; i++) {
    lastState = solver.update(dt, true);
  }

  const errPct = (Math.abs(lastState.omega - wExpected) / wExpected) * 100;
  console.log(`  Theoretical terminal velocity: ${wExpected.toFixed(4)} rad/s`);
  console.log(`  Simulated terminal velocity:   ${lastState.omega.toFixed(4)} rad/s (error: ${errPct.toFixed(3)}%)`);
  assertApprox(lastState.omega, wExpected, 0.05, 'Terminal velocity must converge to theoretical equilibrium');
  console.log('  ✓ Terminal velocity equilibrium verified.');
}

function runAll(): void {
  testUnitConversions();
  testHandCalculatedReferenceCase();
  testTerminalVelocityEquilibrium();
  console.log('\n🎉 [TypeScript Physics Test] All unit contract tests passed successfully!\n');
}

runAll();
