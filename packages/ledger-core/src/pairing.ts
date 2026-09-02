// Everything about pairing two devices lives here, so no UI ever has to think
// about rooms, passwords, or signalling.
//
// The model is deliberately flat: **one ledger has one code.** A device that
// knows the code is on the ledger; a device that doesn't, isn't. There is no
// host and no guest — the code is symmetric, which is what y-webrtc actually
// does underneath. The old UI invented a host/join distinction that the
// transport never had, and asked people to pick a side before they knew what
// either side meant.
//
// The code is generated once, persisted, and reused forever. That is the whole
// fix for "it forgets my pairing every reload."

const WORDS = `amber anchor apple arbor ash aspen attic autumn basil bay beach beacon bean bell
 berry birch bird bloom blue boat bowl branch brass bread breeze brick bridge brook broom
 brown bud cabin candle cedar chalk cherry chime clay clear cliff cloud clover coal coast
 cocoa comet coral cork cotton cove crane creek crest crow cup daisy dawn deep delta dew
 door dove drift dune dusk earth east ember fable fair fawn fern field fig finch fir flame
 flax fleece flint flower fog forest fox frost garden gate gentle glass glen gold grain
 grass green grove gull hall harbor harvest haven hazel hearth heather hill hollow honey
 hush ice indigo iris ivory ivy jade juniper kettle key kind lace ladder lake lamp lantern
 lark laurel leaf ledge lemon lily linen little loam lock loom lotus lull lunar maple
 marble marsh meadow mellow mesa mild mill mint mist moon moss moth near nest north oak
 oat ocean olive onyx opal orchard otter owl paper pasture patch peach pear pearl pebble
 pepper petal pine plain plum pond poplar poppy porch prairie quail quartz quiet quill
 rain raven reed reef ridge rise river robin rock root rose rowan rust sage sail salt sand
 sea sedge seed shade shale shell shore silk silver slate slope small smoke snow soft
 sorrel south spark spring spruce star stem stone stream summer sun swallow swan sweet
 tally teal thistle thorn thread thrush tide timber tin topaz trail tulip twine umber
 vale valley velvet vine violet warm water wave wax west wheat wick wild willow window
 wing winter wisp wood wool wren yarrow yellow yew`
    .split(/\s+/)
    .filter(Boolean);

// Shared verbatim by every app on this substrate, which is safe only because
// localStorage is scoped per origin and each app is deployed to its own. Serve
// two of them from one origin and they would fight over this key.
const PAIR_KEY = "lumi-pairing-v1";

export interface StoredPairing {
  code: string;
  /** Whether sync should resume automatically on the next load. */
  enabled: boolean;
}

/**
 * A fresh code: four words plus four digits, ~45 bits of entropy from the
 * platform CSPRNG. Readable enough to say out loud to the phone in your other
 * hand, short enough to type. The old code used Math.random() for the secret,
 * which is not a random source you want standing between a private journal and
 * a public relay.
 */
export const generateCode = (): string => {
  const picks = new Uint32Array(5);
  crypto.getRandomValues(picks);
  const words = Array.from(picks.slice(0, 4), (n) => WORDS[n % WORDS.length]);
  const digits = String((picks[4] ?? 0) % 10000).padStart(4, "0");
  return [...words, digits].join("-");
};

/**
 * Accepts anything a person might paste — a full pairing URL, the bare code,
 * words separated by spaces, mixed case, or the legacy `room::secret` phrase
 * from the previous build — and returns a canonical code, or null.
 */
