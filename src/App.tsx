// Composition root. Owns persistence (localStorage with seed + migration),
// app-level UI state (which views are open, which row is focused), and wires
// data + actions into the leaf components. No layout-of-individual-rows logic
// or per-component state lives here — those moved to ./components/*.

import React, { useEffect, useState } from 'react';
import { Plus, Printer, FileInput } from 'lucide-react';
import { migrateMapping, type LegacyMapping, type Mapping } from './types';
import { seedPersonalValues } from './data';
import { useBackup } from './useBackup';
import { relTime, type Snapshot } from './backup';
import { BackupChip } from './components/BackupChip';
import { EntrySection } from './components/EntrySection';
import { FocusOverlay } from './components/FocusOverlay';
import { ImportModal } from './components/ImportModal';
import { MatrixView } from './components/MatrixView';

const STORAGE_KEY = 'values-mapper-v2';
const SEED_FLAG = 'values-mapper-seed-v1';

// Case-insensitive trim used for value identity (dedupe + duplicate detection).
const norm = (s: string) => s.trim().toLowerCase();

const App = () => {
  // --- Persistence: localStorage with one-time seed + on-read migration ----
  const [entries, setEntries] = useState<Mapping[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed: LegacyMapping[] = saved ? JSON.parse(saved) : [];
    const migrated = parsed.map(migrateMapping);
    if (!localStorage.getItem(SEED_FLAG) && migrated.length === 0) {
      localStorage.setItem(SEED_FLAG, '1');
      return seedPersonalValues();
    }
    return migrated;
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  // --- App-level UI state -------------------------------------------------
  const [openLenses, setOpenLenses] = useState<Record<string, boolean>>({});
  const [matrixView, setMatrixView] = useState(false);
  const [focusEntryId, setFocusEntryId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  // --- Derived state (cheap; recomputed each render) ----------------------
  const existingValues = new Set(entries.map(e => norm(e.value)).filter(Boolean));
  const duplicateIds = new Set(
    entries
      .filter(e => {
        const k = norm(e.value);
        if (!k) return false;
        return entries.some(other => other.id !== e.id && norm(other.value) === k);
      })
      .map(e => e.id)
  );
  const focusedEntry = focusEntryId ? entries.find(e => e.id === focusEntryId) ?? null : null;

  // --- Optional SQLite-backed backup sidecar ------------------------------
  const backup = useBackup(entries);
  const handleRestore = async (snap: Snapshot) => {
    const ok = window.confirm(
      `Restore snapshot from ${relTime(snap.createdAt)} (${snap.count} ${snap.count === 1 ? 'value' : 'values'})? ` +
      'This will replace your current entries.'
    );
    if (!ok) return;
    const restored = await backup.restore(snap.id);
    if (restored) setEntries(restored);
  };

  // --- Mutations ----------------------------------------------------------
  const updateEntry = (id: string, patch: Partial<Mapping>) =>
    setEntries(entries.map(e => e.id === id ? { ...e, ...patch } : e));

  const toggleNvc = (id: string, need: string) => {
    const e = entries.find(x => x.id === id);
    if (!e) return;
    const cur = e.nvcNeeds ?? [];
    updateEntry(id, {
      nvcNeeds: cur.includes(need) ? cur.filter(n => n !== need) : [...cur, need],
    });
  };

  const toggleLens = (id: string) =>
    setOpenLenses(prev => ({ ...prev, [id]: !prev[id] }));

  const handleAddImported = (names: string[]) => {
    const newEntries: Mapping[] = names.map(name => ({
      id: crypto.randomUUID(),
      value: name,
      need: '',
      friction: '',
    }));
    setEntries([...entries, ...newEntries]);
  };

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

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        existingValues={existingValues}
        onAdd={handleAddImported}
      />

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

        {matrixView ? (
          <MatrixView entries={entries} onFocus={(id) => setFocusEntryId(id)} />
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

export default App;
