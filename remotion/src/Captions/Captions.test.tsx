import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { CAPTION_FONT } from '../brand';
import { Captions } from './Captions';

const groups = [{ text: 'hello world', start: 1, end: 2 }];

describe('Captions', () => {
  test('shows the active group in the caption font', () => {
    const html = renderToStaticMarkup(<Captions groups={groups} frame={36} fps={30} />);
    expect(html).toContain('hello world');
    expect(html).toContain(CAPTION_FONT);
  });

  test('renders nothing when no group is active', () => {
    expect(renderToStaticMarkup(<Captions groups={groups} frame={0} fps={30} />)).toBe('');
  });
});
