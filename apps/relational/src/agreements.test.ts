import { test, expect } from 'bun:test';
import { awaitingMe, viewAgreement } from './agreements';
import type { AgreementEvent } from './types';

const ev = (
  at: number,
  by: string,
  kind: AgreementEvent['kind'],
  text?: string,
): AgreementEvent => ({ at, by, kind, ...(text ? { text } : {}) });

test('an empty log has no agreement to read', () => {
  expect(viewAgreement('a', [])).toBeUndefined();
});

test('a proposal on its own is waiting on a yes', () => {
  const v = viewAgreement('a', [ev(1, 'me', 'proposed', 'Text me if plans shift')])!;
  expect(v.status).toBe('proposed');
  expect(v.text).toBe('Text me if plans shift');
  expect(v.proposedBy).toBe('me');
});

test('a yes after the proposal agrees it', () => {
  const v = viewAgreement('a', [
    ev(1, 'me', 'proposed', 'Text me if plans shift'),
    ev(2, 'them', 'accepted'),
  ])!;
  expect(v.status).toBe('agreed');
});

test('revising after a yes drops it back to waiting', () => {
  const v = viewAgreement('a', [
    ev(1, 'me', 'proposed', 'Text me if plans shift'),
    ev(2, 'them', 'accepted'),
    ev(3, 'them', 'revised', 'Text me by the evening if plans shift'),
  ])!;
  expect(v.status).toBe('proposed');
  expect(v.text).toBe('Text me by the evening if plans shift');
  expect(v.proposedBy).toBe('them');
});

test('a yes to the revision agrees it again', () => {
  const v = viewAgreement('a', [
    ev(1, 'me', 'proposed', 'A'),
    ev(2, 'them', 'accepted'),
    ev(3, 'them', 'revised', 'B'),
    ev(4, 'me', 'accepted'),
  ])!;
  expect(v.status).toBe('agreed');
  expect(v.text).toBe('B');
});

test('ending wins over an earlier yes', () => {
  const v = viewAgreement('a', [
    ev(1, 'me', 'proposed', 'A'),
    ev(2, 'them', 'accepted'),
    ev(3, 'me', 'ended'),
  ])!;
  expect(v.status).toBe('ended');
});

test('events arriving out of order still read the same', () => {
  const forwards = viewAgreement('a', [
    ev(1, 'me', 'proposed', 'A'),
    ev(2, 'them', 'accepted'),
    ev(3, 'them', 'revised', 'B'),
  ])!;
  const backwards = viewAgreement('a', [
    ev(3, 'them', 'revised', 'B'),
    ev(1, 'me', 'proposed', 'A'),
    ev(2, 'them', 'accepted'),
  ])!;
  expect(backwards.status).toBe(forwards.status);
  expect(backwards.text).toBe(forwards.text);
  expect(backwards.events).toEqual(forwards.events);
});

test('two peers writing in the same millisecond order identically', () => {
  const a = viewAgreement('a', [
    ev(5, 'aaa', 'proposed', 'A'),
    ev(5, 'bbb', 'proposed', 'B'),
  ])!;
  const b = viewAgreement('a', [
    ev(5, 'bbb', 'proposed', 'B'),
    ev(5, 'aaa', 'proposed', 'A'),
  ])!;
  expect(a.text).toBe(b.text);
  expect(a.events).toEqual(b.events);
});

test('lastTouched is the newest event', () => {
  const v = viewAgreement('a', [
    ev(1, 'me', 'proposed', 'A'),
    ev(9, 'them', 'accepted'),
  ])!;
  expect(v.lastTouched).toBe(9);
});

test('nobody is asked to accept their own wording', () => {
  const v = viewAgreement('a', [ev(1, 'me', 'proposed', 'A')])!;
  expect(awaitingMe(v, 'me')).toBe(false);
  expect(awaitingMe(v, 'them')).toBe(true);
});

test('an agreed or ended agreement is waiting on nobody', () => {
  const agreed = viewAgreement('a', [
    ev(1, 'me', 'proposed', 'A'),
    ev(2, 'them', 'accepted'),
  ])!;
  const ended = viewAgreement('a', [ev(1, 'me', 'proposed', 'A'), ev(2, 'me', 'ended')])!;
  expect(awaitingMe(agreed, 'them')).toBe(false);
  expect(awaitingMe(ended, 'them')).toBe(false);
});

test('a log with no wording at all still reads without throwing', () => {
  const v = viewAgreement('a', [ev(1, 'them', 'accepted')])!;
  expect(v.text).toBe('');
  expect(v.status).toBe('agreed');
});
