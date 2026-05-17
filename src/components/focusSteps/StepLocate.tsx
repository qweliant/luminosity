import { NVC_CATEGORIES } from "../../data";
import type { FocusStepProps } from "./types";

// Step 2 — NVC universal needs vocabulary. Multi-select chips grouped by
// category. Toggling a chip flips the membership in `entry.nvcNeeds`.
export const StepLocate = ({ entry, onToggleNvc }: FocusStepProps) => (
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
