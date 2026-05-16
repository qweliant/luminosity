// 2-axis Alignment Matrix: 6 Core Human Needs (rows) × 5 ACT Workability bands
// (columns). Each populated cell is faintly tinted by workability and renders
// values as clickable chips that route into Focus mode. A single tray catches
// values that don't fit either axis yet.
//
// Two layouts, switched on breakpoint:
//   - Desktop (md and up): the full 2D table, so you can scan rows and columns
//     side by side.
//   - Mobile: a horizontal scroll-snap carousel where each card is one
//     Workability band, with the six Core Needs stacked inside. Preserves the
//     mental model without crushing 30 chips into one viewport width.

import React from 'react';
import type { Mapping, Part } from '../types';
import { CORE_NEEDS, CORE_NEEDS_DETAIL } from '../data';
import {
  ifsLayerForBand,
  IFS_LAYER_LABEL,
  IFS_LAYER_GLOSS,
} from '../derive';

const WORKABILITY_COLS = [1, 2, 3, 4, 5] as const;

// Bloom palette — warm tints replace the old red/amber/green percentages.
// Two intensities: a faint fill for populated cells, and a slightly stronger
// fill for the mobile band header (signals "this whole band has values").
const cellTint = (w: number): string =>
  w <= 2 ? 'rgba(251, 217, 224, 0.45)' // pinkSoft
  : w === 3 ? 'rgba(255, 241, 214, 0.55)' // butter cream
  : 'rgba(229, 240, 225, 0.55)'; // sage

const cellTintStrong = (w: number): string =>
  w <= 2 ? 'rgba(251, 217, 224, 0.85)'
  : w === 3 ? 'rgba(255, 241, 214, 0.85)'
  : 'rgba(229, 240, 225, 0.85)';

const bandBorder = (w: number): string =>
  w <= 2 ? '#C24E6E' : w === 3 ? '#D6A24A' : '#5C7F66';

const bandLabel = (w: number): string =>
  w === 1 ? 'Stuck'
  : w === 2 ? 'Mostly stuck'
  : w === 3 ? 'Mixed'
  : w === 4 ? 'Mostly working'
  : 'Working';

