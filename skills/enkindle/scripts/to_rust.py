import argparse, json

ap = argparse.ArgumentParser(description="Write src/song.rs from analysis/song.json")
ap.add_argument("--song", default="analysis/song.json")
ap.add_argument("--out", default="src/song.rs")
ap.add_argument("--until", type=float, default=0.0, help="drop events after this time (the edit length)")
args = ap.parse_args()
g = json.load(open(args.song))
end = args.until or g["duration"]
keep = [i for i, k in enumerate(g["kicks"]) if k <= end]
arr = lambda xs, f="{:.3f}": ", ".join(f.format(x) for x in xs)
lines = [
    f"pub const KICKS: &[f32] = &[{arr([g['kicks'][i] for i in keep])}];",
    f"pub const KICK_POW: &[f32] = &[{arr([g['kick_pow'][i] for i in keep], '{:.2f}')}];",
    f"pub const HITS: &[f32] = &[{arr([h for h in g['hits'] if h <= end])}];",
    f"pub const BEATS: &[f32] = &[{arr([b for b in g['beats'] if b <= end])}];",
    f"pub const DOWNBEATS: &[f32] = &[{arr([b for b in g['downbeats'] if b <= end])}];",
    f"pub const LOW30: &[u8] = &[{arr(g['low30'][: int(end * 30) + 1], '{}')}];",
]
open(args.out, "w").write("\n".join(lines) + "\n")
print(f"wrote {args.out}: {len(keep)} kicks, {len(g['beats'])} beats, {len(g['downbeats'])} downbeats")
