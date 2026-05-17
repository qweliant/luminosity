import { BloomFlower } from "../bloom";
import { RelationalSection } from "../RelationalSection";
import type { FocusStepProps } from "./types";

// Step 5 — Nagoski accelerators/brakes + optional Sander T. Jones relational
// accountability lens (gated by the Interpersonal Friction checkbox inside
// RelationalSection).
export const StepContextualize = ({ entry, onChange }: FocusStepProps) => (
  <div className="space-y-6 animate-in fade-in duration-200 select-none">
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-xl border border-[#3A1E2A]/5 flex flex-col h-full">
        <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-2 flex items-center gap-1">
          <BloomFlower size={12} petal="#E07A95" smile={false} /> Accelerators
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

    <div className="bg-white p-5 rounded-[18px] border border-[#3A1E2A]/5">
      <RelationalSection
        relational={entry.relational}
        onChange={(next) => onChange({ relational: next })}
        variant="focus"
      />
    </div>
  </div>
);
