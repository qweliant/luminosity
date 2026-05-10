// Tests for the deterministic derive layer. These are the functions whose
// output users actually see (synthesized Need sentence, completion bar, SDT
// footnote, Maslow indicator, Jones freedoms). A regression here ships
// visibly broken UI, so we cover the branches explicitly.

import { test, expect, describe } from 'bun:test';
import type { Mapping } from './types';
import {
  deriveNeed,
  formatList,
  hasAnyLensData,
  lensCompletion,
  maslowHighest,
  relationalFreedoms,
  sdtProfile,
} from './derive';

const baseEntry = (overrides: Partial<Mapping> = {}): Mapping => ({
  id: 'test',
  value: 'Compassion',
  need: '',
  friction: '',
  ...overrides,
});

// --- formatList -------------------------------------------------------------

describe('formatList', () => {
  test('empty', () => {
    expect(formatList([])).toBe('');
  });
  test('one item', () => {
    expect(formatList(['a'])).toBe('a');
  });
  test('two items', () => {
    expect(formatList(['a', 'b'])).toBe('a and b');
  });
  test('three or more uses Oxford comma', () => {
    expect(formatList(['a', 'b', 'c'])).toBe('a, b, and c');
    expect(formatList(['a', 'b', 'c', 'd'])).toBe('a, b, c, and d');
  });
});

// --- lensCompletion --------------------------------------------------------

describe('lensCompletion', () => {
  test('empty entry: 0/6', () => {
    const c = lensCompletion(baseEntry());
    expect(c.filled).toBe(0);
    expect(c.total).toBe(6);
    expect(c.steps).toEqual([false, false, false, false, false, false]);
  });

  test('all six steps with classic data', () => {
    const c = lensCompletion(
      baseEntry({
        workability: 4,
        nvcNeeds: ['empathy'],
        coreNeed: 'Connection',
        lifeDesign: { problemFrame: 'open' },
        accelerators: 'sleep',
        need: 'something',
      })
    );
    expect(c.filled).toBe(6);
    expect(c.steps.every(Boolean)).toBe(true);
  });

  test('Contextualize step counts active relational lens with source set', () => {
    const c = lensCompletion(
      baseEntry({
        relational: { active: true, source: 'right_violation' },
      })
    );
    // Only step 5 (Contextualize) should be filled.
    expect(c.steps[4]).toBe(true);
    expect(c.filled).toBe(1);
  });

  test('relational active without a source does NOT count step 5', () => {
    const c = lensCompletion(
      baseEntry({ relational: { active: true } })
    );
    expect(c.steps[4]).toBe(false);
  });

  test('LifeDesign reframeNote alone fills step 4', () => {
    const c = lensCompletion(
      baseEntry({ lifeDesign: { reframeNote: 'how might I…' } })
    );
    expect(c.steps[3]).toBe(true);
  });
});

// --- hasAnyLensData --------------------------------------------------------

describe('hasAnyLensData', () => {
  test('empty entry → false', () => {
    expect(hasAnyLensData(baseEntry())).toBe(false);
  });
  test('any classic lens field → true', () => {
    expect(hasAnyLensData(baseEntry({ workability: 1 }))).toBe(true);
    expect(hasAnyLensData(baseEntry({ nvcNeeds: ['rest'] }))).toBe(true);
    expect(hasAnyLensData(baseEntry({ coreNeed: 'Growth' }))).toBe(true);
  });
  test('relational toggle alone → true (sufficient signal)', () => {
    expect(hasAnyLensData(baseEntry({ relational: { active: true } }))).toBe(true);
  });
  test('inactive relational with checklist values → false', () => {
    expect(
      hasAnyLensData(baseEntry({ relational: { active: false, focusSelf: true } }))
    ).toBe(false);
  });
});

// --- deriveNeed -------------------------------------------------------------

