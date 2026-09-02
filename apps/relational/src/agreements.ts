// Reading an agreement out of its event log. Pure — no React, no Yjs.
//
// Nothing here mutates: an agreement's whole state is a fold over events that
// only ever get appended. That is what makes two writers safe, and it is also
// what makes the history worth keeping — "we changed this twice and I never
// said yes to the second version" is a fact the app should be able to show.

import type { AgreementEvent, AgreementStatus, AgreementView } from './types';

/**
 * A total order two peers will always agree on. Wall clocks on two devices are
 * not in lockstep, and two events can genuinely share a millisecond, so ties
 * break on the participant id and then the kind — arbitrary, but identical
 * everywhere, which is the only property that matters.
 */
const ordered = (events: AgreementEvent[]): AgreementEvent[] =>
  [...events].sort(
    (a, b) => a.at - b.at || a.by.localeCompare(b.by) || a.kind.localeCompare(b.kind),
  );

const carriesText = (e: AgreementEvent): boolean =>
  e.kind === 'proposed' || e.kind === 'revised';

export const viewAgreement = (
  id: string,
  events: AgreementEvent[],
): AgreementView | undefined => {
  if (events.length === 0) return undefined;
  const sorted = ordered(events);
  const last = sorted[sorted.length - 1]!;

  // The most recent wording, and where it sits in the log.
  let textAt = -1;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (carriesText(sorted[i]!)) {
      textAt = i;
      break;
    }
  }
  const current = textAt >= 0 ? sorted[textAt]! : undefined;

  // A yes only counts if it came after the wording it is answering. Revising
  // the text drops the agreement back to unaccepted rather than carrying the
  // old yes forward — consent is to a specific sentence, not to a slot.
  const acceptedAfterText = sorted
    .slice(textAt + 1)
    .some((e) => e.kind === 'accepted');

  const status: AgreementStatus =
    last.kind === 'ended' ? 'ended' : acceptedAfterText ? 'agreed' : 'proposed';

  return {
    id,
    text: current?.text ?? '',
    status,
    events: sorted,
    proposedBy: current?.by ?? last.by,
    lastTouched: last.at,
  };
};

/**
 * Whether this participant is the one being waited on. Nobody should be shown
 * an "Accept" button for wording they themselves just put forward.
 */
export const awaitingMe = (view: AgreementView, me: string): boolean =>
  view.status === 'proposed' && view.proposedBy !== me;
