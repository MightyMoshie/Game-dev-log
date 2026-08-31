import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDay,
  closeDay,
  generateCandles,
  maybeIdleFomo,
  newBook,
  newBooks,
  pickBeats,
  tryRide,
  tryYank,
  tryYankAll,
  blowupTell,
  unrealized,
} from "./sim";
import { mulberry32 } from "./rng";
import { CANDLE_COUNT, EMPTY_UPGRADES, FLOOR_MS, FLOOR_MS_ESPRESSO, MAYA_SIZE, MAYA_SIZE_CAPPED } from "./state";
import { pickRoast } from "./copy";
import { pitView } from "./stats";

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
    const rawBook = newBook(raw);
    const capBook = newBook(cap);
    assert.ok(Math.abs(rawBook.notional - 10_000 * MAYA_SIZE) < 1);
    assert.ok(Math.abs(capBook.notional - 10_000 * MAYA_SIZE_CAPPED) < 1);
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

  it("day 1 is Maya only; seat 2 is a second independent book", () => {
    const one = buildDay({ runSeed: 8, day: 1, cash: 10_000, accountantHired: false, seat2: false });
    assert.equal(one.seats.length, 1);
    assert.equal(one.seats[0]?.id, "maya");

    const two = buildDay({ runSeed: 8, day: 2, cash: 10_000, accountantHired: false, seat2: true });
    assert.equal(two.seats.length, 2);
    const books = newBooks(two, 10_000);
    assert.equal(books.length, 2);
    tryYank(two, books[0]!, 8);
    assert.equal(books[0]!.yankedAt, 8);
    assert.equal(books[1]!.yankedAt, null);
    const locked = unrealized(two, books[0]!, 8);
    assert.equal(unrealized(two, books[0]!, CANDLE_COUNT - 1), locked);
    const julesLater = unrealized(two, books[1]!, CANDLE_COUNT - 1);
    assert.equal(books[1]!.exitPrice, null);
    assert.equal(typeof julesLater, "number");
  });

  it("roasts the wrong line when you yank the wrong seat", () => {
    const roast = pickRoast({
      pnl: -700,
      cash: 10_000,
      yanked: false,
      yankedAt: 10,
      candlesLeftAfterYankMove: 20,
      rode: false,
      fomo: false,
      recoveredPct: 0,
      accountantHired: false,
      legs: [
        { seatId: "maya", name: "Maya", pnl: 120, yanked: true, rode: false, fomo: false, recoveredPct: 0 },
        { seatId: "jules", name: "Jules", pnl: -820, yanked: false, rode: false, fomo: true, recoveredPct: 0 },
      ],
    });
    assert.equal(roast.id, "wrong_line");
  });

  it("Maya is always long; Jules is always short on her own sheet", () => {
    const two = buildDay({ runSeed: 8, day: 2, cash: 10_000, accountantHired: false, seat2: true });
    assert.equal(two.seats[0]?.side, "long");
    assert.equal(two.seats[1]?.side, "short");
    assert.equal(two.seats[0]?.id, "maya");
    assert.equal(two.seats[1]?.id, "jules");
    const books = newBooks(two, 10_000);
    assert.equal(books[0]?.side, "long");
    assert.equal(books[1]?.side, "short");
    assert.ok(books[0]?.ticker);
    assert.ok(books[1]?.ticker);
  });

  it("short books profit when price falls", () => {
    const two = buildDay({ runSeed: 11, day: 2, cash: 10_000, accountantHired: false, seat2: true });
    const jules = newBooks(two, 10_000)[1]!;
    assert.equal(jules.side, "short");
    const last = jules.candles.length - 1;
    jules.candles[last] = { ...jules.candles[last]!, c: jules.entry * 0.8, l: jules.entry * 0.78 };
    const pnl = unrealized(two, jules, last);
    assert.ok(pnl > 0);
  });

  it("panic yank-all taxes the desk and stamps the roast", () => {
    const day = buildDay({ runSeed: 4, day: 1, cash: 10_000, accountantHired: false });
    const book = newBook(day);
    const calm = closeDay(day, [book]);
    const pan = closeDay(day, [book], { panic: true });
    assert.ok(pan.pnl < calm.pnl);
    assert.equal(pan.roast.id, "panic_button");
  });

  it("espresso makes FOMO arrive earlier; compliance still caps", () => {
    const raw = buildDay({ runSeed: 9, day: 2, cash: 10_000, accountantHired: false });
    const caf = buildDay({
      runSeed: 9,
      day: 2,
      cash: 10_000,
      accountantHired: false,
      upgrades: { compliance: false, espresso: true, research: false },
    });
    assert.ok(caf.fomoIndex < raw.fomoIndex);
    const cap = buildDay({
      runSeed: 9,
      day: 2,
      cash: 10_000,
      accountantHired: false,
      upgrades: { compliance: true, espresso: true, research: false },
    });
    assert.equal(cap.hasAccountant, true);
    const book = newBook(cap);
    cap.candles[cap.fomoIndex] = {
      ...cap.candles[cap.fomoIndex]!,
      c: cap.entry * 0.7,
      l: cap.entry * 0.68,
    };
    assert.equal(maybeIdleFomo(cap, book, cap.fomoIndex), false);
  });

  it("Maya and Jules pick different fictional tickers", () => {
    for (const seed of [1, 2, 3, 8, 11, 42]) {
      const two = buildDay({ runSeed: seed, day: 2, cash: 10_000, accountantHired: false, seat2: true });
      assert.notEqual(two.seats[0]?.ticker, two.seats[1]?.ticker);
    }
  });

  it("yank-all flats every open book", () => {
    const day = buildDay({ runSeed: 8, day: 2, cash: 10_000, accountantHired: false, seat2: true });
    const books = newBooks(day, 10_000);
    assert.equal(tryYankAll(day, books, 12), 2);
    assert.ok(books.every((b) => b.yankedAt === 12));
    assert.equal(tryYankAll(day, books, 20), 0);
  });

  it("research tell flags a sour long tape", () => {
    const day = buildDay({ runSeed: 5, day: 1, cash: 10_000, accountantHired: false });
    const book = newBook(day);
    const i = 10;
    book.candles[i] = { ...book.candles[i]!, c: 20, o: 20, h: 20.2, l: 19.8 };
    book.candles[i + 6] = { ...book.candles[i + 6]!, c: 18.8, o: 19, h: 19.1, l: 18.6 };
    assert.equal(blowupTell(book, i), "TAPE SOURS");
  });

  it("espresso shortens the day clock and the quote gap", () => {
    const raw = buildDay({ runSeed: 9, day: 2, cash: 10_000, accountantHired: false });
    const caf = buildDay({
      runSeed: 9,
      day: 2,
      cash: 10_000,
      accountantHired: false,
      upgrades: { compliance: false, espresso: true, research: false },
    });
    assert.equal(raw.floorMs, FLOOR_MS);
    assert.equal(caf.floorMs, FLOOR_MS_ESPRESSO);
    assert.ok(caf.quoteMs < raw.quoteMs);
    assert.ok(caf.fomoIndex < raw.fomoIndex);
  });

  it("closeDay names an ignored research tell", () => {
    const day = buildDay({
      runSeed: 5,
      day: 1,
      cash: 10_000,
      accountantHired: false,
      upgrades: { compliance: false, espresso: false, research: true },
    });
    const book = newBook(day);
    book.warned = true;
    const last = book.candles.length - 1;
    book.candles[last] = { ...book.candles[last]!, c: book.entry * 0.7, l: book.entry * 0.68 };
    const { roast } = closeDay(day, [book]);
    assert.equal(roast.id, "research_ignored");
  });
});

