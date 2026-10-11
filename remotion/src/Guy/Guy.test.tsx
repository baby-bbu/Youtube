import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { MOUTHS, type GuyPose, type MouthShape } from '../types';
import { Guy } from './Guy';

const neutral: GuyPose = {
  x: 0,
  faceX: 0,
  tilt: 0,
  bob: 0,
  mouth: 'big',
  leftArm: 0,
  rightArm: 0,
};

const html = (pose: Partial<GuyPose> = {}, sticker?: boolean) =>
  renderToStaticMarkup(<Guy pose={{ ...neutral, ...pose }} sticker={sticker} />);

describe('Guy', () => {
  test('has the named character parts', () => {
    const out = html();
    for (const id of ['body', 'head', 'face', 'mouth', 'cap']) {
      expect(out).toContain(`id="${id}"`);
    }
  });

  test('has no feet', () => {
    expect(html()).not.toContain('id="foot"');
  });

  test('faceX slides the face group sideways', () => {
    expect(html({ faceX: 20 })).toMatch(/id="face"[^>]*translate\(20/);
  });

  test('tilt rotates the head group', () => {
    expect(html({ tilt: -7 })).toMatch(/id="head"[^>]*rotate\(-7/);
  });

  test('the six mouth shapes all draw differently', () => {
    const outputs = MOUTHS.map((m: MouthShape) => html({ mouth: m }));
    expect(new Set(outputs).size).toBe(6);
  });

  test('sticker outline is only present when asked for', () => {
    expect(html({}, true)).toContain('filter=');
    expect(html({})).not.toContain('filter=');
  });
});
