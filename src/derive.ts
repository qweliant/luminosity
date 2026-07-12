import type { Checkpoint, Mapping, RelationalLens, RelationalSource } from './types';
import {
  NVC_TO_SDT,
  NVC_TO_MASLOW,
  MASLOW_LEVELS,
  NVC_TO_FREEDOMS,
  findEmotion,
  type MaslowLevel,
  type JonesFreedom,
} from './data';

export type SdtAxis = 'autonomy' | 'competence' | 'relatedness';
export type SdtProfile = Record<SdtAxis, number>;

export const formatList = (items: string[]): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
};

export interface LensCompletion {
  steps: boolean[];
  filled: number;
  total: number;
}

// The Contextualize step counts as filled if Nagoski has data OR if the
// optional relational lens is active and the user has answered the source
// radio. We deliberately do not promote relational into its own step — it's
// gated and not meaningful for solo entries.
const relationalAnswered = (r: RelationalLens | undefined): boolean =>
  !!(r?.active && r.source);

// Atlas of the Heart cessation states: emotions where prescribing a Need
// sentence is actively harmful. The synthesize step short-circuits to a
// compassion frame instead of running the full template.
export const isCessationState = (entry: Mapping): boolean => {
  const e = findEmotion(entry.emotionCluster, entry.emotion);
  return !!e?.cessation;
};

export const lensCompletion = (entry: Mapping): LensCompletion => {
  const ld = entry.lifeDesign;
  // Step 1 (Diagnose) fills if EITHER ACT workability is rated OR an Atlas of
  // the Heart cluster is picked — both are diagnostic moves on the friction.
  const diagnoseFilled =
    (!!entry.workability && entry.workability > 0) || !!entry.emotionCluster;
  const steps = [
    diagnoseFilled,
    !!entry.nvcNeeds && entry.nvcNeeds.length > 0,
    !!entry.coreNeed,
    !!ld?.problemFrame
      || !!(ld?.reframeNote && ld.reframeNote.trim())
      || !!(ld?.acceptanceNote && ld.acceptanceNote.trim())
      || !!(ld?.prototype?.action && ld.prototype.action.trim()),
    !!(entry.accelerators && entry.accelerators.trim())
      || !!(entry.brakes && entry.brakes.trim())
      || relationalAnswered(entry.relational),
    !!(entry.need && entry.need.trim()),
  ];
  return {
    steps,
    filled: steps.filter(Boolean).length,
    total: steps.length,
  };
};

export const hasAnyLensData = (entry: Mapping): boolean => {
  const ld = entry.lifeDesign;
  return !!(
    entry.workability ||
    (entry.nvcNeeds && entry.nvcNeeds.length > 0) ||
    entry.coreNeed ||
    ld?.problemFrame ||
    (ld?.reframeNote && ld.reframeNote.trim()) ||
    (ld?.acceptanceNote && ld.acceptanceNote.trim()) ||
    (ld?.prototype?.action && ld.prototype.action.trim()) ||
    ld?.wayfinding?.engagement ||
    ld?.wayfinding?.energy ||
    (entry.accelerators && entry.accelerators.trim()) ||
    (entry.brakes && entry.brakes.trim()) ||
    entry.relational?.active ||
    entry.emotionCluster
  );
};

// Non-cessation emotion biases. Each named emotion adds one clause that
// reframes the Need toward the specific corrective Brown describes. Silent
// for emotions without a meaningful frame shift.
const atlasBias = (entry: Mapping): string | null => {
  switch (entry.emotion) {
    case 'Envy':
      return 'Envy as data: this points to a desire I have not given myself permission to pursue. The small test should try that permission.';
    case 'Jealousy':
      return 'A relationship is at stake. Name what is being protected before naming what is being demanded.';
    case 'Resentment':
      return 'Resentment lives in the standard I am holding, not in the other person\'s freedom. Examine which burden can be put down.';
    case 'Guilt':
      return 'Guilt is adaptive: it surfaces behavior that strayed from this value. The need is realignment, not self-condemnation.';
    case 'Perfectionism':
      return 'Perfectionism is a brake disguised as a standard. The need is a tolerable threshold for "good enough."';
    case 'Disappointment':
      return 'Examine the expectation behind this. Was it examined and expressed, or unspoken?';
    case 'Regret':
      return 'Regret is signal when it surfaces a value to realign with; loop when it does not. Which is this?';
    case 'Fitting In':
      return 'Fitting in costs more than it pays. The need is at least one space where the unmasked self is safe.';
    case 'Anger':
      return 'Test the target: if it is something I can change, act on it. If not, work toward acceptance.';
    case 'Anxiety':
      return 'Anxiety is anticipation without an immediate threat. Ground in what is within my control today.';
    default:
      return null;
  }
};

