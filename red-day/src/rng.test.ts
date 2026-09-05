import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mulberry32, daySeed, hashString, pick } from "./rng";

describe("rng", () => {
  it("is deterministic for a seed", () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    assert.equal(a(), b());
    assert.equal(a(), b());
  });

  it("hashes strings stably", () => {
    assert.equal(hashString("Paper Hands LLC"), hashString("Paper Hands LLC"));
    assert.notEqual(hashString("CHAI"), hashString("NBL"));
  });

  it("picks from a list", () => {
    const rng = mulberry32(1);
    const v = pick(rng, ["a", "b", "c"] as const);
    assert.ok(["a", "b", "c"].includes(v));
  });

  it("daySeed changes by day", () => {
    assert.notEqual(daySeed(9, 1), daySeed(9, 2));
  });
});
