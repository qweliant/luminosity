// Shared bits, in the values ledger's visual language: deep plum on cream,
// serif for anything that is a sentence, tiny mono capitals for labels, and
// hairline rules instead of boxes. Copied in rather than imported — the two
// apps' components diverge, and sharing at this layer is how a two-app repo
// quietly turns into a design-system project.

import React from 'react';
import type { NeedStatus } from '../derive';

/** Tiny mono capitals. The values ledger uses these for every field label. */
export const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="font-mono text-[9px] tracking-[0.16em] text-mauve uppercase">
    {children}
  </div>
);

// Full literal class strings: Tailwind scans source text, so a class name
// assembled at runtime would never make it into the build.
const STATUS_CLASS: Record<NeedStatus, string> = {
  met: 'text-[#5B8C6E]',
  waiting: 'text-[#C08A3E]',
  declined: 'text-rose',
  none: 'text-mauve',
};

export const STATUS_LABEL: Record<NeedStatus, string> = {
  met: 'met',
  waiting: 'waiting to hear',
  declined: 'told no',
  none: 'no one, yet',
};

export const StatusNote = ({ status }: { status: NeedStatus }) => (
  <span className={`font-serif text-sm italic ${STATUS_CLASS[status]}`}>
    {STATUS_LABEL[status]}
  </span>
);

export const FloorMark = () => (
  <span className="font-mono text-[9px] tracking-[0.16em] text-rose uppercase">
    non-negotiable
  </span>
);

/** A hairline-ruled block. The app's only container. */
export const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="border-b border-ink/8 py-5">{children}</div>
);

// 16px minimum on inputs — anything smaller and iOS zooms the viewport on focus.
export const inputClass =
  'w-full rounded-none border-0 border-b border-ink/15 bg-transparent px-0 py-2 ' +
  'font-serif text-base text-ink outline-none placeholder:font-sans ' +
  'placeholder:text-[15px] placeholder:text-mauve/70 focus:border-rose';

export const selectClass =
  'rounded-full border border-ink/12 bg-white/60 px-3 py-2 font-sans text-sm ' +
  'text-ink outline-none focus:border-rose';

// 44px minimum tap target.
export const buttonClass =
  'min-h-11 rounded-full bg-rose px-5 font-mono text-[10px] tracking-[0.16em] ' +
  'text-white uppercase disabled:opacity-30';

export const quietButtonClass =
  'min-h-11 rounded-full border border-ink/12 bg-white/50 px-4 font-mono ' +
  'text-[10px] tracking-[0.16em] text-ink/70 uppercase active:bg-white';

/** An inline text button — the app's most common control. */
export const linkClass =
  'font-sans text-[13px] text-mauve underline decoration-mauve/40 ' +
  'underline-offset-2 hover:text-rose';

export const Figure = ({
  label,
  value,
  tone = 'ink',
}: {
  label: string;
  value: string;
  tone?: 'ink' | 'rose' | 'mauve';
}) => (
  <div>
    <Label>{label}</Label>
    <div
      className={`mt-1 font-serif text-3xl leading-none ${
        tone === 'rose' ? 'text-rose' : tone === 'mauve' ? 'text-mauve' : 'text-ink'
      }`}
    >
      {value}
    </div>
  </div>
);
