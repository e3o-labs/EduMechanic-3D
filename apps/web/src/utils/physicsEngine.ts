/**
 * Rotational Dynamics Physics Engine for EduMechanic 3D
 * Formulates and numerically integrates Newton-Euler rotational dynamic equations of motion:
 * I_total * d(omega)/dt = Torque_drive - Torque_friction - Torque_drag(omega) - Torque_load
 *
 * NOTE: All internal dynamics calculations are performed in SI units (m, kg, s, N, N·m, kg·m², W, J).
 * Conversion layer explicitly bridges mm-scale CAD / UI inputs and SI solver quantities.
 */

/**
 * Unit Conversion Utilities (Boundary layer between mm-scale CAD/UI inputs and SI solver)
 */
export const Units = {
  // Torque: 1 N·mm = 1e-3 N·m
  torqueNmmToNm: (tauNmm: number): number => tauNmm * 1e-3,
  torqueNmToNmm: (tauNm: number): number => tauNm * 1e3,

  // Inertia: 1 kg·mm² = 1e-6 kg·m²
  inertiaKgMm2ToKgM2: (iKgMm2: number): number => iKgMm2 * 1e-6,
  inertiaKgM2ToKgMm2: (iKgM2: number): number => iKgM2 * 1e6,

  // Damping: 1 N·mm·s/rad = 1e-3 N·m·s/rad
  dampingNmmToNm: (c: number): number => c * 1e-3,
  dampingNmToNmm: (c: number): number => c * 1e3,

  // Aero drag: 1 N·mm·s²/rad² = 1e-3 N·m·s²/rad²
  aeroDragNmmToNm: (cd: number): number => cd * 1e-3,
  aeroDragNmToNmm: (cd: number): number => cd * 1e3,

  // Energy: 1 J = 1e3 mJ
  joulesToMilliJoules: (j: number): number => j * 1e3,
  milliJoulesToJoules: (mJ: number): number => mJ * 1e-3,

  // Power: 1 W = 1e3 mW
  wattsToMilliwatts: (w: number): number => w * 1e3,
  milliwattsToWatts: (mW: number): number => mW * 1e-3,

  // Angular velocity: rad/s <-> RPM
  radSToRpm: (omega: number): number => (omega * 60.0) / (2.0 * Math.PI),
  rpmToRadS: (rpm: number): number => (rpm * 2.0 * Math.PI) / 60.0,
};

export interface DynamicState {
  theta: number;        // Angular position (rad)
  omega: number;        // Angular velocity (rad/s)
  alpha: number;        // Angular acceleration (rad/s^2)
  rpm: number;          // Revolutions per minute
  torqueIn: number;     // Applied driving torque for telemetry (N·mm)
  torqueDrag: number;   // Viscous & Aerodynamic drag torque for telemetry (N·mm)
  torqueLoad: number;   // Cutting or spring load torque for telemetry (N·mm)
  powerMilliwatts: number; // Mechanical power P = tau * omega in mW (1e-3 W)
  kineticEnergyMilliJoules: number; // E_k = 0.5 * I * omega^2 in mJ (1e-3 J)
  equilibriumRatio: number; // Dynamic equilibrium index (0 - 100%)
}

export interface MechanismPhysicsConfig {
  // Config properties with explicit units
  inertiaTotalKgMm2?: number;     // Equivalent moment of inertia (kg * mm^2)
  inertiaTotal?: number;          // Compatibility alias (kg * mm^2)
  inertiaTotalKgM2?: number;      // Direct SI moment of inertia (kg * m^2)

  driveTorqueNominalNmm?: number; // Nominal drive torque (N * mm)
  driveTorqueNominal?: number;    // Compatibility alias (N * mm)
  driveTorqueNominalNm?: number;  // Direct SI nominal drive torque (N * m)

  coulombFrictionNmm?: number;    // Bearing friction torque (N * mm)
  coulombFriction?: number;       // Compatibility alias (N * mm)
  coulombFrictionNm?: number;     // Direct SI coulomb friction (N * m)

  viscousDampingNmm?: number;     // Viscous damping coefficient c_v (N * mm * s / rad)
  viscousDamping?: number;        // Compatibility alias (N * mm * s / rad)
  viscousDampingNm?: number;      // Direct SI viscous damping (N * m * s / rad)

  aeroDragCoeffNmm?: number;      // Aerodynamic quadratic drag coefficient c_d (N * mm * s^2 / rad^2)
  aeroDragCoeff?: number;         // Compatibility alias (N * mm * s^2 / rad^2)
  aeroDragCoeffNm?: number;       // Direct SI aerodynamic quadratic drag (N * m * s^2 / rad^2)

