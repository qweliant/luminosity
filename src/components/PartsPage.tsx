// Voices · #/parts
//
// Read-only view: groups entries by the recurring inner voice you named them
// with, surfacing the deeper needs in play, how each voice usually feels, and
// the recent Need drafts. No create/edit/delete here by design — voices are
// named while journaling. This page just reads them back as patterns.

import React from 'react';
import type { Mapping, Part } from '../types';

interface PartGroup {
  part: Part;
  entries: Mapping[];
  coreNeeds: string[]; // distinct, in insertion order
}

// Plain "usually …" read from a voice's average how-it's-going rating. Kept
// coarse on purpose — direction, not a score. Null when nothing's rated.
const usuallyLabel = (entries: Mapping[]): string | null => {
  const rated = entries
    .map((e) => e.workability ?? 0)
    .filter((w) => w >= 1 && w <= 5);
  if (rated.length === 0) return null;
  const avg = rated.reduce((s, w) => s + w, 0) / rated.length;
  if (avg < 2.5) return 'usually stuck';
  if (avg < 3.5) return 'often mixed';
  return 'usually working';
};

const Hibiscus = ({
  size = 28,
  petal = '#E07A95',
  opacity = 1,
}: { size?: number; petal?: string; opacity?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={{ opacity }}
    className="inline-block align-middle overflow-visible"
  >
    {Array.from({ length: 5 }).map((_, i) => (
      <path
        key={i}
        d="M50 50 C 28 38, 22 12, 50 4 C 78 12, 72 38, 50 50 Z"
        fill={petal}
        opacity="0.95"
        stroke="#C24E6E"
        strokeOpacity="0.2"
        transform={`rotate(${(i * 360) / 5} 50 50)`}
      />
    ))}
    <circle cx="50" cy="50" r="9" fill="#C24E6E" opacity="0.9" />
    <circle cx="50" cy="50" r="3" fill="#F7D679" />
  </svg>
);

const LumiBean = ({ size = 72 }: { size?: number }) => (
  <svg
    width={size}
    height={size * 1.15}
    viewBox="-10 -15 120 130"
    className="overflow-visible inline-block shrink-0"
  >
    <ellipse cx="50" cy="108" rx="24" ry="3" fill="#3A1E2A" opacity="0.10" />
    <ellipse cx="50" cy="58" rx="32" ry="36" fill="#FFF5DC" stroke="#3A1E2A" strokeWidth="2" />
    <ellipse cx="50" cy="74" rx="20" ry="14" fill="#FFFDF6" opacity="0.7" />
    <g transform="translate(76 22) rotate(18)">
      <Hibiscus size={34} petal="#C24E6E" />
    </g>
    <path d="M82 38 Q90 36 92 28 Q86 30 82 38 Z" fill="#9CD3B6" stroke="#3A1E2A" strokeWidth="1" strokeOpacity="0.4" />
    <ellipse cx="30" cy="66" rx="6.5" ry="4" fill="#E07A95" opacity="0.75" />
    <ellipse cx="70" cy="66" rx="6.5" ry="4" fill="#E07A95" opacity="0.75" />
    <ellipse cx="40" cy="56" rx="3" ry="4" fill="#3A1E2A" />
    <ellipse cx="60" cy="56" rx="3" ry="4" fill="#3A1E2A" />
    <circle cx="41.2" cy="54.5" r="0.9" fill="#fff" />
    <circle cx="61.2" cy="54.5" r="0.9" fill="#fff" />
    <path d="M42 71 Q50 77 58 71" stroke="#3A1E2A" strokeWidth="2" fill="none" strokeLinecap="round" />
    <ellipse cx="38" cy="96" rx="7" ry="3" fill="#3A1E2A" />
    <ellipse cx="62" cy="96" rx="7" ry="3" fill="#3A1E2A" />
  </svg>
);

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

const PartCard = ({
  group,
  large = false,
  onFocus,
}: {
  group: PartGroup;
  large?: boolean;
  onFocus: (id: string) => void;
}) => {
  const { part, entries, coreNeeds } = group;
  const visible = entries.slice(0, large ? 6 : 3);
  const usually = usuallyLabel(entries);
  return (
    <article
      className={`relative overflow-hidden bg-white rounded-2xl border border-[#3A1E2A]/10 border-l-[3px] border-l-[#E07A95] shadow-xs ${
        large ? 'p-6 sm:p-7' : 'p-5'
      }`}
    >
      <div aria-hidden className="absolute -top-2 -right-2 opacity-50 pointer-events-none">
        <Hibiscus size={large ? 44 : 32} petal="#FBD9E0" />
      </div>

      <div className="relative">
        <header className="flex items-baseline gap-3 flex-wrap mb-1.5">
          <h3
            className={`font-serif italic text-[#3A1E2A] tracking-[-0.01em] leading-tight m-0 ${
              large ? 'text-3xl' : 'text-2xl'
            }`}
          >
            {part.name}
          </h3>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C24E6E] font-semibold">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
          {usually && (
            <span className="text-[9px] uppercase tracking-[0.18em] text-[#5A3645] bg-[#FAE6E1]/70 rounded-full px-2 py-0.5 font-semibold">
              {usually}
            </span>
          )}
        </header>

        {coreNeeds.length > 0 && (
          <div className="mb-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#B391A0] font-semibold">
              Tending
            </span>
            {coreNeeds.map((c) => (
              <span
                key={c}
                className="font-serif italic text-sm text-[#C24E6E] bg-[#FBD9E0]/60 rounded-full px-2.5 py-0.5"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {entries.length === 0 ? (
          <p className="text-sm italic text-[#B391A0]">
            Named, but no entries assigned yet.
          </p>
        ) : (
          <ul className="space-y-2.5 m-0 p-0 list-none">
            {visible.map((e) => (
              <li key={e.id} className="pl-3 border-l-[1.5px] border-[#FBD9E0]">
                <button
                  type="button"
                  onClick={() => onFocus(e.id)}
                  className="text-left w-full group cursor-pointer"
                  title={`Open ${e.value || 'this entry'} in Focus mode`}
                >
                  <div className="font-serif text-[15px] text-[#3A1E2A] group-hover:text-[#C24E6E] transition-colors leading-snug">
                    {e.value || <em className="text-[#B391A0]">untitled</em>}
                  </div>
                  {e.need?.trim() && (
                    <p className="m-0 mt-0.5 font-serif italic text-[12.5px] text-[#5A3645] leading-relaxed">
                      {e.need.trim()}
                    </p>
                  )}
                </button>
              </li>
            ))}
            {entries.length > visible.length && (
              <li className="text-[10px] uppercase tracking-[0.2em] text-[#B391A0] pl-3">
                + {entries.length - visible.length} more
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
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
  const mostActive = groups.find((g) => g.entries.length > 0)?.part.name ?? '—';
  const assignedCount = entries.filter((e) => e.partId).length;

  return (
    <main className="relative max-w-4xl mx-auto py-12 px-6 print:py-0 print:px-0 text-[#3A1E2A]">
      <div aria-hidden className="absolute -top-10 -right-8 opacity-40 pointer-events-none print:hidden">
        <Hibiscus size={160} petal="#E07A95" />
      </div>
      <div aria-hidden className="absolute -left-12 top-[40%] opacity-35 pointer-events-none print:hidden">
        <Hibiscus size={120} petal="#FBD9E0" />
      </div>

      <header className="relative mb-8 flex justify-between items-start gap-6 border-b border-[#3A1E2A]/10 pb-5">
        <div className="flex items-start gap-5 min-w-0">
          <LumiBean size={72} />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold mb-2">
              Voices
            </p>
            <h1 className="font-serif italic text-4xl tracking-[-0.01em] leading-[1.05] m-0">
              The voices you've named.
            </h1>
            <p className="font-serif italic text-sm text-[#5A3645] mt-2 max-w-prose leading-relaxed m-0">
              The recurring inner characters showing up across your entries — what tends
              to come up under each, how they usually feel, and the sentences they've written.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs uppercase tracking-[0.2em] text-[#5A3645] hover:text-[#C24E6E] transition-colors print:hidden cursor-pointer shrink-0"
        >
          ← back
        </button>
      </header>

      {hasAnyParts && (
        <div className="relative mb-6 p-5 bg-white rounded-2xl border border-[#3A1E2A]/10 grid grid-cols-2 sm:grid-cols-4 gap-5 shadow-xs">
          {[
            ['voices named', String(parts.length)],
            ['entries linked', String(assignedCount)],
            ['unlinked', String(untagged.length)],
            ['most active', mostActive],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#B391A0] font-semibold">
                {label}
              </div>
              <div className="font-serif text-[22px] text-[#3A1E2A] mt-1 leading-tight truncate">
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasAnyParts ? (
        <section className="relative bg-white rounded-2xl border border-[#3A1E2A]/10 p-8 text-center shadow-xs">
          <p className="font-serif italic text-lg text-[#3A1E2A] leading-snug mb-3 m-0">
            No voices named yet.
          </p>
          <p className="text-sm text-[#5A3645] leading-relaxed max-w-md mx-auto m-0">
            Open any value in Focus mode and look for the <em>recurring voice</em> field
            on the "Deeper need" step. Type a name — "The People Pleaser", "The Inner
            Critic", "The Caretaker" — and it will show up here.
          </p>
        </section>
      ) : (
        <section className="relative grid gap-4">
          {groups[0] && <PartCard group={groups[0]} large onFocus={onFocus} />}
          {groups.length > 1 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {groups.slice(1, 3).map((g) => (
                <PartCard key={g.part.id} group={g} onFocus={onFocus} />
              ))}
            </div>
          )}
          {groups.slice(3).map((g) => (
            <PartCard key={g.part.id} group={g} onFocus={onFocus} />
          ))}
        </section>
      )}

      {untagged.length > 0 && (
        <section className="relative mt-6 p-5 bg-[#FAE6E1]/50 rounded-2xl border border-dashed border-[#3A1E2A]/20">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#5A3645] font-semibold m-0">
              Not yet linked to a voice
            </p>
            <span className="font-mono text-[10px] text-[#B391A0]">
              {untagged.length} {untagged.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <p className="m-0 mb-3 font-serif italic text-[12.5px] text-[#B391A0] leading-relaxed">
            Name a voice in Focus mode if you'd like them to surface here.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {untagged.map((e) => (
              <button
                key={e.id}
                onClick={() => onFocus(e.id)}
                className="font-serif italic text-[13px] text-[#3A1E2A] bg-white border border-dashed border-[#3A1E2A]/20 rounded-full px-3 py-1 hover:border-[#C24E6E] hover:text-[#C24E6E] transition-colors cursor-pointer"
              >
                {e.value || <em className="text-[#B391A0]">untitled</em>} →
              </button>
            ))}
          </div>
        </section>
      )}

      <footer className="relative pt-5 mt-8 border-t border-dashed border-[#3A1E2A]/10 text-center text-xs text-[#B391A0] font-serif italic">
        Read-only · name voices while journaling in Focus mode.
      </footer>
    </main>
  );
};
