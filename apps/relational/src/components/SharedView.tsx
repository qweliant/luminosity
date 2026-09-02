// The only screen where a second person can write.
//
// Everything else in this app is a private note to myself. Here, two people
// append to the same log, which is why the wording of this screen matters more
// than the rest: it should never imply I can change what someone else agreed
// to, or erase a history we both hold.

import React, { useState } from 'react';
import type { AgreementView, Participant, Person } from '../types';
import { AGREEMENT_STATUS_LABEL } from '../types';
import { awaitingMe } from '../agreements';
import type { SpaceState } from '../useSpaces';
import type { SyncState } from '../services/sync';
import { canNegotiate } from '../types';
import {
  Label, Row, buttonClass, inputClass, linkClass, quietButtonClass,
} from './primitives';
import { RingPair } from './rings';

const STATE_DOT: Record<SyncState, string> = {
  off: 'bg-mauve/40',
  waiting: 'bg-[#C08A3E]',
  linked: 'bg-[#5B8C6E]',
  error: 'bg-rose',
};

const STATE_LABEL: Record<SyncState, string> = {
  off: 'Not connected',
  waiting: 'Waiting for them to join',
  linked: 'They are here',
  error: 'Connection problem',
};

const STATUS_CLASS: Record<AgreementView['status'], string> = {
  proposed: 'text-[#C08A3E]',
  agreed: 'text-[#5B8C6E]',
  ended: 'text-mauve',
};

const nameOf = (participants: Participant[], id: string, me: string): string => {
  if (id === me) return 'You';
  const found = participants.find((p) => p.id === id);
  return found?.name?.trim() || 'They';
};

const AgreementCard = ({
  view, space, me, onAccept, onRevise, onEnd,
}: {
  view: AgreementView;
  space: SpaceState;
  me: string;
  onAccept: () => void;
  onRevise: (text: string) => void;
  onEnd: () => void;
}) => {
  const [revising, setRevising] = useState(false);
  const [draft, setDraft] = useState(view.text);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <li className="border-t border-ink/8 py-4 first:border-t-0">
      <div className="flex items-start justify-between gap-4">
        <p className="font-serif text-lg leading-snug text-ink">{view.text}</p>
        <span
          className={`shrink-0 font-serif text-sm italic ${STATUS_CLASS[view.status]}`}
        >
          {AGREEMENT_STATUS_LABEL[view.status].toLowerCase()}
        </span>
      </div>

      <p className="mt-1 font-sans text-[13px] text-mauve">
        Put forward by {nameOf(space.participants, view.proposedBy, me)}
        {view.status === 'proposed' &&
          (awaitingMe(view, me) ? ' · your turn' : ' · waiting on them')}
      </p>

      {view.status !== 'ended' && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          {awaitingMe(view, me) && (
            <button className={buttonClass} onClick={onAccept}>Yes, agreed</button>
          )}
          <button className={linkClass} onClick={() => setRevising((v) => !v)}>
            {revising ? 'cancel' : 'suggest different wording'}
          </button>
          <button className={linkClass} onClick={onEnd}>end this</button>
        </div>
      )}

      {revising && (
        <div className="mt-2.5 space-y-2">
          <input
            className={inputClass}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="How it should read instead"
          />
          <p className="font-serif text-sm leading-relaxed text-mauve italic">
            New wording needs a fresh yes — an earlier one doesn't carry over.
          </p>
          <button
            className={buttonClass}
            disabled={!draft.trim() || draft.trim() === view.text}
            onClick={() => {
              onRevise(draft);
              setRevising(false);
            }}
          >
            Put it forward
          </button>
        </div>
      )}

      <button className={`${linkClass} mt-3`} onClick={() => setShowHistory((v) => !v)}>
        {showHistory ? 'hide history' : `history (${view.events.length})`}
      </button>

      {showHistory && (
        <ol className="mt-2 space-y-1 border-t border-ink/8 pt-2">
          {view.events.map((e, i) => (
            <li key={`${e.at}-${e.by}-${i}`} className="font-sans text-[13px] text-mauve">
              {nameOf(space.participants, e.by, me)}{' '}
              {e.kind === 'proposed' ? 'put this forward'
                : e.kind === 'accepted' ? 'said yes'
                : e.kind === 'revised' ? 'suggested different wording'
                : 'ended it'}
              {e.text && <span className="text-mauve/70"> — “{e.text}”</span>}
            </li>
          ))}
        </ol>
      )}
    </li>
  );
};

