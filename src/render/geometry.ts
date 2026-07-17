export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Placement {
  readonly x: number;
  readonly y: number;
  readonly heading: number; // radians
}

/**
 * Render-side lane geometry: where each lane physically sits in world space (metres).
 * The engine is purely metric (design doc §C), so this mapping lives only in the render layer.
 */
export interface LaneGeometry {
  readonly a: readonly Point[]; // per lane: start point
  readonly b: readonly Point[]; // per lane: end point
}

/** Map (lane, s) -> world position + heading along a straight lane segment. */
export function placementAt(geom: LaneGeometry, lane: number, s: number): Placement {
  const a = geom.a[lane];
  const b = geom.b[lane];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1; // equals the lane length for a straight segment
  const t = s / len;
  return { x: a.x + dx * t, y: a.y + dy * t, heading: Math.atan2(dy, dx) };
}
