// Everything about connecting, in one place.
//
// This app has two kinds of connection and they are not variations on each
// other — they differ in who is on the other end and what crosses:
//
//   my devices   one ledger on my phone and my laptop. Everything crosses.
//   a person     a space with one other human. Only agreements cross.
//
// Presenting those as one "sync" setting would be the mistake. So the first
// thing this asks is which one you mean, in those words, and every screen
// after it says plainly what the other side will and will not see. An invite
// that does not say what it shares is not an invitation, it is a code.

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Person, RelationContext } from '../types';
import { RELATION_CONTEXTS, canNegotiate } from '../types';
import type { SpaceState } from '../useSpaces';
import type { SyncState } from '../services/sync';
import {
  connectWithCode, generateCode, getActiveCode, getRelayHealth, getSyncError,
  getSyncState, loadPairing, normalizeCode, pairUrl, probeRelay, relayUrl,
  spaceUrl, stopSync, subscribeRelayHealth, subscribeSync,
} from '../services/sync';
import type { RelayHealth } from '../services/sync';
import {
  Label, buttonClass, inputClass, linkClass, quietButtonClass, selectClass,
} from './primitives';
import { RingPair } from './rings';

type View =
  | { name: 'choose' }
  | { name: 'devices' }
  | { name: 'invite'; personId: string | null }
  | { name: 'joining'; code: string }
  | { name: 'joined'; personId: string };

const DOT: Record<SyncState, string> = {
  off: 'bg-mauve/40',
  waiting: 'bg-[#C08A3E]',
  linked: 'bg-[#5B8C6E]',
  error: 'bg-rose',
};

const copy = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * Reachability is checked separately from peer presence, because "waiting"
 * otherwise covers both "they aren't here yet" and "nothing can connect at
 * all". The first is normal; the second is a broken relay, and only one of
 * them is worth doing something about.
 */
const useRelayHealth = (active: boolean): RelayHealth => {
  const health = useSyncExternalStore<RelayHealth>(
    subscribeRelayHealth, getRelayHealth, () => 'unknown',
  );
  useEffect(() => {
    if (!active) return;
    void probeRelay();
    // Re-probe while something is still unresolved, so a relay coming back up
    // clears the warning without needing a reload.
    const timer = setInterval(() => void probeRelay(), 15000);
    return () => clearInterval(timer);
  }, [active]);
  return health;
};

const RelayDown = () => (
  <div className="rounded-2xl border border-rose/25 bg-rose/5 p-4">
    <Label>Can't reach the relay</Label>
    <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-ink/75">
      Nothing will connect until it's back — this isn't the other person being
      slow. Trying {relayUrl() ?? 'no relay at all: this build has none configured'}.
    </p>
    {import.meta.env.DEV && (
      <p className="mt-2 font-mono text-[11px] text-ink/60">bun run signal</p>
    )}
  </div>
);

const StateLine = ({ state, waiting, here, health }: {
  state: SyncState; waiting: string; here: string; health?: RelayHealth;
}) => (
  <div className="flex items-center gap-2 font-sans text-[13px] text-mauve">
    <span
      className={`size-2 rounded-full ${
        state === 'waiting' && health === 'unreachable' ? DOT.error : DOT[state]
      }`}
      aria-hidden="true"
    />
    {state === 'linked' ? here
      : state === 'waiting'
        ? health === 'unreachable' ? "Can't reach the relay" : waiting
      : state === 'error' ? 'Something went wrong' : 'Not connected'}
  </div>
);

