// Tests for migrateMapping. This is the function that lets old localStorage
// payloads keep loading across schema renames. Two legacy generations exist;
// both must continue to migrate cleanly. A regression here silently corrupts
// existing user data, so we cover each branch + the no-op pass-through.

import { test, expect, describe } from 'bun:test';
import { migrateMapping, workabilityColor, type LegacyMapping, type Mapping } from './types';

const base: Mapping = {
  id: 'x',
  value: 'Compassion',
  need: 'something',
  friction: '',
};

describe('migrateMapping', () => {
  test('clean entry with no legacy fields passes through unchanged', () => {
    const out = migrateMapping(base);
    expect(out).toEqual(base);
  });

  test('clean entry with already-migrated lifeDesign passes through', () => {
    const input: Mapping = {
      ...base,
      lifeDesign: {
        problemFrame: 'open',
        prototype: { mode: 'do', action: 'try a thing' },
      },
    };
    const out = migrateMapping(input);
    expect(out.lifeDesign?.problemFrame).toBe('open');
    expect(out.lifeDesign?.prototype?.mode).toBe('do');
    expect(out.lifeDesign?.prototype?.action).toBe('try a thing');
  });

  // --- Legacy generation 1: top-level designConstraint / designNote --------

  test('legacy designConstraint=true folds into lifeDesign.problemFrame=open', () => {
    const input = { ...base, designConstraint: true } as LegacyMapping;
    const out = migrateMapping(input);
    expect(out.lifeDesign?.problemFrame).toBe('open');
    // Legacy fields are stripped in the in-memory shape.
    expect((out as LegacyMapping).designConstraint).toBeUndefined();
  });

  test('legacy designNote folds into lifeDesign.prototype.action with mode "do"', () => {
    const input = { ...base, designNote: 'weekly volunteer hours' } as LegacyMapping;
    const out = migrateMapping(input);
    expect(out.lifeDesign?.prototype?.action).toBe('weekly volunteer hours');
    expect(out.lifeDesign?.prototype?.mode).toBe('do');
    expect((out as LegacyMapping).designNote).toBeUndefined();
  });

  test('legacy designNote with whitespace is ignored', () => {
    const input = { ...base, designNote: '   ' } as LegacyMapping;
    const out = migrateMapping(input);
    expect(out.lifeDesign?.prototype).toBeUndefined();
  });

  // --- Legacy generation 2: old enum values --------------------------------

  test('legacy problemFrame "actionable" → "open"', () => {
    const input = {
      ...base,
      lifeDesign: { problemFrame: 'actionable' as 'open' },
    };
    const out = migrateMapping(input as LegacyMapping);
    expect(out.lifeDesign?.problemFrame).toBe('open');
  });

  test('legacy problemFrame "anchor" → "stuck"', () => {
    const input = {
      ...base,
      lifeDesign: { problemFrame: 'anchor' as 'stuck' },
    };
    const out = migrateMapping(input as LegacyMapping);
    expect(out.lifeDesign?.problemFrame).toBe('stuck');
  });

  test('legacy problemFrame "gravity" → "reality"', () => {
    const input = {
      ...base,
      lifeDesign: { problemFrame: 'gravity' as 'reality' },
    };
    const out = migrateMapping(input as LegacyMapping);
    expect(out.lifeDesign?.problemFrame).toBe('reality');
  });

  test('legacy prototype.type "interview" → mode "talk"', () => {
    const input: LegacyMapping = {
      ...base,
      lifeDesign: {
        prototype: { type: 'interview', action: 'ask Sarah' },
      },
    };
    const out = migrateMapping(input);
    expect(out.lifeDesign?.prototype?.mode).toBe('talk');
    expect(out.lifeDesign?.prototype?.action).toBe('ask Sarah');
  });

  test('legacy prototype.type "experience" → mode "do"', () => {
    const input: LegacyMapping = {
      ...base,
      lifeDesign: {
        prototype: { type: 'experience', action: 'try a day' },
      },
    };
    const out = migrateMapping(input);
    expect(out.lifeDesign?.prototype?.mode).toBe('do');
    expect(out.lifeDesign?.prototype?.action).toBe('try a day');
  });

  // --- Combined legacy: oldest possible payload ---------------------------

  test('combined legacy: top-level fields + old enums migrate together', () => {
    const input: LegacyMapping = {
      ...base,
      designConstraint: true,
      designNote: 'try a thing',
      lifeDesign: {
        problemFrame: 'gravity' as 'reality',
        prototype: { type: 'interview' },
      },
    };
    const out = migrateMapping(input);
    expect(out.lifeDesign?.problemFrame).toBe('reality');
    expect(out.lifeDesign?.prototype?.mode).toBe('talk');
    // designNote should have written into the prototype.action since the
    // legacy prototype had no action set.
    expect(out.lifeDesign?.prototype?.action).toBe('try a thing');
    expect((out as LegacyMapping).designConstraint).toBeUndefined();
    expect((out as LegacyMapping).designNote).toBeUndefined();
  });
});

describe('workabilityColor', () => {
  test('0 / undefined → transparent', () => {
    expect(workabilityColor(0)).toBe('transparent');
  });
  test('1 and 2 → red', () => {
    expect(workabilityColor(1)).toBe('#dc2626');
    expect(workabilityColor(2)).toBe('#dc2626');
  });
  test('3 → amber', () => {
    expect(workabilityColor(3)).toBe('#d97706');
  });
  test('4 and 5 → green', () => {
    expect(workabilityColor(4)).toBe('#16a34a');
    expect(workabilityColor(5)).toBe('#16a34a');
  });
});
