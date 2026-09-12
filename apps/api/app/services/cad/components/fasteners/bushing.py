"""
3D-Printable Flanged Bushing & Spacer Component for EduMechanic 3D
Maintains axial spacing and provides low-friction journal bearing surface.
"""
import math
from typing import Dict, Any
import trimesh
from shapely.geometry import Point

try:
    import cadquery as cq
    HAS_CADQUERY = True
except Exception:
    HAS_CADQUERY = False

class FlangedBushing:
    def __init__(
        self,
        inner_diameter: float = 5.0,
        outer_diameter: float = 8.0,
        flange_diameter: float = 12.0,
        sleeve_length: float = 6.0,
        flange_thickness: float = 2.0,
        bore_clearance: float = 0.38 # Rotating fit
    ):
        self.inner_nom = float(inner_diameter)
        self.outer_dia = float(outer_diameter)
        self.flange_dia = float(flange_diameter)
        self.sleeve_len = float(sleeve_length)
        self.flange_thick = float(flange_thickness)
        self.bore_clearance = float(bore_clearance)

        self.actual_bore = self.inner_nom + self.bore_clearance
        self.total_length = self.sleeve_len + self.flange_thick

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "inner_diameter_mm": round(self.actual_bore, 3),
            "outer_diameter_mm": self.outer_dia,
            "flange_diameter_mm": self.flange_dia,
            "sleeve_length_mm": self.sleeve_len,
            "flange_thickness_mm": self.flange_thick,
            "total_length_mm": self.total_length
        }

    def to_trimesh(self) -> trimesh.Trimesh:
        """Constructs watertight stepped cylinder with through bore."""
        r_bore = self.actual_bore / 2.0
        r_sleeve = self.outer_dia / 2.0
        r_flange = self.flange_dia / 2.0

        # Flange part: from z=0 to z=flange_thick
        flange_poly = Point(0, 0).buffer(r_flange, resolution=24).difference(Point(0, 0).buffer(r_bore, resolution=24))
        mesh_flange = trimesh.creation.extrude_polygon(flange_poly, height=self.flange_thick)

        # Sleeve part: from z=flange_thick to z=total_length
        sleeve_poly = Point(0, 0).buffer(r_sleeve, resolution=24).difference(Point(0, 0).buffer(r_bore, resolution=24))
        mesh_sleeve = trimesh.creation.extrude_polygon(sleeve_poly, height=self.sleeve_len)
        mesh_sleeve.apply_translation([0, 0, self.flange_thick])

        combined = trimesh.util.concatenate([mesh_flange, mesh_sleeve])
        combined.fix_normals()
        return combined

    def to_cadquery_solid(self) -> Any:
        if not HAS_CADQUERY:
            raise RuntimeError("CadQuery is not available in current environment.")

        r_bore = self.actual_bore / 2.0
        r_sleeve = self.outer_dia / 2.0
        r_flange = self.flange_dia / 2.0

        solid = (
            cq.Workplane("XY")
            .circle(r_flange)
            .extrude(self.flange_thick)
            .faces(">Z")
            .workplane()
            .circle(r_sleeve)
            .extrude(self.sleeve_len)
            .faces(">Z")
            .workplane()
            .circle(r_bore)
            .cutThruAll()
        )
        return solid

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
