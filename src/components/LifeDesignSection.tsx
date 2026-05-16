// src/components/LifeDesignSection.tsx
//
// Same logic, same props (`ld`, `onChange`, `variant`). Visual changes:
//   - Plain-language section headings (questions) instead of all-caps labels.
//   - Wayfinding scales get both-end labels (numb ↔ flow, drains ↔ fills) so
//     the dots don't need to be memorized.
//   - Problem types render as three side-by-side cards with their description
//     up front — comparable before commitment, not after.
//   - Reality gets butter-amber treatment (same family as cessation states).
//   - "Because…" handoff line bridges the framework's conditional logic.
//   - Talk / Do prototypes are equal cards with one-line descriptions.

import React from "react";
import type {
  LifeDesignLens,
  LifeDesignProblemType,
  PrototypeMode,
} from "../types";
import { DotString } from "./primitives";

const PROBLEM_TYPES: Array<{
  id: LifeDesignProblemType;
  name: string;
  blurb: string;
}> = [
  {
    id: "open",
    name: "Open",
    blurb: "A real problem you can prototype against.",
  },
  {
    id: "stuck",
    name: "Stuck",
    blurb: "Sticky and recurring — needs a reframe first.",
  },
  {
    id: "reality",
    name: "Reality",
    blurb: "A fact of life to accept and navigate around, not solve.",
  },
];

// Conditional downstream — names the path forward before the downstream fields
// appear, so the framework's logic is visible instead of buried.
const DOWNSTREAM_LABEL: Record<LifeDesignProblemType, string> = {
  open: "Open problem — go straight to a small test.",
  stuck: "Because this is stuck — reframe first, then design a small test.",
  reality: "Because this is a reality — accept and design around it.",
};

const DOWNSTREAM_ICON: Record<LifeDesignProblemType, string> = {
  open: "◆",
  stuck: "↺",
  reality: "◇",
};

// --- Small labelled-scale wrapper ----------------------------------------
// Renders the DotString primitive between two end labels, with optional
// caption mid-baseline. Keeps the scale's grammar visible.
const LabeledScale = ({
  label,
  offLabel,
  onLabel,
  value,
  onChange,
  ariaLabel,
}: {
  label: string;
  offLabel: string;
  onLabel: string;
  value: number;
  onChange: (n: number) => void;
  ariaLabel: string;
}) => (
  <div className="grid grid-cols-[100px_1fr] items-center gap-3">
    <span className="font-serif italic text-[14px] text-[#3A1E2A]">
      {label}
    </span>
    <div className="flex items-center gap-3">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#B391A0] min-w-[44px] text-right">
        {offLabel}
      </span>
      <DotString value={value} onChange={onChange} ariaLabel={ariaLabel} />
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#B391A0] min-w-[44px]">
        {onLabel}
      </span>
    </div>
  </div>
);

const Question = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="mb-3">
    <h4 className="font-serif text-[16px] text-[#3A1E2A] tracking-[-0.005em] m-0">
      {title}
    </h4>
    {sub && (
      <p className="font-serif italic text-[12.5px] text-[#B391A0] m-0 mt-0.5 leading-snug">
        {sub}
      </p>
    )}
  </div>
);

