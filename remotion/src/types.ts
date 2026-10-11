export const MOUTHS = ['closed', 'small', 'oh', 'teeth', 'big', 'wide'] as const;
export type MouthShape = (typeof MOUTHS)[number];

export const ACTIONS = ['idle', 'point', 'shrug', 'bounce', 'wave'] as const;
export type Action = (typeof ACTIONS)[number];

export const TRANSITIONS = ['slide-left', 'slide-right', 'cut', 'zoom', 'whip'] as const;
export type Transition = (typeof TRANSITIONS)[number];

export const CAMERAS = ['static', 'zoom-in', 'zoom-out', 'pan-left', 'pan-right'] as const;
export type Camera = (typeof CAMERAS)[number];

export const ROLES = ['hook', 'myth', 'step', 'payoff', 'outro'] as const;
export type Role = (typeof ROLES)[number];

export const POSITIONS = ['left', 'centre', 'right'] as const;
export type Position = (typeof POSITIONS)[number];

export type Word = { word: string; start: number; end: number; emphasis: boolean };

export type Shot = {
  id: number;
  role: Role;
  start: number;
  end: number;
  label?: string;
  image?: string;
  character: { position: Position; action: Action };
  transition: Transition;
  camera: Camera;
  sfx?: { name: string; at: number };
  words: Word[];
};

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  voice: string;
  music?: string;
  duration: number;
  seed: number;
  shots: Shot[];
};

/** x is -1..1 across the frame; faceX in px; tilt and arms in degrees. */
export type GuyPose = {
  x: number;
  faceX: number;
  tilt: number;
  bob: number;
  mouth: MouthShape;
  leftArm: number;
  rightArm: number;
};
