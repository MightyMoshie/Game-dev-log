import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyMandate, applyPitchDecisions, mandateBroken, MANDATES, pitchCards } from "./pitch";
import {
  applyCurriculumUnlock,
  SCAR_COST,
  STARTER_SCARS,
  scarsEarned,
  tryBuyUpgrade,
} from "./progress";
import { pickRoast } from "./copy";
import { buildDay, closeDay, newBooks } from "./sim";
import { newDesk } from "./state";

describe("curriculum unlock", () => {
  it("does not unlock Jules on a green Day 1", () => {
    const save = newDesk("Paper Hands LLC");
    save.day = 1;
    assert.equal(applyCurriculumUnlock(save, 40), false);
    assert.equal(save.hasSeat2, false);
    assert.equal(save.hasUpgrades, false);
  });

  it("unlocks on the first real red day and grants starter Scars", () => {
    const save = newDesk("Paper Hands LLC");
    save.day = 1;
    assert.equal(applyCurriculumUnlock(save, -40), true);
    assert.equal(save.hasSeat2, true);
    assert.equal(save.hasUpgrades, true);
    assert.equal(save.scars, STARTER_SCARS);
  });

  it("unlocks when entering Day 3 after finishing Day 2", () => {
    const save = newDesk("Paper Hands LLC");
    save.day = 2;
    save.day += 1;
    assert.equal(applyCurriculumUnlock(save, 80), true);
    assert.equal(save.hasSeat2, true);
    assert.equal(save.scars, STARTER_SCARS);
  });

  it("grants an existing Day 3 save that never unlocked", () => {
    const save = newDesk("Paper Hands LLC");
    save.day = 3;
    save.hasSeat2 = false;
    assert.equal(applyCurriculumUnlock(save), true);
    assert.equal(save.hasSeat2, true);
  });

  it("leaves an already-unlocked save alone", () => {
    const save = newDesk("Paper Hands LLC");
    save.hasSeat2 = true;
    save.hasUpgrades = true;
    save.scars = 7;
    assert.equal(applyCurriculumUnlock(save, -90), false);
    assert.equal(save.scars, 7);
  });
});

describe("scars", () => {
  it("grants +2 on a real red, +1 recovered yank, +1 panic", () => {
    assert.equal(scarsEarned({ pnl: -10, recoveredYank: false, panic: false }), 0);
    assert.equal(scarsEarned({ pnl: -26, recoveredYank: false, panic: false }), 2);
    assert.equal(scarsEarned({ pnl: 10, recoveredYank: true, panic: false }), 1);
    assert.equal(scarsEarned({ pnl: -40, recoveredYank: true, panic: true }), 4);
  });

  it("shop open floors Scars at 2 so one upgrade is buyable", () => {
    const save = newDesk("Paper Hands LLC");
    save.scars = 0;
    applyCurriculumUnlock(save, -30);
    assert.ok(save.scars >= STARTER_SCARS);
    assert.equal(tryBuyUpgrade(save, "espresso"), true);
    assert.equal(save.upgradeEspresso, true);
    assert.equal(save.scars, STARTER_SCARS - SCAR_COST);
    assert.equal(tryBuyUpgrade(save, "research"), false);
  });

  it("cannot buy before the shop opens", () => {
    const save = newDesk("Paper Hands LLC");
    save.scars = 4;
    assert.equal(tryBuyUpgrade(save, "compliance"), false);
    assert.equal(save.upgradeCompliance, false);
  });
});

describe("morning pitch", () => {
  it("Seat keeps full book size; Cut halves notional", () => {
    const day = buildDay({ runSeed: 8, day: 1, cash: 10_000, accountantHired: false });
    const full = applyPitchDecisions(day.seats, { maya: "seat" }, 1);
    assert.equal(full.length, 1);
    assert.equal(full[0]?.sizeBand, "full");
    assert.equal(full[0]?.size, day.seats[0]?.size);

    const cut = applyPitchDecisions(day.seats, { maya: "cut" }, 1);
    assert.equal(cut[0]?.sizeBand, "half");
    assert.ok(Math.abs((cut[0]?.size ?? 0) - day.seats[0]!.size * 0.5) < 1e-9);
    day.seats = cut;
    const book = newBooks(day, 10_000)[0]!;
    assert.ok(Math.abs(book.notional - 10_000 * cut[0]!.size) < 1);
    assert.equal(book.sizeBand, "half");
  });

  it("Day 1 cannot reject-all off the floor", () => {
    const day = buildDay({ runSeed: 8, day: 1, cash: 10_000, accountantHired: false });
    const seated = applyPitchDecisions(day.seats, { maya: "reject" }, 1);
    assert.equal(seated.length, 1);
    assert.equal(seated[0]?.id, "maya");
    assert.equal(seated[0]?.sizeBand, "full");
  });

  it("later days may reject everyone", () => {
    const day = buildDay({ runSeed: 8, day: 3, cash: 10_000, accountantHired: false, seat2: true });
    const seated = applyPitchDecisions(day.seats, { maya: "reject", jules: "reject" }, 3);
    assert.equal(seated.length, 0);
    const { roast, pnl } = closeDay(day, [], { emptyFloor: true });
    assert.equal(pnl, 0);
    assert.equal(roast.id, "empty_chairs");
  });

  it("HALF_SIZE mandate cuts remaining full books; FOMO add breaks it", () => {
    const day = buildDay({ runSeed: 8, day: 2, cash: 10_000, accountantHired: false, seat2: true });
    const seated = applyMandate(applyPitchDecisions(day.seats, { maya: "seat", jules: "seat" }, 2), "HALF_SIZE");
    assert.ok(seated.every((s) => s.sizeBand === "half"));
    day.seats = seated;
    const books = newBooks(day, 10_000);
    assert.equal(mandateBroken("HALF_SIZE", books, [0, 0]), false);
    books[0]!.addedNotional = 200;
    assert.equal(mandateBroken("HALF_SIZE", books, [0, 0]), true);
  });

  it("pitch cards expose trainee-owned side and bias", () => {
    const day = buildDay({ runSeed: 8, day: 2, cash: 10_000, accountantHired: false, seat2: true });
    const cards = pitchCards(day.seats);
    assert.equal(cards[0]?.bias, "ALWAYS LONG");
    assert.equal(cards[0]?.side, "long");
    assert.equal(cards[1]?.bias, "ALWAYS SHORT");
    assert.equal(cards[1]?.side, "short");
  });
});

describe("mandate roast", () => {
  it("warns that NO FOMO is hard before Compliance", () => {
    const m = MANDATES.find((x) => x.id === "NO_FOMO_ADDS");
    assert.equal(m?.hint, "FOMO fires without Compliance.");
  });

  it("names a broken desk rule after panic, not as a hard fail", () => {
    const roast = pickRoast({
      pnl: -80,
      cash: 10_000,
      yanked: false,
      yankedAt: null,
      candlesLeftAfterYankMove: 0,
      rode: false,
      fomo: true,
      recoveredPct: 0,
      accountantHired: false,
      mandateBroken: true,
    });
    assert.equal(roast.id, "mandate_broke");
  });
});
