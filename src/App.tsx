import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Printer, FileInput } from 'lucide-react';
import {
  VALUE_LIBRARY,
  VALUE_DETAILS,
  NVC_CATEGORIES,
  CORE_NEEDS,
  CORE_NEEDS_DETAIL,
  seedPersonalValues,
} from './data';
import { deriveNeed, sdtProfile, maslowHighest, hasAnyLensData, lensCompletion, type SdtProfile, type LensCompletion } from './derive';
import { useBackup } from './useBackup';
import { relTime, type Snapshot } from './backup';

export type LifeDesignProblemType = 'open' | 'stuck' | 'reality';
export type PrototypeMode = 'talk' | 'do';

export interface LifeDesignLens {
  wayfinding?: {
    engagement?: number; // 1-5, undefined = unrated
    energy?: number;     // 1-5, undefined = unrated
  };
  problemFrame?: LifeDesignProblemType;
  reframeNote?: string;
  acceptanceNote?: string;
  prototype?: {
    mode?: PrototypeMode;
    action?: string;
  };
}

const PROBLEM_FRAME_LEGACY: Record<string, LifeDesignProblemType> = {
  actionable: 'open',
  anchor: 'stuck',
  gravity: 'reality',
};

const PROTOTYPE_MODE_LEGACY: Record<string, PrototypeMode> = {
  interview: 'talk',
  experience: 'do',
};

export interface Mapping {
  id: string;
  value: string;
  need: string;
  friction: string;
  workability?: number;
  nvcNeeds?: string[];
  coreNeed?: string;
  lifeDesign?: LifeDesignLens;
  accelerators?: string;
  brakes?: string;
}

type LegacyPrototype = { type?: string; mode?: PrototypeMode; action?: string };
type LegacyLifeDesign = Omit<LifeDesignLens, 'prototype'> & { prototype?: LegacyPrototype };
type LegacyMapping = Omit<Mapping, 'lifeDesign'> & {
  designConstraint?: boolean;
  designNote?: string;
  lifeDesign?: LegacyLifeDesign;
};

const migrateMapping = (raw: LegacyMapping): Mapping => {
  const ld: LegacyLifeDesign = raw.lifeDesign ?? {};
  const hasLegacyTopLevel = raw.designConstraint !== undefined || raw.designNote !== undefined;
  const legacyFrame = ld.problemFrame && PROBLEM_FRAME_LEGACY[ld.problemFrame as string];
  const legacyMode = ld.prototype?.type && PROTOTYPE_MODE_LEGACY[ld.prototype.type];

  if (!hasLegacyTopLevel && !legacyFrame && !legacyMode && !raw.lifeDesign) {
    return raw as Mapping;
  }

  if (raw.designConstraint && !ld.problemFrame) {
    ld.problemFrame = 'open';
  }
  if (raw.designNote && raw.designNote.trim()) {
    ld.prototype = {
      mode: ld.prototype?.mode ?? 'do',
      action: ld.prototype?.action ?? raw.designNote,
    };
  }
  if (legacyFrame) {
    ld.problemFrame = legacyFrame;
  }
  if (legacyMode && ld.prototype) {
    ld.prototype = { mode: legacyMode, action: ld.prototype.action };
  }

  const { designConstraint: _dc, designNote: _dn, ...rest } = raw;
  const cleanPrototype = ld.prototype
    ? { mode: ld.prototype.mode, action: ld.prototype.action }
    : undefined;
  const cleanLd: LifeDesignLens = { ...ld, prototype: cleanPrototype };
  return { ...rest, lifeDesign: cleanLd };
};

const SEED_FLAG = 'values-mapper-seed-v1';

const workabilityColor = (n: number) =>
  n <= 0 ? 'transparent'
  : n <= 2 ? '#dc2626'
  : n === 3 ? '#d97706'
  : '#16a34a';

