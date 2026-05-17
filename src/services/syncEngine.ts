import * as Y from "yjs";
// y-webrtc pulls in simple-peer and a stack of WebRTC polyfills (~30 kB gzip
// after tree-shake). Defer the runtime import to keep that weight out of the
// initial bundle — sync isn't on the critical path for the list view.
import type { WebrtcProvider } from "y-webrtc";
import type { Mapping, Part } from "../types";

// Establish the singleton application state source
export const ydoc = new Y.Doc();

// Expose the typed top-level mappings container
export const yEntriesMap = ydoc.getMap<Mapping>("entries");

// IFS Parts — user-named identities, referenced by Mapping.partId. Lives in
// the same ydoc so sync is symmetric with entries.
export const yPartsMap = ydoc.getMap<Part>("parts");

// Track active connection state safely
let provider: WebrtcProvider | null = null;
let currentRoom: string | null = null;
let detachAwareness: (() => void) | null = null;

export interface SyncConfig {
  roomName: string;
  secretKey: string;
}

export interface PeerPresence {
  /** Best-effort label for the peer's device, derived from UA. */
  device: string;
  /** Unix ms when the peer joined this awareness session. */
  joinedAt: number;
}

// Listeners that want to be told when the sync status flips. We notify on
// explicit connect/disconnect and on the provider's own `status` event so the
// UI doesn't lie when the underlying WebRTC link drops.
const statusListeners = new Set<() => void>();
const notifyStatus = () => {
  for (const cb of statusListeners) cb();
};

export const subscribeSyncStatus = (cb: () => void): (() => void) => {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
};

// Awareness: who else is connected to the same room. We use this to surface
// "also editing on iPad" in the header so the user knows when another of
// their own devices is live. See [[sync-model-single-editor]].
const awarenessListeners = new Set<() => void>();
const notifyAwareness = () => {
  for (const cb of awarenessListeners) cb();
};

export const subscribeAwareness = (cb: () => void): (() => void) => {
  awarenessListeners.add(cb);
  return () => awarenessListeners.delete(cb);
};

const guessDeviceLabel = (): string => {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iPad/.test(ua)) return "iPad";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh|Mac OS X/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  return "another device";
};

export const getPeerPresences = (): PeerPresence[] => {
  if (!provider) return [];
  const myId = provider.awareness.clientID;
  const out: PeerPresence[] = [];
  provider.awareness.getStates().forEach((state, clientId) => {
    if (clientId === myId) return;
    out.push({
      device: typeof state?.device === "string" ? state.device : "another device",
      joinedAt: typeof state?.joinedAt === "number" ? state.joinedAt : 0,
    });
  });
  return out;
};

/**
 * Initializes the encrypted peer-to-peer WebRTC connection. Async because
 * we dynamically import y-webrtc here — keeps the WebRTC stack out of the
 * initial bundle. Callers can fire-and-forget.
 */
export const connectWebRTC = async (config: SyncConfig): Promise<void> => {
  // If we are already broadcasting to this exact room, do nothing
  if (provider && currentRoom === config.roomName) {
    return;
  }

  if (provider) {
    teardownProvider();
  }

  currentRoom = config.roomName;

  const { WebrtcProvider } = await import("y-webrtc");

  // The user could have disconnected (or reconnected to a different room)
  // between issuing the import and its resolution. Bail if so.
  if (currentRoom !== config.roomName) return;

  provider = new WebrtcProvider(config.roomName, ydoc, {
    password: config.secretKey,
    signaling: import.meta.env.DEV
      ? ["ws://localhost:4444"]
      : [import.meta.env.VITE_FLYIO_RELAY].filter(Boolean) as string[],
  });

  provider.on("status", notifyStatus);

  // Announce ourselves so other devices in the same room can show a presence
  // chip. We tear this down in disconnectWebRTC.
  provider.awareness.setLocalState({
    device: guessDeviceLabel(),
    joinedAt: Date.now(),
  });
  const onAwarenessChange = () => notifyAwareness();
  provider.awareness.on("change", onAwarenessChange);
  const ownProvider = provider;
  detachAwareness = () => {
    ownProvider.awareness.off("change", onAwarenessChange);
    ownProvider.awareness.setLocalState(null);
  };

  provider.connect();
  notifyStatus();
  notifyAwareness();
};

const teardownProvider = () => {
  if (!provider) return;
  if (detachAwareness) {
    detachAwareness();
    detachAwareness = null;
  }
  provider.disconnect();
  provider.destroy();
  provider = null;
};

/**
 * Drops active signaling networks instantly.
 */
export const disconnectWebRTC = (): void => {
  if (!provider) return;
  teardownProvider();
  currentRoom = null;
  notifyStatus();
  notifyAwareness();
};

/**
 * Generates runtime verification state for device metrics mirrors.
 */
export const isSyncing = (): boolean => provider?.connected ?? false;
