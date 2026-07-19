export interface SimClientConfig {
  readonly grid: number;
  readonly capacity: number;
  readonly demand: number;
  readonly speed: number;
  readonly playing: boolean;
}

export interface SimFrames {
  readonly prev: Float32Array | null;
  readonly cur: Float32Array | null;
  readonly arrival: number;
  readonly speed: number;
}

export interface SimClient {
  setDemand(demand: number): void;
  setPlaying(playing: boolean): void;
  setSpeed(speed: number): void;
  reset(cfg: SimClientConfig): void;
  frames(): SimFrames;
  dispose(): void;
}

export function createSimClient(cfg: SimClientConfig): SimClient | null {
  if (typeof Worker === 'undefined') return null;
  let worker: Worker;
  try {
    worker = new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    return null;
  }

  let prev: Float32Array | null = null;
  let cur: Float32Array | null = null;
  let arrival = 0;
  let speed = cfg.speed;

  worker.onmessage = (e: MessageEvent) => {
    const m = e.data as { type: string; frame?: Float32Array; speed?: number };
    if (m.type === 'frame' && m.frame) {
      prev = cur;
      cur = m.frame;
      arrival = performance.now();
      speed = m.speed ?? speed;
    }
  };
  worker.postMessage({ type: 'init', ...cfg });

  return {
    setDemand: (demand) => worker.postMessage({ type: 'setDemand', demand }),
    setPlaying: (playing) => worker.postMessage({ type: 'setPlaying', playing }),
    setSpeed: (s) => worker.postMessage({ type: 'setSpeed', speed: s }),
    reset: (c) => worker.postMessage({ type: 'reset', ...c }),
    frames: () => ({ prev, cur, arrival, speed }),
    dispose: () => worker.terminate(),
  };
}
