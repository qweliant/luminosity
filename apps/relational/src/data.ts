// Vocabulary only — no logic, no React. This is the layer that would differ if
// the same primitives were ever pointed at a different context (work, family),
// which is why it lives apart from types.ts and derive.ts.
//
// Grouping follows Rosenberg's needs inventory, trimmed to the ones that
// actually come up between people. It is a prompt library, not a schema: a
// menu you reach for when the blank field is the hard part. Nothing requires a
// tag, and nothing is computed from one.

export interface NeedGroup {
  name: string;
  needs: string[];
}

export const NEED_VOCABULARY: NeedGroup[] = [
  { name: 'Connection', needs: ['closeness', 'affection', 'to be known', 'warmth', 'belonging'] },
  { name: 'Honesty', needs: ['directness', 'to be told early', 'consistency', 'repair'] },
  { name: 'Autonomy', needs: ['space', 'my own pace', 'freedom to change my mind'] },
  { name: 'Security', needs: ['predictability', 'to not be surprised', 'follow-through'] },
  { name: 'Play', needs: ['lightness', 'adventure', 'being silly together'] },
  { name: 'Recognition', needs: ['to be appreciated', 'to matter', 'to be chosen'] },
  { name: 'Body', needs: ['touch', 'rest', 'desire met', 'physical care'] },
];

export const ALL_NEED_TAGS: string[] = NEED_VOCABULARY.flatMap((g) => g.needs);
