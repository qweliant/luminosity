import { useCallback, useEffect, useRef, useState } from "react";
import { migrateMapping, type LegacyMapping, type Mapping, type Part } from "./types";
import { yEntriesMap, yPartsMap, ydoc } from "./services/syncEngine";

const STORAGE_KEY = "values-mapper-v2";
const PARTS_STORAGE_KEY = "values-mapper-parts-v1";

const readEntries = (): Mapping[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed: LegacyMapping[] = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateMapping);
  } catch {
    return [];
  }
};

const readParts = (): Part[] => {
  const saved = localStorage.getItem(PARTS_STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as Part[]) : [];
  } catch {
    return [];
  }
};

export interface EntriesStore {
  entries: Mapping[];
  parts: Part[];
  updateEntry: (id: string, patch: Partial<Mapping>) => void;
  toggleNvc: (id: string, need: string) => void;
  addEntries: (entries: Mapping[]) => void;
  addBlank: () => void;
  deleteEntry: (id: string) => void;
  replaceAll: (loaded: Mapping[]) => void;
  upsertPart: (rawName: string) => string | null;
  setEntries: React.Dispatch<React.SetStateAction<Mapping[]>>;
}

/**
 * Single owner of the entries + parts data layer. Bridges three mirrors:
 * localStorage (durable on-device), the React state used by the UI, and the
 * Yjs maps used for optional peer sync. All writes go through here so the
 * three stay consistent.
 */
export const useEntries = (): EntriesStore => {
  const [entries, setEntries] = useState<Mapping[]>(readEntries);
  const [parts, setParts] = useState<Part[]>(readParts);
  const partsRef = useRef(parts);
  partsRef.current = parts;

  // Mirror state to localStorage on change.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(PARTS_STORAGE_KEY, JSON.stringify(parts));
  }, [parts]);

  // INBOUND: remote Yjs updates → React state. Local-origin transactions are
  // ignored so we don't echo our own writes back through setState. Order is
  // anchored to local UI order — Y.Map iteration order is insertion order on
  // the *originating* peer, which isn't necessarily the user's list order.
  // Existing entries keep their slot; remote-added entries land at the end.
  useEffect(() => {
    const handleRemoteEntries = (_event: unknown, txn: { local: boolean }) => {
      if (txn.local) return;
      setEntries((prev) => {
        const next: Mapping[] = [];
        const seen = new Set<string>();
        for (const e of prev) {
          const fresh = yEntriesMap.get(e.id) as Mapping | undefined;
          if (fresh) {
            next.push(fresh);
            seen.add(e.id);
          }
        }
        yEntriesMap.forEach((mapping, id) => {
          if (!seen.has(id)) next.push(mapping as Mapping);
        });
        return next;
      });
    };
    const handleRemoteParts = (_event: unknown, txn: { local: boolean }) => {
      if (txn.local) return;
      setParts((prev) => {
        const next: Part[] = [];
        const seen = new Set<string>();
        for (const p of prev) {
          const fresh = yPartsMap.get(p.id) as Part | undefined;
          if (fresh) {
            next.push(fresh);
            seen.add(p.id);
          }
        }
        yPartsMap.forEach((part, id) => {
          if (!seen.has(id)) next.push(part as Part);
        });
        return next;
      });
    };
    yEntriesMap.observe(handleRemoteEntries);
    yPartsMap.observe(handleRemoteParts);
    return () => {
      yEntriesMap.unobserve(handleRemoteEntries);
      yPartsMap.unobserve(handleRemoteParts);
    };
  }, []);

  // HOST SEEDING: on first paint, mirror locally-persisted data into the
  // shared Yjs maps if they're still empty. Runs once; not on every change.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    ydoc.transact(() => {
      if (yEntriesMap.size === 0) {
        entries.forEach((m) => yEntriesMap.set(m.id, m));
      }
      if (yPartsMap.size === 0) {
        parts.forEach((p) => yPartsMap.set(p.id, p));
      }
    }, "local");
  }, [entries, parts]);

  const updateEntry = useCallback((id: string, patch: Partial<Mapping>) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, ...patch };
        ydoc.transact(() => yEntriesMap.set(id, updated), "local");
        return updated;
      }),
    );
  }, []);

  const toggleNvc = useCallback((id: string, need: string) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const cur = e.nvcNeeds ?? [];
        const nvcNeeds = cur.includes(need)
          ? cur.filter((n) => n !== need)
          : [...cur, need];
        const updated = { ...e, nvcNeeds };
        ydoc.transact(() => yEntriesMap.set(id, updated), "local");
        return updated;
      }),
    );
  }, []);

  const addEntries = useCallback((newEntries: Mapping[]) => {
    if (newEntries.length === 0) return;
    ydoc.transact(() => {
      newEntries.forEach((m) => yEntriesMap.set(m.id, m));
    }, "local");
    setEntries((prev) => [...prev, ...newEntries]);
  }, []);

  const addBlank = useCallback(() => {
    const blank: Mapping = {
      id: crypto.randomUUID(),
      value: "",
      need: "",
      friction: "",
    };
    ydoc.transact(() => yEntriesMap.set(blank.id, blank), "local");
    setEntries((prev) => [...prev, blank]);
  }, []);

  const deleteEntry = useCallback((id: string) => {
    ydoc.transact(() => yEntriesMap.delete(id), "local");
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const replaceAll = useCallback((loaded: Mapping[]) => {
    ydoc.transact(() => {
      yEntriesMap.clear();
      loaded.forEach((m) => yEntriesMap.set(m.id, m));
    }, "local");
    setEntries(loaded);
  }, []);

  // Resolves a typed Part name to a stable id. Case-insensitive lookup against
  // existing parts; creates a new one when no match exists. Empty input
  // returns null and is treated as "clear the tag".
  const upsertPart = useCallback((rawName: string): string | null => {
    const name = rawName.trim();
    if (!name) return null;
    const lower = name.toLowerCase();
    const existing = partsRef.current.find(
      (p) => p.name.trim().toLowerCase() === lower,
    );
    if (existing) return existing.id;
    const next: Part = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
    };
    ydoc.transact(() => yPartsMap.set(next.id, next), "local");
    setParts((prev) => [...prev, next]);
    return next.id;
  }, []);

  return {
    entries,
    parts,
    updateEntry,
    toggleNvc,
    addEntries,
    addBlank,
    deleteEntry,
    replaceAll,
    upsertPart,
    setEntries,
  };
};
