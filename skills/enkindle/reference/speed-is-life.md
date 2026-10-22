# Song map: "Speed is Life" (first 62 s)

The example song the template is timed to. Measured from demucs `htdemucs` stems and wav2vec2 forced alignment, then checked by ear and confirmed by the owner of the first edit made with it. All times are seconds into `media/track.mp3` as cut by `scripts/fetch-song.sh https://youtu.be/AK7cjOdLVf8 0 62`.

## Credits

- Song: "Speed is Life" by Blade + Into The Void (feat. Jordan Lindley).
- Taken from the edit by CowBeans ([@cowbeans327](https://www.youtube.com/@cowbeans327), video `AK7cjOdLVf8`, titled `Blade + Into The Void (feat. Jordan Lindley) "Speed is Life" - Naoya JJK`).
- On-screen credit used: `song: Speed is Life · via @cowbeans327`.

## Pulse

- Intro: 808 every 0.399 s (150 BPM) from 0.15 to 4.94.
- From the first drop: 808 every 0.384 s (156.25 BPM), doubles at 24.87, 27.95, 37.19 and 49.50, a roll from 51.1 to 52.8.
- Beat trackers lock onto 0.58 s (103 BPM), 2/3 of the real tempo. Don't use that grid.
- The 808s are in the drums stem, not the bass stem.

## Sections

| time | what | act in the template |
| --- | --- | --- |
| 0 to 6.3 | beat + the English voice line | Intro |
| 6.5 to 12.6 | no drums, melody, two Japanese voice lines | Build (origin, v1, v2) |
| 12.69 to 17.41 | 16th-note drum roll | Build (versions racing, loader) |
| 17.41 to 18.89 | drums out, "faster" ×3 | Build (call slams, zoom through) |
| 18.89 | drop 1 | Drop |
| 29.67 to 31.22 | one-bar break, synth stabs at 30.211, 30.501, 30.905 | Break |
| 31.22 | drop resumes | Drop |
| 41.98 to 43.53 | one-bar gap, a laugh | Gap |
| 43.53 | drop 2 | Drop |
| 50.84 to 54.30 | vocal chops at 50.88, 51.65, 52.77, 53.18 | Finale |
| 54.30 | drums end; outro bass hit at 55.83 | Outro (stats, receipt at 55.83, end card at 58.55) |

## Voice

- English line onsets: You 2.51, need 2.63, to 2.77, move 2.87, faster 3.19, than 3.60, that 3.73, amigo 3.91, Speed 4.61 (the "s"), is 4.86, life 5.06. Captions go 30 to 60 ms earlier (`LYRICS` in the template).
- The quiet hits at 0.14, 0.92 and 1.73 in the vocal stem are clap bleed, not voice.
- "faster" ×3 at 17.50, 17.80, 18.10.
- Japanese lines, not captioned (the fonts can't draw them): 7.74 to 8.53 and 10.73 to 12.02. Speech models mishear the second as "It's too fast!". The template reacts to them with a face zoom, shake and glitch on each syllable (`VOICE_2`).
- Laugh from 41.57 to 43.46, "ha" onsets in `LAUGH`. It runs into drop 2.
- No voice at 30 to 31. Whisper writes "faster" there only because the previous window primed it.
