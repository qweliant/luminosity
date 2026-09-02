// Hash-based, dependency-free, two routes. Hashes rather than the History API
// for the same reason the values ledger uses them: this ships as a static
// bundle and needs to survive being opened from anywhere.

import { useCallback, useEffect, useState } from 'react';

export type Route = 'needs' | 'coverage' | 'shared';

export const parseHash = (hash: string): Route => {
  const h = hash.replace(/^#\/?/, '').trim();
  return h === 'coverage' ? 'coverage' : h === 'shared' ? 'shared' : 'needs';
};

export const useRoute = (): [Route, (r: Route) => void] => {
  const [route, setRoute] = useState<Route>(() =>
    parseHash(typeof location === 'undefined' ? '' : location.hash),
  );

  useEffect(() => {
    const onChange = () => setRoute(parseHash(location.hash));
    addEventListener('hashchange', onChange);
    return () => removeEventListener('hashchange', onChange);
  }, []);

  const go = useCallback((r: Route) => {
    location.hash = r === 'needs' ? '/' : `/${r}`;
  }, []);

  return [route, go];
};
