// ---- minimal DOM + THREE stubs to smoke-test game logic ----
function ctx2d(){ return new Proxy({}, { get:(t,k)=>{
  if(k==='measureText') return ()=>({width:10});
  if(k==='createLinearGradient'||k==='createRadialGradient') return ()=>({addColorStop(){}});
  return ()=>{};
}, set:()=>true }); }
function makeEl(tag){
  const el = {
    tag, style:new Proxy({},{get:(t,k)=> k==='setProperty' ? ()=>{} : '', set:()=>true}), children:[], dataset:{},
    classList:{ add(){}, remove(){}, toggle(){} },
    set innerHTML(v){ this._h=v; }, get innerHTML(){ return this._h||''; },
    textContent:'', value:'', width:0, height:0,
    appendChild(c){ this.children.push(c); c.parentNode=this; return c; },
    removeChild(c){ this.children = this.children.filter(x=>x!==c); },
    get firstChild(){ return this.children[0]; },
    getContext(){ return ctx2d(); },
    addEventListener(){}, onclick:null,
  };
  return el;
}
const els = {};
global.document = {
  createElement: t=>makeEl(t),
  getElementById: id=> (els[id] ||= makeEl('div')),
  // Returning [] for everything made menu rows collapse in the harness but not
  // in a browser, so nav tests only passed by accident. Give the selectors the
  // lobby actually uses a realistic element count.
  querySelectorAll: sel=>{
    const counts = {
      '#vehicle-list .vcard': 5, '#vehicle-list-join .vcard': 5,
      '#size-row .pick-btn': 3, '#len-row .pick-btn': 3, '#arena-row .pick-btn': 4,
      '#overlay-screen .ov-btn': 3, '#waitroom .btn-row .pick-btn': 2,
    };
    const n = counts[sel] || 0;
    return Array.from({length:n}, ()=>makeEl('button'));
  },
  body: makeEl('body'),
  get activeElement(){ return null; },
};
global.window = global;
global.innerWidth=1280; global.innerHeight=720; global.devicePixelRatio=1;
global.addEventListener = ()=>{};
global.AudioContext = undefined;
let rafQueue=[];
global.requestAnimationFrame = f=>rafQueue.push(f);
const pendingTimeouts=[];
global.setTimeout = (f,ms)=>{ pendingTimeouts.push(f); return 1; };
global.clearTimeout = ()=>{};
global.setInterval = ()=>0;
global.clearInterval = ()=>{};

