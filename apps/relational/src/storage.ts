// localStorage persistence. Yjs carries these same arrays between devices;
// this is the durable local copy.

import type { Arrangement, Need, Person } from './types';

const KEYS = {
  people: 'relational-people-v1',
  needs: 'relational-needs-v1',
  arrangements: 'relational-arrangements-v1',
} as const;

/** Superseded by `arrangements`. Read once, on the way in. See migrateAsks. */
const LEGACY_ASKS = 'relational-asks-v1';

/**
 * Reads never throw. A private window, cleared site data, or a half-written
 * value should degrade to an empty ledger rather than a blank screen, and the
 * caller has no better recovery available than the same empty array.
 */
const read = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const write = <T,>(key: string, value: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or a blocked store. Losing the write is bad; taking the app down
    // with it is worse, and the in-memory state stays correct for this session.
  }
};

interface LegacyAsk {
  id: string;
  needId: string;
  personId: string;
  request?: string;
  state?: 'unspoken' | 'asked' | 'declined' | 'agreed';
  agreementId?: string;
  createdAt?: number;
}

/**
 * The first schema had one path to a met need: ask, then get a yes. Everything
 * it recorded was therefore a request, so every legacy row becomes mode
 * 'asked'. Note that its `agreed` meant "they said yes to me", not "we
 * negotiated this in a shared space" — mapping it to the new `agreed` mode
 * would invent a shared agreement that never happened.
 */
const migrateAsks = (): Arrangement[] =>
  read<LegacyAsk>(LEGACY_ASKS).map((a) => ({
    id: a.id,
    needId: a.needId,
    personId: a.personId,
    mode: 'asked' as const,
    request: a.request,
    state: a.state === 'declined' ? ('no' as const)
      : a.state === 'agreed' ? ('yes' as const)
      : a.state === 'asked' ? ('waiting' as const)
      : ('unasked' as const),
    ...(a.agreementId ? { agreementId: a.agreementId } : {}),
    createdAt: a.createdAt ?? Date.now(),
  }));

export const loadPeople = (): Person[] => read<Person>(KEYS.people);
export const loadNeeds = (): Need[] => read<Need>(KEYS.needs);

export const loadArrangements = (): Arrangement[] => {
  const current = read<Arrangement>(KEYS.arrangements);
  if (current.length > 0) return current;
  const migrated = migrateAsks();
  if (migrated.length > 0) write(KEYS.arrangements, migrated);
  return migrated;
};

export const savePeople = (v: Person[]): void => write(KEYS.people, v);
export const saveNeeds = (v: Need[]): void => write(KEYS.needs, v);
export const saveArrangements = (v: Arrangement[]): void => write(KEYS.arrangements, v);
