import { test, expect, describe } from "bun:test";
import {
  deriveRoom,
  derivePassword,
  generateCode,
  normalizeCode,
} from "./pairing";

describe("generateCode", () => {
  test("is four words plus four digits", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateCode()).toMatch(/^[a-z]+(-[a-z]+){3}-\d{4}$/);
    }
  });

  test("doesn't repeat across a large sample", () => {
    const codes = new Set(Array.from({ length: 500 }, generateCode));
    expect(codes.size).toBe(500);
  });

  test("survives a round trip through normalizeCode", () => {
    const code = generateCode();
    expect(normalizeCode(code)).toBe(code);
  });
});

describe("normalizeCode", () => {
  const CODE = "otter-lantern-quiet-river-4821";

  test("accepts the bare code", () => {
    expect(normalizeCode(CODE)).toBe(CODE);
  });

  test("accepts spaces, mixed case, and stray whitespace", () => {
    expect(normalizeCode("  Otter Lantern Quiet River 4821 ")).toBe(CODE);
    expect(normalizeCode("OTTER-LANTERN-QUIET-RIVER-4821")).toBe(CODE);
  });

  test("pulls the code out of a pairing URL", () => {
    expect(normalizeCode(`https://lumi.example/?pair=${CODE}`)).toBe(CODE);
  });

  // The hash route trails the query string, so the fragment must not be
  // swallowed into the code.
  test("stops at the hash route in a pairing URL", () => {
    expect(normalizeCode(`https://lumi.example/?pair=${CODE}#/matrix`)).toBe(
      CODE,
    );
  });

  test("still understands links and phrases from the old build", () => {
    expect(normalizeCode("luminosity-x7f3k2a9::sec-abc123-def456")).toBe(
      "luminosity-x7f3k2a9-sec-abc123-def456",
    );
    expect(
      normalizeCode("https://lumi.example/?room=luminosity-ab12&secret=sec-cd34"),
    ).toBe("luminosity-ab12-sec-cd34");
  });

  test("rejects input that isn't a code", () => {
    expect(normalizeCode("")).toBeNull();
    expect(normalizeCode("   ")).toBeNull();
    expect(normalizeCode("nope")).toBeNull();
    expect(normalizeCode("what is my code?")).toBeNull();
  });
});

describe("derivation", () => {
  const CODE = "otter-lantern-quiet-river-4821";

  test("is stable for the same code", async () => {
    expect(await deriveRoom(CODE)).toBe(await deriveRoom(CODE));
    expect(await derivePassword(CODE)).toBe(await derivePassword(CODE));
  });

  test("differs for different codes", async () => {
    expect(await deriveRoom(CODE)).not.toBe(
      await deriveRoom("otter-lantern-quiet-river-4822"),
    );
  });

  // The relay can see room names. It must not be able to read the shared
  // secret out of one, nor recover the password from the room id.
  test("never leaks the code or the password through the room id", async () => {
    const room = await deriveRoom(CODE);
    const password = await derivePassword(CODE);
    expect(room).not.toContain("otter");
    expect(room).not.toContain(CODE);
    expect(room).not.toContain(password);
    expect(password).not.toContain(room.replace("lumi-", ""));
  });
});

// --- Code namespacing --------------------------------------------------------
// A device code and a space code are indistinguishable strings, so someone will
// eventually paste one into the other's box. These pin the property that makes
// that harmless rather than a privacy leak.

test("the same code resolves to different rooms per purpose", async () => {
  const code = "amber-brook-cedar-dawn-1234";
  const device = await deriveRoom(code, "device");
  const space = await deriveRoom(code, "space");
  expect(device).not.toBe(space);
});

test("the same code resolves to different passwords per purpose", async () => {
  const code = "amber-brook-cedar-dawn-1234";
  expect(await derivePassword(code, "device")).not.toBe(
    await derivePassword(code, "space"),
  );
});

test("device derivation is unchanged, so pairings made before spaces still work", async () => {
  const code = "amber-brook-cedar-dawn-1234";
  expect(await deriveRoom(code)).toBe(await deriveRoom(code, "device"));
  expect(await derivePassword(code)).toBe(await derivePassword(code, "device"));
});

test("a room id never contains the code itself", async () => {
  const code = "amber-brook-cedar-dawn-1234";
  for (const purpose of ["device", "space"] as const) {
    expect(await deriveRoom(code, purpose)).not.toContain(code);
  }
});
