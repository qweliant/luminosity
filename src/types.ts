// Schema source of truth. No React, no I/O.
// derive.ts, useBackup.ts, data.ts, and every component file imports from here.

export type LifeDesignProblemType = 'open' | 'stuck' | 'reality';
export type PrototypeMode = 'talk' | 'do';

// Brené Brown · Atlas of the Heart — eight of the thirteen "places we go"
// are friction-relevant; the others (Life Is Good, It's Beyond Us, etc.) are
// positive or self-assessing and don't belong on the friction step.
export type EmotionCluster =
  | 'uncertain'
  | 'compare'
  | 'unplanned'
  | 'hurting'
  | 'fall_short'
  | 'connection'
  | 'heart_open'
  | 'wronged';

// Sander T. Jones — Cultivating Connection. Optional relational accountability
// layer; hidden by default since most entries are solo reflections.
export type RelationalSource = 'right_violation' | 'agreement_violation' | 'internal_work';

export interface RelationalLens {
  active: boolean;
  source?: RelationalSource;
  focusSelf?: boolean;          // true = my behavior, false = theirs
  intentValue?: boolean;        // true = honoring value, false = preventing discomfort
  isRequest?: boolean;          // true = clean request, false = demand
  preservesAutonomy?: boolean;  // true = respects freedom, false = limits them
}

export interface LifeDesignLens {
  wayfinding?: {
    engagement?: number; // 1-5, undefined = unrated
    energy?: number;     // 1-5, undefined = unrated
  };
  problemFrame?: LifeDesignProblemType;
  reframeNote?: string;
  acceptanceNote?: string;
  prototype?: {
    mode?: PrototypeMode;
    action?: string;
  };
}

export interface Mapping {
  id: string;
  value: string;
  need: string;
  friction: string;
  workability?: number;
  nvcNeeds?: string[];
  coreNeed?: string;
  lifeDesign?: LifeDesignLens;
  accelerators?: string;
  brakes?: string;
  relational?: RelationalLens;

  // Atlas of the Heart granularity tag. Cluster is the "place we go"; emotion
  // is the specific feeling inside it. Both optional — entries written before
  // this lens existed simply leave them unset.
  emotionCluster?: EmotionCluster;
  emotion?: string;

  // IFS · single Part tag. Names which user-defined identity is acting in this
  // entry (e.g. "The People Pleaser"). Single-select by design — an entry
  // expresses one part at a time. References Part.id in the parts store.
  partId?: string;
}

// IFS · user-named identities. Parts live in their own top-level store
// (localStorage key `values-mapper-parts-v1` + Yjs map "parts"). They are
// created during entry assignment in Focus mode; the #/parts route surfaces
// a read-only profile per Part. No edit/delete UI by design.
export interface Part {
  id: string;
  name: string;
  createdAt: number;
}

// --- Migration --------------------------------------------------------------
// Two legacy generations exist in the wild:
//   1. Top-level `designConstraint` / `designNote` (pre-Stanford-lens refactor)
//   2. Old enum values (`actionable | anchor | gravity`,
//      `prototype.type: 'interview' | 'experience'`)
// Every new generation should add a branch here. Old snapshots stay readable
// because every snapshot is a complete tree, not a delta.

const PROBLEM_FRAME_LEGACY: Record<string, LifeDesignProblemType> = {
  actionable: 'open',
  anchor: 'stuck',
  gravity: 'reality',
};

const PROTOTYPE_MODE_LEGACY: Record<string, PrototypeMode> = {
  interview: 'talk',
  experience: 'do',
};

type LegacyPrototype = { type?: string; mode?: PrototypeMode; action?: string };
type LegacyLifeDesign = Omit<LifeDesignLens, 'prototype'> & { prototype?: LegacyPrototype };
export type LegacyMapping = Omit<Mapping, 'lifeDesign'> & {
  designConstraint?: boolean;
  designNote?: string;
  lifeDesign?: LegacyLifeDesign;
};

export const migrateMapping = (raw: LegacyMapping): Mapping => {
  const ld: LegacyLifeDesign = raw.lifeDesign ?? {};
  const hasLegacyTopLevel = raw.designConstraint !== undefined || raw.designNote !== undefined;
  const legacyFrame = ld.problemFrame && PROBLEM_FRAME_LEGACY[ld.problemFrame as string];
  const legacyMode = ld.prototype?.type && PROTOTYPE_MODE_LEGACY[ld.prototype.type];

  if (!hasLegacyTopLevel && !legacyFrame && !legacyMode && !raw.lifeDesign) {
    return raw as Mapping;
  }

  if (raw.designConstraint && !ld.problemFrame) {
    ld.problemFrame = 'open';
  }
  if (raw.designNote && raw.designNote.trim()) {
    ld.prototype = {
      mode: ld.prototype?.mode ?? 'do',
      action: ld.prototype?.action ?? raw.designNote,
    };
  }
  if (legacyFrame) {
    ld.problemFrame = legacyFrame;
  }
  if (legacyMode && ld.prototype) {
    ld.prototype = { mode: legacyMode, action: ld.prototype.action };
  }

  const { designConstraint: _dc, designNote: _dn, ...rest } = raw;
  const cleanPrototype = ld.prototype
    ? { mode: ld.prototype.mode, action: ld.prototype.action }
    : undefined;
  const cleanLd: LifeDesignLens = { ...ld, prototype: cleanPrototype };
  return { ...rest, lifeDesign: cleanLd };
};

// --- Visual constants tied to the schema ------------------------------------
// Workability is conceptually part of the schema (1–5 ACT Bullseye), so its
// canonical color mapping lives here, not in a component file. Components that
// render workability marks import this.

export const workabilityColor = (n: number): string =>
  n <= 0 ? 'transparent'
  : n <= 2 ? '#dc2626'
  : n === 3 ? '#d97706'
  : '#16a34a';
