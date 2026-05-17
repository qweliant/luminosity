import type { Mapping } from "../types";
import type { LensCompletion } from "../derive";
import type { ParsedNeed } from "../parsedNeed";
import { EMOTION_PLACES_BY_ID, findEmotion } from "../data";
import { BloomFlower, BrakeMark, BloomWorkability } from "./bloom";
import { CompletionBar } from "./primitives";
import { LensPanel } from "./LensPanel";

interface Props {
  entry: Mapping;
  isDuplicate: boolean;
  lensOpen: boolean;
  completion: LensCompletion;
  dynamicRows: number;
  servesDriver: string;
  parsedNeed: ParsedNeed;
  onChange: (patch: Partial<Mapping>) => void;
  onToggleLens: () => void;
  onToggleNvc: (need: string) => void;
  onCollapse: () => void;
  onFocus: () => void;
}

/**
 * Active-edit expanded card. Left column: friction + Atlas diagnostic +
 * relational accountability block. Right column: the editable Need plus
 * either parsed-out extracted fragments (legacy text) or the typed
 * Reframe/Prototype fallback grid + Nagoski accelerators/brakes. Footer:
 * lens toggle, completion bar, fold-back, and the Focus CTA.
 */
export const EntryExpanded = ({
  entry,
  isDuplicate,
  lensOpen,
  completion,
  dynamicRows,
  servesDriver,
  parsedNeed,
  onChange,
  onToggleLens,
  onToggleNvc,
  onCollapse,
  onFocus,
}: Props) => (
  <div className="bg-[#FFFFFF] rounded-[18px] border border-[#3A1E2A]/15 p-6 shadow-sm transition-all">
    {/* Header row */}
    <div className="flex items-baseline gap-3 pb-4 mb-5 border-b border-dashed border-[#3A1E2A]/10">
      <BloomFlower size={20} petal="#E07A95" />
      <input
        className="font-serif text-2xl sm:text-3xl text-[#3A1E2A] bg-transparent focus:outline-none placeholder:text-[#B391A0]/50 flex-1"
        value={entry.value}
        onChange={(e) => onChange({ value: e.target.value })}
        placeholder="Name this core value..."
      />
      <BloomWorkability
        value={entry.workability ?? 0}
        onChange={(n) => onChange({ workability: n })}
      />
    </div>

    {isDuplicate && (
      <p className="-mt-3 mb-4 text-[10px] uppercase tracking-[0.2em] text-red-500 bg-red-50 p-2 rounded-lg print:hidden">
        ✿ Duplicate detected — values must carry unique names to index
        properly.
      </p>
    )}

    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 sm:gap-8 items-start">
      {/* LEFT: friction + Atlas + relational accountability */}
      <div className="flex flex-col gap-5">
        <div>
          <label className="text-[9.5px] uppercase tracking-[0.18em] text-[#5A3645] font-semibold block mb-1">
            The friction
          </label>
          <textarea
            className="w-full bg-transparent focus:outline-none text-xs sm:text-sm text-[#5A3645] leading-relaxed resize-none placeholder:text-[#B391A0]/40 border border-transparent focus:border-[#FAE6E1] rounded-lg p-1 -ml-1"
            value={entry.friction}
            onChange={(e) => onChange({ friction: e.target.value })}
            placeholder="What feels sticky or exhausting right now?"
            rows={3}
          />

          {entry.emotionCluster &&
            (() => {
              const place = EMOTION_PLACES_BY_ID[entry.emotionCluster];
              const emo = findEmotion(entry.emotionCluster, entry.emotion);
              const cessation = !!emo?.cessation;
              return (
                <div className="mt-1 bg-[#FDF4F0] p-2 rounded-lg border border-[#3A1E2A]/5">
                  <p
                    className={`text-[11px] italic ${
                      cessation
                        ? "text-amber-700 font-medium"
                        : "text-[#C24E6E]"
                    }`}
                  >
                    {cessation ? "⚠️ Pause here · " : "✿ Closest match · "}
                    {entry.emotion ? `${entry.emotion.toLowerCase()} · ` : ""}
                    <span className="text-[#5A3645] not-italic font-sans text-[10px] block mt-0.5">
                      {place?.label}
                    </span>
                  </p>
                </div>
              );
            })()}
        </div>

        {entry.relational?.active && (
          <div className="bg-[#FAE6E1]/30 p-3.5 rounded-xl border border-dashed border-[#C24E6E]/30">
            <div className="flex items-center gap-1.5 mb-2">
              <BloomFlower size={12} petal="#C24E6E" smile={false} />
              <span className="text-[9px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold">
                Accountability
              </span>
            </div>

            {entry.relational.source && (
              <p className="font-serif italic text-xs text-[#3A1E2A] mb-3 pb-2 border-b border-[#3A1E2A]/5 capitalize">
                Source: {entry.relational.source.replace("_", " ")}
              </p>
            )}

            {(() => {
              const r = entry.relational;
              const checks = [
                r.focusSelf,
                r.intentValue,
                r.isRequest,
                r.preservesAutonomy,
              ];
              const passed = checks.filter((c) => c === true).length;
              const isEvaluated = checks.some((c) => c !== undefined);

              return (
                <div>
                  <div className="flex justify-between items-center mb-1 font-mono text-[9px] text-[#5A3645]">
                    <span>Stress Test</span>
                    <span
                      className={
                        passed === 4
                          ? "text-[#9CD3B6] font-bold"
                          : "text-[#C24E6E]"
                      }
                    >
                      {isEvaluated ? `${passed}/4 passed` : "pending"}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#5A3645] font-mono tracking-tighter bg-white/80 p-2 rounded border border-[#3A1E2A]/5">
                    {passed === 4 ? (
                      <span className="text-[#1F6E4A] font-sans font-medium">
                        ✨ Clean boundary statement. Zero coercive demands
                        leaking out.
                      </span>
                    ) : (
                      <span className="text-[#C24E6E] font-sans italic">
                        ⚠️ Unvetted Rule: Intercepting demand. Adjust reframe
                        to honor autonomy.
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* RIGHT: need manifesto + extracted/typed design fragments */}
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <BloomFlower size={12} petal="#C24E6E" smile={false} />
            <label className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold block">
              The need manifesto
            </label>
          </div>

          <textarea
            className="w-full bg-transparent focus:outline-none font-serif italic text-base sm:text-lg text-[#3A1E2A] leading-relaxed resize-none placeholder:text-[#B391A0]/40 border border-transparent focus:border-[#FAE6E1] rounded-lg p-1 -ml-1 custom-scrollbar"
            value={entry.need}
            onChange={(e) => onChange({ need: e.target.value })}
            placeholder="To honor this value, I non-negotiably require..."
            rows={dynamicRows}
          />

          {entry.nvcNeeds && entry.nvcNeeds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {entry.nvcNeeds.map((n) => (
                <span
                  key={n}
                  className="font-sans text-[11px] bg-[#FBD9E0] text-[#C24E6E] px-2.5 py-0.5 rounded-full"
                >
                  {n}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2.5 flex items-baseline gap-2 font-sans text-xs text-[#B391A0]">
            <span className="text-[8.5px] uppercase tracking-[0.18em] font-bold text-[#5A3645]">
              serves →
            </span>
            <span className="font-serif italic text-sm text-[#C24E6E]">
              {servesDriver}
            </span>
          </div>
        </div>

        {parsedNeed.hasExtracted && (
          <div className="bg-[#FAE6E1]/20 p-3.5 rounded-xl border border-dashed border-[#3A1E2A]/10 space-y-3">
            <div className="text-[9px] uppercase tracking-[0.2em] text-[#B391A0] font-mono">
              ✿ Extracted from your existing Need text
            </div>

            {(parsedNeed.reframe || parsedNeed.prototype) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {parsedNeed.reframe && (
                  <div className="bg-[#FFF5DC] p-3 rounded-xl border border-[#3A1E2A]/5">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-[#5A3645] font-bold mb-1 flex items-center gap-1">
                      <span>↺</span> Reframe
                    </div>
                    <p className="text-xs text-[#3A1E2A] leading-relaxed whitespace-pre-wrap">
                      {parsedNeed.reframe}
                    </p>
                  </div>
                )}
                {parsedNeed.prototype && (
                  <div className="bg-[#9CD3B6]/20 p-3 rounded-xl border border-[#3A1E2A]/5">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-[#1F6E4A] font-bold mb-1 flex items-center gap-1">
                      <span>◆</span> Prototype
                    </div>
                    <p className="text-xs text-[#3A1E2A] leading-relaxed whitespace-pre-wrap">
                      {parsedNeed.prototype}
                    </p>
                  </div>
                )}
              </div>
            )}

            {(parsedNeed.accelerators || parsedNeed.brakes) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#3A1E2A]/5">
                {parsedNeed.accelerators && (
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-1">
                      ✿ Accelerators
                    </div>
                    <p className="text-xs font-mono text-[#5A3645]">
                      {parsedNeed.accelerators}
                    </p>
                  </div>
                )}
                {parsedNeed.brakes && (
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.18em] text-[#5A3645] font-bold mb-1">
                      ⚠ Brakes to watch
                    </div>
                    <p className="text-xs font-mono text-[#B391A0]">
                      {parsedNeed.brakes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!parsedNeed.hasExtracted && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#3A1E2A]/5">
            <div className="bg-[#FFF5DC] p-3 rounded-xl border border-[#3A1E2A]/5">
              <div className="text-[9px] uppercase tracking-[0.18em] text-[#5A3645] font-bold mb-1 flex items-center gap-1">
                <span>↺</span> Reframe
              </div>
              <p className="text-xs text-[#3A1E2A] leading-relaxed">
                {entry.lifeDesign?.reframeNote ||
                  entry.lifeDesign?.acceptanceNote || (
                    <span className="text-[#B391A0]/50 italic">
                      No reframing written yet...
                    </span>
                  )}
              </p>
            </div>

            <div className="bg-[#9CD3B6]/20 p-3 rounded-xl border border-[#3A1E2A]/5">
              <div className="text-[9px] uppercase tracking-[0.18em] text-[#1F6E4A] font-bold mb-1 flex items-center gap-1">
                <span>◆</span> Prototype
                <span className="font-normal lowercase">
                  · {entry.lifeDesign?.prototype?.mode ?? "do"}
                </span>
              </div>
              <p className="text-xs text-[#3A1E2A] leading-relaxed">
                {entry.lifeDesign?.prototype?.action || (
                  <span className="text-[#B391A0]/50 italic">
                    No experiments queued...
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {!parsedNeed.hasExtracted && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-1 flex items-center gap-1">
                <BloomFlower size={10} petal="#E07A95" smile={false} />
                Accelerators
              </div>
              <p className="text-xs font-mono text-[#5A3645]">
                {entry.accelerators ? (
                  entry.accelerators.split(",").join(" ✿ ")
                ) : (
                  <span className="text-[#B391A0]/40 font-sans italic">
                    None noted
                  </span>
                )}
              </p>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-[#5A3645] font-bold mb-1 flex items-center gap-1">
                <BrakeMark size={10} /> Brakes to watch
              </div>
              <p className="text-xs font-mono text-[#B391A0]">
                {entry.brakes ? (
                  entry.brakes.split(",").join(" ✿ ")
                ) : (
                  <span className="text-[#B391A0]/40 font-sans italic">
                    None noted
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Footer chrome */}
    <div className="mt-6 pt-4 border-t border-dashed border-[#3A1E2A]/10 flex items-center gap-4 flex-wrap print:hidden bg-[#FDF4F0] -mx-6 -mb-6 p-4 rounded-b-[18px]">
      <button
        onClick={onToggleLens}
        className="text-[9.5px] uppercase tracking-[0.25em] text-[#C24E6E] hover:text-[#3A1E2A] transition-colors font-semibold cursor-pointer"
      >
        {lensOpen ? "✿ Hide lenses" : "+ Apply lenses"}
      </button>
      <CompletionBar completion={completion} />

      <button
        onClick={onCollapse}
        className="text-[9.5px] uppercase tracking-[0.2em] text-[#5A3645] hover:text-[#C24E6E] transition-colors ml-auto font-bold cursor-pointer"
      >
        fold back ↑
      </button>

      <button
        onClick={onFocus}
        className="bg-[#C24E6E] text-white px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] hover:bg-[#3A1E2A] transition-colors shadow-xs cursor-pointer"
        title="Open this value in focus mode"
      >
        focus ✿
      </button>
    </div>

    {lensOpen && (
      <div className="mt-8 pt-4 border-t border-[#3A1E2A]/10 animate-in fade-in duration-200">
        <LensPanel
          entry={entry}
          onChange={onChange}
          onToggleNvc={onToggleNvc}
        />
      </div>
    )}
  </div>
);
