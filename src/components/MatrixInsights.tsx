// Whole-ledger patterns, shown under the Matrix (home). Each read self-guards
// on data, so a thin ledger shows a thin panel:
//   · What's missing — the unmet-needs cloud (size = frequency; tint = the avg
//     how-it's-going of the values missing it → big + pink = leverage). Grouped
//     into the 7 NVC categories. Tap a need → open the value it starves most.
//   · Where friction comes from — the same cloud move over Atlas "places",
//     plus a pause-here count.
//   · Follow-through — committed actions vs. actually lived (the loop's scoreboard).
//   · Tending — a last-14-days heatmap of "lived it" taps (direction, not streaks).
//   · Kind of problem — open / stuck / reality split (what work each value wants).
//   · Energy × engagement — the second map: which values thrive vs. drain.
//
// Colour is a *secondary* encoding throughout: the label + size/position carry
// the data, so the status tint stays a quiet reinforcement (dark-ink text on a
// pale fill), validated CVD-safe against the app's other status marks.

import { useMemo, useState, type ReactNode } from "react";
import type { Mapping } from "../types";
import {
  feelingsBreakdown,
  followThrough,
  needsBreakdown,
  problemFrameSplit,
  tendingByDay,
  wayfindingPoints,
  type WorkabilityBand,
} from "../derive";

interface Props {
  entries: Mapping[];
  onFocus: (id: string) => void;
}

const BAND: Record<WorkabilityBand, { bg: string; border: string; dot: string; label: string }> = {
  stuck: { bg: "#FBD9E0", border: "#E7A6B5", dot: "#C24E6E", label: "usually stuck" },
  mixed: { bg: "#FFF1D6", border: "#E4C583", dot: "#D6A24A", label: "mixed" },
  working: { bg: "#E9F5EE", border: "#A9CDB8", dot: "#5C7F66", label: "usually working" },
};
const NEUTRAL = { bg: "#FFFFFF", border: "rgba(58,30,42,0.12)", dot: "#B391A0" };

const FRAME = {
  open: { color: "#5C7F66", gloss: "something to try" },
  stuck: { color: "#C24E6E", gloss: "a reframe first" },
  reality: { color: "#D6A24A", gloss: "acceptance" },
} as const;
type FrameName = keyof typeof FRAME;

// Three legible size steps from frequency (precise counts live in the
// superscript + hover, so size-encoding imprecision is fine).
const sizeClass = (count: number, max: number): string => {
  if (max <= 1) return "text-[13px]";
  const t = count / max;
  return t > 0.66
    ? "text-[15.5px] font-medium"
    : t > 0.33
      ? "text-[13px]"
      : "text-[11.5px]";
};

// 0 → faint, 1 → light sage, 2+ → deep sage. Sequential, monotonic light→dark.
const cellColor = (count: number): string =>
  count === 0 ? "#FAE6E1" : count === 1 ? "#9CD3B6" : "#5C7F66";

// Deterministic jitter so co-located points in the quadrant read as a cluster
// instead of stacking into one dot.
const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
};
const jitter = (seed: string): number => (((hash(seed) % 7) - 3) * 0.8);

const Card = ({ children }: { children: ReactNode }) => (
  <div className="bg-white rounded-2xl border border-[#3A1E2A]/10 shadow-xs p-4 sm:p-5">
    {children}
  </div>
);
const Label = ({ children }: { children: ReactNode }) => (
  <p className="text-[9px] uppercase tracking-[0.22em] text-[#5A3645] font-semibold m-0">
    {children}
  </p>
);
const BandLegend = () => (
  <div className="flex items-center gap-2.5 text-[9px] text-[#B391A0] normal-case tracking-normal">
    {(["stuck", "mixed", "working"] as WorkabilityBand[]).map((b) => (
      <span key={b} className="inline-flex items-center gap-1">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: BAND[b].dot }} />
        {b}
      </span>
    ))}
  </div>
);

