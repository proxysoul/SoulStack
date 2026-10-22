# media

Everything the edit draws or plays. `inspect` fails on any name that is missing.

| file | what |
| --- | --- |
| `track.mp3` | the song window, from `scripts/fetch-song.sh` |
| `logo.png` | the product's logo or wordmark, transparent background |
| `v1.png`, `v2.png`, `v3.png` | one real screenshot per version or chapter (`CHAPTERS` in `src/content.rs`) |
| `shot-1.png` … `shot-6.png` | real product screenshots, ideally one per theme (`SCREENS` and `FEATURES[].img`) |
| `InstrumentSans-Bold.ttf`, `Geist-SemiBold.ttf`, `GeistMono-Bold.ttf`, `DMSans-Medium.ttf` | the fonts, from Google Fonts (OFL) |

Rename freely, as long as `src/content.rs` matches.
