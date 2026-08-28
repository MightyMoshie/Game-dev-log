import { BRIEFS, pickRoast, type Beat, type Roast, type RoastLeg } from "./copy";
import type { SeatId } from "./quotes";
import { mulberry32, pick, daySeed } from "./rng";
import { pickJulesSheet, pickMayaSheet, type Side } from "./sheets";
import {
  CANDLE_COUNT,
  EMPTY_UPGRADES,
  FOMO_ESPRESSO_RATIO,
  FOMO_INDEX_RATIO,
  JULES_SIZE,
  JULES_SIZE_CAPPED,
  MAYA_SIZE,
  MAYA_SIZE_CAPPED,
  MAYA_SIZE_DUO,
  MAYA_SIZE_DUO_CAPPED,
  YOLO_ESPRESSO,
  YOLO_MULT,
  panicTax,
  type FloorUpgrades,
} from "./state";
import { pitView } from "./stats";

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
  ticker: string;
  side: Side;
  take: string;
  headline: string;
  candles: Candle[];
  entry: number;
  startPrice: number;
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
  espresso: boolean;
  research: boolean;
  seat2: boolean;
  seats: SeatSpec[];
  floorMs: number;
  quoteMs: number;
}

export interface LiveBook {
  seatId: SeatId;
  name: string;
  ticker: string;
  side: Side;
  candles: Candle[];
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
  warned: boolean;
}

export function fomoIndex(espresso = false): number {
  return Math.floor(CANDLE_COUNT * (espresso ? FOMO_ESPRESSO_RATIO : FOMO_INDEX_RATIO));
}

export function seatsFor(
  seat2: boolean,
  accountantHired: boolean,
  sheets: { maya: ReturnType<typeof pickMayaSheet>; jules: ReturnType<typeof pickJulesSheet> | null },
  tapes: { maya: { candles: Candle[]; start: number }; jules: { candles: Candle[]; start: number } | null },
): SeatSpec[] {
  const mayaEntry = tapes.maya.candles[0]!.o;
  const maya: SeatSpec = {
    id: "maya",
    name: "Maya",
    size: seat2
      ? accountantHired
        ? MAYA_SIZE_DUO_CAPPED
        : MAYA_SIZE_DUO
      : accountantHired
        ? MAYA_SIZE_CAPPED
        : MAYA_SIZE,
    fomoStyle: "dip",
    fomoDelay: 0,
    ticker: sheets.maya.ticker,
    side: "long",
    take: sheets.maya.take,
    headline: sheets.maya.headline,
    candles: tapes.maya.candles,
    entry: mayaEntry,
    startPrice: tapes.maya.start,
  };
  if (!seat2 || !sheets.jules || !tapes.jules) return [maya];
  const julesEntry = tapes.jules.candles[0]!.o;
  return [
    maya,
    {
      id: "jules",
      name: "Jules",
      size: accountantHired ? JULES_SIZE_CAPPED : JULES_SIZE,
      fomoStyle: "chase",
      fomoDelay: 6,
      ticker: sheets.jules.ticker,
      side: "short",
      take: sheets.jules.take,
      headline: sheets.jules.headline,
      candles: tapes.jules.candles,
      entry: julesEntry,
      startPrice: tapes.jules.start,
    },
  ];
}

