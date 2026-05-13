import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  connectWebRTC,
  disconnectWebRTC,
  isSyncing,
} from "../services/syncEngine";

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

// --- Component Root -------------------------------------------------------

export const SyncOverlay = ({
  open,
  onClose,
  onMountStorage,
}: {
  open: boolean;
  onClose: () => void;
  onMountStorage: () => Promise<boolean>;
}) => {
  const [activeTab, setActiveTab] = useState<"host" | "join">("host");
  const [roomName, setRoomName] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [joinString, setJoinString] = useState("");
  const [connectionLive, setConnectionLive] = useState(() => isSyncing());
  const [storageMounted, setStorageMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && !roomName) {
      const randomEntropy = () => Math.random().toString(36).substring(2, 10);
      setRoomName(`luminosity-${randomEntropy()}`);
      setSecretKey(`sec-${randomEntropy()}-${randomEntropy()}`);
    }
    setConnectionLive(isSyncing());
  }, [open, roomName]);

  if (!open) return null;

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";
  const syncUrlString = `${baseUrl}?room=${roomName}&secret=${secretKey}`;
  const portablePairingPhrase = `${roomName}::${secretKey}`;

  const handleHostConnect = () => {
    if (!roomName || !secretKey) return;
    connectWebRTC({ roomName, secretKey });
    setConnectionLive(true);
  };

  const handleManualJoin = () => {
    const raw = joinString.trim();
    if (!raw) return;

    let extractedRoom = "";
    let extractedSecret = "";

    const roomMatch = raw.match(/room=([^&*\s]+)/i);
    const secretMatch = raw.match(/secret=([^&*\s]+)/i);

    if (roomMatch && secretMatch && roomMatch[1] && secretMatch[1]) {
      extractedRoom = roomMatch[1];
      extractedSecret = secretMatch[1];
    } else if (raw.includes("::")) {
      const parts = raw.split("::").map((s) => s.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        extractedRoom = parts[0];
        extractedSecret = parts[1];
      }
    }

    if (extractedRoom && extractedSecret) {
      connectWebRTC({ roomName: extractedRoom, secretKey: extractedSecret });
      setConnectionLive(true);
      onClose();
    } else {
      alert(
        "Could not extract clean network variables. Paste either the direct URL link or the compact phrase: roomName::secretKey",
      );
    }
  };

  const handleDisconnect = () => {
    disconnectWebRTC();
    setConnectionLive(false);
  };

  const handleClipboardCopy = () => {
    navigator.clipboard.writeText(syncUrlString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if current browser context supports native folder mounting safely
  const supportsNativeDisk =
    typeof window !== "undefined" && "showDirectoryPicker" in window;

  return (
    <div className="fixed inset-0 bg-[#FAE6E1]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-xl bg-[#FDF4F0] border border-[#3A1E2A]/15 rounded-[18px] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Ambient background decoration */}
        <div
          aria-hidden="true"
          className="absolute right-[-20px] top-[-20px] opacity-40 pointer-events-none"
        >
          <BloomFlower size={120} petal="#F4ABBC" smile={false} />
        </div>

        {/* Dialog Header */}
        <div className="flex justify-between items-start mb-6 border-b border-dashed border-[#3A1E2A]/10 pb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C24E6E] font-bold">
                ✿ Quiet Intercom ✿
              </span>
            </div>
            <h2 className="text-2xl font-serif text-[#3A1E2A] mt-1 tracking-[-0.01em]">
              Connect your screens to keep entries flowing together.
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-xl text-[#B391A0] hover:text-[#C24E6E] transition-colors p-1 cursor-pointer"
            aria-label="Close interface overlay"
          >
            ×
          </button>
        </div>

        {/* Action-Oriented Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 relative z-10">
          <button
            onClick={() => setActiveTab("host")}
            className={`px-4 py-1.5 rounded-full font-sans text-xs font-medium transition-all cursor-pointer ${
              activeTab === "host"
                ? "bg-[#C24E6E] text-white shadow-2xs"
                : "bg-transparent text-[#5A3645] border border-[#3A1E2A]/10 hover:bg-white/50"
            }`}
          >
            ✿ Start a new connection
          </button>
          <button
            onClick={() => setActiveTab("join")}
            className={`px-4 py-1.5 rounded-full font-sans text-xs font-medium transition-all cursor-pointer ${
              activeTab === "join"
                ? "bg-[#C24E6E] text-white shadow-2xs"
                : "bg-transparent text-[#5A3645] border border-[#3A1E2A]/10 hover:bg-white/50"
            }`}
          >
            🔗 Link to an active screen
          </button>
        </div>

        {/* --- START CONNECTION VIEW --- */}
        {activeTab === "host" ? (
          <div className="space-y-5 relative z-10 animate-in fade-in duration-150">
            {/* Conditional Folder Backup Row (Only shows if browser supports it) */}
            {supportsNativeDisk && (
              <div className="bg-white p-4 rounded-xl border border-[#3A1E2A]/5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#5A3645] font-bold block mb-0.5">
                    1. Tending your local archive (Optional)
                  </span>
                  <p className="text-xs text-[#B391A0] m-0 leading-snug">
                    {storageMounted
                      ? "✓ Safe-keeping folder linked beautifully."
                      : "Pick a folder on this device to save quiet offline backups while you write."}
                  </p>
                </div>

                <button
                  onClick={async () => {
                    const ok = await onMountStorage();
                    if (ok) setStorageMounted(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-sans text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    storageMounted
                      ? "bg-[#9CD3B6]/20 text-[#1F6E4A] border border-[#9CD3B6]"
                      : "bg-[#FFF5DC] text-[#5A3645] border border-[#F7D679] hover:bg-[#F7D679]/40"
                  }`}
                >
                  {storageMounted ? "Linked ✓" : "Pick Folder ✿"}
                </button>
              </div>
            )}

            {/* Visual Dead-Drop Pairing QR Frame */}
            <div className="bg-white p-5 rounded-xl border border-[#3A1E2A]/5 flex flex-col sm:flex-row items-center gap-6">
              <div className="p-3 bg-white border border-[#3A1E2A]/10 rounded-xl shrink-0 shadow-2xs">
                <QRCodeSVG
                  value={syncUrlString}
                  size={140}
                  bgColor="#FFFFFF"
                  fgColor="#3A1E2A"
                  level="Q"
                  marginSize={0}
                />
              </div>

              <div className="space-y-3 w-full text-center sm:text-left">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold block mb-0.5">
                    {supportsNativeDisk ? "2." : "1."} Scan or copy secret link
                  </span>
                  <p className="text-xs text-[#3A1E2A] m-0 leading-relaxed">
                    Open the camera or paste this link on your other screen to
                    let them introduce themselves.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#3A1E2A]/5 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-[#B391A0] truncate max-w-[180px]">
                    {portablePairingPhrase}
                  </span>

                  <button
                    onClick={handleClipboardCopy}
                    className="text-[10px] text-[#C24E6E] hover:underline uppercase tracking-wider font-bold shrink-0 cursor-pointer"
                  >
                    {copied ? "Copied Link ✓" : "Copy Link ✿"}
                  </button>
                </div>
              </div>
            </div>

            {/* Connection Channel State Controls */}
            <div className="bg-white p-5 rounded-xl border border-[#3A1E2A]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold block mb-0.5">
                  {supportsNativeDisk ? "3." : "2."} Open the channel
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      connectionLive
                        ? "bg-[#9CD3B6] animate-pulse"
                        : "bg-[#E07A95]"
                    }`}
                  />
                  <span className="font-mono text-[10px] text-[#5A3645]">
                    {connectionLive
                      ? "Listening quietly for your other screen..."
                      : "Channel is resting offline"}
                  </span>
                </div>
              </div>

              {connectionLive ? (
                <button
                  onClick={handleDisconnect}
                  className="text-xs text-[#C24E6E] hover:underline font-medium cursor-pointer self-end sm:self-center"
                >
                  Close channel
                </button>
              ) : (
                <button
                  onClick={handleHostConnect}
                  className="bg-[#3A1E2A] text-white px-4 py-2 rounded-full font-sans text-xs font-medium hover:bg-[#C24E6E] transition-colors shadow-2xs cursor-pointer w-full sm:w-auto"
                >
                  Start Sync Engine ✿
                </button>
              )}
            </div>
          </div>
        ) : (
          /* --- JOIN CONNECTION VIEW --- */
          <div className="space-y-5 relative z-10 animate-in fade-in duration-150">
            <div className="bg-white p-5 rounded-xl border border-[#3A1E2A]/5 flex items-start gap-4">
              <div className="shrink-0 pt-1">
                <CloudFriend size={44} />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#5A3645] font-bold block mb-1">
                  Catching active entries
                </span>
                <p className="text-xs text-[#3A1E2A] m-0 leading-relaxed">
                  If scanning the QR code directly feels awkward, just paste
                  your private link or compact phrase below to securely tie this
                  screen in.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold block">
                Paste your secret link
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-white border border-[#3A1E2A]/15 rounded-xl px-3 py-2 text-xs font-mono text-[#3A1E2A] focus:outline-none focus:border-[#C24E6E]"
                  placeholder="luminosity-room::secret-key"
                  value={joinString}
                  onChange={(e) => setJoinString(e.target.value)}
                />
                <button
                  onClick={handleManualJoin}
                  disabled={!joinString.trim()}
                  className="bg-[#C24E6E] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#3A1E2A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                >
                  Link Screen
                </button>
              </div>
              <span className="text-[9px] text-[#B391A0] block italic">
                Accepts full URLs or compact phrases: roomName::secretKey
              </span>
            </div>
          </div>
        )}

        {/* Legal Safeguard Footnote */}
        <div className="mt-6 pt-4 border-t border-dashed border-[#3A1E2A]/10 text-center relative z-10">
          <span className="font-serif italic text-[11px] text-[#B391A0] block">
            ✿ End-to-end encrypted · Data flows directly screen-to-screen
            without central logging ✿
          </span>
        </div>
      </div>
    </div>
  );
};
