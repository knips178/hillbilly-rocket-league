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
  Iter 15 embeds REAL recorded audio only: Kenney CC0 announcer barks + 4 CC-licensed SFX. There is
  NO text-to-speech — synthesised speech sounded robotic and was rejected. Custom lines are text-only.
  Attribution for CC BY/BY-SA assets is REQUIRED and lives in the lobby credits line — keep it.
  Iter 20 embeds a CC0 Quaternius Farmer character (rigged GLB) for crowd + all riders/drivers.
  **Embedded-GLB lessons (hard-won, do not relearn):** (1) gltf-transform `quantize()` breaks r128
  skinned meshes (~50x scale error, black normals) — strip/resample/dedup/weld only, never quantize.
  (2) r128 GLTFLoader emits linear-space material colors; this game has no sRGB output stage, so
  rebuild materials as Lambert with `color.convertLinearToSRGB()` and `skinning:true` or they render
  near-black / at bind pose. (3) Anything spawned at script-load time (crowd) must be upgraded in the
  async parse callback; anything spawned at startMatch (riders) can check `charModel` directly.
- Keep the MA-rated hillbilly-humor tone (profanity fine, **no slurs**).
- Never remove existing features: lobby, bots, PS5-controller support (incl. menu navigation),
  announcer VO (real recorded clips — TTS is long gone), mute keys (M/V), demolitions, the four arenas (Barn / Frozen Pond / Skeeter Bog /
  Mallard Marsh — iters 24-25; same pitch bounds, different SURF physics + look; Bog + Marsh are
  OPEN-AIR via the toggleable barnShell group; Marsh has duck flights gettin' shot from the blinds;
  the Frozen Pond look is user-APPROVED — don't restyle it; harness menu-nav counts 6 lobby rows).
- 60fps target. Rendering is ~94% of frame cost (profiled iter 40) — optimise DRAW CALLS and pixel
  count, not JS. Do NOT set frustumCulled=false on skinned meshes (it forced 348 always-drawn
  meshes); use safeCull() which inflates the bind-pose sphere instead. Adaptive resolution scales
  the pixel ratio to protect weak/mobile GPUs — leave it in.
- Gameplay-variety systems (iter 36) — keep all five: per-vehicle SPECIAL moves (E/F · ▢ · touch⚡,
  see VEHICLES[].special), MAW'S WILDCARD modifiers (WILDCARDS[], bend the mutable globals
  gravCarMul/gravBallMul/gripMul/topMul/boostFree/BALL_R), the MOONSHINE JUG pickup, demolition
  boost+streak rewards, and boost-assisted AERIALS. Goal mouth is goalHalfW 18 / goalH 13 (harness
  recess asserts track these). Ball-floating wildcards MUST stay scorable — don't over-float them.