/** A code, its link and its QR — the three ways a code actually gets across. */
const Handoff = ({ code, url, label }: { code: string; url: string; label: string }) => {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [failed, setFailed] = useState(false);

  const attempt = async (what: 'code' | 'link', text: string) => {
    const ok = await copy(text);
    setFailed(!ok);
    if (ok) {
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 flex flex-wrap items-start gap-4">
        <div className="rounded-xl bg-white p-2.5">
          <QRCodeSVG value={url} size={116} bgColor="#ffffff" fgColor="#3A1E2A" />
        </div>
        <div className="min-w-0 flex-1 basis-48">
          <code className="block font-mono text-sm break-all text-ink">{code}</code>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={quietButtonClass} onClick={() => attempt('link', url)}>
              {copied === 'link' ? 'copied' : 'copy link'}
            </button>
            <button className={quietButtonClass} onClick={() => attempt('code', code)}>
              {copied === 'code' ? 'copied' : 'copy code'}
            </button>
          </div>
          {failed && (
            <p className="mt-2 font-serif text-sm text-mauve italic">
              Couldn't reach the clipboard — read it out or scan the square.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface Props {
  onClose: () => void;
  /** Closes this and lands on the agreements for a person. */
  onOpenShared: () => void;
  people: Person[];
  addPerson: (name: string, context: RelationContext) => Person;
  spaceFor: (personId: string) => SpaceState | undefined;
  createSpace: (personId: string) => string;
  linkSpace: (personId: string, code: string) => void;
  leaveSpace: (personId: string) => void;
  /** A space code arrived in the URL and is waiting to be accepted. */
  pendingSpaceCode?: string | null;
}

export const ConnectOverlay = (props: Props) => {
  const deviceState = useSyncExternalStore<SyncState>(
    subscribeSync, getSyncState, () => 'off',
  );
  const [view, setView] = useState<View>(
    props.pendingSpaceCode
      ? { name: 'joining', code: props.pendingSpaceCode }
      : { name: 'choose' },
  );
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const health = useRelayHealth(true);

  const shareable = props.people.filter((p) => canNegotiate(p.context));
  const activeCode = getActiveCode() ?? loadPairing()?.code ?? null;
  const openSpaces = shareable.filter((p) => props.spaceFor(p.id) !== undefined);

  const back = () => {
    setView({ name: 'choose' });
    setTyped('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cream">
      <div
        className="mx-auto max-w-xl px-5 pb-16"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between py-3">
          <div className="flex items-baseline gap-2">
            <RingPair size={22} />
            <h2 className="font-serif text-2xl text-ink">
              {view.name === 'devices' ? 'Your other device'
                : view.name === 'invite' ? 'Invite someone'
                : view.name === 'joining' ? "You've been invited"
                : view.name === 'joined' ? "You're in"
                : 'Connect'}
            </h2>
          </div>
          <button className={linkClass} onClick={props.onClose}>close</button>
        </div>

        {view.name !== 'choose' && view.name !== 'joining' && view.name !== 'joined' && (
          <button className={`${linkClass} mb-4`} onClick={back}>← back</button>
        )}

        {/* ---- Which kind of connection is this? ---- */}
        {view.name === 'choose' && (
          <div className="space-y-4">
            <p className="font-serif text-lg leading-relaxed text-mauve italic">
              Two different things share the word "sync" here. They are not the
              same, so pick the one you mean.
            </p>

            <button
              className="w-full border-t border-ink/8 py-5 text-left"
              onClick={() => setView({ name: 'devices' })}
            >
              <div className="font-serif text-xl text-ink">Another of my devices</div>
              <p className="mt-1 font-sans text-[13px] leading-relaxed text-mauve">
                My phone and my laptop showing one ledger. Everything crosses —
                needs, people, requests, all of it. Still only me.
              </p>
              <div className="mt-2">
                <StateLine
                  state={deviceState}
                  waiting="Waiting for your other device"
                  here="Your devices are linked"
                  health={health}
                />
              </div>
            </button>

            <button
              className="w-full border-t border-ink/8 py-5 text-left"
              onClick={() => setView({ name: 'invite', personId: null })}
            >
              <div className="font-serif text-xl text-ink">Someone else</div>
              <p className="mt-1 font-sans text-[13px] leading-relaxed text-mauve">
                A space with one person. Only the agreements the two of you put
                in it cross. Nothing else in this app does.
              </p>
              <p className="mt-2 font-sans text-[13px] text-mauve">
                {openSpaces.length === 0
                  ? 'No spaces open yet'
                  : `${openSpaces.length} open · ${openSpaces
                      .map((p) => p.name)
                      .join(', ')}`}
              </p>
            </button>
          </div>
        )}

        {/* ---- My own devices ---- */}
        {view.name === 'devices' && (
          <div className="space-y-5">
            <p className="font-serif text-lg leading-relaxed text-mauve italic">
              One code for this ledger. Any device holding it shows the same
              ledger — there is no main device and no copy.
            </p>

            <StateLine
              state={deviceState}
              waiting="Waiting for your other device"
              here="Your devices are linked"
              health={health}
            />
            {deviceState === 'waiting' && health === 'unreachable' && <RelayDown />}

            {activeCode ? (
              <Handoff
                code={activeCode}
                url={pairUrl(activeCode)}
                label="Open this on your other device"
              />
            ) : (
              <button
                className={buttonClass}
                onClick={() => void connectWithCode(generateCode())}
              >
                Start syncing this ledger
              </button>
            )}

            <div className="border-t border-ink/8 pt-5">
              <Label>Or paste a code from the other device</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  className={`${inputClass} flex-1 basis-48`}
                  placeholder="four words and four digits"
                  value={typed}
                  onChange={(e) => { setTyped(e.target.value); setError(null); }}
                />
                <button
                  className={buttonClass}
                  disabled={!typed.trim()}
                  onClick={() => {
                    const code = normalizeCode(typed);
                    if (!code) {
                      setError("That doesn't look like a code.");
                      return;
                    }
                    void connectWithCode(code);
                    setTyped('');
                  }}
                >
                  Link
                </button>
              </div>
              {error && <p className="mt-2 font-sans text-[13px] text-rose">{error}</p>}
              <p className="mt-3 font-serif text-sm leading-relaxed text-mauve italic">
                Linking merges both devices into one ledger. Nothing is erased on
                either side.
              </p>
            </div>

            {getSyncError() && (
              <p className="font-sans text-[13px] text-rose">{getSyncError()}</p>
            )}

            {deviceState !== 'off' && (
              <button className={linkClass} onClick={() => stopSync()}>
                stop syncing this device
              </button>
            )}
          </div>
        )}

        {/* ---- Inviting a person ---- */}
        {view.name === 'invite' && (
          <InviteView
            {...props}
            people={shareable}
            personId={view.personId}
            health={health}
            onPick={(personId) => setView({ name: 'invite', personId })}
          />
        )}

        {/* ---- Accepting someone's invitation ---- */}
        {view.name === 'joining' && (
          <JoinView
            code={view.code}
            people={shareable}
            addPerson={props.addPerson}
            linkSpace={props.linkSpace}
            onDone={(personId) => setView({ name: 'joined', personId })}
            onCancel={props.onClose}
          />
        )}

        {/* Accepting and inviting are different jobs, so they cannot share a
            screen. The inviter still has something to do — send the code, wait.
            The person who just accepted is finished: handing them a code to
            send is meaningless, and it reads as being asked to invite someone
            else. They get told they are in, and one way onward. */}
        {view.name === 'joined' && (
          <JoinedView
            person={props.people.find((p) => p.id === view.personId)}
            space={props.spaceFor(view.personId)}
            health={health}
            onOpenShared={props.onOpenShared}
          />
        )}
      </div>
    </div>
  );
};

const InviteView = ({
  people, personId, onPick, addPerson, spaceFor, createSpace, leaveSpace, health,
}: Props & {
  people: Person[];
  personId: string | null;
  health: RelayHealth;
  onPick: (id: string) => void;
}) => {
  const [adding, setAdding] = useState(people.length === 0);
  const [name, setName] = useState('');
  const [context, setContext] = useState<RelationContext>('partner');

  if (!personId) {
    return (
      <div>
        <Label>Who are you inviting?</Label>

        {people.length === 0 && (
          <p className="mt-2 font-serif text-base leading-relaxed text-mauve italic">
            Spaces are for the people you'd actually negotiate with — partners,
            family, close friends.
          </p>
        )}

        <ul className="mt-3">
          {people.map((p) => {
            const space = spaceFor(p.id);
            return (
              <li key={p.id} className="border-t border-ink/8">
                <button
                  className="flex w-full items-baseline justify-between gap-3 py-4 text-left"
                  onClick={() => onPick(p.id)}
                >
                  <span className="font-serif text-xl text-ink">{p.name}</span>
                  <span className="font-sans text-[13px] text-mauve">
                    {space
                      ? space.state === 'linked' ? 'they are here' : 'space open'
                      : 'no space yet'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Adding someone has to be possible from here. Sending them to the
            Needs tab to bury a new person inside an arrangement form, then
            walk back, is not a flow — it is a dead end with directions. */}
        {adding ? (
          <div className="border-t border-ink/8 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inputClass} flex-1 basis-36`}
                placeholder="Their name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <select
                className={selectClass}
                value={context}
                onChange={(e) => setContext(e.target.value as RelationContext)}
                aria-label="How you know them"
              >
                {RELATION_CONTEXTS.filter(canNegotiate).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className={buttonClass}
                disabled={!name.trim()}
                onClick={() => {
                  const created = addPerson(name, context);
                  setName('');
                  setAdding(false);
                  onPick(created.id);
                }}
              >
                Add {name.trim() || 'them'}
              </button>
              {people.length > 0 && (
                <button className={quietButtonClass} onClick={() => setAdding(false)}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            className={`${quietButtonClass} mt-4`}
            onClick={() => setAdding(true)}
          >
            + someone new
          </button>
        )}
      </div>
    );
  }

  const person = people.find((p) => p.id === personId);
  if (!person) return null;
  const space = spaceFor(person.id);

  return (
    <div className="space-y-5">
      <h3 className="font-serif text-2xl text-ink">{person.name}</h3>

      {/* An invitation that doesn't say what it shares isn't an invitation. */}
      <div className="rounded-2xl border border-ink/10 bg-white/50 p-4">
        <Label>What {person.name} will see</Label>
        <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-ink/75">
          Agreements the two of you put in this space, their wording, and who
          proposed, accepted, revised or ended each one.
        </p>
        <div className="mt-3">
          <Label>What {person.name} won't see</Label>
        </div>
        <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-ink/75">
          Your needs. Which of them this came from. Anyone else in your ledger.
          Any other space you hold.
        </p>
      </div>

      {space ? (
        <>
          <StateLine
            state={space.state}
            waiting={`Waiting for ${person.name} to join`}
            here={`${person.name} is here`}
            health={health}
          />
          {space.state === 'waiting' && health === 'unreachable' && <RelayDown />}
          <Handoff
            code={space.code}
            url={spaceUrl(space.code)}
            label={`Send this to ${person.name}`}
          />
          {space.error && (
            <p className="font-sans text-[13px] text-rose">{space.error}</p>
          )}
          <div className="border-t border-ink/8 pt-5">
            <button className={linkClass} onClick={() => leaveSpace(person.id)}>
              leave this space
            </button>
            <p className="mt-2 font-serif text-sm leading-relaxed text-mauve italic">
              Leaving removes it from this device. {person.name} keeps their copy —
              a shared history isn't yours alone to delete.
            </p>
          </div>
        </>
      ) : (
        <button className={buttonClass} onClick={() => createSpace(person.id)}>
          Open a space with {person.name}
        </button>
      )}
    </div>
  );
};

/**
 * The receiving half. A space code says nothing about whose it is, so the
 * person accepting names them locally before anything connects.
 */
const JoinView = ({
  code, people, addPerson, linkSpace, onDone, onCancel,
}: {
  code: string;
  people: Person[];
  addPerson: (name: string, context: RelationContext) => Person;
  linkSpace: (personId: string, code: string) => void;
  onDone: (personId: string) => void;
  onCancel: () => void;
}) => {
  const [personId, setPersonId] = useState(people[0]?.id ?? '__new__');
  const [name, setName] = useState('');
  const [context, setContext] = useState<RelationContext>('partner');

  const creating = personId === '__new__' || people.length === 0;
  const ready = !creating || name.trim() !== '';

  return (
    <div className="space-y-5">
      <p className="font-serif text-lg leading-relaxed text-mauve italic">
        Someone sent you a space. Only agreements the two of you put in it will
        cross — nothing else in your ledger is shared, and nothing of theirs
        comes into yours.
      </p>

      <div>
        <Label>Who is this?</Label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            className={selectClass}
            value={creating ? '__new__' : personId}
            onChange={(e) => setPersonId(e.target.value)}
            aria-label="Who sent this"
          >
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="__new__">+ someone new</option>
          </select>

          {creating && (
            <>
              <input
                className={`${inputClass} flex-1 basis-36`}
                placeholder="Their name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <select
                className={selectClass}
                value={context}
                onChange={(e) => setContext(e.target.value as RelationContext)}
                aria-label="How you know them"
              >
                {RELATION_CONTEXTS.filter(canNegotiate).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className={buttonClass}
          disabled={!ready}
          onClick={() => {
            const target = creating
              ? addPerson(name, context)
              : people.find((p) => p.id === personId);
            if (!target) return;
            linkSpace(target.id, code);
            onDone(target.id);
          }}
        >
          Join the space
        </button>
        <button className={quietButtonClass} onClick={onCancel}>Not now</button>
      </div>
    </div>
  );
};

const JoinedView = ({
  person, space, health, onOpenShared,
}: {
  person: Person | undefined;
  space: SpaceState | undefined;
  health: RelayHealth;
  onOpenShared: () => void;
}) => {
  const name = person?.name ?? 'them';
  const here = space?.state === 'linked';

  return (
    <div className="space-y-5">
      <p className="font-serif text-2xl leading-snug text-ink">
        You share a space with {name}.
      </p>

      {/* Never a bare "Connecting…" with nothing behind it. Not being connected
          this second is normal and costs nothing — the space is joined either
          way, and anything either of you adds shows up when you overlap. */}
      <StateLine
        state={space?.state ?? 'waiting'}
        waiting={`${name} isn't here right now — that's fine`}
        here={`${name} is here now`}
        health={health}
      />
      {health === 'unreachable' && <RelayDown />}
      {!here && health !== 'unreachable' && (
        <p className="font-serif text-base leading-relaxed text-mauve italic">
          Nothing is lost while you're apart. Whatever either of you puts in the
          space turns up the next time you're both online.
        </p>
      )}

      <div className="rounded-2xl border border-ink/10 bg-white/50 p-4">
        <Label>What's shared</Label>
        <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-ink/75">
          Only agreements the two of you put in this space. Your needs, your
          other people and your other spaces stay yours.
        </p>
      </div>

      <button className={buttonClass} onClick={onOpenShared}>
        See agreements with {name}
      </button>
    </div>
  );
};
