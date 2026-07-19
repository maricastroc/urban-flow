import type { VParams } from '@/engine';
import type { World } from '@/engine';
import type { RenderCar } from './renderer';

export const FRAME_HEADER = 3;
export const FRAME_FIELDS = 6;

export function frameLength(capacity: number): number {
  return FRAME_HEADER + capacity * FRAME_FIELDS;
}

export function packFrame(world: World, out?: Float32Array): Float32Array {
  const { agents } = world;
  const cap = agents.capacity;
  const len = frameLength(cap);
  const f = out && out.length >= len ? out : new Float32Array(len);
  f[0] = world.time;
  f[1] = world.metrics.completedTrips;
  f[2] = agents.activeCount;
  for (let i = 0; i < cap; i++) {
    const o = FRAME_HEADER + i * FRAME_FIELDS;
    f[o] = agents.active[i];
    f[o + 1] = agents.lane[i];
    f[o + 2] = agents.s[i];
    f[o + 3] = agents.v[i];
    f[o + 4] = agents.type[i];
    f[o + 5] = agents.enterTime[i];
  }
  return f;
}

export interface FrameStats {
  readonly time: number;
  readonly completedTrips: number;
  readonly cars: number;
  readonly avgSpeedKmh: number;
}

export function frameStats(frame: Float32Array): FrameStats {
  const cap = (frame.length - FRAME_HEADER) / FRAME_FIELDS;
  let cars = 0;
  let sum = 0;
  for (let i = 0; i < cap; i++) {
    const o = FRAME_HEADER + i * FRAME_FIELDS;
    if (frame[o] < 0.5) continue;
    cars += 1;
    sum += frame[o + 3];
  }
  return {
    time: frame[0],
    completedTrips: frame[1],
    cars,
    avgSpeedKmh: cars ? (sum / cars) * 3.6 : 0,
  };
}

export function framesToCars(
  prev: Float32Array | null,
  cur: Float32Array,
  alpha: number,
  vparams: readonly VParams[],
  speedLimit: Float32Array,
): RenderCar[] {
  const cap = (cur.length - FRAME_HEADER) / FRAME_FIELDS;
  const interp = prev !== null && prev.length === cur.length;
  const cars: RenderCar[] = [];
  for (let i = 0; i < cap; i++) {
    const o = FRAME_HEADER + i * FRAME_FIELDS;
    if (cur[o] < 0.5) continue;
    const lane = cur[o + 1];
    const curS = cur[o + 2];
    const type = cur[o + 4];
    let s = curS;
    if (interp && prev![o] > 0.5 && prev![o + 1] === lane) {
      const prevS = prev![o + 2];
      s = prevS + (curS - prevS) * alpha;
    }
    const p = vparams[type] ?? vparams[0];
    const v0 = speedLimit[lane] * p.v0Factor;
    cars.push({
      id: i,
      key: cur[o + 5],
      lane,
      s,
      length: p.length,
      speedFrac: v0 ? cur[o + 3] / v0 : 0,
    });
  }
  return cars;
}
