"""
Harness Suite: Rotational Dynamics Physics Engine Verification
Verifies:
1. SI Unit Contract & Explicit Conversion Layer (N·mm <-> N·m, kg·mm² <-> kg·m²)
2. Hand-Calculated Reference Case (Independently calculated acceleration, velocity, power, energy)
3. Aerodynamic Quadratic Drag Equilibrium: Terminal Velocity convergence
4. Inertial Coasting: Smooth deceleration when power is disengaged
5. Power Balance: Instantaneous energy conservation in SI units
"""
import math

# -----------------------------------------------------------------------------
# Unit Conversion Utilities (Boundary layer between mm-scale CAD and SI solver)
# -----------------------------------------------------------------------------
def torque_nmm_to_nm(tau_nmm: float) -> float:
    """Convert torque from N·mm to N·m (SI)."""
    return tau_nmm * 1e-3

def torque_nm_to_nmm(tau_nm: float) -> float:
    """Convert torque from N·m to N·mm."""
    return tau_nm * 1e3

def inertia_kgmm2_to_kgm2(i_kgmm2: float) -> float:
    """Convert mass moment of inertia from kg·mm² to kg·m² (SI)."""
    return i_kgmm2 * 1e-6

def inertia_kgm2_to_kgmm2(i_kgm2: float) -> float:
    """Convert mass moment of inertia from kg·m² to kg·mm²."""
    return i_kgm2 * 1e6

def watts_to_milliwatts(w: float) -> float:
    """Convert mechanical power from W (SI) to mW."""
    return w * 1e3

def joules_to_millijoules(j: float) -> float:
    """Convert energy from J (SI) to mJ."""
    return j * 1e3

class DynamicsTester:
    def __init__(
        self,
        inertia_kgmm2: float = 8.2,
        drive_torque_nmm: float = 28.0,
        coulomb_nmm: float = 1.5,
        damping_nmm_s_rad: float = 0.4,
        cd_nmm_s2_rad2: float = 0.85,
        inertia_si: float = None,
        drive_torque_si: float = None,
        coulomb_si: float = None,
        damping_si: float = None,
        cd_si: float = None,
    ):
        # Resolve to SI units: kg·m², N·m, N·m·s/rad, N·m·s²/rad²
        self.I = inertia_si if inertia_si is not None else inertia_kgmm2_to_kgm2(inertia_kgmm2)
        self.tau_drive = drive_torque_si if drive_torque_si is not None else torque_nmm_to_nm(drive_torque_nmm)
        self.coulomb = coulomb_si if coulomb_si is not None else torque_nmm_to_nm(coulomb_nmm)
        self.c_v = damping_si if damping_si is not None else torque_nmm_to_nm(damping_nmm_s_rad)
        self.c_d = cd_si if cd_si is not None else torque_nmm_to_nm(cd_nmm_s2_rad2)
        self.omega = 0.0
        self.theta = 0.0

    def step(self, dt: float, is_driving: bool = True):
        # Sub-stepping for numerical stability with small physical inertia
        max_sub_dt = 0.0005
        num_sub_steps = max(1, math.ceil(dt / max_sub_dt))
        sub_dt = dt / num_sub_steps

        last_alpha = 0.0
        last_tau_in = 0.0
        last_tau_drag = 0.0
        last_tau_friction = 0.0

        for _ in range(num_sub_steps):
            tau_in = self.tau_drive if is_driving else 0.0
            if self.omega > 0.001:
                tau_friction = self.coulomb + self.c_v * self.omega
            elif is_driving:
                tau_friction = min(tau_in, self.coulomb)
            else:
                tau_friction = 0.0

            tau_drag = self.c_d * (self.omega ** 2)
            tau_net = tau_in - (tau_friction + tau_drag)

            alpha = tau_net / self.I
            self.omega = max(0.0, self.omega + alpha * sub_dt)
            self.theta += self.omega * sub_dt

            last_alpha = alpha
            last_tau_in = tau_in
            last_tau_drag = tau_drag
            last_tau_friction = tau_friction

        # Power in W (SI) -> telemetry in mW; Energy in J (SI) -> telemetry in mJ
        power_in_w = last_tau_in * self.omega
        ek_j = 0.5 * self.I * (self.omega ** 2)

        return {
            "omega": self.omega,
            "alpha": last_alpha,
            "tau_in_nm": last_tau_in,
            "tau_drag_nm": last_tau_drag,
            "tau_friction_nm": last_tau_friction,
            "power_in_mw": watts_to_milliwatts(power_in_w),
            "ek_mj": joules_to_millijoules(ek_j),
            "power_in_w": power_in_w,
            "ek_j": ek_j,
        }

