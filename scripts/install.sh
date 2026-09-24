#!/bin/sh
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
target="$HOME/.agents/skills"
names=""

while [ $# -gt 0 ]; do
  case "$1" in
    --target) target="$2"; shift 2 ;;
    --list) for d in "$root"/skills/*/; do basename "$d"; done; exit 0 ;;
    -h|--help) echo "usage: install.sh [--target DIR] [--list] [skill ...]"; exit 0 ;;
    *) names="$names $1"; shift ;;
  esac
done

if [ -z "$names" ]; then
  for d in "$root"/skills/*/; do names="$names $(basename "$d")"; done
fi

mkdir -p "$target"
for n in $names; do
  src="$root/skills/$n"
  if [ ! -f "$src/SKILL.md" ]; then echo "skip $n: no skills/$n/SKILL.md" >&2; continue; fi
  dest="$target/$n"
  if [ -e "$dest" ] && [ ! -L "$dest" ]; then echo "skip $n: $dest exists and is not a link" >&2; continue; fi
  ln -sfn "$src" "$dest"
  echo "linked $n -> $dest"
done
