// The "how it works" page (#/methods). A plain, first-person note: what this
// is, why I made it, and how the flow works — no citations, no framework
// badges. The one place credit is given is the "what shaped this" section at
// the bottom, kept small on purpose.

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

interface Step {
  step: string;
  name: string;
  one_line: string;
  body: string;
}

const STEPS: Step[] = [
  {
    step: '1',
    name: 'Check in',
    one_line: "How's it going, and what's in the way?",
    body:
      "Rate 1–5 how well your life is serving this value right now (1 is stuck, 5 is working). Then jot down what's in the way, and pick the feeling closest to where the friction's coming from. A few feelings (grief, shame, overwhelm, flooding) are \"pause here\" states: when you pick one, the app won't try to hand you a plan.",
  },
  {
    step: '2',
    name: "What's missing",
    one_line: "What's starving underneath the friction?",
    body:
      "Tag the plain human needs that feel unmet, like rest, belonging, or honesty. Naming what's missing tends to be more useful than naming what's wrong.",
  },
  {
    step: '3',
    name: 'Deeper need',
    one_line: "What's this really in service of?",
    body:
      "Pick the deeper thing this value serves: comfort, variety, feeling like you matter, connection, growth, contributing. If it helps, name the recurring inner voice behind the entry, like \"The Caretaker\".",
  },
  {
    step: '4',
    name: 'Reframe',
    one_line: 'What kind of problem is this, and what could you try?',
    body:
      "Some problems you can act on, some are stuck and need a fresh angle first, and some are just facts of life to make peace with. Name which, then sketch the smallest thing you could try or ask for.",
  },
  {
    step: '5',
    name: 'Contexts',
    one_line: 'What brings this out, and what shuts it down?',
    body:
      "Note the situations that let this value show up, and the ones that quietly kill it. Optionally, if another person's involved, a short honesty check on whether you're making a clean request or a demand.",
  },
  {
    step: '6',
    name: 'Sum up',
    one_line: 'Pull it all into one sentence.',
    body:
      "The app drafts a single sentence for what you need from everything above. Take it, tweak it, or write your own. From there you can turn it into one tiny committed action to carry it out. In a \"pause here\" state it won't push a plan; it offers something kinder instead.",
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
      'The namesake, and where "luminosity" gets its meaning here: getting better at noticing your own inner states accurately.',
    primary: true,
  },
  {
    title: 'The Luminosity sequence',
    author: 'Alicorn · LessWrong, 2009–2011',
    href: 'https://www.lesswrong.com/s/ynMFrq9K5iNMfSZNg/p/9o3Cjjem7AbmmZfBs',
    why:
      "The longer version: practical exercises in seeing what's there without flinching or flattering it.",
  },
  {
    title: 'Ureshiku Naritai',
    author: 'Alicorn · LessWrong, 2024',
    href: 'https://www.lesswrong.com/posts/xnPFYBuaGhpq869mY/ureshiku-naritai',
    why:
      'A later look back at what trying to be happier on purpose looked like, and what stuck.',
  },
];

