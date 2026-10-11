import { describe, expect, test } from 'vitest';
import sample from '../../fixtures/timeline.sample.json';
import { parseTimeline } from '../timeline';
import { LABEL_SECONDS, shouldShowLabel } from './labelWindow';

const shot = parseTimeline(JSON.parse(JSON.stringify(sample))).shots[0]; // label + image, starts at 0

describe('shouldShowLabel', () => {
  test('shows the label during the first second of a shot that has a picture', () => {
    expect(shouldShowLabel(shot, 0)).toBe(true);
    expect(shouldShowLabel(shot, LABEL_SECONDS - 0.01)).toBe(true);
  });

  test('hides it afterwards', () => {
    expect(shouldShowLabel(shot, LABEL_SECONDS)).toBe(false);
  });

  test('hides it before the shot starts', () => {
    expect(shouldShowLabel({ ...shot, start: 2 }, 1.5)).toBe(false);
  });

  test('a shot with no label shows none', () => {
    expect(shouldShowLabel({ ...shot, label: undefined }, 0.2)).toBe(false);
  });

  test('a shot with no picture shows none: its title card already carries the word', () => {
    expect(shouldShowLabel({ ...shot, image: undefined }, 0.2)).toBe(false);
  });
});
