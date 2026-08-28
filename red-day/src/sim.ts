import { BRIEFS, pickRoast, type Beat, type Roast } from "./copy";
import { mulberry32, pick, daySeed } from "./rng";
import {
  CANDLE_COUNT,
  FOMO_INDEX_RATIO,
  MAYA_SIZE,
  MAYA_SIZE_CAPPED,
  YOLO_MULT,
} from "./state";

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface PreparedDay {
  seed: number;
  day: number;
  ticker: string;
  headline: string;
  mayaTake: string;
  beats: Beat[];
  candles: Candle[];
  startPrice: number;
  entry: number;
  baseNotional: number;
  fomoIndex: number;
  hasAccountant: boolean;
}

export interface LiveBook {
  shares: number;
  notional: number;
  entry: number;
  yankedAt: number | null;
  exitPrice: number | null;
  rode: boolean;
  fomo: boolean;
  addedNotional: number;
}

export function fomoIndex(): number {
  return Math.floor(CANDLE_COUNT * FOMO_INDEX_RATIO);
}

export function buildDay(opts: {
  runSeed: number;
  day: number;
  cash: number;
  accountantHired: boolean;
}): PreparedDay {
  const seed = daySeed(opts.runSeed, opts.day);
  const rng = mulberry32(seed);
  const brief = BRIEFS[Math.floor(rng() * BRIEFS.length)]!;
  const beats = pickBeats(rng, opts.day, opts.accountantHired);
  const startPrice = 18 + rng() * 42;
  const candles = generateCandles(rng, startPrice, beats, opts.accountantHired);
  const size = opts.accountantHired ? MAYA_SIZE_CAPPED : MAYA_SIZE;
  const entry = candles[0]!.o;
  const baseNotional = Math.max(400, opts.cash * size);

  return {
    seed,
    day: opts.day,
    ticker: brief.ticker,
    headline: brief.headline,
    mayaTake: brief.mayaTake,
    beats,
    candles,
    startPrice,
    entry,
    baseNotional,
    fomoIndex: fomoIndex(),
    hasAccountant: opts.accountantHired,
  };
}

export function pickBeats(rng: () => number, day: number, calm: boolean): Beat[] {
  const pool: Beat[] = calm
    ? ["bleed", "fakeout", "gap-up", "squeeze"]
    : ["dump", "fakeout", "gap-up", "squeeze", "bleed"];
  // Early days without HR: bias a dump so the smoke can actually go red.
  if (!calm && day <= 3 && rng() < 0.72) {
    const extra = pick(rng, ["fakeout", "gap-up"] as const);
    return extra === "fakeout" ? ["dump", "fakeout"] : ["gap-up", "dump"];
  }
  const first = pick(rng, pool);
  const secondPool = pool.filter((b) => b !== first);
  if (rng() < 0.7) return [first, pick(rng, secondPool)];
  return [first];
}

export function generateCandles(
  rng: () => number,
  startPrice: number,
  beats: Beat[],
  calm: boolean,
): Candle[] {
  const vol = calm ? 0.011 : 0.021;
  let price = startPrice;
  if (beats.includes("gap-up")) price *= 1.055 + rng() * 0.05;
  if (beats.includes("squeeze") && rng() < 0.35) price *= 0.97;

  const out: Candle[] = [];
  for (let i = 0; i < CANDLE_COUNT; i++) {
    const t = i / CANDLE_COUNT;
    let drift = (rng() - 0.5) * 0.002;
    if (beats.includes("dump") && t > 0.32 && t < 0.58) {
      drift -= (calm ? 0.012 : 0.028) * (0.7 + rng() * 0.6);
    }
    if (beats.includes("bleed") && t > 0.15) {
      drift -= (calm ? 0.003 : 0.006) * (0.5 + rng());
    }
    if (beats.includes("fakeout") && t > 0.18 && t < 0.36) {
      drift -= 0.018 * (calm ? 0.5 : 1);
    }
    if (beats.includes("fakeout") && t > 0.36 && t < 0.58) {
      drift += 0.026 * (calm ? 0.55 : 1);
    }
    if (beats.includes("squeeze") && t > 0.55 && t < 0.82) {
      drift += 0.02 * (calm ? 0.5 : 1);
    }

    const ret = drift + (rng() - 0.48) * vol;
    const o = price;
    const c = Math.max(0.5, o * (1 + ret));
    const wick = vol * (0.35 + rng() * 0.9);
    const h = Math.max(o, c) * (1 + rng() * wick);
    const l = Math.min(o, c) * (1 - rng() * wick);
    out.push({ o, h, l, c });
    price = c;
  }
  return out;
}

