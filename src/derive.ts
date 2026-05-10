import type { Mapping, RelationalLens, RelationalSource } from './types';
import {
  NVC_TO_SDT,
  NVC_TO_MASLOW,
  MASLOW_LEVELS,
  NVC_TO_FREEDOMS,
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

export const lensCompletion = (entry: Mapping): LensCompletion => {
  const ld = entry.lifeDesign;
  const steps = [
    !!entry.workability && entry.workability > 0,
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
    entry.relational?.active
  );
};

export const deriveNeed = (entry: Mapping): string => {
  const value = (entry.value || 'this value').trim();
  const valueLower = value.toLowerCase();
  const nvc = entry.nvcNeeds ?? [];
  const core = entry.coreNeed;
  const ld = entry.lifeDesign;
  const accel = entry.accelerators?.trim();
  const brakes = entry.brakes?.trim();

  const parts: string[] = [];

  if (nvc.length > 0) {
    parts.push(`Reliable access to ${formatList(nvc)}, so ${valueLower} can show up in everyday life.`);
  } else {
    parts.push(`The minimum conditions that let ${valueLower} take root in everyday life.`);
  }

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
