import type { Scene } from './scene';
import { placementAt } from './geometry';

export interface RenderCar {
  readonly lane: number;
  readonly s: number; // interpolated longitudinal position (m)
  readonly length: number; // vehicle length (m)
  readonly speedFrac: number; // 0 = stopped, 1 = at desired speed
}

/**
 * Draw the whole scene in CSS pixels. The caller is responsible for the device-pixel-ratio
 * transform on the context, so this function only ever thinks in CSS-pixel coordinates.
 */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: Scene,
  cars: readonly RenderCar[],
): void {
  const geom = scene.geometry;
  const a = geom.a[0];
  const b = geom.b[0];

  const padX = 48;
  const scale = (width - 2 * padX) / scene.laneLength; // px per metre
  const ox = padX;
  const oy = height / 2;
  const sx = (wx: number) => ox + wx * scale;
  const sy = (wy: number) => oy + wy * scale;

  ctx.clearRect(0, 0, width, height);

  // Road surface.
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#171a21';
  ctx.lineWidth = 6 * scale;
  ctx.beginPath();
  ctx.moveTo(sx(a.x), sy(a.y));
  ctx.lineTo(sx(b.x), sy(b.y));
  ctx.stroke();

  // Centre dashes.
  ctx.strokeStyle = 'rgba(148,163,184,0.22)';
  ctx.lineWidth = Math.max(1, 0.18 * scale);
  ctx.setLineDash([14, 16]);
  ctx.beginPath();
  ctx.moveTo(sx(a.x), sy(a.y));
  ctx.lineTo(sx(b.x), sy(b.y));
  ctx.stroke();
  ctx.setLineDash([]);

  // Cars.
  for (const c of cars) {
    const p = placementAt(geom, c.lane, c.s);
    const L = Math.max(6, c.length * scale);
    const W = Math.max(4, 2.2 * scale);
    const color = speedColor(c.speedFrac);
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.rotate(p.heading);
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    roundedRect(ctx, -L / 2, -W / 2, L, W, Math.min(W * 0.4, 5));
    ctx.fill();
    ctx.restore();
  }
}

function speedColor(frac: number): string {
  const f = frac < 0 ? 0 : frac > 1 ? 1 : frac;
  const hue = 8 + 132 * f; // red (stopped) -> green (free flow)
  return `hsl(${hue} 80% 55%)`;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
