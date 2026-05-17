import { useEffect, useState } from "react";
import type { Mapping, Part } from "../types";
import { lensCompletion } from "../derive";
import { BloomFlower, LumiBean } from "./bloom";
import { StepAnchor } from "./focusSteps/StepAnchor";
import { StepContextualize } from "./focusSteps/StepContextualize";
import { StepDiagnose } from "./focusSteps/StepDiagnose";
import { StepLocate } from "./focusSteps/StepLocate";
import { StepReframe } from "./focusSteps/StepReframe";
import { StepSynthesize } from "./focusSteps/StepSynthesize";
import {
  FOCUS_PROMPTS,
  FOCUS_STEPS,
  type FocusStepProps,
} from "./focusSteps/types";

// Index into FOCUS_STEPS; 1-based to match the displayed step labels.
type StepIndex = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_COMPONENTS: Record<
  StepIndex,
  (props: FocusStepProps) => ReturnType<typeof StepDiagnose>
> = {
  1: StepDiagnose,
  2: StepLocate,
  3: StepAnchor,
  4: StepReframe,
  5: StepContextualize,
  6: StepSynthesize,
};

interface Props {
  entry: Mapping;
  parts: Part[];
  onUpsertPart: (name: string) => string | null;
  onChange: (patch: Partial<Mapping>) => void;
  onToggleNvc: (n: string) => void;
  onClose: () => void;
}

/**
 * Full-viewport six-step focus wizard. Owns the keyboard shortcuts
 * (Esc/←/→), the current step index, the progress strip, and the prompt
 * panel. Each step is its own file under focusSteps/.
 */
export const FocusOverlay = ({
  entry,
  parts,
  onUpsertPart,
  onChange,
  onToggleNvc,
  onClose,
}: Props) => {
  const [step, setStep] = useState<StepIndex>(1);
  const total = FOCUS_STEPS.length;
  const completion = lensCompletion(entry);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      // Don't capture arrows when the user is typing — they're navigating
      // text, not steps. Esc still always closes the overlay.
      const inField =
        t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && !inField)
        setStep((s) => Math.min(total, s + 1) as StepIndex);
      else if (e.key === "ArrowLeft" && !inField)
        setStep((s) => Math.max(1, s - 1) as StepIndex);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, total]);

  const StepComponent = STEP_COMPONENTS[step];

  return (
    <div className="fixed inset-0 bg-[#FDF4F0] z-50 overflow-y-auto print:hidden animate-in fade-in duration-300 select-none">
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

          <div className="flex items-center justify-between gap-1 pt-2 border-t border-[#3A1E2A]/5">
            {FOCUS_STEPS.map((name, i) => {
              const reached = i + 1 <= step;
              const stepFilled = completion.steps[i];
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setStep((i + 1) as StepIndex)}
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
                    className={`text-[8px] font-mono uppercase tracking-tighter block mt-0.5 transition-colors ${
                      reached
                        ? "text-[#3A1E2A] font-bold"
                        : "text-[#B391A0]/60"
                    }`}
                  >
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

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

        <div className="flex-1 pb-4">
          <StepComponent
            entry={entry}
            parts={parts}
            onUpsertPart={onUpsertPart}
            onChange={onChange}
            onToggleNvc={onToggleNvc}
          />
        </div>

        <footer className="flex justify-between items-center pt-6 mt-6 border-t border-dashed border-[#3A1E2A]/10 gap-4 bg-[#FDF4F0]">
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(total, s + 1) as StepIndex)}
            className="font-sans text-xs text-[#5A3645] hover:underline px-2 py-1 font-medium cursor-pointer"
            disabled={step === total}
          >
            Skip step
          </button>

          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1) as StepIndex)}
              disabled={step === 1}
              className="px-4 py-2 rounded-full font-sans text-xs text-[#5A3645] border border-[#3A1E2A]/10 hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
            >
              ← Prev
            </button>

            {step < total ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as StepIndex)}
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
