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

## Ball contact — "I drove straight through it" (three causes, all fixed)

1. **Contact radius under-covered the car.** `CAR_COLL_R` was half of RL's 118uu car LENGTH used as
   a sphere radius — measured 0.94 against a visible half-width of 1.19, so the ball could sit
   visibly ON the bodywork with no contact firing. RL's hitbox is a BOX; a sphere sized off its
   length is simply too small. Now `uu(74)`, sized to the actual mesh.
2. **No swept test.** A discrete point-in-sphere check only sees where things are *right now*. A
   boosting car closing on a struck ball covers more than the contact diameter in one frame, so they
   swap sides between frames and nothing registers. `carBallCollide` now sweeps the relative motion
   over the frame and rewinds the ball to the contact moment.
3. **Dead-centre passes registered but did nothing.** The fallback contact normal pointed straight
   up, which is perpendicular to the ball's travel, so the impulse computed to exactly zero. It now
   opposes the approach direction.

Contact height follows `c.up`, so it stays on the bodywork while wall-riding.
Harness: sweeps 48 combinations of offset x speed x framerate; every one must register a touch.

## GORE (MA-rated) — cartoon register, not photoreal

Blood and giblets on roadkill and on supersonic demolitions. Deliberately styled as a Looney Tunes
splat: bright arterial reds (`BLOOD[]`), chunky low-poly giblets, comedic volume. That is both truer
to the art style and funnier than anything photoreal would be at this poly count — keep it there.

- `bloodGeyser()` — the main event. A single burst looked stingy, so this registers an emitter that
  PUMPS over ~0.7s with a hard vertical component, fountaining overhead before raining back down.
  Deliberately over the top — that's the joke. `bloodSpray()` is the small one-shot lick.
- **Gettin' wasted is the money shot.** `demolish()` fires the biggest geyser in the game, scaled
  2.4x when the victim is the player (the camera is parked right on it) vs 1.8x for a bot, plus 16
  giblets and a camera shake. Measured on a player demo: 127 particles in the opening burst, 16
  giblets, 11 splat pools.
- `spawnGiblets()` — chunks that arc, tumble, land, leave a splat and fade.
- `addSplat()` / `updateSplats()` — **pooled** ground decals (26), oldest recycled, soak in over
  ~25s. The meshes are marked `userData._shared` so `disposeTree` skips them; they are permanent
  scene objects, not per-kill allocations.
- Volume scales with impact speed and critter heft (cow 1.5x, chicken 0.7x).
- `clearGore()` runs on match start alongside `clearRoadkill()`.

`CRITTER_SCALE` is 0.60 (raised from 0.42 on user feedback that the animals were too small).

## Audio synthesis — the click bug (fixed, don't reintroduce)

Every synthesised sound routes through `beep()`, so its flaws were the whole game's flaws. It set
`gain.value = vol` directly, which CLICKS on the leading edge of every sound — that pop was most of
what made the audio feel cheap. It now ramps in over ~10ms and runs through a lowpass so raw
square/sawtooth isn't piercing. Same signature, so every call site benefits.

`beep()` takes an optional `warble` (pitch vibrato via an LFO on `frequency`) and there's a small
`noiseBurst()` for a breath/rasp layer. Those two together are what make `critterYelp` read as an
animal instead of an arcade blip — pitch alone never did.

Real recorded audio (19 clips: Kenney CC0 announcer + Wikimedia SFX, ~205 KB base64) stays as-is;
attribution in the lobby credits line is REQUIRED — keep it.

## Multiplayer: CONFIRMED WORKING end-to-end (2026-07-22)

Mac hosting + iPhone on **cell data** connected and played a full match. The path is
Nostr matchmaking -> STUN -> TURN relay -> host-authoritative snapshots. Guests install nothing
and need no credentials; they open a URL.

Two traps that cost real debugging time, both now fixed -- don't reintroduce:
1. **Relay settings must be set BEFORE the room is created.** `rtcConfig` is read once inside
   `NET.join()`. They originally lived in the waitin' room, i.e. only reachable *after* hosting, so
   they never applied. Wifi hid it completely (a direct link needs no relay).
