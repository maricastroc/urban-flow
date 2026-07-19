import { INTERACTIVE_NETWORKS, SHOWCASE_NETWORK, type NetworkPreset } from '@/render/presets';
import { CARD } from './ui';
import { IconGrid } from './icons';

export function NetworkPresets({
  activeGrid,
  onApply,
}: {
  activeGrid: number;
  onApply: (net: NetworkPreset) => void;
}) {
  const showcaseActive = activeGrid === SHOWCASE_NETWORK.grid;

  return (
    <section className={`${CARD} p-4`}>
      <div className="mb-3 flex items-center gap-2">
        <IconGrid />
        <div className="eyebrow">Network</div>
      </div>

      {/* Interactive tier — pick a size to explore on. */}
      <div className="grid grid-cols-3 gap-2">
        {INTERACTIVE_NETWORKS.map((n) => {
          const active = n.grid === activeGrid;
          return (
            <button
              key={n.id}
              onClick={() => onApply(n)}
              aria-pressed={active}
              className={`rounded-lg border px-2.5 py-2 text-left transition-all duration-150 ${
                active
                  ? 'border-(--accent)/45 bg-(--accent-soft)'
                  : 'border-(--border) bg-(--surface-2) hover:border-(--border-strong) hover:bg-(--surface-3)'
              }`}
            >
              <div className={`text-[12px] font-semibold ${active ? 'text-(--accent-2)' : 'text-(--text-1)'}`}>{n.label}</div>
              <div className="tnum text-[10px] text-(--text-3)">{n.grid}×{n.grid}</div>
              {n.tag === 'recommended' && (
                <div className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-(--good)">Recommended</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Showcase — the full-scale Metro, one prominent click away. */}
      <button
        onClick={() => onApply(SHOWCASE_NETWORK)}
        aria-pressed={showcaseActive}
        className={`mt-2.5 flex w-full items-center gap-3 overflow-hidden rounded-xl border px-3.5 py-3 text-left transition-all duration-150 ${
          showcaseActive
            ? 'border-(--accent) bg-(--accent-soft)'
            : 'border-(--accent)/35 bg-(--accent-soft)/40 hover:border-(--accent) hover:bg-(--accent-soft)/70'
        }`}
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-(--accent)/15 ring-1 ring-(--accent)/40">
          <IconGrid />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="eyebrow text-(--accent-2)">Showcase</span>
            <span className="tnum text-[10px] text-(--text-3)">12×12</span>
          </div>
          <div className="text-[13px] font-semibold text-(--text-1)">Metro — full-scale city</div>
          <div className="tnum text-[10.5px] text-(--text-3)">144 junctions · simulated off the main thread</div>
        </div>
        <span className="shrink-0 text-[16px] font-semibold text-(--accent-2)">{showcaseActive ? '✓' : '→'}</span>
      </button>

      <p className="mt-3 text-[11px] leading-relaxed text-(--text-3)">
        You&apos;re exploring the <strong className="text-(--text-2)">District</strong> — a legible city where
        one change reads clearly. The <strong className="text-(--text-2)">Metro</strong> proves the same engine
        at full scale. Same seed, same engine — only the size changes.
      </p>
    </section>
  );
}