export function buildDay(opts: {
  runSeed: number;
  day: number;
  cash: number;
  accountantHired: boolean;
  seat2?: boolean;
  upgrades?: FloorUpgrades;
}): PreparedDay {
  const upgrades = opts.upgrades ?? EMPTY_UPGRADES;
  const capped = opts.accountantHired || upgrades.compliance;
  const espresso = upgrades.espresso;
  const seed = daySeed(opts.runSeed, opts.day);
  const rng = mulberry32(seed);
  const mayaSheet = pickMayaSheet(rng);
  const seat2 = Boolean(opts.seat2);
  const julesSheet = seat2 ? pickJulesSheet(rng, mayaSheet.ticker) : null;
  const beats = pickBeats(rng, opts.day, capped);
  const mayaStart = 18 + rng() * 42;
  const mayaCandles = generateCandles(rng, mayaStart, beats, capped);
  let julesTape: { candles: Candle[]; start: number } | null = null;
  if (seat2) {
    const jBeats = pickBeats(rng, opts.day, capped);
    const jStart = 16 + rng() * 38;
    julesTape = { candles: generateCandles(rng, jStart, jBeats, capped), start: jStart };
  }
  const seats = seatsFor(seat2, capped, { maya: mayaSheet, jules: julesSheet }, {
    maya: { candles: mayaCandles, start: mayaStart },
    jules: julesTape,
  });
  const maya = seats[0]!;
  const baseNotional = seats.reduce((s, seat) => s + Math.max(400, opts.cash * seat.size), 0);
  const stats = pitView({ compliance: capped, espresso, research: upgrades.research }, seat2);

  return {
    seed,
    day: opts.day,
    ticker: maya.ticker,
    headline: maya.headline,
    mayaTake: maya.take,
    julesTake: seats[1]?.take ?? BRIEFS[0]!.julesTake,
    beats,
    candles: maya.candles,
    startPrice: maya.startPrice,
    entry: maya.entry,
    baseNotional,
    cash: opts.cash,
    fomoIndex: fomoIndex(espresso),
    hasAccountant: capped,
    espresso,
    research: upgrades.research,
    seat2,
    seats,
    floorMs: stats.floorMs,
    quoteMs: stats.quoteMs,
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
  const delay = day.espresso ? Math.max(0, spec.fomoDelay - 4) : spec.fomoDelay;
  return {
    seatId: spec.id,
    name: spec.name,
    ticker: spec.ticker,
    side: spec.side,
    candles: spec.candles,
    shares: notional / spec.entry,
    notional,
    entry: spec.entry,
    yankedAt: null,
    exitPrice: null,
    rode: false,
    fomo: false,
    addedNotional: 0,
    fomoStyle: spec.fomoStyle,
    fomoIndex: day.fomoIndex + delay,
    warned: false,
  };
}

export function markPrice(day: PreparedDay, index: number, book?: LiveBook): number {
  const tape = book?.candles ?? day.candles;
  const i = Math.max(0, Math.min(tape.length - 1, index));
  return tape[i]!.c;
}

export function isFlat(book: LiveBook): boolean {
  return book.yankedAt !== null;
}

function yolo(day: PreparedDay): number {
  return day.espresso ? YOLO_ESPRESSO : YOLO_MULT;
}

export function tryRide(day: PreparedDay, book: LiveBook): boolean {
  if (isFlat(book) || book.rode) return false;
  book.rode = true;
  if (day.hasAccountant || book.fomo) return true;
  addSize(book, book.notional * (yolo(day) - 1));
  return true;
}

export function tryYank(day: PreparedDay, book: LiveBook, index: number): boolean {
  if (isFlat(book)) return false;
  book.yankedAt = index;
  book.exitPrice = markPrice(day, index, book);
  return true;
}

export function tryYankAll(day: PreparedDay, books: LiveBook[], index: number): number {
  let n = 0;
  for (const book of books) {
    if (tryYank(day, book, index)) n += 1;
  }
  return n;
}

export function maybeIdleFomo(day: PreparedDay, book: LiveBook, index: number): boolean {
  if (day.hasAccountant) return false;
  if (isFlat(book) || book.rode || book.fomo) return false;
  if (index < book.fomoIndex) return false;
  const u = unrealized(day, book, index);
  const px = markPrice(day, index, book);
  const green = px >= book.entry;
  if (book.side === "short" || book.fomoStyle === "chase") {
    const greedy = green || (index === book.fomoIndex && day.seed % 4 === 0);
    if (!greedy) return false;
    book.fomo = true;
    addSize(book, book.notional * (yolo(day) - 1));
    return true;
  }
  const greedy = u >= 0 && index === book.fomoIndex && day.seed % 5 === 0;
  if (u < 0 || greedy) {
    book.fomo = true;
    addSize(book, book.notional * (yolo(day) - 1));
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
  return markPrice(day, index, book);
}

export function unrealized(day: PreparedDay, book: LiveBook, index: number): number {
  const px = exitPrice(day, book, index);
  const delta = book.side === "short" ? book.entry - px : px - book.entry;
  return book.shares * delta;
}

export function recoveredAfterYank(day: PreparedDay, book: LiveBook): number {
  if (book.yankedAt == null || book.exitPrice == null) return 0;
  const last = (book.candles ?? day.candles).at(-1)!.c;
  const dir = book.side === "short" ? -1 : 1;
  return (dir * (last - book.exitPrice)) / book.exitPrice;
}

/** Research glass: a tell if the next few candles will punish this side. */
export function blowupTell(book: LiveBook, index: number): string | null {
  const tape = book.candles;
  const now = tape[Math.max(0, Math.min(tape.length - 1, index))]!.c;
  const ahead = tape[Math.min(tape.length - 1, index + 6)]!.c;
  const ret = (ahead - now) / Math.max(0.01, now);
  if (book.side === "long" && ret < -0.035) return "TAPE SOURS";
  if (book.side === "short" && ret > 0.035) return "SQUEEZE RISK";
  const openPnl = book.shares * (book.side === "short" ? book.entry - now : now - book.entry);
  if (openPnl < -book.notional * 0.12) return "SIZE BLEED";
  return null;
}

export function closeDay(
  day: PreparedDay,
  books: LiveBook | LiveBook[],
  opts?: { panic?: boolean },
): {
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
  let pnl = legs.reduce((s, l) => s + l.pnl, 0);
  const panic = Boolean(opts?.panic);
  if (panic) pnl -= panicTax(day.cash);
  const primary = list[0]!;
  const ignoredTell = list.some((b) => b.warned && b.yankedAt == null);
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
    espresso: day.espresso,
    research: day.research,
    ignoredTell,
    panic,
    legs,
  });
  return { pnl, roast, legs };
}
