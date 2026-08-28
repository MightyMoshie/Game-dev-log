import { BRIEFS, pickRoast, type Beat, type Roast, type RoastLeg } from "./copy";
import type { SeatId } from "./quotes";
import { mulberry32, pick, daySeed } from "./rng";
import {
  CANDLE_COUNT,
  FOMO_INDEX_RATIO,
  JULES_SIZE,
  JULES_SIZE_CAPPED,
  MAYA_SIZE,
  MAYA_SIZE_CAPPED,
  MAYA_SIZE_DUO,
  MAYA_SIZE_DUO_CAPPED,
  YOLO_MULT,
} from "./state";

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

export type FomoStyle = "dip" | "chase";

export interface SeatSpec {
  id: SeatId;
  name: string;
  size: number;
  fomoStyle: FomoStyle;
  fomoDelay: number;
}

export interface PreparedDay {
  seed: number;
  day: number;
  ticker: string;
  headline: string;
  mayaTake: string;
  julesTake: string;
  beats: Beat[];
  candles: Candle[];
  startPrice: number;
  entry: number;
  baseNotional: number;
  cash: number;
  fomoIndex: number;
  hasAccountant: boolean;
  seat2: boolean;
  seats: SeatSpec[];
}

export interface LiveBook {
  seatId: SeatId;
  name: string;
  shares: number;
  notional: number;
  entry: number;
  yankedAt: number | null;
  exitPrice: number | null;
  rode: boolean;
  fomo: boolean;
  addedNotional: number;
  fomoStyle: FomoStyle;
  fomoIndex: number;
}

export function fomoIndex(): number {
  return Math.floor(CANDLE_COUNT * FOMO_INDEX_RATIO);
}

export function seatsFor(seat2: boolean, accountantHired: boolean): SeatSpec[] {
  if (!seat2) {
    return [
      {
        id: "maya",
        name: "Maya",
        size: accountantHired ? MAYA_SIZE_CAPPED : MAYA_SIZE,
        fomoStyle: "dip",
        fomoDelay: 0,
      },
    ];
  }
  return [
    {
      id: "maya",
      name: "Maya",
      size: accountantHired ? MAYA_SIZE_DUO_CAPPED : MAYA_SIZE_DUO,
      fomoStyle: "dip",
      fomoDelay: 0,
    },
    {
      id: "jules",
      name: "Jules",
      size: accountantHired ? JULES_SIZE_CAPPED : JULES_SIZE,
      fomoStyle: "chase",
      fomoDelay: 6,
    },
  ];
}

export function buildDay(opts: {
  runSeed: number;
  day: number;
  cash: number;
  accountantHired: boolean;
  seat2?: boolean;
}): PreparedDay {
  const seed = daySeed(opts.runSeed, opts.day);
  const rng = mulberry32(seed);
  const brief = BRIEFS[Math.floor(rng() * BRIEFS.length)]!;
  const beats = pickBeats(rng, opts.day, opts.accountantHired);
  const startPrice = 18 + rng() * 42;
  const candles = generateCandles(rng, startPrice, beats, opts.accountantHired);
  const seat2 = Boolean(opts.seat2);
  const seats = seatsFor(seat2, opts.accountantHired);
  const entry = candles[0]!.o;
  const baseNotional = seats.reduce((s, seat) => s + Math.max(400, opts.cash * seat.size), 0);

  return {
    seed,
    day: opts.day,
    ticker: brief.ticker,
    headline: brief.headline,
    mayaTake: brief.mayaTake,
    julesTake: brief.julesTake,
    beats,
    candles,
    startPrice,
    entry,
    baseNotional,
    cash: opts.cash,
    fomoIndex: fomoIndex(),
    hasAccountant: opts.accountantHired,
    seat2,
    seats,
  };
}

export function pickBeats(rng: () => number, day: number, calm: boolean): Beat[] {
  const pool: Beat[] = calm
    ? ["bleed", "fakeout", "gap-up", "squeeze"]
    : ["dump", "fakeout", "gap-up", "squeeze", "bleed"];
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

export function newBooks(day: PreparedDay, cash: number): LiveBook[] {
  return day.seats.map((seat) => newBook(day, seat, cash));
}

export function newBook(day: PreparedDay, seat?: SeatSpec, cash?: number): LiveBook {
  const spec = seat ?? day.seats[0]!;
  const notional = Math.max(400, (cash ?? day.cash) * spec.size);
  return {
    seatId: spec.id,
    name: spec.name,
    shares: notional / day.entry,
    notional,
    entry: day.entry,
    yankedAt: null,
    exitPrice: null,
    rode: false,
    fomo: false,
    addedNotional: 0,
    fomoStyle: spec.fomoStyle,
    fomoIndex: day.fomoIndex + spec.fomoDelay,
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
  if (isFlat(book) || book.rode) return false;
  book.rode = true;
  if (day.hasAccountant || book.fomo) return true;
  addSize(book, book.notional * (YOLO_MULT - 1));
  return true;
}

export function tryYank(day: PreparedDay, book: LiveBook, index: number): boolean {
  if (isFlat(book)) return false;
  book.yankedAt = index;
  book.exitPrice = markPrice(day, index);
  return true;
}

export function maybeIdleFomo(day: PreparedDay, book: LiveBook, index: number): boolean {
  if (day.hasAccountant) return false;
  if (isFlat(book) || book.rode || book.fomo) return false;
  if (index < book.fomoIndex) return false;
  const u = unrealized(day, book, index);
  if (book.fomoStyle === "chase") {
    const greedy = u > 0 || (index === book.fomoIndex && day.seed % 4 === 0);
    if (!greedy) return false;
    book.fomo = true;
    addSize(book, book.notional * (YOLO_MULT - 1));
    return true;
  }
  const greedy = u >= 0 && index === book.fomoIndex && day.seed % 5 === 0;
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

export function closeDay(day: PreparedDay, books: LiveBook | LiveBook[]): {
  pnl: number;
  roast: Roast;
  legs: RoastLeg[];
} {
  const list = Array.isArray(books) ? books : [books];
  const last = day.candles.length - 1;
  const legs: RoastLeg[] = list.map((book) => ({
    seatId: book.seatId,
    name: book.name,
    pnl: unrealized(day, book, last),
    yanked: book.yankedAt != null,
    rode: book.rode,
    fomo: book.fomo,
    recoveredPct: recoveredAfterYank(day, book),
  }));
  const pnl = legs.reduce((s, l) => s + l.pnl, 0);
  const primary = list[0]!;
  const roast = pickRoast({
    pnl,
    cash: day.cash,
    yanked: list.length === 1 ? primary.yankedAt != null : list.every((b) => b.yankedAt != null),
    yankedAt: primary.yankedAt,
    candlesLeftAfterYankMove: primary.yankedAt == null ? 0 : last - primary.yankedAt,
    rode: list.some((b) => b.rode),
    fomo: list.some((b) => b.fomo),
    recoveredPct: recoveredAfterYank(day, primary),
    accountantHired: day.hasAccountant,
    legs,
  });
  return { pnl, roast, legs };
}
