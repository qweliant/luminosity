// Manual import/export of the entries array as a JSON file. The escape hatch
// for the WebRTC sync and the SQLite sidecar — works offline, works without
// a server running, and produces a file the user can airdrop/email/USB
// between devices without trusting anything in between.

import { migrateMapping, type LegacyMapping, type Mapping } from './types';

const FILENAME_PREFIX = 'luminosity';

export const downloadEntriesAsJson = (entries: Mapping[]) => {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = `${FILENAME_PREFIX}-${date}.json`;
  const blob = new Blob([JSON.stringify(entries, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export type BackupParseResult =
  | { ok: true; entries: Mapping[]; skipped: number }
  | { ok: false; reason: string };

// Best-effort parser. Accepts any JSON array whose elements look roughly
// like Mappings (must at least have a string `id`). Runs every accepted
// element through `migrateMapping` so legacy snapshots from older versions
// load cleanly.
export const parseBackupJson = (raw: string): BackupParseResult => {
  if (!raw.trim()) {
    return { ok: false, reason: 'File is empty.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "That doesn't look like JSON." };
  }

  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      reason: 'Expected a list of entries. Got something else.',
    };
  }

  const entries: Mapping[] = [];
  let skipped = 0;
  for (const item of parsed) {
    if (!item || typeof item !== 'object') {
      skipped++;
      continue;
    }
    const id = (item as { id?: unknown }).id;
    if (typeof id !== 'string' || !id) {
      skipped++;
      continue;
    }
    try {
      entries.push(migrateMapping(item as LegacyMapping));
    } catch {
      skipped++;
    }
  }

  if (entries.length === 0) {
    return {
      ok: false,
      reason: 'No valid entries found in that file.',
    };
  }

  return { ok: true, entries, skipped };
};