2. **"Relay configured" is not "relay works."** Credentials that look right but fail produce exactly
   one symptom: nobody joins. Keep the TEST button (gathers ICE against the real config and checks a
   `relay` candidate actually comes back) and keep the waitin' room CONNECTION INFO readout
   (`remoteSDP > 0` = the devices found each other, so any failure is the peer link, not matchmaking).

## THE WORLD IS NOW IN ROCKET LEAGUE UNITS (read this first)

Everything is derived from RL's real numbers through one constant:
`const UU = 82/5120` (RL's goal-to-goal half-axis stays 82 world units) and `uu(n) = n*UU`.
**Define new gameplay values as `uu(<real RL number>)`, not as bare world units.**

The root problem this fixed: the **cars and ball were ~3.5x oversized** relative to the pitch. That
single error is why it never felt like RL. Anchoring UU on the arena (so the barn, bales, crowd and
billboards all keep working untouched) and shrinking the cars/ball to true RL proportion fixes it:

| | before | now (RL) |
|---|---|---|
| arena half X / Z / ceil | 82 / 52 / 38 | 82 / **65.6** / **32.7** |
| goal w / h / depth | 18 / 13 / 26 | **14.3 / 10.3 / 14.1** |
| ball radius | 4.4 | **1.46** |
| car scale | 1.0 | **×`CAR_SCALE` 0.47** (RL 118uu car) |
| top drive / cap / supersonic | 44 / — / 46 | **22.6 / 36.8 / 35.2** |
| camera boom / height | 20 / 7.6 | **4.32 / 1.60** (RL 270/100uu) |
| walls | to wallH 26 | **to the ceiling** (ceiling is drivable) |

Two frame-rate/scale bugs found during the port — don't reintroduce:
- Ball rolling friction was applied **per frame** (`vel *= 0.95` every frame = 95% loss per second),
  so the ball died on the spot and it was frame-rate dependent. It is now a **per-second** coefficient.
- Car-vs-car demolition was gated on a hardcoded `rel.length() > 38`, which is above the new speed
  cap — demos became impossible. Now gated on `SUPERSONIC`.

Also implemented from the spec: **powerslide** (`input.slide` — Ctrl / R-Shift / pad L1 — drops lateral
bite to 0.9 so ya drift and keep momentum), **ceiling driving** (`wallAxis === 2`, up = (0,-1,0);
sticky is half gravity so ya only hang on while quick), and the **flip window** (`c.flipT`,
`FLIP_WINDOW` 1.45s after leaving a surface, then no flip).

## Rocket League fidelity — researched values (do not "simplify" these back)

Documented RL constants (RLBot wiki / GDC "It IS Rocket Science"), and how this game maps to them:

| RL | value | here |
|---|---|---|
| gravity | 650 uu/s² | `GRAV_CAR` -34 |
| boost accel (ground / air) | 991.7 / 1058.3 uu/s² | ground 30, `AIR_BOOST` 52 |
| **boost direction** | **along the car's NOSE only — no vertical lift** | same |
| jump impulse | ~291.7 uu/s along the **ROOF** (car up), not world up | same, uses `c.up` |
| boost drain | 33.3/s | `BOOST_DRAIN` 22 |
| supersonic / max | 2200 / 2300 uu/s | `SUPERSONIC` 46 |
| braking vs coasting | -3500 vs -525 uu/s² | drag 1.8 vs 0.35 |
| corner radius | ~256uu on a 4096 half-arena (~6%) | `WALL_R` 8 |
| wall sticky force | scales with speed | `WALL_CLIMB_MIN` 24 gate |

**From the RL mechanics spec (`ROCKET LEAGUE MECHANICS SPEC.md`), now implemented:**
- **Throttle accel is velocity-dependent** (RL 1600 uu/s² at rest → 0 at 1410): `ACCEL_PEAK` 1.7 ×
  `(1 − |fwdSpeed| / driveMax)`. Fade is against the THROTTLE-only max, so boost still carries ya
  past it — that's why boost matters at speed. Measured: 21.3 at 0.5s, boosted top 60.
- **Braking is opposite-throttle**, not just coasting (RL -3500 vs -525): `BRAKE_DRAG` 6.5 vs 1.8/0.35.
- **Wall sticky force is weaker than gravity** (325 vs 650): a car slower than `WALL_STICK_MIN` on a
  steep wall PEELS OFF and falls, and keeps its flip. Wall-riding is no longer a permanent magnet —
  ya have to carry speed, same as RL.
- **Held jump = taller hop** (RL: +1460 uu/s² for up to 0.2s): `JUMP_HOLD_T` / `JUMP_HOLD_ACC`, pushed
  along the surface normal ya left (`c.jumpN`). Releasing early gives a short hop.
- **Camera speed-zoom**: the boom lengthens with speed (`camBoom()`), which the spec calls the primary
  speed feedback. Applied to all three camera paths (ball-cam, car-cam, wall-cam).
- Already matched before the spec landed: ball hit-assist impulse along car→ball, world-up camera lock,
  FOV ~110h, boom 270uu / height 100uu / angle -3° at this game's scale.
- Deliberately NOT ported: absolute uu constants (this arena is not geometrically similar to RL — the
  cars and ball are oversized for comedy), powerslide, ceiling driving, flip-window timer.

**The three bugs this fixed, and why — don't reintroduce:**
1. **"Jump + boost flies into the ceiling."** The air branch added `vel.y += 45` against 34 gravity, so
   holding boost climbed regardless of aim. RL has NO free lift: boost is applied along the nose. Now
   you pitch the nose up (`c.pitch`, stick back) and *then* boost — deliberate aerials, no ceiling drift.
2. **"Steering goes weird on the wall."** The tangent frame used world-Z as its reference, which
   **degenerates on the ±Z walls** (Z ∥ normal) → `forward` flipped. Frame now derives from the surface:
   `climb = worldUp − (worldUp·n)n`, `lateral = climb × n` — never degenerate on a vertical wall.
3. **"The vehicle comes toward the camera."** Same root cause: the chase cam sits at `−forward`, so a
   flipped forward put it in FRONT of the car. Fixed by (2).

Yaw means "angle within the current surface frame", so it is re-expressed at every surface change via
`rebaseYawToWall` / `rebaseYawToFloor` — otherwise facing snaps when ya grab or leave a wall.

Harness pins all of it: nose-only boost doesn't climb, nose-up boost does, all four wall frames are
unit + correctly oriented, and the camera stays behind and outside the wall on each.

## Camera: the car must never leave the screen

There is deliberately **no separate wall camera**. One path computes an offset (ball->car line in
ball-cam, behind the nose in car-cam), then:
1. the height is added along the **surface normal**, not world-Y (adding it along Y wiped the
   "behind" component on a wall, where forward points straight up, parking the lens in front of ya);
2. on a surface the offset is **slid along** that surface — "away from the ball" usually points INTO
   the wall, which used to put the lens on the ball's side of the car;
3. `fitBoom` shortens the arm so the lens stays inside the shell (RL's collision probe) instead of
   sliding off the car->ball line — and it only applies the narrow goal-mouth Z limit when the car is
   **actually in the recess** (testing x alone crushed the boom to minimum near the end walls);
4. finally, after smoothing, the aim is swung toward the car until it is within 18 deg of the view
   axis. Up a wall ya genuinely cannot sit behind the car AND stare at the ball, so this frames both.
   Applied to the SMOOTHED aim against the real lens position — correcting the target just lagged.

**The camera must contain NO discontinuities.** Reported twice as "camera constantly readjusting /
screen shaking". Three separate causes, all now removed — do not reintroduce any of them:
1. the gaze lean was gated on `squeeze > 0.15`, so crossing that threshold JUMPED the aim up to 80%
   onto the car. Now continuous, proportional, no threshold.
2. the smoothing RATES were ramped by how starved the shot was (`urgency`: pos 7.6→22, look 12.2→30),
   so the camera kept flipping between gentle easing and a hard snap. Now constant.
3. the boom length was used raw, so any step in the wall/goal limit stepped the camera with it. Now
   `camFit` eases toward the fitted length and is never stepped.
On an RL-sized pitch the car is near the boards most of the time, so these fired constantly.
Harness pins it: driving along the boards, no frame-to-frame camera step may exceed 8x the median.

**The keep-in-shot correction is WALLS ONLY.** On flat ground ball-cam already sits the lens on the
ball→car line and car-cam sits behind the nose, so the car is framed anyway. Forcing it toward centre
there fought ball-cam every time the ball drifted aside — the car is SUPPOSED to sit off-centre in
ball-cam. It is only geometrically impossible up a wall, so that is the only place it applies.

**No feedback in the aim.** `camLook` is a clean smoothed track of the target and is NEVER mutated
by the framing correction — an earlier version did `camLook.lerp(car)` in place, which fed back into
next frame's smoothing and made the view oscillate around the threshold (reported as "shaking sitting
still"; it settles in a throttled preview but shakes at 60-120fps). The keep-in-shot correction and
the down-angle now work on a THROWAWAY `lk`, exposed as `camAim` for tests. The correction converges
by halving `lk` toward the car (bounded loop, pure function of the frame), so it can't jitter.

Harness pins it: the car must be <35 deg off the view axis at the wall base, up a wall, in a deep
corner and inside the goal, in BOTH camera modes. `setBallCam()` exists so tests can switch mode
(the game's `let ballCam` isn't assignable from the harness).

`rebaseYawToFloor` converts wall-frame yaw to floor yaw when a car detaches. It reads the car's
horizontal **velocity**, not its facing: right as `up` returns to +Y the surface frame is degenerate
and `carForward` jumps to an arbitrary tangent, so reading facing there snapped a straight-down
descent 90° sideways on landing (reported bug). Velocity coming down a wall points down AND into the
pitch, so its horizontal part is the right floor heading; falls back to facing, then to the surface
normal's horizontal (into the pitch) for a dead-slow peel-off.

`resetKickoff` must also clear `wallAxis` / `up` / `pitch` / `flipT` — scoring while wall-riding used
to leave the car sat sideways on the kickoff line with `yaw` read in the WALL frame.

## The playable shell (floor -> wall -> ceiling is ONE surface)

After the RL rescale the physics walls (±65.6) and ceiling (32.7) had **no meshes at all** — the
visible barn sits 30 units further out, so cars were driving on invisible planes and the "ceiling"
was open air. Fixed by generating the shell from the SAME cross-section `projectWall` uses:

- `wallRamps` — opaque timber **kick-plates**: the bottom quarter-round, floor to `WALL_R`.
- `wallRail` — a painted rail capping the kick-plates. This is the line that makes boards read as
  boards; without it the curve just looked like a smudge.
- `arenaGlass` — see-through **boards** from `WALL_R` up, over the top fillet, plus the drivable roof
  at `ceil`. Transparent on purpose (RL glass) so the hay bales, crowd and barn still show through.
- Per-venue `ramp` / `glass` / `rail` colours live in `ARENA_LOOKS`.

Physics gained the matching **wall→ceiling fillet** in `projectWall` (mirrors the bottom one), so a
car rounds onto the roof instead of hitting a hard corner, then hands over to `wallAxis === 2` once
it's past the curve. Verified the profile is continuous: normal runs (-0.71,0.71) at the floor →
(-1,0) up the wall → (-0.89,-0.45) over the top → the ceiling.

**The shell must be checked in ALL FOUR venues, not just the barn.** It is one set of meshes shared
by every arena, tinted per venue via `ramp` / `glass` / `rail` / `post` in `ARENA_LOOKS`.
Indoor (barn, pond) vs open-air (bog, marsh) is a real split: `wallUpper` — the full-height posts,
the roof trim beams and the see-through roof — is gated on `L.shell`. First pass put tall posts in
every venue and in the open-air bog they rose 28 units into the SKY like scaffolding. Short stubs
brace the boards everywhere; only indoor venues get the tall structure and a roof.

**Anything that changes the shell must change both** — the mesh and `projectWall` — or you get
invisible walls again. Generate from one profile, never hand-place them.

## Curved walls / wall-riding (keep this working)

Cars drive up the walls RL-style. Each wall meets the floor through a quarter-circle fillet of
radius `WALL_R` (16). A car carries a surface normal `c.up`; `carForward` is generalised so steering
and throttle work in any surface's tangent plane, and on the floor it returns the **exact** old flat
forward (so flat driving is byte-identical — protect that).

- Grab a wall: grounded, aimed into it above `WALL_CLIMB_MIN` (26), not across a goal mouth. Sets
  `c.wallAxis` (0=x, 1=z) + `c.wallSign`. **`wallAxis` is 0 for X-walls, which is FALSY — always test
  `!== null` / `=== null`, never truthiness. That bug cost a debugging cycle.**
- `stickToWall` projects the car onto the NEAREST point of the {floor→fillet→wall} cross-section
  (`projectWall`) and scrubs velocity into the surface. Nearest-point projection is what converts
  inward momentum into a climb — pinning the axis coord from height does NOT climb.
- `projectWall`'s vertical-wall test keys on **height** (`y >= WALL_R`), not on `p >= half`, or a
  descending car sticks at the fillet top instead of curving back down.
- Detach: rolling back past the fillet (`p <= half - WALL_R`) or a goal opening → floor; jump → launch
  along `c.up`.
- Multiplayer: snapshots still carry only pos/yaw/vel. Clients call `deriveUp(c)` to recover the wall
  pose from position — no extra bytes.
- **Tuned to real RL after "feels weird" feedback:** corner radius is RL-proportional — real RL
  corners are ~256uu on a 4096 half-arena (~6%), so `WALL_R` is 8 (was 16 ≈ 20%, a giant quarter-pipe
  you curved up from too far out). And the CAMERA: RL never rolls the camera with the car (world-up is
  kept); the readable-ness comes from WHERE it sits. `updateCamera` has a wall branch that puts the
  camera OFF the wall (along `c.up`) and BEHIND the car along the surface, looking up the wall at it —
  not pinned above near the ceiling. `camera.up` is never touched. Verified visually: the wall reads as
  the "floor" of the frame, car climbs away from the chase cam, no roll. Speedo uses 3D speed so climbs
  register.
- Visual ramp meshes (`wallRamps`) are built from the SAME arc as the physics; verified their vertex
  bounds coincide with the fillet (x∈[halfX-R, halfX], y∈[0, WALL_R]). Guarded behind
  `THREE.BufferGeometry` so the headless harness skips them. `WALL_R`/`WALL_CLIMB_MIN`/`UP_Y` are
  declared up with the arena constants because the ramp meshes are built earlier in the file than the
  physics (const TDZ bit once).
- Boost lasts a touch longer: `BOOST_DRAIN` 28 → 22.

## Multiplayer invariants (keep these working)

- **Solo must never regress.** `NET.role` defaults to `'solo'`, nothing initialises at load, and the
  headless harness runs with no network. Every solo code path is the same one it always was.
- **Roster is authoritative and ordered.** The host bakes bot names/vehicles/seat order into
  `NET.roster` and ships it with the `start` event. `cars[]` is built from it on every machine, so
  snapshot index N means the same car everywhere. Never spawn networked cars from local randomness.
- **Host simulates, clients render.** Clients run no physics except predicting their own car
  (`NET.applySnapshots`). Guard any new simulation with `NET.role !== 'client'` — the clock already is.
- **The local car is predicted, never awaited.** Relay RTT is ~122ms; waiting on the host makes
  steering feel broken. Correction is 12%/snapshot, teleport past 9 units.
- **Edge-triggered inputs ride as counters** (`_jumpSeq`, `_specSeq`), not booleans, so a dropped or
  reordered packet can't swallow or duplicate a press.
- **Split any new event into sim + presentation halves** (see `scoreGoal` / `presentGoal`): the host
  mutates state and broadcasts, both sides run the presentation.
- **A dropped player becomes a bot** — clear `car.netPeer` and the existing AI takes over mid-match.
- **No pausing a shared match.** Host pausing freezes everyone; client pausing desyncs itself.
- `?localtest=1` enables Trystero's mDNS-to-loopback fallback so two tabs on ONE machine can connect.
  Dev aid only — real players never need it, and two tabs cannot connect without it.

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
8. **TURN is CONFIRMED WORKING end-to-end** (Metered free tier, regional endpoint
   `turn:na.relay.metered.ca:80`; the hostname is shared, only username/credential are per-account).
   Full path proven: Nostr matchmaking → STUN → TURN relay → bidirectional data.
   **Measured RTT over the relay: avg 122 ms, p95 250 ms.** That is the worst case and it is why the
   local car MUST be client-predicted; do not ship a build where your own car waits on the host.
   Bandwidth over the relay is ~5 MB per 5-minute match, so the free 20 GB/month is not a constraint.
   Credentials are NOT in the repo yet — decide deliberately where they live, since the repo is public.

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
