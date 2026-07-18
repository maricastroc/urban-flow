import { tick } from '@/engine';
import {
  createScene,
  captureConfig,
  applyConfig,
  sampleStats,
  toggleSignal,
  flipPriority,
  type Scene,
  type Stats,
  type ScenarioConfig,
} from './scene';

export interface Candidate {
  readonly id: string;
  readonly label: string;
  readonly kind: 'signal' | 'priority';
  readonly junction: number;
  apply(scene: Scene): void;
}

export function generateCandidates(scene: Scene): Candidate[] {
  const out: Candidate[] = [];
  const { rank } = scene.world.control;
  const conns = scene.world.graph.connections;
  scene.junctions.forEach((j, idx) => {
    const signalized = scene.signals[idx]?.enabled === true;
    const flipped = j.approaches.some((ap) => ap.conns.some((ci) => rank[ci] !== conns[ci].rank));
    // Only offer interventions not already applied on the current network — the
    // sweep builds on top of the staged scenario, so re-suggesting a live change
    // would be a no-op. (Signals override give-way, so priority is moot there too.)
    if (!signalized) {
      out.push({
        id: `sig:${idx}`,
        label: `Signalize ${j.node}`,
        kind: 'signal',
        junction: idx,
        apply: (s) => {
          if (s.signals[idx]?.enabled !== true) toggleSignal(s, idx);
        },
      });
    }
    if (!signalized && !flipped) {
      out.push({
        id: `pri:${idx}`,
        label: `Flip priority ${j.node}`,
        kind: 'priority',
        junction: idx,
        apply: (s) => flipPriority(s, idx),
      });
    }
  });
  return out;
}

export interface Baseline {
  readonly cfg: ScenarioConfig;
  readonly stats: Stats;
}

export interface SweepRow {
  readonly candidate: Candidate;
  readonly stats: Stats;
  readonly tripsDelta: number;
  readonly speedDelta: number;
}

function runFor(scene: Scene, ticks: number): void {
  for (let n = 0; n < ticks; n++) tick(scene.world);
}

export function sweepBaseline(scene: Scene, ticks: number): Baseline {
  const cfg = captureConfig(scene);
  const w = createScene(0);
  applyConfig(w, cfg, true); // baseline = the current staged scenario, not a clean grid
  runFor(w, ticks);
  return { cfg, stats: sampleStats(w.world) };
}

export function sweepCandidate(base: Baseline, candidate: Candidate, ticks: number): SweepRow {
  const w = createScene(0);
  applyConfig(w, base.cfg, true); // each candidate is tested on top of the staged scenario
  candidate.apply(w);
  runFor(w, ticks);
  const stats = sampleStats(w.world);
  const b = base.stats;
  return {
    candidate,
    stats,
    tripsDelta: b.completedTrips ? (stats.completedTrips - b.completedTrips) / b.completedTrips : 0,
    speedDelta: b.avgSpeedKmh ? (stats.avgSpeedKmh - b.avgSpeedKmh) / b.avgSpeedKmh : 0,
  };
}
