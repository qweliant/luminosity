import type { Mapping } from "../types";
import {
  arcDirection,
  hasCommitment,
  livedDays,
  needsRecheck,
  workabilityArc,
} from "../derive";
import type { ParsedNeed } from "../parsedNeed";
import { WorkabilityArc } from "./primitives";

interface Props {
  entry: Mapping;
  partName: string | null;
  acceleratorsCount: number;
  brakesCount: number;
  parsedNeed: ParsedNeed;
}

/**
 * Footer pill strip on the condensed-row view: a "still true?" re-check when a
 * working value has gone stale, named voice, accelerator/brake counts, reframe
 * + committed-action flags, relational indicator, and the how-it's-going arc.
 * Self-contained — derives everything from `entry`.
 */
export const EntryStatusPills = ({
  entry,
  partName,
  acceleratorsCount,
  brakesCount,
  parsedNeed,
}: Props) => {
  const arc = workabilityArc(entry);
  const dir = arcDirection(entry);
  const recheck = needsRecheck(entry);

  return (
    <div className="mt-3 flex items-center gap-2 flex-wrap font-mono text-[9px] text-[#B391A0] tracking-wider pt-2 border-t border-[#3A1E2A]/5">
      {recheck && (
        <span
          className="normal-case tracking-normal text-[10px] text-[#8B6914] bg-[#FFF5DC] border border-[#D6A24A]/40 px-2 py-0.5 rounded-full"
          title="Working, but it's been a while. Worth a quick 'still true?' check."
        >
          still true?
        </span>
      )}
      {partName && (
        <span
          className="font-serif italic normal-case tracking-normal text-[10px] text-[#C24E6E] bg-[#FBD9E0]/40 border border-[#FBD9E0] px-2 py-0.5 rounded-full"
          title={`Voice · ${partName}`}
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
        <span className="text-[#9CD3B6] font-bold">test ✓</span>
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
      {arc.length >= 2 && (
        <span
          className="inline-flex items-center bg-white border border-[#3A1E2A]/10 px-1.5 py-0.5 rounded-full"
          title={`How it's going over time: ${arc.join(" → ")} (of 5)`}
        >
          <WorkabilityArc arc={arc} direction={dir} />
        </span>
      )}
      <span className="ml-auto text-[#C24E6E] font-sans text-[10px] tracking-normal font-medium group-hover:underline">
        expand ↓
      </span>
    </div>
  );
};
