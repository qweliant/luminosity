import type { Mapping } from "../types";
import type { IfsLayer } from "../derive";
import type { ParsedNeed } from "../parsedNeed";
import { BloomFlower, BloomWorkability } from "./bloom";
import { EntryStatusPills } from "./EntryStatusPills";

interface Props {
  entry: Mapping;
  ifsBand: IfsLayer | null;
  partName: string | null;
  acceleratorsCount: number;
  brakesCount: number;
  servesDriver: string;
  parsedNeed: ParsedNeed;
  onChange: (patch: Partial<Mapping>) => void;
  onExpand: () => void;
}

/**
 * Default condensed-row view — scannable summary of one entry, with the
 * value title, workability dots, friction/need columns, a long-text expand
 * hint, and the status pill strip footer. Click anywhere outside the
 * workability dots to expand.
 */
export const EntryCondensed = ({
  entry,
  ifsBand,
  partName,
  acceleratorsCount,
  brakesCount,
  servesDriver,
  parsedNeed,
  onChange,
  onExpand,
}: Props) => (
  <div className="bg-[#FFFFFF] rounded-[18px] border border-[#3A1E2A]/10 p-4 sm:p-5 hover:border-[#E07A95]/40 transition-colors shadow-xs">
    <div className="flex items-baseline gap-3 mb-2">
      <BloomFlower size={16} petal="#E07A95" smile={false} />
      <input
        className="font-serif text-xl sm:text-2xl text-[#3A1E2A] bg-transparent focus:outline-none placeholder:text-[#B391A0]/50 flex-1 cursor-pointer select-none"
        value={entry.value}
        onChange={(e) => onChange({ value: e.target.value })}
        onClick={onExpand}
        placeholder="Core Value ✿"
        readOnly
      />
      <BloomWorkability
        value={entry.workability ?? 0}
        onChange={(n) => onChange({ workability: n })}
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 sm:gap-6 pt-1 items-start">
      <div onClick={onExpand} className="cursor-pointer group/col">
        <div className="text-[9.5px] uppercase tracking-[0.18em] text-[#B391A0] font-semibold mb-1">
          Friction
        </div>
        <p className="text-xs text-[#5A3645] leading-relaxed line-clamp-2 group-hover/col:text-[#3A1E2A]">
          {entry.friction || (
            <span className="text-[#B391A0]/60 italic">
              nothing in the way today ✿
            </span>
          )}
        </p>
      </div>

      <div
        onClick={onExpand}
        className="cursor-pointer group/col flex flex-col justify-between h-full"
      >
        <div>
          <div className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold mb-1 flex items-center gap-1">
            Need
            <span className="text-[#B391A0] font-normal lowercase tracking-normal">
              · serves {servesDriver}
            </span>
          </div>

          <p className="font-serif italic text-sm text-[#3A1E2A] leading-relaxed line-clamp-2 group-hover/col:text-[#C24E6E]">
            {parsedNeed.core || entry.need || (
              <span className="text-[#B391A0]/60 not-italic font-sans">
                Click to start drafting…
              </span>
            )}
          </p>
        </div>

        {(entry.need || "").length > 120 && (
          <div className="mt-2 inline-flex items-center gap-1 bg-[#FBD9E0]/40 text-[#C24E6E] px-2.5 py-1 rounded-full font-sans text-[10px] font-medium self-start group-hover/col:bg-[#FBD9E0]">
            <BloomFlower size={10} petal="#E07A95" smile={false} />
            <span>Expand to read the full Need ↓</span>
          </div>
        )}

        <EntryStatusPills
          entry={entry}
          ifsBand={ifsBand}
          partName={partName}
          acceleratorsCount={acceleratorsCount}
          brakesCount={brakesCount}
          parsedNeed={parsedNeed}
        />
      </div>
    </div>
  </div>
);
