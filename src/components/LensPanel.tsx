import React, { useState } from "react";
import type { Mapping } from "../types";
import {
  NVC_CATEGORIES,
  CORE_NEEDS,
  CORE_NEEDS_DETAIL,
  VALUE_DETAILS,
} from "../data";
import {
  deriveNeed,
  hasAnyLensData,
  maslowHighest,
  relationalFreedoms,
  sdtProfile,
} from "../derive";
import { LifeDesignSection } from "./LifeDesignSection";
import { RelationalSection } from "./RelationalSection";
import { EmotionPicker } from "./EmotionPicker";

// --- Bloom primitives, inlined ---------------------------------------------
// Matches the BloomFlower used in EntrySection so the two surfaces are visually
// continuous. Kept local rather than imported from a shared module to avoid
// touching primitives.tsx in this patch.

const BloomFlower = ({
  size = 14,
  petal = "#E07A95",
  smile = false,
}: {
  size?: number;
  petal?: string;
  smile?: boolean;
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
        <circle cx="44" cy="48" r="1.6" fill="#3A1E2A" />
        <circle cx="52" cy="48" r="1.6" fill="#3A1E2A" />
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

const BloomWorkability = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) => {
  const label =
    value === 0
      ? "unrated"
      : value <= 2
        ? "stuck"
        : value === 3
          ? "mixed"
          : "working";
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1.5 bg-[#FAE6E1]/50 px-2 py-1 rounded-full border border-[#3A1E2A]/5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            className="focus:outline-none hover:scale-110 transition-transform cursor-pointer"
            title={`Workability ${n}/5`}
            aria-label={`Workability ${n} of 5`}
          >
            <BloomFlower
              size={14}
              petal={n <= value ? "#E07A95" : "#FBD9E0"}
              smile={n <= value}
            />
          </button>
        ))}
      </div>
      <span className="font-mono text-[10px] text-[#B391A0] tracking-wider uppercase">
        {value || "–"}/5 · {label}
      </span>
    </div>
  );
};

// Each lens step is rail-marked with a pink dashed border and ends in a
// dashed divider. Step number is mono; framework attribution is tiny caps.
const LensStep = ({
  n,
  name,
  framework,
  children,
}: {
  n: string;
  name: string;
  framework: string;
  children: React.ReactNode;
}) => (
  <div className="pl-5 pb-5 mb-5 border-l-2 border-[#FBD9E0] border-b border-dashed border-[#3A1E2A]/10 last:border-b-0 last:mb-0 last:pb-0">
    <div className="flex items-baseline gap-2 mb-3 flex-wrap">
      <span className="font-mono text-[11px] text-[#B391A0]">{n}</span>
      <span className="font-serif text-lg text-[#3A1E2A] leading-none">
        {name}
      </span>
      <span className="text-[9px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold">
        {framework}
      </span>
    </div>
    {children}
  </div>
);

// Three-dot scale for SDT profile (autonomy / competence / relatedness).
const SdtDots = ({ n }: { n: number }) => (
  <span className="inline-flex gap-[2px] ml-0.5 align-middle">
    {[1, 2, 3].map((i) => (
      <span
        key={i}
        className="inline-block w-[5px] h-[5px] rounded-full"
        style={{ background: i <= n ? "#E07A95" : "#FBD9E0" }}
      />
    ))}
  </span>
);

const SdtFootnote = ({
  profile,
}: {
  profile: { autonomy: number; competence: number; relatedness: number };
}) => (
  <p className="font-mono text-[10px] text-[#5A3645] mt-2 leading-relaxed">
    SDT · autonomy <SdtDots n={profile.autonomy} /> · competence{" "}
    <SdtDots n={profile.competence} /> · relatedness{" "}
    <SdtDots n={profile.relatedness} />
  </p>
);