export const normalizeCode = (raw: string): string | null => {
  const text = raw.trim();
  if (!text) return null;

  // A pairing URL from the QR code or the copy button.
  const fromUrl = text.match(/[?&]pair=([^&#\s]+)/i);
  if (fromUrl?.[1]) return normalizeCode(decodeURIComponent(fromUrl[1]));

  // Legacy shapes: `?room=x&secret=y` links and `room::secret` phrases. Both
  // encoded a room the current build can no longer derive, but honouring them
  // means an old link in someone's notes still lands somewhere sensible rather
  // than erroring.
  const legacyUrl = text.match(/room=([^&#\s]+)[\s\S]*?secret=([^&#\s]+)/i);
  if (legacyUrl?.[1] && legacyUrl[2]) return `${legacyUrl[1]}-${legacyUrl[2]}`.toLowerCase();
  if (text.includes("::")) {
    const [room, secret] = text.split("::").map((s) => s.trim());
    if (room && secret) return `${room}-${secret}`.toLowerCase();
  }

  // Bare code. Tolerate spaces, commas and repeated separators.
  const cleaned = text
    .toLowerCase()
    .replace(/[\s,_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  return /^[a-z0-9-]{6,}$/.test(cleaned) ? cleaned : null;
};

const sha256Hex = async (input: string): Promise<string> => {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
};

/**
 * What a code is for. These derive to *different rooms from the same code*,
 * which is a safety property rather than a nicety:
 *
 * A device code and a space code are both just words-and-digits, and a person
 * will eventually paste one into the other's box. Without a namespace they
 * would resolve to the same room — and since y-webrtc syncs whole documents,
 * a private ledger joining a space's room would push its needs, people and
 * arrangements onto the other person's device. Their UI would not draw any of
 * it; it would simply be there. With a namespace, a mis-pasted code lands in
 * an empty room and nothing crosses.
 *
 * `device` keeps the original, unprefixed derivation so pairings made before
 * spaces existed keep working.
 */
export type CodePurpose = "device" | "space";

const scoped = (purpose: CodePurpose, code: string): string =>
  purpose === "device" ? code : `${purpose}:${code}`;

/**
 * The room id is a hash of the code, never the code itself — the signalling
 * relay sees which rooms exist, and it should not be able to read the shared
 * secret out of a room name. The encryption password is hashed under a
 * different prefix so knowing one never yields the other.
 */
export const deriveRoom = async (
  code: string,
  purpose: CodePurpose = "device",
): Promise<string> =>
  `lumi-${(await sha256Hex(`room:${scoped(purpose, code)}`)).slice(0, 24)}`;

export const derivePassword = async (
  code: string,
  purpose: CodePurpose = "device",
): Promise<string> => sha256Hex(`key:${scoped(purpose, code)}`);

// --- Persistence ----------------------------------------------------------

export const loadPairing = (): StoredPairing | null => {
  try {
    const raw = localStorage.getItem(PAIR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPairing>;
    if (typeof parsed?.code !== "string" || !parsed.code) return null;
    return { code: parsed.code, enabled: parsed.enabled !== false };
  } catch {
    return null;
  }
};

export const savePairing = (pairing: StoredPairing): void => {
  try {
    localStorage.setItem(PAIR_KEY, JSON.stringify(pairing));
  } catch {
    /* private mode / quota — sync just won't resume next load */
  }
};

export const clearPairing = (): void => {
  try {
    localStorage.removeItem(PAIR_KEY);
  } catch {
    /* nothing to do */
  }
};

// --- Deep link ------------------------------------------------------------

export const pairUrl = (code: string): string => {
  if (typeof window === "undefined") return "";
  const { origin, pathname } = window.location;
  return `${origin}${pathname}?pair=${encodeURIComponent(code)}`;
};

/**
 * An invitation to a shared space. A separate parameter from `pair` on
 * purpose: following one of these must never be able to join someone to your
 * private ledger, and a link is the form a code actually gets sent in.
 */
export const spaceUrl = (code: string): string => {
  if (typeof window === "undefined") return "";
  const { origin, pathname } = window.location;
  return `${origin}${pathname}?space=${encodeURIComponent(code)}`;
};

/**
 * Reads a pairing code out of the address bar and immediately scrubs it, so a
 * shared screenshot or a browser-history entry doesn't carry the secret around
 * after the fact. The hash route is preserved.
 *
 * This is the half that was missing: the old build printed `?room=…&secret=…`
 * into a QR code that nothing ever read back, so scanning it only ever opened
 * the app.
 */
const takeCodeFromUrl = (keys: string[]): string | null => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const raw = keys.map((k) => params.get(k)).find((v) => v !== null) ?? null;
  if (!raw) return null;

  const code = normalizeCode(raw);

  for (const k of [...keys, "secret"]) params.delete(k);
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
  );

  return code;
};

/** An invitation to someone else's shared space, if the URL carries one. */
export const takeSpaceCodeFromUrl = (): string | null =>
  takeCodeFromUrl(["space"]);

export const takePairCodeFromUrl = (): string | null => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("pair") ?? params.get("room");
  if (!raw) return null;

  const code = normalizeCode(window.location.href);

  params.delete("pair");
  params.delete("room");
  params.delete("secret");
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
  );

  return code;
};