// Cessation prose — when Overwhelm, Shame, Flooding, or any We're Hurting
// emotion is named, the Need is *not* a prototype. Three lines of evidence
// converge here: Brown (Atlas of the Heart) on overwhelm specifically — the
// only reset is doing nothing; window-of-tolerance / affect regulation
// (Siegel) — the thinking brain must come back online before problem-solving;
// and self-compassion (Neff) — prescribing action from shame triggers the
// abstinence-violation spiral rather than change.
const CESSATION_PROSE: Record<string, string> = {
  Overwhelm:
    'This is overwhelm. Your thinking, feelings, and body have shut down for now. What you need is to stop: quiet and space until things settle. Don\'t plan from here.',
  Shame:
    'This is shame: the story that "I am bad," not "I did something bad." Fixing your circumstances won\'t help, because the target is you. What you need is self-compassion, and to name what you\'re feeling. Not a plan.',
  Flooding:
    'This is flooding: your body\'s alarm going off in conflict. Step away, and come back when you\'re calm.',
  Grief: 'This is grief. There is nothing to prescribe. Presence and time are the only honest response.',
  Anguish: 'This is anguish. No plan fits. Be in it, with support.',
  Despair: 'This is despair. Do not solve. Reach for company, and for the smallest next breath.',
  Hopelessness: 'This is hopelessness. What you need is presence: yours, and someone else\'s if possible.',
  Sadness: 'This is sadness. It is not asking to be fixed. Let it be felt.',
};

export const deriveNeed = (entry: Mapping): string => {
  const value = (entry.value || 'this value').trim();
  const valueLower = value.toLowerCase();
  const nvc = entry.nvcNeeds ?? [];
  const core = entry.coreNeed;
  const ld = entry.lifeDesign;
  const accel = entry.accelerators?.trim();
  const brakes = entry.brakes?.trim();

  // Cessation short-circuit. When in a state the evidence says cannot be
  // planned from (see CESSATION_PROSE), return the compassion sentence and
  // stop — bypassing NVC / core-needs / Stanford / Nagoski entirely.
  if (isCessationState(entry) && entry.emotion && CESSATION_PROSE[entry.emotion]) {
    return CESSATION_PROSE[entry.emotion]!;
  }

  const parts: string[] = [];

  if (nvc.length > 0) {
    parts.push(`Reliable access to ${formatList(nvc)}, so ${valueLower} can show up in everyday life.`);
  } else {
    parts.push(`The minimum conditions that let ${valueLower} take root in everyday life.`);
  }

  // Atlas of the Heart bias — adds one targeted clause for emotions whose
  // frame meaningfully shifts the Need. Silent for emotions without a bias.
  const emotionBias = atlasBias(entry);
  if (emotionBias) parts.push(emotionBias);

  if (core) {
    parts.push(`This serves my deeper need for ${core.toLowerCase()}.`);
  }

  if (ld?.problemFrame === 'reality') {
    if (ld.acceptanceNote && ld.acceptanceNote.trim()) {
      parts.push(`This is a fact of life, working around it: ${ld.acceptanceNote.trim()}.`);
    } else {
      parts.push('Treated as reality: a fact of life to work around, not solve.');
    }
  } else {
    if (ld?.reframeNote && ld.reframeNote.trim()) {
      parts.push(`Reframe: ${ld.reframeNote.trim()}.`);
    }
    const action = ld?.prototype?.action?.trim();
    if (action) {
      const pmode = ld?.prototype?.mode === 'talk' ? 'talk' : 'do';
      parts.push(`To try (${pmode}): ${action}.`);
    } else if (ld?.problemFrame === 'stuck') {
      parts.push('A stuck problem: sticky, and worth some attention.');
    }
  }

  if (accel) parts.push(`Accelerators: ${accel}.`);
  if (brakes) parts.push(`Brakes to watch: ${brakes}.`);

  // Relational accountability clause (Sander T. Jones · Cultivating Connection).
  // Only emitted when the lens is explicitly active. Frames the need as
  // self-accountable rather than coercive based on the source classification
  // and the boundary checklist outcome.
  const r = entry.relational;
  if (r?.active && r.source) {
    const sourceClause: Record<RelationalSource, string> = {
      right_violation: 'this requires asserting an external boundary, not a request',
      agreement_violation: 'this requires collaborative repair of a prior agreement',
      internal_work: 'this is internal work; no other person needs to change',
    };
    const checks = [r.focusSelf, r.intentValue, r.isRequest, r.preservesAutonomy];
    const allClean = checks.every(c => c === true);
    const failures: string[] = [];
    if (r.focusSelf === false) failures.push('limit my own behavior');
    if (r.intentValue === false) failures.push('honor the value rather than prevent fear');
    if (r.isRequest === false) failures.push('frame as a request, not a demand');
    if (r.preservesAutonomy === false) failures.push('preserve their autonomy');

    if (allClean) {
      parts.push(`Accountability: ${sourceClause[r.source]}. A clean boundary.`);
    } else if (failures.length > 0) {
      parts.push(`Accountability: ${sourceClause[r.source]}. Risk: still overreaches, needs to ${formatList(failures)}.`);
    } else {
      parts.push(`Accountability: ${sourceClause[r.source]}.`);
    }
  }

  return parts.join(' ');
};

