import type { BriefCopy } from "./copy";
import { BRIEFS } from "./copy";
import { pick } from "./rng";

export type Side = "long" | "short";

export interface TradeSheet {
  ticker: string;
  side: Side;
  headline: string;
  take: string;
}

const JULES_SHEETS: TradeSheet[] = [
  {
    ticker: "CHAI",
    side: "short",
    headline: "CHAI rips. Jules’s sheet says ‘overbought, fade it.’",
    take: "Strength is a sell. The model fades green. I’m short.",
  },
  {
    ticker: "NBL",
    side: "short",
    headline: "NBL squeezes on vibes. Jules is already fading the print.",
    take: "If they’re celebrating, I’m fading. That’s the model. It’s three cells.",
  },
  {
    ticker: "BLND",
    side: "short",
    headline: "BLND holders posting rockets. Jules shorts the screenshot.",
    take: "Rockets are a contrary indicator. I’m short. Don’t @ me, desk lead.",
  },
  {
    ticker: "CHAI",
    side: "short",
    headline: "A guy named Braxton said CHAI can’t go down. Jules took the other side.",
    take: "Braxton is the exit liquidity. Short. Size is ‘tasteful,’ I promise.",
  },
  {
    ticker: "NBL",
    side: "short",
    headline: "Unverified analyst calls NBL destiny. Jules calls it a fade.",
    take: "Destiny is not a rating. I’m shorting the rating. Spreadsheet agrees.",
  },
  {
    ticker: "BLND",
    side: "short",
    headline: "BLND 2am Space: ‘trust.’ Jules hears ‘top.’",
    take: "Trust is not a cell I can format. Fade the Space. I’m short.",
  },
];

function asLong(b: BriefCopy): TradeSheet {
  return { ticker: b.ticker, side: "long", headline: b.headline, take: b.mayaTake };
}

export function pickMayaSheet(rng: () => number): TradeSheet {
  return asLong(pick(rng, BRIEFS));
}

export function pickJulesSheet(rng: () => number, avoidTicker?: string): TradeSheet {
  const other = JULES_SHEETS.filter((s) => s.ticker !== avoidTicker);
  return pick(rng, other.length ? other : JULES_SHEETS);
}
