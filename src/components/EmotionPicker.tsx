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

export const EmotionPicker = ({ entry, onChange, variant = 'compact' }: Props) => {
  const cluster = entry.emotionCluster;
  const place = cluster ? EMOTION_PLACES_BY_ID[cluster] : undefined;
  const emotion = findEmotion(cluster, entry.emotion);
  const isFocus = variant === 'focus';

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
      <p className={`text-[11px] text-pink-700 ${isFocus ? 'mb-2' : 'mb-1'}`}>
        Where's the friction coming from? Pick the closest match — you can change it later.{' '}
        <span className="italic text-pink-500">Atlas of the Heart</span>
      </p>

      <div className="flex flex-wrap gap-1.5">
        {EMOTION_PLACES.map(p => {
          const sel = cluster === p.id;
          return (
            <button
              key={p.id}
              onClick={() => pickCluster(p.id)}
              title={p.blurb}
              className={`${isFocus ? 'text-[12px] px-3 py-1' : 'text-[11px] px-2.5 py-1'} border rounded-full transition-colors ${
                sel
                  ? 'border-sky-300 text-black-700 bg-sky-50'
                  : 'border-gray-200 text-pink-600 hover:border-sky-200 hover:text-black-500'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {place && (
        <div className="pl-3 border-l border-sky-100 space-y-2">
          <p className="text-[11px] italic text-pink-500">{place.blurb}</p>
          <div className="flex flex-wrap gap-1">
            {place.emotions.map(e => {
              const sel = entry.emotion === e.name;
              const cessation = !!e.cessation;
              return (
                <button
                  key={e.name}
                  onClick={() => pickEmotion(e.name)}
                  title={e.note}
                  className={`text-[11px] px-2 py-0.5 border rounded-full transition-colors ${
                    sel
                      ? cessation
                        ? 'border-amber-400 text-amber-800 bg-amber-50'
                        : 'border-sky-300 text-black-700 bg-sky-50'
                      : 'border-gray-200 text-pink-500 hover:border-sky-200 hover:text-black-500'
                  }`}
                >
                  {e.name}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-pink-700">
            Routing · <span className="text-pink-500 normal-case tracking-normal italic">{place.routeNote}</span>
          </p>
          {emotion?.note && (
            <p
              className={`text-[11px] italic leading-relaxed ${
                emotion.cessation ? 'text-amber-800' : 'text-pink-600'
              }`}
            >
              {emotion.cessation ? '⚠ ' : ''}
              {emotion.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
