"""
Automated Manufacturability Validator Pipeline (G1 ~ G4) for EduMechanic 3D
Validates Geometry, 3D Printer Constraints, Multi-Part Assembly Clearance, and Slicing.
"""
import math
import shutil
import subprocess
from typing import List, Dict, Any, Tuple, Optional
import trimesh
import numpy as np
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union

from app.schemas.spec import (
    PrinterProfile,
    PrintReadinessTier,
    GateValidationDetail,
    ManufacturabilityReport
)

class ManufacturabilityValidator:
    def __init__(self, profile: Optional[PrinterProfile] = None):
        self.profile = profile or PrinterProfile()

    # =========================================================================
    # GATE G1: Geometry Integrity Validation
    # =========================================================================
    def validate_g1_geometry(self, mesh: trimesh.Trimesh, part_id: str = "part") -> GateValidationDetail:
        """
        Validates watertightness, 2-manifold edges, positive volume, and degenerate faces.
        """
        errors = []
        warnings = []
        metrics = {
            "part_id": part_id,
            "vertex_count": len(mesh.vertices),
            "face_count": len(mesh.faces),
            "is_watertight": bool(mesh.is_watertight),
            "volume_mm3": round(float(mesh.volume), 2) if mesh.is_watertight else 0.0,
            "is_winding_consistent": bool(mesh.is_winding_consistent)
        }

        # 1. Watertight check
        if not mesh.is_watertight:
            errors.append(f"[{part_id}] 메쉬가 닫혀있지 않습니다 (Non-watertight). 구멍이나 열린 에지가 존재합니다.")

        # 2. Positive volume check
        if mesh.volume <= 0.0:
            errors.append(f"[{part_id}] 메쉬 체적이 0 이하입니다 (Volume <= 0). 법선 벡터가 반전되었을 수 있습니다.")

        # 3. Degenerate faces check (Zero-area triangles)
        areas = mesh.area_faces
        degenerate_count = int(np.sum(areas < 1e-6))
        metrics["degenerate_faces"] = degenerate_count
        if degenerate_count > 0:
            warnings.append(f"[{part_id}] 넓이가 0에 가까운 퇴화 삼각형(Degenerate faces) {degenerate_count}개가 발견되었습니다.")

        # 4. Disconnected shells
        try:
            bodies = mesh.split(only_watertight=False)
            metrics["disconnected_bodies"] = len(bodies)
            if len(bodies) > 1:
                warnings.append(f"[{part_id}] 분리된 독립 쉘(Disconnected shells)이 {len(bodies)}개 감지되었습니다.")
        except Exception:
            pass

        passed = len(errors) == 0
        score = 100 if passed else max(0, 100 - len(errors) * 40 - len(warnings) * 10)

        return GateValidationDetail(
            gate="G1",
            name="Geometry Integrity Validation",
            passed=passed,
            score=score,
            errors=errors,
            warnings=warnings,
            metrics=metrics
        )

    # =========================================================================
    # GATE G2: Printer Constraints Validation
    # =========================================================================
    def validate_g2_printer(self, mesh: trimesh.Trimesh, part_id: str = "part") -> GateValidationDetail:
        """
        Validates minimum wall thickness, overhang angles, build volume limits, and bed contact.
        """
        errors = []
        warnings = []
        metrics = {}

        # 1. Build volume check
        extents = mesh.extents
        metrics["bounding_box_mm"] = [round(float(x), 2) for x in extents]
        bv = self.profile.build_volume

        for i, (dim_name, actual, max_dim) in enumerate(zip(["X", "Y", "Z"], extents, bv)):
            if actual > max_dim:
                errors.append(f"[{part_id}] {dim_name}축 치수({actual:.1f}mm)가 프린터 빌드 볼륨({max_dim:.1f}mm)을 초과합니다.")

        # 2. Overhang angle analysis
        # Overhang angle against bed-normal (-Z)
        face_normals = mesh.face_normals
        z_min = float(mesh.bounds[0][2])
        face_centers_z = mesh.triangles_center[:, 2]

        # Exclude faces that are already touching the bottom bed (within 0.5mm of z_min)
        not_bed_mask = face_centers_z > (z_min + 0.4)
        downward_normals_z = face_normals[:, 2]

        # Overhang threshold: Z component of normal < -sin(max_overhang_deg)
        crit_z = -math.sin(math.radians(self.profile.max_overhang_deg))
        overhang_mask = not_bed_mask & (downward_normals_z < crit_z)
        
        overhang_faces = int(np.sum(overhang_mask))
        overhang_area = float(np.sum(mesh.area_faces[overhang_mask]))
        total_area = float(mesh.area) or 1.0
        overhang_ratio = overhang_area / total_area

        metrics["overhang_face_count"] = overhang_faces
        metrics["overhang_area_ratio"] = round(overhang_ratio, 4)
        metrics["max_overhang_deg"] = self.profile.max_overhang_deg

        if overhang_ratio > 0.15:
            errors.append(f"[{part_id}] {self.profile.max_overhang_deg}° 초과 급경사 오버행 면적 비율이 {overhang_ratio*100:.1f}%로 높아 서포트 없이 출력 시 흘러내립니다.")
        elif overhang_ratio > 0.05:
            warnings.append(f"[{part_id}] 미세 오버행({overhang_ratio*100:.1f}%)이 감지되었습니다. 챔퍼 보강 또는 서포트 사용을 검토하세요.")

        # 3. Minimum wall thickness proxy (heuristic check of minimum extent across bounding axes)
        min_wall_target = self.profile.min_wall_thickness
        min_extent = float(min(extents))
        metrics["min_bounding_extent_mm"] = round(min_extent, 2)
        metrics["wall_thickness_method"] = "bounding_extent_proxy"
        if min_extent < min_wall_target:
            errors.append(f"[{part_id}] 부품 최소 바운딩 치수({min_extent:.2f}mm, 프록시 검사)가 최저 허용 벽 두께({min_wall_target}mm)보다 얇습니다.")

        # 4. Bed Contact Area
        bed_faces_mask = face_centers_z <= (z_min + 0.4)
        bed_area = float(np.sum(mesh.area_faces[bed_faces_mask]))
        metrics["bed_contact_area_mm2"] = round(bed_area, 2)
        if bed_area < 25.0:
            warnings.append(f"[{part_id}] 베드 접촉 면적({bed_area:.1f}mm²)이 좁아 브림(Brim) 설정이 권장됩니다.")

        passed = len(errors) == 0
        score = 100 if passed else max(0, 100 - len(errors) * 35 - len(warnings) * 10)

        return GateValidationDetail(
            gate="G2",
            name="Printer Constraints Validation",
            passed=passed,
            score=score,
            errors=errors,
            warnings=warnings,
            metrics=metrics
        )

    # =========================================================================
    # GATE G3: Multi-Part Assembly & Interference Validation
    # =========================================================================
    def validate_g3_assembly(
        self,
        parts: Dict[str, trimesh.Trimesh],
        assembly_relations: Optional[List[Dict[str, Any]]] = None
    ) -> GateValidationDetail:
        """
        Validates spatial collision between assembled parts, fit clearances, and gear center distances.
        """
        errors = []
        warnings = []
        metrics = {
            "part_names": list(parts.keys()),
            "interferences": [],
            "collision_detection_method": "aabb_grid_sampled_approximate"
        }

        # 1. Pairwise AABB & Vertex-Containment Interference Check
        part_keys = list(parts.keys())
        has_collision = False

        for i in range(len(part_keys)):
            for j in range(i + 1, len(part_keys)):
                p1, p2 = part_keys[i], part_keys[j]
                m1, m2 = parts[p1], parts[p2]

                # AABB overlap
                overlap_min = np.maximum(m1.bounds[0], m2.bounds[0])
                overlap_max = np.minimum(m1.bounds[1], m2.bounds[1])
                overlap_dims = np.maximum(0.0, overlap_max - overlap_min)

                if np.all(overlap_dims > 0.2):
                    # Test interior grid points inside the intersection bounding box
                    xs = np.linspace(overlap_min[0] + 0.1, overlap_max[0] - 0.1, 3)
                    ys = np.linspace(overlap_min[1] + 0.1, overlap_max[1] - 0.1, 3)
                    zs = np.linspace(overlap_min[2] + 0.1, overlap_max[2] - 0.1, 3)
                    grid = np.array(np.meshgrid(xs, ys, zs)).T.reshape(-1, 3)

                    in_both = int(np.sum(m1.contains(grid) & m2.contains(grid)))

                    if in_both > 0:
                        has_collision = True
                        overlap_vol = float(np.prod(overlap_dims))
                        errors.append(f"[{p1} <-> {p2}] 부품 간 3D 물리적 간섭(근사 격자 샘플링: 간섭 체적 ~{overlap_vol:.2f}mm³, {in_both}/27개 격자점 충돌)이 감지되었습니다.")
                        metrics["interferences"].append({"part1": p1, "part2": p2, "volume_approx": overlap_vol, "colliding_points": in_both})
                    else:
                        warnings.append(f"[{p1} <-> {p2}] 부품 경계면이 맞닿아 있습니다 (접촉면 간극 미세).")

        metrics["has_collision"] = has_collision

        # 2. Assembly relation checks (Gear center distance & Shaft-bore fits)
        if assembly_relations:
            for rel in assembly_relations:
                rel_type = rel.get("type")
                if rel_type == "gear_mesh":
                    # Center distance check
                    actual_dist = float(rel.get("actual_center_dist", 0.0))
                    target_dist = float(rel.get("target_center_dist", 0.0))
                    dist_err = abs(actual_dist - target_dist)
                    metrics["gear_center_distance_error_mm"] = round(dist_err, 4)
                    if dist_err > 0.05:
                        errors.append(f"[기어 맞물림] 실제 축간거리({actual_dist:.2f}mm)가 목표 중심거리({target_dist:.2f}mm)와 불일치합니다.")

                elif rel_type == "shaft_bore_fit":
                    shaft_dia = float(rel.get("shaft_dia", 5.0))
                    bore_dia = float(rel.get("bore_dia", 5.0))
                    clearance = bore_dia - shaft_dia
                    fit_type = rel.get("fit_type", "rotating_fit")
                    req_clearance = getattr(self.profile.fit_profiles, fit_type, 0.35)

                    metrics[f"clearance_{rel.get('shaft_id')}_{rel.get('bore_id')}"] = round(clearance, 3)
                    if clearance < (req_clearance - 0.08):
                        errors.append(f"[{rel.get('shaft_id')} in {rel.get('bore_id')}] 결합 간극({clearance:.2f}mm)이 {fit_type} 요구치({req_clearance:.2f}mm)보다 좁아 뻑뻑하거나 결합되지 않습니다.")

        passed = len(errors) == 0
        score = 100 if passed else max(0, 100 - len(errors) * 35 - len(warnings) * 10)

        return GateValidationDetail(
            gate="G3",
            name="Assembly & Interference Validation",
            passed=passed,
            score=score,
            errors=errors,
            warnings=warnings,
            metrics=metrics
        )

    # =========================================================================
    # GATE G4: Slicing & Layer Generation Validation
    # =========================================================================
    def validate_g4_slicing(self, mesh: trimesh.Trimesh, part_id: str = "part") -> GateValidationDetail:
        """
        Performs layer-by-layer planar slicing, checks unsupported islands, and calculates real filament metrics.
        """
        errors = []
        warnings = []
        layer_h = self.profile.layer_height
        z_min, z_max = float(mesh.bounds[0][2]), float(mesh.bounds[1][2])
        total_height = z_max - z_min

        num_layers = max(1, int(math.ceil(total_height / layer_h)))
        slice_z_levels = np.linspace(z_min + (layer_h / 2.0), z_max - (layer_h / 2.0), num_layers)

        layer_areas = []
        unsupported_island_count = 0
        prev_polygons = None

        max_overhang_step = layer_h * math.tan(math.radians(self.profile.max_overhang_deg))
        step = max(1, num_layers // 50)
        
        for idx in range(0, num_layers, step):
            z_plane = slice_z_levels[idx]
            try:
                section = mesh.section(plane_origin=[0, 0, z_plane], plane_normal=[0, 0, 1])
                if section is None:
                    continue

                planar, _ = section.to_2D()
                polys = planar.polygons_closed

                if len(polys) == 0:
                    continue

                # Sort by area descending: outer perimeter is largest
                sorted_polys = sorted(polys, key=lambda p: p.area, reverse=True)
                outer = sorted_polys[0]
                inner_holes = sorted_polys[1:]
                
                curr_poly = outer
                for hole in inner_holes:
                    curr_poly = curr_poly.difference(hole)

                layer_areas.append(float(curr_poly.area))

                # Island check against previous layer
                if prev_polygons is not None and idx > 0:
                    supported_zone = prev_polygons.buffer(max_overhang_step * step)
                    floating_zone = curr_poly.difference(supported_zone)
                    if not floating_zone.is_empty and floating_zone.area > 2.0:
                        unsupported_island_count += 1

                prev_polygons = curr_poly

            except Exception:
                continue

        # Real material and print estimation metrics
        avg_layer_area = float(np.mean(layer_areas)) if layer_areas else float(mesh.volume / max(total_height, 0.1))
        infill_ratio = 0.25
        est_filament_volume_mm3 = avg_layer_area * total_height * infill_ratio
        est_filament_mass_g = (est_filament_volume_mm3 / 1000.0) * 1.24  # PLA density ~ 1.24 g/cm3
        est_filament_len_m = est_filament_volume_mm3 / (math.pi * (1.75 / 2.0)**2) / 1000.0

        est_print_time_min = max(4, int(math.ceil(est_filament_mass_g * 1.35 + (num_layers * 0.05))))

        metrics = {
            "part_id": part_id,
            "layer_height_mm": layer_h,
            "total_layers": num_layers,
            "sampled_layers": len(layer_areas),
            "unsupported_islands": unsupported_island_count,
            "estimated_filament_mass_g": round(est_filament_mass_g, 2),
            "estimated_filament_length_m": round(est_filament_len_m, 2),
            "estimated_print_time_min": est_print_time_min
        }

        if len(layer_areas) == 0:
            errors.append(f"[{part_id}] 슬라이싱 단면 생성에 실패했습니다. 유효한 2D 폴리곤 레이어가 없습니다.")

        if unsupported_island_count > 3:
            warnings.append(f"[{part_id}] 공중에 떠 있는 비지지 아일랜드(Floating islands)가 {unsupported_island_count}개 감지되었습니다. 지지대(Support) 생성이 권장됩니다.")

        passed = len(errors) == 0
        score = 100 if passed else 0

        return GateValidationDetail(
            gate="G4",
            name="Slicing & Layer Generation Validation",
            passed=passed,
            score=score,
            errors=errors,
            warnings=warnings,
            metrics=metrics
        )

    # =========================================================================
    # OVERALL READINESS DECISION
    # =========================================================================
    def evaluate_print_readiness(
        self,
        parts: Dict[str, trimesh.Trimesh],
        assembly_relations: Optional[List[Dict[str, Any]]] = None,
        is_concept_mode: bool = False
    ) -> ManufacturabilityReport:
        """
        Aggregates G1~G4 validation gates and assigns Print Readiness Tier.
        """
        if is_concept_mode:
            return ManufacturabilityReport(
                tier=PrintReadinessTier.CONCEPT,
                overall_passed=False,
                score=35,
                summary="사진 및 아이디어 기반 초기 개념 모델입니다. 실물 출력 전 치수 정의가 필요합니다."
            )

        g1_results = [self.validate_g1_geometry(m, name) for name, m in parts.items()]
        g2_results = [self.validate_g2_printer(m, name) for name, m in parts.items()]
        g3_result = self.validate_g3_assembly(parts, assembly_relations)
        g4_results = [self.validate_g4_slicing(m, name) for name, m in parts.items()]

        # Aggregate G1
        g1_passed = all(r.passed for r in g1_results)
        g1_errors = [e for r in g1_results for e in r.errors]
        g1_warnings = [w for r in g1_results for w in r.warnings]
        g1_avg_score = int(np.mean([r.score for r in g1_results])) if g1_results else 0
        g1_combined = GateValidationDetail(
            gate="G1", name="Geometry Integrity", passed=g1_passed, score=g1_avg_score,
            errors=g1_errors, warnings=g1_warnings, metrics={"parts_checked": len(parts)}
        )

        # Aggregate G2
        g2_passed = all(r.passed for r in g2_results)
        g2_errors = [e for r in g2_results for e in r.errors]
        g2_warnings = [w for r in g2_results for w in r.warnings]
        g2_avg_score = int(np.mean([r.score for r in g2_results])) if g2_results else 0
        g2_combined = GateValidationDetail(
            gate="G2", name="Printer Constraints", passed=g2_passed, score=g2_avg_score,
            errors=g2_errors, warnings=g2_warnings, metrics={"parts_checked": len(parts)}
        )

        # G3
        g3_passed = g3_result.passed

        # Aggregate G4
        g4_passed = all(r.passed for r in g4_results)
        g4_errors = [e for r in g4_results for e in r.errors]
        g4_warnings = [w for r in g4_results for w in r.warnings]
        g4_avg_score = int(np.mean([r.score for r in g4_results])) if g4_results else 0
        total_time_min = sum(r.metrics.get("estimated_print_time_min", 0) for r in g4_results)
        total_filament_g = sum(r.metrics.get("estimated_filament_mass_g", 0) for r in g4_results)
        g4_combined = GateValidationDetail(
            gate="G4", name="Slicing Validation", passed=g4_passed, score=g4_avg_score,
            errors=g4_errors, warnings=g4_warnings,
            metrics={"total_print_time_min": total_time_min, "total_filament_mass_g": round(total_filament_g, 2)}
        )

        overall_passed = g1_passed and g2_passed and g3_passed and g4_passed
        overall_score = int((g1_avg_score + g2_avg_score + g3_result.score + g4_avg_score) / 4.0)

        # Determine Tier
        if overall_passed:
            tier = PrintReadinessTier.PRINT_READY
            summary = (
                f"[Print Ready (Computationally Prevalidated)] G1~G4 컴퓨터 계산 사전 검증 통과 "
                f"(기하·프린터 범위·샘플링 간섭·슬라이스 단면 기준). "
                f"실물 출력 및 조립 적합성은 프린터 캘리브레이션 및 물리 테스트가 필요합니다. "
                f"(예상 출력시간: ~{total_time_min}분, 필라멘트: {total_filament_g:.1f}g)"
            )
        elif g1_passed and g2_passed:
            tier = PrintReadinessTier.PROTOTYPE
            summary = "⚠️ [Prototype] 외형 및 슬라이스는 가능하나, 조립 간섭 또는 공차 보완이 권장되는 시험 출력 단계입니다."
        else:
            tier = PrintReadinessTier.CONCEPT
            summary = "❌ [Concept] 기하 형상 또는 프린터 규격 오류로 출력이 불가능합니다. 파라메터 수정이 필요합니다."

        all_recommendations = []
        if not g1_passed:
            all_recommendations.append("메쉬 토폴로지 오류를 수정하여 방수체(Watertight Solid)로 변환하세요.")
        if not g2_passed:
            all_recommendations.append("45도 초과 급경사면에 챔퍼를 주입하거나 출력 방향(Orientation)을 조정하세요.")
        if not g3_passed:
            all_recommendations.append("축-구멍 회전 공차(0.35mm 이상) 및 기어 중심거리를 점검하여 간섭을 제거하세요.")
        if g4_warnings:
            all_recommendations.append("출력 베드 접착력을 높이기 위해 브림(Brim) 설정을 켜고 슬라이스하세요.")

        return ManufacturabilityReport(
            tier=tier,
            overall_passed=overall_passed,
            score=overall_score,
            g1_geometry=g1_combined,
            g2_printer=g2_combined,
            g3_assembly=g3_result,
            g4_slicing=g4_combined,
            summary=summary,
            recommendations=all_recommendations
        )

manufacturability_validator = ManufacturabilityValidator()
