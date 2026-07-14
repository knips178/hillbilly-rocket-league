# Hillbilly Rocket League

An MA-rated redneck-comedy Rocket League clone — solo vs bots. Self-contained single-file
Three.js game with an in-code synthesized announcer + SFX and full PS5-controller support.

## Run it

It's a single HTML file, so just open it in a browser:

```sh
open hillbilly-rocket-league.html
```

Or serve it locally (needed if a browser blocks the CDN over `file://`):

```sh
python3 -m http.server 8000   # then visit http://localhost:8000/hillbilly-rocket-league.html
```

The only external reference is `three.js r128` from cdnjs — an internet connection is required.

## Verify

```sh
./verify.sh
```

This extracts the inline game script to `/tmp/game.js`, runs `node --check`, then runs the
headless smoke harness (`hillbilly-rl-test-harness.js`) — which stubs THREE/DOM, simulates a
full match, and asserts goals score, demolitions/respawns work, the camera stays inside the
arena, and the match ends. Run it before and after every change.

## Layout

| File | What |
|------|------|
| `hillbilly-rocket-league.html` | The entire game (markup + styles + inline game script). Edit in place — keep it one file. |
| `hillbilly-rl-test-harness.js` | Headless Node smoke test. Reads the extracted script from `/tmp/game.js`. |
| `verify.sh` | Extract → syntax-check → smoke-test in one command. |
| `AGENTS.md` | Standing mandate, hard constraints, and controls for anyone (human or agent) working on this. |

## Hard constraints

- **One self-contained HTML file.** Only allowed external ref is `three.js r128` from cdnjs.
- All audio is synthesized in-code (WebAudio + `speechSynthesis`) — no external asset files.
- Never remove existing features: lobby, bots, PS5-controller support (incl. menu navigation),
  TTS announcer, mute keys (M/V), demolitions.
- Target 60fps.

See `AGENTS.md` for the full mandate and the current changelog lives at the top of the HTML file.

## Provenance

Originally generated in a Claude local-agent session and promoted here to a proper project on
2026-07-14. The upgrade history is in the `CHANGELOG` comment at the top of the HTML file
(currently at iteration 4).
