import type { Mapping } from './App';
import { NVC_TO_SDT } from './data';

export type SdtAxis = 'autonomy' | 'competence' | 'relatedness';
export type SdtProfile = Record<SdtAxis, number>;

export const formatList = (items: string[]): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
};

export const hasAnyLensData = (entry: Mapping): boolean =>
  !!(
    entry.workability ||
    (entry.nvcNeeds && entry.nvcNeeds.length > 0) ||
    entry.coreNeed ||
    entry.designConstraint ||
    (entry.designNote && entry.designNote.trim()) ||
    (entry.accelerators && entry.accelerators.trim()) ||
    (entry.brakes && entry.brakes.trim())
  );

export const deriveNeed = (entry: Mapping): string => {
  const value = (entry.value || 'this value').trim();
  const valueLower = value.toLowerCase();
  const nvc = entry.nvcNeeds ?? [];
  const core = entry.coreNeed;
  const note = entry.designNote?.trim();
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

  if (note) {
    parts.push(`Iterating via: ${note}.`);
  } else if (entry.designConstraint) {
    parts.push(`Treated as a design constraint to iterate on.`);
  }

  if (accel) parts.push(`Accelerators: ${accel}.`);
  if (brakes) parts.push(`Brakes to watch: ${brakes}.`);

  return parts.join(' ');
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
    case 'Certainty':
    case 'Variety':
      profile.autonomy++;
      break;
  }
  return profile;
};
