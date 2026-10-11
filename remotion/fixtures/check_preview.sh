#!/usr/bin/env bash
# Fails (non-zero exit) unless the preview render is half size, half frame rate and the
# same length as the full sample render.
set -euo pipefail
cd "$(dirname "$0")/.."

start=$(date +%s)
npm run preview:sample > /dev/null
echo "preview render took $(( $(date +%s) - start ))s"

# ffprobe prints a trailing comma for video streams in csv mode; strip it.
probe_v() { ffprobe -v error -select_streams v:0 -show_entries "$1" -of csv=p=0 "$2" | sed 's/,$//'; }
probe_d() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

size=$(probe_v stream=width,height out/preview.mp4)
[ "$size" = "540,960" ] || { echo "FAIL: preview size is $size, expected 540,960"; exit 1; }

rate=$(probe_v stream=r_frame_rate out/preview.mp4)
[ "$rate" = "15/1" ] || { echo "FAIL: preview frame rate is $rate, expected 15/1"; exit 1; }

dp=$(probe_d out/preview.mp4)
ds=$(probe_d out/sample.mp4)
awk -v a="$dp" -v b="$ds" 'BEGIN { d = a - b; if (d < 0) d = -d; exit !(d <= 0.2) }' \
  || { echo "FAIL: preview duration $dp differs from sample $ds by more than 0.2s"; exit 1; }

echo "OK: preview is $size at $rate, ${dp}s (sample ${ds}s)"
