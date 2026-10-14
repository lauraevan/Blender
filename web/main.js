// SPDX-License-Identifier: GPL-2.0-or-later
// WebGL2 smoke viewport, NOT a replacement for Blender's real editor.
import createBlenderCore from './blender_core.js';

const status = document.querySelector('#status');
const canvas = document.querySelector('#viewport');
const gl = canvas.getContext('webgl2', {antialias:true, alpha:false});
if (!gl) {
  status.textContent = 'WebGL2 unavailable';
  throw new Error('WebGL2 is required for this test viewport');
}

const core = await createBlenderCore();
const encoded = core._bw_float_to_half(1.5);
if (core._bw_upstream_version()!==50202 || encoded!==0x3e00 || core._bw_half_to_float(encoded)!==1.5) {
  throw new Error('Blender WASM core ABI smoke check failed');
}
document.querySelector('#test').textContent = '1.5 → 0x3E00 → 1.5 PASS';
status.textContent = 'Native Blender math loaded';

function compile(type,src){
  const s=gl.createShader(type);
  gl.shaderSource(s,src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
const vertexSource = [
 '#version 300 es','precision highp float;',
 'layout(location=0) in vec3 aPosition;',
 'layout(location=1) in vec3 aNormal;',
 'uniform vec2 uRotation;',
 'uniform float uDistance;',
 'uniform mat4 uProjection;',
 'out vec3 normal;',
 'void main(){',
 ' float cy=cos(uRotation.x),sy=sin(uRotation.x);',
 ' float cx=cos(uRotation.y),sx=sin(uRotation.y);',
 ' mat3 ry=mat3(cy,0.0,-sy,0.0,1.0,0.0,sy,0.0,cy);',
 ' mat3 rx=mat3(1.0,0.0,0.0,0.0,cx,sx,0.0,-sx,cx);',
 ' mat3 r=rx*ry;',
 ' vec3 p=r*aPosition;',
 ' p.z-=uDistance;',
 ' normal=r*aNormal;',
 ' gl_Position=uProjection*vec4(p,1.0);',
 '}'
].join('\n');
const fragmentSource=[
 '#version 300 es','precision highp float;',
 'in vec3 normal;','out vec4 color;',
 'void main(){',
 'float diffuse=max(dot(normalize(normal),normalize(vec3(0.7,1.1,1.4))),0.0);',
 'color=vec4(vec3(0.41,0.50,0.62)*(0.35+0.65*diffuse),1.0);',
 '}'
].join('\n');
const program=gl.createProgram();
gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexSource));
gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentSource));
gl.linkProgram(program);
if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
gl.useProgram(program);
const faces=[
 {n:[0,0,1],v:[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]},
 {n:[0,0,-1],v:[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]},
 {n:[1,0,0],v:[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]]},
 {n:[-1,0,0],v:[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]]},
 {n:[0,1,0],v:[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]},
 {n:[0,-1,0],v:[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]}
];
const positions=[],normals=[];
for(const face of faces) for(const i of [0,1,2,0,2,3]){
 positions.push(...face.v[i]);normals.push(...face.n);
}
// Original Blender FP16 conversion compiled to WebAssembly, not JS math.
const halfPositions=new Uint16Array(positions.map(x=>core._bw_float_to_half(x)));
const vao=gl.createVertexArray();gl.bindVertexArray(vao);
const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
gl.bufferData(gl.ARRAY_BUFFER,halfPositions,gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.HALF_FLOAT,false,0,0);
const normBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,normBuf);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);
gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);
gl.clearColor(.08,.09,.105,1);
const uProjection=gl.getUniformLocation(program,'uProjection');
const uRotation=gl.getUniformLocation(program,'uRotation');
const uDistance=gl.getUniformLocation(program,'uDistance');
let yaw=.65,pitch=-.3,distance=5.6,drag=null;
canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointerup',()=>drag=null);
canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('pointermove',e=>{
 if(!drag)return;
 yaw+=(e.clientX-drag[0])*.009;
 pitch=Math.max(-1.5,Math.min(1.5,pitch+(e.clientY-drag[1])*.009));
 drag=[e.clientX,e.clientY];
});
canvas.addEventListener('wheel',e=>{
 distance=Math.max(2.5,Math.min(12,distance+e.deltaY*.004));e.preventDefault();
},{passive:false});
function frame(){
 const dpr=Math.min(window.devicePixelRatio||1,2);
 const w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const f=1/Math.tan(Math.PI/6),near=.1,far=100;
 gl.uniformMatrix4fv(uProjection,false,new Float32Array([
  f*h/w,0,0,0, 0,f,0,0,
  0,0,(far+near)/(near-far),-1,
  0,0,2*far*near/(near-far),0
 ]));
 gl.uniform2f(uRotation,yaw,pitch);
 gl.uniform1f(uDistance,distance);
 gl.bindVertexArray(vao);gl.drawArrays(gl.TRIANGLES,0,positions.length/3);
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
