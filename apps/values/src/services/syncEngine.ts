// This app's binding to the shared sync substrate.
//
// @luminosity/ledger-core owns the document and the transport; what hangs off
// the document is this app's business. Everything the rest of the app already
// imported from here is re-exported, so no call site changed when the
// transport moved into a package.

import type { Mapping, Part } from "../types";
import { configureSync, ydoc } from "@luminosity/ledger-core";

// Expose the typed top-level mappings container
export const yEntriesMap = ydoc.getMap<Mapping>("entries");

// IFS Parts — user-named identities, referenced by Mapping.partId. Lives in
// the same ydoc so sync is symmetric with entries.
export const yPartsMap = ydoc.getMap<Part>("parts");

// `import.meta.env` resolves per bundle, so the relay has to be handed to the
// package from inside the app rather than read from within it.
configureSync({
  relays: import.meta.env.DEV
    ? ["ws://localhost:4444"]
    : ([import.meta.env.VITE_FLYIO_RELAY].filter(Boolean) as string[]),
});

export {
  ydoc,
  connectWithCode,
  stopSync,
  resumeSync,
  subscribeSync,
  getSyncState,
  getSyncError,
  getActiveCode,
  getPeerPresences,
} from "@luminosity/ledger-core";
export type { SyncState, PeerPresence } from "@luminosity/ledger-core";
