import {
  FLOOR_MS,
  FLOOR_MS_ESPRESSO,
  MAYA_SIZE,
  MAYA_SIZE_CAPPED,
  MAYA_SIZE_DUO,
  MAYA_SIZE_DUO_CAPPED,
  QUOTE_MS,
  QUOTE_MS_ESPRESSO,
  upgradesFrom,
  type DeskSave,
  type FloorUpgrades,
  type UpgradeId,
} from "./state";

export interface PitView {
  sizeOn: boolean;
  sizeMult: number;
  sizeText: string;
  sizeHint: string;
  speedOn: boolean;
  speedMult: number;
  speedText: string;
  speedHint: string;
  floorMs: number;
  quoteMs: number;
  inquiryOn: boolean;
  inquiryText: string;
  inquiryHint: string;
}

function fmtMult(n: number): string {
  return `${n.toFixed(1)}x`;
}

export function pitView(upgrades: FloorUpgrades, seat2 = false): PitView {
  const raw = seat2 ? MAYA_SIZE_DUO : MAYA_SIZE;
  const cap = seat2 ? MAYA_SIZE_DUO_CAPPED : MAYA_SIZE_CAPPED;
  const sizeOn = upgrades.compliance;
  const sizeMult = sizeOn ? cap / raw : 1;
  const speedOn = upgrades.espresso;
  const floorMs = speedOn ? FLOOR_MS_ESPRESSO : FLOOR_MS;
  const speedMult = FLOOR_MS / floorMs;
  const inquiryOn = upgrades.research;
  return {
    sizeOn,
    sizeMult,
    sizeText: fmtMult(sizeMult),
    sizeHint: sizeOn ? "capped" : "full books",
    speedOn,
    speedMult,
    speedText: `${Math.round(floorMs / 1000)}s`,
    speedHint: speedOn ? `${fmtMult(speedMult)} · FOMO early` : "1.0x · FOMO late",
    floorMs,
    quoteMs: speedOn ? QUOTE_MS_ESPRESSO : QUOTE_MS,
    inquiryOn,
    inquiryText: inquiryOn ? "ON" : "OFF",
    inquiryHint: inquiryOn ? "blowup warn" : "no tell",
  };
}

export function pitViewFromSave(save: DeskSave): PitView {
  return pitView(upgradesFrom(save), save.hasSeat2);
}

export function statStrip(
  view: PitView,
  opts?: { tone?: "floor" | "desk"; flash?: UpgradeId | null; liveInquiry?: string | null },
): string {
  const tone = opts?.tone ?? "desk";
  const flash = opts?.flash ?? null;
  const live = opts?.liveInquiry ?? null;
  const inquiryHot = Boolean(view.inquiryOn || live);
  const inquiryVal = live ?? view.inquiryText;
  const inquiryHint = live ? "tell live" : view.inquiryHint;
  const chip = (
    id: UpgradeId,
    kicker: string,
    value: string,
    hint: string,
    on: boolean,
    valueId?: string,
  ) => `
    <div class="stat-chip ${on ? "on" : "dim"}${flash === id ? " just" : ""}" data-stat="${id}">
      <span class="stat-k">${kicker}</span>
      <span class="stat-v" ${valueId ? `id="${valueId}"` : ""}>${value}</span>
      <span class="stat-h">${hint}</span>
    </div>`;
  return `
    <div class="stat-strip ${tone}" id="stat-strip" aria-label="Pit stats">
      ${chip("compliance", "SIZE", view.sizeText, view.sizeHint, view.sizeOn)}
      ${chip("espresso", "SPEED", view.speedText, view.speedHint, view.speedOn)}
      ${chip("research", "INQUIRY", inquiryVal, inquiryHint, inquiryHot, "stat-inquiry-v")}
    </div>`;
}
