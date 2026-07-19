import { IconClose, IconGrid, IconFlask } from './icons';

function Shell({ children, onDismiss }: { children: React.ReactNode; onDismiss: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-3">
      <div
        className="anim-up pointer-events-auto flex max-w-118 items-start gap-3 rounded-xl border border-(--border-strong) bg-(--surface-1)/95 py-2.5 pl-3 pr-2.5 backdrop-blur-md"
        style={{ boxShadow: 'var(--shadow-float)' }}
      >
        {children}
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-(--text-3) transition-colors hover:bg-(--surface-3) hover:text-(--text-1)"
        >
          <IconClose />
        </button>
      </div>
    </div>
  );
}

function Dots({ step }: { step: number }) {
  return (
    <div className="mt-2 flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 rounded-full transition-all duration-300"
          style={{ width: i === step ? 18 : 6, background: i <= step ? 'var(--accent)' : 'var(--border-strong)' }}
        />
      ))}
    </div>
  );
}

export interface WaveResult {
  readonly speedPct: number;
  readonly tripsPct: number;
}

/**
 * A guided demo (§31): rather than explain the controls, it *runs* a high-impact
 * intervention — coordinating a corridor into a green wave — and measures it, so
 * the user learns a real traffic-engineering idea (coordination beats a lone signal)
 * in under a minute.
 */
export function Coach({
  step,
  running,
  waveResult,
  singleSignalSpeedPct,
  onStart,
  onRunAB,
  onEnterMetro,
  onDismiss,
}: {
  step: number;
  running: boolean;
  waveResult: WaveResult | null;
  singleSignalSpeedPct: number;
  onStart: () => void;
  onRunAB: () => void;
  onEnterMetro: () => void;
  onDismiss: () => void;
}) {
  if (step === 0) {
    return (
      <Shell onDismiss={onDismiss}>
        <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-(--accent-soft)">
          <IconGrid />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-tight">Watch one change move the whole city.</div>
          <div className="mt-0.5 text-[12px] leading-snug text-(--text-2)">
            A 60-second demo: coordinate a corridor into a <strong className="text-(--text-1)">green wave</strong>
            {' '}and measure it against the untouched city — no menus to hunt through.
          </div>
          <button
            onClick={onStart}
            className="mt-2 rounded-lg bg-(--accent) px-2.5 py-1 text-[12px] font-semibold text-white transition-all duration-150 hover:brightness-110"
          >
            Show me
          </button>
          <Dots step={0} />
        </div>
      </Shell>
    );
  }

  if (step === 1) {
    return (
      <Shell onDismiss={onDismiss}>
        <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-(--accent-soft)">
          <IconGrid />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-tight">A green wave is staged on the central corridor.</div>
          <div className="mt-0.5 text-[12px] leading-snug text-(--text-2)">
            Every signal along it is timed to travel speed, so a platoon rides a wave of greens. Now measure
            it — same seed, same demand, baseline vs. the coordinated corridor.
          </div>
          <button
            onClick={onRunAB}
            disabled={running}
            className="mt-2 flex items-center gap-1.5 rounded-lg bg-(--accent) px-2.5 py-1 text-[12px] font-semibold text-white transition-all duration-150 hover:brightness-110 disabled:opacity-60"
          >
            <IconFlask />
            {running ? 'Measuring…' : 'Run the A/B'}
          </button>
          <Dots step={1} />
        </div>
      </Shell>
    );
  }

  const wave = waveResult;
  const single = Math.round(singleSignalSpeedPct);
  return (
    <Shell onDismiss={onDismiss}>
      <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-(--good)/15">
        <span className="text-[12px] font-bold text-(--good)">✓</span>
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold leading-tight">Coordination beats a single junction.</div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="tnum rounded-md bg-(--good)/15 px-2 py-1 text-[11px] font-semibold text-(--good)">
            Green wave {wave && wave.speedPct >= 0 ? '+' : ''}{wave ? Math.round(wave.speedPct) : '—'}% speed
          </span>
          <span className="tnum rounded-md bg-(--bad)/12 px-2 py-1 text-[11px] font-semibold text-(--bad)">
            One signal {single >= 0 ? '+' : ''}{single}% speed
          </span>
        </div>
        <div className="mt-1.5 text-[12px] leading-snug text-(--text-2)">
          Same seed, same demand — the only difference is coordination. A lone signal adds stops where there
          was flow; timing the whole corridor lets the platoon glide through
          {wave ? ` (${wave.tripsPct >= 0 ? '+' : ''}${Math.round(wave.tripsPct)}% throughput too)` : ''}.
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={onEnterMetro}
            className="rounded-lg bg-(--accent) px-2.5 py-1 text-[12px] font-semibold text-white transition-all duration-150 hover:brightness-110"
          >
            See it at full scale →
          </button>
          <button
            onClick={onDismiss}
            className="text-[12px] font-medium text-(--text-3) transition-colors hover:text-(--text-1)"
          >
            Explore on my own
          </button>
        </div>
        <Dots step={2} />
      </div>
    </Shell>
  );
}
