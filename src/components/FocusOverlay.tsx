import React, { useEffect, useState } from "react";
import type { Mapping, Part } from "../types";
import { CORE_NEEDS, CORE_NEEDS_DETAIL, NVC_CATEGORIES } from "../data";
import { deriveNeed, isCessationState, lensCompletion, maslowHighest, sdtProfile } from "../derive";
import { LifeDesignSection } from "./LifeDesignSection";
import { RelationalSection } from "./RelationalSection";
import { EmotionPicker } from "./EmotionPicker";
import { PartSelector } from "./PartSelector";

const FOCUS_STEPS = [
  "Diagnose",
  "Locate",
  "Anchor",
  "Reframe",
  "Contextualize",
  "Synthesize",
];
const FOCUS_PROMPTS = [
  "How well is your current environment serving this value, and what is in the way?",
  "What's starving underneath the friction? Tag what's missing.",
  "Which fundamental driver does this value serve?",
  "Where does this value live in your engagement and energy? Frame the problem and design a prototype.",
  "Which contexts accelerate this value, and which brake it?",
  "Compose all of the above into a single Need sentence.",
];

// --- Bloom C+ SVG Primitives & Mascots ------------------------------------

const BloomFlower = ({
  size = 20,
  petal = "#E07A95",
  eye = "#3A1E2A",
  smile = true,
}) => (
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
        strokeOpacity="0.2"
        transform={`rotate(${(i * 360) / 5} 50 50)`}
      />
    ))}
    <circle cx="50" cy="50" r="9" fill="#C24E6E" opacity="0.9" />
    <circle cx="50" cy="50" r="3" fill="#F7D679" />
    {smile && (
      <g>
        <circle cx="44" cy="48" r="1.6" fill={eye} />
        <circle cx="52" cy="48" r="1.6" fill={eye} />
        <path
          d="M44 53 Q48 56 52 53"
          stroke="#3A1E2A"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    )}
  </svg>
);

const LumiBean = ({ size = 70 }) => (
  <svg
    width={size}
    height={size * 1.15}
    viewBox="-10 -15 120 130"
    className="overflow-visible inline-block"
  >
    <ellipse cx="50" cy="108" rx="24" ry="3" fill="#3A1E2A" opacity="0.10" />
    <ellipse
      cx="50"
      cy="58"
      rx="32"
      ry="36"
      fill="#FFF5DC"
      stroke="#3A1E2A"
      strokeWidth="2"
    />
    <ellipse cx="50" cy="74" rx="20" ry="14" fill="#FFFDF6" opacity="0.7" />
    <g transform="translate(76 22) rotate(18)">
      <BloomFlower size={34} petal="#C24E6E" smile={false} />
    </g>
    <path
      d="M82 38 Q90 36 92 28 Q86 30 82 38 Z"
      fill="#9CD3B6"
      stroke="#3A1E2A"
      strokeWidth="1"
      strokeOpacity="0.4"
    />
    <ellipse cx="30" cy="66" rx="6.5" ry="4" fill="#E07A95" opacity="0.75" />
    <ellipse cx="70" cy="66" rx="6.5" ry="4" fill="#E07A95" opacity="0.75" />
    <ellipse cx="40" cy="56" rx="3" ry="4" fill="#3A1E2A" />
    <ellipse cx="60" cy="56" rx="3" ry="4" fill="#3A1E2A" />
    <circle cx="41.2" cy="54.5" r="0.9" fill="#fff" />
    <circle cx="61.2" cy="54.5" r="0.9" fill="#fff" />
    <path
      d="M42 71 Q50 77 58 71"
      stroke="#3A1E2A"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="38" cy="96" rx="7" ry="3" fill="#3A1E2A" />
    <ellipse cx="62" cy="96" rx="7" ry="3" fill="#3A1E2A" />
  </svg>
);

