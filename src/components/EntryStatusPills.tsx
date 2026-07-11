import type { Mapping } from "../types";
import { hasCommitment, livedDays } from "../derive";
import type { ParsedNeed } from "../parsedNeed";

interface Props {
  entry: Mapping;
  partName: string | null;
  acceleratorsCount: number;
  brakesCount: number;
  parsedNeed: ParsedNeed;
}

/**
 * Footer pill strip on the condensed-row view: named voice, accelerator/brake
 * counts, reframe + committed-action flags, relational indicator.
 * Self-contained — derives nothing on its own.
 */
export const EntryStatusPills = ({
  entry,
  partName,
  acceleratorsCount,
  brakesCount,
  parsedNeed,
}: Props) => (
  <div className="mt-3 flex items-center gap-2 flex-wrap font-mono text-[9px] text-[#B391A0] tracking-wider pt-2 border-t border-[#3A1E2A]/5">
    {partName && (
      <span
        className="font-serif italic normal-case tracking-normal text-[10px] text-[#C24E6E] bg-[#FBD9E0]/40 border border-[#FBD9E0] px-2 py-0.5 rounded-full"
        title={`Part · ${partName}`}
      >
        {partName}
      </span>
    )}
    {(acceleratorsCount > 0 || parsedNeed.accelerators) && (
      <span className="text-[#C24E6E] bg-[#FBD9E0]/50 px-2 py-0.5 rounded-full">
        {parsedNeed.accelerators
          ? "✿ accelerators extracted"
          : `${acceleratorsCount} accelerators`}
      </span>
    )}
    {(brakesCount > 0 || parsedNeed.brakes) && (
      <span className="bg-[#FAE6E1] text-[#5A3645] px-2 py-0.5 rounded-full">
        {parsedNeed.brakes ? "⚠ brakes extracted" : `${brakesCount} brakes`}
      </span>
    )}
    {(entry.lifeDesign?.reframeNote?.trim() || parsedNeed.reframe) && (
      <span className="text-[#9CD3B6] font-bold">reframe ✓</span>
    )}
    {(entry.lifeDesign?.prototype?.action?.trim() || parsedNeed.prototype) && (
      <span className="text-[#9CD3B6] font-bold">prototype ✓</span>
    )}
    {hasCommitment(entry) && (
      <span
        className="text-[#5A3645] bg-[#E9F5EE] border border-[#9CD3B6]/50 px-2 py-0.5 rounded-full"
        title="A committed action is set; it resurfaces on the home page to tend."
      >
        {livedDays(entry) > 0 ? `✿ lived ${livedDays(entry)}d` : "✿ committed"}
      </span>
    )}
    {entry.relational?.active && (
      <span
        className={`px-2 py-0.5 rounded-full ${
          entry.relational.source
            ? "bg-[#FFF5DC] text-[#5A3645]"
            : "bg-red-50 text-[#C24E6E]"
        }`}
      >
        relational ✿
      </span>
    )}
    <span className="ml-auto text-[#C24E6E] font-sans text-[10px] tracking-normal font-medium group-hover:underline">
      expand ↓
    </span>
  </div>
);
