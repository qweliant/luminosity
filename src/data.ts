import type { EmotionCluster, Mapping } from './types';

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

export type MaslowLevel = 'physiological' | 'safety' | 'belonging' | 'esteem' | 'self-actualization';

export const MASLOW_LEVELS: MaslowLevel[] = ['physiological', 'safety', 'belonging', 'esteem', 'self-actualization'];

export const NVC_TO_MASLOW: Record<string, MaslowLevel> = {
  movement: 'physiological', rest: 'physiological', shelter: 'physiological', touch: 'physiological',
  safety: 'safety', order: 'safety', ease: 'safety',
  belonging: 'belonging', empathy: 'belonging', intimacy: 'belonging', love: 'belonging',
  respect: 'belonging', trust: 'belonging', harmony: 'belonging', presence: 'belonging',
  competence: 'esteem', growth: 'esteem', learning: 'esteem', contribution: 'esteem',
  challenge: 'esteem', integrity: 'esteem',
  authenticity: 'self-actualization', creativity: 'self-actualization', purpose: 'self-actualization',
  stimulation: 'self-actualization', beauty: 'self-actualization', freedom: 'self-actualization',
  choice: 'self-actualization', independence: 'self-actualization', space: 'self-actualization',
  humor: 'self-actualization', joy: 'self-actualization', spontaneity: 'self-actualization',
};

// Sander T. Jones · Cultivating Connection — the 13 Fundamental Freedoms.
// Used by the (optional) Relational lens to surface which freedoms are at
// stake for an entry, derived from selected NVC tags.
export const JONES_FREEDOMS = [
  'Bandwidth Allocation',
  'Informed Consent',
  'Privacy',
  'Self-Determination',
  'Authentic Expression',
  'Boundaries',
  'Pacing',
  'Embodiment',
  'Truth-Telling',
  'Care for Self',
  'Time / Space',
  'Reciprocity',
  'Restoration',
] as const;

export type JonesFreedom = typeof JONES_FREEDOMS[number];

export const NVC_TO_FREEDOMS: Record<string, JonesFreedom> = {
  rest: 'Bandwidth Allocation',
  ease: 'Pacing',
  movement: 'Embodiment',
  touch: 'Embodiment',
  presence: 'Embodiment',
  space: 'Privacy',
  shelter: 'Privacy',
  freedom: 'Self-Determination',
  choice: 'Self-Determination',
  independence: 'Self-Determination',
  authenticity: 'Authentic Expression',
  integrity: 'Truth-Telling',
  honesty: 'Truth-Telling',
  trust: 'Informed Consent',
  safety: 'Care for Self',
  empathy: 'Reciprocity',
  belonging: 'Reciprocity',
  intimacy: 'Reciprocity',
  respect: 'Boundaries',
  harmony: 'Restoration',
  beauty: 'Restoration',
  joy: 'Care for Self',
};

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
  Comfort:    'Comfort, predictability, security.',
  Variety:      'Novelty, surprise, change, adventure.',
  Significance: 'Importance, achievement, being needed.',
  Connection:   'Love, belonging, closeness with others.',
  Growth:       'Development of self, skill, character.',
  Contribution: 'Service, giving beyond self.',
};

export const CORE_NEEDS = Object.keys(CORE_NEEDS_DETAIL);

// Atlas of the Heart · the 8 friction-relevant "places" out of Brown's 13.
// `routesTo` is a routing hint shown in the UI after the user picks the
// cluster (e.g. envy → Stanford prototype). `cessation` on an emotion means
// the synthesis step suppresses prescription in favor of a compassion/rest
// frame — these are states where a prototype is the wrong answer.
export type LensRoute =
  | 'nagoski'
  | 'jones'
  | 'act'
  | 'compassion'
  | 'unmasking'
  | 'expectations';

export interface EmotionEntry {
  name: string;
  cessation?: boolean;
  note?: string;       // one-line routing hint shown when this specific emotion is picked
}

export interface EmotionPlace {
  id: EmotionCluster;
  label: string;
  blurb: string;
  routesTo: LensRoute;
  routeNote: string;   // one-line routing hint shown when the cluster is picked
  emotions: EmotionEntry[];
}