const App = () => {
  const [entries, setEntries] = useState<Mapping[]>(() => {
    const saved = localStorage.getItem('values-mapper-v2');
    const parsed: LegacyMapping[] = saved ? JSON.parse(saved) : [];
    const migrated = parsed.map(migrateMapping);
    if (!localStorage.getItem(SEED_FLAG) && migrated.length === 0) {
      localStorage.setItem(SEED_FLAG, '1');
      return seedPersonalValues();
    }
    return migrated;
  });

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importTab, setImportTab] = useState<'paste' | 'library'>('paste');
  const [librarySelected, setLibrarySelected] = useState<Set<string>>(new Set());
  const [openLenses, setOpenLenses] = useState<Record<string, boolean>>({});
  const [matrixView, setMatrixView] = useState(false);
  const [focusEntryId, setFocusEntryId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('values-mapper-v2', JSON.stringify(entries));
  }, [entries]);

  const backup = useBackup(entries);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const restoreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!restoreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (restoreMenuRef.current && !restoreMenuRef.current.contains(e.target as Node)) {
        setRestoreOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [restoreOpen]);

  const handleRestore = async (snap: Snapshot) => {
    const when = relTime(snap.createdAt);
    const ok = window.confirm(
      `Restore snapshot from ${when} (${snap.count} ${snap.count === 1 ? 'value' : 'values'})? ` +
      `This will replace your current entries.`
    );
    if (!ok) return;
    const restored = await backup.restore(snap.id);
    if (restored) {
      setEntries(restored);
      setRestoreOpen(false);
    }
  };

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

  const focusedEntry = focusEntryId ? entries.find(e => e.id === focusEntryId) ?? null : null;

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1a1a1a] selection:bg-sky-100 font-sans">
      {focusedEntry && (
        <FocusOverlay
          entry={focusedEntry}
          onChange={(patch) => updateEntry(focusedEntry.id, patch)}
          onToggleNvc={(n) => toggleNvc(focusedEntry.id, n)}
          onClose={() => setFocusEntryId(null)}
        />
      )}
      <div className={`${matrixView ? 'max-w-4xl' : 'max-w-2xl'} mx-auto py-20 px-6 transition-all`}>

        <header className="mb-12 sm:mb-16 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 print:hidden">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif italic mb-2">Needs & Values</h1>
            <p className="text-pink-500 font-light text-sm sm:text-base">
              Bridge what you believe and how you live
              <span className="block sm:inline sm:before:content-['_·_'] text-pink-700">Value → Friction → Need → Workability</span>
            </p>
          </div>
          <div className="flex gap-5 border-b border-gray-200 pb-2 items-center self-start sm:self-auto flex-wrap">
            <BackupChip
              status={backup.status}
              lastSnapshot={backup.lastSnapshot}
              snapshots={backup.snapshots}
              inFlight={backup.inFlight}
              onSnapshot={backup.snapshotNow}
              onRestore={handleRestore}
              menuOpen={restoreOpen}
              setMenuOpen={setRestoreOpen}
              menuRef={restoreMenuRef}
            />
            <button
              onClick={() => setMatrixView(v => !v)}
              className={`text-[10px] uppercase tracking-[0.25em] hover:text-black-600 transition-colors min-h-10 flex items-center ${matrixView ? 'text-black-600' : 'text-pink-500'}`}
            >
              {matrixView ? 'List' : 'Matrix'}
            </button>
            <button onClick={() => setShowImport(true)} className="hover:text-black-600 transition-colors min-h-10 flex items-center" aria-label="Add values"><FileInput size={20}/></button>
            <button onClick={() => window.print()} className="hover:text-black-600 transition-colors min-h-10 flex items-center" aria-label="Print"><Printer size={20}/></button>
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
                    className={importTab === 'paste' ? 'text-black' : 'text-pink-400 hover:text-pink-600'}
                  >
                    Paste
                  </button>
                  <button
                    onClick={() => setImportTab('library')}
                    className={importTab === 'library' ? 'text-black' : 'text-pink-400 hover:text-pink-600'}
                  >
                    Library
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {importTab === 'paste' ? (
                  <textarea
                    className="w-full h-64 p-4 border border-gray-100 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-sky-200"
                    placeholder="Integrity&#10;Autonomy&#10;Community..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                ) : (
                  <div className="space-y-8">
                    {VALUE_LIBRARY.map(cat => (
                      <section key={cat.name}>
                        <h3 className="font-serif italic text-lg mb-1">{cat.name}</h3>
                        <p className="text-[11px] text-pink-700 mb-3">{cat.description}</p>
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
                                    ? 'border-gray-100 text-pink-300 line-through cursor-not-allowed'
                                    : sel
                                      ? 'border-sky-300 text-black-700 bg-sky-50'
                                      : 'border-gray-200 text-pink-600 hover:border-sky-200 hover:text-black-500'
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
                <span className="text-[11px] text-pink-700">
                  {importPreview.added.length > 0 && (
                    <>{importPreview.added.length} to add</>
                  )}
                  {importPreview.skipped > 0 && (
                    <span className="text-pink-700">
                      {importPreview.added.length > 0 ? ' · ' : ''}
                      {importPreview.skipped} duplicate{importPreview.skipped === 1 ? '' : 's'} skipped
                    </span>
                  )}
                </span>
                <div className="flex gap-4">
                  <button onClick={() => setShowImport(false)} className="text-pink-400 hover:text-pink-600">Cancel</button>
                  <button
                    onClick={handleBulkImport}
                    disabled={importPreview.added.length === 0}
                    className="bg-pink-400 text-white px-6 py-2 hover:bg-sky-700 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
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
            onFocus={(id) => setFocusEntryId(id)}
          />
        ) : (
          <main className="space-y-20">
            {entries.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-lg">
                <p className="text-pink-700 mb-4">No values mapped yet.</p>
                <button onClick={() => setShowImport(true)} className="text-black-600 underline">Import your list to begin</button>
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
                onFocus={() => setFocusEntryId(entry.id)}
              />
            ))}

            <button
              onClick={() => setEntries([...entries, { id: crypto.randomUUID(), value: '', need: '', friction: '' }])}
              className="w-full py-12 border-t border-gray-100 text-pink-300 hover:text-black-400 transition-colors flex justify-center print:hidden"
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
  onFocus: () => void;
}

const EntrySection = ({ entry, isDuplicate, lensOpen, onToggleLens, onChange, onDelete, onToggleNvc, onFocus }: EntryProps) => {
  const detail = VALUE_DETAILS[entry.value.toLowerCase().trim()];
  const [draftPreview, setDraftPreview] = useState<string | null>(null);
  const lensReady = hasAnyLensData(entry);
  const sdt = sdtProfile(entry);
  const maslow = maslowHighest(entry);
  const completion = lensCompletion(entry);

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
      className="absolute -left-12 top-0 text-pink-200 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all print:hidden"
    >
      <Trash2 size={18} />
    </button>

    <div className="grid gap-6">
      <div className={`pb-2 flex items-center gap-4 border-b ${isDuplicate ? 'border-red-300' : 'border-gray-100'}`}>
        <input
          className="flex-1 text-2xl font-serif bg-transparent focus:outline-none placeholder:text-pink-200"
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
          <label className="text-[10px] uppercase tracking-[0.2em] text-pink-700 font-semibold">The Friction</label>
          <textarea
            className="w-full bg-transparent focus:outline-none text-sm text-pink-600 leading-relaxed resize-none"
            value={entry.friction}
            onChange={(e) => onChange({ friction: e.target.value })}
            placeholder="What's currently standing in the way?"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.2em] text-black-400 font-semibold">The Need</label>
          <textarea
            className="w-full bg-transparent focus:outline-none text-sm text-pink-900 font-medium leading-relaxed resize-none"
            value={entry.need}
            onChange={(e) => onChange({ need: e.target.value })}
            placeholder="What is the non-negotiable requirement?"
            rows={3}
          />
          {entry.nvcNeeds && entry.nvcNeeds.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 pt-1">
              {entry.nvcNeeds.map(n => (
                <span key={n} className="text-[11px] text-black-700/80 lowercase italic">·{n}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="print:hidden -mt-2 flex items-center gap-4 flex-wrap">
        <button
          onClick={onToggleLens}
          className="text-[10px] uppercase tracking-[0.25em] text-pink-700 hover:text-black-500 transition-colors"
        >
          {lensOpen ? '− Hide Lenses' : '+ Apply Lenses'}
        </button>
        <CompletionBar completion={completion} />
        <button
          onClick={onFocus}
          className="text-[10px] uppercase tracking-[0.25em] text-pink-700 hover:text-black-500 transition-colors ml-auto"
          title="Open this value in focus mode"
        >
          Focus →
        </button>
      </div>

      {lensOpen && (
        <div className="pl-5 border-l border-gray-100 space-y-6 print:hidden">

          {detail && (
            <LensRow label={`On ${entry.value}`}>
              <p className="text-[11px] italic text-pink-700 mb-2">{detail.synonym}</p>
              <p className="text-[12px] text-pink-600 leading-relaxed mb-3">{detail.description}</p>
              <ul className="space-y-1">
                {detail.reflection.map((q, i) => (
                  <li key={i} className="text-[12px] text-pink-700 leading-relaxed">— {q}</li>
                ))}
              </ul>
            </LensRow>
          )}

          <LensRow label="1 · Diagnose · ACT Workability">
            <p className="text-[11px] text-pink-700 mb-2">How well is your current environment serving this value?</p>
            <WorkabilityDots
              value={entry.workability ?? 0}
              onChange={(n) => onChange({ workability: n })}
              showLabel
            />
          </LensRow>

          <LensRow label="2 · Locate · NVC Universal Needs">
            <p className="text-[11px] text-pink-700 mb-3">Tag what's starving underneath the friction.</p>
            <div className="space-y-3 sm:space-y-1.5">
              {NVC_CATEGORIES.map(cat => (
                <div key={cat.name} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-pink-700 sm:w-24 sm:shrink-0 mb-1 sm:mb-0">{cat.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {cat.needs.map(n => {
                      const sel = entry.nvcNeeds?.includes(n);
                      return (
                        <button
                          key={n}
                          onClick={() => onToggleNvc(n)}
                          className={`text-[11px] px-2.5 py-1 border rounded-full transition-colors ${
                            sel
                              ? 'border-sky-300 text-black-700 bg-sky-50'
                              : 'border-gray-200 text-pink-500 hover:border-sky-200 hover:text-black-500'
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

          <LensRow label="3 · Anchor · Robbins 6 Core Human Needs">
            <p className="text-[11px] text-pink-700 mb-2">Which fundamental driver does this value serve?</p>
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
                        : 'border-gray-200 text-pink-500 hover:border-gray-400'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            {entry.coreNeed && (
              <p className="text-[11px] italic text-pink-500 mt-2">{CORE_NEEDS_DETAIL[entry.coreNeed]}</p>
            )}
            <SdtFootnote profile={sdt} />
            {maslow && (
              <p className="text-[10px] uppercase tracking-[0.2em] text-pink-700 mt-1">
                Maslow · highest active layer: <span className="text-pink-500">{maslow}</span>
              </p>
            )}
          </LensRow>

          <LensRow label="4 · Reframe · Stanford Life Design">
            <LifeDesignSection
              ld={entry.lifeDesign}
              onChange={(next) => onChange({ lifeDesign: next })}
              variant="compact"
            />
          </LensRow>

          <LensRow label="5 · Contextualize · Nagoski Come As You Are">
            <p className="text-[11px] text-pink-700 mb-2">Which contexts accelerate this value, and which brake it?</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-700/60 mb-1">Accelerators</div>
                <textarea
                  rows={2}
                  className="w-full text-[12px] bg-transparent border-b border-gray-100 focus:outline-none focus:border-gray-400 py-1 placeholder:text-pink-300 resize-none"
                  value={entry.accelerators ?? ''}
                  onChange={(e) => onChange({ accelerators: e.target.value })}
                  placeholder="Conditions that let this thrive…"
                />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-red-600/60 mb-1">Brakes</div>
                <textarea
                  rows={2}
                  className="w-full text-[12px] bg-transparent border-b border-gray-100 focus:outline-none focus:border-gray-400 py-1 placeholder:text-pink-300 resize-none"
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
              className="text-[10px] uppercase tracking-[0.25em] text-black-600 hover:text-black-700 transition-colors disabled:text-pink-200 disabled:cursor-not-allowed"
            >
              6 · Synthesize · ✨ Compose Need from lenses
            </button>
            {!lensReady && (
              <p className="text-[10px] text-pink-700 italic mt-1">Set at least one lens above to enable synthesis.</p>
            )}
            {draftPreview && (
              <div className="mt-3 pl-3 border-l-2 border-sky-200">
                <p className="text-[10px] uppercase tracking-[0.2em] text-black-500 mb-1">Draft</p>
                <p className="text-[12px] text-pink-700 leading-relaxed mb-2">{draftPreview}</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => { onChange({ need: draftPreview }); setDraftPreview(null); }}
                    className="text-[10px] uppercase tracking-[0.25em] text-black-700 hover:underline"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => {
                      const merged = entry.need ? `${entry.need}\n\n${draftPreview}` : draftPreview;
                      onChange({ need: merged });
                      setDraftPreview(null);
                    }}
                    className="text-[10px] uppercase tracking-[0.25em] text-pink-600 hover:underline"
                  >
                    Append
                  </button>
                  <button
                    onClick={() => setDraftPreview(null)}
                    className="text-[10px] uppercase tracking-[0.25em] text-pink-700 hover:text-pink-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="hidden print:block text-[11px] text-pink-600 pt-3 mt-2 border-t border-gray-100 space-y-1">
        {entry.workability ? <div>Workability: {entry.workability}/5</div> : null}
        {entry.coreNeed ? <div>Core need: {entry.coreNeed}</div> : null}
        {entry.lifeDesign?.wayfinding?.engagement || entry.lifeDesign?.wayfinding?.energy ? (
          <div>
            Wayfinding ·
            {entry.lifeDesign.wayfinding?.engagement ? ` engagement ${entry.lifeDesign.wayfinding.engagement}/5` : ''}
            {entry.lifeDesign.wayfinding?.engagement && entry.lifeDesign.wayfinding?.energy ? ' ·' : ''}
            {entry.lifeDesign.wayfinding?.energy ? ` energy ${entry.lifeDesign.wayfinding.energy}/5` : ''}
          </div>
        ) : null}
        {entry.lifeDesign?.problemFrame ? <div>Problem type: {entry.lifeDesign.problemFrame}</div> : null}
        {entry.lifeDesign?.problemFrame !== 'reality' && entry.lifeDesign?.reframeNote?.trim() ? (
          <div>Reframe: {entry.lifeDesign.reframeNote}</div>
        ) : null}
        {entry.lifeDesign?.problemFrame === 'reality' && entry.lifeDesign?.acceptanceNote?.trim() ? (
          <div>Acceptance: {entry.lifeDesign.acceptanceNote}</div>
        ) : null}
        {entry.lifeDesign?.problemFrame !== 'reality' && entry.lifeDesign?.prototype?.action?.trim() ? (
          <div>
            Prototype ({entry.lifeDesign.prototype.mode ?? 'do'}): {entry.lifeDesign.prototype.action}
          </div>
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
    <div className="text-[10px] uppercase tracking-[0.25em] text-pink-700 font-semibold mb-2">{label}</div>
    {children}
  </div>
);

const FOCUS_STEPS = ['Diagnose', 'Locate', 'Anchor', 'Reframe', 'Contextualize', 'Synthesize'];
const FOCUS_PROMPTS = [
  'How well is your current environment serving this value, and what is in the way?',
  "What's starving underneath the friction? Tag what's missing.",
  'Which fundamental driver does this value serve?',
  'Where does this value live in your engagement and energy? Frame the problem and design a prototype.',
  'Which contexts accelerate this value, and which brake it?',
  'Compose all of the above into a single Need sentence.',
];

const FocusOverlay = ({
  entry,
  onChange,
  onToggleNvc,
  onClose,
}: {
  entry: Mapping;
  onChange: (patch: Partial<Mapping>) => void;
  onToggleNvc: (n: string) => void;
  onClose: () => void;
}) => {
  const [step, setStep] = useState(1);
  const total = FOCUS_STEPS.length;
  const completion = lensCompletion(entry);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inField = t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && !inField) setStep(s => Math.min(total, s + 1));
      else if (e.key === 'ArrowLeft' && !inField) setStep(s => Math.max(1, s - 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, total]);

  return (
    <div className="fixed inset-0 bg-[#FDFCFB] z-50 overflow-y-auto print:hidden animate-in fade-in duration-300">
      <div className="max-w-2xl mx-auto py-10 sm:py-16 px-6 min-h-screen flex flex-col">

        <header className="flex justify-between items-start mb-10 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-pink-700 mb-1">Focus mode</p>
            <h2 className="text-3xl sm:text-4xl font-serif italic leading-tight">
              {entry.value || <em className="text-pink-300">untitled</em>}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-pink-400 hover:text-pink-800 text-3xl leading-none -mt-2 shrink-0"
            title="Close (Esc)"
            aria-label="Close focus mode"
          >
            ×
          </button>
        </header>

        <div className="mb-10">
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-[10px] uppercase tracking-[0.25em] text-pink-500">
              Step {step} of {total} · {FOCUS_STEPS[step - 1]}
            </p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-pink-700">
              {completion.filled}/{completion.total} lenses set
            </p>
          </div>
          <div className="flex gap-1">
            {FOCUS_STEPS.map((name, i) => {
              const reached = i + 1 <= step;
              const stepFilled = completion.steps[i];
              return (
                <button
                  key={name}
                  onClick={() => setStep(i + 1)}
                  className={`flex-1 h-1 transition-colors ${
                    reached ? (stepFilled ? 'bg-sky-500' : 'bg-sky-300') : (stepFilled ? 'bg-sky-200' : 'bg-gray-200')
                  } hover:opacity-80`}
                  title={name}
                  aria-label={`Go to step ${i + 1}: ${name}`}
                />
              );
            })}
          </div>
        </div>

        <p className="text-[15px] text-pink-600 leading-relaxed mb-10 italic font-serif">
          {FOCUS_PROMPTS[step - 1]}
        </p>

        <div className="flex-1">
          <FocusStep
            step={step}
            entry={entry}
            onChange={onChange}
            onToggleNvc={onToggleNvc}
          />
        </div>

        <footer className="flex justify-between items-center pt-10 mt-10 border-t border-gray-100 gap-4">
          <button
            onClick={() => setStep(s => Math.min(total, s + 1))}
            className="text-[10px] uppercase tracking-[0.25em] text-pink-400 hover:text-pink-600"
            disabled={step === total}
          >
            Skip
          </button>
          <div className="flex gap-3 sm:gap-6 items-center">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="text-[10px] uppercase tracking-[0.25em] text-pink-500 hover:text-pink-700 disabled:text-pink-200 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            {step < total ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="bg-pink-400 text-white text-[10px] uppercase tracking-[0.25em] px-6 py-3 hover:bg-sky-700 transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="bg-pink-400 text-white text-[10px] uppercase tracking-[0.25em] px-6 py-3 hover:bg-sky-700 transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

const FocusStep = ({
  step,
  entry,
  onChange,
  onToggleNvc,
}: {
  step: number;
  entry: Mapping;
  onChange: (patch: Partial<Mapping>) => void;
  onToggleNvc: (n: string) => void;
}) => {
  if (step === 1) {
    return (
      <div className="space-y-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-pink-700 mb-3">Workability</p>
          <div className="flex gap-3 items-center">
            {[1, 2, 3, 4, 5].map(n => {
              const filled = n <= (entry.workability ?? 0);
              const color = workabilityColor(entry.workability ?? 0);
              return (
                <button
                  key={n}
                  onClick={() => onChange({ workability: entry.workability === n ? 0 : n })}
                  className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: filled ? color : 'transparent',
                    borderColor: filled ? color : '#d1d5db',
                  }}
                  aria-label={`Workability ${n}`}
                />
              );
            })}
            <span className="ml-3 text-[11px] uppercase tracking-[0.25em] text-pink-700">
              {entry.workability ? (entry.workability <= 2 ? 'stuck' : entry.workability === 3 ? 'mixed' : 'working') : 'unrated'}
            </span>
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-pink-700 mb-2">The Friction</p>
          <textarea
            autoFocus
            rows={4}
            className="w-full bg-transparent border-b border-gray-200 focus:outline-none focus:border-gray-500 text-base text-pink-700 leading-relaxed resize-none placeholder:text-pink-300 py-2"
            value={entry.friction}
            onChange={(e) => onChange({ friction: e.target.value })}
            placeholder="What's currently standing in the way?"
          />
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        {NVC_CATEGORIES.map(cat => (
          <div key={cat.name} className="flex items-baseline gap-3 flex-wrap sm:flex-nowrap">
            <div className="text-[10px] uppercase tracking-[0.2em] text-pink-700 w-full sm:w-24 sm:shrink-0">{cat.name}</div>
            <div className="flex flex-wrap gap-1.5">
              {cat.needs.map(n => {
                const sel = entry.nvcNeeds?.includes(n);
                return (
                  <button
                    key={n}
                    onClick={() => onToggleNvc(n)}
                    className={`text-[12px] px-3 py-1 border rounded-full transition-colors ${
                      sel
                        ? 'border-sky-300 text-black-700 bg-sky-50'
                        : 'border-gray-200 text-pink-600 hover:border-sky-200 hover:text-black-500'
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
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-3">
        {CORE_NEEDS.map(n => {
          const sel = entry.coreNeed === n;
          return (
            <button
              key={n}
              onClick={() => onChange({ coreNeed: sel ? '' : n })}
              className={`w-full text-left p-4 border transition-colors ${
                sel ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className={`text-base font-serif ${sel ? 'text-black' : 'text-pink-700'}`}>{n}</div>
              <div className="text-[12px] text-pink-500 mt-0.5">{CORE_NEEDS_DETAIL[n]}</div>
            </button>
          );
        })}
      </div>
    );
  }

  if (step === 4) {
    return (
      <LifeDesignSection
        ld={entry.lifeDesign}
        onChange={(next) => onChange({ lifeDesign: next })}
        variant="focus"
      />
    );
  }

  if (step === 5) {
    return (
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-700/70 mb-2">Accelerators</p>
          <textarea
            autoFocus
            rows={5}
            className="w-full text-[14px] bg-transparent border-b border-gray-200 focus:outline-none focus:border-gray-500 py-2 resize-none placeholder:text-pink-300"
            value={entry.accelerators ?? ''}
            onChange={(e) => onChange({ accelerators: e.target.value })}
            placeholder="Conditions that let this thrive…"
          />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-red-600/70 mb-2">Brakes</p>
          <textarea
            rows={5}
            className="w-full text-[14px] bg-transparent border-b border-gray-200 focus:outline-none focus:border-gray-500 py-2 resize-none placeholder:text-pink-300"
            value={entry.brakes ?? ''}
            onChange={(e) => onChange({ brakes: e.target.value })}
            placeholder="What shuts it down…"
          />
        </div>
      </div>
    );
  }

  // step === 6 — Synthesize
  const draft = deriveNeed(entry);
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-black-500 mb-2">Templated draft</p>
        <p className="text-[14px] text-pink-700 leading-relaxed italic font-serif border-l-2 border-sky-200 pl-4">
          {draft}
        </p>
        <div className="flex gap-4 mt-3">
          <button
            onClick={() => onChange({ need: draft })}
            className="text-[10px] uppercase tracking-[0.25em] text-black-700 hover:underline"
          >
            Use draft
          </button>
          <button
            onClick={() => {
              const merged = entry.need ? `${entry.need}\n\n${draft}` : draft;
              onChange({ need: merged });
            }}
            className="text-[10px] uppercase tracking-[0.25em] text-pink-600 hover:underline"
          >
            Append to mine
          </button>
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-pink-700 mb-2">Your Need</p>
        <textarea
          rows={6}
          className="w-full text-[14px] bg-transparent border-b border-gray-200 focus:outline-none focus:border-gray-500 py-2 leading-relaxed resize-none placeholder:text-pink-300 font-medium text-pink-900"
          value={entry.need}
          onChange={(e) => onChange({ need: e.target.value })}
          placeholder="The non-negotiable requirement, in your own words."
        />
      </div>
    </div>
  );
};

const BackupChip = ({
  status,
  lastSnapshot,
  snapshots,
  inFlight,
  onSnapshot,
  onRestore,
  menuOpen,
  setMenuOpen,
  menuRef,
}: {
  status: 'unknown' | 'online' | 'offline';
  lastSnapshot: Snapshot | null;
  snapshots: Snapshot[];
  inFlight: boolean;
  onSnapshot: () => Promise<void>;
  onRestore: (snap: Snapshot) => Promise<void>;
  menuOpen: boolean;
  setMenuOpen: (b: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const [, force] = useState(0);
  // Re-render every 30s so "2m ago" stays roughly fresh
  useEffect(() => {
    const iv = setInterval(() => force(n => n + 1), 30_000);
    return () => clearInterval(iv);
  }, []);

  const dotColor =
    inFlight ? '#d97706'
    : status === 'offline' ? '#9ca3af'
    : status === 'online' && lastSnapshot ? '#16a34a'
    : status === 'online' ? '#d97706'
    : '#d1d5db';

  const label =
    inFlight ? 'Backing up…'
    : status === 'offline' ? 'Backup offline'
    : status === 'unknown' ? 'Backup checking…'
    : lastSnapshot ? `Backed up · ${relTime(lastSnapshot.createdAt)}`
    : 'Backup ready';

  const disabled = status !== 'online' || inFlight;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="text-[10px] uppercase tracking-[0.25em] hover:text-black transition-colors min-h-10 flex items-center gap-2 text-pink-500"
        title={status === 'offline' ? 'Run `bun run server` to enable backups' : 'Backup menu'}
      >
        <span className="block w-1.5 h-1.5 rounded-full transition-colors" style={{ backgroundColor: dotColor }} />
        <span>{label}</span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 shadow-xl z-40 p-3 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Backup</span>
            <button
              type="button"
              onClick={async () => { await onSnapshot(); }}
              disabled={disabled}
              className="text-[10px] uppercase tracking-[0.25em] text-orange-700 hover:underline disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed"
            >
              {inFlight ? 'Saving…' : '↻ Snapshot now'}
            </button>
          </div>

          {status === 'offline' && (
            <p className="text-[11px] italic text-gray-500 leading-relaxed">
              Server unreachable. Run <code className="text-gray-700 not-italic">bun run server</code> to enable.
            </p>
          )}

          {status === 'online' && (
            <>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Recent snapshots</p>
              {snapshots.length === 0 ? (
                <p className="text-[11px] italic text-gray-400">No snapshots yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {snapshots.map(s => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => onRestore(s)}
                        className="w-full text-left flex items-baseline justify-between py-2 px-1 hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-serif text-[13px] text-gray-700">{relTime(s.createdAt)}</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                          {s.count} {s.count === 1 ? 'value' : 'values'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[10px] italic text-gray-400 leading-relaxed pt-1 border-t border-gray-100">
                Click a snapshot to restore. Auto-snapshot runs 5s after the last edit.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const CompletionBar = ({ completion }: { completion: LensCompletion }) => {
  const allDone = completion.filled === completion.total;
  return (
    <div className="flex items-center gap-2" title={`${completion.filled} of ${completion.total} lenses applied`}>
      <div className="flex gap-0.5">
        {completion.steps.map((on, i) => (
          <span
            key={i}
            className={`block w-2 h-0.5 transition-colors ${on ? (allDone ? 'bg-emerald-500' : 'bg-sky-400') : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <span className={`text-[10px] uppercase tracking-[0.2em] ${allDone ? 'text-emerald-600' : 'text-pink-700'}`}>
        {allDone ? 'complete' : `${completion.filled}/${completion.total}`}
      </span>
    </div>
  );
};

const SdtFootnote = ({ profile }: { profile: SdtProfile }) => {
  const total = profile.autonomy + profile.competence + profile.relatedness;
  if (total === 0) return null;
  const dot = (n: number) => '●'.repeat(Math.min(n, 3)) + '○'.repeat(Math.max(0, 3 - Math.min(n, 3)));
  return (
    <p className="text-[10px] uppercase tracking-[0.2em] text-pink-700 mt-3">
      SDT · autonomy <span className="text-pink-500">{dot(profile.autonomy)}</span>
      &nbsp;·&nbsp;competence <span className="text-pink-500">{dot(profile.competence)}</span>
      &nbsp;·&nbsp;relatedness <span className="text-pink-500">{dot(profile.relatedness)}</span>
    </p>
  );
};

const DotString = ({
  value,
  onChange,
  ariaLabel,
}: {
  value: number | undefined;
  onChange: (n: number) => void;
  ariaLabel: string;
}) => (
  <div className="flex items-center" role="radiogroup" aria-label={ariaLabel}>
    {[1, 2, 3, 4, 5].map(n => {
      const sel = value === n;
      return (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={sel}
          aria-label={`${ariaLabel} level ${n}`}
          onClick={() => onChange(value === n ? 0 : n)}
          className="flex items-center justify-center w-6 h-6 group/dot"
        >
          <span
            className={`block rounded-full transition-all ${
              sel ? 'w-2 h-2 bg-pink-400' : 'w-1 h-1 bg-gray-300 group-hover/dot:bg-sky-400'
            }`}
          />
        </button>
      );
    })}
  </div>
);

const LIFE_DESIGN_FRAME_HINTS: Record<LifeDesignProblemType, string> = {
  open: 'A real problem you can prototype against.',
  stuck: 'Sticky and recurring — needs a reframe before it can be prototyped.',
  reality: 'A fact of life to accept and navigate around, not solve.',
};

const LifeDesignSection = ({
  ld,
  onChange,
  variant = 'compact',
}: {
  ld: LifeDesignLens | undefined;
  onChange: (next: LifeDesignLens) => void;
  variant?: 'compact' | 'focus';
}) => {
  const current: LifeDesignLens = ld ?? {};
  const isFocus = variant === 'focus';
  const energy = current.wayfinding?.energy ?? 0;
  const engagement = current.wayfinding?.engagement ?? 0;
  const frame = current.problemFrame;
  const isReality = frame === 'reality';
  const isStuck = frame === 'stuck';
  const isOpen = frame === 'open';
  const reframeText = current.reframeNote?.trim() ?? '';
  const prototypeLocked = isStuck && reframeText.length === 0;

  const setEngagement = (n: number) =>
    onChange({ ...current, wayfinding: { ...(current.wayfinding ?? {}), engagement: n || undefined } });
  const setEnergy = (n: number) =>
    onChange({ ...current, wayfinding: { ...(current.wayfinding ?? {}), energy: n || undefined } });
  const setFrame = (p: LifeDesignProblemType | undefined) =>
    onChange({ ...current, problemFrame: p });
  const setReframe = (s: string) => onChange({ ...current, reframeNote: s });
  const setAcceptance = (s: string) => onChange({ ...current, acceptanceNote: s });
  const setPrototypeMode = (m: PrototypeMode) =>
    onChange({
      ...current,
      prototype: { mode: m, action: current.prototype?.action ?? '' },
    });
  const setPrototypeAction = (s: string) =>
    onChange({
      ...current,
      prototype: { mode: current.prototype?.mode, action: s },
    });

  const labelSize = isFocus ? 'text-[14px]' : 'text-[13px]';
  const valueSize = isFocus ? 'text-[14px]' : 'text-[12px]';

  return (
    <div className="border-l-[0.5px] border-gray-300 pl-4 space-y-5">

      {/* Wayfinding (always visible) */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.25em] text-pink-700">Wayfinding · Good Time Journal</p>
        <div className="flex items-center justify-between gap-3">
          <span className={`font-serif ${labelSize} text-pink-700`}>Engagement</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-pink-700 hidden sm:inline">flow</span>
            <DotString value={engagement} onChange={setEngagement} ariaLabel="Engagement" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className={`font-serif ${labelSize} text-pink-700`}>Energy</span>
          <div className="flex items-center gap-3">
            {energy > 0 && energy < 3 && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-red-500/70 italic">drain</span>
            )}
            <DotString value={energy} onChange={setEnergy} ariaLabel="Energy" />
          </div>
        </div>
      </div>

      {/* Problem type — minimalist hairline radio group */}
      <div className="space-y-2">
        <p className={`font-serif ${labelSize} text-pink-700`}>Problem type</p>
        <div role="radiogroup" aria-label="Problem type" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {(['open', 'stuck', 'reality'] as const).map(p => {
            const sel = frame === p;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => setFrame(sel ? undefined : p)}
                title={LIFE_DESIGN_FRAME_HINTS[p]}
                className="flex items-center gap-2 group/radio"
              >
                <span
                  className={`block w-2.5 h-2.5 rounded-full border transition-colors ${
                    sel ? 'bg-pink-400 border-black' : 'border-gray-300 group-hover/radio:border-gray-500'
                  }`}
                />
                <span className={`font-serif ${valueSize} capitalize ${sel ? 'text-black' : 'text-pink-500 group-hover/radio:text-pink-800'}`}>
                  {p}
                </span>
              </button>
            );
          })}
        </div>
        {frame && (
          <p className={`${valueSize} italic text-pink-500 leading-relaxed`}>
            {LIFE_DESIGN_FRAME_HINTS[frame]}
          </p>
        )}
      </div>

      {/* Reality: italicized serif acceptance note only */}
      {isReality && (
        <div className="space-y-1">
          <p className={`font-serif ${labelSize} text-pink-700`}>Acceptance — “How will I navigate?”</p>
          <input
            className="w-full font-serif italic text-base bg-transparent border-b border-[0.5px] border-gray-200 focus:outline-none focus:border-gray-500 py-2 placeholder:text-pink-400 placeholder:italic placeholder:font-serif"
            value={current.acceptanceNote ?? ''}
            onChange={(e) => setAcceptance(e.target.value)}
            placeholder="This is a fact of life. How will you navigate around it?"
          />
        </div>
      )}

      {/* Stuck: reframe first */}
      {isStuck && (
        <div className="space-y-1">
          <p className={`font-serif ${labelSize} text-pink-700`}>Reframe — “How might I…”</p>
          <input
            className={`w-full ${valueSize} bg-transparent border-b border-[0.5px] border-gray-200 focus:outline-none focus:border-gray-500 py-1 placeholder:text-pink-300`}
            value={current.reframeNote ?? ''}
            onChange={(e) => setReframe(e.target.value)}
            placeholder="The shift that turns the wall into a problem."
          />
        </div>
      )}

      {/* Prototype: visible for Open and (locked for) Stuck; hidden for Reality */}
      {!isReality && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className={`font-serif ${labelSize} text-pink-700`}>Life Design Prototype</p>
            {prototypeLocked && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-pink-400 italic">locked · write a reframe first</span>
            )}
          </div>
          <fieldset disabled={prototypeLocked} className={`space-y-2 ${prototypeLocked ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.25em] text-pink-400">test via</span>
              <div role="radiogroup" aria-label="Prototype mode" className="flex items-center gap-3">
                {(['talk', 'do'] as const).map((m, i) => {
                  const sel = current.prototype?.mode === m;
                  return (
                    <span key={m} className="flex items-center gap-3">
                      {i > 0 && <span className="text-pink-300 text-[11px]">or</span>}
                      <button
                        type="button"
                        role="radio"
                        aria-checked={sel}
                        onClick={() => setPrototypeMode(m)}
                        className="flex items-center gap-1.5 group/mode"
                      >
                        <span
                          className={`block w-2 h-2 rounded-full border transition-colors ${
                            sel ? 'bg-pink-400 border-black' : 'border-gray-300 group-hover/mode:border-gray-500'
                          }`}
                        />
                        <span
                          className={`font-serif lowercase ${valueSize} ${
                            sel ? 'text-black' : 'text-pink-500 group-hover/mode:text-pink-800'
                          }`}
                        >
                          {m}
                        </span>
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
            <p className="text-[10px] italic text-pink-400 leading-relaxed">
              Gather data through a story (Talk) or an experience (Do).
            </p>
            <input
              className={`w-full ${valueSize} bg-transparent border-b border-[0.5px] border-gray-200 focus:outline-none focus:border-gray-500 py-1 placeholder:text-pink-300`}
              value={current.prototype?.action ?? ''}
              onChange={(e) => setPrototypeAction(e.target.value)}
              placeholder={
                current.prototype?.mode === 'talk'
                  ? "Who has already lived this? Note who you'll interview."
                  : current.prototype?.mode === 'do'
                  ? 'How can you try this for a day? Note your smallest experiment.'
                  : isOpen
                  ? 'The smallest experiment to test this directly.'
                  : 'The smallest experiment to test the reframe.'
              }
            />
          </fieldset>
        </div>
      )}
    </div>
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
  <div className="flex gap-0.5 items-center" title={`Workability: ${value || '–'}/5`}>
    {[1, 2, 3, 4, 5].map(n => {
      const filled = n <= value;
      const color = workabilityColor(value);
      return (
        <button
          key={n}
          onClick={() => onChange(value === n ? 0 : n)}
          aria-label={`Workability ${n}`}
          className="p-2 -m-1 group/dot transition-all hover:scale-110"
        >
          <span
            className="block w-2.5 h-2.5 rounded-full border"
            style={{
              backgroundColor: filled ? color : 'transparent',
              borderColor: filled ? color : '#d1d5db',
            }}
          />
        </button>
      );
    })}
    {showLabel && (
      <span className="ml-2 text-[10px] uppercase tracking-[0.25em] text-pink-700">
        {value === 0 ? 'unrated' : value <= 2 ? 'stuck' : value === 3 ? 'mixed' : 'working'}
      </span>
    )}
  </div>
);

const WORKABILITY_COLS = [1, 2, 3, 4, 5] as const;

const MatrixView = ({
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

  const cellTint = (w: number) =>
    w <= 2 ? 'rgba(220, 38, 38, 0.04)'
    : w === 3 ? 'rgba(217, 119, 6, 0.04)'
    : 'rgba(22, 163, 74, 0.04)';

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

export default App;
