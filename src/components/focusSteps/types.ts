import type { Mapping, Part } from "../../types";

// Shared shape passed to every focus-mode step. Individual steps consume
// only the slice they need; the shell hands them everything for simplicity.
export interface FocusStepProps {
  entry: Mapping;
  parts: Part[];
  onUpsertPart: (name: string) => string | null;
  onChange: (patch: Partial<Mapping>) => void;
  onToggleNvc: (need: string) => void;
}

export const FOCUS_STEPS = [
  "Check in",
  "What's missing",
  "Deeper need",
  "Reframe",
  "Contexts",
  "Sum up",
] as const;

export const FOCUS_PROMPTS = [
  "How well is your life serving this value right now, and what's in the way?",
  "What's starving underneath the friction? Tag what's missing.",
  "What deeper need is this value really serving?",
  "Where does this sit for your energy and interest? Name what kind of problem it is, then sketch one small thing to try.",
  "Which situations bring this value out, and which shut it down?",
  "Pull all of the above into a single sentence for what you need.",
] as const;
