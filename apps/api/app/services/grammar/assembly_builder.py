"""
Mechanism CAD Assembly Builder v0.1 for EduMechanic 3D
Builds deterministic 3D printable assemblies from verified single-stage spur gearbox grammars
by reusing canonical CAD components (InvoluteSpurGear, GearboxFrame, PrecisionShaft, HandCrank, FlangedBushing).
"""
import math
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import trimesh

from app.schemas.grammar import MechanismGrammar, ConstraintValidationResult
from app.schemas.spec import PrinterProfile
from app.services.grammar.solver import SingleStageSpurGearboxSolver, extract_numeric_value
from app.services.cad.components.gears.spur_gear import InvoluteSpurGear
from app.services.cad.components.housings.gearbox_frame import GearboxFrame
from app.services.cad.components.shafts.shaft import PrecisionShaft
from app.services.cad.components.crank.hand_crank import HandCrank
from app.services.cad.components.fasteners.bushing import FlangedBushing

class MechanismAssemblyBuilder:
    """
    Deterministic CAD Assembly generator.
    Converts a valid MechanismGrammar into fully instantiated 3D solid geometry and watertight meshes.
    Guarantees deterministic CAD assembly: same grammar input produces deterministic derived/build output.
    """

    def __init__(self, profile: Optional[PrinterProfile] = None):
        self.profile = profile or PrinterProfile()
        self.solver = SingleStageSpurGearboxSolver()

    def build(
        self,
        grammar: MechanismGrammar,
        validation_result: Optional[ConstraintValidationResult] = None,
        output_dir: Optional[Path] = None,
    ) -> Dict[str, Any]:
        """
        Validates grammar (if not already pre-validated) and constructs deterministic CAD assembly.
        Raises ValueError if grammar fails constraint solver.
        """
        val_res = validation_result or self.solver.validate(grammar)
        if not val_res.is_valid:
            err_codes = [e.code for e in val_res.errors]
            raise ValueError(f"Cannot build assembly: MechanismGrammar failed validation with errors: {err_codes}")

        derived = val_res.derived
        assert derived is not None, "Derived parameters must be populated for valid grammar"

        comp_map = {c.id: c for c in grammar.components}

        # Identify driver and driven gears semantically
        mesh_rel = next(r for r in grammar.relations if r.type == "gear_mesh")
        src_comp = comp_map[mesh_rel.source]
        tgt_comp = comp_map[mesh_rel.target]

        if src_comp.role == "driver" or tgt_comp.role == "driven":
            driver_gear_comp = src_comp
            driven_gear_comp = tgt_comp
        elif tgt_comp.role == "driver" or src_comp.role == "driven":
            driver_gear_comp = tgt_comp
            driven_gear_comp = src_comp
        else:
            driver_gear_comp = src_comp
            driven_gear_comp = tgt_comp

        # Resolve driver and driven shafts from relations (independent of list order)
        gear_to_shaft: Dict[str, str] = {}
        for rel in grammar.relations:
            if rel.type in {"fixed", "coaxial"}:
                c1 = comp_map.get(rel.source)
                c2 = comp_map.get(rel.target)
                if c1 and c2:
                    if c1.type == "spur_gear" and c2.type == "shaft":
                        gear_to_shaft[c1.id] = c2.id
                    elif c1.type == "shaft" and c2.type == "spur_gear":
                        gear_to_shaft[c2.id] = c1.id

        driver_shaft_id = gear_to_shaft.get(driver_gear_comp.id)
        driven_shaft_id = gear_to_shaft.get(driven_gear_comp.id)

        driver_shaft_comp = comp_map.get(driver_shaft_id) if driver_shaft_id else None
        driven_shaft_comp = comp_map.get(driven_shaft_id) if driven_shaft_id else None

        # Fallback to roles if needed
        if not driver_shaft_comp:
            driver_shaft_comp = next((c for c in grammar.components if c.type == "shaft" and c.role == "input_shaft"), None)
        if not driven_shaft_comp:
            driven_shaft_comp = next((c for c in grammar.components if c.type == "shaft" and c.role == "output_shaft"), None)

        if not driver_shaft_comp or not driven_shaft_comp:
            remaining_shafts = [c for c in grammar.components if c.type == "shaft"]
            if not driver_shaft_comp and remaining_shafts:
                driver_shaft_comp = remaining_shafts[0]
            if not driven_shaft_comp and len(remaining_shafts) > 1:
                driven_shaft_comp = remaining_shafts[1]

        if not driver_shaft_comp or not driven_shaft_comp:
            raise ValueError("Unable to resolve driver and driven shafts from mechanism relations or roles")

        # Extract parameters
        m = extract_numeric_value(driver_gear_comp.parameters.get("module"), 1.5)
        z1 = int(extract_numeric_value(driver_gear_comp.parameters.get("teeth_count"), 16))
        z2 = int(extract_numeric_value(driven_gear_comp.parameters.get("teeth_count"), 32))
        fw1 = extract_numeric_value(driver_gear_comp.parameters.get("face_width") or driver_gear_comp.parameters.get("height"), 10.0)
        fw2 = extract_numeric_value(driven_gear_comp.parameters.get("face_width") or driven_gear_comp.parameters.get("height"), 10.0)
        b1 = extract_numeric_value(driver_gear_comp.parameters.get("bore_diameter"), 5.0)
        b2 = extract_numeric_value(driven_gear_comp.parameters.get("bore_diameter"), 5.0)
        pa1 = extract_numeric_value(driver_gear_comp.parameters.get("pressure_angle_deg"), 20.0)

        # Shaft dimensions
        s1_dia = extract_numeric_value(driver_shaft_comp.parameters.get("diameter"), 5.0)
        s1_len = extract_numeric_value(driver_shaft_comp.parameters.get("length"), 45.0)
        s2_dia = extract_numeric_value(driven_shaft_comp.parameters.get("diameter"), 5.0)
        s2_len = extract_numeric_value(driven_shaft_comp.parameters.get("length"), 45.0)

        # Frame
        frame_comp = next((c for c in grammar.components if c.type == "frame"), None)
        frame_thick = extract_numeric_value(frame_comp.parameters.get("thickness"), 6.0) if frame_comp else 6.0

        # Crank
        crank_comp = next((c for c in grammar.components if c.type == "crank"), None)

        # Bushings (sorted deterministically by ID to ensure order independence)
        bushing_comps = sorted([c for c in grammar.components if c.type == "bushing"], key=lambda c: c.id)

        center_dist = derived.center_distance_mm
        backlash = self.profile.fit_profiles.backlash
        rotating_fit = self.profile.fit_profiles.rotating_fit

        # 1. Instantiate Canonical Generators
        g1 = InvoluteSpurGear(
            module=m,
            teeth_count=z1,
            pressure_angle_deg=pa1,
            face_width=fw1,
            bore_diameter=b1,
            backlash=backlash,
            fit_clearance=rotating_fit,
            is_d_cut=True,
        )
        g2 = InvoluteSpurGear(
            module=m,
            teeth_count=z2,
            pressure_angle_deg=pa1,
            face_width=fw2,
            bore_diameter=b2,
            backlash=backlash,
            fit_clearance=rotating_fit,
            is_d_cut=False,
        )
        frame = GearboxFrame(
            center_distance=center_dist,
            shaft_diameter=s1_dia,
            thickness=frame_thick,
        )
        shaft1 = PrecisionShaft(diameter=s1_dia, length=s1_len, is_d_cut=True)
        shaft2 = PrecisionShaft(diameter=s2_dia, length=s2_len, is_d_cut=False)

        crank = None
        if crank_comp:
            arm_len = extract_numeric_value(crank_comp.parameters.get("arm_length"), 38.0)
            crank = HandCrank(arm_length=arm_len, shaft_dia=s1_dia)

        bushings = []
        for b_comp in bushing_comps:
            in_dia = extract_numeric_value(b_comp.parameters.get("inner_diameter"), s1_dia)
            out_dia = extract_numeric_value(b_comp.parameters.get("outer_diameter"), 8.0)
            flange_dia = extract_numeric_value(b_comp.parameters.get("flange_diameter"), 12.0)
            sleeve_len = extract_numeric_value(b_comp.parameters.get("sleeve_length"), 6.0)
            flange_thick = extract_numeric_value(b_comp.parameters.get("flange_thickness"), 2.0)
            bushings.append(
                FlangedBushing(
                    inner_diameter=in_dia,
                    outer_diameter=out_dia,
                    flange_diameter=flange_dia,
                    sleeve_length=sleeve_len,
                    flange_thickness=flange_thick,
                )
            )

        # 2. Build Watertight Component Meshes
        m_g1 = g1.to_trimesh()
        m_g2 = g2.to_trimesh()
        m_frame = frame.to_trimesh()
        m_s1 = shaft1.to_trimesh()
        m_s2 = shaft2.to_trimesh()

        # 3. Position Components in World Assembly Frame
        # Frame at Z=0
        # Shaft 1 at (-center_dist / 2, 0)
        # Shaft 2 at (center_dist / 2, 0)
        m_s1.apply_translation([-center_dist / 2.0, 0.0, -2.0])
        m_s2.apply_translation([center_dist / 2.0, 0.0, -2.0])

        # Gear 1 at (-center_dist / 2, 0, 8.0)
        m_g1.apply_translation([-center_dist / 2.0, 0.0, 8.0])

        # Gear 2 at (center_dist / 2, 0, 8.0) with half-pitch tooth mesh rotation
        rot_mesh = trimesh.transformations.rotation_matrix(math.pi / z2, [0, 0, 1])
        m_g2.apply_transform(rot_mesh)
        m_g2.apply_translation([center_dist / 2.0, 0.0, 8.0])

        parts_map: Dict[str, trimesh.Trimesh] = {
            driver_gear_comp.id: m_g1,
            driven_gear_comp.id: m_g2,
            frame_comp.id if frame_comp else "frame": m_frame,
            driver_shaft_comp.id: m_s1,
            driven_shaft_comp.id: m_s2,
        }

        if crank and crank_comp:
            m_crank = crank.to_trimesh()
            m_crank.apply_translation([-center_dist / 2.0, 0.0, 18.0])
            parts_map[crank_comp.id] = m_crank

        for idx, (b_obj, b_comp) in enumerate(zip(bushings, bushing_comps)):
            m_b = b_obj.to_trimesh()
            pos_x = -center_dist / 2.0 if idx % 2 == 0 else center_dist / 2.0
            m_b.apply_translation([pos_x, 0.0, 0.0])
            parts_map[b_comp.id] = m_b

        # 4. Optional STL Export
        exported_files: Dict[str, str] = {}
        if output_dir:
            out_path = Path(output_dir)
            out_path.mkdir(parents=True, exist_ok=True)
            for part_name, mesh in parts_map.items():
                stl_file = out_path / f"{part_name}.stl"
                mesh.export(str(stl_file), file_type="stl")
                exported_files[part_name] = str(stl_file)

        return {
            "status": "success",
            "grammar_version": grammar.grammar_version,
            "family": grammar.family,
            "seed": grammar.seed,
            "derived": derived.model_dump(),
            "parts": parts_map,
            "exported_files": exported_files,
            "untested_aspects": val_res.untested_aspects,
            "metadata": {
                "builder_version": "0.1.0",
                "center_distance_mm": center_dist,
                "gear_ratio": derived.gear_ratio,
                "parts_count": len(parts_map),
            }
        }
