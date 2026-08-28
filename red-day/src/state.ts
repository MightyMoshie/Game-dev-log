export const SAVE_KEY = "red-day-v0";

export const START_CASH = 10_000;
export const FLOOR_MS = 24_000;
export const CANDLE_COUNT = 48;
export const MAYA_SIZE = 0.42;
export const MAYA_SIZE_CAPPED = 0.18;
export const YOLO_MULT = 1.55;
export const FOMO_INDEX_RATIO = 0.48;
export const DRIP_FLAT = 80;
export const DRIP_PCT = 0.008;

export type ScreenId = "boot" | "brief" | "floor" | "bell" | "desk";

export interface DeskSave {
  deskName: string;
  cash: number;
  day: number;
  runSeed: number;
  hasAccountant: boolean;
  accountantHired: boolean;
  redDays: number;
  bestDay: number;
  worstDay: number;
  createdAt: number;
}

export function newDesk(deskName: string): DeskSave {
  const name = deskName.trim() || "Paper Hands LLC";
  return {
    deskName: name.slice(0, 28),
    cash: START_CASH,
    day: 1,
    runSeed: (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0,
    hasAccountant: false,
    accountantHired: false,
    redDays: 0,
    bestDay: 0,
    worstDay: 0,
    createdAt: Date.now(),
  };
}

export function loadSave(): DeskSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeskSave;
    if (!parsed.deskName || typeof parsed.cash !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSave(save: DeskSave): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function money(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  return `${sign}$${abs.toLocaleString("en-US")}`;
}

export function signedMoney(n: number): string {
  const abs = Math.abs(Math.round(n));
  const body = `$${abs.toLocaleString("en-US")}`;
  if (Math.round(n) > 0) return `+${body}`;
  if (Math.round(n) < 0) return `-${body}`;
  return body;
}
