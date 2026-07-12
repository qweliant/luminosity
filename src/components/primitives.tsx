// Small visual atoms reused across the app. Stateless or near-stateless,
// no business logic. Group lives here so individual files don't proliferate.

import React from 'react';
import { workabilityColor } from '../types';
import type { LensCompletion } from '../derive';

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
  <div className="flex gap-0.5 items-center" title={`How it's going: ${value || '–'}/5`}>
    {[1, 2, 3, 4, 5].map(n => {
      const filled = n <= value;
      const color = workabilityColor(value);
      return (
        <button
          key={n}
          onClick={() => onChange(value === n ? 0 : n)}
          aria-label={`How it's going ${n}`}
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
    <div className="flex items-center gap-2" title={`${completion.filled} of ${completion.total} steps done`}>
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

// --- WorkabilityArc ---------------------------------------------------------
// Tiny sparkline of a value's "how it's going" journal — the reward for coming
// back. Maps each checkpoint's 1–5 rating to a point (5 at top), colours the
// line by its latest move (up = sage, down = pink, flat = muted), and marks the
// most recent point. Needs at least two checkpoints; renders nothing otherwise.

const ARC_COLOR = {
  rising: '#5C7F66',
  falling: '#C24E6E',
  steady: '#B391A0',
} as const;

export const WorkabilityArc = ({
  arc,
  direction,
  width = 52,
  height = 14,
}: {
  arc: number[];
  direction?: 'rising' | 'falling' | 'steady' | null;
  width?: number;
  height?: number;
}) => {
  if (arc.length < 2) return null;
  const pad = 2;
  const n = arc.length;
  const x = (i: number) => pad + (i * (width - pad * 2)) / (n - 1);
  const y = (v: number) => {
    const t = (Math.min(5, Math.max(1, v)) - 1) / 4; // 0 (=1) .. 1 (=5)
    return height - pad - t * (height - pad * 2);
  };
  const points = arc.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const color = ARC_COLOR[direction ?? 'steady'];
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block align-middle overflow-visible"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />
      <circle cx={x(n - 1)} cy={y(arc[n - 1]!)} r={1.9} fill={color} />
    </svg>
  );
};
