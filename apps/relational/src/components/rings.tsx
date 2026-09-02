// This app's mark and its ambient decoration. Same family as the values
// ledger's blooms — warm, hand-drawn, unhurried — but its own species: two
// rings that overlap, which is the whole subject.

import React, { useEffect, useState } from 'react';

export const RingPair = ({
  size = 28,
  mine = '#D97706',
  theirs = '#DD7A98',
  stroke = 0.1,
}: {
  size?: number;
  mine?: string;
  theirs?: string;
  stroke?: number;
}) => (
  <svg
    width={size}
    height={size * 0.7}
    viewBox="0 0 100 70"
    className="inline-block overflow-visible align-middle"
    aria-hidden="true"
  >
    <circle cx="62" cy="35" r="26" fill="none" stroke={theirs} strokeWidth={100 * stroke} />
    <circle cx="38" cy="35" r="26" fill="none" stroke={mine} strokeWidth={100 * stroke} />
  </svg>
);

const TINTS = ['#F4ABBC', '#FBD9E0', '#F7D679', '#9CD3B6', '#E07A95'];
const STRIDE_PX = 320;

/**
 * Rings drifting down the gutters, tied to document height so the field grows
 * with the content. Measurement is throttled through rAF and snapped to the
 * stride, so typing doesn't churn React renders for a visually identical
 * number of rings.
 */
export const AmbientRings = () => {
  const [pageHeight, setPageHeight] = useState(2000);

  useEffect(() => {
    let rafId: number | null = null;
    let last = 0;

    const measure = () => {
      rafId = null;
      const next = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      const snapped = Math.ceil(next / STRIDE_PX) * STRIDE_PX;
      if (snapped !== last) {
        last = snapped;
        setPageHeight(snapped);
      }
    };
    const schedule = () => {
      if (rafId === null) rafId = requestAnimationFrame(measure);
    };

    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const count = Math.floor(pageHeight / STRIDE_PX);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-0 print:hidden"
    >
      <style>{`
        @keyframes ringDrift {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(-5deg); }
        }
        .ambient-ring { animation: ringDrift 9s ease-in-out infinite; }
      `}</style>
      {Array.from({ length: count }).map((_, i) => {
        const r1 = Math.abs(Math.sin(i + 1));
        const r2 = Math.abs(Math.cos(i + 1));
        const r3 = Math.abs(Math.sin((i + 1) * 2));
        const isLeft = i % 2 === 0;
        const top = 180 + i * STRIDE_PX + r2 * 110;
        if (top > pageHeight - 160) return null;
        return (
          <div
            key={i}
            className="ambient-ring absolute opacity-40"
            style={{
              top: `${top}px`,
              [isLeft ? 'left' : 'right']: `${-34 + r1 * 44}px`,
              animationDelay: `${(r1 * 6).toFixed(1)}s`,
            }}
          >
            <RingPair
              size={60 + Math.floor(r3 * 55)}
              mine={TINTS[i % TINTS.length]}
              theirs={TINTS[(i + 2) % TINTS.length]}
              stroke={0.055}
            />
          </div>
        );
      })}
    </div>
  );
};
