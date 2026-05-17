// The "how this works" page. Renders the same framework prose that lives in
// HOWTO.md in a more navigable form, with anchor links per lens. Reached via
// the "Methods" link in the header or by direct URL (#/methods).

import React from 'react';

const Hibiscus = ({
  size = 28,
  petal = '#E07A95',
  opacity = 1,
}: { size?: number; petal?: string; opacity?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={{ opacity }}
    className="inline-block align-middle overflow-visible"
  >
    {Array.from({ length: 5 }).map((_, i) => (
      <path
        key={i}
        d="M50 50 C 28 38, 22 12, 50 4 C 78 12, 72 38, 50 50 Z"
        fill={petal}
        opacity="0.95"
        stroke="#C24E6E"
        strokeOpacity="0.2"
        transform={`rotate(${(i * 360) / 5} 50 50)`}
      />
    ))}
    <circle cx="50" cy="50" r="9" fill="#C24E6E" opacity="0.9" />
    <circle cx="50" cy="50" r="3" fill="#F7D679" />
  </svg>
);

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
    framework: 'Madanes · 6 Core Human Needs + IFS',
    one_line: "Which driver does this serve, and who's doing the work?",
    body:
      "Two questions, stacked. First: one of Comfort, Variety, Significance, Connection, Growth, Contribution. Naming the driver helps you ask whether you're meeting it cleanly, or with a workaround. Second (optional): the Internal Family Systems Part that wrote this entry — name it, and a read-only profile per Part appears on #/parts.",
    citation: 'Chloe Madanes, The 6 Human Needs · Richard C. Schwartz, No Bad Parts (2021).',
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

interface Influence {
  title: string;
  author: string;
  href: string;
  why: string;
  primary?: boolean;
}

const INFLUENCES: Influence[] = [
  {
    title: "The ABC's of Luminosity",
    author: 'Alicorn · LessWrong, 2009',
    href: 'https://www.lesswrong.com/posts/rLuZ6XrGpgjk9BNpX/the-abc-s-of-luminosity',
    why:
      'The namesake. Names the loop this app is a small instance of, and gives "luminosity" its working meaning: introspective accuracy as a trainable skill.',
    primary: true,
  },
  {
    title: 'The Luminosity sequence',
    author: 'Alicorn · LessWrong, 2009–2011',
    href: 'https://www.lesswrong.com/s/ynMFrq9K5iNMfSZNg/p/9o3Cjjem7AbmmZfBs',
    why:
      "The longer arc. Practical exercises in noticing your own mental states accurately — without flinching, flattering, or theorizing past what's there.",
  },
  {
    title: 'Ureshiku Naritai',
    author: 'Alicorn · LessWrong, 2024',
    href: 'https://www.lesswrong.com/posts/xnPFYBuaGhpq869mY/ureshiku-naritai',
    why:
      'A later update — what it actually looked like to try to be happier on purpose, and what stuck.',
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

const TOC = [
  { id: 'loop', label: 'The loop' },
  { id: 'lenses', label: 'The six lenses' },
  { id: 'parts', label: 'Parts · IFS' },
  { id: 'derived', label: 'Derived indicators' },
  { id: 'cessation', label: 'Cessation states' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'influences', label: 'Influences' },
  { id: 'omitted', label: 'Frameworks not used' },
];

const SectionCaps = ({
  children,
  color = '#C24E6E',
}: {
  children: React.ReactNode;
  color?: string;
}) => (
  <p
    className="text-[10px] uppercase tracking-[0.25em] font-bold m-0"
    style={{ color }}
  >
    {children}
  </p>
);

export const MethodsPage = ({ onClose }: { onClose: () => void }) => {
  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Fixed TOC rail — pinned to viewport, aligned with main content's left edge */}
      <div className="hidden md:block fixed top-8 inset-x-0 pointer-events-none print:hidden z-10">
        <div className="max-w-6xl mx-auto px-6">
          <aside className="w-[180px] pointer-events-auto">
            <SectionCaps>Contents</SectionCaps>
            <nav className="mt-3.5 flex flex-col gap-0.5">
              {TOC.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  onClick={(e) => handleTocClick(e, t.id)}
                  className="px-2.5 py-1.5 rounded-lg text-[12.5px] text-[#5A3645] hover:bg-[#FBD9E0]/40 hover:text-[#C24E6E] border-l-2 border-transparent hover:border-[#C24E6E] transition-colors no-underline"
                >
                  {t.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 pt-3 border-t border-dashed border-[#3A1E2A]/10 font-mono text-[9.5px] text-[#B391A0] tracking-[0.08em] leading-relaxed">
              v2 · last updated
              <br />May 2026
            </div>
          </aside>
        </div>
      </div>

      <main className="relative max-w-6xl mx-auto py-9 px-6 print:py-0 print:px-0 text-[#3A1E2A]">
        <div aria-hidden className="absolute -top-10 -right-8 opacity-40 pointer-events-none print:hidden">
          <Hibiscus size={200} petal="#E07A95" />
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-[180px_1fr] gap-10">
          {/* Spacer matching the fixed nav width — keeps main content aligned */}
          <div aria-hidden className="hidden md:block" />

          {/* Main column */}
          <div className="min-w-0">
          <header className="pb-5 mb-7 border-b border-[#3A1E2A]/10 flex justify-between items-start gap-4">
            <div>
              <SectionCaps>Methods</SectionCaps>
              <h1 className="font-serif italic text-[38px] tracking-[-0.01em] leading-[1.1] mt-1.5 mb-1.5">
                How this works.
              </h1>
              <p className="font-serif italic text-[15px] text-[#5A3645] m-0 max-w-prose leading-relaxed">
                Luminosity isn't a journal app. It's a scaffolding that walks you from
                surface friction to a sentence you can act on — or sit with — one lens
                at a time.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-xs uppercase tracking-[0.2em] text-[#5A3645] hover:text-[#C24E6E] transition-colors print:hidden cursor-pointer shrink-0"
            >
              ← back
            </button>
          </header>

          {/* THE LOOP */}
          <section id="loop" className="mb-10 scroll-mt-8">
            <SectionCaps>The loop</SectionCaps>
            <div className="mt-3 px-6 py-4 bg-white rounded-2xl border border-[#3A1E2A]/10 flex items-center gap-4 flex-wrap shadow-xs">
              {['Value', 'Friction', 'Need', 'Workability'].map((w, i) => (
                <React.Fragment key={w}>
                  <span
                    className={`font-serif italic text-[22px] tracking-[-0.005em] leading-tight ${
                      i === 2 ? 'text-[#C24E6E]' : 'text-[#3A1E2A]'
                    }`}
                  >
                    {w}
                  </span>
                  {i < 3 && <span className="text-[#B391A0] text-base">→</span>}
                </React.Fragment>
              ))}
            </div>
            <dl className="mt-3.5 grid grid-cols-[100px_1fr] gap-x-5 gap-y-2.5 text-[13.5px] text-[#5A3645] leading-relaxed m-0">
              {[
                ['Value', 'the belief or commitment you care about — Compassion, Curiosity, Health.'],
                ['Friction', "what's currently in the way of living that value."],
                ['Need', 'the non-negotiable condition that, if met, would let the value thrive.'],
                ['Workability', 'how well your life is actually serving that value, 1–5.'],
              ].map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt className="font-serif italic text-[14px] text-[#3A1E2A] m-0">{k}</dt>
                  <dd className="m-0">{v}</dd>
                </React.Fragment>
              ))}
            </dl>
            <p className="mt-4 px-3.5 py-2.5 bg-[#FAE6E1]/50 rounded-xl font-serif italic text-[13.5px] text-[#5A3645] leading-relaxed m-0">
              The aim isn't to enumerate values. It's to find where you're starving and
              name the smallest condition that would feed you.
            </p>
          </section>

          {/* THE SIX LENSES */}
          <section id="lenses" className="mb-10 scroll-mt-8">
            <SectionCaps>The six lenses</SectionCaps>
            <h2 className="font-serif text-2xl text-[#3A1E2A] tracking-[-0.01em] mt-1.5 mb-4 leading-tight">
              Each step is a small framework, deliberately stacked.
            </h2>
            <div className="grid gap-2">
              {LENSES.map((l) => (
                <article
                  key={l.step}
                  className="bg-white rounded-xl border border-[#3A1E2A]/10 border-l-[3px] border-l-[#FBD9E0] px-4 py-3.5 grid grid-cols-[auto_1fr_auto] gap-4 items-center"
                >
                  <span className="font-mono text-[11px] text-[#B391A0] text-center w-3.5">
                    {l.step}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2.5 flex-wrap mb-0.5">
                      <span className="font-serif text-[17px] text-[#3A1E2A]">
                        {l.name}
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#C24E6E] font-semibold">
                        {l.framework}
                      </span>
                    </div>
                    <p className="m-0 font-serif italic text-[13px] text-[#5A3645] leading-snug">
                      {l.one_line}
                    </p>
                  </div>
                  <Hibiscus size={14} petal="#E07A95" />
                </article>
              ))}
            </div>
            <details className="mt-3 group">
              <summary className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-[#5A3645] hover:text-[#C24E6E] transition-colors font-semibold list-none flex items-center gap-1.5">
                <span className="inline-block transition-transform group-open:rotate-90">›</span>
                Expand full descriptions
              </summary>
              <div className="mt-4 space-y-5">
                {LENSES.map((l) => (
                  <div key={l.step} className="pl-4 border-l-2 border-[#FBD9E0]">
                    <div className="flex items-baseline gap-2.5 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-[#B391A0]">{l.step}</span>
                      <h3 className="font-serif italic text-lg text-[#3A1E2A] m-0">
                        {l.name}
                      </h3>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#C24E6E] font-semibold">
                        {l.framework}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#3A1E2A] leading-relaxed m-0 mb-1">
                      {l.body}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#B391A0] m-0">
                      {l.citation}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          </section>

          {/* PARTS · IFS */}
          <section id="parts" className="mb-10 scroll-mt-8">
            <SectionCaps>Parts · IFS</SectionCaps>
            <h2 className="font-serif text-2xl text-[#3A1E2A] tracking-[-0.01em] mt-1.5 mb-2 leading-tight">
              Who's doing the work?
            </h2>
            <p className="m-0 mb-3.5 font-serif italic text-[13.5px] text-[#5A3645] leading-relaxed max-w-[580px]">
              An optional Internal Family Systems tag. Name the part of you that wrote
              this entry — <em>The Caretaker</em>, <em>The Inner Critic</em>, <em>The
              People Pleaser</em> — and the app surfaces a read-only profile per Part on{' '}
              <a
                href="#/parts"
                className="text-[#C24E6E] underline hover:no-underline"
              >
                #/parts
              </a>
              .
            </p>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {[
                { rule: 'Single-select', body: 'Each entry expresses one part at a time.' },
                { rule: 'User-named', body: 'No curated list — typed text becomes a Part.' },
                {
                  rule: 'Read-only profiles',
                  body: 'Author Parts in Focus mode; the #/parts page just reads them back.',
                },
              ].map((c) => (
                <div
                  key={c.rule}
                  className="px-3.5 py-3 bg-[#FAE6E1]/50 rounded-xl border border-dashed border-[#3A1E2A]/15"
                >
                  <p className="m-0 text-[9px] uppercase tracking-[0.2em] text-[#5A3645] font-semibold">
                    {c.rule}
                  </p>
                  <p className="m-0 mt-1 text-[12px] text-[#5A3645] leading-relaxed">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[9.5px] text-[#B391A0] tracking-[0.18em] uppercase m-0">
              Richard C. Schwartz · No Bad Parts (2021).
            </p>
          </section>

          {/* DERIVED */}
          <section id="derived" className="mb-10 scroll-mt-8">
            <SectionCaps>Derived indicators</SectionCaps>
            <h2 className="font-serif text-2xl text-[#3A1E2A] tracking-[-0.01em] mt-1.5 mb-3 leading-tight">
              Computed from your selections — you never set them directly.
            </h2>
            <div className="grid gap-3">
              {DERIVED.map((d) => (
                <div key={d.name} className="pl-3.5 border-l-2 border-[#FBD9E0]">
                  <div className="font-serif text-base text-[#3A1E2A]">{d.name}</div>
                  <p className="m-0 mt-0.5 mb-1 text-[13px] text-[#5A3645] leading-relaxed">
                    {d.blurb}
                  </p>
                  <p className="m-0 text-[9px] uppercase tracking-[0.2em] text-[#B391A0]">
                    {d.citation}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CESSATION */}
          <section id="cessation" className="mb-10 scroll-mt-8">
            <div className="bg-[#FFF5DC]/70 border border-[#D6A24A]/30 rounded-2xl px-6 py-5">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-base text-[#8B6914]">⏸</span>
                <SectionCaps color="#8B6914">Cessation states</SectionCaps>
              </div>
              <h2 className="font-serif text-[22px] text-[#3A1E2A] tracking-[-0.01em] mt-1 mb-2.5 leading-tight">
                Some emotions don't ask to be solved.
              </h2>
              <p className="m-0 mb-2.5 text-[13.5px] text-[#5A3645] leading-relaxed">
                When you tag an entry with{' '}
                <em>grief, shame, overwhelm, flooding, anguish, despair, hopelessness,</em>{' '}
                or <em>sadness</em>, the synthesizer refuses to draft a prototype and
                returns a compassion sentence instead.
              </p>
              <p className="m-0 text-[13.5px] text-[#5A3645] leading-relaxed">
                This is deliberate. Brown's research on these states is unambiguous:
                prescribing action from inside them is harmful. The app will offer
                presence, not a plan.
              </p>
            </div>
          </section>

          {/* PRIVACY */}
          <section id="privacy" className="mb-10 scroll-mt-8">
            <SectionCaps>Privacy</SectionCaps>
            <div className="mt-2.5 grid sm:grid-cols-2 gap-2.5">
              {[
                ['Local-first', "Everything lives in your browser's localStorage. No account, no telemetry, no analytics."],
                ['Sidecar (optional)', 'The backup sidecar writes timestamped snapshots to a local SQLite file — still on your machine.'],
                ['Sync (optional)', 'Sync mirrors this ledger between your own browsers over end-to-end encrypted WebRTC.'],
                ['Nothing leaves', 'No server sees your data. Not for backup, not for sync, not for anything.'],
              ].map(([t, b]) => (
                <div
                  key={t}
                  className="px-3.5 py-3 bg-white rounded-xl border border-[#3A1E2A]/10"
                >
                  <p className="m-0 text-[9px] uppercase tracking-[0.2em] text-[#3A1E2A] font-semibold">
                    {t}
                  </p>
                  <p className="m-0 mt-1 text-[12.5px] text-[#5A3645] leading-relaxed">
                    {b}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* INFLUENCES — hero treatment */}
          <section id="influences" className="mb-10 scroll-mt-8">
            <div
              className="relative overflow-hidden rounded-[18px] border border-[#FBD9E0] px-7 py-7"
              style={{
                background:
                  'linear-gradient(180deg, #FAE6E1 0%, #FFFFFF 100%)',
              }}
            >
              <div aria-hidden className="absolute -top-5 -right-5 opacity-60 pointer-events-none">
                <Hibiscus size={120} petal="#E07A95" />
              </div>

              <div className="relative">
                <SectionCaps>Influences</SectionCaps>
                <h2 className="font-serif italic text-[28px] text-[#3A1E2A] tracking-[-0.01em] leading-tight mt-2 mb-3 max-w-[480px]">
                  A small instance of a larger loop.
                </h2>
                <p className="m-0 mb-3 text-[14px] text-[#5A3645] leading-relaxed max-w-[580px]">
                  The whole architecture is a small instance of a loop Alicorn named on
                  LessWrong in 2009: <em>Affect, Behavior,</em> and <em>Circumstance</em>{' '}
                  are interdependent, and{' '}
                  <strong className="text-[#C24E6E] font-semibold">luminosity</strong> is
                  the practice of seeing each clearly enough to act on them.
                </p>
                <p className="m-0 mb-5 text-[14px] text-[#5A3645] leading-relaxed max-w-[580px]">
                  The{' '}
                  <span className="font-serif italic">
                    Value → Friction → Need → Workability
                  </span>{' '}
                  loop is one slice of that ABC interdependence — Friction names the
                  circumstance, Workability names the behavior, and Need names the
                  affective ground both rest on. The namesake is older than this codebase
                  by sixteen years; the debt is happily acknowledged.
                </p>

                <ul className="grid gap-2.5 list-none m-0 p-0">
                  {INFLUENCES.map((i) => (
                    <li key={i.href}>
                      <a
                        href={i.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block px-4 py-3.5 rounded-xl border transition-colors no-underline ${
                          i.primary
                            ? 'bg-[#FBD9E0]/40 border-[#E07A95] hover:bg-[#FBD9E0]/60'
                            : 'bg-white border-[#3A1E2A]/10 hover:border-[#E07A95]'
                        }`}
                      >
                        <div className="flex items-baseline gap-2.5 flex-wrap">
                          <span
                            className={`font-serif italic text-[17px] leading-tight ${
                              i.primary ? 'text-[#C24E6E]' : 'text-[#3A1E2A]'
                            }`}
                          >
                            {i.title}
                          </span>
                          <span className="text-[9px] uppercase tracking-[0.2em] text-[#B391A0] font-semibold">
                            {i.author}
                          </span>
                          <span className="ml-auto text-[11px] text-[#C24E6E] font-medium">
                            ↗
                          </span>
                        </div>
                        <p className="m-0 mt-1.5 text-[13px] text-[#5A3645] leading-relaxed max-w-[560px]">
                          {i.why}
                        </p>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* OMITTED */}
          <section id="omitted" className="mb-7 scroll-mt-8">
            <SectionCaps>Frameworks deliberately not used</SectionCaps>
            <h2 className="font-serif text-[22px] text-[#3A1E2A] tracking-[-0.01em] mt-1.5 mb-2 leading-tight">
              Worth knowing — but redundant, or too heavy, for this surface.
            </h2>
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              {OMITTED.map((o) => (
                <div
                  key={o.name}
                  className="px-3.5 py-2.5 bg-white rounded-xl border border-[#3A1E2A]/10"
                >
                  <span className="font-serif text-sm text-[#3A1E2A]">{o.name}</span>
                  <p className="m-0 mt-0.5 text-[12px] text-[#5A3645] leading-relaxed">
                    {o.why}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <footer className="pt-5 mt-5 mb-8 border-t border-[#3A1E2A]/10 text-center text-xs text-[#B391A0] font-serif italic">
            built for clarity · persisted locally · nothing leaves your device
          </footer>
        </div>
      </div>
      </main>
    </>
  );
};
