export const SAVE_KEY = "red-day-v0";

export const START_CASH = 10_000;
export const FLOOR_MS = 28_000;
export const CANDLE_COUNT = 48;
export const MAYA_SIZE = 0.42;
export const MAYA_SIZE_CAPPED = 0.18;
export const MAYA_SIZE_DUO = 0.26;
export const JULES_SIZE = 0.22;
export const MAYA_SIZE_DUO_CAPPED = 0.12;
export const JULES_SIZE_CAPPED = 0.1;
export const YOLO_MULT = 1.55;
export const YOLO_ESPRESSO = 1.85;
export const FOMO_INDEX_RATIO = 0.48;
export const FOMO_ESPRESSO_RATIO = 0.32;
export const DRIP_FLAT = 80;
export const DRIP_PCT = 0.008;
export const PANIC_TAX = 0.05;
export const PANIC_TAX_MIN = 220;

export type ScreenId = "boot" | "brief" | "floor" | "bell" | "desk";
export type UpgradeId = "compliance" | "espresso" | "research";

export interface FloorUpgrades {
  compliance: boolean;
  espresso: boolean;
  research: boolean;
}

export const EMPTY_UPGRADES: FloorUpgrades = {
  compliance: false,
  espresso: false,
  research: false,
};

export interface DeskSave {
  deskName: string;
  cash: number;
  day: number;
  runSeed: number;
  hasAccountant: boolean;
  accountantHired: boolean;
  hasSeat2: boolean;
  hasUpgrades: boolean;
  upgradeCompliance: boolean;
  upgradeEspresso: boolean;
  upgradeResearch: boolean;
  redDays: number;
  bestDay: number;
  worstDay: number;
  createdAt: number;
}

export function upgradesFrom(save: DeskSave): FloorUpgrades {
  return {
    compliance: save.upgradeCompliance || save.accountantHired,
    espresso: save.upgradeEspresso,
    research: save.upgradeResearch,
  };
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
    hasSeat2: false,
    hasUpgrades: false,
    upgradeCompliance: false,
    upgradeEspresso: false,
    upgradeResearch: false,
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
    const parsed = JSON.parse(raw) as Partial<DeskSave>;
    if (!parsed.deskName || typeof parsed.cash !== "number") return null;
    const hasAccountant = Boolean(parsed.hasAccountant);
    const compliance = Boolean(parsed.upgradeCompliance ?? parsed.accountantHired);
    return {
      ...newDesk(parsed.deskName),
      ...parsed,
      deskName: parsed.deskName,
      cash: parsed.cash,
      day: parsed.day ?? 1,
      runSeed: parsed.runSeed ?? 1,
      hasAccountant,
      accountantHired: compliance,
      hasSeat2: Boolean(parsed.hasSeat2 || hasAccountant),
      hasUpgrades: Boolean(parsed.hasUpgrades || hasAccountant || parsed.hasSeat2),
      upgradeCompliance: compliance,
      upgradeEspresso: Boolean(parsed.upgradeEspresso),
      upgradeResearch: Boolean(parsed.upgradeResearch),
      redDays: parsed.redDays ?? 0,
      bestDay: parsed.bestDay ?? 0,
      worstDay: parsed.worstDay ?? 0,
      createdAt: parsed.createdAt ?? Date.now(),
    };
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

export function panicTax(cash: number): number {
  return Math.round(Math.max(PANIC_TAX_MIN, cash * PANIC_TAX));
}
