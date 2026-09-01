// IFS "unblending" scaffolding. Visual decoration only — wraps the friction
// textarea with prompt-voice text so the user reads their friction as
// belonging to a part of them, not as them. Pure cosmetic: nothing here
// edits or extends the Mapping schema.
//
// Behavior matrix:
//   part + emotion  → "A part of me — X — feels"  / "…it's trying to protect me from emotion."
//   part only       → "A part of me — X — feels"  / "…what is it trying to protect me from?"
//   emotion only    → "Something in me feels emotion …"
//   neither         → no wrapper, just children
//
// When wrapping inside a cessation cluster, the framing tints amber to match
// the EmotionPicker's "pause here" stance.

import React from "react";

interface Props {
  partName: string | null;
  emotionLabel: string | null;
  cessation?: boolean;
  children: React.ReactNode;
}

export const UnblendFrame = ({
  partName,
  emotionLabel,
  cessation = false,
  children,
}: Props) => {
  const hasPart = !!partName;
  const hasEmotion = !!emotionLabel;

  if (!hasPart && !hasEmotion) return <>{children}</>;

  const tone = cessation ? "text-[#8B6914]" : "text-[#5A3645]";
  const accent = cessation ? "text-[#8B6914]" : "text-[#C24E6E]";

  let prefix: React.ReactNode = null;
  let suffix: React.ReactNode = null;

  if (hasPart) {
    prefix = (
      <>
        A part of me{" "}
        <span className={`not-italic font-sans text-[10px] uppercase tracking-[0.18em] font-semibold ${accent} align-middle`}>
          ·{" "}
        </span>
        <span className={`${accent} font-medium`}>{partName}</span>{" "}
        <span className={`not-italic font-sans text-[10px] uppercase tracking-[0.18em] font-semibold ${accent} align-middle`}>
          ·
        </span>{" "}
        feels…
      </>
    );
    suffix = hasEmotion ? (
      <>
        …it's trying to protect me from{" "}
        <span className={`${accent} font-medium not-italic`}>{emotionLabel?.toLowerCase()}</span>.
      </>
    ) : (
      <>…what is it trying to protect me from?</>
    );
  } else {
    prefix = (
      <>
        Something in me feels{" "}
        <span className={`${accent} font-medium not-italic`}>{emotionLabel?.toLowerCase()}</span>
        …
      </>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className={`font-serif italic text-[12.5px] leading-snug ${tone}`}>
        {prefix}
      </p>
      {children}
      {suffix && (
        <p className={`font-serif italic text-[12.5px] leading-snug ${tone}`}>
          {suffix}
        </p>
      )}
    </div>
  );
};