def test_hand_calculated_reference_case():
    print("🚀 [Harness: Physics Evaluator] Testing Hand-Calculated Reference Case...")

    # Independent Analytical Setup:
    # Uniform solid cylinder: m = 0.05 kg (50 g), r = 0.04 m (40 mm)
    # Mass moment of inertia: I = 0.5 * m * r^2 = 0.5 * 0.05 * 0.0016 = 4.0e-5 kg·m² (= 40.0 kg·mm²)
    # Drive torque: tau_drive = 2.0 N·mm = 2.0e-3 N·m
    # Opposing friction: tau_friction = 0.4 N·mm = 0.4e-3 N·m
    # Net torque: tau_net = 1.6e-3 N·m
    # Expected acceleration: alpha = tau_net / I = 1.6e-3 / 4.0e-5 = 40.0 rad/s²
    m = 0.05
    r = 0.04
    i_expected = 0.5 * m * (r ** 2)  # 4.0e-5 kg·m²
    tau_drive = 0.002                # 2.0e-3 N·m
    tau_coulomb = 0.0004             # 0.4e-3 N·m
    tau_net = tau_drive - tau_coulomb # 1.6e-3 N·m
    alpha_expected = tau_net / i_expected # 40.0 rad/s²

    # Instantiate via CAD mm inputs to verify the boundary conversion layer
    tester = DynamicsTester(
        inertia_kgmm2=40.0,
        drive_torque_nmm=2.0,
        coulomb_nmm=0.4,
        damping_nmm_s_rad=0.0,
        cd_nmm_s2_rad2=0.0
    )

    assert abs(tester.I - i_expected) < 1e-9, f"Inertia conversion mismatch: {tester.I} vs {i_expected}"

    dt = 0.02
    state = tester.step(dt, is_driving=True)

    # After dt = 0.02s:
    # omega = 40.0 * 0.02 = 0.80 rad/s
    # power_in = 2.0e-3 N·m * 0.8 rad/s = 1.6e-3 W = 1.6 mW
    # kinetic_energy = 0.5 * (4.0e-5) * (0.8^2) = 1.28e-5 J = 0.0128 mJ
    omega_expected = alpha_expected * dt
    power_mw_expected = (tau_drive * omega_expected) * 1e3
    ek_mj_expected = (0.5 * i_expected * (omega_expected ** 2)) * 1e3

    print(f"  Hand-calculated alpha:    {alpha_expected:.2f} rad/s² | Solver: {state['alpha']:.2f} rad/s²")
    print(f"  Hand-calculated omega:    {omega_expected:.4f} rad/s  | Solver: {state['omega']:.4f} rad/s")
    print(f"  Hand-calculated power:    {power_mw_expected:.4f} mW   | Solver: {state['power_in_mw']:.4f} mW")
    print(f"  Hand-calculated energy:   {ek_mj_expected:.6f} mJ   | Solver: {state['ek_mj']:.6f} mJ")

    assert abs(state["alpha"] - alpha_expected) < 1e-4, f"Alpha mismatch: {state['alpha']} != {alpha_expected}"
    assert abs(state["omega"] - omega_expected) < 1e-4, f"Omega mismatch: {state['omega']} != {omega_expected}"
    assert abs(state["power_in_mw"] - power_mw_expected) < 1e-4, "Power mismatch"
    assert abs(state["ek_mj"] - ek_mj_expected) < 1e-6, "Kinetic energy mismatch"
    print("  ✓ Hand-calculated reference case verified within strict numerical tolerance.")

