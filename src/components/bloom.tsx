// Brand mascots and decorative SVGs. Stateless, no business logic.
// `BloomFlower` is reused as both the wordmark dot and the ambient backdrop.

export const BloomFlower = ({
  size = 28,
  petal = "#E07A95",
  eye = "#3A1E2A",
  smile = true,
}: {
  size?: number;
  petal?: string;
  eye?: string;
  smile?: boolean;
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

export const LumiBean = ({ size = 80 }: { size?: number }) => (
  <svg
    width={size}
    height={size * 1.15}
    viewBox="-10 -15 120 130"
    className="overflow-visible inline-block"
  >
    <ellipse cx="50" cy="108" rx="24" ry="3" fill="#3A1E2A" opacity="0.10" />

    <ellipse
      cx="50"
      cy="58"
      rx="32"
      ry="36"
      fill="#FFF5DC"
      stroke="#3A1E2A"
      strokeWidth="2"
    />

    <ellipse cx="50" cy="74" rx="20" ry="14" fill="#FFFDF6" opacity="0.7" />

    <g transform="translate(76 22) rotate(18)">
      <BloomFlower size={34} petal="#C24E6E" smile={false} />
    </g>

    <path
      d="M82 38 Q90 36 92 28 Q86 30 82 38 Z"
      fill="#9CD3B6"
      stroke="#3A1E2A"
      strokeWidth="1"
      strokeOpacity="0.4"
    />

    <ellipse cx="30" cy="66" rx="6.5" ry="4" fill="#E07A95" opacity="0.75" />
    <ellipse cx="70" cy="66" rx="6.5" ry="4" fill="#E07A95" opacity="0.75" />

    <ellipse cx="40" cy="56" rx="3" ry="4" fill="#3A1E2A" />
    <ellipse cx="60" cy="56" rx="3" ry="4" fill="#3A1E2A" />

    <circle cx="41.2" cy="54.5" r="0.9" fill="#fff" />
    <circle cx="61.2" cy="54.5" r="0.9" fill="#fff" />

    <path
      d="M42 71 Q50 77 58 71"
      stroke="#3A1E2A"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />

    <ellipse cx="38" cy="96" rx="7" ry="3" fill="#3A1E2A" />
    <ellipse cx="62" cy="96" rx="7" ry="3" fill="#3A1E2A" />
  </svg>
);

// Visual indicator for "brakes" (Nagoski) — four-petal variant of the bloom
// in a desaturated purple. Used wherever the Brake metaphor needs an icon.
export const BrakeMark = ({ size = 12 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className="inline-block align-middle"
  >
    {[0, 72, 144, 216].map((a, i) => (
      <path
        key={i}
        d="M50 50 C 28 38, 22 12, 50 4 C 78 12, 72 38, 50 50 Z"
        fill="#B391A0"
        opacity="0.55"
        transform={`rotate(${a} 50 50)`}
      />
    ))}
    <circle cx="50" cy="50" r="9" fill="#5A3645" opacity="0.6" />
    <circle cx="50" cy="50" r="3" fill="#F7D679" opacity="0.7" />
  </svg>
);

// Five-flower workability picker (1–5). Filled flowers smile; empty flowers
// are ghost-tinted. `size` lets the Focus overlay use a larger variant
// without a parallel component.
export const BloomWorkability = ({
  value = 0,
  onChange,
  size = 16,
  toggleable = false,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  /** If true, clicking the active dot clears the rating (Focus behavior). */
  toggleable?: boolean;
}) => {
  // The Focus-mode picker is visually larger and breathes more; condensed-row
  // is tighter. Scale the padding to the dot size so both look balanced.
  const px = size >= 20 ? "px-3" : "px-2";
  const py = size >= 20 ? "py-1.5" : "py-1";
  const gap = size >= 20 ? "gap-2" : "gap-1";
  return (
    <span
      className={`inline-flex ${gap} items-center bg-[#FAE6E1]/50 ${px} ${py} rounded-full border border-[#3A1E2A]/5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(toggleable && value === n ? 0 : n)}
          className="focus:outline-none hover:scale-110 transition-transform cursor-pointer p-0.5"
          title={`Rate workability ${n}/5`}
        >
          <BloomFlower
            size={size}
            petal={n <= value ? "#E07A95" : "#FBD9E0"}
            eye={n <= value ? "#3A1E2A" : "#B391A0"}
            smile={n <= value}
          />
        </button>
      ))}
    </span>
  );
};

// CloudFriend — soft cloud mascot used by the Focus mode synthesis step to
// soften the deterministic "here's what your need looks like" handoff.
export const CloudFriend = ({ size = 60 }: { size?: number }) => (
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

export const BloomWordmark = ({ size = 38 }: { size?: number }) => (
  <span
    className="font-serif font-normal inline-flex items-baseline tracking-[-0.01em] text-[#3A1E2A]"
    style={{ fontSize: size }}
  >
    Lum
    <span className="relative inline-block mx-[1px]">
      <span className="invisible">i</span>

      <span aria-hidden className="absolute left-1/2 top-[8%] -translate-x-1/2">
        <BloomFlower size={size * 0.32} petal="#C24E6E" eye="#3A1E2A" />
      </span>

      <span
        aria-hidden
        className="absolute left-1/2 top-[42%] -translate-x-1/2 w-[2px] rounded-full bg-[#3A1E2A]"
        style={{ height: size * 0.55 }}
      />
    </span>
    nosity
  </span>
);
