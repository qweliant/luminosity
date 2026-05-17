import { memo, useCallback } from "react";
import type { Mapping, Part } from "../types";
import { EntrySection } from "./EntrySection";

interface EntryRowProps {
  entry: Mapping;
  parts: Part[];
  isDuplicate: boolean;
  lensOpen: boolean;
  onToggleLens: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Mapping>) => void;
  onDelete: (id: string) => void;
  onToggleNvc: (id: string, need: string) => void;
  onFocus: (id: string) => void;
}

/**
 * Memoized wrapper around EntrySection. Binds the parent's id-taking
 * handlers to this row's entry once per id+handler identity, so as long as
 * the parent passes stable callbacks, an unrelated entry's update doesn't
 * re-render this row.
 */
export const EntryRow = memo(function EntryRow({
  entry,
  parts,
  isDuplicate,
  lensOpen,
  onToggleLens,
  onUpdate,
  onDelete,
  onToggleNvc,
  onFocus,
}: EntryRowProps) {
  const id = entry.id;
  const toggleLens = useCallback(() => onToggleLens(id), [id, onToggleLens]);
  const change = useCallback(
    (patch: Partial<Mapping>) => onUpdate(id, patch),
    [id, onUpdate],
  );
  const remove = useCallback(() => onDelete(id), [id, onDelete]);
  const toggleNvc = useCallback(
    (need: string) => onToggleNvc(id, need),
    [id, onToggleNvc],
  );
  const focus = useCallback(() => onFocus(id), [id, onFocus]);

  return (
    <EntrySection
      entry={entry}
      parts={parts}
      isDuplicate={isDuplicate}
      lensOpen={lensOpen}
      onToggleLens={toggleLens}
      onChange={change}
      onDelete={remove}
      onToggleNvc={toggleNvc}
      onFocus={focus}
    />
  );
});
