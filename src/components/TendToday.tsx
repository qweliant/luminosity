import { useMemo } from "react";
import type { Mapping } from "../types";
import {
  hasCommitment,
  isCessationState,
  livedInWindow,
  practicedToday,
} from "../derive";
import { BloomFlower, LumiBean } from "./bloom";

// The daily "tend" surface — home-page counterpart to the discovery funnel.
// Lists the committed actions the user pre-decided and offers a single tap to
// mark the value *lived* today. Design constraints, all evidence-led:
//   · low friction — one tap, prefilled if-then, no forms;
//   · direction, not streaks — we show "lived N of the last 7 days", never a
//     breakable counter that punishes a miss;
//   · cessation-gated — a value whose current emotion is a cessation state is
//     withheld: those days ask for rest, not follow-through.

interface Props {
  entries: Mapping[];
  onLog: (id: string) => void;
  onFocus: (id: string) => void;
}

// A row of seven marks; the leading `lived` are bloomed. Pure direction — a
// gap doesn't reset anything, it just isn't filled.
const WeekDots = ({ lived }: { lived: number }) => (
  <span className="inline-flex items-center gap-0.5" aria-hidden="true">
    {Array.from({ length: 7 }).map((_, i) => (
      <BloomFlower
        key={i}
        size={9}
        petal={i < lived ? "#9CD3B6" : "#FAE6E1"}
        smile={false}
      />
    ))}
  </span>
);

export const TendToday = ({ entries, onLog, onFocus }: Props) => {
  const { toTend, tended } = useMemo(() => {
    const active = entries.filter(
      (e) => hasCommitment(e) && !isCessationState(e),
    );
    return {
      toTend: active.filter((e) => !practicedToday(e)),
      tended: active.filter((e) => practicedToday(e)),
    };
  }, [entries]);

  if (toTend.length === 0 && tended.length === 0) return null;

  return (
    <div className="mb-6 p-4 sm:p-5 bg-white rounded-[18px] border border-[#3A1E2A]/10 shadow-xs print:hidden">
      <div className="flex items-center gap-3 mb-3">
        <LumiBean size={34} />
        <div>
          <div className="font-mono text-[8.5px] text-[#C24E6E] tracking-[0.16em] uppercase font-bold">
            Tend today
          </div>
          <p className="font-serif italic text-sm text-[#5A3645] m-0 leading-snug">
            the small moves you pre-decided — tap when you live it
          </p>
        </div>
      </div>

      <ul className="space-y-2.5 list-none p-0 m-0">
        {toTend.map((e) => {
          const c = e.commitment!;
          const lived = livedInWindow(e);
          return (
            <li
              key={e.id}
              className="flex items-start gap-3 bg-[#FDF4F0] rounded-xl p-3 border border-[#3A1E2A]/5"
            >
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onFocus(e.id)}
                  className="font-serif text-base text-[#3A1E2A] hover:text-[#C24E6E] transition-colors cursor-pointer text-left leading-tight"
                >
                  {e.value || "this value"}
                </button>
                <p className="text-xs text-[#5A3645] leading-snug mt-0.5 m-0">
                  {c.cue?.trim() && (
                    <>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#B391A0]">
                        when{" "}
                      </span>
                      {c.cue.trim()}{" "}
                    </>
                  )}
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#B391A0]">
                    I will{" "}
                  </span>
                  <span className="text-[#3A1E2A]">{c.action.trim()}</span>
                </p>
                {lived > 0 && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <WeekDots lived={lived} />
                    <span className="font-mono text-[9px] text-[#B391A0] tracking-wide">
                      lived {lived} of the last 7 days
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onLog(e.id)}
                className="shrink-0 bg-[#C24E6E] text-white px-3 py-1.5 rounded-full font-sans text-[11px] font-medium hover:bg-[#3A1E2A] transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                title="Mark this value lived today"
              >
                <BloomFlower size={11} petal="#FFFFFF" eye="#C24E6E" smile={false} />
                lived it
              </button>
            </li>
          );
        })}
      </ul>

      {tended.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dashed border-[#3A1E2A]/10">
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#9CD3B6] font-bold">
              tended today ✿
            </span>
            {tended.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => onLog(e.id)}
                title="Tap to undo today's mark"
                className="font-serif italic text-xs text-[#5A3645] hover:text-[#C24E6E] transition-colors cursor-pointer"
              >
                {e.value || "this value"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
