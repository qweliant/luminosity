// Sander T. Jones · Cultivating Connection — optional relational accountability
// lens. Gated behind a checkbox so it stays hidden for solo entries (the common
// case) and only surfaces its UI when the user explicitly engages with
// interpersonal friction. Shared between LensPanel (List view) and the
// FocusOverlay step 5.

import React from 'react';
import type { RelationalLens, RelationalSource } from '../types';

const SOURCE_OPTIONS: Array<{ key: RelationalSource; label: string; hint: string }> = [
  {
    key: 'right_violation',
    label: 'Inherent Right Violated',
    hint: 'Requires external boundary assertion.',
  },
  {
    key: 'agreement_violation',
    label: 'Agreement Violated',
    hint: 'Requires collaborative repair / renegotiation.',
  },
  {
    key: 'internal_work',
    label: 'Neither / Painful Emotion',
    hint: 'Internal reframing — I have work to do.',
  },
];

const CHECKLIST: Array<{
  key: keyof Pick<RelationalLens, 'focusSelf' | 'intentValue' | 'isRequest' | 'preservesAutonomy'>;
  label: string;
}> = [
  { key: 'focusSelf', label: 'Focuses entirely on setting limits on my own behavior.' },
  { key: 'intentValue', label: 'Anchored in honoring a value, not preventing my own fear / jealousy.' },
  { key: 'isRequest', label: 'Framed as a request with space for a “no”, rather than a demand.' },
  { key: 'preservesAutonomy', label: 'Preserves their absolute personal autonomy.' },
];

export const RelationalSection = ({
  relational,
  onChange,
  variant = 'compact',
}: {
  relational: RelationalLens | undefined;
  onChange: (next: RelationalLens) => void;
  variant?: 'compact' | 'focus';
}) => {
  const r: RelationalLens = relational ?? { active: false };
  const isFocus = variant === 'focus';
  const labelSize = isFocus ? 'text-[14px]' : 'text-[13px]';
  const valueSize = isFocus ? 'text-[14px]' : 'text-[12px]';

  const setActive = (active: boolean) => onChange({ ...r, active });
  const setSource = (source: RelationalSource | undefined) => onChange({ ...r, source });
  const setCheck = (key: typeof CHECKLIST[number]['key'], val: boolean) =>
    onChange({ ...r, [key]: val });

  const checks = [r.focusSelf, r.intentValue, r.isRequest, r.preservesAutonomy];
  const checkedCount = checks.filter(c => c === true).length;
  const allClean = checkedCount === 4;
  const anyAnswered = checks.some(c => c !== undefined);

  return (
    <div className="print:hidden">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={r.active}
          onChange={(e) => setActive(e.target.checked)}
          className="accent-black"
        />
        <span className="text-[10px] uppercase tracking-[0.25em] text-pink-700">
          Interpersonal Friction
        </span>
      </label>
      <p className="text-[11px] italic text-pink-400 mt-1 ml-6 leading-snug">
        Tick when another person is part of the friction — runs a short check on whether your need lands as a clean boundary or an overreaching rule.
      </p>

      {r.active && (
        <div className="mt-3 border-l-[0.5px] border-gray-300 pl-4 space-y-5">

          {/* Source — Personal Responsibility Loop */}
          <div className="space-y-2">
            <p className={`font-serif ${labelSize} text-gray-700`}>Source</p>
            <div role="radiogroup" aria-label="Relational source" className="space-y-1.5">
              {SOURCE_OPTIONS.map(opt => {
                const sel = r.source === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="radio"
                    aria-checked={sel}
                    onClick={() => setSource(sel ? undefined : opt.key)}
                    className="w-full flex items-baseline gap-3 text-left group/radio"
                  >
                    <span
                      className={`mt-1 block w-2.5 h-2.5 rounded-full border transition-colors shrink-0 ${
                        sel ? 'bg-pink-400 border-black' : 'border-gray-300 group-hover/radio:border-gray-500'
                      }`}
                    />
                    <span className="flex-1">
                      <span className={`font-serif ${valueSize} ${sel ? 'text-black' : 'text-gray-600 group-hover/radio:text-gray-900'}`}>
                        {opt.label}
                      </span>
                      <span className={`block text-[11px] italic ${sel ? 'text-pink-500' : 'text-pink-400'} leading-snug`}>
                        {opt.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Boundary checklist */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className={`font-serif ${labelSize} text-gray-700`}>Boundary checklist</p>
              {anyAnswered && (
                <span className={`text-[10px] uppercase tracking-[0.2em] ${allClean ? 'text-emerald-600' : 'text-red-500/80'}`}>
                  {allClean ? 'clean boundary' : `overreaching · ${checkedCount}/4`}
                </span>
              )}
            </div>
            <ul className="space-y-1.5">
              {CHECKLIST.map(item => {
                const v = r[item.key];
                return (
                  <li key={item.key}>
                    <label className="flex items-baseline gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={v === true}
                        onChange={(e) => setCheck(item.key, e.target.checked)}
                        className="accent-black mt-0.5 shrink-0"
                      />
                      <span className={`${valueSize} text-gray-700 leading-snug`}>{item.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