describe("pit stats", () => {
  it("shows baseline chips until a perk is placed", () => {
    const v = pitView(EMPTY_UPGRADES, true);
    assert.equal(v.sizeText, "1.0x");
    assert.equal(v.speedText, "28s");
    assert.equal(v.inquiryText, "OFF");
    assert.equal(v.floorMs, FLOOR_MS);
    assert.equal(v.sizeOn, false);
    assert.equal(v.speedOn, false);
    assert.equal(v.inquiryOn, false);
  });

  it("moves size, speed, and inquiry the moment a perk is placed", () => {
    const size = pitView({ compliance: true, espresso: false, research: false }, true);
    assert.ok(size.sizeMult < 1);
    assert.notEqual(size.sizeText, "1.0x");
    const speed = pitView({ compliance: false, espresso: true, research: false }, true);
    assert.equal(speed.speedText, "20s");
    assert.equal(speed.floorMs, FLOOR_MS_ESPRESSO);
    assert.ok(speed.speedMult > 1);
    const inq = pitView({ compliance: false, espresso: false, research: true }, true);
    assert.equal(inq.inquiryText, "ON");
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

  it("names espresso, ignored research, and compliance on the roast", () => {
    const espresso = pickRoast({
      pnl: -800,
      cash: 10_000,
      yanked: false,
      yankedAt: null,
      candlesLeftAfterYankMove: 0,
      rode: false,
      fomo: true,
      recoveredPct: 0,
      accountantHired: false,
      espresso: true,
    });
    assert.equal(espresso.id, "espresso_double");

    const research = pickRoast({
      pnl: -400,
      cash: 10_000,
      yanked: false,
      yankedAt: null,
      candlesLeftAfterYankMove: 0,
      rode: false,
      fomo: false,
      recoveredPct: 0,
      accountantHired: false,
      research: true,
      ignoredTell: true,
    });
    assert.equal(research.id, "research_ignored");

    const cap = pickRoast({
      pnl: -100,
      cash: 10_000,
      yanked: false,
      yankedAt: null,
      candlesLeftAfterYankMove: 0,
      rode: false,
      fomo: false,
      recoveredPct: 0,
      accountantHired: true,
    });
    assert.equal(cap.id, "compliance_saved");
  });
});