// ---- THREE stub ----
class V3 {
  constructor(x=0,y=0,z=0){ this.x=x;this.y=y;this.z=z; }
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  setX(x){this.x=x;return this;} setY(y){this.y=y;return this;} setZ(z){this.z=z;return this;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  clone(){return new V3(this.x,this.y,this.z);}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
  normalize(){const l=this.length()||1;return this.multiplyScalar(1/l);}
  length(){return Math.hypot(this.x,this.y,this.z);}
  lengthSq(){return this.x**2+this.y**2+this.z**2;}
  dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
  distanceToSquared(v){return (this.x-v.x)**2+(this.y-v.y)**2+(this.z-v.z)**2;}
  lerp(v,a){this.x+=(v.x-this.x)*a;this.y+=(v.y-this.y)*a;this.z+=(v.z-this.z)*a;return this;}
}
class Euler{ constructor(){this.x=0;this.y=0;this.z=0;} set(x,y,z){this.x=x;this.y=y;this.z=z;} }
class Obj3D {
  constructor(){ this.position=new V3(); this.rotation=new Euler(); this.scale={setScalar(){},set(){},z:1};
    this.children=[]; this.visible=true; this.userData={}; this.castShadow=false; this.receiveShadow=false; }
  add(c){this.children.push(c); return this;}
  remove(c){this.children=this.children.filter(x=>x!==c); return this;}
  rotateX(){} rotateZ(){} lookAt(){}
}
class Mesh extends Obj3D{ constructor(g,m){super(); this.geometry=g; this.material=m;} clone(){ return new Mesh(this.geometry,this.material); } }
class Cam extends Obj3D{ constructor(){super(); this.aspect=1; this.fov=80;} updateProjectionMatrix(){} }
class Light extends Obj3D{ constructor(){super(); this.color={setHex(){}}; this.groundColor={setHex(){}}; this.intensity=1;
  this.shadow={mapSize:{set(){}},camera:{left:0,right:0,top:0,bottom:0,far:0}};} }
class Mat { constructor(){ this.color={setHex(){}}; this.opacity=1; this.userData={}; } dispose(){} }
global.THREE = {
  WebGLRenderer: class { constructor(){ this.domElement=makeEl('canvas'); this.shadowMap={}; }
    setSize(){} setPixelRatio(){} render(){} },
  Scene: class extends Obj3D { }, Color: class{}, Fog: class{},
  PerspectiveCamera: Cam, HemisphereLight: Light, DirectionalLight: Light,
  Mesh, Group: class extends Obj3D{}, Sprite: class extends Obj3D{ constructor(m){ super(); this.material = m || new Mat(); } },
  PlaneGeometry:class{}, BoxGeometry:class{}, CylinderGeometry:class{}, ConeGeometry:class{}, SphereGeometry:class{}, CircleGeometry:class{},
  TorusGeometry:class{}, ExtrudeGeometry:class{}, Shape:class{ moveTo(){} lineTo(){} quadraticCurveTo(){} },
  MeshLambertMaterial:Mat, MeshBasicMaterial:Mat, SpriteMaterial:Mat, CanvasTexture:class{},
  Vector3: V3,
  MathUtils:{ clamp:(v,a,b)=>Math.max(a,Math.min(b,v)) },
  Clock: class{ getDelta(){ return 1/60; } },
  PCFSoftShadowMap: 1, DoubleSide: 2, BackSide: 3,
};

// fake DualSense
let rumbles=0;
const fakePad = {
  connected:true, axes:[0,0,0,0],
  buttons: Array.from({length:17},()=>({pressed:false,value:0})),
  vibrationActuator:{ playEffect(){ rumbles++; return Promise.resolve(); } },
};
Object.defineProperty(global, 'navigator', { value: { getGamepads: ()=>[fakePad] }, configurable:true });

// ---- load game ----
const fs=require('fs');
const src=fs.readFileSync('/tmp/game.js','utf8');
eval(src + '\n;global.__G={startMatch,cars,game,ball,keys,lobby,pads,camera,camPos,NET,updateCar,botInput,presentGoal,togglePause,tryJump,stickToWall,carForward,updateCamera,ARENA,WALL_R,BOOST_DRAIN};');
const {startMatch,cars,game,ball,keys,lobby,pads,camera,camPos,NET,updateCar,botInput,presentGoal,togglePause,tryJump,stickToWall,carForward,updateCamera,ARENA,WALL_R,BOOST_DRAIN} = global.__G;

// ---- simulate ----
function frame(){ const fn=rafQueue.shift(); if(fn) fn(); while(pendingTimeouts.length) pendingTimeouts.shift()(); }
function runFrames(n){ for(let f=0; f<n && game.state!=='end'; f++) frame(); }
function press(i){ fakePad.buttons[i].pressed=true; frame(); fakePad.buttons[i].pressed=false; frame(); }

// controller menu-nav test — the lobby is staged now.
// Stage 1 (home): PLAY SOLO / HOST / JOIN. Activating PLAY SOLO opens stage 2.
// Stage 2 (setup, solo): team, ride, size, length, arena, GIT 'ER DONE, BACK
// — so 5 downs reach the start button.
press(0);
press(13); press(13); press(13); press(13); press(13);
press(0);
console.log('controller menu start test — state:', game.state, '(expect countdown)');
if(game.state!=='countdown') throw new Error('controller menu start failed');
game.state='lobby';
document.getElementById('player-name').value = 'Test Dummy';
startMatch(false);
console.log('cars:', cars.length);
if(cars.length !== lobby.size*2) throw new Error('wrong car count');

// controller drive + jump
runFrames(60*5);
fakePad.buttons[7].value = 1; fakePad.buttons[7].pressed = true;
fakePad.buttons[1].pressed = true;
runFrames(120);
if(Math.hypot(game.player.vel.x,game.player.vel.z) < 1 && game.player.pos.x===-55) throw new Error('controller throttle did nothing');
console.log('controller drive OK, speed:', Math.hypot(game.player.vel.x,game.player.vel.z).toFixed(1));
fakePad.buttons[7].value = 0; fakePad.buttons[7].pressed = false; fakePad.buttons[1].pressed = false;
for(let i=0;i<60*20 && game.state!=='play';i++) frame();
fakePad.buttons[0].pressed = true; frame(); frame(); fakePad.buttons[0].pressed = false;
if(game.player.onGround) throw new Error('controller jump did nothing');
console.log('controller jump OK, vy:', game.player.vel.y.toFixed(1));
runFrames(120);

// TEST A: direct shot into +X goal (clear the field first)
for(let i=0;i<60*20 && game.state!=='play';i++) frame();
for(const c of cars){ c.pos.set(-70+Math.random()*6, 0, -40+Math.random()*6); c.vel.set(0,0,0); }
const preA = game.score[0];   // bots can sneak an organic goal in before this — assert the DELTA
ball.pos.set(70, 5, 0); ball.vel.set(85, 0, 0);
runFrames(30);
console.log('TEST A — score after shot:', game.score, 'state:', game.state);
// goals are worth 1, or 2 for a trick shot (howitzer/air-mail/special), doubled in LAST CALL
if(game.score[0] <= preA) throw new Error('direct shot did not score (pre='+preA+')');
runFrames(60*5);
console.log('state after goal reset:', game.state);

// demolition test
for(let i=0;i<60*20 && game.state!=='play';i++) frame();
const dbot = cars.find(c=>!c.isPlayer);
// shove the ball well clear: after the previous goal it resets to the ORIGIN, which is exactly
// where this test pins the victim — the player rammed the ball first, recoiled below supersonic,
// and the demo silently failed (~8% of runs). This test is about car-vs-car, not the ball.
ball.pos.set(0, 4.4, 40); ball.vel.set(0,0,0);
dbot.pos.set(0,0,0); dbot.vel.set(0,0,0);
game.player.dead=0; game.player.pos.set(-8,0,0); game.player.yaw=Math.PI/2; game.player.vel.set(58,0,0); game.player.boost=100;
fakePad.buttons[7].value=1; fakePad.buttons[7].pressed=true; fakePad.buttons[1].pressed=true;
// PIN the victim: it's bot-driven, so its own AI (personas especially) can drive it clear of the
// ram inside the 8-frame window — a pre-existing ~8% flake. Hold it still until contact lands.
for(let i=0;i<30 && !(dbot.dead>0);i++){ dbot.pos.set(0,0,0); dbot.vel.set(0,0,0); frame(); }
fakePad.buttons[7].value=0; fakePad.buttons[7].pressed=false; fakePad.buttons[1].pressed=false;
console.log('demolition test — bot dead:', dbot.dead>0);
if(!(dbot.dead>0)) throw new Error('demolition did not trigger');
// dead-timer only ticks while cars update, which pauses through goal celebrations —
// wait UNTIL respawn (up to 15s) instead of a fixed 4s that a goal can eat into
for(let i=0;i<60*15 && !(dbot.dead<=0 && dbot.mesh.visible);i++) frame();
if(!(dbot.dead<=0 && dbot.mesh.visible)) throw new Error('respawn failed');
console.log('respawn OK');

// camera test: park player against a wall in ball-cam. The camera may retreat past the touchline
// into the barn (that's where the room to see yer car is) but must stay inside the barn shell.
game.player.pos.set(0, 0, -49); ball.pos.set(0, 4.4, 0); ball.vel.set(0,0,0);
for(let i=0;i<120;i++) frame();
console.log('camera clamp test — camPos:', camPos.x.toFixed(1), camPos.y.toFixed(1), camPos.z.toFixed(1));
if(Math.abs(camPos.z) > 52+18+0.5 || Math.abs(camPos.x) > 82-2.4) throw new Error('camera escaped the barn');
if(Math.abs(camPos.z) > 52 && camPos.y < 8.5) throw new Error('camera behind the hay bales but too low to see over them');

// camera follows the car into the goal recess (else it jams at the mouth in front of the car,
// looking back out at the ball, with the car off the bottom of the screen)
// PIN the car in the goal each frame: a bot can score during these 120 frames, and the kickoff
// reset yanks the player back to midfield so the camera legitimately leaves the goal — another
// pre-existing flake. Holding position keeps the test about the CAMERA, not about bot randomness.
game.player.pos.set(88, 0, 0); ball.pos.set(0, 4.4, 0); ball.vel.set(0,0,0);
// pin the BALL at centre too: a bot scoring mid-test fires resetKickoff INSIDE frame(), which
// yanks the car out of the goal before updateCamera runs, so the camera legitimately leaves the
// recess and the assert trips. Freezing the ball keeps this test about the camera alone.
for(let i=0;i<120;i++){
  game.player.pos.set(88, 0, 0); game.player.vel.set(0,0,0);
  ball.pos.set(0, 4.4, 0); ball.vel.set(0,0,0);
  frame();
}
console.log('goal camera test — camPos:', camPos.x.toFixed(1), camPos.y.toFixed(1), camPos.z.toFixed(1));
if(camPos.x < 82) throw new Error('camera did not follow the car into the goal');
if(camPos.x > 82+26-2.4) throw new Error('camera punched out the back of the goal');
if(Math.abs(camPos.z) > 18-1.4 || camPos.y > 13-1.4) throw new Error('camera clipped out of the goal recess');

// arena test: each venue swaps surface physics but a clean shot still scores and stays in bounds
// (arena 3 = Mallard Marsh also exercises the duck flights + shotgun path headlessly)
for(const ai of [1, 2, 3]){
  lobby.arena = ai;
  game.state='lobby'; startMatch(false);
  for(let i=0;i<60*20 && game.state!=='play';i++) frame();
  for(const c of cars){ c.pos.set(-70+Math.random()*6, 0, -40+Math.random()*6); c.vel.set(0,0,0); }
  const preS = game.score[0];
  ball.pos.set(70, 5, 0); ball.vel.set(85, 0, 0);
  runFrames(45);
  console.log('arena', ai, 'shot test — score:', game.score, 'state:', game.state);
  if(game.score[0] <= preS) throw new Error('arena '+ai+' shot did not score (pre='+preS+')');
  runFrames(60*3);
  if(Math.abs(ball.pos.x) > 100 || Math.abs(ball.pos.z) > 60) throw new Error('arena '+ai+': ball escaped');
}
lobby.arena = 0;                          // back to the barn for the long-run tests
game.state='lobby'; startMatch(false);
for(let i=0;i<60*20 && game.state!=='play';i++) frame();

// bots-only + clock runout
const before = game.score[0]+game.score[1];
runFrames(60*240);
console.log('TEST B — organic goals:', (game.score[0]+game.score[1])-before, 'score:', game.score, 'state:', game.state);
// the clock freezes through every goal celebration + countdown, so high-scoring bot runs need
// more wall-frames — wait UNTIL the match resolves (cap 5 min of frames) instead of a fixed 2
for(let i=0;i<60*300 && game.state!=='end' && !game.overtime;i++) frame();
console.log('TEST C — state:', game.state, 'timeLeft:', game.timeLeft.toFixed(1), 'overtime:', game.overtime);
if(game.state!=='end' && !game.overtime) throw new Error('match never ended');
if(Math.abs(ball.pos.x) > 100 || Math.abs(ball.pos.z) > 60) throw new Error('ball escaped arena');
console.log('rumble events:', rumbles);

// ---- multiplayer seat table (no network involved) ----
// Solo must be completely unaffected by the presence of the NET module.
if(NET.role !== 'solo') throw new Error('NET.role should default to solo');
if(NET.available()) throw new Error('NET.available() should be false with no transport loaded');

// Seats: size*2 total, humans take some, everything left over is a bot.
NET.slots = NET.buildSlots(2);
if(NET.slots.length !== 4) throw new Error('2v2 should build 4 seats');
if(NET.slots.filter(s=>s.team===0).length !== 2) throw new Error('seats not split evenly per team');

// Joiners auto-balance onto the thinner team.
NET.seatPeer('p1','ONE',0,null); NET.seatPeer('p2','TWO',0,null);
const perTeam = [0,1].map(t=>NET.slots.filter(s=>s.type==='human'&&s.team===t).length);
if(perTeam[0]!==1 || perTeam[1]!==1) throw new Error('auto-balance failed: '+perTeam);

// The human cap holds even when seats remain open.
NET.slots = NET.buildSlots(3);                       // 6 seats
for(let i=0;i<6;i++) NET.seatPeer('q'+i,'P'+i,0,null);
if(NET.humanCount() !== 4) throw new Error('human cap should be 4, got '+NET.humanCount());
if(NET.slots.filter(s=>s.type==='open').length !== 2) throw new Error('leftover seats should stay open for bots');

// A peer leaving frees its seat, which then falls back to a bot.
const freed = NET.freePeer('q0');
if(!freed || freed.type !== 'open') throw new Error('leaving peer did not free its seat');
if(NET.humanCount() !== 3) throw new Error('human count should drop to 3');
// Starting a hosted match converts every open seat to a bot and spawns a full
// grid -- this is the "fill empty player slots with an NPC" requirement.
NET.role = 'host';
NET.slots = NET.buildSlots(2);
NET.seatPeer('host-self','HOST',0,0);
game.state = 'lobby';
NET.beginMatch();
if(NET.slots.filter(s=>s.type==='open').length !== 0) throw new Error('open seats survived match start');
if(NET.slots.filter(s=>s.type==='bot').length !== 3) throw new Error('expected 3 bots, got '+NET.slots.filter(s=>s.type==='bot').length);
if(cars.length !== 4) throw new Error('expected 4 cars, got '+cars.length);
if(game.state !== 'countdown') throw new Error('hosted match did not start');
// Roster must be identical and ordered, or snapshot indices address the wrong cars.
NET.role = 'host';
NET.slots = NET.buildSlots(2);
NET.seatPeer('host-self','HOST',0,0);
NET.seatPeer('guest-1','GUEST',0,1);
for(const s of NET.slots) if(s.type==='open') s.type='bot';
const roster = NET.buildRoster();
if(roster.length !== 4) throw new Error('roster should cover every seat');
if(roster.filter(r=>r.type==='human').length !== 2) throw new Error('roster lost a human');
if(roster.some(r=>!r.name)) throw new Error('roster left a car unnamed');
if(roster.map(r=>r.team).join('') !== NET.slots.map(s=>s.team).join(''))
  throw new Error('roster order diverged from seat order');

// Building cars from a roster: the local peer drives, other humans are remote,
// and the rest fall through to the bot AI.
NET.selfId = 'host-self'; NET.roster = roster;
game.state='lobby'; startMatch(false);
if(cars.length !== 4) throw new Error('roster should spawn 4 cars');
if(!game.player || game.player.name !== 'HOST') throw new Error('local car not bound to this peer');
const remote = cars.filter(c=>c.netPeer);
if(remote.length !== 1 || remote[0].name !== 'GUEST') throw new Error('remote human car not tagged');
if(cars.filter(c=>!c.isPlayer && !c.netPeer).length !== 2) throw new Error('expected 2 bot-driven cars');

// A remote player's controls must drive their car exactly like bot input would.
NET.inputs['guest-1'] = { th:1, st:0, b:0, j:0, sp:0 };
const rin = NET.remoteInput('guest-1');
if(rin.throttle !== 1) throw new Error('remote input not resolved');
const rc = remote[0]; rc.pos.set(0,0,0); rc.vel.set(0,0,0); rc.yaw=0;
for(let i=0;i<60;i++) updateCar(rc, 1/60, NET.remoteInput('guest-1'));
if(Math.hypot(rc.vel.x, rc.vel.z) < 5) throw new Error('remote input did not move the car');
// unknown peer must not throw
if(NET.remoteInput('nobody').throttle !== 0) throw new Error('unknown peer should idle');

// Dropping out hands the car to the AI mid-match, with no respawn.
rc.netPeer = null;
if(cars.filter(c=>c.netPeer).length !== 0) throw new Error('dropped peer still owns a car');
const rin2 = botInput(rc, 1/60);
if(typeof rin2.throttle !== 'number') throw new Error('abandoned car did not fall back to bot AI');

// Goal presentation must work without a host (this is the client's path).
NET.role = 'client';
game.score=[0,0]; game.state='play';
presentGoal({ team:1, pts:2, tag:'HOWITZER', scorerName:'GUEST', scorerTeam:1 });
if(game.score[1] !== 2) throw new Error('client did not apply goal points');
if(game.state !== 'goal') throw new Error('client did not enter goal state');

// No pausing a shared match.
NET.role='host'; game.paused=false; game.state='play';
togglePause();
if(game.paused) throw new Error('multiplayer match should not be pausable');
NET.role='solo'; togglePause();
if(!game.paused) throw new Error('solo pause broke');
togglePause();

NET.role = 'solo'; NET.slots = []; NET.roster = null; NET.inputs = {};
console.log('multiplayer seat table OK — bot-fill spawns a full grid');
console.log('netcode OK — roster order, remote input, drop-to-bot, goal replication');

// ---- curved walls: cars drive up 'em ----
NET.role = 'solo';
game.state = 'lobby'; startMatch(false);
for(let i=0;i<60*20 && game.state!=='play';i++) frame();
const wc = game.player;

// flat driving in open space must be byte-identical: up stays +Y, y stays 0
wc.pos.set(0,0,0); wc.vel.set(0,0,0); wc.wallAxis=null; wc.up.set(0,1,0); wc.yaw=Math.PI/2; // face +X
for(let i=0;i<30;i++) updateCar(wc, 1/60, {throttle:1,steer:0,boost:false});
if(wc.wallAxis) throw new Error('car grabbed a wall out in the open');
if(Math.abs(wc.pos.y) > 0.001) throw new Error('flat driving lifted off the floor: y='+wc.pos.y);

// aimed into the +X wall at speed, it should climb: y rises and up tilts off +Y
wc.pos.set(ARENA.halfX - WALL_R + 1, 0, 30); wc.vel.set(60,0,0); wc.yaw=Math.PI/2; wc.wallAxis=null; wc.up.set(0,1,0);
for(let i=0;i<40;i++) updateCar(wc, 1/60, {throttle:1,steer:0,boost:true});
if(wc.wallAxis !== 0) throw new Error('car did not grab the +X wall');
if(wc.pos.y < 3) throw new Error('car did not climb the wall: y='+wc.pos.y.toFixed(1));
if(wc.up.y > 0.98) throw new Error('body did not tilt onto the wall: up.y='+wc.up.y.toFixed(2));
if(wc.pos.x > ARENA.halfX + 0.5) throw new Error('car punched through the wall: x='+wc.pos.x.toFixed(1));

// let go of everything and it slides/falls back down to the floor
for(let i=0;i<60*4;i++) updateCar(wc, 1/60, {throttle:0,steer:0,boost:false});
if(wc.wallAxis) throw new Error('car never came off the wall');
if(Math.abs(wc.up.y-1) > 0.01) throw new Error('up did not reset to +Y after returning to floor');
if(Math.abs(wc.pos.y) > 0.1) throw new Error('car did not settle back on the floor');

// jumping off a wall launches away from it (−X-ish) and detaches
wc.pos.set(ARENA.halfX, 8, 30); wc.vel.set(0,10,0); wc.wallAxis=0; wc.wallSign=1; wc.onGround=true;
stickToWall(wc); tryJump(wc);
if(wc.wallAxis) throw new Error('jump did not detach from the wall');
if(wc.vel.x > -1) throw new Error('jump did not push off the wall (vx='+wc.vel.x.toFixed(1)+')');

// no grabbing the wall across a goal mouth (would fly into the net)
wc.pos.set(ARENA.halfX - 2, 0, 0); wc.vel.set(70,0,0); wc.wallAxis=null; wc.up.set(0,1,0); wc.yaw=Math.PI/2;
for(let i=0;i<20;i++) updateCar(wc, 1/60, {throttle:1,steer:0,boost:true});
if(wc.wallAxis===0 && Math.abs(wc.pos.z) < ARENA.goalHalfW) throw new Error('car climbed the goal-mouth opening');

// --- RL air model: boost follows the NOSE, no free lift ---
// Regression: holding boost with a level nose used to fly ya into the ceiling.
wc.pos.set(0, 12, 0); wc.vel.set(0,0,0); wc.onGround=false; wc.wallAxis=null;
wc.up.set(0,1,0); wc.pitch=0; wc.yaw=0; wc.boost=100;
for(let i=0;i<60*3;i++) updateCar(wc, 1/60, {throttle:0,steer:0,boost:true});
if(wc.pos.y > 12) throw new Error('level-nose boost still climbs (y='+wc.pos.y.toFixed(1)+') — should fall');

// ...but pitch the nose up first and it climbs, exactly like RL
wc.pos.set(0, 6, 0); wc.vel.set(0,0,0); wc.onGround=false; wc.wallAxis=null;
wc.up.set(0,1,0); wc.pitch=0; wc.yaw=0; wc.boost=100;
for(let i=0;i<60*2;i++) updateCar(wc, 1/60, {throttle:-1,steer:0,boost:true});  // stick back = nose up
if(wc.pitch <= 0.3) throw new Error('pulling back did not pitch the nose up (pitch='+wc.pitch.toFixed(2)+')');
if(wc.pos.y <= 6) throw new Error('nose-up boost did not climb (y='+wc.pos.y.toFixed(1)+')');

// --- surface frame must not degenerate on the Z walls ---
// Regression: the old world-Z reference collapsed there, flipping `forward`,
// which broke steering AND threw the chase camera in front of the car.
for(const [ax, sg] of [[0,1],[0,-1],[1,1],[1,-1]]){
  wc.wallAxis=ax; wc.wallSign=sg; wc.pos.set(ax===0?sg*80:10, 10, ax===0?25:sg*50);
  wc.vel.set(0,0,0); wc.yaw=0; stickToWall(wc);
  const upLen = Math.hypot(wc.up.x, wc.up.y, wc.up.z);
  if(Math.abs(upLen-1) > 0.01) throw new Error('wall '+ax+'/'+sg+': normal not unit ('+upLen.toFixed(3)+')');
  // yaw=0 must mean "along the wall", yaw=pi/2 must mean "straight up it"
  wc.yaw = Math.PI/2; const climb = carForward(wc);
  if(climb.y < 0.95) throw new Error('wall '+ax+'/'+sg+': yaw=pi/2 is not straight up the wall (fy='+climb.y.toFixed(2)+')');
  wc.yaw = 0; const along = carForward(wc);
  if(Math.abs(along.y) > 0.05) throw new Error('wall '+ax+'/'+sg+': yaw=0 should run along the wall, not up it');
  const alen = Math.hypot(along.x, along.y, along.z);
  if(Math.abs(alen-1) > 0.01) throw new Error('wall '+ax+'/'+sg+': forward not unit ('+alen.toFixed(3)+')');
}
wc.wallAxis=null; wc.up.set(0,1,0); wc.pitch=0;

// --- chase camera must stay BEHIND the car on every wall ---
// Regression: the flipped frame put the camera in FRONT, so the car drove at you.
for(const [ax, sg] of [[0,1],[0,-1],[1,1],[1,-1]]){
  const pl = game.player;
  pl.wallAxis=ax; pl.wallSign=sg; pl.pitch=0;
  pl.pos.set(ax===0?sg*80:10, 12, ax===0?25:sg*50);
  pl.vel.set(0,0,0); pl.yaw=Math.PI/2;           // climbing straight up
  stickToWall(pl);
  camPos.copy(pl.pos);                            // start on top of the car, let it settle
  for(let i=0;i<240;i++) updateCamera(1/60);
  const fwd = carForward(pl);
  const toCam = { x: camPos.x-pl.pos.x, y: camPos.y-pl.pos.y, z: camPos.z-pl.pos.z };
  const behind = toCam.x*fwd.x + toCam.y*fwd.y + toCam.z*fwd.z;
  if(behind >= 0) throw new Error('wall '+ax+'/'+sg+': camera sits IN FRONT of the car (dot='+behind.toFixed(1)+')');
  const off = toCam.x*pl.up.x + toCam.y*pl.up.y + toCam.z*pl.up.z;
  if(off <= 0) throw new Error('wall '+ax+'/'+sg+': camera is inside the wall (off='+off.toFixed(1)+')');
}
game.player.wallAxis=null; game.player.up.set(0,1,0); game.player.pitch=0;

// boost lasts longer now
if(BOOST_DRAIN >= 28) throw new Error('boost drain was not reduced');
console.log('curved walls OK — climb, descend, jump-off, goal-mouth guard; boost drain '+BOOST_DRAIN);
console.log('RL air+surface OK — nose-only boost, aerial pitch, 4 wall frames, camera stays behind');

console.log('ALL TESTS PASSED');
