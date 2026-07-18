import { Sparkline, type SparkHandle } from './Sparkline';
import { CARD } from './ui';

type SparkRef = React.RefObject<SparkHandle | null>;

export function Telemetry({
  flowSpark,
  speedSpark,
  freeKmh,
}: {
  flowSpark: SparkRef;
  speedSpark: SparkRef;
  freeKmh: number;
}) {
  return (
    <section className={`${CARD} p-4`}>
      <div className="eyebrow mb-4">Live telemetry</div>
      <div className="flex flex-col gap-5">
        <TelemetryRow label="Flow /min" color="var(--accent)">
          <Sparkline ref={flowSpark} color="var(--accent)" width={304} height={44} className="w-full" />
        </TelemetryRow>
        <TelemetryRow label="km/h" color="var(--good)">
          <Sparkline ref={speedSpark} color="var(--good)" max={freeKmh} width={304} height={44} className="w-full" />
        </TelemetryRow>
      </div>
    </section>
  );
}

function TelemetryRow({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="eyebrow">{label}</span>
      </div>
      <div className="h-11">{children}</div>
    </div>
  );
}
