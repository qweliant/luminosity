// Two-level picker for Brené Brown · Atlas of the Heart. The user names a
// "place we go" (cluster) and then optionally narrows to a specific emotion
// inside it. Cluster alone is enough to fill the Diagnose step; the emotion
// sub-pick refines the routing hint and, for cessation emotions, drives the
// short-circuit in deriveNeed().

import React from 'react';
import type { EmotionCluster, Mapping } from '../types';
import { EMOTION_PLACES, EMOTION_PLACES_BY_ID, findEmotion } from '../data';

interface Props {
  entry: Mapping;
  onChange: (patch: Partial<Mapping>) => void;
  variant?: 'compact' | 'focus';
}

// A "cessation cluster" is one where every emotion is a cessation state —
// only the Hurting place qualifies today. Tinted amber on the cluster pill so
// the user has the cue before they drill down.
const isCessationCluster = (id: EmotionCluster): boolean => {
  const place = EMOTION_PLACES_BY_ID[id];
  if (!place || place.emotions.length === 0) return false;
  return place.emotions.every((e) => !!e.cessation);
};

export const EmotionPicker = ({ entry, onChange, variant = 'compact' }: Props) => {
  const cluster = entry.emotionCluster;
  const place = cluster ? EMOTION_PLACES_BY_ID[cluster] : undefined;
  const emotion = findEmotion(cluster, entry.emotion);
  const isFocus = variant === 'focus';
  const selectedClusterIsCessation = cluster ? isCessationCluster(cluster) : false;

  const pickCluster = (id: EmotionCluster) => {
    if (cluster === id) {
      // Toggle off — clear both levels.
      onChange({ emotionCluster: undefined, emotion: undefined });
    } else {
      onChange({ emotionCluster: id, emotion: undefined });
    }
  };

  const pickEmotion = (name: string) => {
    onChange({ emotion: entry.emotion === name ? undefined : name });
  };

  return (
    <div className="space-y-3">
      <p
        className={`text-[11px] text-[#5A3645] ${isFocus ? 'mb-2' : 'mb-1'} font-serif italic leading-relaxed`}
      >
        Where's the friction coming from? Pick the closest match — you can change it later.{' '}
        <span className="not-italic font-sans text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold">
          Atlas of the Heart
        </span>
      </p>

      <div className="flex flex-wrap gap-1.5">
        {EMOTION_PLACES.map((p) => {
          const sel = cluster === p.id;
          const cess = isCessationCluster(p.id);
          const base = isFocus ? 'text-[12px] px-3 py-1' : 'text-[11px] px-2.5 py-1';
          let palette = '';
          if (sel && cess) {
            palette =
              'border-[#D6A24A] text-[#8B6914] bg-[#FFF1D6] font-semibold';
          } else if (sel) {
            palette =
              'border-[#C24E6E] text-[#C24E6E] bg-[#FBD9E0]/60 font-semibold';
          } else if (cess) {
            palette =
              'border-[#D6A24A]/40 text-[#8B6914] bg-transparent hover:border-[#D6A24A] hover:bg-[#FFF1D6]/40';
          } else {
            palette =
              'border-[#3A1E2A]/15 text-[#5A3645] bg-transparent hover:border-[#C24E6E] hover:text-[#C24E6E]';
          }
          return (
            <button
              key={p.id}
              onClick={() => pickCluster(p.id)}
              title={p.blurb}
              className={`${base} border rounded-full transition-colors cursor-pointer inline-flex items-center gap-1.5 ${palette}`}
            >
              {cess && <span aria-hidden>⏸</span>}
              {p.label}
            </button>
          );
        })}
      </div>

      {place && (
        <div
          className={`pl-3 space-y-2 ${
            selectedClusterIsCessation
              ? 'border-l-2 border-[#D6A24A]/50'
              : 'border-l border-[#FBD9E0]'
          }`}
        >
          <p
            className={`text-[11px] italic font-serif leading-relaxed ${
              selectedClusterIsCessation ? 'text-[#8B6914]' : 'text-[#5A3645]'
            }`}
          >
            {place.blurb}
          </p>
          <div className="flex flex-wrap gap-1">
            {place.emotions.map((e) => {
              const sel = entry.emotion === e.name;
              const cessation = !!e.cessation;
              let palette = '';
              if (sel && cessation) {
                palette =
                  'border-[#8B6914] text-white bg-[#8B6914] font-semibold';
              } else if (sel) {
                palette =
                  'border-[#C24E6E] text-white bg-[#C24E6E] font-semibold';
              } else if (cessation) {
                palette =
                  'border-[#D6A24A]/50 text-[#8B6914] bg-[#FFF1D6]/60 hover:border-[#D6A24A] hover:bg-[#FFF1D6]';
              } else {
                palette =
                  'border-[#3A1E2A]/15 text-[#5A3645] bg-white hover:border-[#C24E6E] hover:text-[#C24E6E]';
              }
              return (
                <button
                  key={e.name}
                  onClick={() => pickEmotion(e.name)}
                  title={e.note}
                  className={`font-serif italic text-[11.5px] px-2.5 py-0.5 border rounded-full transition-colors cursor-pointer ${palette}`}
                >
                  {cessation && !sel ? '⏸ ' : ''}
                  {e.name}
                </button>
              );
            })}
          </div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#5A3645] font-semibold">
            Routing ·{' '}
            <span className="font-serif italic text-[11px] text-[#5A3645] normal-case tracking-normal font-normal">
              {place.routeNote}
            </span>
          </p>
          {emotion?.note && (
            <p
              className={`text-[11.5px] font-serif italic leading-relaxed flex items-start gap-1.5 ${
                emotion.cessation ? 'text-[#8B6914]' : 'text-[#5A3645]'
              }`}
            >
              {emotion.cessation && (
                <span aria-hidden className="not-italic">
                  ⏸
                </span>
              )}
              <span>{emotion.note}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
