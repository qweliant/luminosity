// The pairing dialog. One job: get a second device onto this ledger, and then
// tell the truth about whether it worked.
//
// Shape of the thing: there are no tabs and no host/guest roles, because the
// transport has neither. A ledger has one code. A device either has it or is
// being given it. Every screen below is one of four honest answers to "where
// am I": choosing, showing the code, entering a code, or confirming a merge.

import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  connectWithCode,
  getActiveCode,
  getPeerPresences,
  getSyncError,
  getSyncState,
  stopSync,
  subscribeSync,
} from "../services/syncEngine";
import {
  generateCode,
  loadPairing,
  normalizeCode,
  pairUrl,
} from "@luminosity/ledger-core";

// --- Bloom SVG Primitives & Mascots ---------------------------------------

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
        strokeWidth="1"
        transform={`rotate(${(i * 360) / 5} 50 50)`}
      />
    ))}
    <circle cx="50" cy="50" r="9" fill="#C24E6E" />
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

const CloudFriend = ({ size = 48 }) => (
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

// --- Shared bits ----------------------------------------------------------

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white p-4 sm:p-5 rounded-xl border border-[#3A1E2A]/5 ${className}`}
  >
    {children}
  </div>
);

/** Chunked so the eye can hold it while typing on the other device. */
const CodeDisplay = ({ code }: { code: string }) => (
  <p className="font-mono text-[15px] sm:text-base text-[#3A1E2A] leading-relaxed break-all select-all m-0">
    {code}
  </p>
);

const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// --- Component Root -------------------------------------------------------

type View = "choose" | "code" | "enter";

export const SyncOverlay = ({
  open,
  onClose,
  entryCount,
  /** A code arriving from a scanned QR / pairing link, pending confirmation. */
  incomingCode = null,
  onIncomingHandled,
}: {
  open: boolean;
  onClose: () => void;
  entryCount: number;
  incomingCode?: string | null;
  onIncomingHandled?: () => void;
}) => {
  const [, force] = useState(0);
  const [view, setView] = useState<View>("choose");
  const [typed, setTyped] = useState("");
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);

  // Every user-visible fact about sync comes from the engine, so the dialog
  // can't drift out of step with the header chip the way the old local
  // `connectionLive` flag did.
  useEffect(() => subscribeSync(() => force((n) => n + 1)), []);

  const state = getSyncState();
  const activeCode = getActiveCode();
  const peers = getPeerPresences();
  const engineError = getSyncError();

  // A scanned link always wins: it's the most explicit thing the user has done.
  useEffect(() => {
    if (incomingCode) setPendingCode(incomingCode);
  }, [incomingCode]);

  useEffect(() => {
    if (!open) {
      setPendingCode(null);
      setTyped("");
      setInputError(null);
      setView("choose");
    }
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  // Waiting has no natural end: a dead relay and a network that won't let two
  // devices reach each other both look exactly like patience. After a while,
  // say so and name what's worth checking — an indicator that can only ever
  // mean "keep waiting" is the thing that makes this feel unknowable.
  const [stalled, setStalled] = useState(false);
  useEffect(() => {
    setStalled(false);
    if (state !== "waiting") return;
    const t = setTimeout(() => setStalled(true), 20_000);
    return () => clearTimeout(t);
  }, [state]);

  if (!open) return null;

  const syncing = state === "waiting" || state === "linked";
  // Paused: this device knows a code but isn't using it. Without its own
  // screen, pausing dumps you back on the first-run setup questions as though
  // the pairing never happened — the exact loop this dialog exists to end.
  const stored = loadPairing();
  const paused = !syncing && !pendingCode && !!stored && !stored.enabled;
  const shownCode = activeCode ?? stored?.code ?? "";

  const handleStartFresh = () => {
    const code = generateCode();
    void connectWithCode(code);
    setView("code");
  };

  const handleSubmitTyped = () => {
    const code = normalizeCode(typed);
    if (!code) {
      setInputError(
        "That doesn't look like a pairing code. It's four words and a number, like otter-lantern-quiet-river-4821.",
      );
      return;
    }
    setInputError(null);
    setPendingCode(code);
  };

  const handleConfirmJoin = () => {
    if (!pendingCode) return;
    void connectWithCode(pendingCode);
    setPendingCode(null);
    onIncomingHandled?.();
    setView("code");
  };

  const handleCancelJoin = () => {
    setPendingCode(null);
    onIncomingHandled?.();
  };

  const handleCopy = async (kind: "link" | "code") => {
    const ok = await copyText(kind === "link" ? pairUrl(shownCode) : shownCode);
    if (ok) {
      setCopied(kind);
      setCopyFailed(false);
    } else {
      setCopyFailed(true);
    }
  };

  const peerNames = peers.map((p) => p.device);
  const peerSentence =
    peerNames.length === 1
      ? `Synced with your ${peerNames[0]}.`
      : `Synced with ${peerNames.length} other devices.`;

  return (
    <div className="fixed inset-0 bg-[#FAE6E1]/80 backdrop-blur-xs z-50 flex items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90dvh] overflow-y-auto overflow-x-hidden overscroll-contain bg-[#FDF4F0] sm:border border-[#3A1E2A]/15 sm:rounded-[18px] p-5 sm:p-7 shadow-xl relative">
        <div
          aria-hidden="true"
          className="absolute right-[-34px] top-[-30px] opacity-25 pointer-events-none"
        >
          <BloomFlower size={96} petal="#F4ABBC" smile={false} />
        </div>

        {/* Header — states its own answer, so the title is never a question the
            user has to resolve before reading further. */}
        <div className="flex justify-between items-start gap-3 mb-5 border-b border-dashed border-[#3A1E2A]/10 pb-4 relative z-10">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold">
              ✿ Your devices ✿
            </span>
            <h2 className="text-xl sm:text-2xl font-serif text-[#3A1E2A] mt-1 tracking-[-0.01em] leading-snug">
              {/* A pending join owns the title — reporting the current
                  connection above a "before you connect" card reads as the
                  dialog contradicting itself. */}
              {pendingCode
                ? "Add this device to your ledger."
                : state === "linked"
                  ? peerSentence
                  : state === "waiting"
                    ? "Waiting for your other device."
                    : paused
                      ? "Syncing is paused here."
                      : "Keep this ledger on more than one device."}
            </h2>
          </div>

          {/* Solid backdrop so the close target stays legible against the
              decorative bloom behind it. */}
          <button
            onClick={onClose}
            className="text-2xl leading-none text-[#5A3645] hover:text-[#C24E6E] transition-colors rounded-full bg-[#FDF4F0]/85 min-h-11 min-w-11 flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="relative z-10 space-y-4">
          {/* --- CONFIRM A JOIN ------------------------------------------- */}
          {pendingCode ? (
            <>
              <Card>
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold block mb-2">
                  Before you connect
                </span>

                {/* Lead with the outcome. Stating the two transfers separately
                    ("yours go there", "theirs come here") makes the reader
                    compose them into an answer, which is how this ends up
                    feeling directional and possibly destructive. It is
                    neither: it's a union, and it's mutual. */}
                <p className="text-[15px] font-serif text-[#3A1E2A] leading-snug m-0">
                  Both devices end up with everything. Nothing is replaced.
                </p>

                <dl className="mt-3 text-[13px] leading-relaxed m-0">
                  <div className="flex justify-between gap-3 py-1.5 border-b border-[#3A1E2A]/5">
                    <dt className="text-[#B391A0]">On this device now</dt>
                    <dd className="text-[#3A1E2A] m-0 text-right">
                      {entryCount} {entryCount === 1 ? "entry" : "entries"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 py-1.5 border-b border-[#3A1E2A]/5">
                    <dt className="text-[#B391A0]">On the other device</dt>
                    <dd className="text-[#3A1E2A] m-0 text-right">
                      whatever it already has
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 py-1.5">
                    <dt className="text-[#5A3645] font-semibold">
                      After connecting
                    </dt>
                    <dd className="text-[#3A1E2A] m-0 text-right font-semibold">
                      both lists, on both
                    </dd>
                  </div>
                </dl>

                <p className="text-[13px] text-[#5A3645] leading-relaxed mt-3 m-0">
                  It keeps working after that — write on either device and it
                  shows up on the other. You can stop it any time.
                </p>

                {activeCode && activeCode !== pendingCode && (
                  <p className="flex gap-2 text-[13px] text-[#5A3645] leading-relaxed mt-3 pt-3 border-t border-[#3A1E2A]/5 m-0">
                    <span className="text-[#D9A441] shrink-0">!</span>
                    <span>
                      This device is already syncing with a different code. It
                      will leave that one and join this ledger instead.
                    </span>
                  </p>
                )}

                <p className="font-mono text-[11px] text-[#B391A0] mt-3 pt-3 border-t border-[#3A1E2A]/5 break-all m-0">
                  {pendingCode}
                </p>
              </Card>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button
                  onClick={handleCancelJoin}
                  className="min-h-11 px-4 rounded-xl text-xs font-semibold text-[#5A3645] border border-[#3A1E2A]/10 hover:bg-white/60 transition-colors cursor-pointer"
                >
                  Not now
                </button>
                <button
                  onClick={handleConfirmJoin}
                  className="min-h-11 px-5 rounded-xl text-xs font-semibold bg-[#C24E6E] text-white hover:bg-[#3A1E2A] transition-colors shadow-2xs cursor-pointer"
                >
                  Connect these devices
                </button>
              </div>
            </>
          ) : syncing ? (
            /* --- SYNCING: WAITING OR LINKED ----------------------------- */
            <>
              <Card className="flex items-start gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                    state === "linked"
                      ? "bg-[#9CD3B6] animate-pulse"
                      : "bg-[#F7D679]"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-[13px] text-[#3A1E2A] leading-relaxed m-0">
                    {state === "linked"
                      ? "Anything you write on either device shows up on the other one right away. You can close this."
                      : "This device is ready and listening. Open Luminosity on your other device and give it the code below."}
                  </p>
                </div>
              </Card>

              {/* The code stays visible while waiting, and tucks away once
                  linked — at that point it's only needed for a third device. */}
              {state === "waiting" ? (
                <>
                  <Card className="flex flex-col items-center gap-4">
                    <div className="p-3 bg-white border border-[#3A1E2A]/10 rounded-xl shadow-2xs">
                      <QRCodeSVG
                        value={pairUrl(shownCode)}
                        size={168}
                        bgColor="#FFFFFF"
                        fgColor="#3A1E2A"
                        level="Q"
                        marginSize={0}
                      />
                    </div>

                    <div className="w-full text-center space-y-2">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#B391A0] font-bold block">
                        Point the other device's camera here
                      </span>
                      <div className="pt-3 border-t border-[#3A1E2A]/5">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-[#B391A0] font-bold block mb-1.5">
                          or type this code
                        </span>
                        <CodeDisplay code={shownCode} />
                      </div>
                    </div>

                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleCopy("code")}
                        className="flex-1 min-h-11 rounded-xl text-[11px] font-semibold uppercase tracking-wider text-[#5A3645] border border-[#3A1E2A]/10 hover:bg-[#FBD9E0]/40 transition-colors cursor-pointer"
                      >
                        {copied === "code" ? "Code copied ✓" : "Copy code"}
                      </button>
                      <button
                        onClick={() => handleCopy("link")}
                        className="flex-1 min-h-11 rounded-xl text-[11px] font-semibold uppercase tracking-wider text-[#5A3645] border border-[#3A1E2A]/10 hover:bg-[#FBD9E0]/40 transition-colors cursor-pointer"
                      >
                        {copied === "link" ? "Link copied ✓" : "Copy link"}
                      </button>
                    </div>
                    {copyFailed && (
                      <span className="text-[11px] text-[#C24E6E] italic">
                        Copying isn't allowed here — tap the code to select it.
                      </span>
                    )}
                  </Card>

                  {stalled && (
                    <Card className="border-[#F7D679]/60 bg-[#FFFBF0]">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#B8860B] font-bold block mb-1.5">
                        Still nothing?
                      </span>
                      <ul className="text-[12.5px] text-[#5A3645] leading-relaxed list-none p-0 m-0 space-y-1.5">
                        <li>
                          Check the other device is showing the same code,
                          letter for letter.
                        </li>
                        <li>
                          Make sure it's actually open — a phone that's gone to
                          sleep isn't listening.
                        </li>
                        <li>
                          Try both devices on the same wi-fi. Some networks
                          won't let two devices reach each other directly, and
                          mobile data is the usual culprit.
                        </li>
                      </ul>
                    </Card>
                  )}
                </>
              ) : (
                <details className="group">
                  <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.18em] text-[#B391A0] hover:text-[#C24E6E] font-bold min-h-11 flex items-center gap-2">
                    <span className="transition-transform group-open:rotate-90">
                      ›
                    </span>
                    Show the code (to add a third device)
                  </summary>
                  <Card className="mt-2">
                    <CodeDisplay code={shownCode} />
                    <button
                      onClick={() => handleCopy("code")}
                      className="mt-3 text-[10px] uppercase tracking-wider font-bold text-[#C24E6E] hover:underline cursor-pointer min-h-11"
                    >
                      {copied === "code" ? "Copied ✓" : "Copy code"}
                    </button>
                  </Card>
                </details>
              )}

              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                <button
                  onClick={() => stopSync(false)}
                  className="text-[11px] text-[#5A3645] hover:text-[#C24E6E] underline underline-offset-4 min-h-11 cursor-pointer"
                >
                  Pause syncing on this device
                </button>
                <button
                  onClick={() => {
                    stopSync(true);
                    setView("choose");
                  }}
                  className="text-[11px] text-[#B391A0] hover:text-[#C24E6E] underline underline-offset-4 min-h-11 cursor-pointer"
                >
                  Forget this code
                </button>
              </div>
            </>
          ) : paused && view === "choose" ? (
            /* --- PAUSED --------------------------------------------------- */
            <>
              <Card className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 bg-[#B391A0]" />
                <p className="text-[13px] text-[#3A1E2A] leading-relaxed m-0">
                  This device still remembers its code — it just isn't sending
                  or receiving right now. Anything you write stays here until
                  you start it again.
                </p>
              </Card>

              <Card>
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#B391A0] font-bold block mb-1.5">
                  This ledger's code
                </span>
                <CodeDisplay code={shownCode} />
              </Card>

              <button
                onClick={() => void connectWithCode(shownCode)}
                className="w-full min-h-12 bg-[#C24E6E] text-white rounded-xl text-xs font-semibold hover:bg-[#3A1E2A] transition-colors cursor-pointer"
              >
                Start syncing again
              </button>

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <button
                  onClick={() => stopSync(true)}
                  className="text-[11px] text-[#B391A0] hover:text-[#C24E6E] underline underline-offset-4 min-h-11 cursor-pointer"
                >
                  Forget this code
                </button>
                <button
                  onClick={() => setView("enter")}
                  className="text-[11px] text-[#B391A0] hover:text-[#C24E6E] underline underline-offset-4 min-h-11 cursor-pointer"
                >
                  Use a different code
                </button>
              </div>
            </>
          ) : view === "enter" ? (
            /* --- ENTER A CODE ------------------------------------------- */
            <>
              <Card className="flex items-start gap-3">
                <div className="shrink-0 pt-1">
                  <CloudFriend size={40} />
                </div>
                <p className="text-[13px] text-[#3A1E2A] leading-relaxed m-0">
                  On your other device, open Luminosity and tap{" "}
                  <span className="font-semibold">Sync</span>. Type the code it
                  shows you here.
                </p>
              </Card>

              <div className="space-y-2">
                <label
                  htmlFor="pair-code"
                  className="text-[10px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold block"
                >
                  Pairing code
                </label>
                <input
                  id="pair-code"
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-white border border-[#3A1E2A]/15 rounded-xl px-3 min-h-12 text-base font-mono text-[#3A1E2A] focus:outline-none focus:border-[#C24E6E]"
                  placeholder="otter-lantern-quiet-river-4821"
                  value={typed}
                  onChange={(e) => {
                    setTyped(e.target.value);
                    setInputError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmitTyped();
                  }}
                />
                {inputError && (
                  <p className="text-[11px] text-[#C24E6E] leading-relaxed m-0">
                    {inputError}
                  </p>
                )}
                <button
                  onClick={handleSubmitTyped}
                  disabled={!typed.trim()}
                  className="w-full min-h-12 bg-[#C24E6E] text-white rounded-xl text-xs font-semibold hover:bg-[#3A1E2A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Continue
                </button>
                <button
                  onClick={() => setView("choose")}
                  className="w-full text-[11px] text-[#B391A0] hover:text-[#C24E6E] underline underline-offset-4 min-h-11 cursor-pointer"
                >
                  Back
                </button>
              </div>
            </>
          ) : (
            /* --- CHOOSE ------------------------------------------------- */
            <>
              <p className="text-[13px] text-[#5A3645] leading-relaxed m-0">
                Write on your phone, read on your laptop — the same ledger in
                both places. It goes both ways and only ever adds: each device
                ends up with everything from both, and nothing gets replaced.
                Entries travel straight between your devices, encrypted, with no
                account and no copy on a server.
              </p>

              <button
                onClick={handleStartFresh}
                className="w-full text-left bg-white p-4 rounded-xl border border-[#3A1E2A]/10 hover:border-[#C24E6E] transition-colors cursor-pointer group"
              >
                <span className="font-serif text-[15px] text-[#3A1E2A] block group-hover:text-[#C24E6E] transition-colors">
                  This is my first device →
                </span>
                <span className="text-[12px] text-[#B391A0] leading-snug block mt-1">
                  Makes a code for this ledger. Nothing here changes — you'll
                  give the code to your other device next.
                </span>
              </button>

              <button
                onClick={() => setView("enter")}
                className="w-full text-left bg-white p-4 rounded-xl border border-[#3A1E2A]/10 hover:border-[#C24E6E] transition-colors cursor-pointer group"
              >
                <span className="font-serif text-[15px] text-[#3A1E2A] block group-hover:text-[#C24E6E] transition-colors">
                  I'm adding this device →
                </span>
                <span className="text-[12px] text-[#B391A0] leading-snug block mt-1">
                  You already set up another device and have its code.
                </span>
              </button>
            </>
          )}

          {state === "error" && engineError && (
            <Card className="border-[#E07A95]/40 bg-[#FDECEF]">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold block mb-1">
                Sync couldn't start
              </span>
              <p className="text-[12px] text-[#5A3645] leading-relaxed m-0">
                {engineError}
              </p>
            </Card>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-dashed border-[#3A1E2A]/10 text-center relative z-10">
          <span className="font-serif italic text-[11px] text-[#B391A0] block leading-relaxed">
            ✿ Encrypted end to end · your entries go device to device, never
            through a server that can read them ✿
          </span>
        </div>
      </div>
    </div>
  );
};
