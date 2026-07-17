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
  querySelectorAll: ()=>[],
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
class Light extends Obj3D{ constructor(){super(); this.shadow={mapSize:{set(){}},camera:{left:0,right:0,top:0,bottom:0,far:0}};} }
class Mat { constructor(){ this.color={setHex(){}}; this.opacity=1; } }
global.THREE = {
  WebGLRenderer: class { constructor(){ this.domElement=makeEl('canvas'); this.shadowMap={}; }
    setSize(){} setPixelRatio(){} render(){} },
  Scene: class extends Obj3D { }, Color: class{}, Fog: class{},
  PerspectiveCamera: Cam, HemisphereLight: Light, DirectionalLight: Light,
  Mesh, Group: class extends Obj3D{}, Sprite: class extends Obj3D{},
  PlaneGeometry:class{}, BoxGeometry:class{}, CylinderGeometry:class{}, ConeGeometry:class{}, SphereGeometry:class{}, CircleGeometry:class{},
  TorusGeometry:class{}, ExtrudeGeometry:class{}, Shape:class{ moveTo(){} lineTo(){} quadraticCurveTo(){} },
  MeshLambertMaterial:Mat, MeshBasicMaterial:Mat, SpriteMaterial:class{}, CanvasTexture:class{},
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
eval(src + '\n;global.__G={startMatch,cars,game,ball,keys,lobby,pads,camera,camPos};');
const {startMatch,cars,game,ball,keys,lobby,pads,camera,camPos} = global.__G;

// ---- simulate ----
function frame(){ const fn=rafQueue.shift(); if(fn) fn(); while(pendingTimeouts.length) pendingTimeouts.shift()(); }
function runFrames(n){ for(let f=0; f<n && game.state!=='end'; f++) frame(); }
function press(i){ fakePad.buttons[i].pressed=true; frame(); fakePad.buttons[i].pressed=false; frame(); }

// controller menu-nav test (in lobby)
press(13); press(13); press(13); press(13);
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
ball.pos.set(70, 5, 0); ball.vel.set(85, 0, 0);
runFrames(30);
console.log('TEST A — score after shot:', game.score, 'state:', game.state);
if(game.score[0] !== 1) throw new Error('direct shot did not score');
runFrames(60*5);
console.log('state after goal reset:', game.state);

// demolition test
for(let i=0;i<60*20 && game.state!=='play';i++) frame();
const dbot = cars.find(c=>!c.isPlayer);
dbot.pos.set(0,0,0); dbot.vel.set(0,0,0);
game.player.dead=0; game.player.pos.set(-8,0,0); game.player.yaw=Math.PI/2; game.player.vel.set(58,0,0); game.player.boost=100;
fakePad.buttons[7].value=1; fakePad.buttons[7].pressed=true; fakePad.buttons[1].pressed=true;
for(let i=0;i<8;i++) frame();
fakePad.buttons[7].value=0; fakePad.buttons[7].pressed=false; fakePad.buttons[1].pressed=false;
console.log('demolition test — bot dead:', dbot.dead>0);
if(!(dbot.dead>0)) throw new Error('demolition did not trigger');
for(let i=0;i<60*4;i++) frame();
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
game.player.pos.set(88, 0, 0); ball.pos.set(0, 4.4, 0); ball.vel.set(0,0,0);
for(let i=0;i<120;i++) frame();
console.log('goal camera test — camPos:', camPos.x.toFixed(1), camPos.y.toFixed(1), camPos.z.toFixed(1));
if(camPos.x < 82) throw new Error('camera did not follow the car into the goal');
if(camPos.x > 82+26-2.4) throw new Error('camera punched out the back of the goal');
if(Math.abs(camPos.z) > 15-1.4 || camPos.y > 12-1.4) throw new Error('camera clipped out of the goal recess');

// bots-only + clock runout
const before = game.score[0]+game.score[1];
runFrames(60*240);
console.log('TEST B — organic goals:', (game.score[0]+game.score[1])-before, 'score:', game.score, 'state:', game.state);
runFrames(60*120);
console.log('TEST C — state:', game.state, 'timeLeft:', game.timeLeft.toFixed(1), 'overtime:', game.overtime);
if(game.state!=='end' && !game.overtime) throw new Error('match never ended');
if(Math.abs(ball.pos.x) > 100 || Math.abs(ball.pos.z) > 60) throw new Error('ball escaped arena');
console.log('rumble events:', rumbles);
console.log('ALL TESTS PASSED');
