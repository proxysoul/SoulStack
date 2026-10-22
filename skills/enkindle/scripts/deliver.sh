#!/usr/bin/env bash
set -euo pipefail
bin="${1:?usage: deliver.sh <path-to-built-binary> [name]}"
name="${2:-edit}"
"$bin" inspect
"$bin" --portrait inspect
"$bin" render -o out.mp4
"$bin" --portrait render -o out-portrait.mp4
for pair in "out.mp4:$name.mp4" "out-portrait.mp4:$name-vertical.mp4"; do
  src="${pair%%:*}"; dst="${pair##*:}"
  ffmpeg -hide_banner -loglevel error -y -i "$src" -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 192k -movflags +faststart "$dst"
done
for f in "$name.mp4" "$name-vertical.mp4"; do
  echo "$f $(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -show_entries format=duration,size -of csv=p=0 "$f" | tr '\n' ' ')"
done