export const LifeDesignSection = ({
  ld,
  onChange,
  variant = "compact",
}: {
  ld: LifeDesignLens | undefined;
  onChange: (next: LifeDesignLens) => void;
  variant?: "compact" | "focus";
}) => {
  const current: LifeDesignLens = ld ?? {};
  const isFocus = variant === "focus";
  const engagement = current.wayfinding?.engagement ?? 0;
  const energy = current.wayfinding?.energy ?? 0;
  const frame = current.problemFrame;
  const isReality = frame === "reality";
  const isStuck = frame === "stuck";
  const isOpen = frame === "open";
  const reframeText = current.reframeNote?.trim() ?? "";
  const prototypeLocked = isStuck && reframeText.length === 0;

  const setEngagement = (n: number) =>
    onChange({
      ...current,
      wayfinding: { ...(current.wayfinding ?? {}), engagement: n || undefined },
    });
  const setEnergy = (n: number) =>
    onChange({
      ...current,
      wayfinding: { ...(current.wayfinding ?? {}), energy: n || undefined },
    });
  const setFrame = (p: LifeDesignProblemType | undefined) =>
    onChange({ ...current, problemFrame: p });
  const setReframe = (s: string) => onChange({ ...current, reframeNote: s });
  const setAcceptance = (s: string) =>
    onChange({ ...current, acceptanceNote: s });
  const setPrototypeMode = (m: PrototypeMode) =>
    onChange({
      ...current,
      prototype: { mode: m, action: current.prototype?.action ?? "" },
    });
  const setPrototypeAction = (s: string) =>
    onChange({
      ...current,
      prototype: { mode: current.prototype?.mode, action: s },
    });

  // Color tokens — Reality reuses the cessation-amber family so the user can
  // see "we are not solving this" without reading the label.
  const downstreamBg = isReality ? "#FFF5DC" : "#FAE6E1";
  const downstreamFg = isReality ? "#8B6914" : "#C24E6E";
  const downstreamBorder = isReality ? "#D6A24A" : "#E07A95";

  return (
    <div className="space-y-6">
      {/* 1 · Wayfinding -------------------------------------------------- */}
      <section>
        <Question
          title="How does this value sit in your week?"
          sub="Wayfinding — from Burnett & Evans' Good Time Journal."
        />
        <div className="space-y-3">
          <LabeledScale
            label="Engagement"
            offLabel="numb"
            onLabel="flow"
            value={engagement}
            onChange={setEngagement}
            ariaLabel="Engagement"
          />
          <LabeledScale
            label="Energy"
            offLabel="drains"
            onLabel="fills"
            value={energy}
            onChange={setEnergy}
            ariaLabel="Energy"
          />
          {energy > 0 && energy < 3 && (
            <p className="font-serif italic text-[11.5px] text-[#A85A2C] m-0 pl-[103px] leading-snug">
              ⚠ This is currently draining you — worth naming.
            </p>
          )}
        </div>
      </section>

      <div className="border-t border-dashed border-[#3A1E2A]/10" />

      {/* 2 · Problem type ------------------------------------------------ */}
      <section>
        <Question
          title="What kind of problem is this?"
          sub="The answer changes what comes next."
        />
        <div
          role="radiogroup"
          aria-label="Problem type"
          className="grid grid-cols-1 sm:grid-cols-3 gap-2"
        >
          {PROBLEM_TYPES.map((p) => {
            const sel = frame === p.id;
            const isRealityCard = p.id === "reality";
            const selBg = isRealityCard ? "#FFF5DC" : "#FBD9E0";
            const selFg = isRealityCard ? "#8B6914" : "#C24E6E";
            const selBorder = isRealityCard ? "#D6A24A" : "#C24E6E";
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => setFrame(sel ? undefined : p.id)}
                className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                  sel
                    ? "shadow-xs"
                    : "bg-white border-[#3A1E2A]/10 hover:border-[#E07A95]/60"
                }`}
                style={
                  sel
                    ? {
                        background: selBg,
                        borderColor: selBorder,
                        borderWidth: "1.5px",
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="block w-3 h-3 rounded-full flex items-center justify-center border transition-colors"
                    style={
                      sel
                        ? { background: selBorder, borderColor: selBorder }
                        : { borderColor: "#3A1E2A33" }
                    }
                  >
                    {sel && (
                      <span className="block w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <span
                    className="font-serif text-[16px] leading-none"
                    style={{ color: sel ? selFg : "#3A1E2A" }}
                  >
                    {p.name}
                  </span>
                </div>
                <p
                  className="font-sans text-[11.5px] m-0 leading-snug"
                  style={{ color: sel ? "#5A3645" : "#B391A0" }}
                >
                  {p.blurb}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3 · Conditional downstream ------------------------------------- */}
      {frame && (
        <section>
          {/* "Because…" handoff line — makes the framework's conditional
              logic visible instead of buried in field appearances. */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
            style={{
              background: downstreamBg + "99",
              border: `1px dashed ${downstreamBorder}66`,
            }}
          >
            <span className="text-[14px]" style={{ color: downstreamFg }}>
              {DOWNSTREAM_ICON[frame]}
            </span>
            <span
              className="font-serif italic text-[13px] leading-snug"
              style={{ color: isReality ? "#3A1E2A" : "#3A1E2A" }}
            >
              {DOWNSTREAM_LABEL[frame]}
            </span>
          </div>

          {/* Reality — acceptance note only */}
          {isReality && (
            <div>
              <label className="block font-sans text-[11.5px] font-medium text-[#3A1E2A] mb-1.5">
                An acceptance note
                <span className="text-[#B391A0] font-normal italic">
                  {" "}
                  · how will you navigate around it?
                </span>
              </label>
              <input
                className="w-full font-serif italic text-[14px] bg-white border border-[#3A1E2A]/10 focus:outline-none focus:border-[#8B6914] rounded-lg py-2 px-3 placeholder:text-[#B391A0]/60"
                value={current.acceptanceNote ?? ""}
                onChange={(e) => setAcceptance(e.target.value)}
                placeholder="This is a fact of life. How will you navigate around it?"
              />
            </div>
          )}

          {/* Stuck — reframe first */}
          {isStuck && (
            <div className="mb-4">
              <label className="font-sans text-[11.5px] font-medium text-[#3A1E2A] mb-1.5 flex items-baseline gap-2 flex-wrap">
                <span>Reframe</span>
                <span className="font-serif italic text-[#B391A0] font-normal">
                  How might I…
                </span>
              </label>
              <input
                className="w-full text-[13.5px] bg-white border border-[#3A1E2A]/10 focus:outline-none focus:border-[#C24E6E] rounded-lg py-2 px-3 placeholder:text-[#B391A0]/60"
                value={current.reframeNote ?? ""}
                onChange={(e) => setReframe(e.target.value)}
                placeholder="The shift that turns the wall into a problem."
              />
              {prototypeLocked && (
                <p className="font-serif italic text-[11.5px] text-[#B391A0] m-0 mt-1.5">
                  Until this is filled, the prototype below is locked.
                </p>
              )}
            </div>
          )}

          {/* Prototype — visible for Open and (locked for) Stuck; hidden for Reality */}
          {!isReality && (
            <div>
              <label className="block font-sans text-[11.5px] font-medium text-[#3A1E2A] mb-2">
                Design a smallest test
              </label>
              <fieldset
                disabled={prototypeLocked}
                className={`space-y-2.5 ${prototypeLocked ? "opacity-40 pointer-events-none" : ""}`}
              >
                {/* Two equal mode cards */}
                <div
                  role="radiogroup"
                  aria-label="Prototype mode"
                  className="grid grid-cols-2 gap-2"
                >
                  {[
                    {
                      mode: "do" as const,
                      label: "Do it",
                      sub: "Try the experience for a day.",
                    },
                    {
                      mode: "talk" as const,
                      label: "Talk to someone",
                      sub: "Who's already lived this — gather their story.",
                    },
                  ].map(({ mode, label, sub }) => {
                    const sel = current.prototype?.mode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={sel}
                        onClick={() => setPrototypeMode(mode)}
                        className={`text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                          sel
                            ? "bg-[#9CD3B6]/20 border-[#5C7F66]"
                            : "bg-white border-[#3A1E2A]/10 hover:border-[#5C7F66]/60"
                        }`}
                        style={sel ? { borderWidth: "1.5px" } : undefined}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`block w-2.5 h-2.5 rounded-full flex items-center justify-center border transition-colors ${
                              sel
                                ? "bg-[#5C7F66] border-[#5C7F66]"
                                : "border-[#3A1E2A]/20"
                            }`}
                          >
                            {sel && (
                              <span className="block w-1 h-1 rounded-full bg-white" />
                            )}
                          </span>
                          <span
                            className={`font-sans text-[12px] font-semibold ${
                              sel ? "text-[#1F6E4A]" : "text-[#3A1E2A]"
                            }`}
                          >
                            {label}
                          </span>
                          <span className="ml-auto font-mono text-[9px] tracking-[0.1em] uppercase text-[#B391A0]">
                            {mode}
                          </span>
                        </div>
                        <p className="font-sans text-[10.5px] m-0 leading-snug text-[#5A3645]">
                          {sub}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Free-text action */}
                <input
                  className="w-full text-[13.5px] bg-white border border-[#3A1E2A]/10 focus:outline-none focus:border-[#5C7F66] rounded-lg py-2 px-3 placeholder:text-[#B391A0]/60"
                  value={current.prototype?.action ?? ""}
                  onChange={(e) => setPrototypeAction(e.target.value)}
                  placeholder={
                    current.prototype?.mode === "talk"
                      ? "Who has already lived this? Note who you'll interview."
                      : current.prototype?.mode === "do"
                        ? "How can you try this for a day? Note your smallest experiment."
                        : isOpen
                          ? "The smallest experiment to test this directly."
                          : "The smallest experiment to test the reframe."
                  }
                />
                <p className="font-serif italic text-[11px] text-[#B391A0] m-0">
                  Smallest = something you could actually do tomorrow.
                </p>
              </fieldset>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
