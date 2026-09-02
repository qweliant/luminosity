// Is the signalling relay actually reachable?
//
// Without this the app has one word — "waiting" — for two completely different
// situations: the other person hasn't arrived yet, or nothing can connect at
// all because the relay is down or unconfigured. They look identical and one
// of them is fixable in five seconds, so telling them apart is worth a probe.
//
// This is deliberately independent of y-webrtc. Its own reconnect loop is
// silent by design, and reading connection state out of it means depending on
// internals; opening one socket ourselves is both simpler and honest.

import { getRelays } from "./sync";

export type RelayHealth = "unknown" | "reachable" | "unreachable";

const PROBE_TIMEOUT_MS = 6000;

let health: RelayHealth = "unknown";
let inFlight: Promise<RelayHealth> | null = null;
const listeners = new Set<() => void>();

const notify = () => {
  for (const cb of listeners) cb();
};

export const getRelayHealth = (): RelayHealth => health;

export const subscribeRelayHealth = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** The relay this build dials, for showing in an error. */
export const relayUrl = (): string | null => getRelays()[0] ?? null;

const openOnce = (url: string): Promise<boolean> =>
  new Promise((resolve) => {
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
      resolve(false);
      return;
    }
    const timer = setTimeout(() => {
      // A socket still connecting after this long is not going to help anyone.
      try { socket.close(); } catch { /* already gone */ }
      resolve(false);
    }, PROBE_TIMEOUT_MS);

    const settle = (ok: boolean) => {
      clearTimeout(timer);
      try { socket.close(); } catch { /* already gone */ }
      resolve(ok);
    };
    socket.onopen = () => settle(true);
    socket.onerror = () => settle(false);
    socket.onclose = () => settle(false);
  });

/**
 * Opens a throwaway socket to the relay. Concurrent callers share one probe,
 * so a screen with several connections on it doesn't open several sockets.
 */
export const probeRelay = async (): Promise<RelayHealth> => {
  if (inFlight) return inFlight;

  const url = relayUrl();
  if (!url) {
    health = "unreachable";
    notify();
    return health;
  }

  inFlight = openOnce(url).then((ok) => {
    health = ok ? "reachable" : "unreachable";
    inFlight = null;
    notify();
    return health;
  });
  return inFlight;
};
