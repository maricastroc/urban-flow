// Pure helpers for tracing a selected car's Dijkstra route (§22). DOM-free and
// deterministic, so they unit-test in the Node env. The route itself was computed
// in the engine (routing.ts) and stored per-OD in world.routeBuffer; here we just
// read the selected agent's slice of it.

import type { World } from '@/engine';

export interface CarRoute {
  readonly lanes: number[]; // full origin→destination lane sequence
  readonly idx: number; // index in `lanes` of the car's current lane
}

// The selected car's route (full path) + how far along it is, or null if the car
// has no route (e.g. a single-exit hand-placed agent — never happens in the grid).
export function carRoute(world: World, id: number): CarRoute | null {
  const { agents, routeBuffer } = world;
  const start = agents.routeStart[id];
  const end = agents.routeEnd[id];
  if (end <= start) return null;
  const lanes: number[] = [];
  for (let i = start; i < end; i++) lanes.push(routeBuffer[i]);
  return { lanes, idx: agents.routeIdx[id] - start };
}

// Stable identity across slot reuse: the free-list recycles agent slots, but each
// spawn stamps a fresh enterTime, so (id, key) pins one specific vehicle. Without
// this a despawn+respawn into the same slot would silently re-target the trace.
export function isSelectedCarLive(world: World, id: number, key: number): boolean {
  return id >= 0 && world.agents.active[id] === 1 && world.agents.enterTime[id] === key;
}

// Fraction of the route already covered, by distance — a smooth 0..1 for the HUD.
export function carProgress(world: World, id: number): number {
  const r = carRoute(world, id);
  if (!r) return 0;
  const len = world.graph.length;
  let total = 0;
  for (const lane of r.lanes) total += len[lane];
  if (total <= 0) return 0;
  let done = 0;
  for (let i = 0; i < r.idx; i++) done += len[r.lanes[i]];
  done += Math.min(world.agents.s[id], len[r.lanes[r.idx]]);
  return Math.min(1, done / total);
}
