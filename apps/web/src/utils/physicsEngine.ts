/**
 * Simulation-Grade Multi-Body Rotational Dynamics Physics Engine for EduMechanic 3D
 * Formulates and numerically integrates Newton-Euler dynamic equations of motion:
 * I_total * d(omega)/dt = Torque_drive - Torque_friction - Torque_drag(omega) - Torque_load
 */

export interface DynamicState {
  theta: number;        // Angular position (rad)
  omega: number;        // Angular velocity (rad/s)
  alpha: number;        // Angular acceleration (rad/s^2)
  rpm: number;          // Revolutions per minute
  torqueIn: number;     // Applied driving torque (N*mm)
  torqueDrag: number;   // Viscous & Aerodynamic drag torque (N*mm)
  torqueLoad: number;   // Cutting or spring load torque (N*mm)
  powerMilliwatts: number; // Mechanical power P = tau * omega (mW)
  kineticEnergyMilliJoules: number; // E_k = 0.5 * I * omega^2 (mJ)
  equilibriumRatio: number; // Dynamic equilibrium index (0 - 100%)
}

export interface MechanismPhysicsConfig {
  inertiaTotal: number;     // Equivalent moment of inertia (kg * mm^2)
  driveTorqueNominal: number; // Nominal drive torque (N * mm)
  coulombFriction: number;  // Bearing friction torque (N * mm)
  viscousDamping: number;   // Viscous damping coefficient c_v (N * mm * s / rad)
  aeroDragCoeff: number;    // Aerodynamic quadratic drag coefficient c_d (N * mm * s^2 / rad^2)
  loadType: 'sharpener_helical' | 'musicbox_governor' | 'bicycle_planetary';
}

export class RotationalDynamicsSolver {
  private config: MechanismPhysicsConfig;
  private state: DynamicState;

  constructor(config: MechanismPhysicsConfig) {
    this.config = config;
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

  public update(dt: number, isDriving: boolean): DynamicState {
    const {
      inertiaTotal,
      driveTorqueNominal,
      coulombFriction,
      viscousDamping,
      aeroDragCoeff,
      loadType,
    } = this.config;

    // Clamp dt to avoid numerical instability
    const stepDt = Math.min(0.05, Math.max(0.001, dt));

    // 1. Driving Torque with soft Ramp-in
    const driveTorque = isDriving ? driveTorqueNominal : 0.0;

    // 2. Friction Torque (Opposes motion)
    const frictionTorque = this.state.omega > 0.001
      ? coulombFriction + viscousDamping * this.state.omega
      : 0.0;

    // 3. Aerodynamic Drag Torque: tau_drag = c_d * omega^2 (Quadratic Law)
    const aeroDragTorque = aeroDragCoeff * (this.state.omega * this.state.omega);

    // 4. Mechanism-Specific Load Torque
    let loadTorque = 0.0;
    if (loadType === 'sharpener_helical' && isDriving) {
      // 10-flute cutting teeth periodically engaging wood pencil
      const flutePhase = this.state.theta * 4.0 * 10.0; // 4x pinion spin * 10 flutes
      const shearRipple = Math.sin(flutePhase) * Math.sin(flutePhase);
      loadTorque = 8.0 + 6.0 * shearRipple; // 8 - 14 N*mm periodic shear resistance
    } else if (loadType === 'musicbox_governor') {
      // Comb teeth pluck resistance
      loadTorque = 3.5 + 2.0 * Math.sin(this.state.theta * 48.0);
    } else if (loadType === 'bicycle_planetary') {
      // Planetary mesh rolling friction
      loadTorque = 5.0 + 1.5 * this.state.omega;
    }

    // 5. Net Torque and Net Angular Acceleration: alpha = tau_net / I
    const opposingTorque = frictionTorque + aeroDragTorque + (isDriving ? loadTorque : 0.0);
    let netTorque = driveTorque - opposingTorque;

    if (!isDriving && this.state.omega <= 0.05) {
      // Stop completely when coasting reaches near zero
      this.state.omega = 0;
      this.state.alpha = 0;
      netTorque = 0;
    } else {
      this.state.alpha = netTorque / inertiaTotal;
      // Symplectic Euler Integration
      this.state.omega = Math.max(0, this.state.omega + this.state.alpha * stepDt);
      this.state.theta += this.state.omega * stepDt;
    }

    // 6. Compute Telemetry Indicators
    this.state.rpm = (this.state.omega * 60.0) / (2.0 * Math.PI);
    this.state.torqueIn = driveTorque;
    this.state.torqueDrag = aeroDragTorque + frictionTorque;
    this.state.torqueLoad = loadTorque;
    this.state.powerMilliwatts = driveTorque * this.state.omega;
    this.state.kineticEnergyMilliJoules = 0.5 * inertiaTotal * (this.state.omega * this.state.omega);

    const totalResist = opposingTorque || 0.001;
    this.state.equilibriumRatio = Math.min(100, Math.round((Math.min(driveTorque, totalResist) / Math.max(driveTorque, totalResist)) * 100));

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
  }
}

// Preset Default Physical Configurations (Standard Material PLA & Steel Inertias)
export const DEFAULT_PHYSICS_CONFIGS: Record<string, MechanismPhysicsConfig> = {
  sharpener: {
    inertiaTotal: 18.5,        // kg * mm^2
    driveTorqueNominal: 45.0,  // N * mm (Manual Hand Crank input)
    coulombFriction: 3.2,      // N * mm
    viscousDamping: 0.85,
    aeroDragCoeff: 0.12,
    loadType: 'sharpener_helical',
  },
  musicbox: {
    inertiaTotal: 8.2,         // kg * mm^2
    driveTorqueNominal: 28.0,  // N * mm (Spiral Spring output)
    coulombFriction: 1.5,
    viscousDamping: 0.4,
    aeroDragCoeff: 0.85,       // High aerodynamic drag from 8x high-speed fan governor!
    loadType: 'musicbox_governor',
  },
  bicycle: {
    inertiaTotal: 32.0,        // kg * mm^2
    driveTorqueNominal: 60.0,
    coulombFriction: 4.0,
    viscousDamping: 1.2,
    aeroDragCoeff: 0.08,
    loadType: 'bicycle_planetary',
  },
};
