// src/components/OverflowMenu.tsx
// Small popover for the header's archival actions (Import · Export · Print).
// Click ⋯ to open. Click outside or press Escape to dismiss. Selecting an
// item runs its onClick and closes the menu. No portal — pinned absolute to
// its own relative wrapper so it sits flush under the ⋯ button.

import React, { useEffect, useRef, useState } from "react";

export interface OverflowItem {
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const OverflowMenu = ({ items }: { items: OverflowItem[] }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`hover:text-[#C24E6E] transition-colors flex items-center text-[#B391A0] cursor-pointer ${
          open
            ? "text-[#C24E6E] bg-[#FBD9E0]/40"
            : "text-[#5A3645] hover:text-[#C24E6E]"
        }`}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Import · Export · Print"
      >
        archive
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-2 min-w-[220px] bg-white border border-[#3A1E2A]/15 rounded-xl shadow-lg z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100"
        >
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                if (it.disabled) return;
                it.onClick();
                setOpen(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-[#FAE6E1]/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {it.icon && (
                <span className="shrink-0 text-[#C24E6E]">{it.icon}</span>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-serif text-sm text-[#3A1E2A] leading-tight">
                  {it.label}
                </div>
                {it.hint && (
                  <div className="font-sans text-[10.5px] text-[#B391A0] mt-0.5 leading-tight">
                    {it.hint}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
