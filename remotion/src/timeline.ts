import {
  ACTIONS,
  CAMERAS,
  POSITIONS,
  ROLES,
  TRANSITIONS,
  type Shot,
  type Timeline,
  type Word,
} from './types';

export class TimelineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimelineError';
  }
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function num(o: Obj, key: string, ctx: string): number {
  const v = o[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new TimelineError(`${ctx}: "${key}" must be a number`);
  }
  return v;
}

function str(o: Obj, key: string, ctx: string): string {
  const v = o[key];
  if (typeof v !== 'string') throw new TimelineError(`${ctx}: "${key}" must be a string`);
  return v;
}

function oneOf<T extends string>(list: readonly T[], v: unknown, what: string, ctx: string): T {
  if (typeof v !== 'string' || !(list as readonly string[]).includes(v)) {
    throw new TimelineError(`${ctx}: unknown ${what} "${String(v)}" (allowed: ${list.join(', ')})`);
  }
  return v as T;
}

function parseWord(raw: unknown, ctx: string): Word {
  if (!isObj(raw)) throw new TimelineError(`${ctx}: word must be an object`);
  const word = str(raw, 'word', ctx);
  const start = num(raw, 'start', `${ctx} word "${word}"`);
  const end = num(raw, 'end', `${ctx} word "${word}"`);
  if (end < start) throw new TimelineError(`${ctx}: word "${word}" ends before it starts`);
  return { word, start, end, emphasis: raw.emphasis === true };
}

function parseShot(raw: unknown, index: number): Shot {
  if (!isObj(raw)) throw new TimelineError(`shot at index ${index} must be an object`);
  const id = num(raw, 'id', `shot at index ${index}`);
  const ctx = `shot ${id}`;
  const start = num(raw, 'start', ctx);
  const end = num(raw, 'end', ctx);
  if (end <= start) throw new TimelineError(`${ctx}: end must be after start`);
  const character = raw.character;
  if (!isObj(character)) throw new TimelineError(`${ctx}: "character" must be an object`);
  if (!Array.isArray(raw.words)) throw new TimelineError(`${ctx}: "words" must be an array`);
  const shot: Shot = {
    id,
    role: oneOf(ROLES, raw.role, 'role', ctx),
    start,
    end,
    character: {
      position: oneOf(POSITIONS, character.position, 'position', ctx),
      action: oneOf(ACTIONS, character.action, 'action', ctx),
    },
    transition: oneOf(TRANSITIONS, raw.transition, 'transition', ctx),
    camera: oneOf(CAMERAS, raw.camera, 'camera', ctx),
    words: raw.words.map((w) => parseWord(w, ctx)),
  };
  if (typeof raw.label === 'string') shot.label = raw.label;
  if (typeof raw.image === 'string') shot.image = raw.image;
  if (isObj(raw.sfx)) {
    shot.sfx = { name: str(raw.sfx, 'name', ctx), at: num(raw.sfx, 'at', ctx) };
  }
  return shot;
}

export function parseTimeline(raw: unknown): Timeline {
  if (!isObj(raw)) throw new TimelineError('timeline must be an object');
  const fps = num(raw, 'fps', 'timeline');
  if (fps <= 0) throw new TimelineError('timeline: "fps" must be positive');
  if (!Array.isArray(raw.shots) || raw.shots.length === 0) {
    throw new TimelineError('timeline: "shots" must be a non-empty array');
  }
  const shots = raw.shots.map(parseShot);
  for (let i = 1; i < shots.length; i++) {
    const prev = shots[i - 1];
    const cur = shots[i];
    if (cur.start < prev.start) {
      throw new TimelineError(`shot ${cur.id} is out of order (starts before shot ${prev.id})`);
    }
    if (cur.start < prev.end) {
      throw new TimelineError(
        `shot ${cur.id} overlaps shot ${prev.id} (starts at ${cur.start}, shot ${prev.id} ends at ${prev.end})`,
      );
    }
  }
  const tl: Timeline = {
    fps,
    width: num(raw, 'width', 'timeline'),
    height: num(raw, 'height', 'timeline'),
    voice: str(raw, 'voice', 'timeline'),
    duration: num(raw, 'duration', 'timeline'),
    seed: num(raw, 'seed', 'timeline'),
    shots,
  };
  if (typeof raw.music === 'string') tl.music = raw.music;
  return tl;
}

/** The shot on screen at time t. Gaps hold the previous shot; before the first, the first. */
export function shotAt(tl: Timeline, t: number): Shot {
  let found = tl.shots[0];
  for (const shot of tl.shots) {
    if (shot.start <= t) found = shot;
    else break;
  }
  return found;
}

/** The word being spoken at time t, or null between words or in a silent shot. */
export function wordAt(shot: Shot, t: number): Word | null {
  return shot.words.find((w) => t >= w.start && t < w.end) ?? null;
}