// --- Relational lens · derived freedoms -------------------------------------
// Cross-references selected NVC tags against Jones's 13 Fundamental Freedoms.
// Read-only indicator surfaced only when the relational lens is active.
export const relationalFreedoms = (entry: Mapping): JonesFreedom[] => {
  if (!entry.relational?.active) return [];
  const seen = new Set<JonesFreedom>();
  for (const n of entry.nvcNeeds ?? []) {
    const f = NVC_TO_FREEDOMS[n];
    if (f) seen.add(f);
  }
  return Array.from(seen);
};

export const maslowHighest = (entry: Mapping): MaslowLevel | null => {
  let highestIdx = -1;
  for (const n of entry.nvcNeeds ?? []) {
    const lvl = NVC_TO_MASLOW[n];
    if (!lvl) continue;
    const idx = MASLOW_LEVELS.indexOf(lvl);
    if (idx > highestIdx) highestIdx = idx;
  }
  return highestIdx === -1 ? null : MASLOW_LEVELS[highestIdx]!;
};

// --- IFS overlay · derived parts layer --------------------------------------
// Internal Family Systems reading of the ACT workability band. The premise:
// low-workability values aren't broken — they're *protected*. A low band means
// a protector is doing the work; a high band means the Self has room to lead.
//
// VALIDITY NOTE: we deliberately do NOT split low bands into "Firefighter" vs
// "Manager". In IFS those name a protector's *strategy* (reactive/relief vs.
// proactive/control), which is orthogonal to how well the value is working — a
// rigidly "working" value can be a white-knuckling manager; a stuck one could
// be either. Inferring the subtype from a 1–5 number conflated two axes and
// over-claimed. The subtype belongs to the entry/part content, not the band,
// so we surface a single non-committal "Protector" instead.
export type IfsLayer = 'protector' | 'self';

export const ifsLayerForBand = (w: number | undefined): IfsLayer | null => {
  if (!w || w < 1 || w > 5) return null;
  return w >= 4 ? 'self' : 'protector';
};

export const ifsLayer = (entry: Mapping): IfsLayer | null =>
  ifsLayerForBand(entry.workability);

export const IFS_LAYER_LABEL: Record<IfsLayer, string> = {
  protector: 'Protector',
  self: 'Self',
};

// One-line gloss for chip hover and band headers. Editorial, kind — frames
// each part as doing necessary work, not as a problem to be solved.
export const IFS_LAYER_GLOSS: Record<IfsLayer, string> = {
  protector:
    'A protector is active here — this value is being guarded, not failing. Whether it works by vigilant control or by reactive relief shows in how you meet it, not in the number. The work is to thank it, not override it.',
  self:
    'Self may have room to lead here — curious, calm, connected. Worth naming what makes that possible.',
};

export const sdtProfile = (entry: Mapping): SdtProfile => {
  const profile: SdtProfile = { autonomy: 0, competence: 0, relatedness: 0 };
  for (const n of entry.nvcNeeds ?? []) {
    const axis = NVC_TO_SDT[n];
    if (axis) profile[axis]++;
  }
  switch (entry.coreNeed) {
    case 'Connection':
    case 'Contribution':
      profile.relatedness++;
      break;
    case 'Growth':
    case 'Significance':
      profile.competence++;
      break;
    case 'Comfort':
    case 'Variety':
      profile.autonomy++;
      break;
  }
  return profile;
};

