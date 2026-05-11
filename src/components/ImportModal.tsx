import React, { useState } from "react";
import { VALUE_LIBRARY } from "../data";

// --- Bloom SVG Accessories & Mascots --------------------------------------

const BloomFlower = ({
  size = 20,
  petal = "#E07A95",
  eye = "#3A1E2A",
  smile = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className="inline-block align-middle overflow-visible"
  >
    {Array.from({ length: 5 }).map((_, i) => (
      <path
        key={i}
        d="M50 50 C 28 38, 22 12, 50 4 C 78 12, 72 38, 50 50 Z"
        fill={petal}
        opacity="0.95"
        stroke="#C24E6E"
        strokeOpacity="0.2"
        transform={`rotate(${(i * 360) / 5} 50 50)`}
      />
    ))}
    <circle cx="50" cy="50" r="9" fill="#C24E6E" opacity="0.9" />
    <circle cx="50" cy="50" r="3" fill="#F7D679" />
    {smile && (
      <g>
        <circle cx="44" cy="48" r="1.6" fill={eye} />
        <circle cx="52" cy="48" r="1.6" fill={eye} />
        <path
          d="M44 53 Q48 56 52 53"
          stroke="#3A1E2A"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    )}
  </svg>
);

const CloudFriend = ({ size = 42 }) => (
  <svg
    width={size}
    height={size * 0.7}
    viewBox="0 0 100 70"
    className="inline-block align-middle overflow-visible"
  >
    <g stroke="#3A1E2A" strokeWidth="2" fill="#FFFFFF">
      <circle cx="30" cy="40" r="20" />
      <circle cx="55" cy="32" r="22" />
      <circle cx="78" cy="42" r="18" />
      <rect
        x="20"
        y="40"
        width="68"
        height="20"
        rx="10"
        fill="#FFFFFF"
        stroke="none"
      />
      <line x1="20" y1="60" x2="88" y2="60" stroke="#3A1E2A" strokeWidth="2" />
    </g>
    <ellipse cx="44" cy="40" rx="2.5" ry="3.2" fill="#3A1E2A" />
    <ellipse cx="64" cy="40" rx="2.5" ry="3.2" fill="#3A1E2A" />
    <path
      d="M48 50 Q54 53 60 50"
      stroke="#3A1E2A"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="38" cy="48" rx="4" ry="2" fill="#E07A95" opacity="0.6" />
    <ellipse cx="68" cy="48" rx="4" ry="2" fill="#E07A95" opacity="0.6" />
  </svg>
);

// --- Normalization helper -------------------------------------------------
const norm = (s: string) => s.trim().toLowerCase();

export const ImportModal = ({
  open,
  onClose,
  existingValues,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  existingValues: Set<string>;
  onAdd: (names: string[]) => void;
}) => {
  const [tab, setTab] = useState<"paste" | "library">("library"); // Set library default to show off categories
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!open) return null;

  const toggleLibrary = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // One-pass batch preview deduplication
  const preview = (() => {
    const incoming = [
      ...text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      ...Array.from(selected),
    ];
    const seen = new Set(existingValues);
    const added: string[] = [];
    let skipped = 0;
    for (const raw of incoming) {
      const k = norm(raw);
      if (!k) continue;
      if (seen.has(k)) {
        skipped++;
        continue;
      }
      seen.add(k);
      added.push(raw.trim());
    }
    return { added, skipped };
  })();

  const reset = () => {
    setText("");
    setSelected(new Set());
  };

  const handleAdd = () => {
    if (preview.added.length > 0) onAdd(preview.added);
    reset();
    onClose();
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  // Category palette cyclic mapping helper
  const getCategoryColor = (idx: number) => {
    const colors = ["#E07A95", "#F7D679", "#9CD3B6", "#A8C8E8", "#F4ABBC"];
    return colors[idx % colors.length];
  };

  return (
    <div className="fixed inset-0 bg-[#FAE6E1]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Main Murakami Rounded Box */}
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#FDF4F0] border border-[#3A1E2A]/15 rounded-[18px] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Ambient background decoration */}
        <div
          aria-hidden="true"
          className="absolute right-[-20px] top-[-20px] opacity-60 pointer-events-none"
        >
          <BloomFlower size={100} petal="#F4ABBC" smile={false} />
        </div>

        {/* Modal Header */}
        <div className="flex justify-between items-start mb-6 border-b border-dashed border-[#3A1E2A]/10 pb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold">
                Library ✿
              </span>
            </div>
            <h2 className="text-2xl font-serif text-[#3A1E2A] mt-1 tracking-[-0.01em]">
              Pick a few that match the season.
            </h2>
          </div>

          <button
            onClick={handleCancel}
            className="text-xl text-[#B391A0] hover:text-[#C24E6E] transition-colors p-1"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Cute Toggle Pill Strip */}
        <div className="flex gap-2 mb-6 relative z-10">
          <button
            onClick={() => setTab("library")}
            className={`px-4 py-1.5 rounded-full font-sans text-xs font-medium transition-all cursor-pointer ${
              tab === "library"
                ? "bg-[#C24E6E] text-white shadow-2xs"
                : "bg-transparent text-[#5A3645] border border-[#3A1E2A]/10 hover:bg-white/50"
            }`}
          >
            Curated Library
          </button>
          <button
            onClick={() => setTab("paste")}
            className={`px-4 py-1.5 rounded-full font-sans text-xs font-medium transition-all cursor-pointer ${
              tab === "paste"
                ? "bg-[#C24E6E] text-white shadow-2xs"
                : "bg-transparent text-[#5A3645] border border-[#3A1E2A]/10 hover:bg-white/50"
            }`}
          >
            Paste Raw List
          </button>
        </div>

        {/* Inner Scroll Canvas */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 relative z-10 custom-scrollbar">
          {tab === "paste" ? (
            <div className="flex flex-col h-full animate-in fade-in duration-150">
              <label className="text-[10px] uppercase tracking-[0.18em] text-[#5A3645] font-semibold mb-2 block">
                One value per line (duplicates drop automatically)
              </label>
              <textarea
                className="w-full flex-1 min-h-[220px] p-4 rounded-xl border border-[#3A1E2A]/15 bg-white focus:outline-none focus:border-[#C24E6E] font-serif text-base text-[#3A1E2A] placeholder:text-[#B391A0]/50 resize-none shadow-inner"
                placeholder="Integrity&#10;Autonomy&#10;Community&#10;Spontaneity..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          ) : (
            /* Curated Library Groupings */
            <div className="space-y-6 animate-in fade-in duration-150 pb-2">
              {VALUE_LIBRARY.map((cat, idx) => {
                const catColor = getCategoryColor(idx);
                return (
                  <section
                    key={cat.name}
                    className="pt-2 border-t border-dashed border-[#3A1E2A]/5 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <BloomFlower size={14} petal={catColor} smile={false} />
                      <h3 className="font-serif italic text-lg text-[#3A1E2A]">
                        {cat.name}
                      </h3>
                    </div>
                    <p className="text-xs text-[#B391A0] mb-3 pl-5 leading-snug">
                      {cat.description}
                    </p>

                    {/* Value Pill Menagerie */}
                    <div className="flex flex-wrap gap-2 pl-5">
                      {cat.values.map((v) => {
                        const exists = existingValues.has(norm(v));
                        const sel = selected.has(v);
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => !exists && toggleLibrary(v)}
                            disabled={exists}
                            title={
                              exists ? "Already actively mapped" : undefined
                            }
                            className={`font-serif italic text-sm px-3.5 py-1 rounded-full border transition-all cursor-pointer ${
                              exists
                                ? "border-transparent text-[#B391A0]/40 line-through cursor-not-allowed bg-transparent"
                                : sel
                                  ? "border-[#C24E6E] text-white bg-[#C24E6E] shadow-2xs font-normal not-italic font-sans text-xs py-1.5"
                                  : "border-[#3A1E2A]/10 text-[#3A1E2A] bg-white hover:border-[#E07A95] hover:text-[#C24E6E]"
                            }`}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Integration Footer */}
        <div className="flex justify-between items-center gap-4 pt-4 mt-4 border-t border-dashed border-[#3A1E2A]/10 relative z-10 bg-[#FDF4F0]">
          <div className="flex items-center gap-2">
            <CloudFriend size={36} />
            <span className="font-mono text-[10px] text-[#5A3645]">
              {preview.added.length > 0 ? (
                <strong className="text-[#C24E6E] font-bold font-sans text-xs">
                  {preview.added.length} queued
                </strong>
              ) : (
                "0 queued"
              )}
              {preview.skipped > 0 && (
                <span className="text-[#B391A0]">
                  {preview.added.length > 0 ? " · " : ""}
                  {preview.skipped} skipped
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="text-xs text-[#5A3645] hover:underline px-3 py-1 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={preview.added.length === 0}
              className="bg-[#C24E6E] text-white font-sans text-xs font-medium px-5 py-2 rounded-full hover:bg-[#3A1E2A] transition-colors disabled:bg-[#B391A0]/20 disabled:text-[#B391A0]/60 disabled:cursor-not-allowed shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <BloomFlower
                size={12}
                petal="#FFFFFF"
                eye="#C24E6E"
                smile={false}
              />
              <span>Map values</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
