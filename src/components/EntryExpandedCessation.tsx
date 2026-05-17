import type { Mapping } from "../types";
import type { LensCompletion } from "../derive";
import { BloomFlower } from "./bloom";
import { CompletionBar } from "./primitives";
import { LensPanel } from "./LensPanel";

interface Props {
  entry: Mapping;
  isDuplicate: boolean;
  lensOpen: boolean;
  completion: LensCompletion;
  dynamicRows: number;
  onChange: (patch: Partial<Mapping>) => void;
  onToggleLens: () => void;
  onToggleNvc: (need: string) => void;
  onCollapse: () => void;
}

/**
 * Cessation-state expanded card. Amber chrome, no prototype/reframe inputs,
 * no focus CTA. The compassion sentence (in `entry.need`) is the only thing
 * foregrounded; everything else is held quietly.
 */
export const EntryExpandedCessation = ({
  entry,
  isDuplicate,
  lensOpen,
  completion,
  dynamicRows,
  onChange,
  onToggleLens,
  onToggleNvc,
  onCollapse,
}: Props) => (
  <div
    className="relative overflow-hidden rounded-[18px] border border-[#D6A24A]/30 p-6 shadow-sm"
    style={{ background: "linear-gradient(180deg, #FFFAF0 0%, #FDF4F0 100%)" }}
  >
    <div
      aria-hidden
      className="absolute -top-5 -right-5 opacity-35 pointer-events-none"
    >
      <BloomFlower size={90} petal="#F7D679" smile={false} />
    </div>

    <div className="relative">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[14px] text-[#8B6914]">⏸</span>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#8B6914] font-bold">
          Pause here
          {entry.emotion ? ` · ${entry.emotion.toLowerCase()}` : ""}
        </span>
      </div>
      <input
        className="font-serif text-2xl sm:text-3xl text-[#3A1E2A] bg-transparent focus:outline-none placeholder:text-[#B391A0]/50 w-full"
        value={entry.value}
        onChange={(e) => onChange({ value: e.target.value })}
        placeholder="Name this core value..."
      />
      <p className="font-serif italic text-[13.5px] text-[#5A3645] leading-relaxed max-w-[480px] m-0 mt-2 mb-5">
        You've tagged this with a cessation state
        {entry.emotion ? ` — ${entry.emotion.toLowerCase()}, this time` : ""}.
        The app is going to step back from prescribing anything.
      </p>

      {isDuplicate && (
        <p className="-mt-2 mb-3 text-[10px] uppercase tracking-[0.2em] text-[#8B6914] bg-[#FFF1D6] p-2 rounded-lg">
          ⏸ Duplicate detected — values must carry unique names.
        </p>
      )}

      <div className="bg-white border border-[#D6A24A]/30 rounded-2xl px-5 py-5 mb-5 shadow-xs">
        <div className="text-[9px] uppercase tracking-[0.2em] text-[#8B6914] font-bold mb-2">
          What this needs
        </div>
        <textarea
          className="w-full bg-transparent focus:outline-none font-serif text-xl text-[#3A1E2A] leading-snug resize-none placeholder:text-[#B391A0]/40 border border-transparent focus:border-[#D6A24A]/40 rounded-lg p-1 -ml-1"
          value={entry.need}
          onChange={(e) => onChange({ need: e.target.value })}
          placeholder="To be witnessed, not solved..."
          rows={dynamicRows}
        />
        <p className="font-serif italic text-[12px] text-[#B391A0] m-0 mt-2 leading-relaxed">
          — a compassion sentence, drafted from the cessation template. Edit
          as you wish.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-5 pt-4 border-t border-dashed border-[#D6A24A]/30">
        <div>
          <div className="text-[9.5px] uppercase tracking-[0.18em] text-[#B391A0] font-semibold mb-1">
            The friction
          </div>
          <textarea
            className="w-full bg-transparent focus:outline-none text-[12.5px] text-[#5A3645] leading-relaxed resize-none placeholder:text-[#B391A0]/40 border border-transparent focus:border-[#D6A24A]/40 rounded-lg p-1 -ml-1"
            value={entry.friction}
            onChange={(e) => onChange({ friction: e.target.value })}
            placeholder="What feels sticky or exhausting right now?"
            rows={3}
          />
        </div>
        <div>
          <div className="text-[9.5px] uppercase tracking-[0.18em] text-[#B391A0] font-semibold mb-2">
            Held quietly · for later
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dashed border-[#D6A24A]/40">
              <span className="text-[13px] text-[#8B6914]">◆</span>
              <span className="font-serif italic text-[11.5px] text-[#B391A0]">
                Prototype hidden — we don't design from inside this.
              </span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dashed border-[#D6A24A]/40">
              <span className="text-[13px] text-[#8B6914]">↺</span>
              <span className="font-serif italic text-[11.5px] text-[#B391A0]">
                Reframe hidden — the feeling isn't a problem to reframe.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-dashed border-[#D6A24A]/30 flex items-center gap-4 flex-wrap">
        <button
          onClick={onToggleLens}
          className="text-[9.5px] uppercase tracking-[0.22em] text-[#8B6914] hover:text-[#3A1E2A] transition-colors font-semibold cursor-pointer"
        >
          {lensOpen ? "⏸ Hide lenses" : "+ Apply lenses (quietly)"}
        </button>
        <CompletionBar completion={completion} />
        <button
          onClick={onCollapse}
          className="text-[9.5px] uppercase tracking-[0.2em] text-[#5A3645] hover:text-[#8B6914] transition-colors ml-auto font-bold cursor-pointer"
        >
          fold back ↑
        </button>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 text-[9.5px] uppercase tracking-[0.18em] font-semibold text-[#8B6914] border border-[#D6A24A]/60 rounded-full"
          title="No CTA on purpose. The synthesizer will offer presence, not a plan."
        >
          <span>⏸</span> stay here with this
        </span>
      </div>

      {lensOpen && (
        <div className="mt-8 pt-4 border-t border-[#D6A24A]/30 animate-in fade-in duration-200">
          <LensPanel
            entry={entry}
            onChange={onChange}
            onToggleNvc={onToggleNvc}
          />
        </div>
      )}
    </div>
  </div>
);
