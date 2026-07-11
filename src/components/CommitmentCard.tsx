import type { Mapping, Commitment, PrototypeMode } from "../types";
import { BloomFlower } from "./bloom";

// Committed-action card — the reinforcement loop's on-ramp. Renders at the end
// of the Synthesize step (non-cessation only) and turns the drafted Need into
// a Gollwitzer implementation intention: WHEN <cue>, I WILL <tiny action>,
// because it honors <value>. If-then plans roughly double follow-through
// (meta-analytic d ≈ 0.65) precisely because the cue does the remembering, not
// willpower — which is the "low friction" the whole feature is chasing.
//
// Seeds itself from what the funnel already captured: the cue from the friction
// the user named, the action from any Stanford prototype they drafted. Pure
// composition over entry.commitment — no new plumbing beyond onChange.

interface Props {
  entry: Mapping;
  onChange: (patch: Partial<Mapping>) => void;
}

// First sentence / clause of the friction, as a starting cue suggestion.
const firstClause = (s: string): string => {
  const trimmed = s.trim();
  if (!trimmed) return "";
  const cut = trimmed.split(/(?<=[.!?])\s|\n/)[0] ?? trimmed;
  return cut.length > 90 ? `${cut.slice(0, 88).trimEnd()}…` : cut;
};

export const CommitmentCard = ({ entry, onChange }: Props) => {
  const c = entry.commitment;
  const value = entry.value?.trim() || "this value";

  const cueSeed = firstClause(entry.friction || "");
  const actionSeed = entry.lifeDesign?.prototype?.action?.trim() ?? "";
  const mode: PrototypeMode = c?.mode ?? entry.lifeDesign?.prototype?.mode ?? "do";

  // Merge a partial into the stored commitment, preserving createdAt (or
  // stamping it on first write). Empty cue+action clears the commitment so a
  // half-typed then-deleted plan doesn't linger.
  const patch = (next: Partial<Commitment>) => {
    const merged: Commitment = {
      cue: c?.cue ?? "",
      action: c?.action ?? "",
      mode: c?.mode ?? mode,
      createdAt: c?.createdAt ?? Date.now(),
      ...next,
    };
    if (!merged.cue.trim() && !merged.action.trim()) {
      onChange({ commitment: undefined });
      return;
    }
    onChange({ commitment: merged });
  };

  const useSeed = () =>
    patch({
      cue: c?.cue?.trim() ? c.cue : cueSeed,
      action: c?.action?.trim() ? c.action : actionSeed,
    });

  const canSeed = !c && (cueSeed || actionSeed);

  return (
    <div className="bg-white p-5 rounded-xl border border-[#3A1E2A]/10">
      <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
        <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold flex items-center gap-1 m-0">
          <BloomFlower size={12} petal="#E07A95" smile={false} /> Committed action
          <span className="text-[#B391A0] font-normal lowercase tracking-normal">
            · the if-then that carries this out
          </span>
        </p>
        {canSeed && (
          <button
            type="button"
            onClick={useSeed}
            className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold hover:underline cursor-pointer"
          >
            seed from above ✿
          </button>
        )}
      </div>
      <p className="text-xs italic text-[#B391A0] mb-4 leading-snug">
        Pre-decide one tiny move so the moment decides for you. Small beats
        ambitious — the point is that it actually happens.
      </p>

      <div className="space-y-3">
        <label className="block">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#5A3645] font-bold font-mono">
            When
          </span>
          <textarea
            rows={2}
            value={c?.cue ?? ""}
            onChange={(e) => patch({ cue: e.target.value })}
            placeholder={cueSeed || "…a specific moment or trigger arises"}
            className="w-full mt-1 bg-[#FDF4F0] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#E07A95] font-serif italic text-base text-[#3A1E2A] leading-relaxed resize-none placeholder:text-[#B391A0]/50 select-text custom-scrollbar"
          />
        </label>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#5A3645] font-bold font-mono">
            I will
          </span>
          <div className="flex gap-1.5">
            {(["do", "talk"] as PrototypeMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => patch({ mode: m })}
                className={`px-2.5 py-0.5 rounded-full font-sans text-[10px] font-medium transition-colors cursor-pointer ${
                  mode === m
                    ? "bg-[#C24E6E] text-white"
                    : "bg-[#FAE6E1]/60 text-[#5A3645] hover:bg-[#FAE6E1]"
                }`}
              >
                {m === "do" ? "do something" : "have a conversation"}
              </button>
            ))}
          </div>
        </div>
        <textarea
          rows={2}
          value={c?.action ?? ""}
          onChange={(e) => patch({ action: e.target.value })}
          placeholder={actionSeed || "…one small, concrete thing"}
          className="w-full bg-[#FDF4F0] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#E07A95] font-serif italic text-base text-[#3A1E2A] leading-relaxed resize-none placeholder:text-[#B391A0]/50 select-text custom-scrollbar"
        />

        <p className="font-serif italic text-[12.5px] text-[#5A3645] leading-snug pt-1">
          …because it honors{" "}
          <span className="text-[#C24E6E] font-medium not-italic">{value}</span>.
        </p>
      </div>

      {(c?.cue?.trim() || c?.action?.trim()) && (
        <p className="mt-3 text-[10px] text-[#B391A0] font-mono tracking-wide flex items-center gap-1">
          <BloomFlower size={10} petal="#9CD3B6" smile={false} /> saved — this
          resurfaces on your home page to tend
        </p>
      )}
    </div>
  );
};