const CloudFriend = ({ size = 60 }) => (
  <svg
    width={size}
    height={size * 0.7}
    viewBox="0 0 100 70"
    className="inline-block align-middle overflow-visible"
  >
    <g stroke="#3A1E2A" strokeWidth="2" fill="#FFFFFF">
      <circle cx="30" cy="40" r="20" />
      <circle cx="55" cy="32" r="22" />
      <circle cx="78" cy="42" r="18" />
      <rect
        x="20"
        y="40"
        width="68"
        height="20"
        rx="10"
        fill="#FFFFFF"
        stroke="none"
      />
      <line x1="20" y1="60" x2="88" y2="60" stroke="#3A1E2A" strokeWidth="2" />
    </g>
    <ellipse cx="44" cy="40" rx="2.5" ry="3.2" fill="#3A1E2A" />
    <ellipse cx="64" cy="40" rx="2.5" ry="3.2" fill="#3A1E2A" />
    <path
      d="M48 50 Q54 53 60 50"
      stroke="#3A1E2A"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="38" cy="48" rx="4" ry="2" fill="#E07A95" opacity="0.6" />
    <ellipse cx="68" cy="48" rx="4" ry="2" fill="#E07A95" opacity="0.6" />
  </svg>
);

const BloomWorkabilityInput = ({
  value = 0,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => (
  <span className="inline-flex gap-2 items-center bg-[#FAE6E1]/50 px-3 py-1.5 rounded-full border border-[#3A1E2A]/5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(value === n ? 0 : n)}
        className="focus:outline-none hover:scale-110 transition-transform cursor-pointer p-0.5"
        title={`Rate workability ${n}/5`}
      >
        <BloomFlower
          size={22}
          petal={n <= value ? "#E07A95" : "#FBD9E0"}
          eye={n <= value ? "#3A1E2A" : "#B391A0"}
          smile={n <= value}
        />
      </button>
    ))}
  </span>
);

// --- COMPONENT ROOT -------------------------------------------------------

