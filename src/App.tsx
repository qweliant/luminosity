import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, FileInput } from 'lucide-react';
import {
  VALUE_LIBRARY,
  VALUE_DETAILS,
  NVC_CATEGORIES,
  CORE_NEEDS,
  CORE_NEEDS_DETAIL,
  seedPersonalValues,
} from './data';
import { deriveNeed, sdtProfile, hasAnyLensData, type SdtProfile } from './derive';

export interface Mapping {
  id: string;
  value: string;
  need: string;
  friction: string;
  workability?: number;
  nvcNeeds?: string[];
  coreNeed?: string;
  designConstraint?: boolean;
  designNote?: string;
  accelerators?: string;
  brakes?: string;
}

const SEED_FLAG = 'values-mapper-seed-v1';

const workabilityColor = (n: number) =>
  n <= 0 ? 'transparent'
  : n <= 2 ? '#dc2626'
  : n === 3 ? '#d97706'
  : '#16a34a';

const App = () => {
  const [entries, setEntries] = useState<Mapping[]>(() => {
    const saved = localStorage.getItem('values-mapper-v2');
    const parsed: Mapping[] = saved ? JSON.parse(saved) : [];
    if (!localStorage.getItem(SEED_FLAG) && parsed.length === 0) {
      localStorage.setItem(SEED_FLAG, '1');
      return seedPersonalValues();
    }
    return parsed;
  });

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importTab, setImportTab] = useState<'paste' | 'library'>('paste');
  const [librarySelected, setLibrarySelected] = useState<Set<string>>(new Set());
  const [openLenses, setOpenLenses] = useState<Record<string, boolean>>({});
  const [matrixView, setMatrixView] = useState(false);

  useEffect(() => {
    localStorage.setItem('values-mapper-v2', JSON.stringify(entries));
  }, [entries]);

  const norm = (s: string) => s.trim().toLowerCase();
  const existingValues = new Set(
    entries.map(e => norm(e.value)).filter(Boolean)
  );
  const duplicateIds = new Set(
    entries
      .filter(e => {
        const k = norm(e.value);
        if (!k) return false;
        return entries.some(other => other.id !== e.id && norm(other.value) === k);
      })
      .map(e => e.id)
  );

  const dedupeAgainstExisting = (incoming: string[]): { added: string[]; skipped: number } => {
    const seen = new Set(existingValues);
    const added: string[] = [];
    let skipped = 0;
    for (const raw of incoming) {
      const k = norm(raw);
      if (!k) continue;
      if (seen.has(k)) {
        skipped++;
        continue;
      }
      seen.add(k);
      added.push(raw.trim());
    }
    return { added, skipped };
  };

  const importPreview = (() => {
    const fromText = importText.split('\n').map(l => l.trim()).filter(Boolean);
    const fromLibrary = Array.from(librarySelected);
    return dedupeAgainstExisting([...fromText, ...fromLibrary]);
  })();

  const handleBulkImport = () => {
    if (importPreview.added.length === 0) {
      setShowImport(false);
      setImportText('');
      setLibrarySelected(new Set());
      return;
    }
    const newEntries: Mapping[] = importPreview.added.map(name => ({
      id: crypto.randomUUID(),
      value: name,
      need: '',
      friction: '',
    }));
    setEntries([...entries, ...newEntries]);
    setImportText('');
    setLibrarySelected(new Set());
    setShowImport(false);
  };

  const toggleLibrary = (name: string) => {
    setLibrarySelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const updateEntry = (id: string, patch: Partial<Mapping>) => {
    setEntries(entries.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  const toggleNvc = (id: string, need: string) => {
    const e = entries.find(x => x.id === id);
    if (!e) return;
    const cur = e.nvcNeeds ?? [];
    updateEntry(id, {
      nvcNeeds: cur.includes(need) ? cur.filter(n => n !== need) : [...cur, need]
    });
  };

  const toggleLens = (id: string) =>
    setOpenLenses(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1a1a1a] selection:bg-orange-100 font-sans">
      <div className="max-w-2xl mx-auto py-20 px-6">

        <header className="mb-16 flex justify-between items-end print:hidden">
          <div>
            <h1 className="text-4xl font-serif italic mb-2">Needs & Values</h1>
            <p className="text-gray-500 font-light">Bridge the gap between what you believe and how you live.</p>
          </div>
          <div className="flex gap-5 border-b border-gray-200 pb-2 items-center">
            <button
              onClick={() => setMatrixView(v => !v)}
              className={`text-[10px] uppercase tracking-[0.25em] hover:text-orange-600 transition-colors ${matrixView ? 'text-orange-600' : 'text-gray-500'}`}
            >
              {matrixView ? 'List' : 'Matrix'}
            </button>
            <button onClick={() => setShowImport(true)} className="hover:text-orange-600 transition-colors"><FileInput size={20}/></button>
            <button onClick={() => window.print()} className="hover:text-orange-600 transition-colors"><Printer size={20}/></button>
          </div>
        </header>

        {showImport && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-white border border-gray-200 p-8 shadow-2xl">
              <div className="flex items-baseline gap-6 mb-6 border-b border-gray-100 pb-3">
                <h2 className="text-xl font-serif">Add values</h2>
                <div className="flex gap-4 text-[10px] uppercase tracking-[0.25em]">
                  <button
                    onClick={() => setImportTab('paste')}
                    className={importTab === 'paste' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}
                  >
                    Paste
                  </button>
                  <button
                    onClick={() => setImportTab('library')}
                    className={importTab === 'library' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}
                  >
                    Library
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {importTab === 'paste' ? (
                  <textarea
                    className="w-full h-64 p-4 border border-gray-100 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-orange-200"
                    placeholder="Integrity&#10;Autonomy&#10;Community..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                ) : (
                  <div className="space-y-8">
                    {VALUE_LIBRARY.map(cat => (
                      <section key={cat.name}>
                        <h3 className="font-serif italic text-lg mb-1">{cat.name}</h3>
                        <p className="text-[11px] text-gray-400 mb-3">{cat.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.values.map(v => {
                            const exists = existingValues.has(norm(v));
                            const sel = librarySelected.has(v);
                            return (
                              <button
                                key={v}
                                onClick={() => !exists && toggleLibrary(v)}
                                disabled={exists}
                                title={exists ? 'Already in your list' : undefined}
                                className={`text-[12px] px-2.5 py-1 border rounded-full transition-colors ${
                                  exists
                                    ? 'border-gray-100 text-gray-300 line-through cursor-not-allowed'
                                    : sel
                                      ? 'border-orange-300 text-orange-700 bg-orange-50'
                                      : 'border-gray-200 text-gray-600 hover:border-orange-200 hover:text-orange-500'
                                }`}
                              >
                                {v}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center gap-4 pt-5 mt-4 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">
                  {importPreview.added.length > 0 && (
                    <>{importPreview.added.length} to add</>
                  )}
                  {importPreview.skipped > 0 && (
                    <span className="text-gray-300">
                      {importPreview.added.length > 0 ? ' · ' : ''}
                      {importPreview.skipped} duplicate{importPreview.skipped === 1 ? '' : 's'} skipped
                    </span>
                  )}
                </span>
                <div className="flex gap-4">
                  <button onClick={() => setShowImport(false)} className="text-gray-400">Cancel</button>
                  <button
                    onClick={handleBulkImport}
                    disabled={importPreview.added.length === 0}
                    className="bg-black text-white px-6 py-2 hover:bg-orange-700 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {matrixView ? (
          <MatrixView
            entries={entries}
            onWorkability={(id, n) => updateEntry(id, { workability: n })}
            onCoreNeed={(id, c) => updateEntry(id, { coreNeed: c })}
          />
        ) : (
          <main className="space-y-20">
            {entries.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-lg">
                <p className="text-gray-400 mb-4">No values mapped yet.</p>
                <button onClick={() => setShowImport(true)} className="text-orange-600 underline">Import your list to begin</button>
              </div>
            )}

            {entries.map((entry) => (
              <EntrySection
                key={entry.id}
                entry={entry}
                isDuplicate={duplicateIds.has(entry.id)}
                lensOpen={!!openLenses[entry.id]}
                onToggleLens={() => toggleLens(entry.id)}
                onChange={(patch) => updateEntry(entry.id, patch)}
                onDelete={() => setEntries(entries.filter(e => e.id !== entry.id))}
                onToggleNvc={(n) => toggleNvc(entry.id, n)}
              />
            ))}

            <button
              onClick={() => setEntries([...entries, { id: crypto.randomUUID(), value: '', need: '', friction: '' }])}
              className="w-full py-12 border-t border-gray-100 text-gray-300 hover:text-orange-300 transition-colors flex justify-center print:hidden"
            >
              <Plus size={32} strokeWidth={1} />
            </button>
          </main>
        )}
      </div>
    </div>
  );
};

interface EntryProps {
  entry: Mapping;
  isDuplicate: boolean;
  lensOpen: boolean;
  onToggleLens: () => void;
  onChange: (patch: Partial<Mapping>) => void;
  onDelete: () => void;
  onToggleNvc: (need: string) => void;
}

const EntrySection = ({ entry, isDuplicate, lensOpen, onToggleLens, onChange, onDelete, onToggleNvc }: EntryProps) => {
  const detail = VALUE_DETAILS[entry.value.toLowerCase().trim()];
  const [draftPreview, setDraftPreview] = useState<string | null>(null);
  const lensReady = hasAnyLensData(entry);
  const sdt = sdtProfile(entry);

  const handleSynthesize = () => {
    const draft = deriveNeed(entry);
    if (!entry.need.trim()) {
      onChange({ need: draft });
      setDraftPreview(null);
    } else {
      setDraftPreview(draft);
    }
  };

  return (
  <section className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700">
    <button
      onClick={onDelete}
      className="absolute -left-12 top-0 text-gray-200 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all print:hidden"
    >
      <Trash2 size={18} />
    </button>

    <div className="grid gap-6">
      <div className={`pb-2 flex items-center gap-4 border-b ${isDuplicate ? 'border-red-300' : 'border-gray-100'}`}>
        <input
          className="flex-1 text-2xl font-serif bg-transparent focus:outline-none placeholder:text-gray-200"
          value={entry.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="Core Value"
        />
        <WorkabilityDots
          value={entry.workability ?? 0}
          onChange={(n) => onChange({ workability: n })}
        />
      </div>
      {isDuplicate && (
        <p className="-mt-4 text-[10px] uppercase tracking-[0.2em] text-red-500 print:hidden">
          Duplicate of another entry — values must be unique.
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold">The Friction</label>
          <textarea
            className="w-full bg-transparent focus:outline-none text-sm text-gray-600 leading-relaxed resize-none"
            value={entry.friction}
            onChange={(e) => onChange({ friction: e.target.value })}
            placeholder="What's currently standing in the way?"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.2em] text-orange-400 font-semibold">The Need</label>
          <textarea
            className="w-full bg-transparent focus:outline-none text-sm text-gray-900 font-medium leading-relaxed resize-none"
            value={entry.need}
            onChange={(e) => onChange({ need: e.target.value })}
            placeholder="What is the non-negotiable requirement?"
            rows={3}
          />
          {entry.nvcNeeds && entry.nvcNeeds.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 pt-1">
              {entry.nvcNeeds.map(n => (
                <span key={n} className="text-[11px] text-orange-700/80 lowercase italic">·{n}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="print:hidden -mt-2">
        <button
          onClick={onToggleLens}
          className="text-[10px] uppercase tracking-[0.25em] text-gray-300 hover:text-orange-500 transition-colors"
        >
          {lensOpen ? '− Hide Lenses' : '+ Apply Lenses'}
        </button>
      </div>

      {lensOpen && (
        <div className="pl-5 border-l border-gray-100 space-y-6 print:hidden">

          {detail && (
            <LensRow label={`On ${entry.value}`}>
              <p className="text-[11px] italic text-gray-400 mb-2">{detail.synonym}</p>
              <p className="text-[12px] text-gray-600 leading-relaxed mb-3">{detail.description}</p>
              <ul className="space-y-1">
                {detail.reflection.map((q, i) => (
                  <li key={i} className="text-[12px] text-gray-700 leading-relaxed">— {q}</li>
                ))}
              </ul>
            </LensRow>
          )}

          <LensRow label="ACT · Workability">
            <p className="text-[11px] text-gray-400 mb-2">How well is your current environment serving this value?</p>
            <WorkabilityDots
              value={entry.workability ?? 0}
              onChange={(n) => onChange({ workability: n })}
              showLabel
            />
          </LensRow>

          <LensRow label="NVC · Universal Needs">
            <p className="text-[11px] text-gray-400 mb-3">Tag what's starving underneath the friction.</p>
            <div className="space-y-1.5">
              {NVC_CATEGORIES.map(cat => (
                <div key={cat.name} className="flex items-baseline gap-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 w-24 shrink-0">{cat.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {cat.needs.map(n => {
                      const sel = entry.nvcNeeds?.includes(n);
                      return (
                        <button
                          key={n}
                          onClick={() => onToggleNvc(n)}
                          className={`text-[11px] px-2 py-0.5 border rounded-full transition-colors ${
                            sel
                              ? 'border-orange-300 text-orange-700 bg-orange-50'
                              : 'border-gray-200 text-gray-500 hover:border-orange-200 hover:text-orange-500'
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </LensRow>

          <LensRow label="Robbins · 6 Core Human Needs">
            <p className="text-[11px] text-gray-400 mb-2">Which fundamental driver does this value serve?</p>
            <div className="flex flex-wrap gap-1">
              {CORE_NEEDS.map(n => {
                const sel = entry.coreNeed === n;
                return (
                  <button
                    key={n}
                    title={CORE_NEEDS_DETAIL[n]}
                    onClick={() => onChange({ coreNeed: sel ? '' : n })}
                    className={`text-[11px] px-2 py-0.5 border rounded-full transition-colors ${
                      sel
                        ? 'border-black text-black'
                        : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            {entry.coreNeed && (
              <p className="text-[11px] italic text-gray-500 mt-2">{CORE_NEEDS_DETAIL[entry.coreNeed]}</p>
            )}
            <SdtFootnote profile={sdt} />
          </LensRow>

          <LensRow label="Stanford · Life Design">
            <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={!!entry.designConstraint}
                onChange={(e) => onChange({ designConstraint: e.target.checked })}
                className="accent-black"
              />
              Treat this as a design constraint to iterate on, not a fixed barrier.
            </label>
            {entry.designConstraint && (
              <input
                className="w-full mt-2 text-[12px] bg-transparent border-b border-gray-100 focus:outline-none focus:border-gray-400 py-1 placeholder:text-gray-300"
                value={entry.designNote ?? ''}
                onChange={(e) => onChange({ designNote: e.target.value })}
                placeholder="Smallest experiment that would test this constraint?"
              />
            )}
          </LensRow>

          <LensRow label="Nagoski · Come As You Are">
            <p className="text-[11px] text-gray-400 mb-2">Which contexts accelerate this value, and which brake it?</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-700/60 mb-1">Accelerators</div>
                <textarea
                  rows={2}
                  className="w-full text-[12px] bg-transparent border-b border-gray-100 focus:outline-none focus:border-gray-400 py-1 placeholder:text-gray-300 resize-none"
                  value={entry.accelerators ?? ''}
                  onChange={(e) => onChange({ accelerators: e.target.value })}
                  placeholder="Conditions that let this thrive…"
                />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-red-600/60 mb-1">Brakes</div>
                <textarea
                  rows={2}
                  className="w-full text-[12px] bg-transparent border-b border-gray-100 focus:outline-none focus:border-gray-400 py-1 placeholder:text-gray-300 resize-none"
                  value={entry.brakes ?? ''}
                  onChange={(e) => onChange({ brakes: e.target.value })}
                  placeholder="What shuts it down…"
                />
              </div>
            </div>
          </LensRow>

          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={handleSynthesize}
              disabled={!lensReady}
              className="text-[10px] uppercase tracking-[0.25em] text-orange-600 hover:text-orange-700 transition-colors disabled:text-gray-200 disabled:cursor-not-allowed"
            >
              ✨ Synthesize Need from lenses
            </button>
            {!lensReady && (
              <p className="text-[10px] text-gray-300 italic mt-1">Set at least one lens above to enable synthesis.</p>
            )}
            {draftPreview && (
              <div className="mt-3 pl-3 border-l-2 border-orange-200">
                <p className="text-[10px] uppercase tracking-[0.2em] text-orange-500 mb-1">Draft</p>
                <p className="text-[12px] text-gray-700 leading-relaxed mb-2">{draftPreview}</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => { onChange({ need: draftPreview }); setDraftPreview(null); }}
                    className="text-[10px] uppercase tracking-[0.25em] text-orange-700 hover:underline"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => {
                      const merged = entry.need ? `${entry.need}\n\n${draftPreview}` : draftPreview;
                      onChange({ need: merged });
                      setDraftPreview(null);
                    }}
                    className="text-[10px] uppercase tracking-[0.25em] text-gray-600 hover:underline"
                  >
                    Append
                  </button>
                  <button
                    onClick={() => setDraftPreview(null)}
                    className="text-[10px] uppercase tracking-[0.25em] text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="hidden print:block text-[11px] text-gray-600 pt-3 mt-2 border-t border-gray-100 space-y-1">
        {entry.workability ? <div>Workability: {entry.workability}/5</div> : null}
        {entry.coreNeed ? <div>Core need: {entry.coreNeed}</div> : null}
        {entry.designConstraint ? (
          <div>Design constraint{entry.designNote ? ` — ${entry.designNote}` : ''}</div>
        ) : null}
        {entry.accelerators ? <div>Accelerators: {entry.accelerators}</div> : null}
        {entry.brakes ? <div>Brakes: {entry.brakes}</div> : null}
      </div>
    </div>
  </section>
  );
};

const LensRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-semibold mb-2">{label}</div>
    {children}
  </div>
);

const SdtFootnote = ({ profile }: { profile: SdtProfile }) => {
  const total = profile.autonomy + profile.competence + profile.relatedness;
  if (total === 0) return null;
  const dot = (n: number) => '●'.repeat(Math.min(n, 3)) + '○'.repeat(Math.max(0, 3 - Math.min(n, 3)));
  return (
    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mt-3">
      SDT · autonomy <span className="text-gray-500">{dot(profile.autonomy)}</span>
      &nbsp;·&nbsp;competence <span className="text-gray-500">{dot(profile.competence)}</span>
      &nbsp;·&nbsp;relatedness <span className="text-gray-500">{dot(profile.relatedness)}</span>
    </p>
  );
};

const WorkabilityDots = ({
  value,
  onChange,
  showLabel = false
}: {
  value: number;
  onChange: (n: number) => void;
  showLabel?: boolean;
}) => (
  <div className="flex gap-1.5 items-center" title={`Workability: ${value || '–'}/5`}>
    {[1, 2, 3, 4, 5].map(n => {
      const filled = n <= value;
      const color = workabilityColor(value);
      return (
        <button
          key={n}
          onClick={() => onChange(value === n ? 0 : n)}
          aria-label={`Workability ${n}`}
          className="w-2.5 h-2.5 rounded-full border transition-all hover:scale-110"
          style={{
            backgroundColor: filled ? color : 'transparent',
            borderColor: filled ? color : '#d1d5db',
          }}
        />
      );
    })}
    {showLabel && (
      <span className="ml-2 text-[10px] uppercase tracking-[0.25em] text-gray-400">
        {value === 0 ? 'unrated' : value <= 2 ? 'stuck' : value === 3 ? 'mixed' : 'working'}
      </span>
    )}
  </div>
);

const MatrixView = ({
  entries,
  onWorkability,
  onCoreNeed,
}: {
  entries: Mapping[];
  onWorkability: (id: string, n: number) => void;
  onCoreNeed: (id: string, core: string) => void;
}) => {
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);
  const buckets: Record<string, Mapping[]> = {};
  CORE_NEEDS.forEach(n => buckets[n] = []);
  buckets['Unmapped'] = [];
  entries.forEach(e => {
    const k = e.coreNeed && CORE_NEEDS.includes(e.coreNeed) ? e.coreNeed : 'Unmapped';
    (buckets[k] ??= []).push(e);
  });

  const stuckFirst = (a: Mapping, b: Mapping) => {
    const aw = a.workability ?? 0;
    const bw = b.workability ?? 0;
    const norm = (n: number) => (n === 0 ? 99 : n);
    return norm(aw) - norm(bw);
  };
  Object.values(buckets).forEach(arr => arr.sort(stuckFirst));

  return (
    <main className="space-y-14">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">
          Alignment Matrix · grouped by Core Human Need
        </p>
        <p className="text-[11px] italic text-gray-400">
          Stuck values appear first within each group — these are your action zones.
        </p>
      </div>
      {entries.length === 0 && (
        <p className="text-gray-400 text-center py-10">Nothing to map yet.</p>
      )}
      {Object.entries(buckets).map(([core, items]) => (
        items.length > 0 && (
          <section key={core} className="break-inside-avoid">
            <h2 className="text-2xl font-serif italic mb-3 flex items-baseline gap-3">
              {core}
              <span className="text-[10px] uppercase tracking-[0.25em] text-gray-300">
                {items.length} {items.length === 1 ? 'value' : 'values'}
              </span>
            </h2>
            <ul className="divide-y divide-gray-100">
              {items.map(e => (
                <li
                  key={e.id}
                  className="py-3 pl-3 border-l-2"
                  style={{ borderColor: e.workability ? workabilityColor(e.workability) : '#f3f4f6' }}
                >
                  <div className="flex items-baseline gap-4">
                    <WorkabilityDots
                      value={e.workability ?? 0}
                      onChange={(n) => onWorkability(e.id, n)}
                    />
                    <div className="flex-1">
                      <div className="font-serif text-lg leading-tight">
                        {e.value || <em className="text-gray-300">untitled</em>}
                      </div>
                      {e.need && (
                        <div className="text-[12px] text-gray-500 leading-relaxed mt-0.5">{e.need}</div>
                      )}
                      {e.nvcNeeds && e.nvcNeeds.length > 0 && (
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                          {e.nvcNeeds.map(n => (
                            <span key={n} className="text-[11px] text-orange-700/70 lowercase italic">·{n}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setPickerOpen(pickerOpen === e.id ? null : e.id)}
                      className={`text-[10px] uppercase tracking-[0.25em] hover:text-orange-600 transition-colors shrink-0 print:hidden ${
                        e.coreNeed ? 'text-gray-500' : 'text-orange-500'
                      }`}
                    >
                      {e.coreNeed ? `${e.coreNeed} ↻` : 'Map →'}
                    </button>
                  </div>
                  {pickerOpen === e.id && (
                    <div className="mt-3 ml-12 flex flex-wrap gap-1 print:hidden">
                      {CORE_NEEDS.map(c => {
                        const sel = e.coreNeed === c;
                        return (
                          <button
                            key={c}
                            onClick={() => { onCoreNeed(e.id, sel ? '' : c); setPickerOpen(null); }}
                            title={CORE_NEEDS_DETAIL[c]}
                            className={`text-[11px] px-2 py-0.5 border rounded-full transition-colors ${
                              sel
                                ? 'border-black text-black bg-gray-50'
                                : 'border-gray-200 text-gray-500 hover:border-gray-400'
                            }`}
                          >
                            {c}
                          </button>
                        );
                      })}
                      {e.coreNeed && (
                        <button
                          onClick={() => { onCoreNeed(e.id, ''); setPickerOpen(null); }}
                          className="text-[11px] px-2 py-0.5 border border-gray-100 text-gray-400 rounded-full hover:text-red-500 hover:border-red-200"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )
      ))}
    </main>
  );
};

export default App;