export const EMOTION_PLACES: EmotionPlace[] = [
  {
    id: 'uncertain',
    label: 'Uncertain or Too Much',
    blurb: 'When environmental demands tax or exceed your coping resources.',
    routesTo: 'nagoski',
    routeNote: 'Look to step 5 · Nagoski — what is accelerating, what is braking.',
    emotions: [
      { name: 'Stress', note: 'Stress is taxed-but-navigable. Tactical: tooling, delegation, cuts.' },
      { name: 'Overwhelm', cessation: true, note: 'Cognitive shutdown. The need is cessation, not a plan — silence and space until the nervous system resets.' },
      { name: 'Anxiety', note: 'Anticipation of a future threat. Ground in what is actually within your control.' },
      { name: 'Worry', note: 'A chain of "what if" thoughts. Name the specific feared outcome — then ask if it is workable.' },
      { name: 'Avoidance', note: 'Side-stepping the source of discomfort. The Nagoski Brakes step is where this lives.' },
      { name: 'Excitement' },
      { name: 'Dread', note: 'Anticipation of a specific known threat. Distinct from anxiety — there is something concrete to name.' },
      { name: 'Fear', note: 'Short-lasting response to an immediate threat. Distinct from anxiety.' },
      { name: 'Vulnerability', note: 'Risk, uncertainty, and emotional exposure. Often a prerequisite to anything worth doing.' },
    ],
  },
  {
    id: 'compare',
    label: 'We Compare',
    blurb: 'When we measure ourselves against others.',
    routesTo: 'jones',
    routeNote: 'Look to step 4 · Stanford prototype, and step 5 · Jones relational — what is the latent desire or boundary?',
    emotions: [
      { name: 'Comparison' },
      { name: 'Admiration', note: 'Like envy but generous. Often points to a value you already hold.' },
      { name: 'Reverence' },
      { name: 'Envy', note: 'Data about an unvoiced desire. Translate it into a Stanford prototype: what would it look like to give yourself permission?' },
      { name: 'Jealousy', note: 'Three-party — fearing loss of a relationship/resource to someone else. The Jones relational lens may help name what is at stake.' },
      { name: 'Resentment', note: 'Brown reframes this as envy, not anger: you are holding yourself to a standard that someone else has put down. Examine the standard, not the other person.' },
      { name: 'Schadenfreude' },
      { name: 'Freudenfreude' },
    ],
  },
  {
    id: 'unplanned',
    label: "Things Don't Go As Planned",
    blurb: 'When reality diverges from expectation.',
    routesTo: 'expectations',
    routeNote: 'Examine the expectation — was it stated and shared, or stealth?',
    emotions: [
      { name: 'Boredom' },
      { name: 'Disappointment', note: 'Examined-and-expressed vs. unexamined-and-unspoken expectations. Which kind was this?' },
      { name: 'Expectations', note: 'Watch for "stealth expectations" — ones you never voiced, even to yourself.' },
      { name: 'Regret', note: 'Adaptive when it surfaces a value to realign with; corrosive when it loops.' },
      { name: 'Discouragement' },
      { name: 'Resignation' },
      { name: 'Frustration' },
    ],
  },
  {
    id: 'hurting',
    label: "We're Hurting",
    blurb: 'When something is genuinely painful — these are not problems to solve, but experiences to move through.',
    routesTo: 'compassion',
    routeNote: 'No prototype here. The need is presence, witnessing, time.',
    emotions: [
      { name: 'Anguish', cessation: true },
      { name: 'Hopelessness', cessation: true },
      { name: 'Despair', cessation: true },
      { name: 'Sadness', cessation: true },
      { name: 'Grief', cessation: true, note: 'Grief is not a problem with a need. It is a passage. Be in it.' },
    ],
  },
  {
    id: 'fall_short',
    label: 'We Fall Short',
    blurb: 'When we diverge from our own standards.',
    routesTo: 'act',
    routeNote: 'Workability + value alignment is the frame — for guilt. For shame it does not apply.',
    emotions: [
      { name: 'Shame', cessation: true, note: 'Shame says "I am bad," not "I did something bad." Self-compassion, not a prototype.' },
      { name: 'Self-Compassion', note: 'Brown lists this as the antidote that lives inside the same cluster.' },
      { name: 'Perfectionism', note: 'A brake disguised as a standard. Surface it in step 5 · Brakes.' },
      { name: 'Guilt', note: 'Adaptive — points to behavior that strayed from a value. Realign the behavior, not the self.' },
      { name: 'Humiliation' },
      { name: 'Embarrassment' },
    ],
  },
  {
    id: 'connection',
    label: 'We Search for Connection',
    blurb: 'When we want to belong without changing who we are.',
    routesTo: 'unmasking',
    routeNote: 'Fitting-in is masking; belonging is unmasked. Where can your unmasked self be safe?',
    emotions: [
      { name: 'Belonging', note: 'Brown: belonging requires being your authentic self.' },
      { name: 'Fitting In', note: 'Assessing the room and changing yourself to be accepted — the greatest barrier to belonging.' },
      { name: 'Connection' },
      { name: 'Disconnection' },
      { name: 'Insecurity' },
      { name: 'Invisibility' },
      { name: 'Loneliness' },
    ],
  },
  {
    id: 'heart_open',
    label: 'The Heart Is Open',
    blurb: 'Love, trust, and the wounds that come from them.',
    routesTo: 'jones',
    routeNote: 'The Jones relational lens is the right place for the friction-side emotions in this cluster.',
    emotions: [
      { name: 'Love' },
      { name: 'Lovelessness' },
      { name: 'Heartbreak' },
      { name: 'Trust' },
      { name: 'Self-Trust' },
      { name: 'Betrayal' },
      { name: 'Defensiveness' },
      { name: 'Flooding', cessation: true, note: 'Gottman\'s flooding — heart over 100bpm in conflict. Disengage. Return when calm.' },
      { name: 'Hurt' },
    ],
  },
  {
    id: 'wronged',
    label: 'We Feel Wronged',
    blurb: 'When we believe a line has been crossed.',
    routesTo: 'jones',
    routeNote: 'Step 5 · Jones boundary check; if the target is unchangeable, route to ACT acceptance instead.',
    emotions: [
      { name: 'Anger', note: 'If aimed at something you can change, it is workable. If aimed at something you cannot, ACT acceptance applies.' },
      { name: 'Contempt' },
      { name: 'Disgust' },
      { name: 'Dehumanization' },
      { name: 'Hate' },
      { name: 'Self-Righteousness' },
    ],
  },
];

export const EMOTION_PLACES_BY_ID: Record<EmotionCluster, EmotionPlace> =
  Object.fromEntries(EMOTION_PLACES.map(p => [p.id, p])) as Record<EmotionCluster, EmotionPlace>;

export const findEmotion = (cluster: EmotionCluster | undefined, name: string | undefined): EmotionEntry | undefined => {
  if (!cluster || !name) return undefined;
  return EMOTION_PLACES_BY_ID[cluster]?.emotions.find(e => e.name === name);
};

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
    coreNeed: 'Comfort',
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
    coreNeed: 'Comfort',
    nvcNeeds: ['ease', 'safety', 'order', 'beauty'],
  },
];