export const MatrixInsights = ({ entries, onFocus }: Props) => {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const d = useMemo(() => {
    const bd = needsBreakdown(entries);
    const ft = followThrough(entries);
    const days = tendingByDay(entries, 14);
    const feelings = feelingsBreakdown(entries);
    const frames = problemFrameSplit(entries);
    const points = wayfindingPoints(entries);
    return {
      bd,
      ft,
      days,
      anyTending: days.some((x) => x.count > 0),
      feelings,
      maxFeel: Math.max(1, ...feelings.feelings.map((f) => f.count)),
      frames,
      points,
    };
  }, [entries]);

  const { bd, ft, days, anyTending, feelings, maxFeel, frames, points } = d;

  const show =
    bd.groups.length > 0 ||
    ft.committed > 0 ||
    anyTending ||
    feelings.feelings.length > 0 ||
    frames.total > 0 ||
    points.length > 0;
  if (!show) return null;

  const dominantFrame: FrameName | null =
    frames.total > 0
      ? (["open", "stuck", "reality"] as FrameName[]).reduce((a, b) =>
          frames[b] > frames[a] ? b : a,
        )
      : null;

  // Quadrant geometry (viewBox 0..100; keep dots off the edges where the
  // corner labels sit). engagement → x (numb→flow), energy → y (drains→fills).
  const px = (eng: number) => 14 + ((eng - 1) / 4) * 72;
  const py = (energy: number) => 84 - ((energy - 1) / 4) * 68;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const plotted = points.map((p) => ({
    p,
    cx: clamp(px(p.engagement) + jitter(p.id), 11, 89),
    cy: clamp(py(p.energy) + jitter(p.id + "y"), 17, 81),
  }));

  return (
    <section className="mt-8 space-y-4 print:hidden">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold">
          Patterns
        </p>
        <p className="font-serif italic text-[13px] text-[#5A3645] leading-snug">
          What the whole ledger is telling you.
        </p>
      </div>

      {/* --- What's missing (needs cloud) ------------------------------------ */}
      {bd.groups.length > 0 && (
        <Card>
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <Label>What's missing most</Label>
            <BandLegend />
          </div>

          <div className="space-y-3 mt-3">
            {bd.groups.map((group) => (
              <div key={group.category}>
                <div className="text-[8.5px] uppercase tracking-[0.2em] text-[#B391A0] font-semibold mb-1.5">
                  {group.category}
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {group.needs.map((n) => {
                    const s = n.band ? BAND[n.band] : NEUTRAL;
                    return (
                      <button
                        key={n.need}
                        type="button"
                        onClick={() => n.stuckestId && onFocus(n.stuckestId)}
                        title={`${n.need} · missing in ${n.count} ${n.count === 1 ? "value" : "values"}${n.band ? `, ${BAND[n.band].label}` : ""}`}
                        className={`inline-flex items-baseline gap-0.5 rounded-full border px-2.5 py-1 leading-none text-[#3A1E2A] hover:brightness-95 active:brightness-90 transition-[filter] cursor-pointer ${sizeClass(n.count, bd.maxCount)}`}
                        style={{ background: s.bg, borderColor: s.border }}
                      >
                        {n.need}
                        {n.count > 1 && <sup className="text-[8px] text-[#5A3645]/60 font-mono">{n.count}</sup>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-[#B391A0] italic font-serif normal-case tracking-normal m-0 pt-3">
            Size = how often it's missing · tint = usually stuck → working. Tap a
            need to open the value it's starving most.
          </p>
        </Card>
      )}

      {/* --- Where friction comes from (feelings) ---------------------------- */}
      {feelings.feelings.length > 0 && (
        <Card>
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <Label>Where friction comes from</Label>
            {feelings.pauseHere > 0 && (
              <span className="text-[9px] text-[#8B6914] normal-case tracking-normal">
                ⏸ {feelings.pauseHere} in pause-here states
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 items-center mt-3">
            {feelings.feelings.map((f) => {
              const s = f.band ? BAND[f.band] : NEUTRAL;
              return (
                <button
                  key={f.cluster}
                  type="button"
                  onClick={() => f.stuckestId && onFocus(f.stuckestId)}
                  title={`${f.label} · ${f.count} ${f.count === 1 ? "value" : "values"}${f.band ? `, ${BAND[f.band].label}` : ""}`}
                  className={`inline-flex items-baseline gap-0.5 rounded-full border px-2.5 py-1 leading-none text-[#3A1E2A] hover:brightness-95 active:brightness-90 transition-[filter] cursor-pointer ${sizeClass(f.count, maxFeel)}`}
                  style={{ background: s.bg, borderColor: s.border }}
                >
                  {f.cessation && <span className="text-[#8B6914]">⏸ </span>}
                  {f.label}
                  {f.count > 1 && <sup className="text-[8px] text-[#5A3645]/60 font-mono">{f.count}</sup>}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* --- Follow-through + Tending --------------------------------------- */}
      {(ft.committed > 0 || anyTending) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {ft.committed > 0 && (
            <Card>
              <Label>Follow-through</Label>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {([
                  ["committed", ft.committed, "#3A1E2A"],
                  ["lived this week", ft.livedThisWeek, "#5C7F66"],
                  ["waiting", ft.neverLived, "#C24E6E"],
                ] as const).map(([label, value, color]) => (
                  <div key={label}>
                    <div className="font-serif text-2xl leading-none" style={{ color }}>
                      {value}
                    </div>
                    <div className="text-[8.5px] uppercase tracking-[0.14em] text-[#B391A0] font-semibold mt-1 leading-tight">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-[#B391A0] italic font-serif m-0 mt-3">
                Small actions you pre-decided, and whether they're happening.
              </p>
            </Card>
          )}

          {anyTending && (
            <Card>
              <Label>Tending · last 14 days</Label>
              <div className="mt-3 flex gap-1 flex-wrap">
                {days.map((x) => (
                  <div
                    key={x.day}
                    title={`${x.label} · tended ${x.count} ${x.count === 1 ? "value" : "values"}`}
                    className="w-3.5 h-3.5 rounded-[3px] border border-[#3A1E2A]/5 shrink-0"
                    style={{ background: cellColor(x.count) }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[8.5px] uppercase tracking-[0.14em] text-[#B391A0] font-semibold mt-2">
                <span>{days[0]?.label}</span>
                <span>today</span>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* --- Kind of problem + Energy × engagement -------------------------- */}
      {(frames.total > 0 || points.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {frames.total > 0 && (
            <Card>
              <Label>Kind of problem</Label>
              <div className="mt-3 flex h-2.5 rounded-full overflow-hidden gap-0.5">
                {(["open", "stuck", "reality"] as FrameName[])
                  .filter((k) => frames[k] > 0)
                  .map((k) => (
                    <div
                      key={k}
                      style={{ flex: frames[k], background: FRAME[k].color }}
                      title={`${frames[k]} ${k}`}
                    />
                  ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5 text-[9px] normal-case tracking-normal">
                {(["open", "stuck", "reality"] as FrameName[])
                  .filter((k) => frames[k] > 0)
                  .map((k) => (
                    <span key={k} className="inline-flex items-center gap-1 text-[#5A3645]">
                      <span className="w-2 h-2 rounded-full" style={{ background: FRAME[k].color }} />
                      {frames[k]} {k}
                    </span>
                  ))}
              </div>
              {dominantFrame && (
                <p className="text-[9px] text-[#B391A0] italic font-serif m-0 mt-2.5">
                  Mostly {dominantFrame}: these want {FRAME[dominantFrame].gloss}.
                </p>
              )}
            </Card>
          )}

          {points.length > 0 && (
            <Card>
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <Label>Energy × engagement</Label>
                <BandLegend />
              </div>
              <svg
                viewBox="0 0 100 100"
                className="w-full max-w-[280px] mt-2.5 mx-auto block overflow-visible"
                role="img"
                aria-label="Values plotted by engagement (x) and energy (y), coloured by how they're going"
              >
                {/* good → bad diagonal: thriving corner sage, flat corner pink */}
                <rect x="50" y="14" width="42" height="34" fill="#E9F5EE" />
                <rect x="8" y="50" width="42" height="34" fill="#FBE4EA" />
                {/* plot frame + midlines */}
                <rect x="8" y="14" width="84" height="70" fill="none" stroke="#3A1E2A" strokeOpacity="0.1" />
                <line x1="50" y1="14" x2="50" y2="84" stroke="#3A1E2A" strokeOpacity="0.12" strokeDasharray="2 2" />
                <line x1="8" y1="49" x2="92" y2="49" stroke="#3A1E2A" strokeOpacity="0.12" strokeDasharray="2 2" />
                {/* corner meaning-labels */}
                <text x="90" y="19.5" textAnchor="end" fontSize="4.4" fill="#5C7F66" fontWeight="600">thriving</text>
                <text x="10" y="19.5" textAnchor="start" fontSize="4.4" fill="#B391A0">restless</text>
                <text x="90" y="81" textAnchor="end" fontSize="4.4" fill="#B391A0">draining</text>
                <text x="10" y="81" textAnchor="start" fontSize="4.4" fill="#C24E6E">flat</text>
                {/* axis end labels */}
                <text x="50" y="93" textAnchor="middle" fontSize="4" fill="#B391A0">engagement →</text>
                <text x="4" y="49" textAnchor="middle" fontSize="4" fill="#B391A0" transform="rotate(-90 4 49)">energy →</text>

                {plotted.map(({ p, cx, cy }) => {
                  const active = hoverId === p.id;
                  return (
                    <circle
                      key={p.id}
                      cx={cx}
                      cy={cy}
                      r={active ? 3.7 : 2.8}
                      fill={p.band ? BAND[p.band].dot : NEUTRAL.dot}
                      stroke="#FFFFFF"
                      strokeWidth="1.2"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoverId(p.id)}
                      onMouseLeave={() => setHoverId(null)}
                      onClick={() => onFocus(p.id)}
                    >
                      <title>{`${p.value} · engagement ${p.engagement}/5, energy ${p.energy}/5`}</title>
                    </circle>
                  );
                })}

                {/* hover label — value name with a cream halo so it reads on any tint */}
                {(() => {
                  const h = plotted.find((x) => x.p.id === hoverId);
                  if (!h) return null;
                  const above = h.cy > 26;
                  return (
                    <text
                      x={clamp(h.cx, 14, 86)}
                      y={above ? h.cy - 5.5 : h.cy + 8.5}
                      textAnchor="middle"
                      fontSize="5"
                      fontWeight="600"
                      fill="#3A1E2A"
                      stroke="#FDF4F0"
                      strokeWidth="1.8"
                      style={{ paintOrder: "stroke" }}
                      pointerEvents="none"
                    >
                      {h.p.value}
                    </text>
                  );
                })()}
              </svg>
              <p className="text-[9px] text-[#B391A0] italic font-serif m-0 mt-1.5 text-center normal-case tracking-normal">
                Each dot is a value. Hover for its name, tap to open it.
              </p>
            </Card>
          )}
        </div>
      )}
    </section>
  );
};
