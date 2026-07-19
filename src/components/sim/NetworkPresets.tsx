import { NETWORKS, type NetworkPreset } from '@/render/presets';
import { CARD } from './ui';
import { IconGrid } from './icons';

function TagPill({ tag }: { tag: NonNullable<NetworkPreset['tag']> }) {
  const showcase = tag === 'showcase';
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
        showcase ? 'bg-(--accent-soft) text-(--accent-2)' : 'bg-(--surface-3) text-(--text-2)'
      }`}
    >
      {showcase ? 'Showcase' : 'Sandbox'}
    </span>
  );
}

export function NetworkPresets({
  activeGrid,
  onApply,
}: {
  activeGrid: number;
  onApply: (net: NetworkPreset) => void;
}) {
  return (
    <section className={`${CARD} p-4`}>
      <div className="mb-3 flex items-center gap-2">
        <IconGrid />
        <div className="eyebrow">Network</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {NETWORKS.map((n) => {
          const active = n.grid === activeGrid;
          return (
            <button
              key={n.id}
              onClick={() => onApply(n)}
              aria-pressed={active}
              className={`rounded-lg border px-3 py-2.5 text-left transition-all duration-150 ${
                active
                  ? 'border-(--accent)/45 bg-(--accent-soft)'
                  : 'border-(--border) bg-(--surface-2) hover:border-(--border-strong) hover:bg-(--surface-3)'
              }`}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className={`text-[12.5px] font-semibold ${active ? 'text-(--accent-2)' : 'text-(--text-1)'}`}>
                  {n.label}
                </span>
                <span className="tnum text-[10px] text-(--text-3)">{n.grid}×{n.grid}</span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-1">
                <span className="tnum text-[10.5px] text-(--text-3)">{n.junctions} junctions</span>
                {n.tag && <TagPill tag={n.tag} />}
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-(--text-3)">
        You start in the <strong className="text-(--text-2)">Metro</strong> — the full city, off the main
        thread. New here? Drop to the <strong className="text-(--text-2)">City block</strong> sandbox to
        learn the tools. Same seed, same engine — only the scale changes.
      </p>
    </section>
  );
}
