import { BloomWorkability } from "../bloom";
import { EmotionPicker } from "../EmotionPicker";
import type { FocusStepProps } from "./types";

// Step 1 — ACT Workability rating + surface friction + Atlas of the Heart
// granularity diagnostic.
export const StepDiagnose = ({ entry, onChange }: FocusStepProps) => (
  <div className="space-y-8 animate-in fade-in duration-200 select-none">
    <div className="bg-white p-4 rounded-xl border border-[#3A1E2A]/5">
      <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-2">
        1. Current Workability
      </p>
      <div className="flex gap-4 items-center">
        <BloomWorkability
          value={entry.workability ?? 0}
          onChange={(n) => onChange({ workability: n })}
          size={22}
          toggleable
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
