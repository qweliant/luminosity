import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useLedger } from './useLedger';
import { useSpaces } from './useSpaces';
import { useRoute, type Route } from './router';
import { ListView } from './components/ListView';
import { CoverageView } from './components/CoverageView';
import { SharedView } from './components/SharedView';
import { ConnectOverlay } from './components/ConnectOverlay';
import { AmbientRings, RingPair } from './components/rings';
import {
  connectWithCode, getSyncState, resumeSync, subscribeSync, takePairCodeFromUrl,
  takeSpaceCodeFromUrl,
} from './services/sync';
import type { SyncState } from './services/sync';

const TABS: Array<{ id: Route; label: string }> = [
  { id: 'needs', label: 'needs' },
  { id: 'coverage', label: 'coverage' },
  { id: 'shared', label: 'shared' },
];

const DOT: Record<SyncState, string> = {
  off: 'bg-mauve/40',
  waiting: 'bg-[#C08A3E]',
  linked: 'bg-[#5B8C6E]',
  error: 'bg-rose',
};

export default function App() {
  const ledger = useLedger();
  const spaces = useSpaces();
  const [route, go] = useRoute();
  const [connecting, setConnecting] = useState(false);
  const [invite, setInvite] = useState<string | null>(null);
  const deviceState = useSyncExternalStore<SyncState>(
    subscribeSync, getSyncState, () => 'off',
  );

  // A code in the address bar wins over the stored one — following a pair link
  // is an explicit instruction to join *that* ledger. The code is scrubbed from
  // the URL as it is read, so it doesn't survive in history or a screenshot.
  // Two kinds of link can land here, and they must never be confused: `?pair=`
  // joins one of my own devices to my ledger, `?space=` is someone inviting me
  // into a space with them. The second one opens a confirmation rather than
  // connecting, because a code alone doesn't say whose it is.
  useEffect(() => {
    const space = takeSpaceCodeFromUrl();
    if (space) {
      setInvite(space);
      setConnecting(true);
      resumeSync();
      return;
    }
    const pair = takePairCodeFromUrl();
    if (pair) void connectWithCode(pair);
    else resumeSync();
  }, []);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <AmbientRings />

      <main
        className="relative z-10 mx-auto max-w-2xl px-5 pb-24"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        <header className="pt-2 pb-6">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="translate-y-1">
              <RingPair size={34} />
            </span>
            <h1 className="font-serif text-3xl text-ink">Needs &amp; People</h1>
            <span className="font-serif text-xs text-mauve italic">
              a quieter, smaller ledger
            </span>
          </div>

          <nav className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                aria-current={route === t.id ? 'page' : undefined}
                className={`min-h-11 font-mono text-[10px] tracking-[0.18em] uppercase ${
                  route === t.id
                    ? 'text-rose underline decoration-rose/40 underline-offset-[6px]'
                    : 'text-mauve'
                }`}
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={() => { setInvite(null); setConnecting(true); }}
              className="ml-auto flex min-h-11 items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-mauve uppercase"
            >
              <span className={`size-2 rounded-full ${DOT[deviceState]}`} aria-hidden="true" />
              connect
            </button>
          </nav>
        </header>

        {route === 'needs' ? (
          <ListView
            {...ledger}
            spaceFor={spaces.spaceFor}
            propose={spaces.propose}
            onNeedSpace={() => go('shared')}
          />
        ) : route === 'coverage' ? (
          <CoverageView
            needs={ledger.needs}
            arrangements={ledger.arrangements}
            people={ledger.people}
          />
        ) : (
          <SharedView
            people={ledger.people}
            me={spaces.me}
            setMyName={spaces.setMyName}
            spaceFor={spaces.spaceFor}
            onConnect={() => { setInvite(null); setConnecting(true); }}
            accept={spaces.accept}
            revise={spaces.revise}
            endAgreement={spaces.endAgreement}
          />
        )}
      </main>

      {connecting && (
        <ConnectOverlay
          onClose={() => { setConnecting(false); setInvite(null); }}
          onOpenShared={() => { setConnecting(false); setInvite(null); go('shared'); }}
          people={ledger.people}
          addPerson={ledger.addPerson}
          spaceFor={spaces.spaceFor}
          createSpace={spaces.createSpace}
          linkSpace={spaces.linkSpace}
          leaveSpace={spaces.leaveSpace}
          pendingSpaceCode={invite}
        />
      )}
    </div>
  );
}
