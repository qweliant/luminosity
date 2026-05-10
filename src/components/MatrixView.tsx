// 2-axis Alignment Matrix: 6 Core Human Needs (rows) × 5 ACT Workability bands
// (columns). Each populated cell is faintly tinted by workability and renders
// values as clickable chips that route into Focus mode. Two trays catch values
// that don't fit either axis yet.

import React from 'react';
import type { Mapping } from '../types';
import { workabilityColor } from '../types';
import { CORE_NEEDS, CORE_NEEDS_DETAIL } from '../data';

const WORKABILITY_COLS = [1, 2, 3, 4, 5] as const;

const cellTint = (w: number) =>
  w <= 2 ? 'rgba(220, 38, 38, 0.04)'
  : w === 3 ? 'rgba(217, 119, 6, 0.04)'
  : 'rgba(22, 163, 74, 0.04)';

export const MatrixView = ({
  entries,
  onFocus,
}: {
  entries: Mapping[];
  onFocus: (id: string) => void;
}) => {
  type Cell = Mapping[];
  const grid: Record<string, Record<number, Cell>> = {};
  CORE_NEEDS.forEach(c => {
    grid[c] = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  });
  const unmapped: Mapping[] = [];
  const unrated: Mapping[] = [];

  entries.forEach(e => {
    if (!e.coreNeed || !CORE_NEEDS.includes(e.coreNeed)) {
      unmapped.push(e);
      return;
    }
    const w = e.workability ?? 0;
    if (w < 1 || w > 5) {
      unrated.push(e);
      return;
    }
    const row = grid[e.coreNeed];
    if (!row) return;
    (row[w] ??= []).push(e);
  });

  return (
    <main className="space-y-10">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.25em] text-pink-700">
          Alignment Matrix · Core Human Need × ACT Workability
        </p>
        <p className="text-[11px] italic text-pink-700">
          Click any value to open it in Focus mode. Cells in the lower-left are your action zones.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-pink-700 text-center py-10">Nothing to map yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0 print:overflow-visible">
          <table className="w-full min-w-160 table-fixed border-collapse">
            <colgroup>
              <col style={{ width: '7.5rem' }} />
              {WORKABILITY_COLS.map(w => <col key={w} />)}
            </colgroup>
            <thead>
              <tr>
                <th />
                {WORKABILITY_COLS.map(w => (
                  <th key={w} className="text-[10px] uppercase tracking-[0.2em] text-pink-700 font-normal pb-1 text-center">
                    <span style={{ color: workabilityColor(w) }}>●</span>
                    <span className="ml-1.5">{w}</span>
                  </th>
                ))}
              </tr>
              <tr>
                <td />
                <td colSpan={WORKABILITY_COLS.length} className="pb-3">
                  <div className="flex justify-between text-[10px] uppercase tracking-[0.25em] text-pink-700 px-2">
                    <span>← Stuck</span>
                    <span>Mixed</span>
                    <span>Working →</span>
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              {CORE_NEEDS.map(core => {
                const row = grid[core] ?? {};
                const total = WORKABILITY_COLS.reduce((s, w) => s + (row[w]?.length ?? 0), 0);
                return (
                  <tr key={core} className="border-t border-gray-100 break-inside-avoid">
                    <td className="align-top py-3 pr-3">
                      <div className="font-serif text-base leading-tight">{core}</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-pink-700 mt-0.5" title={CORE_NEEDS_DETAIL[core]}>
                        {total} {total === 1 ? 'value' : 'values'}
                      </div>
                    </td>
                    {WORKABILITY_COLS.map(w => {
                      const cellEntries = row[w] ?? [];
                      return (
                        <td
                          key={w}
                          className="align-top py-2 px-1.5 border-l border-gray-100"
                          style={cellEntries.length > 0 ? { backgroundColor: cellTint(w) } : undefined}
                        >
                          <div className="flex flex-wrap gap-1">
                            {cellEntries.map(e => (
                              <button
                                key={e.id}
                                onClick={() => onFocus(e.id)}
                                className="text-[11px] px-2 py-0.5 border border-gray-200 rounded-full bg-white hover:border-sky-300 hover:text-black-600 transition-colors"
                                title={e.need ? `${e.value} — ${e.need}` : `Open ${e.value} in focus mode`}
                              >
                                {e.value}
                              </button>
                            ))}
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
      )}

      {unrated.length > 0 && (
        <section>
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-pink-700 mb-2">Workability not yet rated</h3>
          <div className="flex flex-wrap gap-1.5">
            {unrated.map(e => (
              <button
                key={e.id}
                onClick={() => onFocus(e.id)}
                className="text-[11px] px-2.5 py-1 border border-dashed border-gray-200 rounded-full hover:border-sky-300 hover:text-black-600 transition-colors"
              >
                {e.value || <em className="text-pink-300">untitled</em>}
              </button>
            ))}
          </div>
        </section>
      )}

      {unmapped.length > 0 && (
        <section>
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-pink-700 mb-2">Core Need not yet assigned</h3>
          <div className="flex flex-wrap gap-1.5">
            {unmapped.map(e => (
              <button
                key={e.id}
                onClick={() => onFocus(e.id)}
                className="text-[11px] px-2.5 py-1 border border-dashed border-gray-200 rounded-full hover:border-sky-300 hover:text-black-600 transition-colors"
              >
                {e.value || <em className="text-pink-300">untitled</em>}
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
