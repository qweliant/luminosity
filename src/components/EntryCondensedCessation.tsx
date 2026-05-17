import type { Mapping } from "../types";
import type { ParsedNeed } from "../parsedNeed";
import { BloomFlower } from "./bloom";

interface Props {
  entry: Mapping;
  partName: string | null;
  parsedNeed: ParsedNeed;
  onExpand: () => void;
}

/**
 * Condensed-row variant for entries in a cessation state (the synthesizer
 * refuses to draft from here). Amber chrome, no prototype/reframe chips, no
 * focus CTA — the row matches the system's "stay with this, don't act"
 * stance. Click anywhere to expand.
 */
export const EntryCondensedCessation = ({
  entry,
  partName,
  parsedNeed,
  onExpand,
}: Props) => (
  <div
    onClick={onExpand}
    className="relative overflow-hidden rounded-[18px] border border-[#D6A24A]/30 p-4 sm:p-5 hover:border-[#D6A24A]/60 transition-colors shadow-xs cursor-pointer"
    style={{ background: "linear-gradient(180deg, #FFFAF0 0%, #FDF4F0 100%)" }}
  >
    <div
      aria-hidden
      className="absolute -top-2 -right-2 w-16 h-16 overflow-hidden opacity-40 pointer-events-none"
    >
      <BloomFlower size={60} petal="#F7D679" smile={false} />
    </div>

    <div className="relative">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[13px] text-[#8B6914]">⏸</span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-[#8B6914] font-bold">
          Pause here
          {entry.emotion ? ` · ${entry.emotion.toLowerCase()}` : ""}
        </span>
      </div>

      <div className="flex items-baseline gap-3 mb-3">
        <h3 className="font-serif text-xl sm:text-2xl text-[#3A1E2A] m-0 flex-1 leading-tight">
          {entry.value || (
            <span className="text-[#B391A0]/60 italic">Core Value ✿</span>
          )}
        </h3>
        {partName && (
          <span
            className="font-serif italic text-[12px] text-[#8B6914] bg-[#FFF1D6] border border-[#D6A24A]/40 px-2.5 py-0.5 rounded-full"
            title={`Part · ${partName}`}
          >
            {partName}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 sm:gap-6 items-start">
        <div>
          <div className="text-[9.5px] uppercase tracking-[0.18em] text-[#B391A0] font-semibold mb-1">
            The friction
          </div>
          <p className="text-xs text-[#5A3645] leading-relaxed line-clamp-2 m-0">
            {entry.friction || (
              <span className="text-[#B391A0]/60 italic">—</span>
            )}
          </p>
        </div>
        <div>
          <div className="text-[9.5px] uppercase tracking-[0.18em] text-[#8B6914] font-semibold mb-1">
            What this needs
          </div>
          <p className="font-serif text-[15px] text-[#3A1E2A] leading-snug m-0">
            {parsedNeed.core || entry.need || (
              <span className="text-[#B391A0]/60 not-italic font-sans text-xs">
                Witness, not solve.
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-dashed border-[#D6A24A]/30 flex items-center gap-3 flex-wrap">
        <span className="font-serif italic text-[11.5px] text-[#B391A0]">
          prototype + reframe hidden — we don't design from inside this
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 text-[9.5px] uppercase tracking-[0.18em] font-semibold text-[#8B6914] border border-[#D6A24A]/50 rounded-full">
          <span>⏸</span> stay here with this
        </span>
      </div>
    </div>
  </div>
);
