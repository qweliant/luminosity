// The one stateful hook. Every mutation goes through here, so persistence and
// sync are never something a component has to remember to do.
//
// Three layers, in order of durability: React state is the source of display
// order, localStorage is the durable local copy, and the Yjs maps are the
// channel to this person's other devices. A write touches all three.

import { useCallback, useEffect, useRef, useState } from 'react';
import type * as Y from 'yjs';
import type {
  Arrangement, ArrangementMode, AskReply, Need, Person, RelationContext,
} from './types';
import {
  loadArrangements,
  loadNeeds,
  loadPeople,
  saveArrangements,
  saveNeeds,
  savePeople,
} from './storage';
import { yArrangements, yNeeds, yPeople, ydoc } from './services/sync';

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const put = <T,>(map: Y.Map<T>, id: string, value: T): void => {
  ydoc.transact(() => map.set(id, value), 'local');
};

const drop = <T,>(map: Y.Map<T>, ids: string[]): void => {
  ydoc.transact(() => {
    for (const id of ids) map.delete(id);
  }, 'local');
};

/**
 * Remote updates → React state. Local-origin transactions are skipped so our
 * own writes don't echo back through setState.
 *
 * Order is anchored to local order rather than taken from the map: Y.Map
 * iteration is insertion order on the *originating* peer, which has nothing to
 * do with how this person's list currently reads. Existing rows keep their
 * slot; rows that arrived from elsewhere land at the end.
 */
const useRemote = <T extends { id: string }>(
  map: Y.Map<T>,
  setState: React.Dispatch<React.SetStateAction<T[]>>,
): void => {
  useEffect(() => {
    const onRemote = (_event: unknown, txn: { local: boolean }) => {
      if (txn.local) return;
      setState((prev) => {
        const next: T[] = [];
        const seen = new Set<string>();
        for (const row of prev) {
          const fresh = map.get(row.id);
          if (fresh) {
            next.push(fresh);
            seen.add(row.id);
          }
        }
        map.forEach((row, id) => {
          if (!seen.has(id)) next.push(row);
        });
        return next;
      });
    };
    map.observe(onRemote);
    return () => map.unobserve(onRemote);
  }, [map, setState]);
};

export const useLedger = () => {
  const [people, setPeople] = useState<Person[]>(loadPeople);
  const [needs, setNeeds] = useState<Need[]>(loadNeeds);
  const [arrangements, setArrangements] = useState<Arrangement[]>(loadArrangements);

  useEffect(() => savePeople(people), [people]);
  useEffect(() => saveNeeds(needs), [needs]);
  useEffect(() => saveArrangements(arrangements), [arrangements]);

  useRemote(yPeople, setPeople);
  useRemote(yNeeds, setNeeds);
  useRemote(yArrangements, setArrangements);

  // Mirror whatever this device already had into the shared maps, once, and
  // only where the map is still empty — a device joining an existing ledger
  // must not overwrite it with its own cold start.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    ydoc.transact(() => {
      if (yPeople.size === 0) people.forEach((p) => yPeople.set(p.id, p));
      if (yNeeds.size === 0) needs.forEach((n) => yNeeds.set(n.id, n));
      if (yArrangements.size === 0)
        arrangements.forEach((a) => yArrangements.set(a.id, a));
    }, 'local');
  }, [people, needs, arrangements]);

  const addPerson = useCallback((name: string, context: RelationContext): Person => {
    const person: Person = { id: newId(), name: name.trim(), context, createdAt: Date.now() };
    setPeople((prev) => [...prev, person]);
    put(yPeople, person.id, person);
    return person;
  }, []);

  const addNeed = useCallback((statement: string, floor: boolean): void => {
    const trimmed = statement.trim();
    if (!trimmed) return;
    const need: Need = { id: newId(), statement: trimmed, floor, createdAt: Date.now() };
    setNeeds((prev) => [...prev, need]);
    put(yNeeds, need.id, need);
  }, []);

  const toggleFloor = useCallback((id: string): void => {
    setNeeds((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const next = { ...n, floor: !n.floor };
        put(yNeeds, id, next);
        return next;
      }),
    );
  }, []);

  // Arrangements go with the need: a request that outlives the thing it was
  // for is just a chore with no reason attached.
  const removeNeed = useCallback((id: string): void => {
    setNeeds((prev) => prev.filter((n) => n.id !== id));
    setArrangements((prev) => {
      const orphaned = prev.filter((a) => a.needId === id);
      drop(yArrangements, orphaned.map((a) => a.id));
      return prev.filter((a) => a.needId !== id);
    });
    drop(yNeeds, [id]);
  }, []);

  /**
   * `given` carries no request text and no reply, because nothing was asked.
   * Recording that someone already meets a need should be the cheapest thing
   * in the app, not a form.
   */
  const addArrangement = useCallback(
    (needId: string, personId: string, mode: ArrangementMode, request?: string): void => {
      if (!personId) return;
      const trimmed = request?.trim();
      if (mode !== 'given' && !trimmed) return;
      const arrangement: Arrangement = {
        id: newId(),
        needId,
        personId,
        mode,
        ...(mode === 'given' ? {} : { request: trimmed, reply: 'waiting' as AskReply }),
        createdAt: Date.now(),
      };
      setArrangements((prev) => [...prev, arrangement]);
      put(yArrangements, arrangement.id, arrangement);
    },
    [],
  );

  const patchArrangement = useCallback(
    (id: string, patch: Partial<Arrangement>): void => {
      setArrangements((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const next = { ...a, ...patch };
          put(yArrangements, id, next);
          return next;
        }),
      );
    },
    [],
  );

  const setReply = useCallback(
    (id: string, reply: AskReply) => patchArrangement(id, { reply }),
    [patchArrangement],
  );

  /**
   * Switching to `given` drops the request and reply rather than leaving them
   * lying around: "they already do this" is not a request in a different hat.
   */
  const setMode = useCallback(
    (id: string, mode: ArrangementMode) =>
      patchArrangement(
        id,
        mode === 'given'
          ? { mode, request: undefined, reply: undefined }
          : { mode, reply: undefined },
      ),
    [patchArrangement],
  );

  const setArrangementAgreement = useCallback(
    (id: string, agreementId: string) =>
      patchArrangement(id, { agreementId, mode: 'agreed', reply: undefined }),
    [patchArrangement],
  );

  const removeArrangement = useCallback((id: string): void => {
    setArrangements((prev) => prev.filter((a) => a.id !== id));
    drop(yArrangements, [id]);
  }, []);

  return {
    people, needs, arrangements,
    addPerson, addNeed, toggleFloor, removeNeed,
    addArrangement, setMode, setReply, setArrangementAgreement, removeArrangement,
  };
};
