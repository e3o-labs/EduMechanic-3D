"""
3D-Printable Shaft Component for EduMechanic 3D
Allows classrooms without metal rods to 3D print precision D-shafts with chamfers.
"""
import math
from typing import Dict, Any, List, Tuple
import trimesh
from shapely.geometry import Polygon

try:
    import cadquery as cq
    HAS_CADQUERY = True
except Exception:
    HAS_CADQUERY = False

class PrecisionShaft:
    def __init__(
        self,
        diameter: float = 5.0,
        length: float = 45.0,
        is_d_cut: bool = True,
        d_cut_flat: float = 1.0,
        d_cut_length: float = 15.0,
        chamfer: float = 0.6
    ):
        self.dia = float(diameter)
        self.length = float(length)
        self.is_d_cut = bool(is_d_cut)
        self.d_cut_flat = float(d_cut_flat)
        self.d_cut_len = float(d_cut_length)
        self.chamfer = float(chamfer)
        self.radius = self.dia / 2.0

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "diameter_mm": self.dia,
            "length_mm": self.length,
            "is_d_cut": self.is_d_cut,
            "d_cut_flat_mm": self.d_cut_flat,
            "d_cut_length_mm": self.d_cut_len
        }

    def to_trimesh(self) -> trimesh.Trimesh:
        """Generates watertight cylinder or D-shaft mesh."""
        r = self.radius
        num_pts = 32
        pts = []
        flat_y = r - self.d_cut_flat if self.is_d_cut else 999.0

        for i in range(num_pts):
            ang = (2.0 * math.pi * i) / num_pts
            x = r * math.cos(ang)
            y = r * math.sin(ang)
            if self.is_d_cut and y > flat_y:
                y = flat_y
            pts.append((x, y))

        poly = Polygon(pts)
        mesh = trimesh.creation.extrude_polygon(poly, height=self.length)
        mesh.fix_normals()
        return mesh

    def to_cadquery_solid(self) -> Any:
        if not HAS_CADQUERY:
            raise RuntimeError("CadQuery is not available in current environment.")

        shaft = cq.Workplane("XY").circle(self.radius).extrude(self.length)

        if self.is_d_cut:
            # Cut flat on one side
            cut_depth = self.d_cut_flat
            shaft = (
                shaft.faces(">Z")
                .workplane()
                .rect(self.dia * 2.0, cut_depth * 2.0)
                .translate((0, self.radius, 0))
                .cutBlind(-self.d_cut_len)
            )

        try:
            shaft = shaft.edges("<Z").chamfer(self.chamfer)
            shaft = shaft.edges(">Z").chamfer(self.chamfer)
        except Exception:
            pass

        return shaft

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
