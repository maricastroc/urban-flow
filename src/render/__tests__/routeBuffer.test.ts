import { describe, it, expect } from 'vitest';
import { tick } from '@/engine';
import { createScene, applyRoutes } from '../scene';

describe('applyRoutes: route buffer stays bounded while routing survives interventions', () => {
  it('keeps completing trips and does not grow routeBuffer across repeated re-routes', () => {
    const scene = createScene(2.0); // high demand so cars are in flight
    const { world } = scene;

    // Warm up until cars are mid-route (the risky case: rebuilding the buffer
    // under live agents holding absolute offsets into it).
    for (let n = 0; n < 200; n++) tick(world);
    expect(world.agents.activeCount).toBeGreaterThan(0);

    const tripsBeforeInterventions = world.metrics.completedTrips;

    // Simulate a long session: an intervention (which re-routes every source)
    // interleaved with simulation, over and over. A mid-flight remap bug would
    // throw "no connection a -> b" inside tick(); an unbounded buffer would keep
    // growing round over round.
    const bufSizes: number[] = [];
    for (let round = 0; round < 100; round++) {
      applyRoutes(scene);
      for (let n = 0; n < 20; n++) tick(world);
      bufSizes.push(world.routeBuffer.length);
    }

    // Routing stayed valid across every mid-flight rebuild: trips keep completing.
    expect(world.metrics.completedTrips).toBeGreaterThan(tripsBeforeInterventions);

    // Buffer is bounded by the live-agent count, not by the number of
    // interventions: late rounds stay in the same ballpark as early ones.
    // Without reclamation this grows ~linearly with interventions (100 rounds
    // here would be ~100x larger), so a generous 2x bound still catches it while
    // tolerating normal fluctuation in how many cars are in flight.
    const early = Math.max(...bufSizes.slice(0, 10));
    const late = Math.max(...bufSizes.slice(-10));
    expect(late).toBeLessThanOrEqual(early * 2 + 128);
  });
});
