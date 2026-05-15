// Part Profiles · #/parts
//
// Read-only IFS view: groups entries by their assigned Part, surfacing the
// Core Needs in play and the most recent Need drafts. No create/edit/delete
// here by design — parts are authored inside Focus mode (step 3, alongside
// Madanes Core Need). This page exists to read them back as identity
// portraits, not to manage them.

import React from 'react';
import type { Mapping, Part } from '../types';

interface PartGroup {
  part: Part;
  entries: Mapping[];
  coreNeeds: string[]; // distinct, in insertion order
}

const groupByPart = (parts: Part[], entries: Mapping[]): {
  groups: PartGroup[];
  untagged: Mapping[];
} => {
  const byId = new Map<string, PartGroup>();
  for (const p of parts) {
    byId.set(p.id, { part: p, entries: [], coreNeeds: [] });
  }
  const untagged: Mapping[] = [];
  for (const e of entries) {
    if (!e.partId) {
      untagged.push(e);
      continue;
    }
    const g = byId.get(e.partId);
    if (!g) {
      // partId references a part that no longer exists — treat as untagged
      // so the entry is still visible. The dangling reference is the user's
      // signal, not a crash.
      untagged.push(e);
      continue;
    }
    g.entries.push(e);
    if (e.coreNeed && !g.coreNeeds.includes(e.coreNeed)) {
      g.coreNeeds.push(e.coreNeed);
    }
  }
  // Stable order: most-used parts first, then alphabetic.
  const groups = Array.from(byId.values()).sort((a, b) => {
    if (b.entries.length !== a.entries.length) {
      return b.entries.length - a.entries.length;
    }
    return a.part.name.localeCompare(b.part.name);
  });
  return { groups, untagged };
};

export const PartsPage = ({
  parts,
  entries,
  onClose,
  onFocus,
}: {
  parts: Part[];
  entries: Mapping[];
  onClose: () => void;
  onFocus: (id: string) => void;
}) => {
  const { groups, untagged } = groupByPart(parts, entries);
  const hasAnyParts = parts.length > 0;

  return (
    <main className="max-w-3xl mx-auto py-12 px-6 print:py-0 print:px-0 text-[#3A1E2A]">
      <header className="mb-10 flex justify-between items-baseline gap-4 border-b border-[#3A1E2A]/10 pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold mb-1">
            Part Profiles
          </p>
          <h1 className="font-serif italic text-4xl tracking-[-0.01em]">
            Who's doing the work?
          </h1>
          <p className="font-serif italic text-sm text-[#5A3645] mt-2 max-w-prose">
            An Internal Family Systems reading of your ledger — the named identities
            you've assigned to entries, the Core Needs they're tending to, and the most
            recent sentences they've written.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xs uppercase tracking-[0.2em] text-[#5A3645] hover:text-[#C24E6E] transition-colors print:hidden cursor-pointer"
        >
          ← back
        </button>
      </header>

      {!hasAnyParts ? (
        <section className="bg-white rounded-[18px] border border-[#3A1E2A]/10 p-8 text-center">
          <p className="font-serif italic text-lg text-[#3A1E2A] leading-snug mb-3">
            No Parts named yet.
          </p>
          <p className="text-sm text-[#5A3645] leading-relaxed max-w-md mx-auto">
            Open any value in Focus mode and look for the <em>Part</em> field at the
            Anchor step. Type a name — "The People Pleaser", "The Inner Critic", "The
            Caretaker" — and it will appear here as a profile.
          </p>
        </section>
      ) : (
        <section className="space-y-6">
          {groups.map(({ part, entries: partEntries, coreNeeds }) => (
            <article
              key={part.id}
              className="pl-5 border-l-2 border-[#FBD9E0]"
            >
              <header className="mb-2 flex items-baseline flex-wrap gap-3">
                <h2 className="font-serif italic text-2xl text-[#3A1E2A] tracking-[-0.01em]">
                  {part.name}
                </h2>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#C24E6E]">
                  {partEntries.length} {partEntries.length === 1 ? 'entry' : 'entries'}
                </span>
              </header>

              {coreNeeds.length > 0 && (
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#B391A0] mb-3">
                  Core needs:{' '}
                  <span className="font-serif normal-case tracking-normal text-sm italic text-[#5A3645]">
                    {coreNeeds.join(', ')}
                  </span>
                </p>
              )}

              {partEntries.length === 0 ? (
                <p className="text-sm italic text-[#B391A0]">
                  Named, but no entries assigned yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {partEntries.slice(0, 5).map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => onFocus(e.id)}
                        className="text-left w-full group cursor-pointer"
                        title={`Open ${e.value || 'this entry'} in Focus mode`}
                      >
                        <div className="font-serif text-base text-[#3A1E2A] group-hover:text-[#C24E6E] transition-colors">
                          {e.value || <em className="text-[#B391A0]">untitled</em>}
                        </div>
                        {e.need?.trim() && (
                          <div className="text-sm text-[#5A3645] leading-snug mt-0.5">
                            {e.need.trim()}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                  {partEntries.length > 5 && (
                    <li className="text-[11px] uppercase tracking-[0.18em] text-[#B391A0]">
                      + {partEntries.length - 5} more
                    </li>
                  )}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}

      {untagged.length > 0 && (
        <section className="mt-12 pt-6 border-t border-[#3A1E2A]/10">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A3645] mb-2">
            Not yet assigned to a Part
          </h3>
          <p className="text-xs text-[#B391A0] leading-relaxed mb-3 max-w-prose">
            Entries without a Part tag. Assign one in Focus mode if you'd like them
            to surface here.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {untagged.map((e) => (
              <button
                key={e.id}
                onClick={() => onFocus(e.id)}
                className="text-[11px] px-2.5 py-1 border border-dashed border-[#3A1E2A]/15 rounded-full hover:border-[#C24E6E] hover:text-[#C24E6E] transition-colors"
              >
                {e.value || <em className="text-[#B391A0]">untitled</em>}
              </button>
            ))}
          </div>
        </section>
      )}

      <footer className="pt-6 mt-12 border-t border-[#3A1E2A]/10 text-center text-xs text-[#B391A0] font-serif italic">
        Read-only · author Parts in Focus mode.
      </footer>
    </main>
  );
};
