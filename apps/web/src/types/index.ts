export interface PrincipleItem {
  title: string;
  desc: string;
}

export interface PartSpec {
  id: string;
  name: string;
  function: string;
  desc: string;
  geometryType?: string;
  radiusTop?: number;
  radiusBottom?: number;
  height?: number;
  explodeOffset?: [number, number, number];
  color?: string;
  isRotating?: boolean;
}

export interface CommentData {
  id?: string;
  author: string;
  time: string;
  text: string;
  part: string;
}

export interface QuizData {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface MechanicalPreset {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  thumb: string;
  aiSummary: string;
  principles: PrincipleItem[];
  parts: PartSpec[];
  comments: CommentData[];
  quiz: QuizData;
}

export interface PinItem {
  id: string;
  partId: string;
  position: [number, number, number];
  content: string;
  author: string;
  createdAt: string;
}

export interface MakerParams {
  teethCount: number;
  shaftDiameter: number;
  appliedTolerance: number;
  tolerancePreset: 'precise_bambu' | 'standard_prusa' | 'school_ender';
  cotsMount: '608zz' | 'm3_bolt' | 'lego_pin' | 'd_shaft';
  isMicroPrint: boolean;
  showPrintabilityHeatmap: boolean;
}

export type ViewCameraPreset = 'iso' | 'top';
export type DrawerTabType = 'tab-inspect' | 'tab-team' | 'tab-quiz' | 'tab-maker';

