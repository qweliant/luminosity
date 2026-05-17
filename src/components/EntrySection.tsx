import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Mapping, Part } from "../types";
import { ifsLayer, isCessationState, lensCompletion } from "../derive";
import { parseCompositeNeed } from "../parsedNeed";
import { EntryCondensed } from "./EntryCondensed";
import { EntryCondensedCessation } from "./EntryCondensedCessation";
import { EntryExpanded } from "./EntryExpanded";
import { EntryExpandedCessation } from "./EntryExpandedCessation";
import { EntryPrintSummary } from "./EntryPrintSummary";

interface EntryProps {
  entry: Mapping;
  parts: Part[];
  isDuplicate: boolean;
  lensOpen: boolean;
  onToggleLens: () => void;
  onChange: (patch: Partial<Mapping>) => void;
  onDelete: () => void;
  onToggleNvc: (need: string) => void;
  onFocus: () => void;
}

/**
 * Shell: owns the local expand/collapse state, picks one of four view
 * variants based on (isExpanded × cessation), and always emits the
 * print-only summary at the bottom. Derives the small bag of read-only
 * values each variant needs.
 */
export const EntrySection = ({
  entry,
  parts,
  isDuplicate,
  lensOpen,
  onToggleLens,
  onChange,
  onDelete,
  onToggleNvc,
  onFocus,
}: EntryProps) => {
  // Brand new blank entries open expanded so the user can write immediately.
  const [isExpanded, setIsExpanded] = useState(
    () => !entry.value.trim() && !entry.need.trim(),
  );

  const completion = lensCompletion(entry);
  const cessation = isCessationState(entry);

  const acceleratorsCount = entry.accelerators
    ? entry.accelerators.split(",").filter((s) => s.trim()).length
    : 0;
  const brakesCount = entry.brakes
    ? entry.brakes.split(",").filter((s) => s.trim()).length
    : 0;
  const servesDriver = entry.coreNeed
    ? entry.coreNeed.toLowerCase()
    : "unmapped";

  const ifsBand = ifsLayer(entry);
  const partName = entry.partId
    ? (parts.find((p) => p.id === entry.partId)?.name ?? null)
    : null;

  const parsedNeed = parseCompositeNeed(entry.need || "");

  // Scale the Need textarea height to its content. Cap at 12 rows so a giant
  // paste doesn't push everything off the screen.
  const dynamicRows = Math.min(
    12,
    Math.max(3, Math.ceil((entry.need || "").length / 65)),
  );

  const expand = () => setIsExpanded(true);
  const collapse = () => setIsExpanded(false);

  return (
    <section className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700 print:mb-8 select-none">
      <button
        onClick={onDelete}
        className="absolute -left-12 top-2 bg-white border border-[#3A1E2A]/10 p-1.5 rounded-full text-[#B391A0] hover:text-[#C24E6E] hover:border-[#C24E6E]/30 opacity-0 group-hover:opacity-100 transition-all print:hidden z-10 shadow-xs cursor-pointer"
        title="Remove mapped value"
      >
        <Trash2 size={14} />
      </button>

      {!isExpanded ? (
        cessation ? (
          <EntryCondensedCessation
            entry={entry}
            partName={partName}
            parsedNeed={parsedNeed}
            onExpand={expand}
          />
        ) : (
          <EntryCondensed
            entry={entry}
            ifsBand={ifsBand}
            partName={partName}
            acceleratorsCount={acceleratorsCount}
            brakesCount={brakesCount}
            servesDriver={servesDriver}
            parsedNeed={parsedNeed}
            onChange={onChange}
            onExpand={expand}
          />
        )
      ) : cessation ? (
        <EntryExpandedCessation
          entry={entry}
          isDuplicate={isDuplicate}
          lensOpen={lensOpen}
          completion={completion}
          dynamicRows={dynamicRows}
          onChange={onChange}
          onToggleLens={onToggleLens}
          onToggleNvc={onToggleNvc}
          onCollapse={collapse}
        />
      ) : (
        <EntryExpanded
          entry={entry}
          isDuplicate={isDuplicate}
          lensOpen={lensOpen}
          completion={completion}
          dynamicRows={dynamicRows}
          servesDriver={servesDriver}
          parsedNeed={parsedNeed}
          onChange={onChange}
          onToggleLens={onToggleLens}
          onToggleNvc={onToggleNvc}
          onCollapse={collapse}
          onFocus={onFocus}
        />
      )}

      <EntryPrintSummary entry={entry} />
    </section>
  );
};
