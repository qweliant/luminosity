// Pairing surface. Deliberately smaller than the values ledger's overlay — no
// QR, no mascots — because the thing people actually need from sync is an
// honest answer to "is my phone talking to my laptop right now".

import React, { useState, useSyncExternalStore } from 'react';
import type { SyncState } from '../services/sync';
import {
  connectWithCode,
  generateCode,
  getActiveCode,
  getSyncError,
  getSyncState,
  loadPairing,
  normalizeCode,
  stopSync,
  subscribeSync,
} from '../services/sync';
import { Label, buttonClass, inputClass, linkClass, quietButtonClass } from './primitives';

// "waiting" is the state worth naming: a link that is on but has nobody on the
// other end is not the same as a link that is working, and collapsing the two
// is what makes sync feel unknowable.
// Short enough to sit in the nav. The panel says the longer version.
const STATE_LABEL: Record<SyncState, string> = {
  off: 'not syncing',
  waiting: 'waiting',
  linked: 'linked',
  error: 'problem',
};

const STATE_DOT: Record<SyncState, string> = {
  off: 'bg-mauve/40',
  waiting: 'bg-[#C08A3E]',
  linked: 'bg-[#5B8C6E]',
  error: 'bg-rose',
};

export const SyncPanel = () => {
  const state = useSyncExternalStore<SyncState>(
    subscribeSync,
    getSyncState,
    () => 'off',
  );
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState('');

  const active = getActiveCode() ?? loadPairing()?.code ?? null;
  const error = getSyncError();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-mauve uppercase"
        aria-expanded={open}
      >
        <span className={`size-2 rounded-full ${STATE_DOT[state]}`} aria-hidden="true" />
        {STATE_LABEL[state]}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2.5rem))] space-y-3 rounded-2xl border border-ink/10 bg-cream p-4 shadow-lg shadow-ink/5">
          <p className="font-serif text-base leading-relaxed text-mauve italic">
            One code per ledger. Any device that has it shares this ledger — there
            is no host and no guest, so enter the same code on both.
          </p>

          {active && (
            <div>
              <Label>This ledger's code</Label>
              <code className="mt-1 block font-mono text-sm break-all text-ink">{active}</code>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <input
              className={`${inputClass} flex-1 basis-48`}
              placeholder="Paste a code"
              value={entered}
              onChange={(e) => setEntered(e.target.value)}
            />
            <button
              className={buttonClass}
              disabled={!entered.trim()}
              onClick={() => {
                // normalizeCode accepts a full pair URL, spaced words or mixed
                // case, and returns null when none of it parses as a code.
                const code = normalizeCode(entered);
                if (!code) return;
                void connectWithCode(code);
                setEntered('');
              }}
            >
              Link
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {!active && (
              <button
                className={quietButtonClass}
                onClick={() => void connectWithCode(generateCode())}
              >
                Start a new ledger code
              </button>
            )}
            {state !== 'off' && (
              <button className={quietButtonClass} onClick={() => stopSync()}>
                Stop syncing
              </button>
            )}
            {active && state === 'off' && (
              <button
                className={quietButtonClass}
                onClick={() => void connectWithCode(active)}
              >
                Reconnect
              </button>
            )}
          </div>

          {error && <p className="font-sans text-[13px] text-rose">{error}</p>}

          <p className="font-serif text-sm leading-relaxed text-mauve italic">
            Linking two devices merges both into one ledger — nothing is erased on
            either side.
          </p>
        </div>
      )}
    </div>
  );
};
