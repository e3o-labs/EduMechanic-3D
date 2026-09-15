"""
CadQuery & Parametric 3D Solid Converter for EduMechanic 3D
Generates real Watertight STEP, STL, and GLB assets from parametric mechanical components.
"""
import os
import sys
from pathlib import Path
from typing import Dict, Any, Optional
import trimesh

from app.schemas.spec import ComponentSpec, PrinterProfile
from app.services.cad.components.gears.spur_gear import InvoluteSpurGear
from app.services.cad.components.housings.gearbox_frame import GearboxFrame
from app.services.cad.components.crank.hand_crank import HandCrank
from app.services.cad.components.shafts.shaft import PrecisionShaft
from app.services.cad.components.fasteners.bushing import FlangedBushing

# Directory for static exported 3D model files
STATIC_MODELS_DIR = Path(__file__).resolve().parents[3] / "static" / "models"
STATIC_MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Strict Whitelist Registry of supported parametric CAD geometry types
SUPPORTED_GEOMETRY_TYPES: Dict[str, str] = {
    "spur_gear": "spur_gear",
    "involute_gear": "spur_gear",
    "gearbox_frame": "gearbox_frame",
    "housing": "gearbox_frame",
    "frame": "gearbox_frame",
    "hand_crank": "hand_crank",
    "crank": "hand_crank",
    "lever": "hand_crank",
    "shaft": "shaft",
    "rod": "shaft",
    "bushing": "bushing",
    "spacer": "bushing",
    "generic_cylinder": "generic_cylinder",
    "cylinder": "generic_cylinder",
}

class UnsupportedGeometryError(ValueError):
    """Raised when an unsupported geometry type is requested in CadQuery3DConverter."""
    pass

