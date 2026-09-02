// Shared spaces: documents with more than one *person* in them.
//
// Everything in sync.ts is built on an assumption that stops holding here —
// one human across their own devices, so whole-object last-write-wins is fine
// because that human is not editing the same row in two places at once. Two
// people absolutely are. So a shared space is a different document with a
// different room, and the data put into it has to be shaped for concurrent
// writers rather than retrofitted.
//
// The rule for anything stored in here: append, never mutate. Yjs merges
// concurrent inserts into a Y.Array without losing either side. It cannot do
// the same for two peers overwriting the same object, which is exactly how the
// private ledger would drop one of them.
//
// This is additive. sync.ts and its singleton are untouched, because the
// private ledger's model is still correct for what it does.

import * as Y from "yjs";
import type { WebrtcProvider } from "y-webrtc";
import { deriveRoom, derivePassword } from "./pairing";
import { getRelays } from "./sync";
import type { SyncState } from "./sync";

export interface SharedSpace {
  /** The document. Callers own its schema, the same as with the private doc. */
  doc: Y.Doc;
  getState(): SyncState;
  getError(): string | null;
  subscribe(cb: () => void): () => void;
  /** Leaves the room and tears down the document. */
  close(): void;
}

// One space per code, so two callers asking for the same space get the same
// document rather than two rival copies of it in the same tab.
const spaces = new Map<string, SharedSpace>();

export const openSharedSpace = (code: string): SharedSpace => {
  const existing = spaces.get(code);
  if (existing) return existing;

  const doc = new Y.Doc();
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const cb of listeners) cb();
  };

  let provider: WebrtcProvider | null = null;
  let error: string | null = null;
  let peers = 0;

  const space: SharedSpace = {
    doc,
    getState: () => {
      if (error) return "error";
      if (!provider) return "off";
      return peers > 0 ? "linked" : "waiting";
    },
    getError: () => error,
    subscribe: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    close: () => {
      spaces.delete(code);
      if (provider) {
        provider.awareness.setLocalState(null);
        provider.disconnect();
        provider.destroy();
        provider = null;
      }
      doc.destroy();
      listeners.clear();
    },
  };

  spaces.set(code, space);

  void (async () => {
    const relays = getRelays();
    if (relays.length === 0) {
      // Same failure the private ledger guards against: better to say so than
      // to spin on a status light that never resolves.
      error = "No relay configured for this build, so this space can't connect.";
      notify();
      return;
    }
    try {
      const [{ WebrtcProvider: Provider }, room, password] = await Promise.all([
        import("y-webrtc"),
        deriveRoom(code),
        derivePassword(code),
      ]);

      // The caller may have closed the space while the dynamic import resolved.
      if (!spaces.has(code)) return;

      const p = new Provider(room, doc, { password, signaling: relays });
      provider = p;
      p.awareness.setLocalState({ joinedAt: Date.now() });
      p.awareness.on("change", () => {
        peers = p.awareness.getStates().size - 1;
        notify();
      });
      p.on("status", notify);
      p.connect();
    } catch (err) {
      error =
        err instanceof Error ? err.message : "Couldn't open this shared space.";
    }
    notify();
  })();

  return space;
};

/** Closes every open space. For teardown, not for ordinary use. */
export const closeAllSharedSpaces = (): void => {
  for (const space of [...spaces.values()]) space.close();
};
