/**
 * Mechanism Grammar TypeScript Definitions v0.1
 * Matches app.schemas.grammar for single_stage_spur_gearbox.
 */

export type MechanismFamily = 'single_stage_spur_gearbox';

export type PrimitiveType =
  | 'spur_gear'
  | 'shaft'
  | 'bushing'
  | 'frame'
  | 'crank';

export type RelationType =
  | 'coaxial'
  | 'fixed'
  | 'revolute'
  | 'gear_mesh'
  | 'supported_by';

export type ParameterProvenance =
  | 'measured'
  | 'literature'
  | 'manufacturer_spec'
  | 'assumed';

export interface ProvenanceValue<T = number | string> {
  value: T;
  provenance: ParameterProvenance;
  source?: string;
}

export interface RejectionDiagnostic {
  code: string;
  path: string;
  message: string;
  severity: 'error' | 'warning';
  observed?: unknown;
  expected?: unknown;
}

export interface DerivedParameters {
  d1_pitch_diameter_mm: number;
  d2_pitch_diameter_mm: number;
  center_distance_mm: number;
  gear_ratio: number;
  speed_ratio: number;
  tip_diameter_1_mm: number;
  tip_diameter_2_mm: number;
  root_diameter_1_mm: number;
  root_diameter_2_mm: number;
}

export interface ConstraintValidationResult {
  is_valid: boolean;
  errors: RejectionDiagnostic[];
  warnings: RejectionDiagnostic[];
  derived?: DerivedParameters;
  untested_aspects: string[];
}

export interface ComponentNode {
  id: string;
  type: PrimitiveType | string;
  name: string;
  parameters: Record<string, unknown>;
  role?: 'driver' | 'driven' | 'input_shaft' | 'output_shaft' | 'main_frame' | 'crank' | string;
}

export interface RelationEdge {
  id: string;
  type: RelationType | string;
  source: string;
  target: string;
  parameters?: Record<string, unknown>;
}

export interface MechanismGrammar {
  grammar_version: string;
  family: MechanismFamily | string;
  seed: number;
  components: ComponentNode[];
  relations: RelationEdge[];
  metadata?: Record<string, unknown>;
}