class CadQuery3DConverter:
    def __init__(self, profile: Optional[PrinterProfile] = None):
        self.profile = profile or PrinterProfile()

    def generate_and_convert(
        self,
        component: ComponentSpec,
        output_dir: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes genuine parametric geometry generator, creates watertight mesh and CAD solid,
        and saves real STEP, STL, and GLB files.
        """
        target_dir = Path(output_dir) if output_dir else STATIC_MODELS_DIR
        target_dir.mkdir(parents=True, exist_ok=True)

        part_id = component.part_id
        geo_type = component.geometry_type
        params = component.parameters
        features = component.features

        # Strict Registry check: fail-closed for any unregistered geometry type
        canonical_type = SUPPORTED_GEOMETRY_TYPES.get(geo_type)
        if not canonical_type:
            raise UnsupportedGeometryError(
                f"Unsupported geometry type '{geo_type}' is not supported in v0.1: not found in supported CAD registry. "
                f"Supported types: {sorted(set(SUPPORTED_GEOMETRY_TYPES.keys()))}. "
                "Silent fallback to generic cylinder is prohibited per EM3D-016B baseline."
            )

        # Resolve tolerances from printer profile
        fit_type = params.fit_type or "rotating_fit"
        fit_clearance = getattr(self.profile.fit_profiles, fit_type, 0.38)
        backlash = params.backlash or self.profile.fit_profiles.backlash

        mesh = None
        solid = None
        script_code = ""

        # Dispatch to mechanical component library
        if canonical_type == "spur_gear":
            m = params.module or 1.5
            z = params.teeth_count or 20
            h = params.height or 10.0
            bore = params.bore_diameter or 5.0
            is_d = any(f.type == "center_shaft" and f.is_d_cut for f in features)

            gear = InvoluteSpurGear(
                module=m,
                teeth_count=z,
                face_width=h,
                bore_diameter=bore,
                backlash=backlash,
                fit_clearance=fit_clearance,
                is_d_cut=is_d
            )
            mesh = gear.to_trimesh()
            try:
                solid = gear.to_cadquery_solid()
            except Exception:
                solid = None

            cots_name = "608ZZ"
            script_code = f"# Involute Spur Gear (m={m}, z={z}, backlash={backlash}mm, bore={bore}mm, COTS: 608ZZ Bearing Bore)\n# DFAM: chamfer(0.8) applied on bottom bed face for elephant foot prevention\n"

        elif canonical_type == "gearbox_frame":
            cd = params.outer_diameter or 36.0 # center distance
            shaft_d = params.bore_diameter or 5.0
            thick = params.height or 6.0
            frame = GearboxFrame(
                center_distance=cd,
                shaft_diameter=shaft_d,
                thickness=thick,
                press_fit_clearance=self.profile.fit_profiles.press_fit,
                rotating_fit_clearance=self.profile.fit_profiles.rotating_fit
            )
            mesh = frame.to_trimesh()
            try:
                solid = frame.to_cadquery_solid()
            except Exception:
                solid = None
            script_code = f"# Gearbox Frame (Center Distance={cd}mm, Thickness={thick}mm)\n"

        elif canonical_type == "hand_crank":
            arm_l = params.outer_diameter or 38.0
            shaft_d = params.bore_diameter or 5.0
            arm_t = params.height or 5.0
            crank = HandCrank(
                arm_length=arm_l,
                shaft_dia=shaft_d,
                arm_thickness=arm_t,
                fit_clearance=self.profile.fit_profiles.snug_fit
            )
            mesh = crank.to_trimesh()
            try:
                solid = crank.to_cadquery_solid()
            except Exception:
                solid = None
            script_code = f"# Hand Crank (Arm={arm_l}mm, Bore={shaft_d}mm)\n"

        elif canonical_type == "shaft":
            d = params.outer_diameter or 5.0
            l = params.height or 45.0
            shaft = PrecisionShaft(diameter=d, length=l, is_d_cut=True)
            mesh = shaft.to_trimesh()
            try:
                solid = shaft.to_cadquery_solid()
            except Exception:
                solid = None
            script_code = f"# Precision Shaft (Dia={d}mm, Length={l}mm)\n"

        elif canonical_type == "bushing":
            d_in = params.bore_diameter or 5.0
            d_out = params.outer_diameter or 8.0
            bushing = FlangedBushing(inner_diameter=d_in, outer_diameter=d_out, sleeve_length=params.height or 6.0)
            mesh = bushing.to_trimesh()
            try:
                solid = bushing.to_cadquery_solid()
            except Exception:
                solid = None
            script_code = f"# Flanged Bushing (ID={d_in}mm, OD={d_out}mm)\n"

        elif canonical_type == "generic_cylinder":
            # Explicit generic cylinder
            od = params.outer_diameter or 25.0
            h = params.height or 12.0
            r_bore = (params.bore_diameter or 5.0) / 2.0 + fit_clearance / 2.0
            poly = trimesh.creation.cylinder(radius=od/2.0, height=h)
            bore_cyl = trimesh.creation.cylinder(radius=r_bore, height=h + 2.0)
            mesh = poly.difference(bore_cyl)
            mesh.fix_normals()
            script_code = f"# General Cylinder Body (OD={od}mm, H={h}mm)\n"

        else:
            raise UnsupportedGeometryError(
                f"Unexpected unhandled canonical type '{canonical_type}' for geometry '{geo_type}'."
            )

        # Save actual physical files to target directory
        stl_path = target_dir / f"{part_id}.stl"
        step_path = target_dir / f"{part_id}.step"
        glb_path = target_dir / f"{part_id}.glb"

        mesh.export(str(stl_path), file_type="stl")
        mesh.export(str(glb_path), file_type="glb")

        # Export STEP if CadQuery solid is available
        step_exported = False
        if solid is not None:
            try:
                import cadquery as cq
                cq.exporters.export(solid, str(step_path))
                step_exported = True
            except Exception:
                step_exported = False

        return {
            "status": "success",
            "part_id": part_id,
            "geometry_type": geo_type,
            "is_watertight": bool(mesh.is_watertight),
            "volume_mm3": round(float(mesh.volume), 2) if mesh.is_watertight else 0.0,
            "faces_count": len(mesh.faces),
            "vertices_count": len(mesh.vertices),
            "extents_mm": [round(float(x), 2) for x in mesh.extents],
            "stl_file": str(stl_path),
            "glb_file": str(glb_path),
            "step_file": str(step_path) if step_exported else None,
            "stl_url": f"/static/models/{part_id}.stl",
            "glb_url": f"/static/models/{part_id}.glb",
            "step_url": f"/static/models/{part_id}.step" if step_exported else None,
            "cad_script": script_code,
            "mesh_object": mesh
        }

cad_converter = CadQuery3DConverter()