describe('deriveNeed', () => {
  test('fallback prose when no NVC selected', () => {
    const out = deriveNeed(baseEntry({ value: 'Curiosity' }));
    expect(out).toContain('minimum conditions that let curiosity take root');
  });

  test('NVC list builds the lead sentence', () => {
    const out = deriveNeed(
      baseEntry({ value: 'Compassion', nvcNeeds: ['empathy', 'connection', 'contribution'] })
    );
    expect(out).toContain('Reliable access to empathy, connection, and contribution');
    expect(out).toContain('compassion can show up');
  });

  test('coreNeed appends a deeper-need clause', () => {
    const out = deriveNeed(baseEntry({ coreNeed: 'Contribution' }));
    expect(out).toContain('serves my deeper need for contribution');
  });

  test('Reality with acceptanceNote emits navigation prose, not prototype', () => {
    const out = deriveNeed(
      baseEntry({
        lifeDesign: {
          problemFrame: 'reality',
          acceptanceNote: 'plan around their schedule',
          prototype: { mode: 'do', action: 'should be ignored' },
        },
      })
    );
    expect(out).toContain('fact of life — navigating around it: plan around their schedule');
    expect(out).not.toContain('Prototype');
  });

  test('Reality without acceptanceNote falls back to default reality clause', () => {
    const out = deriveNeed(baseEntry({ lifeDesign: { problemFrame: 'reality' } }));
    expect(out).toContain('Treated as reality');
  });

  test('Stuck without prototype emits sticky-problem clause', () => {
    const out = deriveNeed(baseEntry({ lifeDesign: { problemFrame: 'stuck' } }));
    expect(out).toContain('A stuck problem');
  });

  test('Open with talk prototype', () => {
    const out = deriveNeed(
      baseEntry({
        lifeDesign: {
          problemFrame: 'open',
          prototype: { mode: 'talk', action: 'interview Sarah' },
        },
      })
    );
    expect(out).toContain('Prototype (talk): interview Sarah');
  });

  test('Reframe note appears (non-Reality only)', () => {
    const out = deriveNeed(
      baseEntry({ lifeDesign: { problemFrame: 'open', reframeNote: 'How might I X' } })
    );
    expect(out).toContain('Reframe: How might I X');
  });

  test('accelerators and brakes both surface', () => {
    const out = deriveNeed(baseEntry({ accelerators: 'morning', brakes: 'overload' }));
    expect(out).toContain('Accelerators: morning');
    expect(out).toContain('Brakes to watch: overload');
  });

  // --- Relational accountability clause -----------------------------------

  test('inactive relational lens emits no accountability clause', () => {
    const out = deriveNeed(baseEntry({ relational: { active: false, source: 'right_violation' } }));
    expect(out).not.toContain('Accountability');
  });

  test('right_violation with all 4 checks → clean boundary', () => {
    const out = deriveNeed(
      baseEntry({
        relational: {
          active: true,
          source: 'right_violation',
          focusSelf: true,
          intentValue: true,
          isRequest: true,
          preservesAutonomy: true,
        },
      })
    );
    expect(out).toContain('Accountability: this requires asserting an external boundary, not a request — clean boundary.');
  });

  test('agreement_violation with failures → risk + failure list', () => {
    const out = deriveNeed(
      baseEntry({
        relational: {
          active: true,
          source: 'agreement_violation',
          focusSelf: false,
          intentValue: true,
          isRequest: false,
          preservesAutonomy: true,
        },
      })
    );
    expect(out).toContain('Accountability: this requires collaborative repair of a prior agreement.');
    expect(out).toContain('Risk: still overreaches');
    expect(out).toContain('limit my own behavior');
    expect(out).toContain('frame as a request, not a demand');
  });

  test('internal_work with no checklist answers → bare clause', () => {
    const out = deriveNeed(
      baseEntry({ relational: { active: true, source: 'internal_work' } })
    );
    expect(out).toContain('Accountability: this is internal work — no other person needs to change.');
    expect(out).not.toContain('clean boundary');
    expect(out).not.toContain('Risk');
  });

  test('relational active without source emits no clause', () => {
    const out = deriveNeed(baseEntry({ relational: { active: true } }));
    expect(out).not.toContain('Accountability');
  });
});

// --- sdtProfile -------------------------------------------------------------

describe('sdtProfile', () => {
  test('empty profile when no signals', () => {
    expect(sdtProfile(baseEntry())).toEqual({ autonomy: 0, competence: 0, relatedness: 0 });
  });

  test('NVC tags route to their SDT axis', () => {
    const p = sdtProfile(baseEntry({ nvcNeeds: ['empathy', 'choice', 'growth'] }));
    expect(p.relatedness).toBe(1); // empathy
    expect(p.autonomy).toBe(1);    // choice
    expect(p.competence).toBe(1);  // growth
  });

  test('coreNeed contributes one to its axis', () => {
    expect(sdtProfile(baseEntry({ coreNeed: 'Connection' })).relatedness).toBe(1);
    expect(sdtProfile(baseEntry({ coreNeed: 'Growth' })).competence).toBe(1);
    expect(sdtProfile(baseEntry({ coreNeed: 'Comfort' })).autonomy).toBe(1);
  });
});

// --- maslowHighest ----------------------------------------------------------

describe('maslowHighest', () => {
  test('null when no NVC tags', () => {
    expect(maslowHighest(baseEntry())).toBeNull();
  });

  test('returns highest layer reached', () => {
    // movement=physiological(0), belonging=belonging(2), creativity=self-actualization(4)
    expect(
      maslowHighest(baseEntry({ nvcNeeds: ['movement', 'belonging', 'creativity'] }))
    ).toBe('self-actualization');
  });

  test('returns the only layer touched', () => {
    expect(maslowHighest(baseEntry({ nvcNeeds: ['safety'] }))).toBe('safety');
  });

  test('unmapped NVC tags are ignored', () => {
    expect(maslowHighest(baseEntry({ nvcNeeds: ['totally-unknown-tag'] }))).toBeNull();
  });
});

// --- relationalFreedoms ----------------------------------------------------

describe('relationalFreedoms', () => {
  test('empty when relational lens is inactive', () => {
    expect(
      relationalFreedoms(baseEntry({ relational: { active: false }, nvcNeeds: ['rest'] }))
    ).toEqual([]);
  });

  test('returns mapped freedoms when active, deduped', () => {
    const out = relationalFreedoms(
      baseEntry({
        relational: { active: true },
        nvcNeeds: ['rest', 'space', 'movement', 'choice', 'choice'],
      })
    );
    // rest=Bandwidth Allocation, space=Privacy, movement=Embodiment, choice=Self-Determination
    expect(out).toContain('Bandwidth Allocation');
    expect(out).toContain('Privacy');
    expect(out).toContain('Embodiment');
    expect(out).toContain('Self-Determination');
    expect(out.length).toBe(4); // deduped
  });

  test('unmapped NVC tags are silently skipped', () => {
    expect(
      relationalFreedoms(baseEntry({ relational: { active: true }, nvcNeeds: ['xyz'] }))
    ).toEqual([]);
  });
});
