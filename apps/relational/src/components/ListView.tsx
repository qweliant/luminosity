import React, { useState } from 'react';
import type {
  Arrangement, ArrangementMode, AskReply, Need, Person, RelationContext,
} from '../types';
import {
  AGREEMENT_STATUS_LABEL, MODE_LABEL, RELATION_CONTEXTS, REPLIES, REPLY_LABEL,
  canNegotiate,
} from '../types';
import { coverNeed } from '../derive';
import { NEED_VOCABULARY } from '../data';
import type { SpaceState } from '../useSpaces';
import {
  FloorMark, Label, Row, StatusNote,
  buttonClass, inputClass, linkClass, quietButtonClass, selectClass,
} from './primitives';
import { RingPair } from './rings';

interface Props {
  people: Person[];
  needs: Need[];
  arrangements: Arrangement[];
  addPerson: (name: string, context: RelationContext) => Person;
  addNeed: (statement: string, floor: boolean) => void;
  toggleFloor: (id: string) => void;
  removeNeed: (id: string) => void;
  addArrangement: (
    needId: string, personId: string, mode: ArrangementMode, request?: string,
  ) => void;
  setMode: (id: string, mode: ArrangementMode) => void;
  setReply: (id: string, reply: AskReply) => void;
  setArrangementAgreement: (id: string, agreementId: string) => void;
  removeArrangement: (id: string) => void;
  spaceFor: (personId: string) => SpaceState | undefined;
  propose: (personId: string, text: string) => string | undefined;
  onNeedSpace: () => void;
}

const NEW_PERSON = '__new__';

/**
 * Recording that someone already meets a need is the cheapest path here, on
 * purpose. Asking is a second, deliberate thing — not the only way for a need
 * to count.
 */
