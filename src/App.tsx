import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Printer,
  FileInput,
  Radio,
  BookOpen,
  Download,
  Users,
} from "lucide-react";

import type { Mapping } from "./types";
import { seedPersonalValues } from "./data";
import { lensCompletion } from "./derive";
import { useBackup } from "./useBackup";
import { useEntries } from "./useEntries";
import { relTime, type Snapshot } from "./backup";
import { useHashRoute, goBackOr } from "./router";
import { downloadEntriesAsJson } from "./transfer";

import { AmbientBlooms } from "./components/AmbientBlooms";
import { BackupChip } from "./components/BackupChip";
import { BloomFlower, BloomWordmark, LumiBean } from "./components/bloom";
import { EntryRow } from "./components/EntryRow";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { healthSentence } from "./components/healthSentence";
import { MatrixView } from "./components/MatrixView";
import { OverflowMenu } from "./components/OverflowMenu";
import { PrintLedger } from "./components/PrintLedger";

// Heavy or route/modal-gated chunks. Splitting these out keeps the initial
// bundle focused on the list view; each piece is fetched the first time the
// user lands on its route or opens its modal.
const FocusOverlay = lazy(() =>
  import("./components/FocusOverlay").then((m) => ({ default: m.FocusOverlay })),
);
const ImportModal = lazy(() =>
  import("./components/ImportModal").then((m) => ({ default: m.ImportModal })),
);
const MethodsPage = lazy(() =>
  import("./components/MethodsPage").then((m) => ({ default: m.MethodsPage })),
);
const PartsPage = lazy(() =>
  import("./components/PartsPage").then((m) => ({ default: m.PartsPage })),
);
const SyncOverlay = lazy(() =>
  import("./components/SyncOverlay").then((m) => ({ default: m.SyncOverlay })),
);

import { mountSystemDirectory } from "./services/storageDaemon";
import {
  getPeerPresences,
  isSyncing,
  subscribeAwareness,
  subscribeSyncStatus,
  type PeerPresence,
} from "./services/syncEngine";

const norm = (s: string) => s.trim().toLowerCase();

// Local-date key for the daily nudge dismiss. YYYY-MM-DD in the user's
// timezone, so the nudge resurfaces at local midnight rather than UTC.
const todayKey = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// -----------------------------------------------------------------------------
// App Root
// -----------------------------------------------------------------------------

