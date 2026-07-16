# Hillbilly Rocket League — working notes

MA-rated redneck-comedy Rocket League clone, solo vs bots. One self-contained Three.js HTML file.

## Standing mandate (upgrade goals)

1. Vehicle detail until it rivals real Rocket League graphics.
2. Gameplay/environment toward real Rocket League (wall driving, better bots, aerial play, arena curvature).
3. Custom speech + SFX, all synthesized in-code (WebAudio + `speechSynthesis`) — no external asset files.
4. Controls/menus fully manageable with PS5 controller and/or keyboard.
5. Frame rate + responsiveness.
6. Ground physics/camera changes in **real Rocket League specs** (scaled to this game). Reference points:
   - Camera: FOV 110h (~80v for three.js), distance ≈ 270uu, height ≈ 110uu, angle ~-3°, stiffness ~0.45
     smoothed swivel; camera stays **inside** the arena and slides along the glass; ball-cam keeps car in frame.
   - Field 8192×10240uu, goal 1786w×642h, ceiling 2044; ball radius 92.75uu.
   - Boost: spawn 33, small pads +12 (4s respawn), big pads 100 (10s respawn).
   - Speeds: max drive 1410uu/s, supersonic 2200, boost cap 2300; dodge/flip ~+500uu/s; demos require supersonic.
   - Keep the comedy scale (oversized ball is intentional).

## Hard constraints (do not violate)

- Keep it **one self-contained HTML file**. Baseline external ref = `three.js r128` from cdnjs; as of
  iter 13 it also inlines the r128 GLTFLoader + SkeletonUtils and embeds a CC0 Quaternius cow GLB (base64)
  — all in-file, no runtime fetch. Keep new assets embedded (base64) so the file stays self-contained.
- Keep the MA-rated hillbilly-humor tone (profanity fine, **no slurs**).
- Never remove existing features: lobby, bots, PS5-controller support (incl. menu navigation),
  TTS announcer, mute keys (M/V), demolitions.
- 60fps target.

## Workflow (surgical)

- Read the `CHANGELOG` comment at the top of the HTML first — it lists what each iteration did and a
  "STILL TO DO" list. Pick 2–4 meaningful, not-yet-done improvements sized to finish reliably in one pass.
- Make the smallest useful change; avoid unrelated refactors and formatting churn.
- **Verify before delivering:** `./verify.sh` (extract → `node --check` → smoke harness). Fix anything broken.
- Update the `CHANGELOG` comment at the top of the HTML with the date + a bullet list of what changed.

## Controls (durable — verified against source)

- Keyboard, in-match: `W`/`S` drive, `A`/`D` steer, `Space` jump (twice = flip), `Shift` boost,
  `C` ball-cam, `Esc` pause, `M` mute SFX, `V` toggle announcer voice.
- Keyboard, menus: arrows/WASD move focus, `Enter`/`Space` activate.
- PS5, in-match (+ rumble): `R2` gas, `L2` reverse, stick steer, `✕` jump (twice = flip),
  `◯`/`R1` boost, `△` ball-cam, `OPTIONS` start/pause.
- PS5, menus: D-pad/stick move focus, `✕` activate, `OPTIONS` start.
