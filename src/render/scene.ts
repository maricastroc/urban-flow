import {
  buildLaneGraph,
  createWorld,
  allocAgent,
  freeAgent,
  pushBack,
  popFront,
  NONE,
  type World,
} from '@/engine';
import type { LaneGeometry } from './geometry';

const LANE_LENGTH = 220; // metres
const SPEED_LIMIT = 16; // m/s (~58 km/h)
const SPAWN_GAP = 12; // metres of clear space at the start required to admit a car
const CAPACITY = 48;

export interface Scene {
  readonly world: World;
  readonly geometry: LaneGeometry;
  readonly laneLength: number;
}

/** Build a single straight-lane scene, pre-filled with `initialCars` evenly spaced at rest. */
export function createScene(initialCars: number): Scene {
  const graph = buildLaneGraph([
    { length: LANE_LENGTH, speedLimit: SPEED_LIMIT, fromNode: 0, toNode: 1 },
  ]);
  const world = createWorld(graph, CAPACITY);
  const geometry: LaneGeometry = { a: [{ x: 0, y: 0 }], b: [{ x: LANE_LENGTH, y: 0 }] };

  const n = Math.max(0, Math.min(initialCars, Math.floor(LANE_LENGTH / SPAWN_GAP)));
  const spacing = n > 0 ? LANE_LENGTH / n : 0;
  // Place front-first (largest s first) to match the lane's descending-s order.
  for (let k = n - 1; k >= 0; k--) {
    const id = allocAgent(world.agents);
    world.agents.s[id] = k * spacing;
    world.agents.v[id] = 0;
    world.agents.type[id] = 0;
    pushBack(world.agents, world.occ, 0, id);
  }
  return { world, geometry, laneLength: LANE_LENGTH };
}

/**
 * Demo harness that keeps the lane populated: remove cars that pass the end, and admit a new
 * one at the start when there is room and we are below `maxCars`.
 *
 * This is NOT the engine's demand-driven spawn/despawn (that arrives in a later Etapa) — it is
 * scene glue built from the same public primitives the tests use, so the first render has a
 * continuous, living stream instead of emptying out.
 */
export function pump(scene: Scene, maxCars: number): void {
  const { world } = scene;
  const { agents, occ } = world;

  // Outflow: despawn any car that has crossed the lane end.
  let head = occ.head[0];
  while (head !== NONE && agents.s[head] >= scene.laneLength) {
    freeAgent(agents, popFront(agents, occ, 0));
    head = occ.head[0];
  }

  // Inflow: admit one car at the start if there is clearance and we are below the cap.
  const tail = occ.tail[0];
  const hasRoom = tail === NONE || agents.s[tail] >= SPAWN_GAP;
  if (hasRoom && agents.activeCount < maxCars) {
    const id = allocAgent(agents);
    if (id !== NONE) {
      agents.s[id] = 0;
      agents.v[id] = 0;
      agents.type[id] = 0;
      pushBack(agents, occ, 0, id);
    }
  }
}