export const App = () => {
  const {
    entries,
    parts,
    updateEntry,
    toggleNvc,
    addEntries,
    addBlank,
    deleteEntry,
    replaceAll,
    upsertPart,
  } = useEntries();

  // ---------------------------------------------------------------------------
  // App-level UI state
  // ---------------------------------------------------------------------------

  const [openLenses, setOpenLenses] = useState<Record<string, boolean>>({});
  const [route, navigate] = useHashRoute();
  const [lastUnderlay, setLastUnderlay] = useState<"list" | "matrix">("list");
  const [showImport, setShowImport] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [liveP2P, setLiveP2P] = useState(() => isSyncing());
  const [peers, setPeers] = useState<PeerPresence[]>(() => getPeerPresences());
  const [dismissHello, setDismissHello] = useState(
    () => localStorage.getItem("lumi-nudge-dismissed") === todayKey(),
  );

  // Track the last "ground floor" route so closing the Focus overlay can
  // return us to whichever of list/matrix we were on. Methods is a peer
  // page rather than an underlay, so it does not update this.
  useEffect(() => {
    if (route.name === "list") setLastUnderlay("list");
    else if (route.name === "matrix") setLastUnderlay("matrix");
  }, [route]);

  // Subscribe to live sync status so the "Live" header chip reflects the
  // actual WebRTC connection state instead of a stale snapshot.
  useEffect(() => subscribeSyncStatus(() => setLiveP2P(isSyncing())), []);

  // Surface "also editing on iPad" when another of the user's own devices
  // joins the same sync room. See [[sync-model-single-editor]] — this is the
  // presence surface for our single-editor model.
  useEffect(
    () => subscribeAwareness(() => setPeers(getPeerPresences())),
    [],
  );

  const matrixView =
    route.name === "matrix" ||
    (route.name === "focus" && lastUnderlay === "matrix");
  const focusEntryId = route.name === "focus" ? route.id : null;
  const showMethods = route.name === "methods";
  const showParts = route.name === "parts";

  // ---------------------------------------------------------------------------
  // Derived indicator sets
  // ---------------------------------------------------------------------------

  const existingValues = useMemo(
    () => new Set(entries.map((e) => norm(e.value)).filter(Boolean)),
    [entries],
  );

  const duplicateIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) {
      const k = norm(e.value);
      if (!k) continue;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const dup = new Set<string>();
    for (const e of entries) {
      const k = norm(e.value);
      if (k && (counts.get(k) ?? 0) > 1) dup.add(e.id);
    }
    return dup;
  }, [entries]);

  const focusedEntry = focusEntryId
    ? (entries.find((e) => e.id === focusEntryId) ?? null)
    : null;

  // Pick a value for the Lumi nudge. Two pools: entries whose lens stack is
  // almost-but-not-fully complete (filled within 2 of total) get a "finish
  // tending" prompt; everything else falls through to a plain random pick.
  // Bias 70/30 toward almost-completed when any exist so the nudge tends to
  // point at unfinished work rather than restating a value at random.
  const nudge = useMemo(() => {
    const valued = entries.filter((e) => e.value?.trim());
    if (valued.length === 0) return null;
    const almost = valued.filter((e) => {
      const { filled, total } = lensCompletion(e);
      return filled > 0 && filled < total && filled >= total - 2;
    });
    const useAlmost = almost.length > 0 && Math.random() < 0.7;
    const pool = useAlmost ? almost : valued;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!pick) return null;
    return { entry: pick, kind: useAlmost ? "almost" : "random" } as const;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length]);

  // ---------------------------------------------------------------------------
  // Notebook metrics derivations
  // ---------------------------------------------------------------------------

  const { countTotal, countStuck, countMixed, countWorking, activeLensesCount } =
    useMemo(() => {
      let stuck = 0;
      let mixed = 0;
      let working = 0;
      let lenses = 0;
      for (const e of entries) {
        if (e.workability === 1) stuck++;
        else if (e.workability === 2 || e.workability === 3) mixed++;
        else if (e.workability === 4 || e.workability === 5) working++;
        if (e.workability) lenses++;
        if (e.emotionCluster) lenses++;
        if (e.coreNeed) lenses++;
        if (e.lifeDesign?.problemFrame) lenses++;
        if (e.accelerators?.trim()) lenses++;
        if (e.relational?.active) lenses++;
      }
      return {
        countTotal: entries.length,
        countStuck: stuck,
        countMixed: mixed,
        countWorking: working,
        activeLensesCount: lenses,
      };
    }, [entries]);

  const maxLenses = countTotal * 6;

  // ---------------------------------------------------------------------------
  // Backup sidecar hooks
  // ---------------------------------------------------------------------------

  const backup = useBackup(entries);
  const backupEnabled = import.meta.env.DEV;

  const handleRestore = async (snap: Snapshot) => {
    const ok = window.confirm(
      `Restore snapshot from ${relTime(snap.createdAt)} (${snap.count} ${
        snap.count === 1 ? "value" : "values"
      })? This will replace your current entries.`,
    );

    if (!ok) return;
    const restored = await backup.restore(snap.id);
    if (restored) replaceAll(restored);
  };

  // ---------------------------------------------------------------------------
  // UI action wrappers — stable refs so memoized rows don't re-render on
  // unrelated edits.
  // ---------------------------------------------------------------------------

  const toggleLens = useCallback((id: string) => {
    setOpenLenses((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const focusEntry = useCallback(
    (id: string) => navigate({ name: "focus", id }),
    [navigate],
  );

  // If the URL points at a focus entry that doesn't exist (deleted, deep-link
  // with a stale id, etc.) drop back to the underlay rather than silently
  // showing nothing.
  useEffect(() => {
    if (focusEntryId && !entries.find((e) => e.id === focusEntryId)) {
      navigate({ name: lastUnderlay });
    }
  }, [focusEntryId, entries, lastUnderlay, navigate]);

  const handleAddImported = (names: string[]) => {
    addEntries(
      names.map((name) => ({
        id: crypto.randomUUID(),
        value: name,
        need: "",
        friction: "",
      })),
    );
  };

  const handleLoadBackup = (loaded: Mapping[]) => {
    if (entries.length > 0) {
      const ok = window.confirm(
        `Replace your current ${entries.length} ${
          entries.length === 1 ? "entry" : "entries"
        } with the ${loaded.length} from this backup? Your current data will be overwritten.`,
      );
      if (!ok) return;
    }
    replaceAll(loaded);
  };

  const hideHelloNudge = () => {
    localStorage.setItem("lumi-nudge-dismissed", todayKey());
    setDismissHello(true);
  };

  // ---------------------------------------------------------------------------
  // Render Layout
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#FDF4F0] text-[#3A1E2A] selection:bg-[#FBD9E0] font-sans overflow-x-hidden relative">
      <AmbientBlooms />

      {focusedEntry && (
        <ErrorBoundary region="focus mode">
          <Suspense fallback={null}>
            <FocusOverlay
              entry={focusedEntry}
              parts={parts}
              onUpsertPart={upsertPart}
              onChange={(patch) => updateEntry(focusedEntry.id, patch)}
              onToggleNvc={(n) => toggleNvc(focusedEntry.id, n)}
              onClose={() => goBackOr({ name: lastUnderlay })}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {showImport && (
        <Suspense fallback={null}>
          <ImportModal
            open
            onClose={() => setShowImport(false)}
            existingValues={existingValues}
            onAdd={handleAddImported}
            onLoadBackup={handleLoadBackup}
            currentCount={entries.length}
          />
        </Suspense>
      )}

      {showSync && (
        <Suspense fallback={null}>
          <SyncOverlay
            open
            onClose={() => setShowSync(false)}
            onMountStorage={mountSystemDirectory}
          />
        </Suspense>
      )}

      <PrintLedger entries={entries} />

      <div className="print:hidden">
        {showParts ? (
          <Suspense fallback={null}>
            <PartsPage
              parts={parts}
              entries={entries}
              onClose={() => goBackOr({ name: lastUnderlay })}
              onFocus={(id) => navigate({ name: "focus", id })}
            />
          </Suspense>
        ) : showMethods ? (
          <Suspense fallback={null}>
            <MethodsPage onClose={() => goBackOr({ name: lastUnderlay })} />
          </Suspense>
        ) : (
          <div
            className={`${
              matrixView ? "max-w-4xl" : "max-w-3xl"
            } mx-auto py-12 px-6 transition-all`}
          >
            <header className="mb-6 flex flex-col gap-4 print:hidden">
              <div className="flex justify-between items-end flex-wrap gap-4 border-b border-[#3A1E2A]/10 pb-4">
                <div className="flex items-baseline gap-3">
                  <BloomWordmark size={36} />
                  <span className="font-serif italic text-xs text-[#B391A0]">
                    a kind, small ledger
                  </span>
                </div>

                <div className="flex gap-4 items-center flex-wrap text-[10px] uppercase tracking-[0.18em] font-medium">
                  {backupEnabled && (
                    <BackupChip
                      status={backup.status}
                      lastSnapshot={backup.lastSnapshot}
                      snapshots={backup.snapshots}
                      inFlight={backup.inFlight}
                      onSnapshot={backup.snapshotNow}
                      onRestore={handleRestore}
                    />
                  )}

                  {/* Primary: live state */}
                  <button
                    onClick={() => setShowSync(true)}
                    className={`hover:text-[#C24E6E] transition-colors flex items-center gap-1 cursor-pointer ${
                      liveP2P ? "text-[#9CD3B6] font-bold" : "text-[#B391A0]"
                    }`}
                    title="Mirror this ledger to another browser. Nothing leaves your devices."
                  >
                    <Radio
                      size={15}
                      className={`inline ${liveP2P ? "animate-pulse" : ""}`}
                    />
                    <span>{liveP2P ? "Live" : "Sync"}</span>
                  </button>

                  {liveP2P && peers.length > 0 && (
                    <span
                      className="font-serif italic text-[10px] tracking-normal normal-case text-[#B391A0]"
                      title={
                        "Other devices in this room: " +
                        peers.map((p) => p.device).join(", ")
                      }
                    >
                      {peers.length === 1
                        ? `also on ${peers[0]?.device ?? "another device"}`
                        : `also on ${peers.length} other devices`}
                    </span>
                  )}

                  {/* Primary: view toggle */}
                  <button
                    onClick={() =>
                      navigate({ name: matrixView ? "list" : "matrix" })
                    }
                    className={`hover:text-[#C24E6E] transition-colors flex items-center cursor-pointer ${
                      matrixView ? "text-[#C24E6E] font-bold" : "text-[#B391A0]"
                    }`}
                  >
                    {matrixView ? "✿ List view" : "Matrix"}
                  </button>

                  {/* Reading surfaces — keep discoverable */}
                  <button
                    onClick={() => navigate({ name: "methods" })}
                    className="hover:text-[#C24E6E] transition-colors flex items-center text-[#B391A0] cursor-pointer"
                    title="How the lenses work, and the frameworks behind them"
                  >
                    <BookOpen size={15} className="inline mr-1" />
                    methods
                  </button>

                  <button
                    onClick={() => navigate({ name: "parts" })}
                    className="hover:text-[#C24E6E] transition-colors flex items-center text-[#B391A0] cursor-pointer"
                    title="IFS profiles — the parts of you that are doing the work"
                  >
                    <Users size={15} className="inline mr-1" />
                    parts
                  </button>

                  {/* Archival actions — collapsed */}
                  <OverflowMenu
                    items={[
                      {
                        label: "Import",
                        hint: "From the library, paste a list, or load a backup .json",
                        icon: <FileInput size={15} />,
                        onClick: () => setShowImport(true),
                      },
                      {
                        label: "Export",
                        hint: "Download a JSON backup of every entry",
                        icon: <Download size={15} />,
                        disabled: entries.length === 0,
                        onClick: () => downloadEntriesAsJson(entries),
                      },
                      {
                        label: "Print",
                        hint: "Editorial layout — useful for PDF saves",
                        icon: <Printer size={15} />,
                        onClick: () => window.print(),
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="p-4 bg-[#FFFFFF] rounded-[16px] border border-[#3A1E2A]/10 shadow-xs">
                {/* Sentence + Lumi */}
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[8.5px] text-[#C24E6E] tracking-[0.16em] uppercase font-bold">
                      Today's weather
                    </div>
                    <p className="font-serif text-lg sm:text-xl text-[#3A1E2A] mt-1 leading-snug tracking-[-0.005em] m-0">
                      {healthSentence(
                        countTotal,
                        countStuck,
                        countMixed,
                        countWorking,
                      )}
                    </p>
                  </div>
                  <LumiBean size={44} />
                </div>

                {/* Existing count grid, unchanged */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 items-center pt-3 border-t border-dashed border-[#3A1E2A]/10">
                  <div>
                    <div className="font-mono text-[8.5px] text-[#B391A0] tracking-[0.16em] uppercase">
                      values
                    </div>
                    <div className="font-serif text-2xl text-[#3A1E2A] mt-0.5">
                      {countTotal}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[8.5px] text-[#B391A0] tracking-[0.16em] uppercase">
                      stuck
                    </div>
                    <div className="font-serif text-2xl text-[#C24E6E] mt-0.5">
                      {countStuck}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[8.5px] text-[#B391A0] tracking-[0.16em] uppercase">
                      mixed
                    </div>
                    <div className="font-serif text-2xl text-[#F7D679] mt-0.5">
                      {countMixed}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[8.5px] text-[#B391A0] tracking-[0.16em] uppercase">
                      working
                    </div>
                    <div className="font-serif text-2xl text-[#9CD3B6] mt-0.5">
                      {countWorking}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 pt-2 sm:pt-0 sm:border-l border-[#3A1E2A]/5 sm:pl-3">
                    <div className="font-mono text-[8.5px] text-[#B391A0] tracking-[0.16em] uppercase">
                      lenses
                    </div>
                    <div className="font-serif text-xl text-[#3A1E2A] mt-0.5">
                      {activeLensesCount}/{maxLenses || 30}
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {!dismissHello && nudge && (
              <div className="mb-6 p-4 bg-[#FAE6E1] rounded-[18px] border border-[#3A1E2A]/10 flex items-center gap-4 relative print:hidden shadow-xs">
                <LumiBean size={54} />
                <div className="flex-1">
                  <div className="font-serif italic text-sm sm:text-base text-[#3A1E2A] leading-snug">
                    Hi.
                    {" "}
                    <button
                      type="button"
                      onClick={() => focusEntry(nudge.entry.id)}
                      className="text-[#C24E6E] font-bold not-italic hover:underline cursor-pointer"
                    >
                      {nudge.entry.value || "Your alignment"}
                    </button>{" "}
                    {nudge.kind === "almost"
                      ? "is almost tended — want to finish unpacking the friction?"
                      : "feels like a good place to start tending today — ready to unpack the friction?"}
                  </div>
                  <div className="mt-1 font-mono text-[9px] text-[#5A3645]/70 tracking-wider">
                    lumi · your gentle nudge
                  </div>
                </div>
                <button
                  onClick={hideHelloNudge}
                  className="text-xs text-[#C24E6E] hover:underline px-2 py-1 self-start sm:self-center font-medium"
                >
                  dismiss ✿
                </button>
              </div>
            )}

            {matrixView ? (
              <MatrixView
                entries={entries}
                parts={parts}
                onFocus={(id) => navigate({ name: "focus", id })}
              />
            ) : (
              <main className="space-y-4 sm:space-y-6">
                {entries.length === 0 && (
                  <div className="py-8 px-4 sm:px-8 bg-white border border-[#3A1E2A]/10 rounded-[18px] shadow-sm relative overflow-hidden animate-in fade-in duration-300 mt-2">
                    <div
                      aria-hidden="true"
                      className="absolute right-[-20px] top-[-20px] opacity-30 pointer-events-none"
                    >
                      <BloomFlower size={140} petal="#F4ABBC" smile={false} />
                    </div>
                    <div
                      aria-hidden="true"
                      className="absolute left-[-30px] bottom-[-30px] opacity-30 pointer-events-none"
                    >
                      <BloomFlower size={160} petal="#FBD9E0" smile={false} />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mb-8 relative z-10">
                      <div className="shrink-0">
                        <LumiBean size={100} />
                      </div>
                      <div className="bg-[#FDF4F0] border border-[#3A1E2A]/15 rounded-2xl p-4 sm:p-5 flex-1 relative shadow-2xs">
                        <div className="absolute left-1/2 sm:left-[-7px] top-[-7px] sm:top-auto sm:bottom-6 w-3 h-3 bg-[#FDF4F0] border-t border-l sm:border-t-0 sm:border-r border-[#3A1E2A]/15 rotate-45" />
                        <p className="font-serif text-xl sm:text-2xl text-[#3A1E2A] leading-tight m-0">
                          hi! i&apos;m lumi.
                        </p>
                        <p className="font-serif italic text-xs sm:text-sm text-[#5A3645] mt-1 mb-0">
                          shall we drop a few core values onto the canvas to
                          begin?
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 max-w-md mx-auto relative z-10">
                      <button
                        type="button"
                        onClick={() => setShowImport(true)}
                        className="w-full bg-[#C24E6E] text-white p-3.5 rounded-xl text-left transition-all hover:bg-[#3A1E2A] shadow-2xs group cursor-pointer flex items-center gap-3"
                      >
                        <span className="bg-white/20 p-1.5 rounded-lg text-white group-hover:bg-white/10 shrink-0">
                          <BloomFlower
                            size={16}
                            petal="#FFFFFF"
                            eye="#C24E6E"
                            smile={false}
                          />
                        </span>
                        <div>
                          <div className="font-sans text-xs font-bold uppercase tracking-wider">
                            From the curated library
                          </div>
                          <div className="font-serif italic text-xs text-pink-100 mt-0.5">
                            Explore detailed definitions by season...
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => replaceAll(seedPersonalValues())}
                        className="w-full bg-[#FFF5DC] text-[#3A1E2A] p-3.5 rounded-xl border border-[#3A1E2A]/10 text-left transition-all hover:border-[#E07A95] cursor-pointer flex items-center gap-3"
                      >
                        <span className="bg-[#F7D679] p-1.5 rounded-lg text-[#3A1E2A] shrink-0">
                          ✿
                        </span>
                        <div>
                          <div className="font-sans text-xs font-bold uppercase tracking-wider text-[#5A3645]">
                            Seed five common pillars
                          </div>
                          <div className="font-serif italic text-xs text-[#B391A0] mt-0.5">
                            Compassion · Curiosity · Health · Harmony · Peace
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowImport(true)}
                        className="w-full bg-transparent text-[#5A3645] p-3 rounded-xl border border-dashed border-[#3A1E2A]/15 text-center transition-all hover:bg-[#FAE6E1]/30 cursor-pointer font-sans text-xs font-medium"
                      >
                        ✎ Or paste your own raw unformatted list
                      </button>
                    </div>
                  </div>
                )}

                {/* Directly target native deletion hooks inside the rendering loop */}
                {entries.map((entry) => (
                  <ErrorBoundary key={entry.id} region={entry.value || "entry"}>
                    <EntryRow
                      entry={entry}
                      parts={parts}
                      isDuplicate={duplicateIds.has(entry.id)}
                      lensOpen={!!openLenses[entry.id]}
                      onToggleLens={toggleLens}
                      onUpdate={updateEntry}
                      onDelete={deleteEntry}
                      onToggleNvc={toggleNvc}
                      onFocus={focusEntry}
                    />
                  </ErrorBoundary>
                ))}

                <button
                  onClick={addBlank}
                  className="w-full py-8 border border-dashed border-[#3A1E2A]/15 rounded-[18px] text-[#B391A0] hover:text-[#C24E6E] hover:bg-white transition-all flex items-center justify-center gap-2 print:hidden group shadow-2xs cursor-pointer"
                >
                  <Plus
                    size={20}
                    className="group-hover:rotate-90 transition-transform"
                  />
                  <span className="font-mono text-xs tracking-wider uppercase">
                    Add blank mapping space ✿
                  </span>
                </button>
              </main>
            )}

            <footer className="mt-16 pt-6 border-t border-[#3A1E2A]/10 text-center text-xs text-[#B391A0] font-serif italic print:hidden">
              ✿ built for clarity · persisted locally · nothing leaves your
              device ✿
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
