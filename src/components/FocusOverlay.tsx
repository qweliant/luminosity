// Full-viewport wizard. One value at a time, six steps, keyboard-navigable.
// FocusStep is co-located here because it has no other consumer and the two
// components evolve together.

import React, { useEffect, useState } from 'react';
import type { Mapping } from '../types';
import { workabilityColor } from '../types';
import { CORE_NEEDS, CORE_NEEDS_DETAIL, NVC_CATEGORIES } from '../data';
import { deriveNeed, lensCompletion } from '../derive';
import { LifeDesignSection } from './LifeDesignSection';
import { RelationalSection } from './RelationalSection';

const FOCUS_STEPS = ['Diagnose', 'Locate', 'Anchor', 'Reframe', 'Contextualize', 'Synthesize'];
const FOCUS_PROMPTS = [
  'How well is your current environment serving this value, and what is in the way?',
  "What's starving underneath the friction? Tag what's missing.",
  'Which fundamental driver does this value serve?',
  'Where does this value live in your engagement and energy? Frame the problem and design a prototype.',
  'Which contexts accelerate this value, and which brake it?',
  'Compose all of the above into a single Need sentence.',
];

export const FocusOverlay = ({
  entry,
  onChange,
  onToggleNvc,
  onClose,
}: {
  entry: Mapping;
  onChange: (patch: Partial<Mapping>) => void;
  onToggleNvc: (n: string) => void;
  onClose: () => void;
}) => {
  const [step, setStep] = useState(1);
  const total = FOCUS_STEPS.length;
  const completion = lensCompletion(entry);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inField = t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && !inField) setStep(s => Math.min(total, s + 1));
      else if (e.key === 'ArrowLeft' && !inField) setStep(s => Math.max(1, s - 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, total]);

  return (
    <div className="fixed inset-0 bg-[#FDFCFB] z-50 overflow-y-auto print:hidden animate-in fade-in duration-300">
      <div className="max-w-2xl mx-auto py-10 sm:py-16 px-6 min-h-screen flex flex-col">

        <header className="flex justify-between items-start mb-10 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-pink-700 mb-1">Focus mode</p>
            <h2 className="text-3xl sm:text-4xl font-serif italic leading-tight">
              {entry.value || <em className="text-pink-300">untitled</em>}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-pink-400 hover:text-pink-800 text-3xl leading-none -mt-2 shrink-0"
            title="Close (Esc)"
            aria-label="Close focus mode"
          >
            ×
          </button>
        </header>

        <div className="mb-10">
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-[10px] uppercase tracking-[0.25em] text-pink-500">
              Step {step} of {total} · {FOCUS_STEPS[step - 1]}
            </p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-pink-700">
              {completion.filled}/{completion.total} lenses set
            </p>
          </div>
          <div className="flex gap-1">
            {FOCUS_STEPS.map((name, i) => {
              const reached = i + 1 <= step;
              const stepFilled = completion.steps[i];
              return (
                <button
                  key={name}
                  onClick={() => setStep(i + 1)}
                  className={`flex-1 h-1 transition-colors ${
                    reached ? (stepFilled ? 'bg-sky-500' : 'bg-sky-300') : (stepFilled ? 'bg-sky-200' : 'bg-gray-200')
                  } hover:opacity-80`}
                  title={name}
                  aria-label={`Go to step ${i + 1}: ${name}`}
                />
              );
            })}
          </div>
        </div>

        <p className="text-[15px] text-pink-600 leading-relaxed mb-10 italic font-serif">
          {FOCUS_PROMPTS[step - 1]}
        </p>

        <div className="flex-1">
          <FocusStep step={step} entry={entry} onChange={onChange} onToggleNvc={onToggleNvc} />
        </div>

        <footer className="flex justify-between items-center pt-10 mt-10 border-t border-gray-100 gap-4">
          <button
            onClick={() => setStep(s => Math.min(total, s + 1))}
            className="text-[10px] uppercase tracking-[0.25em] text-pink-400 hover:text-pink-600"
            disabled={step === total}
          >
            Skip
          </button>
          <div className="flex gap-3 sm:gap-6 items-center">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="text-[10px] uppercase tracking-[0.25em] text-pink-500 hover:text-pink-700 disabled:text-pink-200 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            {step < total ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="bg-pink-400 text-white text-[10px] uppercase tracking-[0.25em] px-6 py-3 hover:bg-sky-700 transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="bg-pink-400 text-white text-[10px] uppercase tracking-[0.25em] px-6 py-3 hover:bg-sky-700 transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

const FocusStep = ({
  step,
  entry,
  onChange,
  onToggleNvc,
}: {
  step: number;
  entry: Mapping;
  onChange: (patch: Partial<Mapping>) => void;
  onToggleNvc: (n: string) => void;
}) => {
  if (step === 1) {
    return (
      <div className="space-y-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-pink-700 mb-3">Workability</p>
          <div className="flex gap-3 items-center">
            {[1, 2, 3, 4, 5].map(n => {
              const filled = n <= (entry.workability ?? 0);
              const color = workabilityColor(entry.workability ?? 0);
              return (
                <button
                  key={n}
                  onClick={() => onChange({ workability: entry.workability === n ? 0 : n })}
                  className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: filled ? color : 'transparent',
                    borderColor: filled ? color : '#d1d5db',
                  }}
                  aria-label={`Workability ${n}`}
                />
              );
            })}
            <span className="ml-3 text-[11px] uppercase tracking-[0.25em] text-pink-700">
              {entry.workability ? (entry.workability <= 2 ? 'stuck' : entry.workability === 3 ? 'mixed' : 'working') : 'unrated'}
            </span>
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-pink-700 mb-2">The Friction</p>
          <textarea
            autoFocus
            rows={4}
            className="w-full bg-transparent border-b border-gray-200 focus:outline-none focus:border-gray-500 text-base text-pink-700 leading-relaxed resize-none placeholder:text-pink-300 py-2"
            value={entry.friction}
            onChange={(e) => onChange({ friction: e.target.value })}
            placeholder="What's currently standing in the way?"
          />
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        {NVC_CATEGORIES.map(cat => (
          <div key={cat.name} className="flex items-baseline gap-3 flex-wrap sm:flex-nowrap">
            <div className="text-[10px] uppercase tracking-[0.2em] text-pink-700 w-full sm:w-24 sm:shrink-0">{cat.name}</div>
            <div className="flex flex-wrap gap-1.5">
              {cat.needs.map(n => {
                const sel = entry.nvcNeeds?.includes(n);
                return (
                  <button
                    key={n}
                    onClick={() => onToggleNvc(n)}
                    className={`text-[12px] px-3 py-1 border rounded-full transition-colors ${
                      sel
                        ? 'border-sky-300 text-black-700 bg-sky-50'
                        : 'border-gray-200 text-pink-600 hover:border-sky-200 hover:text-black-500'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-3">
        {CORE_NEEDS.map(n => {
          const sel = entry.coreNeed === n;
          return (
            <button
              key={n}
              onClick={() => onChange({ coreNeed: sel ? '' : n })}
              className={`w-full text-left p-4 border transition-colors ${
                sel ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className={`text-base font-serif ${sel ? 'text-black' : 'text-pink-700'}`}>{n}</div>
              <div className="text-[12px] text-pink-500 mt-0.5">{CORE_NEEDS_DETAIL[n]}</div>
            </button>
          );
        })}
      </div>
    );
  }

  if (step === 4) {
    return (
      <LifeDesignSection
        ld={entry.lifeDesign}
        onChange={(next) => onChange({ lifeDesign: next })}
        variant="focus"
      />
    );
  }

  if (step === 5) {
    return (
      <div className="space-y-8">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-700/70 mb-2">Accelerators</p>
            <textarea
              autoFocus
              rows={5}
              className="w-full text-[14px] bg-transparent border-b border-gray-200 focus:outline-none focus:border-gray-500 py-2 resize-none placeholder:text-pink-300"
              value={entry.accelerators ?? ''}
              onChange={(e) => onChange({ accelerators: e.target.value })}
              placeholder="Conditions that let this thrive…"
            />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-red-600/70 mb-2">Brakes</p>
            <textarea
              rows={5}
              className="w-full text-[14px] bg-transparent border-b border-gray-200 focus:outline-none focus:border-gray-500 py-2 resize-none placeholder:text-pink-300"
              value={entry.brakes ?? ''}
              onChange={(e) => onChange({ brakes: e.target.value })}
              placeholder="What shuts it down…"
            />
          </div>
        </div>
        <RelationalSection
          relational={entry.relational}
          onChange={(next) => onChange({ relational: next })}
          variant="focus"
        />
      </div>
    );
  }

  // step === 6 — Synthesize
  const draft = deriveNeed(entry);
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-black-500 mb-2">Templated draft</p>
        <p className="text-[14px] text-pink-700 leading-relaxed italic font-serif border-l-2 border-sky-200 pl-4">
          {draft}
        </p>
        <div className="flex gap-4 mt-3">
          <button
            onClick={() => onChange({ need: draft })}
            className="text-[10px] uppercase tracking-[0.25em] text-black-700 hover:underline"
          >
            Use draft
          </button>
          <button
            onClick={() => {
              const merged = entry.need ? `${entry.need}\n\n${draft}` : draft;
              onChange({ need: merged });
            }}
            className="text-[10px] uppercase tracking-[0.25em] text-pink-600 hover:underline"
          >
            Append to mine
          </button>
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-pink-700 mb-2">Your Need</p>
        <textarea
          rows={6}
          className="w-full text-[14px] bg-transparent border-b border-gray-200 focus:outline-none focus:border-gray-500 py-2 leading-relaxed resize-none placeholder:text-pink-300 font-medium text-pink-900"
          value={entry.need}
          onChange={(e) => onChange({ need: e.target.value })}
          placeholder="The non-negotiable requirement, in your own words."
        />
      </div>
    </div>
  );
};
