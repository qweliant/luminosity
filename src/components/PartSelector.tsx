// IFS Part selector — a tiny combobox that doubles as a create-on-type
// field. Lives inside Focus mode step 3 (Anchor). Constraints:
//   - Single-select: an entry references exactly one Part (or none).
//   - User-named: no curated list — the typed text becomes a Part if it
//     doesn't already exist. Lookups are case-insensitive.
//   - No edit/delete UI here. Clearing the selection just detaches; the
//     Part itself stays in the store, visible on #/parts.

import React, { useMemo, useState } from 'react';
import type { Part } from '../types';

export const PartSelector = ({
  parts,
  selectedId,
  onSelect,
  onClear,
}: {
  parts: Part[];
  selectedId?: string;
  onSelect: (name: string) => void;
  onClear: () => void;
}) => {
  const [draft, setDraft] = useState('');
  const selected = selectedId
    ? parts.find((p) => p.id === selectedId)
    : undefined;

  const matches = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return parts;
    return parts.filter((p) => p.name.toLowerCase().includes(q));
  }, [parts, draft]);

  const exactMatch = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return null;
    return parts.find((p) => p.name.toLowerCase() === q) ?? null;
  }, [parts, draft]);

  const commit = () => {
    const name = draft.trim();
    if (!name) return;
    onSelect(name);
    setDraft('');
  };

  return (
    <div className="space-y-3">
      {selected ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#C24E6E] bg-[#FBD9E0]/30">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold">
              Part
            </span>
            <span className="font-serif italic text-base text-[#3A1E2A]">
              {selected.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] uppercase tracking-[0.18em] text-[#5A3645] hover:text-[#C24E6E] transition-colors cursor-pointer"
          >
            clear
          </button>
        </div>
      ) : (
        <p className="text-xs italic text-[#B391A0]">
          No Part assigned to this entry.
        </p>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          placeholder='Name a Part — e.g. "The Caretaker"'
          className="flex-1 px-3 py-2 text-sm bg-white border border-[#3A1E2A]/10 rounded-lg focus:outline-none focus:border-[#C24E6E] placeholder:text-[#B391A0]/60"
        />
        <button
          type="button"
          onClick={commit}
          disabled={!draft.trim()}
          className="px-3 py-2 text-[10px] uppercase tracking-[0.18em] font-bold rounded-lg border border-[#3A1E2A]/10 text-[#3A1E2A] bg-white hover:border-[#C24E6E] hover:text-[#C24E6E] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {exactMatch ? 'select' : 'create'}
        </button>
      </div>

      {matches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {matches.map((p) => {
            const isSel = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p.name)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                  isSel
                    ? 'border-[#C24E6E] bg-[#FBD9E0]/40 text-[#C24E6E]'
                    : 'border-[#3A1E2A]/15 bg-white text-[#5A3645] hover:border-[#C24E6E] hover:text-[#C24E6E]'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
