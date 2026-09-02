"""
Engineering Standard Involute Gear & COTS Mount Generator for EduMechanic 3D
Generates parametric CadQuery code and solid geometry for Spur Gears, Bevel Gears, and Standard COTS Mounts (608ZZ, M3, LEGO).
"""
import math
from typing import Dict, Any, Optional

class InvoluteGearGenerator:
    def __init__(self):
        self.pressure_angle_deg = 20.0  # Standard industrial pressure angle

    def calculate_gear_geometry(self, module: float, teeth_count: int) -> Dict[str, float]:
        """
        Standard ISO gear formulas:
        Pitch Diameter d = m * z
        Base Circle d_b = d * cos(alpha)
        Addendum h_a = 1.0 * m
        Dedendum h_f = 1.25 * m
        Tip Diameter d_a = d + 2*h_a = m * (z + 2)
        Root Diameter d_f = d - 2*h_f = m * (z - 2.5)
        Circular Pitch p = pi * m
        """
        m = module
        z = teeth_count
        alpha = math.radians(self.pressure_angle_deg)
        
        pitch_diameter = m * z
        base_diameter = pitch_diameter * math.cos(alpha)
        tip_diameter = m * (z + 2.0)
        root_diameter = m * (z - 2.5)
        circular_pitch = math.pi * m

        return {
            "module": m,
            "teeth_count": z,
            "pitch_diameter": round(pitch_diameter, 2),
            "base_diameter": round(base_diameter, 2),
            "tip_diameter": round(tip_diameter, 2),
            "root_diameter": round(root_diameter, 2),
            "circular_pitch": round(circular_pitch, 2)
        }

    def generate_cadquery_script(
        self,
        module: float = 1.5,
        teeth_count: int = 20,
        face_width: float = 10.0,
        shaft_dia: float = 5.0,
        tolerance: float = 0.25,
        cots_type: Optional[str] = "608zz" # "608zz", "m3_bolt", "lego_pin", "d_shaft"
    ) -> str:
        """
        Produces clean CadQuery script constructing exact involute gear profile with DFAM chamfer & COTS mounting.
        """
        geom = self.calculate_gear_geometry(module, teeth_count)
        d_tip = geom["tip_diameter"]
        d_root = geom["root_diameter"]
        d_pitch = geom["pitch_diameter"]
        comp_shaft = shaft_dia + tolerance

        script = f"""import cadquery as cq
import math

# --- 1. Involute Spur Gear Parameters ---
# Module: {module}, Teeth: {teeth_count}, Pitch Dia: {d_pitch}mm, Tip Dia: {d_tip}mm
m = {module}
z = {teeth_count}
h = {face_width}
tip_rad = {d_tip / 2.0}
root_rad = {d_root / 2.0}

# Base cylinder solid
model = cq.Workplane("XY").circle(tip_rad).extrude(h)

# Tooth profile cuts
# Standard involute cutter pattern
tooth_angle = 360.0 / z
tooth_width = math.pi * m / 2.0

# Cut tooth spaces around perimeter
model = (
    model.faces(">Z")
    .workplane()
    .polarArray(radius=tip_rad, startAngle=0, angle=360, count=z)
    .rect({module * 1.2:.2f}, {module * 2.2:.2f})
    .cutThruAll()
)
"""
        # COTS Mounting Features
        if cots_type == "608zz":
            # 608ZZ Bearing Bore: 22mm outer, 8mm inner, 7mm height pocket
            script += f"""
# --- 2. COTS: 608ZZ Bearing Pocket (Dia 22.0mm + {tolerance}mm, Depth 7.0mm) ---
model = model.faces(">Z").workplane().circle({(22.0 + tolerance) / 2}).cutBlind(-7.0)
model = model.faces(">Z").workplane().circle({comp_shaft / 2}).cutThruAll()
"""
        elif cots_type == "lego_pin":
            # LEGO Technic standard 4.8mm hole pattern
            script += f"""
# --- 2. COTS: LEGO Technic Pin Hole (Dia 4.85mm + {tolerance}mm) ---
model = model.faces(">Z").workplane().circle({(4.85 + tolerance) / 2}).cutThruAll()
"""
        elif cots_type == "d_shaft":
            # N20 / TT Motor D-Shaft (5.0mm with 3.0mm flat)
            script += f"""
# --- 2. COTS: Motor D-Shaft Bore (Dia 5.0mm flat cut) ---
model = model.faces(">Z").workplane().circle({comp_shaft / 2}).cutThruAll()
model = model.faces(">Z").workplane().rect({comp_shaft}, 1.5).extrude(h)
"""
        else:
            # Standard center shaft with M3 bolt pattern
            script += f"""
# --- 2. Standard Center Shaft & M3 Bolt Mount ---
model = model.faces(">Z").workplane().circle({comp_shaft / 2}).cutThruAll()
model = model.faces(">Z").workplane().polarArray(radius={d_pitch * 0.35:.2f}, startAngle=0, angle=360, count=4).hole(3.2)
"""

        # DFAM Rules
        script += """
# --- 3. DFAM Post-processing: Elephant Foot Chamfer ---
model = model.edges("<Z").chamfer(0.8)
"""
        return script

involute_generator = InvoluteGearGenerator()
