import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
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

export interface SyncConfig {
  roomName: string;
  secretKey: string;
}

/**
 * Initializes the encrypted peer-to-peer WebRTC connection.
 * @param config Contains the room string and encryption passphrase.
 */
export const connectWebRTC = (config: SyncConfig): void => {
  // If we are already broadcasting to this exact room, do nothing
  if (provider && currentRoom === config.roomName) {
    return;
  }

  if (provider) {
    provider.disconnect();
    provider.destroy(); // Explicitly clear internal Yjs listeners
    provider = null;
  }

  currentRoom = config.roomName;

  provider = new WebrtcProvider(config.roomName, ydoc, {
    password: config.secretKey,
    signaling: import.meta.env.DEV
      ? ["ws://localhost:4444"]
      : [import.meta.env.VITE_FLYIO_RELAY].filter(Boolean) as string[],
  });

  provider.connect();
};

/**
 * Drops active signaling networks instantly.
 */
export const disconnectWebRTC = (): void => {
  if (provider) {
    provider.disconnect();
    provider.destroy();
    provider = null;
    currentRoom = null;
  }
};

/**
 * Generates runtime verification state for device metrics mirrors.
 */
export const isSyncing = (): boolean => provider !== null;
