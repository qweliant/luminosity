// Small visual atoms reused across the app. Stateless or near-stateless,
// no business logic. Group lives here so individual files don't proliferate.

import React from 'react';
import { workabilityColor } from '../types';
import type { LensCompletion, SdtProfile } from '../derive';

// --- LensRow ---------------------------------------------------------------
// Tracking-wide tiny-caps section header used inside the inline lens panel.

export const LensRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="text-[10px] uppercase tracking-[0.25em] text-pink-700 font-semibold mb-2">{label}</div>
    {children}
  </div>
);

// --- WorkabilityDots --------------------------------------------------------
// Five-dot ACT Bullseye scale. Color shifts red → amber → green by value.

export const WorkabilityDots = ({
  value,
  onChange,
  showLabel = false,
}: {
  value: number;
  onChange: (n: number) => void;
  showLabel?: boolean;
}) => (
  <div className="flex gap-0.5 items-center" title={`Workability: ${value || '–'}/5`}>
    {[1, 2, 3, 4, 5].map(n => {
      const filled = n <= value;
      const color = workabilityColor(value);
      return (
        <button
          key={n}
          onClick={() => onChange(value === n ? 0 : n)}
          aria-label={`Workability ${n}`}
          className="p-2 -m-1 group/dot transition-all hover:scale-110"
        >
          <span
            className="block w-2.5 h-2.5 rounded-full border"
            style={{
              backgroundColor: filled ? color : 'transparent',
              borderColor: filled ? color : '#d1d5db',
            }}
          />
        </button>
      );
    })}
    {showLabel && (
      <span className="ml-2 text-[10px] uppercase tracking-[0.25em] text-pink-700">
        {value === 0 ? 'unrated' : value <= 2 ? 'stuck' : value === 3 ? 'mixed' : 'working'}
      </span>
    )}
  </div>
);

// --- DotString --------------------------------------------------------------
// Single-marker 1–5 scale (Wayfinding Engagement / Energy). Different from
// WorkabilityDots: only the chosen position is filled, others are hairline.

export const DotString = ({
  value,
  onChange,
  ariaLabel,
}: {
  value: number | undefined;
  onChange: (n: number) => void;
  ariaLabel: string;
}) => (
  <div className="flex items-center" role="radiogroup" aria-label={ariaLabel}>
    {[1, 2, 3, 4, 5].map(n => {
      const sel = value === n;
      return (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={sel}
          aria-label={`${ariaLabel} level ${n}`}
          onClick={() => onChange(value === n ? 0 : n)}
          className="flex items-center justify-center w-6 h-6 group/dot"
        >
          <span
            className={`block rounded-full transition-all ${
              sel ? 'w-2 h-2 bg-pink-400' : 'w-1 h-1 bg-gray-300 group-hover/dot:bg-sky-400'
            }`}
          />
        </button>
      );
    })}
  </div>
);

// --- CompletionBar ----------------------------------------------------------
// 6-segment hairline progress for `lensCompletion()`. Inline beside the lens
// toggle on each row.

export const CompletionBar = ({ completion }: { completion: LensCompletion }) => {
  const allDone = completion.filled === completion.total;
  return (
    <div className="flex items-center gap-2" title={`${completion.filled} of ${completion.total} lenses applied`}>
      <div className="flex gap-0.5">
        {completion.steps.map((on, i) => (
          <span
            key={i}
            className={`block w-2 h-0.5 transition-colors ${on ? (allDone ? 'bg-emerald-500' : 'bg-sky-400') : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <span className={`text-[10px] uppercase tracking-[0.2em] ${allDone ? 'text-emerald-600' : 'text-pink-700'}`}>
        {allDone ? 'complete' : `${completion.filled}/${completion.total}`}
      </span>
    </div>
  );
};

// --- SdtFootnote ------------------------------------------------------------
// Read-only Self-Determination Theory profile (autonomy / competence /
// relatedness), derived from NVC tags + core need. No input; appears under
// the Robbins step when at least one signal exists.

export const SdtFootnote = ({ profile }: { profile: SdtProfile }) => {
  const total = profile.autonomy + profile.competence + profile.relatedness;
  if (total === 0) return null;
  const dot = (n: number) => '●'.repeat(Math.min(n, 3)) + '○'.repeat(Math.max(0, 3 - Math.min(n, 3)));
  return (
    <p className="text-[10px] uppercase tracking-[0.2em] text-pink-700 mt-3">
      SDT · autonomy <span className="text-pink-500">{dot(profile.autonomy)}</span>
      &nbsp;·&nbsp;competence <span className="text-pink-500">{dot(profile.competence)}</span>
      &nbsp;·&nbsp;relatedness <span className="text-pink-500">{dot(profile.relatedness)}</span>
    </p>
  );
};
