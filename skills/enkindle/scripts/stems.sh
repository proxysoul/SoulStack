#!/usr/bin/env bash
set -euo pipefail
dir="${1:-.}"
uvx --python 3.12 --with numpy --with soundfile demucs@4.1.0 -n htdemucs -o "$dir/analysis/stems" "$dir/analysis/track.wav"
ls "$dir/analysis/stems/htdemucs/track/"
