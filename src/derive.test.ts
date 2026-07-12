// Tests for the deterministic derive layer. These are the functions whose
// output users actually see (synthesized Need sentence, completion bar, SDT
// footnote, Maslow indicator, Jones freedoms). A regression here ships
// visibly broken UI, so we cover the branches explicitly.

import { test, expect, describe } from 'bun:test';
import type { Mapping } from './types';
import {
  appendCheckpoint,
  arcDirection,
  daysSinceTouched,
  deriveNeed,
  formatList,
  hasAnyLensData,
  hasCommitment,
  ifsLayer,
  ifsLayerForBand,
  isCessationState,
  lastTouched,
  lensCompletion,
  livedDays,
  livedInWindow,
  maslowHighest,
  needsRecheck,
  practicedToday,
  relationalFreedoms,
  sdtProfile,
  workabilityArc,
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

  test('emotionCluster alone fills the Diagnose step (no workability needed)', () => {
    const c = lensCompletion(baseEntry({ emotionCluster: 'fall_short' }));
    expect(c.steps[0]).toBe(true);
    expect(c.filled).toBe(1);
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
  test('emotionCluster alone → true', () => {
    expect(hasAnyLensData(baseEntry({ emotionCluster: 'uncertain' }))).toBe(true);
  });
});

// --- isCessationState ------------------------------------------------------

describe('isCessationState', () => {
  test('cluster alone is not enough — needs the specific emotion', () => {
    expect(isCessationState(baseEntry({ emotionCluster: 'fall_short' }))).toBe(false);
  });
  test('non-cessation emotion in a friction cluster → false', () => {
    expect(
      isCessationState(baseEntry({ emotionCluster: 'fall_short', emotion: 'Guilt' }))
    ).toBe(false);
  });
  test('Shame in We Fall Short → true', () => {
    expect(
      isCessationState(baseEntry({ emotionCluster: 'fall_short', emotion: 'Shame' }))
    ).toBe(true);
  });
  test('Overwhelm in Uncertain → true', () => {
    expect(
      isCessationState(baseEntry({ emotionCluster: 'uncertain', emotion: 'Overwhelm' }))
    ).toBe(true);
  });
  test('Flooding in Heart Is Open → true', () => {
    expect(
      isCessationState(baseEntry({ emotionCluster: 'heart_open', emotion: 'Flooding' }))
    ).toBe(true);
  });
  test('every emotion in We\'re Hurting is cessation', () => {
    for (const e of ['Anguish', 'Hopelessness', 'Despair', 'Sadness', 'Grief']) {
      expect(
        isCessationState(baseEntry({ emotionCluster: 'hurting', emotion: e }))
      ).toBe(true);
    }
  });
  test('mismatched cluster + emotion → false (emotion must live in the cluster)', () => {
    expect(
      isCessationState(baseEntry({ emotionCluster: 'compare', emotion: 'Shame' }))
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
    expect(out).toContain('fact of life, working around it: plan around their schedule');
    expect(out).not.toContain('To try');
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
    expect(out).toContain('To try (talk): interview Sarah');
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
    expect(out).toContain('Accountability: this requires asserting an external boundary, not a request. A clean boundary.');
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
    expect(out).toContain('Accountability: this is internal work; no other person needs to change.');
    expect(out).not.toContain('clean boundary');
    expect(out).not.toContain('Risk');
  });

  test('relational active without source emits no clause', () => {
    const out = deriveNeed(baseEntry({ relational: { active: true } }));
    expect(out).not.toContain('Accountability');
  });

  // --- Atlas of the Heart · cessation short-circuit -----------------------

  test('Shame returns compassion frame only, bypassing NVC/Stanford clauses', () => {
    const out = deriveNeed(
      baseEntry({
        nvcNeeds: ['empathy', 'connection'],
        coreNeed: 'Connection',
        lifeDesign: { problemFrame: 'open', prototype: { mode: 'do', action: 'try a thing' } },
        emotionCluster: 'fall_short',
        emotion: 'Shame',
      })
    );
    expect(out).toContain('shame');
    expect(out).toContain('self-compassion');
    // The full template should not appear.
    expect(out).not.toContain('Reliable access');
    expect(out).not.toContain('Prototype');
    expect(out).not.toContain('deeper need');
  });

  test('Overwhelm returns cessation frame only', () => {
    const out = deriveNeed(
      baseEntry({
        nvcNeeds: ['rest'],
        emotionCluster: 'uncertain',
        emotion: 'Overwhelm',
      })
    );
    expect(out).toContain('This is overwhelm');
    expect(out).not.toContain('Reliable access');
  });

  test('Grief returns its own line, no prescription', () => {
    const out = deriveNeed(
      baseEntry({ emotionCluster: 'hurting', emotion: 'Grief' })
    );
    expect(out.toLowerCase()).toContain('grief');
    expect(out).not.toContain('Reliable access');
  });

  // --- Atlas of the Heart · non-cessation biases --------------------------

  test('Envy adds the latent-desire clause', () => {
    const out = deriveNeed(
      baseEntry({ emotionCluster: 'compare', emotion: 'Envy' })
    );
    expect(out).toContain('Envy as data');
    expect(out).toContain('have not given myself permission');
  });

  test('Resentment routes to the self-imposed standard, not the other person', () => {
    const out = deriveNeed(
      baseEntry({ emotionCluster: 'compare', emotion: 'Resentment' })
    );
    expect(out).toContain('the standard I am holding');
  });

  test('Guilt frames the Need as realignment, not condemnation', () => {
    const out = deriveNeed(
      baseEntry({ emotionCluster: 'fall_short', emotion: 'Guilt' })
    );
    expect(out).toContain('realignment');
  });

  test('Disappointment surfaces the expectation question', () => {
    const out = deriveNeed(
      baseEntry({ emotionCluster: 'unplanned', emotion: 'Disappointment' })
    );
    expect(out).toContain('expectation');
  });

  test('Anger routes to the workability/acceptance branch question', () => {
    const out = deriveNeed(
      baseEntry({ emotionCluster: 'wronged', emotion: 'Anger' })
    );
    expect(out).toContain('Test the target');
  });

  test('Cluster without emotion emits no bias clause', () => {
    const out = deriveNeed(
      baseEntry({ emotionCluster: 'compare' })
    );
    expect(out).not.toContain('Envy');
    expect(out).not.toContain('Resentment');
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

// --- ifsLayer --------------------------------------------------------------
// IFS overlay on the ACT workability band. Pure derivation: bands 1-3 →
// Protector (a single non-committal layer — we don't infer firefighter-vs-
// manager from a number), 4-5 → Self. No schema change; null when the entry
// hasn't been rated.

describe('ifsLayerForBand', () => {
  test('1, 2 and 3 → protector', () => {
    expect(ifsLayerForBand(1)).toBe('protector');
    expect(ifsLayerForBand(2)).toBe('protector');
    expect(ifsLayerForBand(3)).toBe('protector');
  });

  test('4 and 5 → self', () => {
    expect(ifsLayerForBand(4)).toBe('self');
    expect(ifsLayerForBand(5)).toBe('self');
  });

  test('out-of-range / undefined → null', () => {
    expect(ifsLayerForBand(0)).toBeNull();
    expect(ifsLayerForBand(6)).toBeNull();
    expect(ifsLayerForBand(undefined)).toBeNull();
  });
});

describe('ifsLayer', () => {
  test('mirrors ifsLayerForBand for rated entries', () => {
    expect(ifsLayer(baseEntry({ workability: 1 }))).toBe('protector');
    expect(ifsLayer(baseEntry({ workability: 3 }))).toBe('protector');
    expect(ifsLayer(baseEntry({ workability: 5 }))).toBe('self');
  });

  test('unrated entry → null', () => {
    expect(ifsLayer(baseEntry())).toBeNull();
  });
});

// --- reinforcement loop -----------------------------------------------------
// Committed action + lived-evidence log. Direction, never streaks: livedInWindow
// counts distinct days in the trailing window; a gap doesn't zero anything.

const DAY = 86_400_000;
// Fixed local midday so ±1 day always crosses a calendar boundary (no DST edge).
const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime();

describe('hasCommitment', () => {
  test('false when unset or whitespace, true when action present', () => {
    expect(hasCommitment(baseEntry())).toBe(false);
    expect(
      hasCommitment(
        baseEntry({ commitment: { cue: 'x', action: '   ', mode: 'do', createdAt: NOW } }),
      ),
    ).toBe(false);
    expect(
      hasCommitment(
        baseEntry({ commitment: { cue: '', action: 'text a friend', mode: 'talk', createdAt: NOW } }),
      ),
    ).toBe(true);
  });
});

describe('practicedToday', () => {
  test('true only when a timestamp falls on the local day of `now`', () => {
    expect(practicedToday(baseEntry({ practiced: [NOW] }), NOW)).toBe(true);
    expect(practicedToday(baseEntry({ practiced: [NOW - DAY] }), NOW)).toBe(false);
    expect(practicedToday(baseEntry(), NOW)).toBe(false);
  });
});

describe('livedDays', () => {
  test('counts distinct calendar days, de-duping same-day taps', () => {
    expect(livedDays(baseEntry({ practiced: [NOW, NOW - 60_000] }))).toBe(1);
    expect(livedDays(baseEntry({ practiced: [NOW, NOW - DAY, NOW - 2 * DAY] }))).toBe(3);
    expect(livedDays(baseEntry())).toBe(0);
  });
});

describe('livedInWindow', () => {
  test('counts distinct days inside the trailing window, excludes older', () => {
    const e = baseEntry({ practiced: [NOW, NOW - 3 * DAY, NOW - 10 * DAY] });
    expect(livedInWindow(e, 7, NOW)).toBe(2); // 10-days-ago falls outside
    expect(livedInWindow(e, 14, NOW)).toBe(3);
  });

  test('a gap does not reset the count (direction, not streak)', () => {
    // lived 6 days ago and today, nothing between — still counts both.
    const e = baseEntry({ practiced: [NOW, NOW - 6 * DAY] });
    expect(livedInWindow(e, 7, NOW)).toBe(2);
  });
});

// --- Value journal / arc ----------------------------------------------------

describe('appendCheckpoint', () => {
  test('appends on a fresh day', () => {
    expect(appendCheckpoint([], 4, NOW)).toEqual([{ at: NOW, workability: 4 }]);
  });

  test('coalesces a same-day re-rating (last of the day wins)', () => {
    const day1 = appendCheckpoint([], 3, NOW);
    const again = appendCheckpoint(day1, 5, NOW + 60_000);
    expect(again).toHaveLength(1);
    expect(again[0]).toEqual({ at: NOW + 60_000, workability: 5 });
  });

  test('appends a separate checkpoint on a different day', () => {
    const day1 = appendCheckpoint([], 3, NOW - DAY);
    const day2 = appendCheckpoint(day1, 4, NOW);
    expect(day2.map((c) => c.workability)).toEqual([3, 4]);
  });

  test('carries an optional note', () => {
    expect(appendCheckpoint([], 2, NOW, 'about time now')[0]!.note).toBe(
      'about time now',
    );
  });
});

describe('journal reads', () => {
  const e = baseEntry({
    checkpoints: [
      { at: NOW - 2 * DAY, workability: 2 },
      { at: NOW - DAY, workability: 3 },
      { at: NOW, workability: 5 },
    ],
  });

  test('lastTouched / daysSinceTouched', () => {
    expect(lastTouched(e)).toBe(NOW);
    expect(daysSinceTouched(e, NOW)).toBe(0);
    expect(daysSinceTouched(e, NOW + 5 * DAY)).toBe(5);
    expect(lastTouched(baseEntry())).toBeNull();
    expect(daysSinceTouched(baseEntry(), NOW)).toBeNull();
  });

  test('workabilityArc is oldest→newest ratings', () => {
    expect(workabilityArc(e)).toEqual([2, 3, 5]);
    expect(workabilityArc(baseEntry())).toEqual([]);
  });

  test('arcDirection compares the last two points', () => {
    expect(arcDirection(e)).toBe('rising');
    expect(
      arcDirection(
        baseEntry({
          checkpoints: [
            { at: NOW - DAY, workability: 4 },
            { at: NOW, workability: 2 },
          ],
        }),
      ),
    ).toBe('falling');
    expect(
      arcDirection(
        baseEntry({
          checkpoints: [
            { at: NOW - DAY, workability: 3 },
            { at: NOW, workability: 3 },
          ],
        }),
      ),
    ).toBe('steady');
    expect(
      arcDirection(baseEntry({ checkpoints: [{ at: NOW, workability: 3 }] })),
    ).toBeNull();
    expect(arcDirection(baseEntry())).toBeNull();
  });
});

describe('needsRecheck', () => {
  test('true only for a working value that has gone stale', () => {
    const stale = baseEntry({
      workability: 5,
      checkpoints: [{ at: NOW - 30 * DAY, workability: 5 }],
    });
    expect(needsRecheck(stale, 21, NOW)).toBe(true);
  });

  test('false for fresh, stuck, or un-journaled values', () => {
    const fresh = baseEntry({
      workability: 5,
      checkpoints: [{ at: NOW - 2 * DAY, workability: 5 }],
    });
    const stuck = baseEntry({
      workability: 2,
      checkpoints: [{ at: NOW - 30 * DAY, workability: 2 }],
    });
    expect(needsRecheck(fresh, 21, NOW)).toBe(false);
    expect(needsRecheck(stuck, 21, NOW)).toBe(false);
    expect(needsRecheck(baseEntry({ workability: 5 }), 21, NOW)).toBe(false);
  });
});
