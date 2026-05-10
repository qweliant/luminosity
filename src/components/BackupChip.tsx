// Header chip showing live backup status + a dropdown menu listing recent
// snapshots. Self-contained: owns its menu open/close state, the click-
// outside handler, and the relative-time refresh tick. Parent supplies
// data and two action callbacks.

import React, { useEffect, useRef, useState } from 'react';
import { relTime, type Snapshot } from '../backup';
import type { ServerStatus } from '../useBackup';

export const BackupChip = ({
  status,
  lastSnapshot,
  snapshots,
  inFlight,
  onSnapshot,
  onRestore,
}: {
  status: ServerStatus;
  lastSnapshot: Snapshot | null;
  snapshots: Snapshot[];
  inFlight: boolean;
  onSnapshot: () => Promise<void>;
  onRestore: (snap: Snapshot) => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, force] = useState(0);

  // Re-render every 30s so "2m ago" stays roughly fresh while the menu is open
  // or the chip is on screen.
  useEffect(() => {
    const iv = setInterval(() => force(n => n + 1), 30_000);
    return () => clearInterval(iv);
  }, []);

  // Close the menu when clicking anywhere outside the chip.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

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
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-[10px] uppercase tracking-[0.25em] hover:text-black transition-colors min-h-10 flex items-center gap-2 text-pink-500"
        title={status === 'offline' ? 'Run `bun run server` to enable backups' : 'Backup menu'}
      >
        <span className="block w-1.5 h-1.5 rounded-full transition-colors" style={{ backgroundColor: dotColor }} />
        <span>{label}</span>
      </button>

      {open && (
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
