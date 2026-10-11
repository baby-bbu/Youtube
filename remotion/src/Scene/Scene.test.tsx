import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import sample from '../../fixtures/timeline.sample.json';
import { parseTimeline } from '../timeline';
import { Label } from './Label';
import { Scene } from './Scene';

const shot = parseTimeline(JSON.parse(JSON.stringify(sample))).shots[0];

describe('Scene', () => {
  // Remotion's <Img> only works inside a composition, so the unit test injects a plain <img>.
  // The real <Img> is exercised by the sample render in Task 8.
  const PlainImg = ({ src, style }: { src: string; style?: React.CSSProperties }) => (
    <img src={src} style={style} />
  );

  test('draws the shot image when there is one', () => {
    const html = renderToStaticMarkup(<Scene shot={shot} progress={0.5} Image={PlainImg} />);
    expect(html).toContain('<img');
    expect(html).toContain('fixtures/shot1.png');
  });

  test('without an image it draws a title card with the label and does not throw', () => {
    const html = renderToStaticMarkup(<Scene shot={{ ...shot, image: undefined }} progress={0.5} />);
    expect(html).not.toContain('<img');
    expect(html).toContain('COOKING');
  });

  test('a title card with no label falls back to RUNDOWN', () => {
    const html = renderToStaticMarkup(
      <Scene shot={{ ...shot, image: undefined, label: undefined }} progress={0} />,
    );
    expect(html).toContain('RUNDOWN');
  });
});

describe('Label', () => {
  test('shows its text', () => {
    expect(renderToStaticMarkup(<Label text="HARD?" />)).toContain('HARD?');
  });
});
