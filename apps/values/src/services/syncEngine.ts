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
  // Dev normally wants a signalling server on localhost — either the npm
  // reference one (`bun run signal`) or the Gleam relay from luminosity_relay,
  // both of which listen on 4444.
  //
  // VITE_RELAY_URL overrides that and points dev straight at a deployed relay.
  // Worth knowing why this matters: y-webrtc connects same-origin tabs through
  // BroadcastChannel with no server at all, so two ordinary tabs appear to
  // work while a private tab — a separate storage partition — silently cannot
  // reach them. That is the one local setup that genuinely needs a relay, and
  // it is exactly the one people use to test two "people".
  relays: import.meta.env.VITE_RELAY_URL
    ? [import.meta.env.VITE_RELAY_URL as string]
    : import.meta.env.DEV
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
