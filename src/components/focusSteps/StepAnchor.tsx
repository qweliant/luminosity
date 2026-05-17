import { CORE_NEEDS, CORE_NEEDS_DETAIL } from "../../data";
import { maslowHighest, sdtProfile } from "../../derive";
import { BloomFlower } from "../bloom";
import { PartSelector } from "../PartSelector";
import type { FocusStepProps } from "./types";

// Step 3 — Madanes 6 Core Human Needs + optional IFS Part assignment.
// Derived SDT/Maslow footnotes surface once any signal exists. The Part
// selector is the only place new Parts are created.
export const StepAnchor = ({
  entry,
  parts,
  onUpsertPart,
  onChange,
}: FocusStepProps) => {
  const sdt = sdtProfile(entry);
  const maslow = maslowHighest(entry);
  const sdtTotal = sdt.autonomy + sdt.competence + sdt.relatedness;
  const dot = (n: number) =>
    "●".repeat(Math.min(n, 3)) + "○".repeat(Math.max(0, 3 - Math.min(n, 3)));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="space-y-3">
        {CORE_NEEDS.map((n) => {
          const sel = entry.coreNeed === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ coreNeed: sel ? "" : n })}
              className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                sel
                  ? "border-[#C24E6E] bg-[#FBD9E0]/30 shadow-2xs"
                  : "border-[#3A1E2A]/10 bg-white hover:border-[#E07A95]"
              }`}
            >
              <div>
                <div
                  className={`text-lg font-serif tracking-[-0.01em] ${
                    sel ? "text-[#C24E6E] font-medium" : "text-[#3A1E2A]"
                  }`}
                >
                  {n}
                </div>
                <div className="text-xs text-[#B391A0] mt-0.5 leading-snug">
                  {CORE_NEEDS_DETAIL[n]}
                </div>
              </div>

              {sel && (
                <span className="shrink-0 bg-[#C24E6E] text-white p-1 rounded-full">
                  <BloomFlower
                    size={14}
                    petal="#FFFFFF"
                    eye="#C24E6E"
                    smile={false}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {(sdtTotal > 0 || maslow) && (
        <div className="flex flex-wrap items-center gap-3 bg-[#FAE6E1]/50 rounded-xl px-3.5 py-2.5">
          {sdtTotal > 0 && (
            <>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#5A3645] font-semibold">
                SDT
              </span>
              <span className="font-mono text-[10.5px] text-[#5A3645]">
                autonomy{" "}
                <span className="text-[#C24E6E]">{dot(sdt.autonomy)}</span> ·
                competence{" "}
                <span className="text-[#C24E6E]">{dot(sdt.competence)}</span> ·
                relatedness{" "}
                <span className="text-[#C24E6E]">{dot(sdt.relatedness)}</span>
              </span>
            </>
          )}
          {maslow && (
            <span className="ml-auto font-mono text-[10px] text-[#B391A0]">
              Maslow · <span className="text-[#5A3645]">{maslow}</span>
            </span>
          )}
        </div>
      )}

      <div className="bg-white border border-[#3A1E2A]/5 rounded-xl p-4">
        <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
          <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold m-0 flex items-center gap-1">
            <BloomFlower size={12} petal="#E07A95" smile={false} /> Part · IFS
          </p>
          <a
            href="#/parts"
            className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold hover:underline"
          >
            see all parts →
          </a>
        </div>
        <p className="text-xs italic text-[#B391A0] mb-3 leading-snug">
          Which named identity is acting here? Type a name (e.g. "The People
          Pleaser") to create it, or pick one you've named before.
        </p>
        <PartSelector
          parts={parts}
          selectedId={entry.partId}
          onSelect={(name) => {
            const id = onUpsertPart(name);
            onChange({ partId: id ?? undefined });
          }}
          onClear={() => onChange({ partId: undefined })}
        />
      </div>
    </div>
  );
};
