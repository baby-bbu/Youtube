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

export const BGS = ['sun', 'sky', 'mint', 'coral', 'lilac', 'cream'] as const;
export type Bg = (typeof BGS)[number];

export const PROP_NAMES = [
  'nametag', 'clock', 'brain', 'bulb', 'sandwich', 'checklist', 'door', 'question',
  'star', 'xmark', 'check', 'lock', 'notebook', 'sparkle', 'couch', 'phone',
] as const;
export type PropName = (typeof PROP_NAMES)[number];

export const HATS = ['none', 'beanie', 'tophat', 'party', 'headband', 'curly'] as const;
export type Hat = (typeof HATS)[number];

/** How a scene item arrives. slide-left comes in from the left edge, slide-right from the right. */
export const ENTRANCES = ['pop', 'drop', 'slide-left', 'slide-right', 'rise', 'spin', 'fade'] as const;
export type Entrance = (typeof ENTRANCES)[number];

export const LOOPS = ['none', 'bob', 'wiggle', 'pulse', 'shake', 'spin'] as const;
export type Loop = (typeof LOOPS)[number];

export const SIDES = ['left', 'right'] as const;
export type Side = (typeof SIDES)[number];

export const TEXT_COLOURS = ['white', 'yellow', 'ink'] as const;
export type TextColour = (typeof TEXT_COLOURS)[number];

/**
 * When an item appears, in seconds after its shot starts, or "word:<text>" to appear
 * when that word is spoken. x and y are fractions of the frame (0..1) for the item's centre.
 */
export type At = number | string;

type ItemBase = { at?: At; anim?: Entrance; loop?: Loop; rot?: number };
export type SceneItem =
  | (ItemBase & { kind: 'prop'; name: PropName; x: number; y: number; size: number; text?: string })
  | (ItemBase & { kind: 'text'; text: string; x: number; y: number; size: number; colour?: TextColour })
  | (ItemBase & { kind: 'bubble'; text: string; x: number; y: number; size: number; tail: Side })
  | (ItemBase & { kind: 'buddy'; side: Side; hat: Hat; action: Action; holds?: PropName; talking?: boolean });
export type Scene = { bg: Bg; items: SceneItem[] };

export type Word = { word: string; start: number; end: number; emphasis: boolean };

export type Shot = {
  id: number;
  role: Role;
  start: number;
  end: number;
  label?: string;
  image?: string;
  scene?: Scene;
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
