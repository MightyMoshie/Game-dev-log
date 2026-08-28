import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDay,
  closeDay,
  generateCandles,
  maybeIdleFomo,
  newBook,
  pickBeats,
  tryRide,
  tryYank,
  unrealized,
} from "./sim";
import { mulberry32 } from "./rng";
import { CANDLE_COUNT, MAYA_SIZE, MAYA_SIZE_CAPPED } from "./state";
import { pickRoast } from "./copy";

describe("sim", () => {
  it("builds a seeded day with candles and a fictional ticker", () => {
    const a = buildDay({ runSeed: 42, day: 1, cash: 10_000, accountantHired: false });
    const b = buildDay({ runSeed: 42, day: 1, cash: 10_000, accountantHired: false });
    assert.equal(a.ticker, b.ticker);
    assert.equal(a.candles.length, CANDLE_COUNT);
    assert.deepEqual(a.candles, b.candles);
    assert.ok(["CHAI", "NBL", "BLND"].includes(a.ticker));
    assert.match(a.headline, /CHAI|NBL|BLND/);
  });

  it("caps Maya size when the accountant is hired", () => {
    const raw = buildDay({ runSeed: 7, day: 1, cash: 10_000, accountantHired: false });
    const cap = buildDay({ runSeed: 7, day: 1, cash: 10_000, accountantHired: true });
    assert.ok(Math.abs(raw.baseNotional - 10_000 * MAYA_SIZE) < 1);
    assert.ok(Math.abs(cap.baseNotional - 10_000 * MAYA_SIZE_CAPPED) < 1);
  });

  it("yank locks P&L even if the tape keeps moving", () => {
    const day = buildDay({ runSeed: 99, day: 1, cash: 10_000, accountantHired: false });
    const book = newBook(day);
    tryYank(day, book, 10);
    const locked = unrealized(day, book, 10);
    const later = unrealized(day, book, CANDLE_COUNT - 1);
    assert.equal(locked, later);
    assert.equal(book.yankedAt, 10);
  });

  it("idle FOMO adds size on a loser when the player freezes", () => {
    const day = buildDay({ runSeed: 1, day: 1, cash: 10_000, accountantHired: false });
    // Force a red mark at fomo index by cloning a down tape if needed.
    const book = newBook(day);
    const before = book.notional;
    // Walk to fomo index; if still green, shove price down so FOMO triggers.
    const idx = day.fomoIndex;
    if (unrealized(day, book, idx) >= 0) {
      day.candles[idx] = {
        ...day.candles[idx]!,
        c: day.entry * 0.8,
        l: day.entry * 0.78,
      };
    }
    const added = maybeIdleFomo(day, book, idx);
    assert.equal(added, true);
    assert.ok(book.fomo);
    assert.ok(book.notional > before);
  });

  it("accountant blocks idle FOMO adds", () => {
    const day = buildDay({ runSeed: 1, day: 1, cash: 10_000, accountantHired: true });
    const book = newBook(day);
    day.candles[day.fomoIndex] = {
      ...day.candles[day.fomoIndex]!,
      c: day.entry * 0.7,
      l: day.entry * 0.68,
    };
    assert.equal(maybeIdleFomo(day, book, day.fomoIndex), false);
    assert.equal(book.fomo, false);
  });

  it("let them ride still registers after idle FOMO without double-adding", () => {
    const day = buildDay({ runSeed: 1, day: 1, cash: 10_000, accountantHired: false });
    const book = newBook(day);
    day.candles[day.fomoIndex] = {
      ...day.candles[day.fomoIndex]!,
      c: day.entry * 0.8,
      l: day.entry * 0.78,
    };
    assert.equal(maybeIdleFomo(day, book, day.fomoIndex), true);
    const afterFomo = book.notional;
    assert.equal(tryRide(day, book), true);
    assert.equal(book.rode, true);
    assert.equal(book.notional, afterFomo);
  });

  it("let them ride adds size unless capped", () => {
    const raw = buildDay({ runSeed: 3, day: 2, cash: 10_000, accountantHired: false });
    const cap = buildDay({ runSeed: 3, day: 2, cash: 10_000, accountantHired: true });
    const b1 = newBook(raw);
    const b2 = newBook(cap);
    const n1 = b1.notional;
    const n2 = b2.notional;
    assert.equal(tryRide(raw, b1), true);
    assert.equal(tryRide(cap, b2), true);
    assert.ok(b1.notional > n1);
    assert.equal(b2.notional, n2);
  });

  it("early days often include a dump beat without HR", () => {
    const rng = mulberry32(12);
    const beats = pickBeats(rng, 1, false);
    assert.ok(beats.includes("dump"));
  });

  it("generateCandles is deterministic", () => {
    const a = generateCandles(mulberry32(5), 20, ["dump", "gap-up"], false);
    const b = generateCandles(mulberry32(5), 20, ["dump", "gap-up"], false);
    assert.deepEqual(a, b);
    assert.equal(a.length, CANDLE_COUNT);
  });

  it("closeDay returns a roast", () => {
    const day = buildDay({ runSeed: 21, day: 1, cash: 10_000, accountantHired: false });
    const book = newBook(day);
    const { roast, pnl } = closeDay(day, book);
    assert.equal(typeof roast.stamp, "string");
    assert.ok(roast.stamp.length > 3);
    assert.equal(typeof pnl, "number");
  });
});

describe("roast picker", () => {
  it("names held loser and yanked bottom", () => {
    const held = pickRoast({
      pnl: -900,
      cash: 10_000,
      yanked: false,
      yankedAt: null,
      candlesLeftAfterYankMove: 0,
      rode: false,
      fomo: false,
      recoveredPct: 0,
      accountantHired: false,
    });
    assert.equal(held.id, "held_loser");

    const bottom = pickRoast({
      pnl: -120,
      cash: 10_000,
      yanked: true,
      yankedAt: 12,
      candlesLeftAfterYankMove: 30,
      rode: false,
      fomo: false,
      recoveredPct: 0.12,
      accountantHired: false,
    });
    assert.equal(bottom.id, "yanked_bottom");

    const yolo = pickRoast({
      pnl: -800,
      cash: 10_000,
      yanked: false,
      yankedAt: null,
      candlesLeftAfterYankMove: 0,
      rode: true,
      fomo: false,
      recoveredPct: 0,
      accountantHired: false,
    });
    assert.equal(yolo.id, "yolo_size");
  });
});