- Gameplay-variety II (iter 37) — keep all five: trick-shot goal values (goalValue(): howitzer /
  air mail / signature finish = 2pts, LAST CALL doubles), ball CURVE (applyHitSpin + applyMagnus),
  bot PERSONAS (PERSONAS[], see botInput), LAST CALL final-30s, and RALLY FIRE (rolling touch
  window — a decaying heat pool was tried and NEVER ignited in real play; don't revert to it).
  Goals are no longer always worth 1 — harness asserts must check the score increased.
- ROADKILL (iter 38) — critters cross the pitch (ARENA_CRITTERS per arena), get launched when hit
  (squashCritter + critterYelp), and drop a ROADKILL STEW pot granting BUMPER BEEF (c.stewT:
  x1.9 ball power, wins car contact, lower demo bar). The pot needs its ARM delay or the killer
  auto-eats it instantly. clearRoadkill() on match start.

## Multiplayer / networking (iter 41+, in progress)

Up to 4 players, all from the same URL, empty seats filled by the existing bots.
**Host-authoritative over WebRTC data channels**; matchmaking = Trystero (embedded, 60 KB IIFE,
inlined as its own `<script>` block placed BEFORE the game's — `verify.sh` extracts the *last*
src-less script, so never insert after it). `NET.role` defaults to `'solo'` and nothing initialises
at load, which is what keeps solo play and the headless harness untouched.

The design seam: every car is already driven by an interchangeable `{throttle,steer,boost}` object
(`const input = c.isPlayer ? pin : botInput(c,dt)`). Remote players supply that object instead of
the AI, so **bot-fill is the solo code path** and a dropped player reverts to a bot for free.

**Verified the hard way — do not relearn:**
1. **Trystero ships ONE default STUN server** (`stun.cloudflare.com`) and it returns ICE error 701
   (unreachable) on some real networks, leaving no public address to offer → handshake goes
   `connecting → failed`. **Always pass an explicit redundant `iceServers` list** (`NET_ICE`).
   Redundancy is mandatory: Twilio's STUN failed on one test network while Cloudflare worked, and
   the exact reverse was true on another. No single server covered both.
2. **Nostr's built-in relay list rate-limits** (`"you note too much"`) and never paired two peers.
   The curated list in `NET_RELAYS` does, reliably. MQTT also works but bundles to 409 KB vs 60 KB.
   BitTorrent trackers were the least reliable.
3. **`trickleIce` defaults to false** — candidates ride inside the SDP, so `addIceCandidate` is never
   called on the happy path. `remoteCand: 0` is normal, not a bug.
4. **Trystero 0.25 changed the API**: `makeAction()` returns an *object* (`.send` / `.onMessage`),
   not a `[send, receive]` tuple, and `onPeerJoin`/`onPeerLeave` are *assigned*, not called.
   `room.ping(peerId)` gives RTT; `room.getPeers()` returns `{peerId: RTCPeerConnection}`.
5. **Counting RTCPeerConnections tells you nothing** — Trystero pre-creates ~20 per strategy
   speculatively, even alone in an empty room. To prove two devices found each other, count
   `setRemoteDescription` calls: that requires a real SDP from a remote peer.
6. **Two tabs on one machine cannot connect** — ICE host candidates are mDNS-obfuscated (`.local`)
   and a browser can't resolve another process's name; same-host hairpin NAT needs TURN. For local
   testing only, Trystero exposes `_test_only_mdnsHostFallbackToLoopback: true`.
7. **Free anonymous TURN is gone** — the old public `openrelay.metered.ca` credentials gather zero
   relay candidates. A TURN fallback needs an account. Only ONE side of a pair needs TURN.

## Workflow (surgical)

- Read the `CHANGELOG` comment at the top of the HTML first — it lists what each iteration did and a
  "STILL TO DO" list. Pick 2–4 meaningful, not-yet-done improvements sized to finish reliably in one pass.
- Make the smallest useful change; avoid unrelated refactors and formatting churn.
- **Verify before delivering:** `./verify.sh` (extract → `node --check` → smoke harness). Fix anything broken.
- Update the `CHANGELOG` comment at the top of the HTML with the date + a bullet list of what changed.
- **Ship every substantive iteration** (user mandate): commit with a descriptive message, `git push`
  (origin = github.com/knips178/hillbilly-rocket-league), rebuild the artifact bundle, republish to
  the same artifact URL. GitHub Pages (once enabled) serves the pushed file automatically —
  https://knips178.github.io/hillbilly-rocket-league/ — controller + touch both work there (no iframe).

## Controls (durable — verified against source)

- Keyboard, in-match: `W`/`S` drive, `A`/`D` steer, `Space` jump (twice = flip), `Shift` boost,
  `C` ball-cam, `Esc` pause, `M` mute SFX, `V` toggle announcer voice.
- Keyboard, menus: arrows/WASD move focus, `Enter`/`Space` activate.
- PS5, in-match (+ rumble): `R2` gas, `L2` reverse, stick steer, `✕` jump (twice = flip),
  `◯`/`R1` boost, `△` ball-cam, `OPTIONS` start/pause.
- PS5, menus: D-pad/stick move focus, `✕` activate, `OPTIONS` start.
- Touch (iter 34, phones/tablets): left-thumb virtual stick (up gas / down reverse / sideways steer),
  right-thumb JUMP / BOOST (hold) / CAM buttons, pause top-right. Shows only on touch devices.
