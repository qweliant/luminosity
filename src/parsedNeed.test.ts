import { test, expect } from "bun:test";
import { parseCompositeNeed } from "./parsedNeed";

test("empty input returns empty parse", () => {
  const p = parseCompositeNeed("");
  expect(p.core).toBe("");
  expect(p.hasExtracted).toBe(false);
});

test("plain need with no labels stays in core", () => {
  const p = parseCompositeNeed("To feel rested and connected.");
  expect(p.core).toBe("To feel rested and connected.");
  expect(p.hasExtracted).toBe(false);
});

test("strips Brakes section into its own field", () => {
  const p = parseCompositeNeed(
    "To feel rested. Brakes to watch: late nights, screens.",
  );
  expect(p.core).toBe("To feel rested.");
  expect(p.brakes).toBe("late nights, screens.");
  expect(p.hasExtracted).toBe(true);
});

test("strips multiple labeled sections in any order", () => {
  const p = parseCompositeNeed(
    "Sleep enough. Reframe: rest is productive. Prototype (do): 10pm phone-down. Accelerators: cool room. Brakes to watch: doomscrolling.",
  );
  expect(p.core).toBe("Sleep enough.");
  expect(p.reframe).toBe("rest is productive.");
  expect(p.prototype).toBe("10pm phone-down.");
  expect(p.accelerators).toBe("cool room.");
  expect(p.brakes).toBe("doomscrolling.");
  expect(p.hasExtracted).toBe(true);
});

test("Prototype label matches with or without parens", () => {
  const a = parseCompositeNeed("X. Prototype: do the thing.");
  expect(a.prototype).toBe("do the thing.");
  const b = parseCompositeNeed("X. Prototype (talk): ask a friend.");
  expect(b.prototype).toBe("ask a friend.");
});
