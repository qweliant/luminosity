// Stanford Life Design lens (Wayfinding · Problem framing · Reframe/Acceptance ·
// Talk/Do prototype). Shared between the inline LensPanel (List view) and the
// FocusOverlay step 4. Two visual variants: 'compact' (lens panel) and 'focus'
// (slightly larger type for the wizard).

import React from 'react';
import type { LifeDesignLens, LifeDesignProblemType, PrototypeMode } from '../types';
import { DotString } from './primitives';

const LIFE_DESIGN_FRAME_HINTS: Record<LifeDesignProblemType, string> = {
  open: 'A real problem you can prototype against.',
  stuck: 'Sticky and recurring — needs a reframe before it can be prototyped.',
  reality: 'A fact of life to accept and navigate around, not solve.',
};

export const LifeDesignSection = ({
  ld,
  onChange,
  variant = 'compact',
}: {
  ld: LifeDesignLens | undefined;
  onChange: (next: LifeDesignLens) => void;
  variant?: 'compact' | 'focus';
}) => {
  const current: LifeDesignLens = ld ?? {};
  const isFocus = variant === 'focus';
  const energy = current.wayfinding?.energy ?? 0;
  const engagement = current.wayfinding?.engagement ?? 0;
  const frame = current.problemFrame;
  const isReality = frame === 'reality';
  const isStuck = frame === 'stuck';
  const isOpen = frame === 'open';
  const reframeText = current.reframeNote?.trim() ?? '';
  const prototypeLocked = isStuck && reframeText.length === 0;

  const setEngagement = (n: number) =>
    onChange({ ...current, wayfinding: { ...(current.wayfinding ?? {}), engagement: n || undefined } });
  const setEnergy = (n: number) =>
    onChange({ ...current, wayfinding: { ...(current.wayfinding ?? {}), energy: n || undefined } });
  const setFrame = (p: LifeDesignProblemType | undefined) =>
    onChange({ ...current, problemFrame: p });
  const setReframe = (s: string) => onChange({ ...current, reframeNote: s });
  const setAcceptance = (s: string) => onChange({ ...current, acceptanceNote: s });
  const setPrototypeMode = (m: PrototypeMode) =>
    onChange({
      ...current,
      prototype: { mode: m, action: current.prototype?.action ?? '' },
    });
  const setPrototypeAction = (s: string) =>
    onChange({
      ...current,
      prototype: { mode: current.prototype?.mode, action: s },
    });

  const labelSize = isFocus ? 'text-[14px]' : 'text-[13px]';
  const valueSize = isFocus ? 'text-[14px]' : 'text-[12px]';

  return (
    <div className="border-l-[0.5px] border-gray-300 pl-4 space-y-5">

      {/* Wayfinding (always visible) */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.25em] text-pink-700">Wayfinding · Good Time Journal</p>
        <div className="flex items-center justify-between gap-3">
          <span className={`font-serif ${labelSize} text-pink-700`}>Engagement</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-pink-700 hidden sm:inline">flow</span>
            <DotString value={engagement} onChange={setEngagement} ariaLabel="Engagement" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className={`font-serif ${labelSize} text-pink-700`}>Energy</span>
          <div className="flex items-center gap-3">
            {energy > 0 && energy < 3 && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-red-500/70 italic">drain</span>
            )}
            <DotString value={energy} onChange={setEnergy} ariaLabel="Energy" />
          </div>
        </div>
      </div>

      {/* Problem type — minimalist hairline radio group */}
      <div className="space-y-2">
        <p className={`font-serif ${labelSize} text-pink-700`}>Problem type</p>
        <div role="radiogroup" aria-label="Problem type" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {(['open', 'stuck', 'reality'] as const).map(p => {
            const sel = frame === p;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => setFrame(sel ? undefined : p)}
                title={LIFE_DESIGN_FRAME_HINTS[p]}
                className="flex items-center gap-2 group/radio"
              >
                <span
                  className={`block w-2.5 h-2.5 rounded-full border transition-colors ${
                    sel ? 'bg-pink-400 border-black' : 'border-gray-300 group-hover/radio:border-gray-500'
                  }`}
                />
                <span className={`font-serif ${valueSize} capitalize ${sel ? 'text-black' : 'text-pink-500 group-hover/radio:text-pink-800'}`}>
                  {p}
                </span>
              </button>
            );
          })}
        </div>
        {frame && (
          <p className={`${valueSize} italic text-pink-500 leading-relaxed`}>
            {LIFE_DESIGN_FRAME_HINTS[frame]}
          </p>
        )}
      </div>

      {/* Reality: italicized serif acceptance note only */}
      {isReality && (
        <div className="space-y-1">
          <p className={`font-serif ${labelSize} text-pink-700`}>Acceptance — “How will I navigate?”</p>
          <input
            className="w-full font-serif italic text-base bg-transparent border-b border-[0.5px] border-gray-200 focus:outline-none focus:border-gray-500 py-2 placeholder:text-pink-400 placeholder:italic placeholder:font-serif"
            value={current.acceptanceNote ?? ''}
            onChange={(e) => setAcceptance(e.target.value)}
            placeholder="This is a fact of life. How will you navigate around it?"
          />
        </div>
      )}

      {/* Stuck: reframe first */}
      {isStuck && (
        <div className="space-y-1">
          <p className={`font-serif ${labelSize} text-pink-700`}>Reframe — “How might I…”</p>
          <input
            className={`w-full ${valueSize} bg-transparent border-b border-[0.5px] border-gray-200 focus:outline-none focus:border-gray-500 py-1 placeholder:text-pink-300`}
            value={current.reframeNote ?? ''}
            onChange={(e) => setReframe(e.target.value)}
            placeholder="The shift that turns the wall into a problem."
          />
        </div>
      )}

      {/* Prototype: visible for Open and (locked for) Stuck; hidden for Reality */}
      {!isReality && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className={`font-serif ${labelSize} text-pink-700`}>Life Design Prototype</p>
            {prototypeLocked && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-pink-400 italic">locked · write a reframe first</span>
            )}
          </div>
          <fieldset disabled={prototypeLocked} className={`space-y-2 ${prototypeLocked ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.25em] text-pink-400">test via</span>
              <div role="radiogroup" aria-label="Prototype mode" className="flex items-center gap-3">
                {(['talk', 'do'] as const).map((m, i) => {
                  const sel = current.prototype?.mode === m;
                  return (
                    <span key={m} className="flex items-center gap-3">
                      {i > 0 && <span className="text-pink-300 text-[11px]">or</span>}
                      <button
                        type="button"
                        role="radio"
                        aria-checked={sel}
                        onClick={() => setPrototypeMode(m)}
                        className="flex items-center gap-1.5 group/mode"
                      >
                        <span
                          className={`block w-2 h-2 rounded-full border transition-colors ${
                            sel ? 'bg-pink-400 border-black' : 'border-gray-300 group-hover/mode:border-gray-500'
                          }`}
                        />
                        <span
                          className={`font-serif lowercase ${valueSize} ${
                            sel ? 'text-black' : 'text-pink-500 group-hover/mode:text-pink-800'
                          }`}
                        >
                          {m}
                        </span>
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
            <p className="text-[10px] italic text-pink-400 leading-relaxed">
              Gather data through a story (Talk) or an experience (Do).
            </p>
            <input
              className={`w-full ${valueSize} bg-transparent border-b border-[0.5px] border-gray-200 focus:outline-none focus:border-gray-500 py-1 placeholder:text-pink-300`}
              value={current.prototype?.action ?? ''}
              onChange={(e) => setPrototypeAction(e.target.value)}
              placeholder={
                current.prototype?.mode === 'talk'
                  ? "Who has already lived this? Note who you'll interview."
                  : current.prototype?.mode === 'do'
                  ? 'How can you try this for a day? Note your smallest experiment.'
                  : isOpen
                  ? 'The smallest experiment to test this directly.'
                  : 'The smallest experiment to test the reframe.'
              }
            />
          </fieldset>
        </div>
      )}
    </div>
  );
};
