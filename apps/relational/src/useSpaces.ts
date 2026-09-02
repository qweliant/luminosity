// Shared spaces, one per person.
//
// Each space is its own document in its own room, which is the privacy
// property that matters: a partner can read the agreements they are party to
// and nothing else. There is no space containing everyone.

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { generateCode, openSharedSpace } from '@luminosity/ledger-core';
import type { SharedSpace, SyncState } from '@luminosity/ledger-core';
import type {
  AgreementEvent,
  AgreementEventKind,
  AgreementView,
  Participant,
} from './types';
import { viewAgreement } from './agreements';
import {
  loadMe,
  loadSpaceLinks,
  saveMe,
  saveSpaceLinks,
  type SpaceLink,
} from './services/spaces';

const AGREEMENTS = 'agreements';
const PARTICIPANTS = 'participants';

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const logs = (space: SharedSpace) =>
  space.doc.getMap<Y.Array<AgreementEvent>>(AGREEMENTS);

const people = (space: SharedSpace) => space.doc.getMap<Participant>(PARTICIPANTS);

export interface SpaceState {
  personId: string;
  code: string;
  state: SyncState;
  error: string | null;
  agreements: AgreementView[];
  /** Everyone who has ever announced themselves in this space, including me. */
  participants: Participant[];
}

export const useSpaces = () => {
  const [me, setMe] = useState<Participant>(loadMe);
  const [links, setLinks] = useState<SpaceLink[]>(loadSpaceLinks);
  const open = useRef(new Map<string, SharedSpace>());

  // Any change inside any space bumps this, which is the whole re-render
  // strategy. The documents are the source of truth; React just needs telling
  // that they moved.
  const [, bump] = useState(0);
  const rerender = useCallback(() => bump((n) => n + 1), []);

  useEffect(() => saveSpaceLinks(links), [links]);
  useEffect(() => saveMe(me), [me]);

  // Open a space for every link, close any that are no longer listed.
  useEffect(() => {
    const wanted = new Set(links.map((l) => l.code));
    for (const [code, space] of open.current) {
      if (!wanted.has(code)) {
        space.close();
        open.current.delete(code);
      }
    }

    const teardown: Array<() => void> = [];
    for (const { code } of links) {
      let space = open.current.get(code);
      if (!space) {
        space = openSharedSpace(code);
        open.current.set(code, space);
        // Announce myself so the other side can name who acted. Each
        // participant only ever writes their own key, so whole-object
        // last-write-wins is safe for this map specifically.
        space.doc.transact(() => people(space!).set(me.id, me));
      }
      teardown.push(space.subscribe(rerender));
      const onChange = () => rerender();
      space.doc.on('update', onChange);
      teardown.push(() => space!.doc.off('update', onChange));
    }
    return () => teardown.forEach((fn) => fn());
  }, [links, me, rerender]);

  const spaceFor = useCallback(
    (personId: string): SpaceState | undefined => {
      const link = links.find((l) => l.personId === personId);
      if (!link) return undefined;
      const space = open.current.get(link.code);
      if (!space) return undefined;

      const agreements: AgreementView[] = [];
      logs(space).forEach((log, id) => {
        const view = viewAgreement(id, log.toArray());
        if (view) agreements.push(view);
      });
      agreements.sort((a, b) => b.lastTouched - a.lastTouched);

      const participants: Participant[] = [];
      people(space).forEach((p) => participants.push(p));

      return {
        personId,
        code: link.code,
        state: space.getState(),
        error: space.getError(),
        agreements,
        participants,
      };
    },
    [links],
  );

  const linkSpace = useCallback((personId: string, code: string): void => {
    setLinks((prev) => [...prev.filter((l) => l.personId !== personId), { personId, code }]);
  }, []);

  const createSpace = useCallback(
    (personId: string): string => {
      const code = generateCode();
      linkSpace(personId, code);
      return code;
    },
    [linkSpace],
  );

  /**
   * Leaves the space on this device. It does not and cannot delete the other
   * person's copy — saying otherwise in the UI would be a lie about what
   * happened to shared history.
   */
  const leaveSpace = useCallback((personId: string): void => {
    setLinks((prev) => prev.filter((l) => l.personId !== personId));
  }, []);

  const append = useCallback(
    (personId: string, agreementId: string, kind: AgreementEventKind, text?: string) => {
      const link = links.find((l) => l.personId === personId);
      const space = link && open.current.get(link.code);
      if (!space) return;
      const event: AgreementEvent = {
        at: Date.now(),
        by: me.id,
        kind,
        ...(text ? { text } : {}),
      };
      space.doc.transact(() => {
        const map = logs(space);
        let log = map.get(agreementId);
        if (!log) {
          log = new Y.Array<AgreementEvent>();
          map.set(agreementId, log);
        }
        log.push([event]);
      });
      rerender();
    },
    [links, me.id, rerender],
  );

  const propose = useCallback(
    (personId: string, text: string): string | undefined => {
      const trimmed = text.trim();
      if (!trimmed) return undefined;
      const id = newId();
      append(personId, id, 'proposed', trimmed);
      return id;
    },
    [append],
  );

  const accept = useCallback(
    (personId: string, id: string) => append(personId, id, 'accepted'),
    [append],
  );
  const revise = useCallback(
    (personId: string, id: string, text: string) => {
      const trimmed = text.trim();
      if (trimmed) append(personId, id, 'revised', trimmed);
    },
    [append],
  );
  const endAgreement = useCallback(
    (personId: string, id: string) => append(personId, id, 'ended'),
    [append],
  );

  const setMyName = useCallback((name: string) => {
    setMe((prev) => ({ ...prev, name: name.trim() }));
  }, []);

  return {
    me,
    setMyName,
    links,
    spaceFor,
    createSpace,
    linkSpace,
    leaveSpace,
    propose,
    accept,
    revise,
    endAgreement,
  };
};