// --- Reinforcement loop · committed action + lived evidence -----------------
// The missing action limb. Discovery/diagnosis is centripetal; this is the
// centrifugal half that carries a value back into daily choices. Two grounded
// mechanisms:
//   1. Committed action as a Gollwitzer implementation intention ("when X,
//      I will Y") — meta-analytic d ≈ 0.65 for closing the intention→behavior
//      gap (Commitment lives on the Mapping).
//   2. Positive-evidence logging — behavioral-activation / self-monitoring
//      reactivity: marking a value *lived* strengthens it. `practiced` is a
//      log of epoch-ms timestamps, one per "lived it" tap.
//
// We report DIRECTION (counts, recency), never a breakable streak: a snapped
// streak triggers the abstinence-violation ("what-the-hell") spiral, which is
// the opposite of what self-compassion research prescribes — and consistent
// with the cessation ethic above.

export const hasCommitment = (entry: Mapping): boolean =>
  !!entry.commitment?.action?.trim();

// Local-day key (YYYY-MM-DD in the viewer's timezone) so a "lived it" tap
// belongs to the calendar day the user experienced, not a UTC boundary.
export const dayKey = (ts: number): string => {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const practicedToday = (entry: Mapping, now: number = Date.now()): boolean => {
  const key = dayKey(now);
  return (entry.practiced ?? []).some((ts) => dayKey(ts) === key);
};

// Distinct calendar days this value was ever marked lived.
export const livedDays = (entry: Mapping): number => {
  const days = new Set<string>();
  for (const ts of entry.practiced ?? []) days.add(dayKey(ts));
  return days.size;
};

// Distinct days lived within the trailing window (default 7) — the "direction"
// figure surfaced to the user. No streak, no zeroing on a miss.
export const livedInWindow = (
  entry: Mapping,
  windowDays = 7,
  now: number = Date.now(),
): number => {
  const cutoff = now - windowDays * 86_400_000;
  const days = new Set<string>();
  for (const ts of entry.practiced ?? []) {
    if (ts >= cutoff) days.add(dayKey(ts));
  }
  return days.size;
};

// --- Value journal · the arc ------------------------------------------------
// The snapshot model overwrote history on every re-rating; these give a value
// a memory. `appendCheckpoint` coalesces to one entry per local day so
// intra-day fiddling with the rating dots doesn't spam the arc — the last
// rating of the day wins.

export const appendCheckpoint = (
  log: Checkpoint[],
  workability: number,
  at: number = Date.now(),
  note?: string,
): Checkpoint[] => {
  const cp: Checkpoint = note ? { at, workability, note } : { at, workability };
  const last = log[log.length - 1];
  if (last && dayKey(last.at) === dayKey(at)) {
    return [...log.slice(0, -1), cp];
  }
  return [...log, cp];
};

// Epoch-ms of the most recent checkpoint, or null if the value was never rated
// since the journal existed.
export const lastTouched = (entry: Mapping): number | null => {
  const log = entry.checkpoints ?? [];
  const last = log[log.length - 1];
  return last ? last.at : null;
};

// Whole days since the last checkpoint — the clock a re-check / "tended" mode
// runs on. Null when there's no history yet.
export const daysSinceTouched = (
  entry: Mapping,
  now: number = Date.now(),
): number | null => {
  const t = lastTouched(entry);
  if (t == null) return null;
  return Math.max(0, Math.floor((now - t) / 86_400_000));
};

// The rating trend, oldest → newest, for the sparkline.
export const workabilityArc = (entry: Mapping): number[] =>
  (entry.checkpoints ?? []).map((c) => c.workability);

// Direction of the most recent move. Null until there are at least two points.
export const arcDirection = (
  entry: Mapping,
): 'rising' | 'falling' | 'steady' | null => {
  const arc = workabilityArc(entry);
  if (arc.length < 2) return null;
  const prev = arc[arc.length - 2]!;
  const curr = arc[arc.length - 1]!;
  if (curr > prev) return 'rising';
  if (curr < prev) return 'falling';
  return 'steady';
};

// A value is a candidate for a gentle "still true?" re-check when it's been
// sitting as working (4–5) and untouched for a while. Forward-only: entries
// with no journal yet return false until their first re-rating.
export const needsRecheck = (
  entry: Mapping,
  staleDays = 21,
  now: number = Date.now(),
): boolean => {
  if (!entry.workability || entry.workability < 4) return false;
  const d = daysSinceTouched(entry, now);
  return d != null && d >= staleDays;
};
