import argparse, json
import numpy as np, librosa

ap = argparse.ArgumentParser(description="Map a song from its demucs stems: pulse, sections, voice, stabs.")
ap.add_argument("--stems", default="analysis/stems/htdemucs/track")
ap.add_argument("--out", default="analysis/song.json")
ap.add_argument("--bpm", type=float, default=0.0, help="tempo you hear; checks the tracker against it")
ap.add_argument("--downbeat", type=float, default=-1.0, help="a time you know is a downbeat, e.g. the first kick of the drop")
args = ap.parse_args()

sr = 22050
hop = 110
fr = sr / hop
D = args.stems.rstrip("/") + "/"
vox, drums, bass, other = (librosa.load(D + n + ".wav", sr=sr, mono=True)[0] for n in ("vocals", "drums", "bass", "other"))
dur = len(drums) / sr

def band(y, lo, hi, n=2048):
    S = np.abs(librosa.stft(y, n_fft=n, hop_length=hop))
    f = librosa.fft_frequencies(sr=sr, n_fft=n)
    return S[(f >= lo) & (f < hi)].sum(axis=0)

def rise(e):
    d = np.maximum(0, np.diff(e, prepend=e[0]))
    return np.convolve(d, [0.25, 0.5, 0.25], "same")

low = band(drums, 20, 140)
d = rise(low)
pk = librosa.util.peak_pick(d, pre_max=6, post_max=6, pre_avg=14, post_avg=14, delta=np.percentile(d, 99) * 0.12, wait=9)
pw = d[pk] / (np.percentile(d[pk], 95) + 1e-9)
kicks = [(round(p / fr, 3), round(float(min(w, 1.0)), 2)) for p, w in zip(pk, pw) if w > 0.18]
hits = [k for k, w in kicks if w >= 0.6]

gaps = np.diff([k for k, _ in kicks])
period = float(np.median(gaps[(gaps > 0.25) & (gaps < 0.8)])) if len(gaps) else 0.5
onset = librosa.onset.onset_strength(y=drums, sr=sr, hop_length=hop)
tempo, bt = librosa.beat.beat_track(onset_envelope=onset, sr=sr, hop_length=hop, start_bpm=args.bpm or 60.0 / period, tightness=200, units="time")
tempo = float(np.atleast_1d(tempo)[0])
dr_e = librosa.feature.rms(y=drums, frame_length=2048, hop_length=sr // 10)[0]
dr_e = dr_e / (np.percentile(dr_e, 99) + 1e-9)
beats = [round(float(b), 3) for b in bt if dr_e[min(len(dr_e) - 1, int(b * 10))] > 0.12]
kick_t = np.array([k for k, _ in kicks])
score = [0.0] * 4
for i, b in enumerate(beats):
    if len(kick_t) and np.min(np.abs(kick_t - b)) < 0.06:
        score[i % 4] += dict(kicks).get(float(kick_t[np.argmin(np.abs(kick_t - b))]), 0.0)
phase = int(np.argmax(score))
if args.downbeat >= 0 and beats:
    phase = int(np.argmin([abs(b - args.downbeat) for b in beats])) % 4
downbeats = [b for i, b in enumerate(beats) if i % 4 == phase]

tot = low + 0.8 * band(bass, 20, 200, 4096)[: len(low)]
n30 = int(dur * 30)
env = np.array([tot[min(len(tot) - 1, int(k / 30 * fr))] for k in range(n30)])
env = np.convolve(env, [0.2, 0.6, 0.2], "same")
low30 = [int(min(1.0, x) * 255) for x in env / (np.percentile(env, 99) + 1e-9)]

def segments(e, th_on=0.12, th_off=0.06, merge=0.15, minlen=0.08):
    n = e / (np.percentile(e, 99.5) + 1e-9)
    out, s = [], None
    for i, v in enumerate(n):
        if s is None and v > th_on:
            s = i
        elif s is not None and v < th_off:
            out.append([s, i]); s = None
    if s is not None:
        out.append([s, len(n) - 1])
    merged = []
    for a, b in out:
        if merged and (a - merged[-1][1]) / fr < merge:
            merged[-1][1] = b
        else:
            merged.append([a, b])
    return [(round(a / fr, 2), round(b / fr, 2), round(float(n[a:b + 1].max()), 2)) for a, b in merged if (b - a) / fr >= minlen]

ve = band(vox, 150, 6000, 1024)
voice = segments(np.convolve(ve, np.ones(3) / 3, "same"))
VS = np.abs(librosa.stft(vox, n_fft=1024, hop_length=hop))
flux = np.maximum(0, np.diff(np.log1p(VS), axis=1, prepend=np.log1p(VS[:, :1]))).sum(axis=0)
vn = ve / (np.percentile(ve, 99.5) + 1e-9)
syl = [round(float(p) / fr, 3) for p in librosa.util.peak_pick(flux, pre_max=3, post_max=3, pre_avg=8, post_avg=8, delta=np.percentile(flux, 99) * 0.1, wait=6) if vn[p] > 0.08]
oo = librosa.onset.onset_strength(y=other, sr=sr, hop_length=hop)
op = librosa.util.peak_pick(oo, pre_max=6, post_max=6, pre_avg=20, post_avg=20, delta=np.percentile(oo, 99) * 0.2, wait=12)
om = np.percentile(oo[op], 95) + 1e-9 if len(op) else 1.0
stabs = [(round(p / fr, 3), round(float(min(1, oo[p] / om)), 2)) for p in op if oo[p] / om > 0.35]

def per_sec(y):
    e = librosa.feature.rms(y=y, frame_length=2048, hop_length=sr // 2)[0]
    return e / (np.percentile(e, 99) + 1e-9)

ev, ed, eb, eo = (per_sec(y) for y in (vox, drums, bass, other))
drums_on = [i / 2 for i, x in enumerate(ed) if x > 0.25]

out = dict(duration=round(dur, 3), tempo=round(tempo, 2), kick_period=round(period, 3), kicks=[k for k, _ in kicks], kick_pow=[w for _, w in kicks],
           hits=hits, beats=beats, downbeats=downbeats, low30=low30, voice=voice, syllables=syl, stabs=stabs)
json.dump(out, open(args.out, "w"))

print(f"duration {dur:.2f}s  kicks {len(kicks)}  hits {len(hits)}  beats {len(beats)}  downbeats {len(downbeats)}")
print(f"tracker tempo {tempo:.2f} BPM  kick spacing {period:.3f}s = {60 / period:.2f} BPM")
if args.bpm:
    r = tempo / args.bpm
    if abs(r - 1) > 0.04:
        print(f"WARNING tracker is {r:.2f}x the tempo you hear. Trust the kick spacing and your ears; fix beats by hand.")
elif abs(tempo * period / 60 - 1) > 0.06:
    print("WARNING tracker tempo and kick spacing disagree (often a 2/3 or 1/2 lock). Check by ear before using beats.")
print("\nvoice segments (start-end, peak):")
for a, b, p in voice:
    print(f"  {a:6.2f}-{b:6.2f}  {p}")
print("\nstrong stabs in the melody stem:", " ".join(f"{t:.2f}" for t, w in stabs if w > 0.6))
print("\nper half second:  voice      drums      bass       melody")
for i in range(min(len(ev), len(ed), len(eb), len(eo))):
    bar = lambda a: ("#" * int(min(a[i], 1.0) * 10)).ljust(10)
    print(f"{i / 2:6.1f}  {bar(ev)} {bar(ed)} {bar(eb)} {bar(eo)}")
print(f"\nwrote {args.out}")
