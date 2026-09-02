// Local records about shared spaces. The spaces themselves live in
// @luminosity/ledger-core; this is only what this device remembers about them.

import type { Participant } from '../types';

const ME_KEY = 'relational-me-v1';
const SPACES_KEY = 'relational-spaces-v1';

/** personId → the code for the space shared with that person. */
export interface SpaceLink {
  personId: string;
  code: string;
}

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * This device's identity inside shared spaces. Generated once and reused, so
 * that "who proposed this" survives reloads. It is deliberately not derived
 * from anything about the person — it is a handle, not a profile.
 */
export const loadMe = (): Participant => {
  try {
    const raw = localStorage.getItem(ME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Participant;
      if (parsed?.id) return parsed;
    }
  } catch {
    /* fall through to a fresh identity */
  }
  const me: Participant = { id: newId(), name: '' };
  try {
    localStorage.setItem(ME_KEY, JSON.stringify(me));
  } catch {
    /* an unwritable store still gets a working in-memory identity */
  }
  return me;
};

export const saveMe = (me: Participant): void => {
  try {
    localStorage.setItem(ME_KEY, JSON.stringify(me));
  } catch {
    /* see loadMe */
  }
};

export const loadSpaceLinks = (): SpaceLink[] => {
  try {
    const raw = localStorage.getItem(SPACES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SpaceLink[]) : [];
  } catch {
    return [];
  }
};

export const saveSpaceLinks = (links: SpaceLink[]): void => {
  try {
    localStorage.setItem(SPACES_KEY, JSON.stringify(links));
  } catch {
    /* see loadMe */
  }
};
