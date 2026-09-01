import * as Y from "yjs";
// y-webrtc pulls in simple-peer and a stack of WebRTC polyfills (~30 kB gzip
// after tree-shake). Defer the runtime import to keep that weight out of the
// initial bundle — sync isn't on the critical path for the list view.
import type { WebrtcProvider } from "y-webrtc";
import type { Mapping, Part } from "../types";
import {
  derivePassword,
  deriveRoom,
  loadPairing,
  savePairing,
  clearPairing,
} from "./pairing";

// Establish the singleton application state source
export const ydoc = new Y.Doc();

// Expose the typed top-level mappings container
export const yEntriesMap = ydoc.getMap<Mapping>("entries");

// IFS Parts — user-named identities, referenced by Mapping.partId. Lives in
// the same ydoc so sync is symmetric with entries.
export const yPartsMap = ydoc.getMap<Part>("parts");

// Track active connection state safely
let provider: WebrtcProvider | null = null;
let currentCode: string | null = null;
let detachAwareness: (() => void) | null = null;
let lastError: string | null = null;

export interface PeerPresence {
  /** Best-effort label for the peer's device, derived from UA. */
  device: string;
  /** Unix ms when the peer joined this awareness session. */
  joinedAt: number;
}

/**
 * The three states a person can actually be in, named the way they'd describe
 * them. `waiting` is the important one: the previous build collapsed it into
 * "Live", so the header went green the moment the engine started even though
 * nothing was on the other end. A status light that can't tell you the
 * difference between "on" and "working" is the reason sync felt unknowable.
 */
export type SyncState = "off" | "waiting" | "linked" | "error";

const listeners = new Set<() => void>();
const notify = () => {
  for (const cb of listeners) cb();
};

/** One subscription for every user-visible fact about sync. */
export const subscribeSync = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const guessDeviceLabel = (): string => {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iPad/.test(ua)) return "iPad";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android phone";
  if (/Macintosh|Mac OS X/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
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
      device:
        typeof state?.device === "string" ? state.device : "another device",
      joinedAt: typeof state?.joinedAt === "number" ? state.joinedAt : 0,
    });
  });
  return out;
};

/**
 * "Linked" means another device is genuinely present in the room, not merely
 * that we opened a socket. Everything the UI shows keys off this.
 */
export const getSyncState = (): SyncState => {
  if (lastError) return "error";
  if (!provider) return "off";
  return getPeerPresences().length > 0 ? "linked" : "waiting";
};

export const getSyncError = (): string | null => lastError;

/** The code this device is currently paired with, if any. */
export const getActiveCode = (): string | null => currentCode;

const signalingUrls = (): string[] =>
  import.meta.env.DEV
    ? ["ws://localhost:4444"]
    : ([import.meta.env.VITE_FLYIO_RELAY].filter(Boolean) as string[]);

/**
 * Joins the room a code maps to. There is no host and no guest — both devices
 * run exactly this, and whoever arrives second finds the other already there.
 *
 * Async because y-webrtc and the SHA derivation are both dynamic; callers can
 * fire-and-forget, since every outcome lands on a subscriber notification.
 */
export const connectWithCode = async (code: string): Promise<void> => {
  if (provider && currentCode === code) return;
  if (provider) teardownProvider();

  currentCode = code;
  lastError = null;
  notify();

  const signaling = signalingUrls();
  if (signaling.length === 0) {
    // Better to say so than to spin forever on a status light that never
    // resolves. Happens when VITE_FLYIO_RELAY is missing from a prod build.
    lastError = "No relay configured for this build, so devices can't find each other.";
    currentCode = null;
    notify();
    return;
  }

  try {
    const [{ WebrtcProvider }, room, password] = await Promise.all([
      import("y-webrtc"),
      deriveRoom(code),
      derivePassword(code),
    ]);

    // The user could have disconnected (or paired with a different code)
    // between issuing the import and its resolution. Bail if so.
    if (currentCode !== code) return;

    provider = new WebrtcProvider(room, ydoc, { password, signaling });
    provider.on("status", notify);

    // Announce ourselves so the other device can name us in its header.
    provider.awareness.setLocalState({
      device: guessDeviceLabel(),
      joinedAt: Date.now(),
    });
    provider.awareness.on("change", notify);
    const own = provider;
    detachAwareness = () => {
      own.awareness.off("change", notify);
      own.awareness.setLocalState(null);
    };

    provider.connect();
    savePairing({ code, enabled: true });
  } catch (err) {
    lastError =
      err instanceof Error ? err.message : "Couldn't start syncing on this device.";
    currentCode = null;
  }

  notify();
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
 * Stops syncing on this device. `forget` also drops the stored code, so this
 * device won't rejoin on the next load and the code has to be re-entered.
 */
export const stopSync = (forget = false): void => {
  teardownProvider();
  const code = currentCode;
  currentCode = null;
  lastError = null;
  if (forget) clearPairing();
  else if (code) savePairing({ code, enabled: false });
  notify();
};

/**
 * Rejoins on page load if this device was syncing when it was last closed.
 * Without this, every reload silently unpaired the device — the single biggest
 * reason sync felt like it kept starting over.
 */
export const resumeSync = (): void => {
  const stored = loadPairing();
  if (stored?.enabled) void connectWithCode(stored.code);
};