const PersonSpace = ({
  person, space, me, onConnect, onAccept, onRevise, onEnd,
}: {
  person: Person;
  space: SpaceState | undefined;
  me: string;
  onConnect: () => void;
  onAccept: (id: string) => void;
  onRevise: (id: string, text: string) => void;
  onEnd: (id: string) => void;
}) => (
  <Row>
    <div className="flex items-baseline gap-2">
      <RingPair size={18} stroke={0.13} />
      <h2 className="font-serif text-2xl text-ink">{person.name}</h2>
      <span className="font-mono text-[9px] tracking-[0.16em] text-mauve uppercase">
        {person.context}
      </span>
      {space && (
        <span className="ml-auto font-serif text-sm text-mauve italic">
          {space.state === 'linked' ? 'they are here' : 'waiting for them'}
        </span>
      )}
    </div>

    {!space ? (
      <div className="mt-3">
        <p className="font-serif text-base leading-relaxed text-mauve italic">
          No space with {person.name} yet. Agreements need one — it is the only
          part of this app they can see.
        </p>
        <button className={`${quietButtonClass} mt-3`} onClick={onConnect}>
          invite {person.name}
        </button>
      </div>
    ) : space.agreements.length === 0 ? (
      <p className="mt-3 font-serif text-base leading-relaxed text-mauve italic">
        Nothing here yet. Agreements start from a request, over on Needs.
      </p>
    ) : (
      <ul className="mt-3">
        {space.agreements.map((view) => (
          <AgreementCard
            key={view.id}
            view={view}
            space={space}
            me={me}
            onAccept={() => onAccept(view.id)}
            onRevise={(text) => onRevise(view.id, text)}
            onEnd={() => onEnd(view.id)}
          />
        ))}
      </ul>
    )}
  </Row>
);

export const SharedView = ({
  people, me, setMyName, spaceFor, onConnect, accept, revise, endAgreement,
}: {
  people: Person[];
  me: Participant;
  setMyName: (name: string) => void;
  spaceFor: (personId: string) => SpaceState | undefined;
  /** Opens the connect overlay — every space is opened or joined from there. */
  onConnect: () => void;
  accept: (personId: string, id: string) => void;
  revise: (personId: string, id: string, text: string) => void;
  endAgreement: (personId: string, id: string) => void;
}) => {
  const [name, setName] = useState(me.name);

  // A coworker does not get a shared consent space. Gating by context is what
  // keeps the app from advocating a conversation that only fits some
  // relationships.
  const negotiable = people.filter((p) => canNegotiate(p.context));

  if (people.length === 0) {
    return (
      <p className="px-1 py-6 text-[15px] leading-relaxed text-black/45">
        Ask someone for something first — people show up here once they exist.
      </p>
    );
  }

  if (negotiable.length === 0) {
    return (
      <p className="py-10 font-serif text-lg leading-relaxed text-mauve italic">
        Shared spaces are for the people you'd actually negotiate with —
        partners, family, close friends. Add one and they'll show up here.
      </p>
    );
  }

  return (
    <div>
      <div className="border-b border-ink/8 pb-6">
        <Label>What people see when you act in a shared space</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            id="me-name"
            className={`${inputClass} flex-1 basis-44`}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className={buttonClass}
            disabled={!name.trim() || name.trim() === me.name}
            onClick={() => setMyName(name)}
          >
            Save
          </button>
        </div>
      </div>

      {negotiable.map((person) => (
        <PersonSpace
          key={person.id}
          person={person}
          space={spaceFor(person.id)}
          me={me.id}
          onConnect={onConnect}
          onAccept={(id) => accept(person.id, id)}
          onRevise={(id, text) => revise(person.id, id, text)}
          onEnd={(id) => endAgreement(person.id, id)}
        />
      ))}
    </div>
  );
};
