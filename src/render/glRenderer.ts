import { fitCamera, placementAt, type LaneGeometry } from './geometry';
import { thermal, clamp01 } from './thermal';
import type { RenderCar } from './renderer';

const STRIDE = 10;

const VERT = `#version 300 es
layout(location=0) in vec2 aCorner;
layout(location=1) in vec2 iPos;
layout(location=2) in vec2 iDir;
layout(location=3) in vec2 iHalf;
layout(location=4) in vec4 iColor;
uniform vec2 uViewport;
out vec2 vP;
out vec2 vHalf;
out vec4 vColor;
void main() {
  vec2 local = aCorner * iHalf;
  vec2 rot = vec2(local.x * iDir.x - local.y * iDir.y, local.x * iDir.y + local.y * iDir.x);
  vec2 screen = iPos + rot;
  vec2 clip = (screen / uViewport) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vP = local;
  vHalf = iHalf;
  vColor = iColor;
}`;

const FRAG = `#version 300 es
precision mediump float;
in vec2 vP;
in vec2 vHalf;
in vec4 vColor;
out vec4 outColor;
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
void main() {
  float r = min(vHalf.x, vHalf.y);
  float d = sdRoundBox(vP, vHalf, r);
  float aa = fwidth(d) + 0.001;
  float mask = 1.0 - smoothstep(-aa, aa, d);
  if (mask <= 0.001) discard;
  float nose = clamp(vP.x / vHalf.x * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(vColor.rgb, vec3(0.97, 0.98, 1.0), 0.32 + 0.53 * nose);
  float rim = smoothstep(-1.6, -0.1, d);
  col = mix(col, vec3(0.03, 0.04, 0.06), rim * 0.45);
  outColor = vec4(col, vColor.a * mask);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('car shader:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export interface CarRenderer {
  draw(cssWidth: number, cssHeight: number, data: Float32Array, count: number): void;
  dispose(): void;
}

export function createCarRenderer(gl: WebGL2RenderingContext): CarRenderer | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('car program:', gl.getProgramInfoLog(prog));
    return null;
  }
  const uViewport = gl.getUniformLocation(prog, 'uViewport');

  const vao = gl.createVertexArray();
  const quad = gl.createBuffer();
  const inst = gl.createBuffer();
  gl.bindVertexArray(vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const stride = STRIDE * 4;
  gl.bindBuffer(gl.ARRAY_BUFFER, inst);
  for (const [loc, size, off] of [[1, 2, 0], [2, 2, 2], [3, 2, 4], [4, 4, 6]] as const) {
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off * 4);
    gl.vertexAttribDivisor(loc, 1);
  }
  gl.bindVertexArray(null);

  let cap = 0;

  return {
    draw(cssWidth, cssHeight, data, count) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (count === 0) return;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(prog);
      gl.uniform2f(uViewport, cssWidth, cssHeight);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, inst);
      const need = count * STRIDE;
      const view = data.subarray(0, need);
      if (need > cap) {
        gl.bufferData(gl.ARRAY_BUFFER, view, gl.DYNAMIC_DRAW);
        cap = need;
      } else {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
      }
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      gl.bindVertexArray(null);
    },
    dispose() {
      gl.deleteProgram(prog);
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(quad);
      gl.deleteBuffer(inst);
    },
  };
}

export function packCarInstances(
  geom: LaneGeometry,
  width: number,
  height: number,
  cars: readonly RenderCar[],
  dimOf: (lane: number) => number,
  out?: Float32Array,
): { data: Float32Array; count: number } {
  const cam = fitCamera(geom, width, height);
  const n = cars.length;
  const need = n * STRIDE;
  const data = out && out.length >= need ? out : new Float32Array(Math.max(need, STRIDE * 64));
  for (let i = 0; i < n; i++) {
    const c = cars[i];
    const p = placementAt(geom, c.lane, c.s);
    const col = thermal(clamp01(c.speedFrac));
    const o = i * STRIDE;
    data[o] = cam.ox + p.x * cam.scale;
    data[o + 1] = cam.oy + p.y * cam.scale;
    data[o + 2] = Math.cos(p.heading);
    data[o + 3] = Math.sin(p.heading);
    data[o + 4] = Math.max(8, c.length * cam.scale * 1.05) * 0.5;
    data[o + 5] = Math.max(4.6, 2.5 * cam.scale) * 0.5;
    data[o + 6] = col[0] / 255;
    data[o + 7] = col[1] / 255;
    data[o + 8] = col[2] / 255;
    data[o + 9] = dimOf(c.lane);
  }
  return { data, count: n };
}
