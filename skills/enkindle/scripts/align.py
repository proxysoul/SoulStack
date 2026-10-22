import argparse
import numpy as np, torch, librosa
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

ap = argparse.ArgumentParser(description="Word onsets by CTC forced alignment on the vocal stem. English words only.")
ap.add_argument("--vocals", default="analysis/stems/htdemucs/track/vocals.wav")
ap.add_argument("--lead", type=float, default=0.05, help="seconds captions appear before each onset")
ap.add_argument("line", nargs="+", help='START END "THE WORDS SUNG" (repeat the triple for more lines)')
args = ap.parse_args()

name = "facebook/wav2vec2-large-960h-lv60-self"
proc = Wav2Vec2Processor.from_pretrained(name)
model = Wav2Vec2ForCTC.from_pretrained(name).eval()
y, _ = librosa.load(args.vocals, sr=16000, mono=True)
vocab = proc.tokenizer.get_vocab()
blank = vocab["<pad>"]
S = np.abs(librosa.stft(y, n_fft=512, hop_length=80))
env = np.convolve(S[3:].sum(axis=0) + 4.0 * S[120:].sum(axis=0), np.ones(3) / 3, "same")

def attack(t):
    i = int(t * 200)
    lo, hi = max(0, i - 30), min(len(env) - 1, i + 30)
    peak = env[lo:hi + 1].max() + 1e-9
    j = i
    while j > lo and env[j - 1] > 0.15 * peak and env[j - 1] <= env[j] * 1.05:
        j -= 1
    return j / 200

def align(a, b, words):
    seg = y[int(a * 16000):int(b * 16000)]
    with torch.no_grad():
        lp = torch.log_softmax(model(proc(seg, sampling_rate=16000, return_tensors="pt").input_values).logits[0], -1).numpy()
    text = "|".join(words)
    toks = [vocab[c] for c in text]
    T, N = lp.shape[0], len(toks)
    Dp = np.full((T + 1, N + 1), -np.inf)
    Dp[0, 0] = 0.0
    B = np.zeros((T + 1, N + 1), dtype=np.int8)
    for t in range(T):
        stay = Dp[t] + lp[t, blank]
        rep = np.full(N + 1, -np.inf)
        rep[1:] = Dp[t, 1:] + lp[t, toks]
        adv = np.full(N + 1, -np.inf)
        adv[1:] = Dp[t, :-1] + lp[t, toks]
        stack = np.stack([stay, rep, adv])
        B[t + 1] = np.argmax(stack, axis=0)
        Dp[t + 1] = stack.max(axis=0)
    j, first, last = N, [None] * N, [None] * N
    for t in range(T, 0, -1):
        c = B[t, j]
        if c in (1, 2):
            if last[j - 1] is None:
                last[j - 1] = t - 1
            first[j - 1] = t - 1
        if c == 2:
            j -= 1
        if j == 0:
            break
    dur = len(seg) / 16000 / T
    out, pos, floor = [], 0, a
    for w in words:
        s, e = first[pos], last[pos + len(w) - 1]
        conf = float(np.mean([lp[first[k], toks[k]] for k in range(pos, pos + len(w))]))
        raw = a + s * dur
        on = max(floor, min(raw, attack(raw)))
        out.append((w, on, a + (e + 1) * dur, conf))
        floor = raw + 0.02
        pos += len(w) + 1
    return out

triples = [args.line[i:i + 3] for i in range(0, len(args.line), 3)]
for a, b, words in triples:
    print(f"== {a}-{b}")
    for w, s, e, conf in align(float(a), float(b), words.upper().replace(",", "").replace(".", "").split()):
        on = s
        print(f"  {w:12} onset {on:6.3f}  caption at {on - args.lead:6.3f}  ends {e:6.3f}  conf {conf:5.2f}{'  LOW: check by ear' if conf < -3 else ''}")
