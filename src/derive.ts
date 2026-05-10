import type { Mapping } from './App';
import { NVC_TO_SDT, NVC_TO_MASLOW, MASLOW_LEVELS, type MaslowLevel } from './data';

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
    !!(entry.accelerators && entry.accelerators.trim()) || !!(entry.brakes && entry.brakes.trim()),
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
    (entry.brakes && entry.brakes.trim())
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

  return parts.join(' ');
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
