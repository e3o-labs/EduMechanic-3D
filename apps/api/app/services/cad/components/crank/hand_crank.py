"""
Printable Hand Crank Component for EduMechanic 3D
Features D-cut shaft hub for torque transfer, ergonomic knob, and support-free flat bed printing.
"""
import math
from typing import Dict, Any, List, Tuple
import trimesh
from shapely.geometry import Polygon, Point
import numpy as np

try:
    import cadquery as cq
    HAS_CADQUERY = True
except Exception:
    HAS_CADQUERY = False

class HandCrank:
    def __init__(
        self,
        arm_length: float = 38.0,
        shaft_dia: float = 5.0,
        arm_thickness: float = 5.0,
        hub_diameter: float = 14.0,
        knob_length: float = 24.0,
        knob_diameter: float = 11.0,
        is_d_cut: bool = True,
        d_cut_flat: float = 1.0,
        fit_clearance: float = 0.20 # snug fit on driving shaft
    ):
        self.arm_len = float(arm_length)
        self.shaft_dia = float(shaft_dia)
        self.arm_thick = float(arm_thickness)
        self.hub_dia = float(hub_diameter)
        self.knob_len = float(knob_length)
        self.knob_dia = float(knob_diameter)
        self.is_d_cut = bool(is_d_cut)
        self.d_cut_flat = float(d_cut_flat)
        self.fit_clearance = float(fit_clearance)

        self.actual_bore_dia = self.shaft_dia + self.fit_clearance
        self.r_bore = self.actual_bore_dia / 2.0

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "arm_length_mm": self.arm_len,
            "arm_thickness_mm": self.arm_thick,
            "hub_diameter_mm": self.hub_dia,
            "knob_length_mm": self.knob_len,
            "knob_diameter_mm": self.knob_dia,
            "shaft_bore_mm": round(self.actual_bore_dia, 3),
            "is_d_cut": self.is_d_cut
        }

    def to_trimesh(self) -> trimesh.Trimesh:
        """
        Builds 3D-printable crank assembly mesh: Arm plate + D-cut hub + standing knob handle.
        """
        # 1. 2D Crank Arm (Lozenge connecting hub to knob base)
        r_hub = self.hub_dia / 2.0
        r_knob_base = self.knob_dia / 2.0 + 1.5

        c_hub = Point(0, 0).buffer(r_hub, resolution=24)
        c_knob = Point(self.arm_len, 0).buffer(r_knob_base, resolution=24)
        arm_poly = c_hub.union(c_knob).convex_hull

        # Cut D-shaft bore
        bore_pts = []
        num_pts = 32
        flat_y = self.r_bore - self.d_cut_flat if self.is_d_cut else 999.0
        for i in range(num_pts):
            ang = (2.0 * math.pi * i) / num_pts
            x = self.r_bore * math.cos(ang)
            y = self.r_bore * math.sin(ang)
            if self.is_d_cut and y > flat_y:
                y = flat_y
            bore_pts.append((x, y))

        bore_poly = Polygon(bore_pts)
        arm_with_hole = arm_poly.difference(bore_poly)

        # Extrude arm plate
        mesh_arm = trimesh.creation.extrude_polygon(arm_with_hole, height=self.arm_thick)

        # 2. Add Knob Handle Cylinder standing upright from arm
        knob_cylinder = trimesh.creation.cylinder(radius=self.knob_dia / 2.0, height=self.knob_len, sections=24)
        # Position knob at (arm_len, 0, arm_thick + knob_len/2)
        trans = np.eye(4)
        trans[0, 3] = self.arm_len
        trans[1, 3] = 0.0
        trans[2, 3] = self.arm_thick + (self.knob_len / 2.0)
        knob_cylinder.apply_transform(trans)

        # Combine
        combined = trimesh.util.concatenate([mesh_arm, knob_cylinder])
        combined.fix_normals()
        return combined

    def to_cadquery_solid(self) -> Any:
        if not HAS_CADQUERY:
            raise RuntimeError("CadQuery is not available in current environment.")

        r_hub = self.hub_dia / 2.0
        r_knob_base = self.knob_dia / 2.0 + 1.5

        # Arm body
        crank = (
            cq.Workplane("XY")
            .circle(r_hub)
            .workplane(offset=0)
            .moveTo(self.arm_len, 0)
            .circle(r_knob_base)
            .hull()
            .extrude(self.arm_thick)
        )

        # Cut shaft bore
        if self.is_d_cut:
            flat_y = self.r_bore - self.d_cut_flat
            bore_pts = []
            for i in range(32):
                ang = (2.0 * math.pi * i) / 32
                x = self.r_bore * math.cos(ang)
                y = self.r_bore * math.sin(ang)
                if y > flat_y:
                    y = flat_y
                bore_pts.append((x, y))
            crank = crank.faces(">Z").workplane().polyline(bore_pts).close().cutThruAll()
        else:
            crank = crank.faces(">Z").workplane().circle(self.r_bore).cutThruAll()

        # Handle Knob
        knob = (
            crank.faces(">Z")
            .workplane()
            .moveTo(self.arm_len, 0)
            .circle(self.knob_dia / 2.0)
            .extrude(self.knob_len)
        )

        # Smooth edges
        try:
            knob = knob.edges("<Z").chamfer(0.8)
        except Exception:
            pass

        return knob

    def export_stl(self, filepath: str) -> bool:
        mesh = self.to_trimesh()
        mesh.export(filepath, file_type="stl")
        return True

    def export_step(self, filepath: str) -> bool:
        if not HAS_CADQUERY:
            return False
        solid = self.to_cadquery_solid()
        cq.exporters.export(solid, filepath)
        return True
