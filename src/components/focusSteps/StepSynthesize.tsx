import { deriveNeed, isCessationState } from "../../derive";
import { BloomFlower, CloudFriend } from "../bloom";
import type { FocusStepProps } from "./types";

// Step 6 — deterministic synthesis. Two flavors:
// - cessation state: refuse to draft, surface a compassion sentence only.
//   `Save this as the Need` is the only action; no replace/append split.
// - standard: show the templated draft with Replace / Append buttons, then
//   an editable Need textarea for the user's final composition.
export const StepSynthesize = ({ entry, onChange }: FocusStepProps) => {
  const draft = deriveNeed(entry);
  const cessation = isCessationState(entry);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 select-none">
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

      <div className="bg-white p-5 rounded-xl border border-[#3A1E2A]/10">
        <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-2 flex items-center gap-1">
          <BloomFlower size={12} petal="#E07A95" smile={false} /> Your final
          Need
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
