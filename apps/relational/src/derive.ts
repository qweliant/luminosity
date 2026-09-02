// Pure derivations. No React, no I/O — everything here is a function of the
// three stores, so it is all directly testable.
//
// What this is for: seeing whether a need is met by nobody, by one person, or
// by several. What it is emphatically NOT for: scoring you on how many needs
// you have formally negotiated. An earlier version counted a need as met only
// once a request had been accepted, which meant a non-negotiable that someone
// simply meets, unasked, rendered as a floor at risk. That is backwards.
// Unasked and met is the ordinary way most needs get met.

import type { Arrangement, Need, Person } from './types';
import { isMet } from './types';

export type NeedStatus = 'none' | 'waiting' | 'declined' | 'met';

export interface NeedCoverage {
  need: Need;
  arrangements: Arrangement[];
  /** Distinct people meeting this, however it came about. */
  metPeople: string[];
  /** Of those, the ones nobody had to ask. */
  givenBy: string[];
  status: NeedStatus;
  /**
   * Met, but by exactly one person. Not a problem in itself — it's where the
   * arrangement is load-bearing, which is worth being able to see on purpose
   * rather than discovering when that person is unavailable.
   */
  singleSource: boolean;
}

export interface PersonLoad {
  person: Person;
  meets: number;
  /** Needs where this person is the only one meeting it. */
  soleSourceFor: number;
}

export interface Coverage {
  needs: NeedCoverage[];
  people: PersonLoad[];
  /** Needs nobody is meeting. Not "needs you haven't asked about". */
  unmet: number;
  singleSource: number;
  /** Non-negotiables nobody is meeting. The one number worth looking at. */
  floorsAtRisk: number;
}

const uniq = (xs: string[]): string[] => [...new Set(xs)];

export const coverNeed = (need: Need, all: Arrangement[]): NeedCoverage => {
  const mine = all.filter((a) => a.needId === need.id);
  const met = mine.filter(isMet);
  const metPeople = uniq(met.map((a) => a.personId));

  const status: NeedStatus =
    metPeople.length > 0 ? 'met'
    : mine.some((a) => a.mode === 'asked' && a.reply === 'waiting') ? 'waiting'
    : mine.some((a) => a.mode === 'asked' && a.reply === 'no') ? 'declined'
    : 'none';

  return {
    need,
    arrangements: mine,
    metPeople,
    givenBy: uniq(met.filter((a) => a.mode === 'given').map((a) => a.personId)),
    status,
    singleSource: metPeople.length === 1,
  };
};

export const deriveCoverage = (
  needs: Need[],
  arrangements: Arrangement[],
  people: Person[],
): Coverage => {
  const covered = needs.map((n) => coverNeed(n, arrangements));

  const loads: PersonLoad[] = people.map((person) => ({
    person,
    meets: covered.filter((c) => c.metPeople.includes(person.id)).length,
    soleSourceFor: covered.filter(
      (c) => c.singleSource && c.metPeople[0] === person.id,
    ).length,
  }));

  return {
    needs: covered,
    // Heaviest carrier first — the shape of the lopsidedness is the finding.
    people: loads.sort((a, b) => b.meets - a.meets || b.soleSourceFor - a.soleSourceFor),
    unmet: covered.filter((c) => c.status !== 'met').length,
    singleSource: covered.filter((c) => c.singleSource).length,
    floorsAtRisk: covered.filter((c) => c.need.floor && c.status !== 'met').length,
  };
};

/**
 * How concentrated the whole arrangement is: the share of met needs carried by
 * whoever carries the most. 1 means one person meets everything that is met;
 * near 0 means it is spread wide. Undefined when nothing is met yet, since a
 * ratio over zero needs would be a number pretending to be an answer.
 */
export const concentration = (coverage: Coverage): number | undefined => {
  const met = coverage.needs.filter((c) => c.status === 'met');
  if (met.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const c of met) {
    for (const p of c.metPeople) counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  return Math.max(...counts.values()) / met.length;
};

/** How many met needs nobody had to be asked for. */
export const givenCount = (coverage: Coverage): number =>
  coverage.needs.filter((c) => c.givenBy.length > 0).length;
