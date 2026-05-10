const BASE = 'http://127.0.0.1:5174';
const FETCH_TIMEOUT_MS = 4000;

export interface Snapshot {
  id: number;
  createdAt: number;
  count: number;
}

export interface SnapshotFull extends Snapshot {
  entries: unknown[];
}

const fetchWithTimeout = async (input: string, init: RequestInit = {}): Promise<Response> => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
};

export const ping = async (): Promise<boolean> => {
  try {
    const r = await fetchWithTimeout(`${BASE}/api/health`);
    return r.ok;
  } catch {
    return false;
  }
};

export const createSnapshot = async (entries: unknown[]): Promise<Snapshot> => {
  const r = await fetchWithTimeout(`${BASE}/api/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
  });
  if (!r.ok) throw new Error(`snapshot failed: ${r.status}`);
  return r.json();
};

export const listSnapshots = async (): Promise<Snapshot[]> => {
  const r = await fetchWithTimeout(`${BASE}/api/snapshots`);
  if (!r.ok) throw new Error(`list failed: ${r.status}`);
  return r.json();
};

export const fetchSnapshot = async (id: number): Promise<SnapshotFull> => {
  const r = await fetchWithTimeout(`${BASE}/api/snapshots/${id}`);
  if (!r.ok) throw new Error(`fetch failed: ${r.status}`);
  return r.json();
};

export const relTime = (ts: number): string => {
  const diff = Date.now() - ts;
  const s = Math.round(diff / 1000);
  if (s < 30) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
};
