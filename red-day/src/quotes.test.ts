import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ACCOUNTANT_QUOTES, JULES_QUOTES, MAYA_QUOTES, Talker } from "./quotes";

function assertPool(name: string, idle: readonly string[]): void {
  assert.ok(idle.length >= 6 && idle.length <= 8, `${name} needs 6–8 idle lines, got ${idle.length}`);
  assert.equal(new Set(idle).size, idle.length, `${name} idle lines must be unique`);
}

describe("quote pools", () => {
  it("gives Maya, Jules, and the Accountant 6–8 unique idle lines", () => {
    assertPool("Maya", MAYA_QUOTES.idle);
    assertPool("Jules", JULES_QUOTES.idle);
    assertPool("Accountant", ACCOUNTANT_QUOTES.idle);
  });

  it("does not immediately repeat and uses the whole bag", () => {
    const talker = new Talker(["a", "b", "c", "d", "e", "f"]);
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) seen.push(talker.next());
    assert.equal(new Set(seen).size, 6);
    for (let i = 1; i < seen.length; i++) {
      assert.notEqual(seen[i], seen[i - 1]);
    }
    const seventh = talker.next();
    assert.notEqual(seventh, seen[5]);
  });
});