// --- Component -------------------------------------------------------------

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
    <div className="print:hidden">
      {/* On {value} — value definition + reflection prompts */}
      {detail && (
        <div className="pl-5 pb-5 mb-5 border-l-2 border-[#FBD9E0] border-b border-dashed border-[#3A1E2A]/10">
          <div className="flex items-baseline gap-2 mb-2">
            <BloomFlower size={11} petal="#C24E6E" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold">
              On {entry.value}
            </span>
          </div>
          <p className="font-serif italic text-[13px] text-[#5A3645] mb-2">
            {detail.synonym}
          </p>
          <p className="text-[12.5px] text-[#3A1E2A] leading-relaxed mb-3">
            {detail.description}
          </p>
          <ul className="space-y-1">
            {detail.reflection.map((q, i) => (
              <li
                key={i}
                className="text-[12px] text-[#5A3645] leading-relaxed font-serif italic"
              >
                — {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Step 1 — Diagnose */}
      <LensStep n="1" name="Diagnose" framework="ACT + Atlas of the Heart">
        <div className="mb-3">
          <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#5A3645] font-semibold mb-2">
            Workability
          </p>
          <BloomWorkability
            value={entry.workability ?? 0}
            onChange={(n) => onChange({ workability: n })}
          />
        </div>
        <div className="mt-4 pt-3 border-t border-dashed border-[#3A1E2A]/10">
          <EmotionPicker entry={entry} onChange={onChange} variant="compact" />
        </div>
      </LensStep>

      {/* Step 2 — Locate (NVC) */}
      <LensStep n="2" name="Locate" framework="NVC Universal Needs">
        <p className="text-[11.5px] text-[#5A3645] mb-3 font-serif italic">
          Tag what's starving underneath the friction.
        </p>
        <div className="space-y-2.5">
          {NVC_CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3"
            >
              <div className="text-[9px] uppercase tracking-[0.18em] text-[#B391A0] sm:w-20 sm:shrink-0 mb-1 sm:mb-0 font-semibold">
                {cat.name}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cat.needs.map((n) => {
                  const sel = entry.nvcNeeds?.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onToggleNvc(n)}
                      className={`text-[11.5px] px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                        sel
                          ? "bg-[#C24E6E] text-white border-[#C24E6E]"
                          : "bg-transparent text-[#5A3645] border-[#3A1E2A]/15 hover:border-[#C24E6E] hover:text-[#C24E6E]"
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
      </LensStep>

      {/* Step 3 — Anchor (Madanes) */}
      <LensStep n="3" name="Anchor" framework="Madanes 6 Core Human Needs">
        <p className="text-[11.5px] text-[#5A3645] mb-3 font-serif italic">
          Which fundamental driver does this value serve?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CORE_NEEDS.map((n) => {
            const sel = entry.coreNeed === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ coreNeed: sel ? "" : n })}
                className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                  sel
                    ? "bg-[#FBD9E0] border-[#C24E6E]"
                    : "bg-[#FAE6E1]/40 border-[#3A1E2A]/10 hover:border-[#E07A95]/60"
                }`}
              >
                <div
                  className={`font-serif text-base leading-tight ${
                    sel ? "text-[#C24E6E]" : "text-[#3A1E2A]"
                  }`}
                >
                  {n}
                </div>
                <div className="text-[10.5px] text-[#B391A0] mt-1 leading-snug">
                  {CORE_NEEDS_DETAIL[n]}
                </div>
              </button>
            );
          })}
        </div>
        {(entry.coreNeed || maslow || freedoms.length > 0) && (
          <div className="mt-3 p-3 bg-[#FAE6E1]/40 rounded-xl border border-[#3A1E2A]/5">
            <SdtFootnote profile={sdt} />
            {maslow && (
              <p className="font-mono text-[10px] text-[#5A3645] mt-1">
                Maslow · highest active layer:{" "}
                <span className="text-[#C24E6E]">{maslow}</span>
              </p>
            )}
            {freedoms.length > 0 && (
              <p className="font-mono text-[10px] text-[#5A3645] mt-1">
                Jones · freedoms at stake:{" "}
                <span className="text-[#C24E6E]">
                  {freedoms.join(" · ").toLowerCase()}
                </span>
              </p>
            )}
          </div>
        )}
      </LensStep>

      {/* Step 4 — Reframe (delegates to LifeDesignSection) */}
      <LensStep n="4" name="Reframe" framework="Stanford Life Design">
        <LifeDesignSection
          ld={entry.lifeDesign}
          onChange={(next) => onChange({ lifeDesign: next })}
          variant="compact"
        />
      </LensStep>

      {/* Step 5 — Contextualize (Nagoski + Jones) */}
      <LensStep n="5" name="Contextualize" framework="Nagoski + Jones">
        <p className="text-[11.5px] text-[#5A3645] mb-3 font-serif italic">
          Which contexts accelerate this value, and which brake it?
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold mb-1 flex items-center gap-1.5">
              <BloomFlower size={10} petal="#E07A95" />
              Accelerators
            </div>
            <textarea
              rows={2}
              className="w-full text-[12.5px] bg-[#FAE6E1]/40 border border-[#3A1E2A]/10 rounded-lg focus:outline-none focus:border-[#C24E6E] py-1.5 px-2 placeholder:text-[#B391A0]/50 resize-none"
              value={entry.accelerators ?? ""}
              onChange={(e) => onChange({ accelerators: e.target.value })}
              placeholder="Conditions that let this thrive…"
            />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.18em] text-[#5A3645] font-semibold mb-1 flex items-center gap-1.5">
              <span className="text-[#B391A0]">⏸</span>
              Brakes
            </div>
            <textarea
              rows={2}
              className="w-full text-[12.5px] bg-[#FAE6E1]/40 border border-[#3A1E2A]/10 rounded-lg focus:outline-none focus:border-[#5A3645] py-1.5 px-2 placeholder:text-[#B391A0]/50 resize-none"
              value={entry.brakes ?? ""}
              onChange={(e) => onChange({ brakes: e.target.value })}
              placeholder="What shuts it down…"
            />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-dashed border-[#3A1E2A]/10">
          <RelationalSection
            relational={entry.relational}
            onChange={(next) => onChange({ relational: next })}
            variant="compact"
          />
        </div>
      </LensStep>

      {/* Step 6 — Synthesize */}
      <div className="pl-5 mt-4 pt-4 border-t border-dashed border-[#3A1E2A]/10">
        <div className="flex items-baseline gap-2 mb-3 flex-wrap">
          <span className="font-mono text-[11px] text-[#B391A0]">6</span>
          <span className="font-serif text-lg text-[#3A1E2A] leading-none">
            Synthesize
          </span>
          <span className="text-[9px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold">
            Templated draft
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleSynthesize}
            disabled={!lensReady}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold transition-colors cursor-pointer ${
              lensReady
                ? "bg-[#C24E6E] text-white hover:bg-[#3A1E2A]"
                : "bg-[#FBD9E0]/40 text-[#B391A0] cursor-not-allowed"
            }`}
          >
            <BloomFlower size={11} petal={lensReady ? "#FFFFFF" : "#B391A0"} />
            Compose draft
          </button>
          {!lensReady && (
            <span className="text-[11px] text-[#B391A0] italic font-serif">
              set at least one lens above to enable synthesis
            </span>
          )}
        </div>

        {draftPreview && (
          <div className="mt-4 p-4 rounded-xl bg-[#FAE6E1]/40 border border-[#3A1E2A]/10">
            <div className="text-[9px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold mb-2 flex items-center gap-1.5">
              <BloomFlower size={10} petal="#C24E6E" />
              Draft
            </div>
            <p className="font-serif italic text-[13px] text-[#3A1E2A] leading-relaxed mb-3 whitespace-pre-wrap">
              {draftPreview}
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  onChange({ need: draftPreview });
                  setDraftPreview(null);
                }}
                className="text-[10px] uppercase tracking-[0.22em] text-[#C24E6E] font-semibold hover:underline cursor-pointer"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  const merged = entry.need
                    ? `${entry.need}\n\n${draftPreview}`
                    : draftPreview;
                  onChange({ need: merged });
                  setDraftPreview(null);
                }}
                className="text-[10px] uppercase tracking-[0.22em] text-[#5A3645] font-semibold hover:underline cursor-pointer"
              >
                Append
              </button>
              <button
                type="button"
                onClick={() => setDraftPreview(null)}
                className="text-[10px] uppercase tracking-[0.22em] text-[#B391A0] hover:text-[#5A3645] cursor-pointer"
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
