// One row in the List view. Owns the per-row chrome (title input, workability
// dots, friction/need columns, NVC tag display, lens toggle, focus button,
// duplicate warning, and the print-only summary block). Delegates the inline
// lens panel to LensPanel.

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Mapping } from '../types';
import { EMOTION_PLACES_BY_ID, findEmotion } from '../data';
import { lensCompletion } from '../derive';
import { CompletionBar, WorkabilityDots } from './primitives';
import { LensPanel } from './LensPanel';

interface EntryProps {
  entry: Mapping;
  isDuplicate: boolean;
  lensOpen: boolean;
  onToggleLens: () => void;
  onChange: (patch: Partial<Mapping>) => void;
  onDelete: () => void;
  onToggleNvc: (need: string) => void;
  onFocus: () => void;
}

export const EntrySection = ({
  entry,
  isDuplicate,
  lensOpen,
  onToggleLens,
  onChange,
  onDelete,
  onToggleNvc,
  onFocus,
}: EntryProps) => {
  const completion = lensCompletion(entry);

  return (
    <section className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button
        onClick={onDelete}
        className="absolute -left-12 top-0 text-pink-200 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all print:hidden"
      >
        <Trash2 size={18} />
      </button>

      <div className="grid gap-6">
        <div className={`pb-2 flex items-center gap-4 border-b ${isDuplicate ? 'border-red-300' : 'border-gray-100'}`}>
          <input
            className="flex-1 text-2xl font-serif bg-transparent focus:outline-none placeholder:text-pink-200"
            value={entry.value}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder="Core Value"
          />
          <WorkabilityDots
            value={entry.workability ?? 0}
            onChange={(n) => onChange({ workability: n })}
          />
        </div>
        {isDuplicate && (
          <p className="-mt-4 text-[10px] uppercase tracking-[0.2em] text-red-500 print:hidden">
            Duplicate of another entry — values must be unique.
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-pink-700 font-semibold">The Friction</label>
            <textarea
              className="w-full bg-transparent focus:outline-none text-sm text-pink-600 leading-relaxed resize-none"
              value={entry.friction}
              onChange={(e) => onChange({ friction: e.target.value })}
              placeholder="What's currently standing in the way?"
              rows={3}
            />
            {entry.emotionCluster && (() => {
              const place = EMOTION_PLACES_BY_ID[entry.emotionCluster];
              const emo = findEmotion(entry.emotionCluster, entry.emotion);
              const cessation = !!emo?.cessation;
              return (
                <p className={`text-[11px] italic pt-0.5 ${cessation ? 'text-amber-700' : 'text-pink-700'}`}>
                  {cessation ? '⚠ ' : ''}
                  {entry.emotion ? `${entry.emotion.toLowerCase()} · ` : ''}
                  <span className="text-pink-500">{place.label.toLowerCase()}</span>
                </p>
              );
            })()}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-black-400 font-semibold">The Need</label>
            <textarea
              className="w-full bg-transparent focus:outline-none text-sm text-pink-900 font-medium leading-relaxed resize-none"
              value={entry.need}
              onChange={(e) => onChange({ need: e.target.value })}
              placeholder="What is the non-negotiable requirement?"
              rows={3}
            />
            {entry.nvcNeeds && entry.nvcNeeds.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 pt-1">
                {entry.nvcNeeds.map(n => (
                  <span key={n} className="text-[11px] text-black-700/80 lowercase italic">·{n}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="print:hidden -mt-2 flex items-center gap-4 flex-wrap">
          <button
            onClick={onToggleLens}
            className="text-[10px] uppercase tracking-[0.25em] text-pink-700 hover:text-black-500 transition-colors"
          >
            {lensOpen ? '− Hide Lenses' : '+ Apply Lenses'}
          </button>
          <CompletionBar completion={completion} />
          <button
            onClick={onFocus}
            className="text-[10px] uppercase tracking-[0.25em] text-pink-700 hover:text-black-500 transition-colors ml-auto"
            title="Open this value in focus mode"
          >
            Focus →
          </button>
        </div>

        {lensOpen && <LensPanel entry={entry} onChange={onChange} onToggleNvc={onToggleNvc} />}

        {/* Print-only summary. Mirrors the lens data as plain text so the
            interactive controls can be hidden cleanly during print. */}
        <div className="hidden print:block text-[11px] text-pink-600 pt-3 mt-2 border-t border-gray-100 space-y-1">
          {entry.workability ? <div>Workability: {entry.workability}/5</div> : null}
          {entry.emotionCluster ? (
            <div>
              Atlas of the Heart:{' '}
              {entry.emotion ? `${entry.emotion} · ` : ''}
              {EMOTION_PLACES_BY_ID[entry.emotionCluster].label}
            </div>
          ) : null}
          {entry.coreNeed ? <div>Core need: {entry.coreNeed}</div> : null}
          {entry.lifeDesign?.wayfinding?.engagement || entry.lifeDesign?.wayfinding?.energy ? (
            <div>
              Wayfinding ·
              {entry.lifeDesign.wayfinding?.engagement ? ` engagement ${entry.lifeDesign.wayfinding.engagement}/5` : ''}
              {entry.lifeDesign.wayfinding?.engagement && entry.lifeDesign.wayfinding?.energy ? ' ·' : ''}
              {entry.lifeDesign.wayfinding?.energy ? ` energy ${entry.lifeDesign.wayfinding.energy}/5` : ''}
            </div>
          ) : null}
          {entry.lifeDesign?.problemFrame ? <div>Problem type: {entry.lifeDesign.problemFrame}</div> : null}
          {entry.lifeDesign?.problemFrame !== 'reality' && entry.lifeDesign?.reframeNote?.trim() ? (
            <div>Reframe: {entry.lifeDesign.reframeNote}</div>
          ) : null}
          {entry.lifeDesign?.problemFrame === 'reality' && entry.lifeDesign?.acceptanceNote?.trim() ? (
            <div>Acceptance: {entry.lifeDesign.acceptanceNote}</div>
          ) : null}
          {entry.lifeDesign?.problemFrame !== 'reality' && entry.lifeDesign?.prototype?.action?.trim() ? (
            <div>
              Prototype ({entry.lifeDesign.prototype.mode ?? 'do'}): {entry.lifeDesign.prototype.action}
            </div>
          ) : null}
          {entry.accelerators ? <div>Accelerators: {entry.accelerators}</div> : null}
          {entry.brakes ? <div>Brakes: {entry.brakes}</div> : null}
          {entry.relational?.active && entry.relational.source ? (
            <div>
              Relational source: {entry.relational.source.replace('_', ' ')}
              {(() => {
                const r = entry.relational!;
                const checks = [r.focusSelf, r.intentValue, r.isRequest, r.preservesAutonomy];
                const checked = checks.filter(c => c === true).length;
                const total = checks.filter(c => c !== undefined).length;
                if (total === 0) return null;
                return ` · boundary ${checked}/4 (${checked === 4 ? 'clean' : 'overreaching'})`;
              })()}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