  loadType: 'sharpener_helical' | 'musicbox_governor' | 'bicycle_planetary' | 'custom';
}

export class RotationalDynamicsSolver {
  private config: MechanismPhysicsConfig;
  private state: DynamicState;

  // Resolved SI parameters
  private readonly inertiaKgM2: number;
  private readonly driveTorqueNm: number;
  private readonly coulombFrictionNm: number;
  private readonly viscousDampingNm: number;
  private readonly aeroDragCoeffNm: number;

  constructor(config: MechanismPhysicsConfig) {
    this.config = config;

    // Explicit boundary conversion to SI units (kg·m², N·m, N·m·s/rad, N·m·s²/rad²)
    if (config.inertiaTotalKgM2 !== undefined) {
      this.inertiaKgM2 = config.inertiaTotalKgM2;
    } else {
      const inertiaMm = config.inertiaTotalKgMm2 ?? config.inertiaTotal ?? 1.0;
      this.inertiaKgM2 = Units.inertiaKgMm2ToKgM2(inertiaMm);
    }

    if (config.driveTorqueNominalNm !== undefined) {
      this.driveTorqueNm = config.driveTorqueNominalNm;
    } else {
      const torqueMm = config.driveTorqueNominalNmm ?? config.driveTorqueNominal ?? 0.0;
      this.driveTorqueNm = Units.torqueNmmToNm(torqueMm);
    }

    if (config.coulombFrictionNm !== undefined) {
      this.coulombFrictionNm = config.coulombFrictionNm;
    } else {
      const coulombMm = config.coulombFrictionNmm ?? config.coulombFriction ?? 0.0;
      this.coulombFrictionNm = Units.torqueNmmToNm(coulombMm);
    }

    if (config.viscousDampingNm !== undefined) {
      this.viscousDampingNm = config.viscousDampingNm;
    } else {
      const dampingMm = config.viscousDampingNmm ?? config.viscousDamping ?? 0.0;
      this.viscousDampingNm = Units.dampingNmmToNm(dampingMm);
    }

    if (config.aeroDragCoeffNm !== undefined) {
      this.aeroDragCoeffNm = config.aeroDragCoeffNm;
    } else {
      const aeroMm = config.aeroDragCoeffNmm ?? config.aeroDragCoeff ?? 0.0;
      this.aeroDragCoeffNm = Units.aeroDragNmmToNm(aeroMm);
    }

    this.state = {
      theta: 0,
      omega: 0,
      alpha: 0,
      rpm: 0,
      torqueIn: 0,
      torqueDrag: 0,
      torqueLoad: 0,
      powerMilliwatts: 0,
      kineticEnergyMilliJoules: 0,
      equilibriumRatio: 0,
    };
  }

  public getInertiaSI(): number {
    return this.inertiaKgM2;
  }