export const FocusOverlay = ({
  entry,
  parts,
  onUpsertPart,
  onChange,
  onToggleNvc,
  onClose,
}: {
  entry: Mapping;
  parts: Part[];
  onUpsertPart: (name: string) => string | null;
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
      const inField =
        t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && !inField)
        setStep((s) => Math.min(total, s + 1));
      else if (e.key === "ArrowLeft" && !inField)
        setStep((s) => Math.max(1, s - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, total]);

  return (
    <div className="fixed inset-0 bg-[#FDF4F0] z-50 overflow-y-auto print:hidden animate-in fade-in duration-300 select-none">
      {/* Ambient custom background flowers */}
      <div
        aria-hidden="true"
        className="absolute right-[-30px] top-[-30px] opacity-60 pointer-events-none"
      >
        <BloomFlower size={160} petal="#F4ABBC" smile={false} />
      </div>
      <div
        aria-hidden="true"
        className="absolute left-[-40px] bottom-[-40px] opacity-40 pointer-events-none"
      >
        <BloomFlower size={180} petal="#FBD9E0" smile={false} />
      </div>

      <div className="max-w-2xl mx-auto py-8 sm:py-14 px-6 min-h-screen flex flex-col relative z-10">
        {/* Header Block */}
        <header className="flex justify-between items-start mb-8 gap-4 border-b border-dashed border-[#3A1E2A]/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BloomFlower size={14} petal="#C24E6E" smile={false} />
              <p className="text-[9.5px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold">
                Focus mode
              </p>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif italic text-[#3A1E2A] leading-tight select-text tracking-[-0.01em]">
              {entry.value || (
                <em className="text-[#B391A0]/60">untitled value</em>
              )}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-[#B391A0] hover:text-[#C24E6E] text-2xl font-light p-1 cursor-pointer transition-colors"
            title="Drop focus (Esc)"
            aria-label="Close focus overlay"
          >
            ×
          </button>
        </header>

        {/* Dynamic Devotional Progress Strip */}
        <div className="mb-8 bg-white p-4 rounded-[18px] border border-[#3A1E2A]/10 shadow-xs">
          <div className="flex justify-between items-baseline mb-2">
            <p className="font-mono text-[9.5px] text-[#5A3645] uppercase tracking-wider font-bold">
              Step {step} of {total} ·{" "}
              <span className="text-[#C24E6E]">{FOCUS_STEPS[step - 1]}</span>
            </p>
            <p className="font-mono text-[9.5px] text-[#B391A0] uppercase tracking-wider">
              {completion.filled} of {completion.total} mapped
            </p>
          </div>

          {/* Custom Flower Progress Bar */}
          <div className="flex items-center justify-between gap-1 pt-2 border-t border-[#3A1E2A]/5">
            {FOCUS_STEPS.map((name, i) => {
              const reached = i + 1 <= step;
              const stepFilled = completion.steps[i];
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setStep(i + 1)}
                  className="flex-1 flex flex-col items-center gap-1 group focus:outline-none cursor-pointer"
                  title={`Jump to step ${i + 1}: ${name}`}
                >
                  <BloomFlower
                    size={reached ? 18 : 14}
                    petal={
                      reached
                        ? stepFilled
                          ? "#C24E6E"
                          : "#E07A95"
                        : stepFilled
                          ? "#FBD9E0"
                          : "#FAE6E1"
                    }
                    smile={stepFilled}
                  />
                  <span
                    className={`text-[8px] font-mono uppercase tracking-tighter block mt-0.5 transition-colors ${reached ? "text-[#3A1E2A] font-bold" : "text-[#B391A0]/60"}`}
                  >
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Embedded Mascot Prompt Panel */}
        <div className="mb-8 p-4 bg-[#FAE6E1]/40 rounded-xl border border-dashed border-[#3A1E2A]/10 flex items-start gap-4">
          <div className="shrink-0 pt-1">
            <LumiBean size={48} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-[#5A3645] font-mono font-bold mb-0.5">
              Prompt
            </p>
            <p className="text-sm text-[#3A1E2A] leading-relaxed italic font-serif select-text">
              "{FOCUS_PROMPTS[step - 1]}"
            </p>
          </div>
        </div>

        {/* Main Step Input Routing Canvas */}
        <div className="flex-1 pb-4">
          <FocusStep
            step={step}
            entry={entry}
            parts={parts}
            onUpsertPart={onUpsertPart}
            onChange={onChange}
            onToggleNvc={onToggleNvc}
          />
        </div>

        {/* Wizard Actions Footer */}
        <footer className="flex justify-between items-center pt-6 mt-6 border-t border-dashed border-[#3A1E2A]/10 gap-4 bg-[#FDF4F0]">
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(total, s + 1))}
            className="font-sans text-xs text-[#5A3645] hover:underline px-2 py-1 font-medium cursor-pointer"
            disabled={step === total}
          >
            Skip step
          </button>

          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="px-4 py-2 rounded-full font-sans text-xs text-[#5A3645] border border-[#3A1E2A]/10 hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
            >
              ← Prev
            </button>

            {step < total ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="bg-[#C24E6E] text-white px-5 py-2 rounded-full font-sans text-xs font-medium hover:bg-[#3A1E2A] transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
              >
                <span>Next step</span> →
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="bg-[#3A1E2A] text-white px-6 py-2 rounded-full font-sans text-xs font-bold hover:bg-[#C24E6E] transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1"
              >
                <BloomFlower
                  size={12}
                  petal="#FFFFFF"
                  eye="#3A1E2A"
                  smile={false}
                />
                <span>Finish Focus</span>
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

// --- DYNAMIC STEP CANVAS PRIMITIVES ---------------------------------------

const FocusStep = ({
  step,
  entry,
  parts,
  onUpsertPart,
  onChange,
  onToggleNvc,
}: {
  step: number;
  entry: Mapping;
  parts: Part[];
  onUpsertPart: (name: string) => string | null;
  onChange: (patch: Partial<Mapping>) => void;
  onToggleNvc: (n: string) => void;
}) => {
  // STEP 1: Diagnose (Workability + Friction + Atlas Granularity)
  if (step === 1) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200 select-none">
        <div className="bg-white p-4 rounded-xl border border-[#3A1E2A]/5">
          <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-2">
            1. Current Workability
          </p>
          <div className="flex gap-4 items-center">
            <BloomWorkabilityInput
              value={entry.workability ?? 0}
              onChange={(n) => onChange({ workability: n })}
            />
            <span className="font-mono text-xs text-[#5A3645] uppercase tracking-widest font-bold">
              {entry.workability
                ? entry.workability <= 2
                  ? "stuck ✿"
                  : entry.workability === 3
                    ? "mixed ✿"
                    : "working ✨"
                : "unrated"}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#3A1E2A]/5">
          <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#5A3645] font-bold mb-2">
            2. Surface Friction
          </p>
          <textarea
            autoFocus
            rows={4}
            className="w-full bg-transparent focus:outline-none font-serif italic text-base sm:text-lg text-[#3A1E2A] leading-relaxed resize-none placeholder:text-[#B391A0]/40 p-1 select-text custom-scrollbar"
            value={entry.friction}
            onChange={(e) => onChange({ friction: e.target.value })}
            placeholder="Describe exactly what feels exhausting, sticky, or blocked right now..."
          />
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#3A1E2A]/5">
          <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-2">
            3. Atlas of the Heart · Clarify Neighbor
          </p>
          <EmotionPicker entry={entry} onChange={onChange} variant="focus" />
        </div>
      </div>
    );
  }

  // STEP 2: Locate (NVC Universal Needs Vocabulary)
  if (step === 2) {
    return (
      <div className="space-y-4 bg-white p-6 rounded-[18px] border border-[#3A1E2A]/5 animate-in fade-in duration-200">
        {NVC_CATEGORIES.map((cat) => (
          <div
            key={cat.name}
            className="flex items-baseline gap-3 flex-wrap sm:flex-nowrap pt-3 border-t border-dashed border-[#3A1E2A]/5 first:border-t-0 first:pt-0"
          >
            <div className="text-[9.5px] uppercase tracking-[0.2em] text-[#5A3645] font-bold w-full sm:w-28 sm:shrink-0">
              {cat.name}
            </div>
            <div className="flex flex-wrap gap-2">
              {cat.needs.map((n) => {
                const sel = entry.nvcNeeds?.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onToggleNvc(n)}
                    className={`font-serif italic text-xs px-3 py-1 rounded-full border transition-all cursor-pointer ${
                      sel
                        ? "border-[#C24E6E] text-white bg-[#C24E6E] shadow-2xs font-normal not-italic font-sans py-1.5 font-medium"
                        : "border-[#3A1E2A]/10 text-[#3A1E2A] bg-white hover:border-[#E07A95] hover:text-[#C24E6E]"
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

  // STEP 3: Anchor (Robbins 6 Core Drivers) + IFS Part identity
  if (step === 3) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="space-y-3">
          {CORE_NEEDS.map((n) => {
            const sel = entry.coreNeed === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ coreNeed: sel ? "" : n })}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  sel
                    ? "border-[#C24E6E] bg-[#FBD9E0]/30 shadow-2xs"
                    : "border-[#3A1E2A]/10 bg-white hover:border-[#E07A95]"
                }`}
              >
                <div>
                  <div
                    className={`text-lg font-serif tracking-[-0.01em] ${sel ? "text-[#C24E6E] font-medium" : "text-[#3A1E2A]"}`}
                  >
                    {n}
                  </div>
                  <div className="text-xs text-[#B391A0] mt-0.5 leading-snug">
                    {CORE_NEEDS_DETAIL[n]}
                  </div>
                </div>

                {sel && (
                  <span className="shrink-0 bg-[#C24E6E] text-white p-1 rounded-full">
                    <BloomFlower
                      size={14}
                      petal="#FFFFFF"
                      eye="#C24E6E"
                      smile={false}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {(() => {
          const sdt = sdtProfile(entry);
          const maslow = maslowHighest(entry);
          const sdtTotal = sdt.autonomy + sdt.competence + sdt.relatedness;
          if (sdtTotal === 0 && !maslow) return null;
          const dot = (n: number) =>
            "●".repeat(Math.min(n, 3)) + "○".repeat(Math.max(0, 3 - Math.min(n, 3)));
          return (
            <div className="flex flex-wrap items-center gap-3 bg-[#FAE6E1]/50 rounded-xl px-3.5 py-2.5">
              {sdtTotal > 0 && (
                <>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#5A3645] font-semibold">
                    SDT
                  </span>
                  <span className="font-mono text-[10.5px] text-[#5A3645]">
                    autonomy <span className="text-[#C24E6E]">{dot(sdt.autonomy)}</span>{" "}
                    · competence{" "}
                    <span className="text-[#C24E6E]">{dot(sdt.competence)}</span> ·
                    relatedness{" "}
                    <span className="text-[#C24E6E]">{dot(sdt.relatedness)}</span>
                  </span>
                </>
              )}
              {maslow && (
                <span className="ml-auto font-mono text-[10px] text-[#B391A0]">
                  Maslow · <span className="text-[#5A3645]">{maslow}</span>
                </span>
              )}
            </div>
          );
        })()}

        <div className="bg-white border border-[#3A1E2A]/5 rounded-xl p-4">
          <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
            <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold m-0 flex items-center gap-1">
              <BloomFlower size={12} petal="#E07A95" smile={false} /> Part · IFS
            </p>
            <a
              href="#/parts"
              className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold hover:underline"
            >
              see all parts →
            </a>
          </div>
          <p className="text-xs italic text-[#B391A0] mb-3 leading-snug">
            Which named identity is acting here? Type a name (e.g. "The People
            Pleaser") to create it, or pick one you've named before.
          </p>
          <PartSelector
            parts={parts}
            selectedId={entry.partId}
            onSelect={(name) => {
              const id = onUpsertPart(name);
              onChange({ partId: id ?? undefined });
            }}
            onClear={() => onChange({ partId: undefined })}
          />
        </div>
      </div>
    );
  }

  // STEP 4: Reframe (Stanford Life Design Tools)
  if (step === 4) {
    return (
      <div className="animate-in fade-in duration-200 bg-white p-6 rounded-[18px] border border-[#3A1E2A]/5">
        <LifeDesignSection
          ld={entry.lifeDesign}
          onChange={(next) => onChange({ lifeDesign: next })}
          variant="focus"
        />
      </div>
    );
  }

  // STEP 5: Contextualize (Nagoski Contexts + Sander T. Jones Debugger)
  if (step === 5) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 select-none">
        {/* Nagoski Inputs */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#3A1E2A]/5 flex flex-col h-full">
            <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-2 flex items-center gap-1">
              <BloomFlower size={12} petal="#E07A95" smile={false} />{" "}
              Accelerators
            </p>
            <textarea
              autoFocus
              rows={4}
              className="w-full flex-1 font-mono text-xs text-[#5A3645] bg-transparent focus:outline-none resize-none placeholder:text-[#B391A0]/40 p-1 select-text custom-scrollbar"
              value={entry.accelerators ?? ""}
              onChange={(e) => onChange({ accelerators: e.target.value })}
              placeholder="Comma-separated triggers that let this value thrive..."
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#3A1E2A]/5 flex flex-col h-full">
            <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#5A3645] font-bold mb-2 flex items-center gap-1">
              ⚠ Brakes
            </p>
            <textarea
              rows={4}
              className="w-full flex-1 font-mono text-xs text-[#B391A0] bg-transparent focus:outline-none resize-none placeholder:text-[#B391A0]/40 p-1 select-text custom-scrollbar"
              value={entry.brakes ?? ""}
              onChange={(e) => onChange({ brakes: e.target.value })}
              placeholder="Comma-separated inhibitors that shut it down..."
            />
          </div>
        </div>

        {/* Sander T. Jones Accountability Integrator */}
        <div className="bg-white p-5 rounded-[18px] border border-[#3A1E2A]/5">
          <RelationalSection
            relational={entry.relational}
            onChange={(next) => onChange({ relational: next })}
            variant="focus"
          />
        </div>
      </div>
    );
  }

  // STEP 6: Synthesize (Deterministic Assemblage Final Draft)
  const draft = deriveNeed(entry);
  const cessation = isCessationState(entry);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 select-none">
      {/* Dynamic Scaffolding Mirror */}
      {cessation ? (
        <div className="bg-[#FFF5DC] p-5 rounded-xl border border-dashed border-amber-300 flex items-start gap-4">
          <div className="shrink-0 pt-1">
            <CloudFriend size={50} />
          </div>
          <div>
            <p className="text-[9.5px] uppercase tracking-[0.18em] text-amber-800 font-bold mb-1 font-mono">
              ⚠️ Pause here — planning from this state isn't honest
            </p>
            <p className="text-sm text-[#3A1E2A] leading-relaxed italic font-serif select-text bg-white/60 p-3 rounded border border-amber-200/50 my-2">
              "{draft}"
            </p>
            <p className="text-xs text-[#5A3645] leading-snug">
              Brown's research on these states is unambiguous: prescribing
              action from inside them causes the nervous system to freeze. The
              sentence above is the only Need that fits honestly right now.
            </p>

            <button
              type="button"
              onClick={() => onChange({ need: draft })}
              className="mt-3 bg-amber-800 text-white px-4 py-1.5 rounded-full font-sans text-xs font-bold hover:bg-[#3A1E2A] transition-colors cursor-pointer shadow-2xs"
            >
              ✿ Save this as the Need
            </button>
          </div>
        </div>
      ) : (
        /* Standard Templated Synthesis Feed */
        <div className="bg-white p-5 rounded-xl border border-[#3A1E2A]/5 flex items-start gap-4">
          <div className="shrink-0 pt-1">
            <CloudFriend size={44} />
          </div>
          <div className="flex-1">
            <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-1 font-mono">
              ✿ Drafted from your lenses
            </p>
            <p className="text-sm sm:text-base text-[#3A1E2A] leading-relaxed italic font-serif select-text bg-[#FDF4F0] p-3 rounded border border-[#3A1E2A]/5 my-2">
              "{draft}"
            </p>

            <div className="flex gap-3 mt-3 items-center flex-wrap">
              <button
                type="button"
                onClick={() => onChange({ need: draft })}
                className="bg-[#C24E6E] text-white px-4 py-1.5 rounded-full font-sans text-xs font-medium hover:bg-[#3A1E2A] transition-colors cursor-pointer shadow-2xs"
              >
                Replace my Need
              </button>
              <button
                type="button"
                onClick={() => {
                  const merged = entry.need
                    ? `${entry.need}\n\n${draft}`
                    : draft;
                  onChange({ need: merged });
                }}
                className="bg-transparent text-[#5A3645] border border-[#3A1E2A]/15 px-4 py-1.5 rounded-full font-sans text-xs hover:bg-[#FAE6E1]/50 transition-colors cursor-pointer"
              >
                Append to current
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Your Final Permanent Custom Input Area */}
      <div className="bg-white p-5 rounded-xl border border-[#3A1E2A]/10">
        <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-2 flex items-center gap-1">
          <BloomFlower size={12} petal="#E07A95" smile={false} /> Your final Need
        </p>
        <textarea
          rows={7}
          className="w-full bg-transparent focus:outline-none font-serif italic text-base sm:text-lg text-[#3A1E2A] leading-relaxed resize-none placeholder:text-[#B391A0]/40 p-1 select-text custom-scrollbar"
          value={entry.need}
          onChange={(e) => onChange({ need: e.target.value })}
          placeholder="Refine or compose the non-negotiable condition exactly as you wish it to read..."
        />
      </div>
    </div>
  );
};
