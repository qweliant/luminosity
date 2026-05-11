import React from "react";
import type { Mapping } from "../types";
import { EMOTION_PLACES_BY_ID, findEmotion } from "../data";

// --- Ink-Optimized Print Accessories --------------------------------------

const PrintFlower = ({ size = 12, petal = "#E07A95" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className="inline-block align-middle overflow-visible"
  >
    {Array.from({ length: 5 }).map((_, i) => (
      <path
        key={i}
        d="M50 50 C 28 38, 22 12, 50 4 C 78 12, 72 38, 50 50 Z"
        fill={petal}
        opacity="0.95"
        stroke="#C24E6E"
        strokeWidth="1"
        transform={`rotate(${(i * 360) / 5} 50 50)`}
      />
    ))}
    <circle cx="50" cy="50" r="9" fill="#C24E6E" />
    <circle cx="50" cy="50" r="3" fill="#FFFFFF" />
  </svg>
);

const PrintBrakeMark = ({ size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className="inline-block align-middle"
  >
    {[0, 72, 144, 216].map((a, i) => (
      <path
        key={i}
        d="M50 50 C 28 38, 22 12, 50 4 C 78 12, 72 38, 50 50 Z"
        fill="#B391A0"
        opacity="0.4"
        transform={`rotate(${a} 50 50)`}
      />
    ))}
    <circle cx="50" cy="50" r="9" fill="#5A3645" />
  </svg>
);

// --- Lightweight String Parser --------------------------------------------
const parseNeedForPrint = (raw: string) => {
  if (!raw)
    return {
      core: "",
      reframe: "",
      prototype: "",
      accelerators: "",
      brakes: "",
    };

  let current = raw;

  let brakes = "";
  const bMatch = current.match(/Brakes to watch:\s*/i);
  if (bMatch && bMatch.index !== undefined) {
    brakes = current.slice(bMatch.index + bMatch[0].length).trim();
    current = current.slice(0, bMatch.index).trim();
  }

  let accelerators = "";
  const aMatch = current.match(/Accelerators:\s*/i);
  if (aMatch && aMatch.index !== undefined) {
    accelerators = current.slice(aMatch.index + aMatch[0].length).trim();
    current = current.slice(0, aMatch.index).trim();
  }

  let prototype = "";
  const pMatch = current.match(/Prototype\s*(\([^)]*\))?:\s*/i);
  if (pMatch && pMatch.index !== undefined) {
    prototype = current.slice(pMatch.index + pMatch[0].length).trim();
    current = current.slice(0, pMatch.index).trim();
  }

  let reframe = "";
  const rMatch = current.match(/Reframe:\s*/i);
  if (rMatch && rMatch.index !== undefined) {
    reframe = current.slice(rMatch.index + rMatch[0].length).trim();
    current = current.slice(0, rMatch.index).trim();
  }

  return {
    core: current.trim(),
    reframe,
    prototype,
    accelerators,
    brakes,
  };
};

// --- COMPONENT ROOT -------------------------------------------------------

export const PrintLedger = ({ entries }: { entries: Mapping[] }) => {
  // Filter out completely blank unmapped rows from the print artifact
  const activeEntries = entries.filter(
    (e) => e.value.trim() || e.need.trim() || e.friction.trim(),
  );

  // Notebook metrics derivations
  const countTotal = activeEntries.length;
  const countStuck = activeEntries.filter((e) => e.workability === 1).length;
  const countMixed = activeEntries.filter(
    (e) => e.workability === 2 || e.workability === 3,
  ).length;
  const countWorking = activeEntries.filter(
    (e) => e.workability === 4 || e.workability === 5,
  ).length;
  const activeLensesCount = activeEntries.reduce((acc, e) => {
    let c = 0;
    if (e.workability) c++;
    if (e.emotionCluster) c++;
    if (e.coreNeed) c++;
    if (e.lifeDesign?.problemFrame) c++;
    if (e.accelerators?.trim()) c++;
    if (e.relational?.active) c++;
    return acc + c;
  }, 0);

  // Generate clean current date string
  const printDate = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="hidden print:block w-full bg-white text-[#3A1E2A] font-sans pt-0">
      {/* Document Header */}
      <div className="flex justify-between items-end border-b-2 border-[#3A1E2A] pb-4 mb-6">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-normal tracking-[-0.01em] text-[#3A1E2A]">
              Luminosity
            </span>
            <span className="font-serif italic text-sm text-[#B391A0]">
              devotional ledger
            </span>
          </div>
          <p className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#5A3645] mt-1 m-0">
            Private Wayfinding Manifesto · Generated strictly for personal
            review
          </p>
        </div>

        <div className="text-right font-mono text-[10px] text-[#5A3645] tracking-wider uppercase">
          {printDate}
        </div>
      </div>

      {/* Overview Health Metrics Band */}
      <div className="grid grid-cols-5 gap-4 py-3 px-4 border border-[#3A1E2A]/20 rounded-lg mb-8 bg-[#FAF8F6]">
        <div>
          <div className="font-mono text-[8px] text-[#B391A0] tracking-[0.16em] uppercase font-bold">
            Mapped Values
          </div>
          <div className="font-serif text-lg text-[#3A1E2A] mt-0.5">
            {countTotal}
          </div>
        </div>
        <div>
          <div className="font-mono text-[8px] text-[#B391A0] tracking-[0.16em] uppercase font-bold">
            Stuck (1/5)
          </div>
          <div className="font-serif text-lg text-[#C24E6E] mt-0.5">
            {countStuck}
          </div>
        </div>
        <div>
          <div className="font-mono text-[8px] text-[#B391A0] tracking-[0.16em] uppercase font-bold">
            Mixed (2-3/5)
          </div>
          <div className="font-serif text-lg text-[#5A3645] mt-0.5">
            {countMixed}
          </div>
        </div>
        <div>
          <div className="font-mono text-[8px] text-[#B391A0] tracking-[0.16em] uppercase font-bold">
            Thriving (4-5/5)
          </div>
          <div className="font-serif text-lg text-[#3A1E2A] mt-0.5">
            {countWorking}
          </div>
        </div>
        <div className="border-l border-[#3A1E2A]/10 pl-3">
          <div className="font-mono text-[8px] text-[#B391A0] tracking-[0.16em] uppercase font-bold">
            Lenses Deployed
          </div>
          <div className="font-serif text-lg text-[#3A1E2A] mt-0.5">
            {activeLensesCount}
          </div>
        </div>
      </div>

      {/* Main Intact Ledger Loop */}
      <div className="space-y-8">
        {activeEntries.map((e) => {
          const parsed = parseNeedForPrint(e.need);
          const servesDriver = e.coreNeed
            ? e.coreNeed.toLowerCase()
            : "unmapped driver";
          const hasNvc = e.nvcNeeds && e.nvcNeeds.length > 0;

          // Pull emotional granularity detail safely
          const place = e.emotionCluster
            ? EMOTION_PLACES_BY_ID[e.emotionCluster]
            : null;
          const emo = e.emotionCluster
            ? findEmotion(e.emotionCluster, e.emotion)
            : null;
          const cessation = !!emo?.cessation;

          // Process Relational Debugger state
          const r = e.relational;
          const checks = r
            ? [r.focusSelf, r.intentValue, r.isRequest, r.preservesAutonomy]
            : [];
          const boundaryPassed = checks.filter((c) => c === true).length;
          const isInterpersonal = r?.active;

          return (
            /* print:break-inside-avoid absolutely prevents cards from slicing across page breaks */
            <div
              key={e.id}
              className="print:break-inside-avoid pb-6 border-b border-dashed border-[#3A1E2A]/20 last:border-b-0"
            >
              {/* Value Header Row */}
              <div className="flex justify-between items-baseline gap-4 mb-2">
                <div className="flex items-baseline gap-2">
                  <PrintFlower
                    size={14}
                    petal={
                      e.workability && e.workability >= 4
                        ? "#3A1E2A"
                        : "#E07A95"
                    }
                  />
                  <h3 className="font-serif text-xl font-normal text-[#3A1E2A] m-0 tracking-[-0.005em]">
                    {e.value || (
                      <span className="italic text-[#B391A0]">
                        Untitled Value
                      </span>
                    )}
                  </h3>

                  {e.workability ? (
                    <span className="font-mono text-[9px] text-[#5A3645] ml-2 tracking-wider bg-[#FAF8F6] px-2 py-0.5 border border-[#3A1E2A]/10 rounded">
                      workability {e.workability}/5
                    </span>
                  ) : null}
                </div>

                <div className="font-mono text-[9px] text-[#C24E6E] tracking-widest uppercase font-bold">
                  serves {servesDriver}
                </div>
              </div>

              {/* Top Level Metadata & Granularity Indicators */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-[10px] font-mono text-[#5A3645]">
                {e.emotionCluster && place && (
                  <div>
                    <span className="text-[#B391A0]">Atlas:</span>{" "}
                    {cessation ? "⚠️ Halt Input · " : ""}
                    <strong className="font-bold">
                      {e.emotion
                        ? `${e.emotion.toLowerCase()}`
                        : place.label.toLowerCase()}
                    </strong>
                  </div>
                )}

                {isInterpersonal && (
                  <div>
                    <span className="text-[#B391A0]">Interpersonal:</span>{" "}
                    <strong
                      className={
                        boundaryPassed === 4
                          ? "text-[#3A1E2A]"
                          : "text-[#C24E6E]"
                      }
                    >
                      {boundaryPassed === 4
                        ? "Clean Boundary (4/4 passed)"
                        : `Unvetted Rule (${boundaryPassed}/4 passed)`}
                    </strong>
                  </div>
                )}

                {e.lifeDesign?.problemFrame && (
                  <div>
                    <span className="text-[#B391A0]">Problem:</span>{" "}
                    {e.lifeDesign.problemFrame}
                  </div>
                )}
              </div>

              {/* Main Document Grid: Left side Friction, Right side Need Manifesto */}
              <div className="grid grid-cols-[200px_1fr] gap-6 items-start mt-2 border-l-2 border-[#3A1E2A]/10 pl-3">
                {/* Friction Column */}
                <div>
                  <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#B391A0] font-bold mb-1">
                    Friction Manifesting
                  </div>
                  <p className="text-xs text-[#5A3645] leading-relaxed m-0 whitespace-pre-wrap font-sans">
                    {e.friction || "—"}
                  </p>
                </div>

                {/* Need Manifesto & Labeled Sections Column */}
                <div className="space-y-3">
                  <div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-1">
                      Non-Negotiable Condition (Need)
                    </div>
                    <p className="font-serif italic text-sm text-[#3A1E2A] leading-relaxed m-0 whitespace-pre-wrap">
                      {parsed.core || e.need || "—"}
                    </p>

                    {/* NVC tags array */}
                    {hasNvc && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {e.nvcNeeds!.map((n) => (
                          <span
                            key={n}
                            className="font-sans text-[9px] text-[#5A3645] bg-[#FAF8F6] border border-[#3A1E2A]/10 px-2 py-0.5 rounded"
                          >
                            · {n}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Render Parsed Reframe & Prototype if extracted or saved */}
                  {(parsed.reframe ||
                    e.lifeDesign?.reframeNote ||
                    parsed.prototype ||
                    e.lifeDesign?.prototype?.action) && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#3A1E2A]/5 text-xs">
                      {(parsed.reframe || e.lifeDesign?.reframeNote) && (
                        <div>
                          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#5A3645] font-bold block mb-0.5">
                            ↺ Reframe Strategy
                          </span>
                          <p className="m-0 leading-snug text-[#3A1E2A] whitespace-pre-wrap">
                            {parsed.reframe || e.lifeDesign?.reframeNote}
                          </p>
                        </div>
                      )}

                      {(parsed.prototype ||
                        e.lifeDesign?.prototype?.action) && (
                        <div>
                          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#3A1E2A] font-bold block mb-0.5">
                            ◆ Prototype Experiment
                          </span>
                          <p className="m-0 leading-snug text-[#3A1E2A] whitespace-pre-wrap">
                            {parsed.prototype ||
                              e.lifeDesign?.prototype?.action}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render Parsed Accelerators & Brakes if extracted or saved */}
                  {(parsed.accelerators ||
                    e.accelerators ||
                    parsed.brakes ||
                    e.brakes) && (
                    <div className="grid grid-cols-2 gap-4 pt-1.5 text-[11px] font-mono">
                      {(parsed.accelerators || e.accelerators) && (
                        <div>
                          <span className="text-[8px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold block mb-0.5 font-sans">
                            ✿ Accelerators
                          </span>
                          <span className="text-[#5A3645] block leading-snug">
                            {parsed.accelerators || e.accelerators}
                          </span>
                        </div>
                      )}

                      {(parsed.brakes || e.brakes) && (
                        <div>
                          <span className="text-[8px] uppercase tracking-[0.18em] text-[#5A3645] font-bold block mb-0.5 font-sans flex items-center gap-1">
                            <PrintBrakeMark size={8} /> Brakes to watch
                          </span>
                          <span className="text-[#B391A0] block leading-snug">
                            {parsed.brakes || e.brakes}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Formal Document Footer */}
      <div className="mt-12 pt-4 border-t border-[#3A1E2A]/20 text-center font-serif italic text-xs text-[#B391A0] print:break-inside-avoid">
        ✿ end of active mapping ledger · designed strictly for private
        contemplation ✿
      </div>
    </div>
  );
};
