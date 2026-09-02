// This app's binding to the shared sync substrate.
//
// Three maps, one per store, all hanging off the single document owned by
// @luminosity/ledger-core. Values keyed by id hold whole objects, which means
// conflict resolution is per-object last-write-wins — fine here for the same
// reason it's fine in the values ledger: this is one person across their own
// devices. The moment a second *person* writes, that assumption is gone, which
// is exactly why agreements are a separate shared document and not a fourth
// map in here.

import { configureSync, ydoc } from '@luminosity/ledger-core';
import type { Arrangement, Need, Person } from '../types';

export const yPeople = ydoc.getMap<Person>('people');
export const yNeeds = ydoc.getMap<Need>('needs');
export const yArrangements = ydoc.getMap<Arrangement>('arrangements');

// `import.meta.env` resolves per bundle, so the relay is handed to the package
// from here rather than read from inside it.
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
      ? ['ws://localhost:4444']
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
  generateCode,
  normalizeCode,
  loadPairing,
  pairUrl,
  spaceUrl,
  takePairCodeFromUrl,
  takeSpaceCodeFromUrl,
  getRelayHealth,
  subscribeRelayHealth,
  probeRelay,
  relayUrl,
} from '@luminosity/ledger-core';
export type { SyncState, PeerPresence, RelayHealth } from '@luminosity/ledger-core';
