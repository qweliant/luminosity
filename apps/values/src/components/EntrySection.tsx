import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Mapping, Part } from "../types";
import { isCessationState, lensCompletion } from "../derive";
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

  // Delete is destructive and has no undo, so it's a two-tap arm/confirm.
  // Position: on mobile an always-visible corner control (the old hover-in-the-
  // left-gutter button sat off-screen and never appeared on touch); on desktop
  // (sm+) it reverts to the subtle hover-reveal in the left gutter.
  const [armDelete, setArmDelete] = useState(false);
  useEffect(() => {
    if (!armDelete) return;
    const t = setTimeout(() => setArmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [armDelete]);

  return (
    <section className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700 print:mb-8 select-none">
      <button
        onClick={() => (armDelete ? onDelete() : setArmDelete(true))}
        onBlur={() => setArmDelete(false)}
        className={`absolute z-10 inline-flex items-center justify-center transition-all print:hidden shadow-xs cursor-pointer border rounded-full
          -top-2.5 -right-2.5 sm:top-2 sm:right-auto sm:-left-12
          opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100
          ${
            armDelete
              ? "bg-[#C24E6E] text-white border-[#C24E6E] px-3 min-h-10 sm:min-h-8 text-[10px] font-bold uppercase tracking-wider"
              : "bg-white text-[#B391A0] border-[#3A1E2A]/10 hover:text-[#C24E6E] hover:border-[#C24E6E]/30 min-h-10 min-w-10 sm:min-h-0 sm:min-w-0 sm:p-1.5"
          }`}
        title={armDelete ? "Tap again to remove" : "Remove this value"}
        aria-label={armDelete ? "Confirm remove this value" : "Remove this value"}
      >
        {armDelete ? "delete?" : <Trash2 size={15} />}
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
            partName={partName}
            acceleratorsCount={acceleratorsCount}
            brakesCount={brakesCount}
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
          partName={partName}
          isDuplicate={isDuplicate}
          lensOpen={lensOpen}
          completion={completion}
          dynamicRows={dynamicRows}
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