export function newBook(day: PreparedDay): LiveBook {
  return {
    shares: day.baseNotional / day.entry,
    notional: day.baseNotional,
    entry: day.entry,
    yankedAt: null,
    exitPrice: null,
    rode: false,
    fomo: false,
    addedNotional: 0,
  };
}

export function markPrice(day: PreparedDay, index: number): number {
  const i = Math.max(0, Math.min(day.candles.length - 1, index));
  return day.candles[i]!.c;
}

export function isFlat(book: LiveBook): boolean {
  return book.yankedAt !== null;
}

export function tryRide(day: PreparedDay, book: LiveBook): boolean {
  if (isFlat(book) || book.rode || book.fomo) return false;
  book.rode = true;
  if (day.hasAccountant) return true;
  addSize(book, book.notional * (YOLO_MULT - 1));
  return true;
}

export function tryYank(day: PreparedDay, book: LiveBook, index: number): boolean {
  if (isFlat(book)) return false;
  book.yankedAt = index;
  book.exitPrice = markPrice(day, index);
  return true;
}

/** Idle FOMO: Maya adds into a loser (or sometimes a winner) if the player freezes. */
export function maybeIdleFomo(day: PreparedDay, book: LiveBook, index: number): boolean {
  if (day.hasAccountant) return false;
  if (isFlat(book) || book.rode || book.fomo) return false;
  if (index < day.fomoIndex) return false;
  const u = unrealized(day, book, index);
  // Usually adds on red. Sometimes still adds on green ("we're so back").
  const greedy = u >= 0 && index === day.fomoIndex && day.seed % 5 === 0;
  if (u < 0 || greedy) {
    book.fomo = true;
    addSize(book, book.notional * (YOLO_MULT - 1));
    return true;
  }
  return false;
}

function addSize(book: LiveBook, extraNotional: number): void {
  const extra = Math.max(0, extraNotional);
  book.addedNotional += extra;
  book.notional += extra;
  book.shares += extra / book.entry;
}

export function exitPrice(day: PreparedDay, book: LiveBook, index: number): number {
  if (book.exitPrice != null) return book.exitPrice;
  return markPrice(day, index);
}

export function unrealized(day: PreparedDay, book: LiveBook, index: number): number {
  const px = exitPrice(day, book, index);
  return book.shares * (px - book.entry);
}

export function recoveredAfterYank(day: PreparedDay, book: LiveBook): number {
  if (book.yankedAt == null || book.exitPrice == null) return 0;
  const last = day.candles[day.candles.length - 1]!.c;
  return (last - book.exitPrice) / book.exitPrice;
}

export function closeDay(day: PreparedDay, book: LiveBook): {
  pnl: number;
  roast: Roast;
} {
  const last = day.candles.length - 1;
  const pnl = unrealized(day, book, last);
  const roast = pickRoast({
    pnl,
    cash: day.baseNotional / (day.hasAccountant ? MAYA_SIZE_CAPPED : MAYA_SIZE),
    yanked: book.yankedAt != null,
    yankedAt: book.yankedAt,
    candlesLeftAfterYankMove: book.yankedAt == null ? 0 : last - book.yankedAt,
    rode: book.rode,
    fomo: book.fomo,
    recoveredPct: recoveredAfterYank(day, book),
    accountantHired: day.hasAccountant,
  });
  return { pnl, roast };
}