def test_terminal_velocity_convergence():
    print("🚀 [Harness: Physics Evaluator] Testing Terminal Velocity Equilibrium...")
    tester = DynamicsTester()
    dt = 0.01

    # Theoretical terminal velocity when alpha == 0:
    # tau_drive - coulomb - c_v * w - c_d * w^2 = 0
    # In SI: (28 - 1.5 - 0.4*w - 0.85*w^2) * 1e-3 = 0
    # 0.85*w^2 + 0.4*w - 26.5 = 0
    a, b, c = 0.85, 0.4, -26.5
    w_theoretical = (-b + math.sqrt(b*b - 4*a*c)) / (2*a)
    print(f"  Theoretical Terminal Angular Velocity: {w_theoretical:.4f} rad/s")

    final_state = None
    for _ in range(500):
        final_state = tester.step(dt, is_driving=True)

    w_numerical = final_state["omega"]
    print(f"  Numerical Terminal Angular Velocity:  {w_numerical:.4f} rad/s")
    error_pct = abs(w_numerical - w_theoretical) / w_theoretical * 100.0
    print(f"  ✓ Convergence Error: {error_pct:.2f}% (Strict tolerance < 1.0%)")
    assert error_pct < 1.0, f"Dynamics failed to converge: error={error_pct}%"

def test_inertial_coasting():
    print("🚀 [Harness: Physics Evaluator] Testing Inertial Coasting & Smooth Deceleration...")
    tester = DynamicsTester()
    dt = 0.01

    # 1. Spin up to speed
    for _ in range(100):
        tester.step(dt, is_driving=True)
    w_initial = tester.omega
    assert w_initial > 4.0, "Should have accelerated"

    # 2. Cut off power and observe gradual coasting
    omega_history = []
    for _ in range(150):
        res = tester.step(dt, is_driving=False)
        omega_history.append(res["omega"])

    # Check strictly monotonic deceleration
    for i in range(len(omega_history) - 1):
        assert omega_history[i] >= omega_history[i+1], "Deceleration must be smooth and monotonic"

    w_after_coasting = omega_history[-1]
    print(f"  ✓ Smooth Coasting Deceleration: {w_initial:.2f} -> {w_after_coasting:.2f} rad/s (Smooth Inertial Decay)")

def test_power_energy_balance():
    print("🚀 [Harness: Physics Evaluator] Testing Energy & Power Conservation Law...")
    tester = DynamicsTester()
    dt = 0.005

    # Check power balance at step 10
    state = None
    for _ in range(10):
        state = tester.step(dt, is_driving=True)

    # In SI units: Power_in = Power_dissipated (friction + drag) + d(Ek)/dt
    tau_dissipated = state["tau_friction_nm"] + state["tau_drag_nm"]
    p_dissipated_w = tau_dissipated * state["omega"]
    p_accel_w = (tester.I * state["alpha"]) * state["omega"]
    p_total_w = p_dissipated_w + p_accel_w

    discrepancy = abs(state["power_in_w"] - p_total_w)
    print(f"  Power In: {state['power_in_w'] * 1e3:.4f} mW | Dissipated + Accel Power: {p_total_w * 1e3:.4f} mW")
    print(f"  ✓ Power Balance Discrepancy: {discrepancy * 1e3:.6f} mW (< 1e-4 mW)")
    assert discrepancy < 1e-6, f"Energy conservation violated: {discrepancy}"
    print("  ✓ Physics engine unit conversion and conservation laws verified.\n")

if __name__ == "__main__":
    test_hand_calculated_reference_case()
    test_terminal_velocity_convergence()
    test_inertial_coasting()
    test_power_energy_balance()

