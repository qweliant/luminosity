import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import type { Mapping } from "../types";

// Establish the singleton application state source
export const ydoc = new Y.Doc();

// Expose the typed top-level mappings container
export const yEntriesMap = ydoc.getMap<Mapping>("entries");

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

  // Swap out the dead public relays for your blazing fast local node
  provider = new WebrtcProvider(config.roomName, ydoc, {
    password: config.secretKey,
    signaling: [
      "ws://localhost:4444",
      "wss://signaling.yjs.dev",
      "wss://y-webrtc-signaling-eu.herokuapp.com",
    ],
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
