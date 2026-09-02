import { test, expect } from 'bun:test';
import { concentration, coverNeed, deriveCoverage, givenCount } from './derive';
import type { Arrangement, ArrangementMode, Need, Person, RequestState } from './types';

const person = (id: string, name = id): Person =>
  ({ id, name, context: 'partner', createdAt: 0 });
const need = (id: string, floor = false): Need =>
  ({ id, statement: id, floor, createdAt: 0 });
const arr = (
  id: string, needId: string, personId: string,
  mode: ArrangementMode, state?: RequestState,
): Arrangement => ({ id, needId, personId, mode, ...(state ? { state } : {}), createdAt: 0 });

test('a need nobody meets has no arrangement', () => {
  const c = coverNeed(need('n1'), []);
  expect(c.status).toBe('none');
  expect(c.metPeople).toEqual([]);
});

// The bug this schema exists to fix.
test('someone simply doing it counts as met, with nobody asked', () => {
  const c = coverNeed(need('n1'), [arr('a1', 'n1', 'p1', 'given')]);
  expect(c.status).toBe('met');
  expect(c.metPeople).toEqual(['p1']);
  expect(c.givenBy).toEqual(['p1']);
});

test('a non-negotiable met without asking is NOT at risk', () => {
  const cov = deriveCoverage(
    [need('floor', true)],
    [arr('a1', 'floor', 'p1', 'given')],
    [person('p1')],
  );
  expect(cov.floorsAtRisk).toBe(0);
  expect(cov.unmet).toBe(0);
});

test('a non-negotiable nobody meets is at risk', () => {
  const cov = deriveCoverage([need('floor', true)], [], [person('p1')]);
  expect(cov.floorsAtRisk).toBe(1);
});

test('a floor asked but not yet answered is still at risk', () => {
  const cov = deriveCoverage(
    [need('floor', true)],
    [arr('a1', 'floor', 'p1', 'asked', 'waiting')],
    [person('p1')],
  );
  expect(cov.floorsAtRisk).toBe(1);
});

test('an ask answered yes meets the need', () => {
  const c = coverNeed(need('n1'), [arr('a1', 'n1', 'p1', 'asked', 'yes')]);
  expect(c.status).toBe('met');
  expect(c.givenBy).toEqual([]);
});

test('an ask answered no does not', () => {
  const c = coverNeed(need('n1'), [arr('a1', 'n1', 'p1', 'asked', 'no')]);
  expect(c.status).toBe('declined');
  expect(c.metPeople).toEqual([]);
});

test('an agreement meets the need', () => {
  const c = coverNeed(need('n1'), [arr('a1', 'n1', 'p1', 'agreed')]);
  expect(c.status).toBe('met');
});

test('one person meeting it outranks another still waiting', () => {
  const c = coverNeed(need('n1'), [
    arr('a1', 'n1', 'p1', 'asked', 'waiting'),
    arr('a2', 'n1', 'p2', 'given'),
  ]);
  expect(c.status).toBe('met');
  expect(c.metPeople).toEqual(['p2']);
});

test('waiting outranks declined when nothing is met', () => {
  const c = coverNeed(need('n1'), [
    arr('a1', 'n1', 'p1', 'asked', 'no'),
    arr('a2', 'n1', 'p2', 'asked', 'waiting'),
  ]);
  expect(c.status).toBe('waiting');
});

test('arrangements for other needs are ignored', () => {
  const c = coverNeed(need('n1'), [arr('a1', 'n2', 'p1', 'given')]);
  expect(c.arrangements).toEqual([]);
  expect(c.status).toBe('none');
});

test('two arrangements with the same person are one source', () => {
  const c = coverNeed(need('n1'), [
    arr('a1', 'n1', 'p1', 'given'),
    arr('a2', 'n1', 'p1', 'agreed'),
  ]);
  expect(c.metPeople).toEqual(['p1']);
  expect(c.singleSource).toBe(true);
});

test('a need met by two people is not a single source', () => {
  const c = coverNeed(need('n1'), [
    arr('a1', 'n1', 'p1', 'given'),
    arr('a2', 'n1', 'p2', 'asked', 'yes'),
  ]);
  expect(c.metPeople.length).toBe(2);
  expect(c.singleSource).toBe(false);
});

