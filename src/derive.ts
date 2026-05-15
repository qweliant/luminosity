import type { Mapping, RelationalLens, RelationalSource } from './types';
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
      return 'Envy as data: this points to a desire I have not given myself permission to pursue. The prototype should test that permission.';
    case 'Jealousy':
      return 'A relationship is at stake — name what is being protected before naming what is being demanded.';
    case 'Resentment':
      return 'Resentment lives in the standard I am holding, not in the other person\'s freedom. Examine which burden can be put down.';
    case 'Guilt':
      return 'Guilt is adaptive — it surfaces behavior that strayed from this value. The need is realignment, not self-condemnation.';
    case 'Perfectionism':
      return 'Perfectionism is a brake disguised as a standard. The need is a tolerable threshold for "good enough."';
    case 'Disappointment':
      return 'Examine the expectation behind this — was it examined and expressed, or stealth?';
    case 'Regret':
      return 'Regret is signal when it surfaces a value to realign with; loop when it does not. Which is this?';
    case 'Fitting In':
      return 'Fitting in costs more than it pays. The need is at least one space where the unmasked self is safe.';
    case 'Anger':
      return 'Test the target: if it is something I can change, route to workability. If not, route to acceptance.';
    case 'Anxiety':
      return 'Anxiety is anticipation without an immediate threat. Ground in what is actually within my control today.';
    default:
      return null;
  }
};

// Cessation prose — when Overwhelm, Shame, Flooding, or any We're Hurting
// emotion is named, the Need is *not* a prototype. Brown's research is
// unambiguous: prescribing action in these states is harmful.
const CESSATION_PROSE: Record<string, string> = {
  Overwhelm:
    'This is overwhelm — cognitive, emotional, and physical processing is shut down. The need is cessation: silence, space, and disengagement until the nervous system resets. Do not plan from here.',
  Shame:
    'This is shame — the story that "I am bad," not "I did something bad." Environmental fixes will fail because the self is the target. The need is self-compassion and naming the experience, not a prototype.',
  Flooding:
    'This is flooding — the body\'s emergency response in conflict. The need is to disengage and return when calm.',
  Grief: 'This is grief. There is no need to prescribe. Presence, witnessing, and time are the only honest response.',
  Anguish: 'This is anguish. There is no prototype that fits — be in it, with support.',
  Despair: 'This is despair. Do not solve. Reach for company, and for the smallest next breath.',
  Hopelessness: 'This is hopelessness. The need is presence — yours, and someone else\'s if possible.',
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

  // Cessation short-circuit. When in a state Brown's research says cannot
  // be planned from, return the compassion sentence and stop — bypassing
  // NVC / Madanes / Stanford / Nagoski entirely.
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
      parts.push(`This is a fact of life — navigating around it: ${ld.acceptanceNote.trim()}.`);
    } else {
      parts.push('Treated as reality — a fact of life to navigate around, not solve.');
    }
  } else {
    if (ld?.reframeNote && ld.reframeNote.trim()) {
      parts.push(`Reframe: ${ld.reframeNote.trim()}.`);
    }
    const action = ld?.prototype?.action?.trim();
    if (action) {
      const pmode = ld?.prototype?.mode === 'talk' ? 'talk' : 'do';
      parts.push(`Prototype (${pmode}): ${action}.`);
    } else if (ld?.problemFrame === 'stuck') {
      parts.push('A stuck problem — sticky, deserving of design attention.');
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
      internal_work: 'this is internal work — no other person needs to change',
    };
    const checks = [r.focusSelf, r.intentValue, r.isRequest, r.preservesAutonomy];
    const allClean = checks.every(c => c === true);
    const failures: string[] = [];
    if (r.focusSelf === false) failures.push('limit my own behavior');
    if (r.intentValue === false) failures.push('honor the value rather than prevent fear');
    if (r.isRequest === false) failures.push('frame as a request, not a demand');
    if (r.preservesAutonomy === false) failures.push('preserve their autonomy');

    if (allClean) {
      parts.push(`Accountability: ${sourceClause[r.source]} — clean boundary.`);
    } else if (failures.length > 0) {
      parts.push(`Accountability: ${sourceClause[r.source]}. Risk: still overreaches — needs to ${formatList(failures)}.`);
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
// low-workability values aren't broken — they're *protected*. A 1 or 2 means
// a Firefighter is doing the work of containing pain; a 3 means a Manager is
// holding the situation together at cost; a 4 or 5 means the Self has room
// to lead. Pure derivation, no schema change. Surfaced as a quiet label.
//
// Not "Firefighter alarmed" — the whole point of the IFS frame is that the
// part is doing protective work and deserves recognition, not a red flag.
export type IfsLayer = 'firefighter' | 'manager' | 'self';

export const ifsLayerForBand = (w: number | undefined): IfsLayer | null => {
  if (!w || w < 1 || w > 5) return null;
  if (w <= 2) return 'firefighter';
  if (w === 3) return 'manager';
  return 'self';
};

export const ifsLayer = (entry: Mapping): IfsLayer | null =>
  ifsLayerForBand(entry.workability);

export const IFS_LAYER_LABEL: Record<IfsLayer, string> = {
  firefighter: 'Firefighter',
  manager: 'Manager',
  self: 'Self',
};

// One-line gloss for chip hover and band headers. Editorial, kind — frames
// each part as doing necessary work, not as a problem to be solved.
export const IFS_LAYER_GLOSS: Record<IfsLayer, string> = {
  firefighter:
    'A Firefighter is on duty here — protecting you from contact with this. The work is to thank it, not override it.',
  manager:
    'A Manager is holding this together. Capable, but carrying the cost. Notice what it is preventing.',
  self:
    'Self is leading here. Curious, calm, connected. Worth naming what makes that possible.',
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
