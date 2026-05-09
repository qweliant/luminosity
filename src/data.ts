import type { Mapping } from './App';

export interface ValueCategory {
  name: string;
  description: string;
  values: string[];
}

export interface ValueDetail {
  synonym: string;
  description: string;
  reflection: string[];
}

export interface NvcCategory {
  name: string;
  needs: string[];
}

export const NVC_CATEGORIES: NvcCategory[] = [
  { name: 'Connection', needs: ['belonging', 'empathy', 'intimacy', 'love', 'respect', 'trust'] },
  { name: 'Physical',   needs: ['movement', 'rest', 'safety', 'shelter', 'touch'] },
  { name: 'Honesty',    needs: ['authenticity', 'integrity', 'presence'] },
  { name: 'Play',       needs: ['humor', 'joy', 'spontaneity'] },
  { name: 'Peace',      needs: ['beauty', 'ease', 'harmony', 'order'] },
  { name: 'Autonomy',   needs: ['choice', 'freedom', 'independence', 'space'] },
  { name: 'Meaning',    needs: ['challenge', 'competence', 'contribution', 'creativity', 'growth', 'learning', 'purpose', 'stimulation'] },
];

export const NVC_TO_SDT: Record<string, 'autonomy' | 'competence' | 'relatedness'> = {
  belonging: 'relatedness', empathy: 'relatedness', intimacy: 'relatedness',
  love: 'relatedness', respect: 'relatedness', trust: 'relatedness',
  movement: 'autonomy', rest: 'autonomy', safety: 'autonomy', shelter: 'autonomy', touch: 'relatedness',
  authenticity: 'autonomy', integrity: 'autonomy', presence: 'relatedness',
  humor: 'relatedness', joy: 'autonomy', spontaneity: 'autonomy',
  beauty: 'autonomy', ease: 'autonomy', harmony: 'relatedness', order: 'autonomy',
  choice: 'autonomy', freedom: 'autonomy', independence: 'autonomy', space: 'autonomy',
  challenge: 'competence', competence: 'competence', contribution: 'relatedness',
  creativity: 'competence', growth: 'competence', learning: 'competence',
  purpose: 'competence', stimulation: 'competence',
};

export const CORE_NEEDS_DETAIL: Record<string, string> = {
  Certainty:    'Comfort, predictability, security.',
  Variety:      'Novelty, surprise, change, adventure.',
  Significance: 'Importance, achievement, being needed.',
  Connection:   'Love, belonging, closeness with others.',
  Growth:       'Development of self, skill, character.',
  Contribution: 'Service, giving beyond self.',
};

export const CORE_NEEDS = Object.keys(CORE_NEEDS_DETAIL);

export const VALUE_LIBRARY: ValueCategory[] = [
  {
    name: 'Grow Through',
    description: 'Curiosity, self-improvement, and exploration.',
    values: [
      'Curiosity', 'Creativity', 'Co-creation', 'Gardening', 'Art',
      'Knowledge', 'Spirituality', 'Self-expression', 'Reading', 'Gaming',
    ],
  },
  {
    name: 'Seek',
    description: 'Meaningful relationships, teamwork, and giving back.',
    values: [
      'Love', 'Empathy', 'Compassion', 'Acceptance', 'Altruism',
      'Connection', 'Appreciation', 'Teamwork', 'Warmth',
    ],
  },
  {
    name: 'Find',
    description: 'Inner peace, resilience, and self-care.',
    values: [
      'Nature', 'Happiness', 'Humility', 'Thoughtfulness', 'Mindfulness',
      'Vulnerability', 'Animals', 'Joy', 'Music',
    ],
  },
  {
    name: 'Pursue',
    description: 'Ambition, accountability, and making an impact.',
    values: [
      'Openness', 'Passion', 'Authenticity', 'Consistency', 'Equity',
      'Equality', 'Ethics', 'Commitment', 'Financial stability', 'Vision',
    ],
  },
  {
    name: 'Build Upon',
    description: 'Resourcefulness, reliability, and maintaining stability.',
    values: [
      'Health', 'Humor', 'Playfulness', 'Open-Mindedness/Understanding',
      'Fairness', 'Resourcefulness', 'Kindness', 'Stability',
    ],
  },
];

