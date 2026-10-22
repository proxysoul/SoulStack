#!/usr/bin/env bash
set -euo pipefail
url="${1:?usage: fetch-song.sh <youtube-url> [start-seconds] [length-seconds] [project-dir]}"
start="${2:-0}"
length="${3:-62}"
dir="${4:-.}"
mkdir -p "$dir/media" "$dir/analysis"
if command -v uvx >/dev/null; then ytdlp=(uvx --from "yt-dlp[default]@latest" yt-dlp); else ytdlp=(yt-dlp); fi
"${ytdlp[@]}" --no-playlist --skip-download --dump-single-json "$url" > "$dir/analysis/source.json"
"${ytdlp[@]}" --no-playlist -f bestaudio -x --audio-format wav -o "$dir/analysis/full.%(ext)s" "$url"
ffmpeg -hide_banner -loglevel error -y -ss "$start" -t "$length" -i "$dir/analysis/full.wav" -ac 2 -ar 44100 "$dir/analysis/track.wav"
ffmpeg -hide_banner -loglevel error -y -i "$dir/analysis/track.wav" -codec:a libmp3lame -b:a 320k "$dir/media/track.mp3"
python3 - "$dir/analysis/source.json" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
keys = ["title", "track", "artist", "creator", "album", "uploader", "uploader_id", "channel", "channel_url", "upload_date", "webpage_url", "license"]
for k in keys:
    if d.get(k):
        print(f"{k:12} {d[k]}")
desc = (d.get("description") or "").splitlines()
hits = [l for l in desc if any(w in l.lower() for w in ("prod", "song", "artist", "feat", "music", "track", "credit", "©", "℗", "licen"))]
if hits:
    print("description lines that look like credits:")
    for l in hits[:12]:
        print("   ", l)
PY
echo "wrote $dir/media/track.mp3 ($length s from $start s) and $dir/analysis/source.json"
