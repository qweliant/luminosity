import { EMOTION_PLACES_BY_ID, findEmotion } from "../../data";
import { BloomWorkability } from "../bloom";
import { EmotionPicker } from "../EmotionPicker";
import { UnblendFrame } from "../UnblendFrame";
import type { FocusStepProps } from "./types";

// Step 1 — a 1–5 "how's it going" rating, a note on what's in the way, and a
// closest-feeling pick.
export const StepDiagnose = ({ entry, parts, onChange }: FocusStepProps) => {
  const partName = entry.partId
    ? (parts.find((p) => p.id === entry.partId)?.name ?? null)
    : null;
  const emo = findEmotion(entry.emotionCluster, entry.emotion);
  const place = entry.emotionCluster
    ? EMOTION_PLACES_BY_ID[entry.emotionCluster]
    : undefined;
  const emotionLabel = entry.emotion ?? place?.label ?? null;
  const cessation = !!emo?.cessation;

  return (
    <div className="space-y-8 animate-in fade-in duration-200 select-none">
      <div className="bg-white p-4 rounded-xl border border-[#3A1E2A]/5">
        <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-2">
          1. How's it going
        </p>
        <div className="flex gap-4 items-center">
          <BloomWorkability
            value={entry.workability ?? 0}
            onChange={(n) => onChange({ workability: n })}
            size={22}
            toggleable
          />
          <span className="font-mono text-xs text-[#5A3645] uppercase tracking-widest font-bold">
            {entry.workability
              ? entry.workability <= 2
                ? "stuck ✿"
                : entry.workability === 3
                  ? "mixed ✿"
                  : "working ✨"
              : "unrated"}
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-[#3A1E2A]/5">
        <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#5A3645] font-bold mb-2">
          2. What's in the way
        </p>
        <UnblendFrame
          partName={partName}
          emotionLabel={emotionLabel}
          cessation={cessation}
        >
          <textarea
            autoFocus
            rows={4}
            className="w-full bg-transparent focus:outline-none font-serif italic text-base sm:text-lg text-[#3A1E2A] leading-relaxed resize-none placeholder:text-[#B391A0]/40 p-1 select-text custom-scrollbar"
            value={entry.friction}
            onChange={(e) => onChange({ friction: e.target.value })}
            placeholder="Describe exactly what feels exhausting, sticky, or blocked right now..."
          />
        </UnblendFrame>
      </div>

      <div className="bg-white p-4 rounded-xl border border-[#3A1E2A]/5">
        <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-2">
          3. Name the feeling
        </p>
        <EmotionPicker entry={entry} onChange={onChange} variant="focus" />
      </div>
    </div>
  );
};
