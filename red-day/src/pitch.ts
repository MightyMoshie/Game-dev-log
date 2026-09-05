import type { LiveBook, Mandate, SeatSpec, SizeBand } from "./sim";

export type PitchDecision = "seat" | "cut" | "reject";

export type PitchCard = {
  spec: SeatSpec;
  name: string;
  bias: string;
  ticker: string;
  side: "long" | "short";
  sizeBand: SizeBand;
  thesis: string;
};

export const MANDATES: { id: Mandate; label: string; hint: string }[] = [
  { id: "NO_FOMO_ADDS", label: "NO FOMO", hint: "FOMO fires without Compliance." },
  { id: "HALF_SIZE", label: "HALF SIZE", hint: "Keep books small." },
  { id: "YANK_GREEN", label: "YANK GREEN", hint: "Don't let winners sit." },
];

export function pitchCards(seats: SeatSpec[]): PitchCard[] {
  return seats.map((spec) => ({
    spec,
    name: spec.name,
    bias: spec.side === "short" ? "ALWAYS SHORT" : "ALWAYS LONG",
    ticker: spec.ticker,
    side: spec.side,
    sizeBand: spec.sizeBand ?? "full",
    thesis: spec.take,
  }));
}

export function applyPitchDecisions(
  seats: SeatSpec[],
  decisions: Record<string, PitchDecision>,
  day: number,
): SeatSpec[] {
  const seated: SeatSpec[] = [];
  for (const seat of seats) {
    const d = decisions[seat.id] ?? (day <= 1 ? "seat" : "reject");
    if (d === "reject") continue;
    if (d === "cut") {
      seated.push({ ...seat, size: seat.size * 0.5, sizeBand: "half" });
    } else {
      seated.push({ ...seat, sizeBand: "full" });
    }
  }
  if (day <= 1 && seated.length === 0 && seats[0]) {
    return [{ ...seats[0], sizeBand: "full" }];
  }
  return seated;
}

export function applyMandate(seats: SeatSpec[], mandate: Mandate | null): SeatSpec[] {
  if (mandate !== "HALF_SIZE") return seats;
  return seats.map((s) => (s.sizeBand === "half" ? s : { ...s, size: s.size * 0.5, sizeBand: "half" as const }));
}

export function mandateBroken(
  mandate: Mandate | null,
  books: LiveBook[],
  pnls: number[],
): boolean {
  if (!mandate || !books.length) return false;
  if (mandate === "NO_FOMO_ADDS") return books.some((b) => b.fomo);
  if (mandate === "HALF_SIZE") return books.some((b) => b.addedNotional > 0);
  if (mandate === "YANK_GREEN") {
    return books.some((b, i) => b.yankedAt == null && (pnls[i] ?? 0) > 0);
  }
  return false;
}
