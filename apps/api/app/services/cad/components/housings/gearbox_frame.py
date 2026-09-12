"""
Parametric Precision Gearbox Frame Generator for EduMechanic 3D
Features exact center distance a = m*(z1+z2)/2, bearing/bushing pockets, and M3 assembly mounts.
"""
import math
from typing import Tuple, Dict, Any, Optional
import trimesh
from shapely.geometry import Polygon, Point

try:
    import cadquery as cq
    HAS_CADQUERY = True
except Exception:
    HAS_CADQUERY = False

class GearboxFrame:
    def __init__(
        self,
        center_distance: float = 36.0,
        shaft_diameter: float = 5.0,
        thickness: float = 6.0,
        margin: float = 12.0,
        use_bearings: bool = True,
        bearing_outer_dia: float = 16.0, # 625ZZ: 16mm
        bearing_depth: float = 5.0,
        press_fit_clearance: float = 0.12,
        rotating_fit_clearance: float = 0.38,
        m3_screw_holes: bool = True
    ):
        self.center_dist = float(center_distance)
        self.shaft_dia = float(shaft_diameter)
        self.thickness = float(thickness)
        self.margin = float(margin)
        self.use_bearings = bool(use_bearings)
        self.bearing_od = float(bearing_outer_dia)
        self.bearing_depth = float(bearing_depth)
        self.press_fit = float(press_fit_clearance)
        self.rotating_fit = float(rotating_fit_clearance)
        self.m3_screw_holes = bool(m3_screw_holes)

        # Dimensions
        self.width = self.center_dist + 2.0 * self.margin + (self.bearing_od if self.use_bearings else 16.0)
        self.height = 2.0 * self.margin + (self.bearing_od if self.use_bearings else 16.0)
        
        # Center positions of shafts
        # Shaft 1 at (-center_dist/2, 0), Shaft 2 at (center_dist/2, 0)
        self.shaft1_pos = (-self.center_dist / 2.0, 0.0)
        self.shaft2_pos = (self.center_dist / 2.0, 0.0)

        # Holes
        if self.use_bearings:
            self.hole_dia = self.bearing_od + self.press_fit
        else:
            self.hole_dia = self.shaft_dia + self.rotating_fit

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "center_distance_mm": self.center_dist,
            "width_mm": round(self.width, 2),
            "height_mm": round(self.height, 2),
            "thickness_mm": self.thickness,
            "use_bearings": self.use_bearings,
            "hole_diameter_mm": round(self.hole_dia, 3),
            "shaft1_center": self.shaft1_pos,
            "shaft2_center": self.shaft2_pos,
            "mounting_holes_m3": 4 if self.m3_screw_holes else 0
        }

    def _generate_outer_contour(self, corner_radius: float = 6.0) -> Polygon:
        """Rounded rectangle outline for housing frame plate."""
        w2 = self.width / 2.0
        h2 = self.height / 2.0
        r = corner_radius

        # Generate outer rounded box
        from shapely.geometry import box
        base_box = box(-w2, -h2, w2, h2)
        # Smooth corners
        rounded = base_box.buffer(-r).buffer(r, resolution=16)
        return rounded

    def to_trimesh(self) -> trimesh.Trimesh:
        """
        Creates watertight 3D mesh with exact center distance shaft/bearing holes and M3 mounting points.
        """
        outer_poly = self._generate_outer_contour()
        
        # Inner holes
        hole_r = self.hole_dia / 2.0
        h1 = Point(self.shaft1_pos).buffer(hole_r, resolution=24)
        h2 = Point(self.shaft2_pos).buffer(hole_r, resolution=24)

        holes = [h1, h2]

        if self.m3_screw_holes:
            # 4 corner M3 clearance holes (Dia 3.4mm)
            m3_r = 1.7
            dx = (self.width / 2.0) - 5.0
            dy = (self.height / 2.0) - 5.0
            for sx, sy in [(-dx, -dy), (-dx, dy), (dx, -dy), (dx, dy)]:
                holes.append(Point(sx, sy).buffer(m3_r, resolution=16))

        # Difference
        frame_poly = outer_poly
        for h in holes:
            frame_poly = frame_poly.difference(h)

        mesh = trimesh.creation.extrude_polygon(frame_poly, height=self.thickness)
        mesh.fix_normals()
        return mesh

    def to_cadquery_solid(self) -> Any:
        if not HAS_CADQUERY:
            raise RuntimeError("CadQuery is not available in current environment.")

        frame = (
            cq.Workplane("XY")
            .rect(self.width, self.height)
            .extrude(self.thickness)
            .edges("|Z")
            .fillet(5.0)
        )

        # Shaft/bearing holes
        frame = (
            frame.faces(">Z")
            .workplane()
            .pushPoints([self.shaft1_pos, self.shaft2_pos])
            .circle(self.hole_dia / 2.0)
            .cutThruAll()
        )

        # M3 mounting holes
        if self.m3_screw_holes:
            dx = (self.width / 2.0) - 5.0
            dy = (self.height / 2.0) - 5.0
            frame = (
                frame.faces(">Z")
                .workplane()
                .pushPoints([(-dx, -dy), (-dx, dy), (dx, -dy), (dx, dy)])
                .circle(1.7) # M3 clearance
                .cutThruAll()
            )

        # Bottom chamfer for anti-elephant foot
        try:
            frame = frame.edges("<Z").chamfer(0.8)
        except Exception:
            pass

        return frame

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