// Compact hibiscus mark — single-color flower with no face, used as the
// signifier on every chip. Inherits the band's accent color.
const Hibiscus = ({
  size = 8,
  petal = '#E07A95',
}: { size?: number; petal?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className="inline-block shrink-0 align-middle"
  >
    {Array.from({ length: 5 }).map((_, i) => (
      <path
        key={i}
        d="M50 50 C 28 38, 22 12, 50 4 C 78 12, 72 38, 50 50 Z"
        fill={petal}
        opacity="0.95"
        transform={`rotate(${(i * 360) / 5} 50 50)`}
      />
    ))}
    <circle cx="50" cy="50" r="9" fill="#C24E6E" opacity="0.9" />
    <circle cx="50" cy="50" r="3" fill="#F7D679" />
  </svg>
);

export const MatrixView = ({
  entries,
  parts,
  onFocus,
}: {
  entries: Mapping[];
  parts: Part[];
  onFocus: (id: string) => void;
}) => {
  type Cell = Mapping[];
  const grid: Record<string, Record<number, Cell>> = {};
  CORE_NEEDS.forEach(c => {
    grid[c] = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  });
  const unplaced: Mapping[] = [];

  entries.forEach(e => {
    if (!e.coreNeed || !CORE_NEEDS.includes(e.coreNeed)) {
      unplaced.push(e);
      return;
    }
    const w = e.workability ?? 0;
    if (w < 1 || w > 5) {
      unplaced.push(e);
      return;
    }
    const row = grid[e.coreNeed];
    if (!row) return;
    (row[w] ??= []).push(e);
  });

  // Distribution by band (placed entries only). Drives the horizontal bar
  // at the bottom — gives a sense of where the weight sits without a number.
  const bandTotals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  CORE_NEEDS.forEach(c => {
    WORKABILITY_COLS.forEach(w => {
      bandTotals[w]! += grid[c]?.[w]?.length ?? 0;
    });
  });
  const placedTotal = Object.values(bandTotals).reduce((s, n) => s + n, 0);

  const partNameFor = (e: Mapping): string | null => {
    if (!e.partId) return null;
    return parts.find(p => p.id === e.partId)?.name ?? null;
  };

  const chipTitle = (e: Mapping): string => {
    const partName = partNameFor(e);
    const base = e.need ? `${e.value} — ${e.need}` : `Open ${e.value} in focus mode`;
    return partName ? `${base}\n· ${partName}` : base;
  };

  return (
    <main className="space-y-8 print:space-y-4">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold">
          Alignment Matrix · Core Need × Workability
        </p>
        <p className="font-serif italic text-[13px] text-[#5A3645] leading-snug">
          Click any value to open it in Focus. The lower-left is your action zone.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-[#B391A0] text-center py-10 font-serif italic">
          Nothing to map yet.
        </p>
      ) : (
        <>
          {/* --- Mobile layout: scroll-snap carousel of workability bands ----- */}
          <div className="md:hidden -mx-4 print:hidden">
            <div className="px-4 pb-2 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-[#B391A0]">
              <span>← Stuck</span>
              <span className="flex-1 h-px bg-[#3A1E2A]/10" />
              <span>Working →</span>
            </div>
            <div className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-3 px-4 gap-3 [-webkit-overflow-scrolling:touch]">
              {WORKABILITY_COLS.map(w => {
                const bandTotal = bandTotals[w] ?? 0;
                return (
                  <section
                    key={w}
                    id={`mband-${w}`}
                    className="snap-center shrink-0 w-[88vw] max-w-md rounded-[18px] border border-[#3A1E2A]/10 overflow-hidden bg-white shadow-xs"
                    style={{
                      backgroundColor: bandTotal > 0 ? cellTintStrong(w) : 'white',
                    }}
                  >
                    <header className="flex items-baseline justify-between gap-3 px-4 py-3 border-b border-[#3A1E2A]/10">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span style={{ color: bandBorder(w) }} className="text-base leading-none">●</span>
                        <span className="font-serif text-lg leading-none">{w}</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#5A3645] font-semibold">
                          {bandLabel(w)}
                        </span>
                        {(() => {
                          const layer = ifsLayerForBand(w);
                          return layer ? (
                            <span
                              className="font-serif italic text-[11px] text-[#C24E6E]"
                              title={IFS_LAYER_GLOSS[layer]}
                            >
                              · {IFS_LAYER_LABEL[layer]}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#B391A0] font-semibold">
                        {bandTotal} {bandTotal === 1 ? 'value' : 'values'}
                      </span>
                    </header>
                    <ul className="divide-y divide-[#3A1E2A]/10 m-0 p-0 list-none">
                      {CORE_NEEDS.map(core => {
                        const cellEntries = grid[core]?.[w] ?? [];
                        return (
                          <li key={core} className="px-4 py-3">
                            <div
                              className="text-[10px] uppercase tracking-[0.2em] text-[#5A3645] font-semibold mb-1.5"
                              title={CORE_NEEDS_DETAIL[core]}
                            >
                              {core}
                            </div>
                            {cellEntries.length === 0 ? (
                              <p className="text-[11px] italic text-[#B391A0]/70 m-0">—</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {cellEntries.map(e => {
                                  const partName = partNameFor(e);
                                  return (
                                    <button
                                      key={e.id}
                                      onClick={() => onFocus(e.id)}
                                      className="min-h-[36px] inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 bg-white rounded-full hover:border-[#C24E6E] active:bg-[#FBD9E0]/30 transition-colors cursor-pointer"
                                      style={{ border: `1px solid ${bandBorder(w)}55` }}
                                      title={chipTitle(e)}
                                    >
                                      <Hibiscus size={9} petal={bandBorder(w)} />
                                      <span className="font-serif italic text-[#3A1E2A]">{e.value}</span>
                                      {partName && (
                                        <span className="font-serif italic text-[10px] text-[#B391A0]">
                                          · {partName}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
            <div className="px-4 flex justify-center gap-1.5 pt-1">
              {WORKABILITY_COLS.map(w => (
                <a
                  key={w}
                  href={`#mband-${w}`}
                  className="w-2 h-2 rounded-full border border-[#3A1E2A]/20 hover:bg-[#FBD9E0] transition-colors"
                  aria-label={`Jump to workability ${w}`}
                />
              ))}
            </div>
          </div>

          {/* --- Desktop layout: full 2D table ------------------------------- */}
          <div className="hidden md:block overflow-x-auto print:overflow-visible print:block bg-white rounded-2xl border border-[#3A1E2A]/10 shadow-xs">
            <table className="w-full min-w-160 table-fixed border-collapse">
              <colgroup>
                <col style={{ width: '7.5rem' }} />
                {WORKABILITY_COLS.map(w => <col key={w} />)}
              </colgroup>
              <thead>
                <tr>
                  <th className="pt-4" />
                  {WORKABILITY_COLS.map(w => (
                    <th
                      key={w}
                      className="text-center pt-4 pb-1 font-normal"
                    >
                      <div
                        className="text-[11px] leading-none mb-1"
                        style={{ color: bandBorder(w) }}
                      >
                        ●
                      </div>
                      <div className="font-mono text-[10.5px] text-[#3A1E2A] font-semibold">
                        {w}
                      </div>
                      <div className="font-mono text-[8.5px] text-[#B391A0] tracking-[0.1em] uppercase">
                        {bandLabel(w)}
                      </div>
                    </th>
                  ))}
                </tr>
                <tr>
                  <th />
                  {WORKABILITY_COLS.map(w => {
                    const layer = ifsLayerForBand(w);
                    return (
                      <th key={w} className="pb-3 text-center font-normal">
                        {layer ? (
                          <span
                            className="font-serif italic text-[11px] text-[#C24E6E]"
                            title={IFS_LAYER_GLOSS[layer]}
                          >
                            {IFS_LAYER_LABEL[layer]}
                          </span>
                        ) : null}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {CORE_NEEDS.map(core => {
                  const row = grid[core] ?? {};
                  const total = WORKABILITY_COLS.reduce(
                    (s, w) => s + (row[w]?.length ?? 0),
                    0,
                  );
                  return (
                    <tr key={core} className="break-inside-avoid">
                      <td className="align-top py-3 pl-4 pr-3 border-t border-[#3A1E2A]/10">
                        <div className="font-serif text-base text-[#3A1E2A] leading-tight">
                          {core}
                        </div>
                        <div
                          className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#B391A0] mt-0.5"
                          title={CORE_NEEDS_DETAIL[core]}
                        >
                          {total} {total === 1 ? 'value' : 'values'}
                        </div>
                      </td>
                      {WORKABILITY_COLS.map(w => {
                        const cellEntries = row[w] ?? [];
                        return (
                          <td
                            key={w}
                            className="align-top py-2.5 px-2 border-t border-l border-[#3A1E2A]/10 min-h-14"
                            style={
                              cellEntries.length > 0
                                ? { backgroundColor: cellTint(w) }
                                : undefined
                            }
                          >
                            <div className="flex flex-wrap gap-1.5">
                              {cellEntries.map(e => {
                                const partName = partNameFor(e);
                                return (
                                  <button
                                    key={e.id}
                                    onClick={() => onFocus(e.id)}
                                    className="inline-flex items-center gap-1.5 text-[11.5px] px-2.5 py-0.5 bg-white rounded-full hover:border-[#C24E6E] hover:bg-[#FBD9E0]/30 transition-colors cursor-pointer"
                                    style={{ border: `1px solid ${bandBorder(w)}55` }}
                                    title={chipTitle(e)}
                                  >
                                    <Hibiscus size={8} petal={bandBorder(w)} />
                                    <span className="font-serif italic text-[#3A1E2A]">{e.value}</span>
                                    {partName && (
                                      <span className="font-serif italic text-[10px] text-[#B391A0]">
                                        · {partName}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* --- Distribution bar -------------------------------------------- */}
          {placedTotal > 0 && (
            <div className="px-4 py-3 bg-white rounded-xl border border-[#3A1E2A]/10 flex items-center gap-3 flex-wrap">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#5A3645] font-semibold">
                Distribution
              </span>
              <div className="flex-1 flex gap-0.5 h-2 rounded-full overflow-hidden min-w-50 bg-[#FAE6E1]/50">
                {WORKABILITY_COLS.map(w => {
                  const count = bandTotals[w] ?? 0;
                  if (count === 0) return null;
                  return (
                    <div
                      key={w}
                      className="h-full"
                      style={{
                        flex: count,
                        backgroundColor: bandBorder(w),
                      }}
                      title={`${count} ${bandLabel(w).toLowerCase()}`}
                    />
                  );
                })}
              </div>
              <span className="font-mono text-[9.5px] text-[#B391A0] tracking-wide">
                ← stuck · working →
              </span>
            </div>
          )}
        </>
      )}

      {unplaced.length > 0 && (
        <section className="px-5 py-4 bg-[#FAE6E1]/50 rounded-2xl border border-dashed border-[#3A1E2A]/20">
          <div className="flex items-baseline gap-3 flex-wrap mb-1">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#5A3645] font-semibold m-0">
              Not yet placed
            </h3>
            <span className="font-mono text-[10px] text-[#B391A0]">
              {unplaced.length} {unplaced.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <p className="m-0 mb-3 font-serif italic text-[12px] text-[#B391A0] leading-relaxed">
            Missing Core Need or Workability. Tap to set.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unplaced.map(e => {
              const partName = partNameFor(e);
              return (
                <button
                  key={e.id}
                  onClick={() => onFocus(e.id)}
                  className="inline-flex items-center gap-1.5 font-serif italic text-[12.5px] text-[#3A1E2A] bg-white border border-dashed border-[#3A1E2A]/20 rounded-full px-3 py-1 hover:border-[#C24E6E] hover:text-[#C24E6E] transition-colors cursor-pointer"
                  title={chipTitle(e)}
                >
                  {e.value || <em className="text-[#B391A0]">untitled</em>}
                  {partName && (
                    <span className="text-[10px] text-[#B391A0]">· {partName}</span>
                  )}
                  <span>→</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
};
