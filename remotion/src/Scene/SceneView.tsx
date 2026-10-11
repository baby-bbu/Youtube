import { CAPTION_FONT, COLORS, VIDEO } from '../brand';
import type { Bg, Shot, Scene, SceneItem, TextColour } from '../types';
import { Buddy } from './Buddy';
import { entrance, loopMotion, resolveAt } from './anim';
import { Prop } from './props';

const BG_COLOUR: Record<Bg, { base: string; dot: string; floor: string }> = {
  sun: { base: '#FFD400', dot: '#FFE46B', floor: '#E8BA00' },
  sky: { base: '#8FD3FF', dot: '#B9E5FF', floor: '#6FB9EA' },
  mint: { base: '#9BE8C0', dot: '#C2F3DA', floor: '#74CFA0' },
  coral: { base: '#FF9C8A', dot: '#FFC1B5', floor: '#EE7C69' },
  lilac: { base: '#C4B0FF', dot: '#DDD0FF', floor: '#A78DF0' },
  cream: { base: '#FFF1CC', dot: '#FFE29A', floor: '#EFD79A' },
};

/** Where the characters' feet touch the ground. */
export const FLOOR_Y = 1455;
export const BUDDY_SCALE = 1.1;
const FOREGROUND = '#FFFFFF';
const TEXT_FILL: Record<TextColour, string> = { white: '#fff', yellow: COLORS.yellow, ink: COLORS.ink };

/** Rough width in px of a line of bold text; used to keep bubbles and stamps on screen. */
export const textWidth = (text: string, size: number) =>
  Math.max(...text.split('\n').map((l) => l.length)) * size * 0.62;

type Placed = { at: number; style: React.CSSProperties };

function place(item: SceneItem, shot: Shot, time: number, base: { left: number; top: number; width: number; height: number }): Placed {
  const at = resolveAt(item.at, shot);
  const local = time - at;
  const e = entrance(item.anim ?? 'pop', local);
  const l = loopMotion(item.loop ?? 'none', Math.max(0, local));
  return {
    at,
    style: {
      position: 'absolute',
      ...base,
      opacity: e.opacity,
      visibility: e.visible ? 'visible' : 'hidden',
      transform: `translate(${e.x + l.x}px, ${e.y + l.y}px) rotate(${(item.rot ?? 0) + e.rot + l.rot}deg) scale(${e.scale * l.scale})`,
    },
  };
}

function ItemView({ item, shot, time }: { item: SceneItem; shot: Shot; time: number }) {
  const W = VIDEO.width;
  const H = VIDEO.height;
  const local = Math.max(0, time - resolveAt(item.at, shot));

  if (item.kind === 'prop') {
    const { style } = place(item, shot, time, {
      left: item.x * W - item.size / 2, top: item.y * H - item.size / 2, width: item.size, height: item.size,
    });
    return <div style={style}><Prop name={item.name} size={item.size} text={item.text} /></div>;
  }

  if (item.kind === 'text') {
    const w = textWidth(item.text, item.size) + 80;
    const { style } = place(item, shot, time, {
      left: item.x * W - w / 2, top: item.y * H - item.size * 0.6, width: w, height: item.size * 1.2,
    });
    return (
      <div style={{ ...style, textAlign: 'center', whiteSpace: 'pre', lineHeight: 1.05, fontFamily: CAPTION_FONT, fontWeight: 900, fontSize: item.size, color: TEXT_FILL[item.colour ?? 'white'], WebkitTextStroke: `${Math.round(item.size * 0.14)}px ${COLORS.ink}`, paintOrder: 'stroke fill' }}>
        {item.text}
      </div>
    );
  }

  if (item.kind === 'bubble') {
    const w = textWidth(item.text, item.size) + 70;
    const { style } = place(item, shot, time, {
      left: item.x * W - w / 2, top: item.y * H - item.size, width: w,
      height: item.text.split('\n').length * item.size * 1.15 + 56,
    });
    const tail: React.CSSProperties = {
      position: 'absolute', bottom: -22, [item.tail === 'left' ? 'left' : 'right']: 46, width: 38, height: 38,
      background: FOREGROUND, borderRight: `8px solid ${COLORS.ink}`, borderBottom: `8px solid ${COLORS.ink}`,
      transform: `rotate(${item.tail === 'left' ? 65 : 25}deg)`,
    };
    return (
      <div style={style}>
        <div style={{ position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box', background: FOREGROUND, border: `8px solid ${COLORS.ink}`, borderRadius: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', whiteSpace: 'pre', lineHeight: 1.1, fontFamily: CAPTION_FONT, fontWeight: 900, fontSize: item.size, color: COLORS.ink }}>
          {item.text}
          <div style={tail} />
        </div>
      </div>
    );
  }

  // buddy: the second stickman, optionally holding a prop out in front of him
  const s = BUDDY_SCALE;
  const cx = item.side === 'left' ? 285 : 795;
  const flip = item.side === 'right';
  const boxLeft = cx - 200 * s;
  const boxTop = FLOOR_Y - 406 * s - 8;
  const { style } = place(item, shot, time, { left: boxLeft, top: boxTop, width: 400 * s, height: 450 * s });
  const handX = (flip ? 400 - 248 : 248) * s;
  const handY = (296 - 70) * s;
  return (
    <div style={style}>
      <Buddy hat={item.hat} action={item.action} t={local} talking={item.talking} flip={flip} scale={s} holding={!!item.holds} />
      {item.holds && (
        <div style={{ position: 'absolute', left: handX + (flip ? -1 : 1) * 36 - 110, top: handY - 40, width: 220, height: 220 }}>
          <Prop name={item.holds} size={220} />
        </div>
      )}
    </div>
  );
}

/** A drawn scene: coloured backdrop with drifting dots, a floor, then the shot's items. */
export function SceneView({ scene, shot, time }: { scene: Scene; shot: Shot; time: number }) {
  const c = BG_COLOUR[scene.bg];
  const drift = (time * 14) % 80;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: c.base }}>
      <div
        style={{
          position: 'absolute', inset: -80,
          backgroundImage: `radial-gradient(${c.dot} 9px, transparent 10px)`,
          backgroundSize: '80px 80px', backgroundPosition: `${drift}px ${drift}px`,
        }}
      />
      <div style={{ position: 'absolute', left: 0, right: 0, top: FLOOR_Y, bottom: 0, background: c.floor, borderTop: `8px solid ${COLORS.ink}` }} />
      {scene.items.map((item, i) => (
        <ItemView key={i} item={item} shot={shot} time={time} />
      ))}
    </div>
  );
}
