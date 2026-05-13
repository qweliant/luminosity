import React, { useEffect, useState } from "react";
import { Plus, Printer, FileInput, Radio } from "lucide-react";

import { migrateMapping, type LegacyMapping, type Mapping } from "./types";
import { seedPersonalValues } from "./data";
import { useBackup } from "./useBackup";
import { relTime, type Snapshot } from "./backup";

import { BackupChip } from "./components/BackupChip";
import { EntrySection } from "./components/EntrySection";
import { FocusOverlay } from "./components/FocusOverlay";
import { ImportModal } from "./components/ImportModal";
import { MatrixView } from "./components/MatrixView";
import { PrintLedger } from "./components/PrintLedger";
import { SyncOverlay } from "./components/SyncOverlay";

// Import your shared state mapping services natively
import { mountSystemDirectory } from "./services/storageDaemon";
import { yEntriesMap, ydoc, isSyncing } from "./services/syncEngine";

const STORAGE_KEY = "values-mapper-v2";

// -----------------------------------------------------------------------------
// Bloom SVG Accessories & Mascots
// -----------------------------------------------------------------------------

const BloomFlower = ({
  size = 28,
  petal = "#E07A95",
  eye = "#3A1E2A",
  smile = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
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

    {smile && (
      <g>
        <circle cx="44" cy="48" r="1.6" fill={eye} />
        <circle cx="52" cy="48" r="1.6" fill={eye} />

        <path
          d="M44 53 Q48 56 52 53"
          stroke="#3A1E2A"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    )}
  </svg>
);

const LumiBean = ({ size = 80 }) => (
  <svg
    width={size}
    height={size * 1.15}
    viewBox="-10 -15 120 130"
    className="overflow-visible inline-block"
  >
    <ellipse cx="50" cy="108" rx="24" ry="3" fill="#3A1E2A" opacity="0.10" />

    <ellipse
      cx="50"
      cy="58"
      rx="32"
      ry="36"
      fill="#FFF5DC"
      stroke="#3A1E2A"
      strokeWidth="2"
    />

    <ellipse cx="50" cy="74" rx="20" ry="14" fill="#FFFDF6" opacity="0.7" />

    <g transform="translate(76 22) rotate(18)">
      <BloomFlower size={34} petal="#C24E6E" smile={false} />
    </g>

    <path
      d="M82 38 Q90 36 92 28 Q86 30 82 38 Z"
      fill="#9CD3B6"
      stroke="#3A1E2A"
      strokeWidth="1"
      strokeOpacity="0.4"
    />

    <ellipse cx="30" cy="66" rx="6.5" ry="4" fill="#E07A95" opacity="0.75" />
    <ellipse cx="70" cy="66" rx="6.5" ry="4" fill="#E07A95" opacity="0.75" />

    <ellipse cx="40" cy="56" rx="3" ry="4" fill="#3A1E2A" />
    <ellipse cx="60" cy="56" rx="3" ry="4" fill="#3A1E2A" />

    <circle cx="41.2" cy="54.5" r="0.9" fill="#fff" />
    <circle cx="61.2" cy="54.5" r="0.9" fill="#fff" />

    <path
      d="M42 71 Q50 77 58 71"
      stroke="#3A1E2A"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />

    <ellipse cx="38" cy="96" rx="7" ry="3" fill="#3A1E2A" />
    <ellipse cx="62" cy="96" rx="7" ry="3" fill="#3A1E2A" />
  </svg>
);

const BloomWordmark = ({ size = 38 }) => (
  <span
    className="font-serif font-normal inline-flex items-baseline tracking-[-0.01em] text-[#3A1E2A]"
    style={{ fontSize: size }}
  >
    Lum
    <span className="relative inline-block mx-[1px]">
      <span className="invisible">i</span>

      <span aria-hidden className="absolute left-1/2 top-[8%] -translate-x-1/2">
        <BloomFlower size={size * 0.32} petal="#C24E6E" eye="#3A1E2A" />
      </span>

      <span
        aria-hidden
        className="absolute left-1/2 top-[42%] -translate-x-1/2 w-[2px] rounded-full bg-[#3A1E2A]"
        style={{ height: size * 0.55 }}
      />
    </span>
    nosity
  </span>
);

// -----------------------------------------------------------------------------
// Pure-Arithmetic Ambient Blooms Engine (Pretext Philosophy)
// -----------------------------------------------------------------------------

const DynamicAmbientBlooms = () => {
  const [pageHeight, setPageHeight] = useState(2000);

  useEffect(() => {
    const container = document.documentElement;
    const update = () => {
      setPageHeight(Math.max(container.scrollHeight, window.innerHeight));
    };

    update();
    const observer = new ResizeObserver(() => update());
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const count = Math.floor(pageHeight / 300);
  const petals = ["#F4ABBC", "#FBD9E0", "#F7D679", "#9CD3B6", "#E07A95"];

  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 pointer-events-none print:hidden z-0"
    >
      <style>{`
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(4deg); }
        }
        .ambient-bloom {
          animation: gentleFloat 7s ease-in-out infinite;
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => {
        const r1 = Math.abs(Math.sin(i + 1));
        const r2 = Math.abs(Math.cos(i + 1));
        const r3 = Math.abs(Math.sin((i + 1) * 2));

        const isLeft = i % 2 === 0;
        const gutterPos = isLeft ? -30 + r1 * 40 : -20 + r1 * 30;
        const topPos = 150 + i * 300 + r2 * 100;
        const size = 45 + Math.floor(r3 * 50);
        const petal = petals[i % petals.length];
        const delay = (r1 * 5).toFixed(1);

        if (topPos > pageHeight - 150) return null;

        return (
          <div
            key={i}
            className="absolute opacity-50 ambient-bloom"
            style={{
              top: `${topPos}px`,
              [isLeft ? "left" : "right"]: `${gutterPos}px`,
              animationDelay: `${delay}s`,
            }}
          >
            <BloomFlower size={size} petal={petal} smile={false} />
          </div>
        );
      })}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const norm = (s: string) => s.trim().toLowerCase();

// -----------------------------------------------------------------------------
// App Root
// -----------------------------------------------------------------------------

export const App = () => {
  // ---------------------------------------------------------------------------
  // Persistence initialization
  // ---------------------------------------------------------------------------

  const [entries, setEntries] = useState<Mapping[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed: LegacyMapping[] = saved ? JSON.parse(saved) : [];
    const migrated = parsed.map(migrateMapping);

    return migrated;
  });

  // Preserve baseline application caching states safely
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  // ---------------------------------------------------------------------------
  // App-level UI state
  // ---------------------------------------------------------------------------

  const [openLenses, setOpenLenses] = useState<Record<string, boolean>>({});
  const [matrixView, setMatrixView] = useState(false);
  const [focusEntryId, setFocusEntryId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [liveP2P, setLiveP2P] = useState(() => isSyncing());
  const [dismissHello, setDismissHello] = useState(
    () => localStorage.getItem("lumi-nudge-dismissed") === "1",
  );

  const [randomStartIndex, setRandomStartIndex] = useState(0);

  // ---------------------------------------------------------------------------
  // CRDT TWO-WAY SYNCHRONIZATION BRIDGE
  // ---------------------------------------------------------------------------

  // 1. INBOUND: Watch shared maps to seamlessly capture incoming WebRTC updates
  useEffect(() => {
    const handleRemoteUpdates = (event: any, transaction: any) => {
      // Prevent local client transaction echoes from triggering interface redraws
      if (transaction.local) return;

      const updatedMappings: Mapping[] = [];
      yEntriesMap.forEach((mapping) => {
        updatedMappings.push(mapping);
      });

      setEntries(updatedMappings);
    };

    yEntriesMap.observe(handleRemoteUpdates);
    return () => yEntriesMap.unobserve(handleRemoteUpdates);
  }, []);

  // 2. HOST SEEDING: Populate ephemeral maps dynamically upon host connection
  useEffect(() => {
    // Check if the user has genuine persisted history rather than unedited session defaults
    const hasPersistedHistory = localStorage.getItem(STORAGE_KEY) !== null;

    if (hasPersistedHistory && entries.length > 0 && yEntriesMap.size === 0) {
      ydoc.transact(() => {
        entries.forEach((mapping) => yEntriesMap.set(mapping.id, mapping));
      }, "local");
    }
  }, [entries]);

  // ---------------------------------------------------------------------------
  // Derived indicator sets
  // ---------------------------------------------------------------------------

  const existingValues = new Set(
    entries.map((e) => norm(e.value)).filter(Boolean),
  );

  const duplicateIds = new Set(
    entries
      .filter((e) => {
        const k = norm(e.value);
        if (!k) return false;
        return entries.some(
          (other) => other.id !== e.id && norm(other.value) === k,
        );
      })
      .map((e) => e.id),
  );

  const focusedEntry = focusEntryId
    ? (entries.find((e) => e.id === focusEntryId) ?? null)
    : null;

  // ---------------------------------------------------------------------------
  // Notebook metrics derivations
  // ---------------------------------------------------------------------------

  const countTotal = entries.length;
  const countStuck = entries.filter((e) => e.workability === 1).length;
  const countMixed = entries.filter(
    (e) => e.workability === 2 || e.workability === 3,
  ).length;
  const countWorking = entries.filter(
    (e) => e.workability === 4 || e.workability === 5,
  ).length;

  const activeLensesCount = entries.reduce((acc, e) => {
    let c = 0;
    if (e.workability) c++;
    if (e.emotionCluster) c++;
    if (e.coreNeed) c++;
    if (e.lifeDesign?.problemFrame) c++;
    if (e.accelerators?.trim()) c++;
    if (e.relational?.active) c++;
    return acc + c;
  }, 0);

  const maxLenses = countTotal * 6;

  // ---------------------------------------------------------------------------
  // Backup sidecar hooks
  // ---------------------------------------------------------------------------

  const backup = useBackup(entries);

  const handleRestore = async (snap: Snapshot) => {
    const ok = window.confirm(
      `Restore snapshot from ${relTime(snap.createdAt)} (${snap.count} ${
        snap.count === 1 ? "value" : "values"
      })? This will replace your current entries.`,
    );

    if (!ok) return;
    const restored = await backup.restore(snap.id);
    if (restored) {
      // Re-seed updated targets directly into persistent document maps
      ydoc.transact(() => {
        yEntriesMap.clear();
        restored.forEach((mapping) => yEntriesMap.set(mapping.id, mapping));
      }, "local");
      setEntries(restored);
    }
  };

  // ---------------------------------------------------------------------------
  // State mutations (Bridged natively to Local and CRDT map targets)
  // ---------------------------------------------------------------------------

  const updateEntry = (id: string, patch: Partial<Mapping>) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, ...patch };
          // Push mutation sets safely to shared CRDT parameters
          ydoc.transact(() => {
            yEntriesMap.set(id, updated);
          }, "local");
          return updated;
        }
        return e;
      }),
    );
  };

  const toggleNvc = (id: string, need: string) => {
    const e = entries.find((x) => x.id === id);
    if (!e) return;

    const cur = e.nvcNeeds ?? [];
    const updatedNeeds = cur.includes(need)
      ? cur.filter((n) => n !== need)
      : [...cur, need];

    updateEntry(id, { nvcNeeds: updatedNeeds });
  };

  const toggleLens = (id: string) =>
    setOpenLenses((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAddImported = (names: string[]) => {
    const newEntries: Mapping[] = names.map((name) => ({
      id: crypto.randomUUID(),
      value: name,
      need: "",
      friction: "",
    }));

    ydoc.transact(() => {
      newEntries.forEach((mapping) => yEntriesMap.set(mapping.id, mapping));
    }, "local");

    setEntries([...entries, ...newEntries]);
  };

  const handleDeleteEntry = (id: string) => {
    ydoc.transact(() => {
      yEntriesMap.delete(id);
    }, "local");
    setEntries(entries.filter((e) => e.id !== id));
  };

  const handleAddBlankSpace = () => {
    const newEntry: Mapping = {
      id: crypto.randomUUID(),
      value: "",
      need: "",
      friction: "",
    };

    ydoc.transact(() => {
      yEntriesMap.set(newEntry.id, newEntry);
    }, "local");

    setEntries([...entries, newEntry]);
  };

  const hideHelloNudge = () => {
    localStorage.setItem("lumi-nudge-dismissed", "1");
    setDismissHello(true);
  };

  // ---------------------------------------------------------------------------
  // Render Layout
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#FDF4F0] text-[#3A1E2A] selection:bg-[#FBD9E0] font-sans overflow-x-hidden relative">
      <DynamicAmbientBlooms />

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

      <SyncOverlay
        open={showSync}
        onClose={() => {
          setShowSync(false);
          setLiveP2P(isSyncing());
        }}
        onMountStorage={mountSystemDirectory}
      />

      <PrintLedger entries={entries} />

      <div className="print:hidden">
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
                <BackupChip
                  status={backup.status}
                  lastSnapshot={backup.lastSnapshot}
                  snapshots={backup.snapshots}
                  inFlight={backup.inFlight}
                  onSnapshot={backup.snapshotNow}
                  onRestore={handleRestore}
                />

                <button
                  onClick={() => setShowSync(true)}
                  className={`hover:text-[#C24E6E] transition-colors flex items-center gap-1 cursor-pointer ${
                    liveP2P ? "text-[#9CD3B6] font-bold" : "text-[#B391A0]"
                  }`}
                  title="Connect tracking nodes over end-to-end encrypted local WebRTC channels"
                >
                  <Radio
                    size={15}
                    className={`inline ${liveP2P ? "animate-pulse" : ""}`}
                  />
                  <span>{liveP2P ? "P2P Live" : "Sync"}</span>
                </button>

                <button
                  onClick={() => setMatrixView((v) => !v)}
                  className={`hover:text-[#C24E6E] transition-colors flex items-center ${
                    matrixView ? "text-[#C24E6E] font-bold" : "text-[#B391A0]"
                  }`}
                >
                  {matrixView ? "✿ List View" : "Matrix"}
                </button>

                <button
                  onClick={() => setShowImport(true)}
                  className="hover:text-[#C24E6E] transition-colors flex items-center text-[#B391A0]"
                  title="Add from library"
                >
                  <FileInput size={16} className="inline mr-1" />
                  import
                </button>

                <button
                  onClick={() => window.print()}
                  className="hover:text-[#C24E6E] transition-colors flex items-center text-[#B391A0]"
                  title="Print clear pure text layout"
                >
                  <Printer size={16} className="inline mr-1" />
                  print
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 bg-[#FFFFFF] rounded-[16px] border border-[#3A1E2A]/10 items-center shadow-xs">
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
          </header>

          {!dismissHello && entries.length > 0 && (
            <div className="mb-6 p-4 bg-[#FAE6E1] rounded-[18px] border border-[#3A1E2A]/10 flex items-center gap-4 relative print:hidden shadow-xs">
              <LumiBean size={54} />
              <div className="flex-1">
                <div className="font-serif italic text-sm sm:text-base text-[#3A1E2A] leading-snug">
                  Hi.
                  <span className="text-[#C24E6E] font-bold not-italic">
                    {" "}
                    {entries[0]?.value || "Your alignment"}
                  </span>{" "}
                  feels like a good place to start tending today — ready to
                  unpack the friction?
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
              onFocus={(id) => setFocusEntryId(id)}
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
                      onClick={() => setEntries(seedPersonalValues())}
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
                <EntrySection
                  key={entry.id}
                  entry={entry}
                  isDuplicate={duplicateIds.has(entry.id)}
                  lensOpen={!!openLenses[entry.id]}
                  onToggleLens={() => toggleLens(entry.id)}
                  onChange={(patch) => updateEntry(entry.id, patch)}
                  onDelete={() => handleDeleteEntry(entry.id)}
                  onToggleNvc={(n) => toggleNvc(entry.id, n)}
                  onFocus={() => setFocusEntryId(entry.id)}
                />
              ))}

              {/* Ensure blank additions populate shared CRDT nodes safely */}
              <button
                onClick={handleAddBlankSpace}
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
            ✿ built for clarity · persisted locally · nothing leaves your device
            ✿
          </footer>
        </div>
      </div>
    </div>
  );
};

export default App;
