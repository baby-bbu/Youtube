/**
 * Loudness of the voice for each video frame, 0..1, used to drive the mouth.
 * Each frame is the RMS of its slice of audio, divided by the 95th percentile of the
 * non-silent frames so that a quietly recorded voice still opens the mouth fully.
 */
export function loudnessSeries(
  samples: ArrayLike<number>,
  sampleRate: number,
  fps: number,
  durationSeconds: number,
): number[] {
  const frames = Math.ceil(durationSeconds * fps);
  const rms: number[] = [];
  for (let f = 0; f < frames; f++) {
    const from = Math.floor((f / fps) * sampleRate);
    const to = Math.min(samples.length, Math.floor(((f + 1) / fps) * sampleRate));
    let sum = 0;
    for (let i = from; i < to; i++) sum += samples[i] * samples[i];
    rms.push(to > from ? Math.sqrt(sum / (to - from)) : 0);
  }

  const active = rms.filter((v) => v > 1e-9).sort((a, b) => a - b);
  if (active.length === 0) return rms.map(() => 0);
  const p95 = active[Math.min(active.length - 1, Math.floor(active.length * 0.95))];
  return rms.map((v) => Math.min(1, Math.max(0, v / p95)));
}

export function loudnessAtFrame(series: number[], frame: number): number {
  return series[frame] ?? 0;
}
