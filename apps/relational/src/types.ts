// Schema source of truth. No React, no I/O.
// storage.ts, derive.ts, useLedger.ts and every component import from here.
//
// The shape exists to answer one question: are my needs met, by whom, and
// have I actually asked? Three objects, and the split between them is the
// whole design:
//
//   Need  — private, mine, absolute. "Non-negotiable" lives HERE and only here.
//   Ask   — private, mine, pointed at one person. Negotiable by definition.
//   Agreement — the only thing another person can see or write to. Not built
//               yet; `Ask.state === 'agreed'` is currently my own record of a
//               yes, not a shared object.
//
// Why the split matters: a need stated as its own delivery mechanism ("you
// cook dinner") collapses into one mandatory implementation, and a need that
// can't be separated from its ask can't be met more than one way. Keeping the
// two apart is what makes a need distributable across people at all.

export type RelationContext = 'partner' | 'friend' | 'family' | 'work' | 'self';

export interface Person {
  id: string;
  name: string;
  // A tag, not a separate ledger. The interesting question — "is this need met
  // anywhere?" — doesn't respect context boundaries: a need for challenge can
  // be met by a coworker and not a partner, and splitting contexts into
  // separate stores would make exactly that invisible.
  context: RelationContext;
  createdAt: number;
}

export interface Need {
  id: string;
  // Stated as the experience, not the errand.
  statement: string;
  // Optional vocabulary tags, from data.ts. Seeds language when the blank
  // field is the hard part; never required.
  tags?: string[];
  /**
   * A floor for me in any arrangement — not a rule on anyone's behavior.
   * Deliberately absent from Ask: the moment "non-negotiable" can attach to a
   * request aimed at a person, this stops being a needs tracker and becomes a
   * rules app.
   */
  floor: boolean;
  createdAt: number;
  // Forward-only journal, same append-only shape the values ledger uses. No UI
  // yet — entries written before it exists simply leave it unset.
  checkpoints?: Checkpoint[];
}

// How a need is actually met by a person. NOT a ladder — three different
// kinds of arrangement, and which are even available depends on the
// relationship.
//
// `given` is the important one and the common one: they meet this, nobody
// negotiated it, and that is a perfectly good state rather than a rung you
// failed to climb. An earlier version of this schema only counted a need as
// met once a request had been made and accepted, which quietly turned the app
// into an argument for formalising every relationship you have. Most needs
// that get met are met without anyone being asked.
export type ArrangementMode = 'given' | 'asked' | 'agreed';

/** Where a request stands. Only meaningful when mode is 'asked'. */
export type AskReply = 'waiting' | 'yes' | 'no';

export interface Arrangement {
  id: string;
  needId: string;
  personId: string;
  mode: ArrangementMode;
  /** The concrete thing asked for. Absent for `given` — nothing was asked. */
  request?: string;
  reply?: AskReply;
  /**
   * Set once this has been carried into the shared space with that person.
   * The link lives on the private side on purpose: the shared document holds
   * the agreement and nothing else, so the other person never learns which
   * need of mine it came from unless I tell them.
   */
  agreementId?: string;
  createdAt: number;
}

/** Whether this arrangement means the need is actually being met. */
export const isMet = (a: Arrangement): boolean =>
  a.mode === 'given' || a.mode === 'agreed' || (a.mode === 'asked' && a.reply === 'yes');

export const ARRANGEMENT_MODES: ArrangementMode[] = ['given', 'asked', 'agreed'];

export const MODE_LABEL: Record<ArrangementMode, string> = {
  given: 'They already do this',
  asked: 'I asked for it',
  agreed: 'We agreed on it',
};

export const REPLIES: AskReply[] = ['waiting', 'yes', 'no'];

export const REPLY_LABEL: Record<AskReply, string> = {
  waiting: 'Waiting to hear',
  yes: 'They said yes',
  no: 'They said no',
};

/**
 * Whether it makes any sense to negotiate wording with this person. You do not
 * open a shared consent space with a coworker to agree on how your need to
 * feel challenged should be phrased. Gating this is what stops the app
 * advocating for a kind of conversation that only fits some relationships.
 */
export const canNegotiate = (context: RelationContext): boolean =>
  context !== 'work' && context !== 'self';

// A dated note on how something is going. Shared shape across Need and Ask so
// the eventual journal view can render either.
export interface Checkpoint {
  at: number;
  landing: number; // 1–5
  note?: string;
}

export const RELATION_CONTEXTS: RelationContext[] = [
  'partner',
  'friend',
  'family',
  'work',
  'self',
];

// --- The shared half --------------------------------------------------------
// Everything above this line is private and mine. Everything below lives in a
// document a second person can write to, which is why it is a log rather than
// a record: events are appended and never edited, so two people acting at once
// merge instead of overwriting each other.
//
// One space per person, never one space for everyone. Two reasons, and the
// second is the load-bearing one: a partner must not be able to read the
// agreements I hold with anyone else.

export type AgreementEventKind = 'proposed' | 'accepted' | 'revised' | 'ended';

export interface AgreementEvent {
  at: number;
  /** Participant id, scoped to the shared space. */
  by: string;
  kind: AgreementEventKind;
  /** Present on proposed and revised: the wording being put forward. */
  text?: string;
}

export type AgreementStatus = 'proposed' | 'agreed' | 'ended';

/** Derived, never stored — the current read of an event log. */
export interface AgreementView {
  id: string;
  text: string;
  status: AgreementStatus;
  events: AgreementEvent[];
  /** Who put the current wording forward. */
  proposedBy: string;
  lastTouched: number;
}

/** A person in a shared space, by the name they chose to show. */
export interface Participant {
  id: string;
  name: string;
}

export const AGREEMENT_STATUS_LABEL: Record<AgreementStatus, string> = {
  proposed: 'Waiting on a yes',
  agreed: 'Agreed',
  ended: 'Ended',
};