test('a person carries what they meet, however it came about', () => {
  const cov = deriveCoverage(
    [need('n1'), need('n2'), need('n3')],
    [
      arr('a1', 'n1', 'p1', 'given'),
      arr('a2', 'n2', 'p1', 'asked', 'yes'),
      arr('a3', 'n3', 'p1', 'given'),
      arr('a4', 'n3', 'p2', 'given'),
    ],
    [person('p1'), person('p2')],
  );
  const p1 = cov.people.find((p) => p.person.id === 'p1');
  expect(p1?.meets).toBe(3);
  expect(p1?.soleSourceFor).toBe(2);
  expect(cov.singleSource).toBe(2);
});

test('an unanswered ask does not count as carried', () => {
  const cov = deriveCoverage(
    [need('n1')],
    [arr('a1', 'n1', 'p1', 'asked', 'waiting')],
    [person('p1')],
  );
  expect(cov.people[0]?.meets).toBe(0);
});

test('people are ordered by how much they carry', () => {
  const cov = deriveCoverage(
    [need('n1'), need('n2')],
    [
      arr('a1', 'n1', 'p2', 'given'),
      arr('a2', 'n2', 'p2', 'given'),
      arr('a3', 'n1', 'p1', 'asked', 'waiting'),
    ],
    [person('p1'), person('p2')],
  );
  expect(cov.people[0]?.person.id).toBe('p2');
});

test('concentration is undefined when nothing is met', () => {
  const cov = deriveCoverage([need('n1')], [], [person('p1')]);
  expect(concentration(cov)).toBeUndefined();
});

test('concentration drops as needs spread across people', () => {
  const cov = deriveCoverage(
    [need('n1'), need('n2'), need('n3'), need('n4')],
    [
      arr('a1', 'n1', 'p1', 'given'),
      arr('a2', 'n2', 'p1', 'given'),
      arr('a3', 'n3', 'p2', 'given'),
      arr('a4', 'n4', 'p3', 'given'),
    ],
    [person('p1'), person('p2'), person('p3')],
  );
  expect(concentration(cov)).toBe(0.5);
});

test('givenCount reports needs met without anyone being asked', () => {
  const cov = deriveCoverage(
    [need('n1'), need('n2'), need('n3')],
    [
      arr('a1', 'n1', 'p1', 'given'),
      arr('a2', 'n2', 'p1', 'asked', 'yes'),
      arr('a3', 'n3', 'p2', 'agreed'),
    ],
    [person('p1'), person('p2')],
  );
  expect(givenCount(cov)).toBe(1);
});

test('a request written down but not made leaves the need unmet and unasked', () => {
  const c = coverNeed(need('n1'), [arr('a1', 'n1', 'p1', 'asked', 'unasked')]);
  expect(c.status).toBe('none');
  expect(c.metPeople).toEqual([]);
});

test('an unmade request does not count as waiting on anyone', () => {
  const c = coverNeed(need('n1'), [
    arr('a1', 'n1', 'p1', 'asked', 'unasked'),
    arr('a2', 'n1', 'p2', 'asked', 'no'),
  ]);
  expect(c.status).toBe('declined');
});

test('a floor with only an unmade request is still at risk', () => {
  const cov = deriveCoverage(
    [need('floor', true)],
    [arr('a1', 'floor', 'p1', 'asked', 'unasked')],
    [person('p1')],
  );
  expect(cov.floorsAtRisk).toBe(1);
});

test('empty ledger derives without throwing', () => {
  const cov = deriveCoverage([], [], []);
  expect(cov).toEqual({
    needs: [], people: [], unmet: 0, singleSource: 0, floorsAtRisk: 0,
  });
  expect(concentration(cov)).toBeUndefined();
});

// The summary sentence is the first thing on the coverage page, so its
// arithmetic is worth pinning even though its wording lives in the view.
test('met and unmet counts stay consistent as arrangements change', () => {
  const needs = [need('n1'), need('n2')];
  const people = [person('p1')];

  const none = deriveCoverage(needs, [], people);
  expect(none.unmet).toBe(2);

  const one = deriveCoverage(needs, [arr('a1', 'n1', 'p1', 'given')], people);
  expect(one.needs.length - one.unmet).toBe(1);
  expect(givenCount(one)).toBe(1);

  const both = deriveCoverage(
    needs,
    [arr('a1', 'n1', 'p1', 'given'), arr('a2', 'n2', 'p1', 'asked', 'yes')],
    people,
  );
  expect(both.unmet).toBe(0);
  expect(givenCount(both)).toBe(1);
});
