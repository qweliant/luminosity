// Inline 6-step lens panel that opens beneath an EntrySection's title +
// friction/need columns when the user toggles "+ Apply Lenses". Owns the
// "synthesis draft preview" local state because that interaction is
// per-panel: a draft for one row should not leak into another.

import React, { useState } from 'react';
import type { Mapping } from '../types';
import {
  NVC_CATEGORIES,
  CORE_NEEDS,
  CORE_NEEDS_DETAIL,
  VALUE_DETAILS,
} from '../data';
import {
  deriveNeed,
  hasAnyLensData,
  maslowHighest,
  relationalFreedoms,
  sdtProfile,
} from '../derive';
import { LensRow, SdtFootnote, WorkabilityDots } from './primitives';
import { LifeDesignSection } from './LifeDesignSection';
import { RelationalSection } from './RelationalSection';
import { EmotionPicker } from './EmotionPicker';

export const LensPanel = ({
  entry,
  onChange,
  onToggleNvc,
}: {
  entry: Mapping;
  onChange: (patch: Partial<Mapping>) => void;
  onToggleNvc: (need: string) => void;
}) => {
  const [draftPreview, setDraftPreview] = useState<string | null>(null);
  const detail = VALUE_DETAILS[entry.value.toLowerCase().trim()];
  const lensReady = hasAnyLensData(entry);
  const sdt = sdtProfile(entry);
  const maslow = maslowHighest(entry);
  const freedoms = relationalFreedoms(entry);

  const handleSynthesize = () => {
    const draft = deriveNeed(entry);
    if (!entry.need.trim()) {
      onChange({ need: draft });
      setDraftPreview(null);
    } else {
      setDraftPreview(draft);
    }
  };

  return (
    <div className="pl-5 border-l border-gray-100 space-y-6 print:hidden">

      {detail && (
        <LensRow label={`On ${entry.value}`}>
          <p className="text-[11px] italic text-pink-700 mb-2">{detail.synonym}</p>
          <p className="text-[12px] text-pink-600 leading-relaxed mb-3">{detail.description}</p>
          <ul className="space-y-1">
            {detail.reflection.map((q, i) => (
              <li key={i} className="text-[12px] text-pink-700 leading-relaxed">— {q}</li>
            ))}
          </ul>
        </LensRow>
      )}

      <LensRow label="1 · Diagnose · ACT + Atlas of the Heart">
        <p className="text-[11px] text-pink-700 mb-2">How well is your current environment serving this value?</p>
        <WorkabilityDots
          value={entry.workability ?? 0}
          onChange={(n) => onChange({ workability: n })}
          showLabel
        />
        <div className="mt-4">
          <EmotionPicker entry={entry} onChange={onChange} variant="compact" />
        </div>
      </LensRow>

      <LensRow label="2 · Locate · NVC Universal Needs">
        <p className="text-[11px] text-pink-700 mb-3">Tag what's starving underneath the friction.</p>
        <div className="space-y-3 sm:space-y-1.5">
          {NVC_CATEGORIES.map(cat => (
            <div key={cat.name} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-pink-700 sm:w-24 sm:shrink-0 mb-1 sm:mb-0">{cat.name}</div>
              <div className="flex flex-wrap gap-1">
                {cat.needs.map(n => {
                  const sel = entry.nvcNeeds?.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => onToggleNvc(n)}
                      className={`text-[11px] px-2.5 py-1 border rounded-full transition-colors ${
                        sel
                          ? 'border-sky-300 text-black-700 bg-sky-50'
                          : 'border-gray-200 text-pink-500 hover:border-sky-200 hover:text-black-500'
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
      </LensRow>

      <LensRow label="3 · Anchor · Madanes 6 Core Human Needs">
        <p className="text-[11px] text-pink-700 mb-2">Which fundamental driver does this value serve?</p>
        <div className="flex flex-wrap gap-1">
          {CORE_NEEDS.map(n => {
            const sel = entry.coreNeed === n;
            return (
              <button
                key={n}
                title={CORE_NEEDS_DETAIL[n]}
                onClick={() => onChange({ coreNeed: sel ? '' : n })}
                className={`text-[11px] px-2 py-0.5 border rounded-full transition-colors ${
                  sel
                    ? 'border-black text-black'
                    : 'border-gray-200 text-pink-500 hover:border-gray-400'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
        {entry.coreNeed && (
          <p className="text-[11px] italic text-pink-500 mt-2">{CORE_NEEDS_DETAIL[entry.coreNeed]}</p>
        )}
        <SdtFootnote profile={sdt} />
        {maslow && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-pink-700 mt-1">
            Maslow · highest active layer: <span className="text-pink-500">{maslow}</span>
          </p>
        )}
        {freedoms.length > 0 && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-pink-700 mt-1">
            Jones · freedoms at stake: <span className="text-pink-500">{freedoms.join(' · ').toLowerCase()}</span>
          </p>
        )}
      </LensRow>

      <LensRow label="4 · Reframe · Stanford Life Design">
        <LifeDesignSection
          ld={entry.lifeDesign}
          onChange={(next) => onChange({ lifeDesign: next })}
          variant="compact"
        />
      </LensRow>

      <LensRow label="5 · Contextualize · Nagoski Come As You Are">
        <p className="text-[11px] text-pink-700 mb-2">Which contexts accelerate this value, and which brake it?</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-700/60 mb-1">Accelerators</div>
            <textarea
              rows={2}
              className="w-full text-[12px] bg-transparent border-b border-gray-100 focus:outline-none focus:border-gray-400 py-1 placeholder:text-pink-300 resize-none"
              value={entry.accelerators ?? ''}
              onChange={(e) => onChange({ accelerators: e.target.value })}
              placeholder="Conditions that let this thrive…"
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-red-600/60 mb-1">Brakes</div>
            <textarea
              rows={2}
              className="w-full text-[12px] bg-transparent border-b border-gray-100 focus:outline-none focus:border-gray-400 py-1 placeholder:text-pink-300 resize-none"
              value={entry.brakes ?? ''}
              onChange={(e) => onChange({ brakes: e.target.value })}
              placeholder="What shuts it down…"
            />
          </div>
        </div>
        <div className="mt-4">
          <RelationalSection
            relational={entry.relational}
            onChange={(next) => onChange({ relational: next })}
            variant="compact"
          />
        </div>
      </LensRow>

      <div className="pt-3 border-t border-gray-100">
        <button
          onClick={handleSynthesize}
          disabled={!lensReady}
          className="text-[10px] uppercase tracking-[0.25em] text-black-600 hover:text-black-700 transition-colors disabled:text-pink-200 disabled:cursor-not-allowed"
        >
          6 · Synthesize · ✨ Compose Need from lenses
        </button>
        {!lensReady && (
          <p className="text-[10px] text-pink-700 italic mt-1">Set at least one lens above to enable synthesis.</p>
        )}
        {draftPreview && (
          <div className="mt-3 pl-3 border-l-2 border-sky-200">
            <p className="text-[10px] uppercase tracking-[0.2em] text-black-500 mb-1">Draft</p>
            <p className="text-[12px] text-pink-700 leading-relaxed mb-2">{draftPreview}</p>
            <div className="flex gap-4">
              <button
                onClick={() => { onChange({ need: draftPreview }); setDraftPreview(null); }}
                className="text-[10px] uppercase tracking-[0.25em] text-black-700 hover:underline"
              >
                Replace
              </button>
              <button
                onClick={() => {
                  const merged = entry.need ? `${entry.need}\n\n${draftPreview}` : draftPreview;
                  onChange({ need: merged });
                  setDraftPreview(null);
                }}
                className="text-[10px] uppercase tracking-[0.25em] text-pink-600 hover:underline"
              >
                Append
              </button>
              <button
                onClick={() => setDraftPreview(null)}
                className="text-[10px] uppercase tracking-[0.25em] text-pink-700 hover:text-pink-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