  public update(dt: number, isDriving: boolean): DynamicState {
    const { loadType } = this.config;

    // Clamp dt to avoid numerical instability
    const stepDt = Math.min(0.05, Math.max(0.001, dt));

    // Sub-stepping for numerical stability of low-inertia stiff rotational dynamics
    // (e.g. micro plastic components with time constants ~ 1ms)
    const maxSubDt = 0.0005; // 0.5 ms max sub-step
    const numSubSteps = Math.min(100, Math.max(1, Math.ceil(stepDt / maxSubDt)));
    const subDt = stepDt / numSubSteps;

    let opposingTorqueNm = 0.0;
    let driveTorqueNm = 0.0;
    let loadTorqueNm = 0.0;
    let aeroDragTorqueNm = 0.0;
    let frictionTorqueNm = 0.0;

    for (let step = 0; step < numSubSteps; step++) {
      // 1. Driving Torque in SI (N·m)
      driveTorqueNm = isDriving ? this.driveTorqueNm : 0.0;

      // 2. Friction Torque in SI (N·m, opposes motion or imminent motion)
      frictionTorqueNm = 0.0;
      if (this.state.omega > 0.001) {
        frictionTorqueNm = this.coulombFrictionNm + this.viscousDampingNm * this.state.omega;
      } else if (isDriving) {
        frictionTorqueNm = Math.min(driveTorqueNm, this.coulombFrictionNm);
      }

      // 3. Aerodynamic Drag Torque in SI (N·m): tau_drag = c_d * omega^2
      aeroDragTorqueNm = this.aeroDragCoeffNm * (this.state.omega * this.state.omega);

      // 4. Mechanism-Specific Load Torque in SI (N·m)
      loadTorqueNm = 0.0;
      if (loadType === 'sharpener_helical' && isDriving) {
        const flutePhase = this.state.theta * 4.0 * 10.0;
        const shearRipple = Math.sin(flutePhase) * Math.sin(flutePhase);
        const loadNmm = 8.0 + 6.0 * shearRipple;
        loadTorqueNm = Units.torqueNmmToNm(loadNmm);
      } else if (loadType === 'musicbox_governor') {
        const loadNmm = 3.5 + 2.0 * Math.sin(this.state.theta * 48.0);
        loadTorqueNm = Units.torqueNmmToNm(loadNmm);
      } else if (loadType === 'bicycle_planetary') {
        const loadNmm = 5.0 + 1.5 * this.state.omega;
        loadTorqueNm = Units.torqueNmmToNm(loadNmm);
      }

      // 5. Net Torque and Net Angular Acceleration in SI: alpha = tau_net / I [rad/s^2]
      opposingTorqueNm = frictionTorqueNm + aeroDragTorqueNm + (isDriving ? loadTorqueNm : 0.0);
      let netTorqueNm = driveTorqueNm - opposingTorqueNm;

      if (!isDriving && this.state.omega <= 0.05) {
        this.state.omega = 0;
        this.state.alpha = 0;
      } else {
        this.state.alpha = netTorqueNm / this.inertiaKgM2;
        this.state.omega = Math.max(0, this.state.omega + this.state.alpha * subDt);
        this.state.theta += this.state.omega * subDt;
      }
    }

    // 6. Compute Telemetry Indicators (Converted from SI to standard UI units)
    this.state.rpm = Units.radSToRpm(this.state.omega);
    this.state.torqueIn = Units.torqueNmToNmm(driveTorqueNm);
    this.state.torqueDrag = Units.torqueNmToNmm(aeroDragTorqueNm + frictionTorqueNm);
    this.state.torqueLoad = Units.torqueNmToNmm(loadTorqueNm);

    // Mechanical Power in SI (W = N·m * rad/s) -> mW
    const powerWatts = driveTorqueNm * this.state.omega;
    this.state.powerMilliwatts = Units.wattsToMilliwatts(powerWatts);

    // Kinetic Energy in SI (J = 0.5 * I * omega^2) -> mJ
    const kineticEnergyJoules = 0.5 * this.inertiaKgM2 * (this.state.omega * this.state.omega);
    this.state.kineticEnergyMilliJoules = Units.joulesToMilliJoules(kineticEnergyJoules);

    const totalResistNm = opposingTorqueNm || 1e-6;
    this.state.equilibriumRatio = Math.min(
      100,
      Math.round((Math.min(driveTorqueNm, totalResistNm) / Math.max(driveTorqueNm, totalResistNm)) * 100)
    );

    return { ...this.state };
  }

  public getState(): DynamicState {
    return { ...this.state };
  }

  public reset() {
    this.state.theta = 0;
    this.state.omega = 0;
    this.state.alpha = 0;
    this.state.rpm = 0;
    this.state.torqueIn = 0;
    this.state.torqueDrag = 0;
    this.state.torqueLoad = 0;
    this.state.powerMilliwatts = 0;
    this.state.kineticEnergyMilliJoules = 0;
    this.state.equilibriumRatio = 0;
  }
}

// Preset Physical Configurations
// NOTE: inertiaTotal is in kg·mm² (CAD scale); converted to kg·m² at solver boundary.
export const DEFAULT_PHYSICS_CONFIGS: Record<string, MechanismPhysicsConfig> = {
  sharpener: {
    inertiaTotal: 18.5,        // kg * mm^2 (1.85e-5 kg * m^2)
    driveTorqueNominal: 45.0,  // N * mm (0.045 N * m)
    coulombFriction: 3.2,      // N * mm
    viscousDamping: 0.85,      // N * mm * s / rad
    aeroDragCoeff: 0.12,       // N * mm * s^2 / rad^2
    loadType: 'sharpener_helical',
  },
  musicbox: {
    inertiaTotal: 8.2,         // kg * mm^2 (8.2e-6 kg * m^2)
    driveTorqueNominal: 28.0,  // N * mm (0.028 N * m)
    coulombFriction: 1.5,
    viscousDamping: 0.4,
    aeroDragCoeff: 0.85,       // Air governor drag
    loadType: 'musicbox_governor',
  },
  bicycle: {
    inertiaTotal: 32.0,        // kg * mm^2 (3.2e-5 kg * m^2)
    driveTorqueNominal: 60.0,  // N * mm (0.06 N * m)
    coulombFriction: 4.0,
    viscousDamping: 1.2,
    aeroDragCoeff: 0.08,
    loadType: 'bicycle_planetary',
  },
};
