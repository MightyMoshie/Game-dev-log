import type { DeskSave, UpgradeId } from "./state";

export const REAL_RED_PNL = -25;
export const CURRICULUM_DAY = 3;
export const SCAR_COST = 2;
export const STARTER_SCARS = 2;

export function isRealRedDay(pnl: number): boolean {
  return pnl < REAL_RED_PNL;
}

export function scarsEarned(opts: {
  pnl: number;
  recoveredYank: boolean;
  panic: boolean;
}): number {
  let n = 0;
  if (isRealRedDay(opts.pnl)) n += 2;
  if (opts.recoveredYank) n += 1;
  if (opts.panic) n += 1;
  return n;
}

/** Grant Jules + shop. Existing unlocked saves are left alone. */
export function applyCurriculumUnlock(save: DeskSave, pnl?: number): boolean {
  if (save.hasSeat2) return false;
  const red = pnl != null && isRealRedDay(pnl);
  const byDay = save.day >= CURRICULUM_DAY;
  if (!red && !byDay) return false;
  save.hasSeat2 = true;
  save.hasUpgrades = true;
  save.hasAccountant = true;
  save.scars = Math.max(save.scars, STARTER_SCARS);
  return true;
}

export function tryBuyUpgrade(save: DeskSave, id: UpgradeId): boolean {
  if (!save.hasUpgrades) return false;
  if (save.scars < SCAR_COST) return false;
  if (id === "compliance") {
    if (save.upgradeCompliance) return false;
    save.upgradeCompliance = true;
    save.accountantHired = true;
    save.hasAccountant = true;
  } else if (id === "espresso") {
    if (save.upgradeEspresso) return false;
    save.upgradeEspresso = true;
  } else if (id === "research") {
    if (save.upgradeResearch) return false;
    save.upgradeResearch = true;
  } else {
    return false;
  }
  save.scars -= SCAR_COST;
  return true;
}