const ArrangementForm = ({
  needId, mode, people, addPerson, addArrangement, onDone,
}: {
  needId: string;
  mode: ArrangementMode;
  people: Person[];
  addPerson: (name: string, context: RelationContext) => Person;
  addArrangement: (
    needId: string, personId: string, mode: ArrangementMode, request?: string,
  ) => void;
  onDone: () => void;
}) => {
  const [personId, setPersonId] = useState(people[0]?.id ?? NEW_PERSON);
  const [newName, setNewName] = useState('');
  const [context, setContext] = useState<RelationContext>('partner');
  const [request, setRequest] = useState('');

  const creating = personId === NEW_PERSON || people.length === 0;
  const ready =
    (!creating || newName.trim() !== '') && (mode === 'given' || request.trim() !== '');

  return (
    <div className="mt-3 border-l-2 border-rose/25 pl-4">
      <Label>{MODE_LABEL[mode]}</Label>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          className={selectClass}
          value={creating ? NEW_PERSON : personId}
          onChange={(e) => setPersonId(e.target.value)}
          aria-label="Who"
        >
          {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value={NEW_PERSON}>+ someone new</option>
        </select>

        {creating && (
          <>
            <input
              className={`${inputClass} flex-1 basis-36`}
              placeholder="Their name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <select
              className={selectClass}
              value={context}
              onChange={(e) => setContext(e.target.value as RelationContext)}
              aria-label="How you know them"
            >
              {RELATION_CONTEXTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </>
        )}
      </div>

      {mode !== 'given' && (
        <input
          className={`${inputClass} mt-3`}
          placeholder="What I'm asking for — one small, concrete thing"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
        />
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className={buttonClass}
          disabled={!ready}
          onClick={() => {
            const target = creating
              ? addPerson(newName, context)
              : people.find((p) => p.id === personId);
            if (!target) return;
            addArrangement(needId, target.id, mode, request);
            onDone();
          }}
        >
          Save
        </button>
        <button className={quietButtonClass} onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
};

const ArrangementLine = ({
  arrangement: a, person, props,
}: {
  arrangement: Arrangement;
  person: Person | undefined;
  props: Props;
}) => {
  const name = person?.name ?? 'someone';
  const space = person ? props.spaceFor(person.id) : undefined;
  const agreement = a.agreementId
    ? space?.agreements.find((v) => v.id === a.agreementId)
    : undefined;
  const negotiable = person ? canNegotiate(person.context) : false;

  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <RingPair size={16} stroke={0.13} />
        <span className="font-serif text-[17px] text-ink">{name}</span>
        <span className="font-sans text-[13px] text-mauve">
          {a.mode === 'given' ? 'already does this' : a.request}
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-6">
        {a.mode === 'asked' && (
          <select
            className={selectClass}
            value={a.reply ?? 'waiting'}
            onChange={(e) => props.setReply(a.id, e.target.value as AskReply)}
            aria-label={`Where the ask to ${name} stands`}
          >
            {REPLIES.map((r) => <option key={r} value={r}>{REPLY_LABEL[r]}</option>)}
          </select>
        )}

        {a.mode === 'given' && (
          <button className={linkClass} onClick={() => props.setMode(a.id, 'asked')}>
            actually, I asked for this
          </button>
        )}

        {a.mode === 'asked' && (
          <button className={linkClass} onClick={() => props.setMode(a.id, 'given')}>
            they just do this
          </button>
        )}

        {agreement && (
          <span className="font-serif text-sm text-mauve italic">
            agreed with {name} · {AGREEMENT_STATUS_LABEL[agreement.status].toLowerCase()}
          </span>
        )}

        {/* Negotiating wording only makes sense with some people. A coworker
            never sees this. */}
        {!agreement && a.mode === 'asked' && negotiable && (
          space ? (
            <button
              className={linkClass}
              onClick={() => {
                const id = props.propose(person!.id, a.request ?? '');
                if (id) props.setArrangementAgreement(a.id, id);
              }}
            >
              put it to {name} to agree on
            </button>
          ) : (
            <button className={linkClass} onClick={props.onNeedSpace}>
              open a space with {name}
            </button>
          )
        )}

        <button className={linkClass} onClick={() => props.removeArrangement(a.id)}>
          remove
        </button>
      </div>
    </li>
  );
};

const NeedRow = ({ need, props }: { need: Need; props: Props }) => {
  const [adding, setAdding] = useState<ArrangementMode | null>(null);
  const cover = coverNeed(need, props.arrangements);

  return (
    <Row>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-serif text-2xl leading-snug text-ink">{need.statement}</h3>
        <StatusNote status={cover.status} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {need.floor && <FloorMark />}
        <button className={linkClass} onClick={() => props.toggleFloor(need.id)}>
          {need.floor ? 'make negotiable' : 'mark non-negotiable'}
        </button>
        <button className={linkClass} onClick={() => props.removeNeed(need.id)}>
          delete
        </button>
      </div>

      {cover.arrangements.length > 0 && (
        <ul className="mt-3 divide-y divide-ink/6">
          {cover.arrangements.map((a) => (
            <ArrangementLine
              key={a.id}
              arrangement={a}
              person={props.people.find((p) => p.id === a.personId)}
              props={props}
            />
          ))}
        </ul>
      )}

      {adding ? (
        <ArrangementForm
          needId={need.id}
          mode={adding}
          people={props.people}
          addPerson={props.addPerson}
          addArrangement={props.addArrangement}
          onDone={() => setAdding(null)}
        />
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className={quietButtonClass} onClick={() => setAdding('given')}>
            someone already does this
          </button>
          <button className={quietButtonClass} onClick={() => setAdding('asked')}>
            I asked for something
          </button>
        </div>
      )}
    </Row>
  );
};

export const ListView = (props: Props) => {
  const [statement, setStatement] = useState('');
  const [floor, setFloor] = useState(false);
  const [showVocab, setShowVocab] = useState(false);

  const submit = () => {
    props.addNeed(statement, floor);
    setStatement('');
    setFloor(false);
  };

  return (
    <div>
      <div className="border-b border-ink/8 pb-6">
        <input
          className={inputClass}
          placeholder="What I need — the experience, not the errand"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex min-h-11 items-center gap-2 font-sans text-[13px] text-ink/70">
            <input
              type="checkbox"
              className="size-4 accent-rose"
              checked={floor}
              onChange={(e) => setFloor(e.target.checked)}
            />
            non-negotiable
          </label>
          <button className={buttonClass} onClick={submit} disabled={!statement.trim()}>
            Add
          </button>
          <button className={`${linkClass} ml-auto`} onClick={() => setShowVocab((v) => !v)}>
            {showVocab ? 'hide words' : 'stuck for words?'}
          </button>
        </div>

        {showVocab && (
          <div className="mt-4 space-y-3">
            {NEED_VOCABULARY.map((g) => (
              <div key={g.name}>
                <Label>{g.name}</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {g.needs.map((n) => (
                    <button
                      key={n}
                      className="rounded-full border border-ink/10 bg-white/50 px-3 py-1.5 font-serif text-[15px] text-ink active:bg-white"
                      onClick={() => setStatement(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {props.needs.length === 0 ? (
        <p className="py-10 font-serif text-lg leading-relaxed text-mauve italic">
          Nothing here yet. Start with one thing you need — stated so that more
          than one person could meet it.
        </p>
      ) : (
        [...props.needs]
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((need) => <NeedRow key={need.id} need={need} props={props} />)
      )}
    </div>
  );
};
