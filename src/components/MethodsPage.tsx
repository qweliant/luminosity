// The "how this works" page. Renders the same framework prose that lives in
// HOWTO.md in a more navigable form, with anchor links per lens. Reached via
// the "Methods" link in the header or by direct URL (#/methods).

import React from 'react';

interface Lens {
  step: string;
  name: string;
  framework: string;
  one_line: string;
  body: string;
  citation: string;
}

const LENSES: Lens[] = [
  {
    step: '1',
    name: 'Diagnose',
    framework: 'ACT Workability + Atlas of the Heart',
    one_line: 'How stuck is this, and what kind of stuck?',
    body:
      "A 1–5 dot for how well your current life is serving this value — 1 stuck, 5 working. Underneath, pick the closest emotional cluster (the place the friction is coming from). Some clusters — grief, shame, overwhelm, flooding — are cessation states: the app will refuse to draft a prototype from them and offer a compassion sentence instead.",
    citation:
      'Steven Hayes et al., Acceptance and Commitment Therapy · Brené Brown, Atlas of the Heart (2021).',
  },
  {
    step: '2',
    name: 'Locate',
    framework: 'NVC Universal Needs',
    one_line: "What's starving underneath the friction?",
    body:
      "Tag one or more universal needs from seven categories: Connection, Physical, Honesty, Play, Peace, Autonomy, Meaning. The vocabulary is deliberately broad — the point isn't precision, it's surfacing what's missing.",
    citation:
      'Marshall Rosenberg, Nonviolent Communication: A Language of Life (2003).',
  },
  {
    step: '3',
    name: 'Anchor',
    framework: 'Madanes · 6 Core Human Needs',
    one_line: 'Which fundamental driver does this value serve?',
    body:
      "One of: Comfort, Variety, Significance, Connection, Growth, Contribution. The argument behind the model is that every behavior — including the dysfunctional ones — is trying to meet at least one of these. Naming the driver helps you ask whether you're meeting it cleanly, or with a workaround.",
    citation: 'Chloe Madanes, The 6 Human Needs.',
  },
  {
    step: '4',
    name: 'Reframe',
    framework: 'Stanford Life Design',
    one_line: 'What kind of problem is this, and what would a small test look like?',
    body:
      'Three tools from Designing Your Life. First, wayfinding — rate engagement and energy 1–5. Second, problem framing — is this an Open problem you can prototype against, a Stuck problem that needs a reframe first, or a Reality to accept and navigate around? Third, prototyping — name a small experiment (Talk to someone who already lives this, or Do it for a day).',
    citation: 'Bill Burnett & Dave Evans, Designing Your Life (2016).',
  },
  {
    step: '5',
    name: 'Contextualize',
    framework: 'Nagoski · accelerators + brakes',
    one_line: 'What turns this value on, and what shuts it down?',
    body:
      "Originally a sexual-response model; here, used generically. Name the contexts that let this value thrive, and the contexts that brake it. If another person is part of the friction, optionally turn on the relational lens — a 4-question boundary checklist (Sander T. Jones, Cultivating Connection) that catches whether your Need is a clean boundary for you or an overreaching rule for them.",
    citation: 'Emily Nagoski, Come As You Are (2015) · Sander T. Jones, Cultivating Connection.',
  },
  {
    step: '6',
    name: 'Synthesize',
    framework: 'Templated draft',
    one_line: 'Compose all of the above into one sentence.',
    body:
      "Deterministic — not LLM-generated. The synthesizer reads your lens selections and assembles a draft Need sentence you can replace, append to, or ignore. The draft is scaffolding, not a verdict. When the entry is in a cessation state, the synthesizer skips the template entirely and returns a compassion sentence.",
    citation: 'Custom.',
  },
];

interface Derived {
  name: string;
  blurb: string;
  citation: string;
}

const DERIVED: Derived[] = [
  {
    name: 'SDT profile',
    blurb:
      "Self-Determination Theory's three innate needs — autonomy, competence, relatedness — derived from your NVC tags and core need. A balance check, not a score.",
    citation: 'Edward Deci & Richard Ryan.',
  },
  {
    name: 'Maslow · highest active layer',
    blurb:
      "The highest layer of Maslow's hierarchy your NVC selections reach. A quick sanity check that you're not piling everything onto self-actualization while shelter or belonging are unmet.",
    citation: 'Abraham Maslow (1943).',
  },
  {
    name: 'Jones · freedoms at stake',
    blurb:
      "When the relational lens is on, the 13 Fundamental Freedoms your NVC tags touch — which relational rights are in play.",
    citation: 'Sander T. Jones.',
  },
];

interface OmittedFramework {
  name: string;
  why: string;
}

const OMITTED: OmittedFramework[] = [
  {
    name: "Schwartz's Theory of Basic Values",
    why: 'Academically rigorous, but its 10 universal value types overlap Madanes for our purposes.',
  },
  {
    name: 'VIA Character Strengths',
    why: 'Useful as a discovery tool, but its 24 strengths duplicate Madanes here.',
  },
  {
    name: 'Ikigai',
    why: 'Better suited to vocational design than daily-needs surfacing.',
  },
  {
    name: 'Polyvagal Theory',
    why: 'Nagoski accelerators/brakes already covers the practical surface.',
  },
  {
    name: 'Logotherapy / "Will to Meaning"',
    why: 'Captured implicitly via the Madanes Significance and Contribution drivers.',
  },
];

