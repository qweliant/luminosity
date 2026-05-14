// Lightweight hash-based router. Zero dependencies — just enough for four
// routes (list, matrix, focus/<id>, methods) so the back button works, focus
// mode survives a refresh, and the methods page has its own URL.
//
// We use hash routing (rather than History API) deliberately: Luminosity is
// served as a static bundle and may be opened from `file://` for printing.
// Hashes work in both contexts.

import { useEffect, useState } from 'react';

export type Route =
  | { name: 'list' }
  | { name: 'matrix' }
  | { name: 'methods' }
  | { name: 'focus'; id: string };

export const parseHash = (hash: string): Route => {
  const h = hash.replace(/^#\/?/, '').trim();
  if (!h) return { name: 'list' };
  if (h === 'matrix') return { name: 'matrix' };
  if (h === 'methods') return { name: 'methods' };
  const m = h.match(/^focus\/(.+)$/);
  if (m && m[1]) return { name: 'focus', id: decodeURIComponent(m[1]) };
  return { name: 'list' };
};

export const routeToHash = (r: Route): string => {
  switch (r.name) {
    case 'list':
      return '#/';
    case 'matrix':
      return '#/matrix';
    case 'methods':
      return '#/methods';
    case 'focus':
      return `#/focus/${encodeURIComponent(r.id)}`;
  }
};

export const useHashRoute = (): [Route, (r: Route) => void] => {
  const [route, setRoute] = useState<Route>(() =>
    typeof location !== 'undefined' ? parseHash(location.hash) : { name: 'list' },
  );

  useEffect(() => {
    const onHash = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (r: Route) => {
    const next = routeToHash(r);
    if (location.hash !== next) {
      location.hash = next;
    }
  };

  return [route, navigate];
};

// Pop one entry off history if there's a previous in-app step to return to,
// otherwise navigate to a sensible default. Used when closing the focus
// overlay — if the user got there by clicking "Focus →" we want the browser
// back button equivalent; if they deep-linked to `#/focus/<id>` we just
// route them to the list.
export const goBackOr = (fallback: Route) => {
  // history.length is unreliable across sessions, but `> 1` is a decent proxy
  // for "the user clicked something to get here within this session."
  if (window.history.length > 1) {
    window.history.back();
  } else {
    location.hash = routeToHash(fallback);
  }
};
