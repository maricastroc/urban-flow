import { describe, it, expect } from 'vitest';
import { tick, type World } from '@/engine';
import { createScene, pump } from '../scene';
import { placementAt } from '../geometry';

function avgSpeed(world: World): number {
  const { agents } = world;
  let sum = 0;
  let n = 0;
  for (let id = 0; id < agents.capacity; id++) {
    if (!agents.active[id]) continue;
    sum += agents.v[id];
    n += 1;
  }
  return n ? sum / n : 0;
}

describe('scene + render data path', () => {
  it('pre-places cars front-first, in strictly descending s order', () => {
    const scene = createScene(5);
    const { world } = scene;
    expect(world.agents.activeCount).toBe(5);

    let prev = Infinity;
    for (let id = world.occ.head[0]; id !== -1; id = world.agents.behind[id]) {
      expect(world.agents.s[id]).toBeLessThan(prev);
      prev = world.agents.s[id];
    }
  });

  it('cars accelerate from rest: average speed rises above zero', () => {
    const scene = createScene(6);
    expect(avgSpeed(scene.world)).toBe(0); // placed at rest
    for (let n = 0; n < 40; n++) {
      tick(scene.world);
      pump(scene, 6);
    }
    expect(avgSpeed(scene.world)).toBeGreaterThan(3); // moving now
  });

  it('maps s linearly to world x along the straight lane', () => {
    const scene = createScene(1);
    const g = scene.geometry;
    expect(placementAt(g, 0, 0).x).toBeCloseTo(0);
    expect(placementAt(g, 0, 110).x).toBeCloseTo(110);
    expect(placementAt(g, 0, scene.laneLength).x).toBeCloseTo(scene.laneLength);
  });

  it('pump keeps the lane populated within the cap and flowing', () => {
    const scene = createScene(8);
    for (let n = 0; n < 200; n++) {
      tick(scene.world);
      pump(scene, 8);
    }
    expect(scene.world.agents.activeCount).toBeLessThanOrEqual(8); // never exceeds the cap
    expect(scene.world.agents.activeCount).toBeGreaterThan(0); // did not drain out
    expect(avgSpeed(scene.world)).toBeGreaterThan(0); // still moving
  });
});
