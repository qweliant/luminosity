// The shared substrate: pairing codes and the WebRTC sync lifecycle. Nothing
// here knows what either app stores.
//
// What is deliberately NOT in this package: the desktop-folder backup daemon
// and the sidecar client. Both are generic in their types but bound to one
// app's map name, filename and port, and only the values ledger has a consumer
// for them. Extracting on the second use rather than the first is the rule
// that keeps a two-app repo from turning into a framework.

export {
  ydoc,
  configureSync,
  connectWithCode,
  stopSync,
  resumeSync,
  subscribeSync,
  getSyncState,
  getSyncError,
  getActiveCode,
  getPeerPresences,
} from "./sync";
export type { SyncState, PeerPresence } from "./sync";

export { openSharedSpace, closeAllSharedSpaces } from "./shared";
export type { SharedSpace } from "./shared";

export {
  generateCode,
  normalizeCode,
  deriveRoom,
  derivePassword,
  loadPairing,
  savePairing,
  clearPairing,
  pairUrl,
  takePairCodeFromUrl,
} from "./pairing";
export type { StoredPairing } from "./pairing";
