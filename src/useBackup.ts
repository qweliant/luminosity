import { useEffect, useRef, useState } from 'react';
import type { Mapping } from './types';
import {
  createSnapshot,
  fetchSnapshot,
  listSnapshots,
  ping,
  type Snapshot,
} from './backup';

const AUTO_DEBOUNCE_MS = 5000;
const PING_INTERVAL_MS = 30_000;

export type ServerStatus = 'unknown' | 'online' | 'offline';

export interface BackupState {
  status: ServerStatus;
  lastSnapshot: Snapshot | null;
  snapshots: Snapshot[];
  inFlight: boolean;
  refresh: () => Promise<void>;
  snapshotNow: () => Promise<void>;
  restore: (id: number) => Promise<Mapping[] | null>;
}

export const useBackup = (entries: Mapping[]): BackupState => {
  const [status, setStatus] = useState<ServerStatus>('unknown');
  const [lastSnapshot, setLastSnapshot] = useState<Snapshot | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [inFlight, setInFlight] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRunRef = useRef(true);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const refresh = async () => {
    try {
      const list = await listSnapshots();
      setSnapshots(list);
      setLastSnapshot(list[0] ?? null);
      setStatus('online');
    } catch {
      setStatus('offline');
    }
  };

  const snapshotNow = async () => {
    const current = entriesRef.current;
    if (current.length === 0) return;
    setInFlight(true);
    try {
      const snap = await createSnapshot(current);
      setLastSnapshot(snap);
      setSnapshots(prev => [snap, ...prev].slice(0, 50));
      setStatus('online');
    } catch {
      setStatus('offline');
    } finally {
      setInFlight(false);
    }
  };

  const restore = async (id: number): Promise<Mapping[] | null> => {
    try {
      const full = await fetchSnapshot(id);
      setStatus('online');
      return full.entries as Mapping[];
    } catch {
      setStatus('offline');
      return null;
    }
  };

  // Initial ping + load list, plus periodic re-ping
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await ping();
      if (cancelled) return;
      setStatus(ok ? 'online' : 'offline');
      if (ok) await refresh();
    })();
    const iv = setInterval(async () => {
      const ok = await ping();
      if (!cancelled) setStatus(ok ? 'online' : 'offline');
    }, PING_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  // Debounced auto-backup on entries change
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    if (status !== 'online') return;
    if (entries.length === 0) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      snapshotNow();
    }, AUTO_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [entries, status]);

  return { status, lastSnapshot, snapshots, inFlight, refresh, snapshotNow, restore };
};
