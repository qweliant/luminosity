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
  "Diagnose",
  "Locate",
  "Anchor",
  "Reframe",
  "Contextualize",
  "Synthesize",
] as const;

export const FOCUS_PROMPTS = [
  "How well is your current environment serving this value, and what is in the way?",
  "What's starving underneath the friction? Tag what's missing.",
  "Which fundamental driver does this value serve?",
  "Where does this value live in your engagement and energy? Frame the problem and design a prototype.",
  "Which contexts accelerate this value, and which brake it?",
  "Compose all of the above into a single Need sentence.",
] as const;
