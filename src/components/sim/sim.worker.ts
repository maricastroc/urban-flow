import { tick } from '@/engine';
import { createScene, setDemandRate, type Scene } from '@/render/scene';
import { packFrame } from '@/render/simFrame';

const DT = 0.2;
const MAX_STEPS = 5;
const PUBLISH_MS = 16;

const ctx = self as unknown as {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage: (m: unknown, transfer?: Transferable[]) => void;
};

let scene: Scene | null = null;
let playing = true;
let speed = 1;
let acc = 0;
let last = 0;
let running = false;

function publish(): void {
  if (!scene) return;
  const f = packFrame(scene.world);
  ctx.postMessage({ type: 'frame', frame: f, speed, playing }, [f.buffer]);
}

function loop(): void {
  if (!running) return;
  const now = performance.now();
  const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
  last = now;
  if (scene && playing) {
    acc += dt * speed;
    let n = 0;
    while (acc >= DT && n < MAX_STEPS) {
      tick(scene.world);
      acc -= DT;
      n += 1;
    }
    if (n > 0) publish();
  }
  setTimeout(loop, PUBLISH_MS);
}

ctx.onmessage = (e) => {
  const m = e.data as { type: string; grid: number; capacity: number; demand: number; speed?: number; playing?: boolean };
  if (m.type === 'init' || m.type === 'reset') {
    scene = createScene(m.demand, { grid: m.grid, capacity: m.capacity });
    playing = m.playing ?? true;
    speed = m.speed ?? 1;
    acc = 0;
    last = 0;
    publish();
    if (!running) {
      running = true;
      setTimeout(loop, PUBLISH_MS);
    }
  } else if (!scene) {
    return;
  } else if (m.type === 'setDemand') {
    setDemandRate(scene, m.demand);
  } else if (m.type === 'setPlaying') {
    playing = m.playing ?? true;
    last = 0;
  } else if (m.type === 'setSpeed') {
    speed = m.speed ?? 1;
  }
};