const TOC = [
  { id: 'why', label: 'Why I made this' },
  { id: 'loop', label: 'The loop' },
  { id: 'steps', label: 'The six steps' },
  { id: 'voices', label: 'Voices' },
  { id: 'cessation', label: 'Pause-here states' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'influences', label: 'What shaped this' },
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
          <aside className="w-45 pointer-events-auto">
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
                <SectionCaps>How it works</SectionCaps>
                <h1 className="font-serif italic text-[38px] tracking-[-0.01em] leading-[1.1] mt-1.5 mb-1.5">
                  A small thing I made.
                </h1>
                <p className="font-serif italic text-[15px] text-[#5A3645] m-0 max-w-prose leading-relaxed">
                  It walks a value from the friction in the way to a sentence you can
                  act on, or just sit with. One small step at a time.
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-xs uppercase tracking-[0.2em] text-[#5A3645] hover:text-[#C24E6E] transition-colors print:hidden cursor-pointer shrink-0"
              >
                ← back
              </button>
            </header>

            {/* WHY */}
            <section id="why" className="mb-10 scroll-mt-8">
              <SectionCaps>Why I made this</SectionCaps>
              <div className="mt-3 px-6 py-5 bg-white rounded-2xl border border-[#3A1E2A]/10 shadow-xs">
                <p className="m-0 text-[14px] text-[#5A3645] leading-relaxed max-w-145">
                  I'm not a therapist, and I didn't consult one. I made this for myself,
                  to line up my days with what I care about without getting overwhelmed.
                  It borrows ideas from books and posts that helped me (listed at the
                  bottom). Anything I got wrong in how I used them is on me. Take what's
                  useful, ignore the rest.
                </p>
              </div>
            </section>

            {/* THE LOOP */}
            <section id="loop" className="mb-10 scroll-mt-8">
              <SectionCaps>The loop</SectionCaps>
              <div className="mt-3 px-6 py-4 bg-white rounded-2xl border border-[#3A1E2A]/10 flex items-center gap-4 flex-wrap shadow-xs">
                {['Value', 'Friction', 'Need'].map((w, i) => (
                  <React.Fragment key={w}>
                    <span
                      className={`font-serif italic text-[22px] tracking-[-0.005em] leading-tight ${
                        i === 2 ? 'text-[#C24E6E]' : 'text-[#3A1E2A]'
                      }`}
                    >
                      {w}
                    </span>
                    {i < 2 && <span className="text-[#B391A0] text-base">→</span>}
                  </React.Fragment>
                ))}
              </div>
              <dl className="mt-3.5 grid grid-cols-[110px_1fr] gap-x-5 gap-y-2.5 text-[13.5px] text-[#5A3645] leading-relaxed m-0">
                {[
                  ['Value', 'the belief or commitment you care about, e.g. Compassion or Health.'],
                  ['Friction', "what's currently in the way of living it."],
                  ['Need', 'the conditions that, if met, would let the value thrive.'],
                  ['How it’s going', 'a simple 1–5 gut read on how well your life is serving it.'],
                ].map(([k, v]) => (
                  <React.Fragment key={k}>
                    <dt className="font-serif italic text-[14px] text-[#3A1E2A] m-0">{k}</dt>
                    <dd className="m-0">{v}</dd>
                  </React.Fragment>
                ))}
              </dl>
              <p className="mt-4 px-3.5 py-2.5 bg-[#FAE6E1]/50 rounded-xl font-serif italic text-[13.5px] text-[#5A3645] leading-relaxed m-0">
                The aim isn't to list values. It's to find where you're starving, and
                name the smallest thing that would feed you.
              </p>
            </section>

            {/* THE SIX STEPS */}
            <section id="steps" className="mb-10 scroll-mt-8">
              <SectionCaps>The six steps</SectionCaps>
              <h2 className="font-serif text-2xl text-[#3A1E2A] tracking-[-0.01em] mt-1.5 mb-4 leading-tight">
                Six small steps, one at a time.
              </h2>
              <div className="grid gap-2">
                {STEPS.map((l) => (
                  <article
                    key={l.step}
                    className="bg-white rounded-xl border border-[#3A1E2A]/10 border-l-[3px] border-l-[#FBD9E0] px-4 py-3.5 grid grid-cols-[auto_1fr_auto] gap-4 items-center"
                  >
                    <span className="font-mono text-[11px] text-[#B391A0] text-center w-3.5">
                      {l.step}
                    </span>
                    <div className="min-w-0">
                      <div className="font-serif text-[17px] text-[#3A1E2A] mb-0.5">
                        {l.name}
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
                  A little more on each
                </summary>
                <div className="mt-4 space-y-5">
                  {STEPS.map((l) => (
                    <div key={l.step} className="pl-4 border-l-2 border-[#FBD9E0]">
                      <div className="flex items-baseline gap-2.5 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-[#B391A0]">{l.step}</span>
                        <h3 className="font-serif italic text-lg text-[#3A1E2A] m-0">
                          {l.name}
                        </h3>
                      </div>
                      <p className="text-[13px] text-[#3A1E2A] leading-relaxed m-0">
                        {l.body}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            </section>

            {/* VOICES */}
            <section id="voices" className="mb-10 scroll-mt-8">
              <SectionCaps>Voices</SectionCaps>
              <h2 className="font-serif text-2xl text-[#3A1E2A] tracking-[-0.01em] mt-1.5 mb-2 leading-tight">
                The recurring inner characters.
              </h2>
              <p className="m-0 mb-3.5 font-serif italic text-[13.5px] text-[#5A3645] leading-relaxed max-w-145">
                You can name the inner voice behind an entry: <em>The Caretaker</em>,{' '}
                <em>The Inner Critic</em>, <em>The People Pleaser</em>. Once you've named a few,
                the{' '}
                <a href="#/parts" className="text-[#C24E6E] underline hover:no-underline">
                  voices page
                </a>{' '}
                groups your entries under each and shows what tends to come up: which ones
                usually feel stuck, and what deeper need keeps surfacing.
              </p>
              <div className="grid sm:grid-cols-3 gap-2.5">
                {[
                  { rule: 'One at a time', body: 'Each entry names at most one voice.' },
                  { rule: 'You name them', body: 'No preset list; whatever you type becomes a voice.' },
                  { rule: 'Just for reading back', body: 'Name them while journaling; the voices page only reads them back.' },
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
            </section>

            {/* CESSATION / PAUSE-HERE */}
            <section id="cessation" className="mb-10 scroll-mt-8">
              <div className="bg-[#FFF5DC]/70 border border-[#D6A24A]/30 rounded-2xl px-6 py-5">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-base text-[#8B6914]">⏸</span>
                  <SectionCaps color="#8B6914">Pause-here states</SectionCaps>
                </div>
                <h2 className="font-serif text-[22px] text-[#3A1E2A] tracking-[-0.01em] mt-1 mb-2.5 leading-tight">
                  Some feelings shouldn't be asked to be solved.
                </h2>
                <p className="m-0 mb-2.5 text-[13.5px] text-[#5A3645] leading-relaxed">
                  When you tag an entry with{' '}
                  <em>grief, shame, overwhelm, flooding, anguish, despair, hopelessness,</em>{' '}
                  or <em>sadness</em>, the app won't try to draft a plan. It offers a
                  kinder sentence instead.
                </p>
                <p className="m-0 text-[13.5px] text-[#5A3645] leading-relaxed">
                  That's on purpose. From what I've read, and from experience, trying to
                  problem-solve from inside those states usually backfires. Better to be
                  with it first, and come back to the planning later.
                </p>
              </div>
            </section>

            {/* PRIVACY */}
            <section id="privacy" className="mb-10 scroll-mt-8">
              <SectionCaps>Privacy</SectionCaps>
              <div className="mt-2.5 grid sm:grid-cols-2 gap-2.5">
                {[
                  ['Local-first', "Everything lives in your browser's localStorage. No account, no telemetry, no analytics."],
                  ['Sidecar (optional, if you install from GitHub)', 'The backup sidecar writes timestamped snapshots to a local SQLite file, still on your machine.'],
                  ['Sync (optional)', 'Sync mirrors this between your own browsers over end-to-end encrypted WebRTC.'],
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

            {/* WHAT SHAPED THIS */}
            <section id="influences" className="mb-10 scroll-mt-8">
              <div
                className="relative overflow-hidden rounded-[18px] border border-[#FBD9E0] px-7 py-7"
                style={{ background: 'linear-gradient(180deg, #FAE6E1 0%, #FFFFFF 100%)' }}
              >
                <div aria-hidden className="absolute -top-5 -right-5 opacity-60 pointer-events-none">
                  <Hibiscus size={120} petal="#E07A95" />
                </div>

                <div className="relative">
                  <SectionCaps>What shaped this</SectionCaps>
                  <h2 className="font-serif italic text-[28px] text-[#3A1E2A] tracking-[-0.01em] leading-tight mt-2 mb-3 max-w-120">
                    Where the name, and the idea, came from.
                  </h2>
                  <p className="m-0 mb-5 text-[14px] text-[#5A3645] leading-relaxed max-w-145">
                    "Luminosity" comes from a set of posts by Alicorn on LessWrong about
                    getting better at seeing your own inner states clearly. This app is my
                    small, concrete take on that idea. A handful of self-help and psychology
                    books shaped the individual steps too, but the through-line is below.
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

            <footer className="pt-5 mt-5 mb-8 border-t border-[#3A1E2A]/10 text-center text-xs text-[#B391A0] font-serif italic">
              made for myself · kept on your device · nothing leaves your space
            </footer>
          </div>
        </div>
      </main>
    </>
  );
};
