// Some legacy Need text comes in as one composite blob with labeled segments
// (Reframe:, Prototype:, Accelerators:, Brakes to watch:). The entry views
// peel those labels off so each piece can render in its own chip rather
// than buried in prose. Pure — no React, no I/O.

export interface ParsedNeed {
  core: string;
  reframe: string;
  prototype: string;
  accelerators: string;
  brakes: string;
  /** True if any labeled segment was found and stripped from `core`. */
  hasExtracted: boolean;
}

const EMPTY: ParsedNeed = {
  core: "",
  reframe: "",
  prototype: "",
  accelerators: "",
  brakes: "",
  hasExtracted: false,
};

// Order matters: extract from the end of the string back to the front so the
// preceding piece can survive having later labels removed from it. Brakes is
// always last in our synthesizer output, so we start there.
const SEGMENTS: ReadonlyArray<{ key: keyof ParsedNeed; pattern: RegExp }> = [
  { key: "brakes", pattern: /Brakes to watch:\s*/i },
  { key: "accelerators", pattern: /Accelerators:\s*/i },
  { key: "prototype", pattern: /Prototype\s*(\([^)]*\))?:\s*/i },
  { key: "reframe", pattern: /Reframe:\s*/i },
];

export const parseCompositeNeed = (raw: string): ParsedNeed => {
  if (!raw) return EMPTY;

  let current = raw;
  const out: ParsedNeed = { ...EMPTY };

  for (const { key, pattern } of SEGMENTS) {
    const m = current.match(pattern);
    if (m && m.index !== undefined) {
      const value = current.slice(m.index + m[0].length).trim();
      current = current.slice(0, m.index).trim();
      // SEGMENTS only lists string-valued keys; safe to assign as string.
      (out[key] as string) = value;
      out.hasExtracted = true;
    }
  }

  out.core = current.trim();
  return out;
};
