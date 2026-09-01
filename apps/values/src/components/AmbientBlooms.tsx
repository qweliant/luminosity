import { useEffect, useState } from "react";
import { BloomFlower } from "./bloom";

// Decorative blooms scattered down the page gutters. Tied to the document
// height so the field grows with the content. Updates are throttled with rAF
// because we'd otherwise observe document.body and refire on every keystroke.

const PETALS = ["#F4ABBC", "#FBD9E0", "#F7D679", "#9CD3B6", "#E07A95"];
const STRIDE_PX = 300;

export const AmbientBlooms = () => {
  const [pageHeight, setPageHeight] = useState(2000);

  useEffect(() => {
    const container = document.documentElement;
    let rafId: number | null = null;
    let lastHeight = pageHeight;

    const measure = () => {
      rafId = null;
      const next = Math.max(container.scrollHeight, window.innerHeight);
      // Snap to the stride so subpixel reflows during typing don't churn
      // through React renders for visually-identical bloom counts.
      const snapped = Math.ceil(next / STRIDE_PX) * STRIDE_PX;
      if (snapped !== lastHeight) {
        lastHeight = snapped;
        setPageHeight(snapped);
      }
    };

    const schedule = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(measure);
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
      className="absolute inset-x-0 top-0 pointer-events-none print:hidden z-0"
    >
      <style>{`
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(4deg); }
        }
        .ambient-bloom {
          animation: gentleFloat 7s ease-in-out infinite;
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => {
        const r1 = Math.abs(Math.sin(i + 1));
        const r2 = Math.abs(Math.cos(i + 1));
        const r3 = Math.abs(Math.sin((i + 1) * 2));

        const isLeft = i % 2 === 0;
        const gutterPos = isLeft ? -30 + r1 * 40 : -20 + r1 * 30;
        const topPos = 150 + i * STRIDE_PX + r2 * 100;
        const size = 45 + Math.floor(r3 * 50);
        const petal = PETALS[i % PETALS.length];
        const delay = (r1 * 5).toFixed(1);

        if (topPos > pageHeight - 150) return null;

        return (
          <div
            key={i}
            className="absolute opacity-50 ambient-bloom"
            style={{
              top: `${topPos}px`,
              [isLeft ? "left" : "right"]: `${gutterPos}px`,
              animationDelay: `${delay}s`,
            }}
          >
            <BloomFlower size={size} petal={petal} smile={false} />
          </div>
        );
      })}
    </div>
  );
};