export const MethodsPage = ({ onClose }: { onClose: () => void }) => {
  return (
    <main className="max-w-3xl mx-auto py-12 px-6 print:py-0 print:px-0 text-[#3A1E2A]">
      <header className="mb-10 flex justify-between items-baseline gap-4 border-b border-[#3A1E2A]/10 pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold mb-1">
            Methods
          </p>
          <h1 className="font-serif italic text-4xl tracking-[-0.01em]">
            How this works
          </h1>
          <p className="font-serif italic text-sm text-[#5A3645] mt-2 max-w-prose">
            Luminosity isn't a journal app — it's a scaffolding that walks you from{' '}
            surface friction to a sentence you can act on (or sit with), one lens at a time.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xs uppercase tracking-[0.2em] text-[#5A3645] hover:text-[#C24E6E] transition-colors print:hidden cursor-pointer"
        >
          ← back
        </button>
      </header>

      <section className="mb-12">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold mb-3">
          The loop
        </h2>
        <p className="font-serif italic text-2xl text-[#3A1E2A] leading-snug mb-3">
          Value &rarr; Friction &rarr; Need &rarr; Workability
        </p>
        <ul className="space-y-2 text-sm text-[#5A3645] leading-relaxed">
          <li>
            <strong className="text-[#3A1E2A]">Value</strong> — the belief or commitment you care about (Compassion, Curiosity, Health).
          </li>
          <li>
            <strong className="text-[#3A1E2A]">Friction</strong> — what's currently in the way of living that value.
          </li>
          <li>
            <strong className="text-[#3A1E2A]">Need</strong> — the non-negotiable condition that, if met, would let the value thrive.
          </li>
          <li>
            <strong className="text-[#3A1E2A]">Workability</strong> — how well your life is actually serving that value, 1–5.
          </li>
        </ul>
        <p className="text-sm italic text-[#5A3645] mt-4 leading-relaxed">
          The aim isn't to enumerate values. It's to find where you're starving and name the smallest condition that would feed you.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold mb-4">
          The six lenses
        </h2>
        <div className="space-y-6">
          {LENSES.map((l) => (
            <article
              key={l.step}
              className="pl-5 border-l-2 border-[#FBD9E0]"
            >
              <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                <span className="font-mono text-xs text-[#B391A0]">{l.step}</span>
                <h3 className="font-serif italic text-xl text-[#3A1E2A]">{l.name}</h3>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#C24E6E]">
                  {l.framework}
                </span>
              </div>
              <p className="text-sm font-serif italic text-[#5A3645] mb-2">{l.one_line}</p>
              <p className="text-sm text-[#3A1E2A] leading-relaxed mb-2">{l.body}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#B391A0]">
                {l.citation}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold mb-3">
          Derived indicators
        </h2>
        <p className="text-sm text-[#5A3645] leading-relaxed mb-4">
          Computed from your selections; you never set them directly.
        </p>
        <div className="space-y-4">
          {DERIVED.map((d) => (
            <div key={d.name}>
              <h3 className="font-serif text-base text-[#3A1E2A]">{d.name}</h3>
              <p className="text-sm text-[#5A3645] leading-relaxed">{d.blurb}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#B391A0] mt-1">
                {d.citation}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold mb-3">
          Cessation states
        </h2>
        <p className="text-sm text-[#5A3645] leading-relaxed mb-3">
          Some emotions don't ask to be solved. When you tag an entry with
          <em> grief, shame, overwhelm, flooding, anguish, despair, hopelessness, </em> or
          <em> sadness</em>, the synthesizer refuses to draft a prototype and returns a
          compassion sentence instead.
        </p>
        <p className="text-sm text-[#5A3645] leading-relaxed">
          This is deliberate. Brown's research on these states is unambiguous: prescribing
          action from inside them is harmful. The app will offer presence, not a plan.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold mb-3">
          Privacy
        </h2>
        <p className="text-sm text-[#5A3645] leading-relaxed mb-2">
          Everything lives in your browser's <code className="font-mono text-xs">localStorage</code>.
          No account, no telemetry, no analytics. The optional backup sidecar writes
          timestamped snapshots to a local SQLite file — still on your machine.
        </p>
        <p className="text-sm text-[#5A3645] leading-relaxed">
          The sync feature mirrors this ledger between your own browsers over end-to-end
          encrypted WebRTC. Nothing ever leaves the devices you control.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold mb-3">
          Frameworks deliberately not used
        </h2>
        <p className="text-sm text-[#5A3645] leading-relaxed mb-4">
          Worth knowing — but redundant or too heavy for this editorial surface.
        </p>
        <ul className="space-y-3">
          {OMITTED.map((o) => (
            <li key={o.name}>
              <strong className="font-serif text-[#3A1E2A]">{o.name}</strong>
              <span className="text-sm text-[#5A3645] leading-relaxed"> — {o.why}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="pt-6 mt-12 border-t border-[#3A1E2A]/10 text-center text-xs text-[#B391A0] font-serif italic">
        Built for clarity &middot; persisted locally &middot; nothing leaves your device.
      </footer>
    </main>
  );
};
