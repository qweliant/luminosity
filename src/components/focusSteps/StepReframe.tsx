import { LifeDesignSection } from "../LifeDesignSection";
import type { FocusStepProps } from "./types";

// Step 4 — Stanford Life Design Tools (wayfinding, problem framing,
// reframe/acceptance, prototype). All logic lives inside LifeDesignSection.
export const StepReframe = ({ entry, onChange }: FocusStepProps) => (
  <div className="animate-in fade-in duration-200 bg-white p-6 rounded-[18px] border border-[#3A1E2A]/5">
    <LifeDesignSection
      ld={entry.lifeDesign}
      onChange={(next) => onChange({ lifeDesign: next })}
      variant="focus"
    />
  </div>
);