export const VALUE_DETAILS: Record<string, ValueDetail> = {
  compassion: {
    synonym: 'Empathy, sympathy',
    description:
      "Seeing and understanding the suffering of others — and responding. Watch the edge: too much involvement in other people's feelings can erode your own footing.",
    reflection: [
      'How many people have you helped recently?',
      'Are you currently involved in any charitable activity?',
      'Do others seek help from you specifically?',
    ],
  },
  curiosity: {
    synonym: 'Willingness to explore and learn',
    description:
      'Searching for answers, in-depth knowledge of a subject, interest in the surrounding world. Curiosity is on the right track to wisdom — but should not infringe on others’ privacy.',
    reflection: [
      'What have you learned over the past year?',
      'What currently catches your curiosity?',
      'How do you satisfy your curiosity?',
    ],
  },
  health: {
    synonym: 'Well-being, fitness, not being sick',
    description:
      'Conscious actions to maintain physical and mental fitness. Discipline and systematic care across everyday life. In extremes it can tip into anxious over-monitoring.',
    reflection: [
      'When was your last checkup?',
      'What do you plan to eat today?',
      'How much time per week do you spend on physical activity?',
    ],
  },
  'inner harmony': {
    synonym: 'Balance, self-fulfillment',
    description:
      'Internal balance that lets you find relief in the noise and still enjoy small things. Requires being honest with yourself, sometimes uncomfortably.',
    reflection: [
      'How has finding inner balance changed your approach to life?',
      'What has helped you find inner balance?',
      'How do you maintain your inner harmony?',
    ],
  },
  peace: {
    synonym: 'Calm, freedom from conflict',
    description:
      'Avoiding conflict where possible, helping resolve it where unavoidable. Open and dialogic. Worth asking whether the pursuit of peace justifies all measures taken.',
    reflection: [
      'What event has recently disturbed your peace of mind?',
      'What do you usually do to ensure peace in your environment?',
      'In what situations do you feel most at peace?',
    ],
  },
};

export const seedPersonalValues = (): Mapping[] => [
  {
    id: crypto.randomUUID(),
    value: 'Compassion',
    friction: '',
    need: 'Time and emotional capacity to attend to others’ suffering without depleting myself; outlets for service; relationships that allow honest empathy.',
    coreNeed: 'Contribution',
    nvcNeeds: ['empathy', 'connection', 'contribution'],
  },
  {
    id: crypto.randomUUID(),
    value: 'Curiosity',
    friction: '',
    need: 'Unstructured time to follow questions; access to books, conversations, and tools for exploration; permission to not-know.',
    coreNeed: 'Growth',
    nvcNeeds: ['learning', 'stimulation', 'growth', 'meaning'],
  },
  {
    id: crypto.randomUUID(),
    value: 'Health',
    friction: '',
    need: 'Sleep protected, movement built into the week, nutritious food on hand, stress with a release valve.',
    coreNeed: 'Certainty',
    nvcNeeds: ['movement', 'rest', 'safety'],
  },
  {
    id: crypto.randomUUID(),
    value: 'Inner Harmony',
    friction: '',
    need: 'Daily quiet for reflection; alignment between stated values and how the calendar actually spends me; freedom from prolonged inner conflict.',
    coreNeed: 'Growth',
    nvcNeeds: ['ease', 'meaning', 'authenticity'],
  },
  {
    id: crypto.randomUUID(),
    value: 'Peace',
    friction: '',
    need: 'Low-conflict environment; clear boundaries; physical space free of clutter; capacity to forgive and release.',
    coreNeed: 'Certainty',
    nvcNeeds: ['ease', 'safety', 'order', 'beauty'],
  },
];
