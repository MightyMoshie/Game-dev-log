export type SeatId = "maya" | "jules";
export type Mood = "hyped" | "sweat" | "mad" | "smug" | "dry";

export interface QuoteBank {
  idle: readonly string[];
  yank: readonly string[];
  ride: readonly string[];
  fomo: readonly string[];
}

export const MAYA_QUOTES: QuoteBank = {
  idle: [
    "Don’t you dare hover the yank. I can hear your finger.",
    "Healthy dip. They’re shaking us out. I will not be shaken.",
    "WE ARE SO BACK. Desk lead. Look at me. LOOK.",
    "Thesis still intact. The thesis is vibes. Vibes are eternal.",
    "My group chat just sent fourteen rockets. That’s due diligence.",
    "Trust the process. The process is me. Hi.",
    "If it dips I’m adding. That’s called conviction, desk lead.",
    "Tape’s being weird on purpose. I speak weird.",
  ],
  yank: [
    "WAIT I WAS ABOUT TO BE RIGHT. You reeled the bottom. Unreal.",
    "Flattened. Coward speedrun. I respect the cowardice a tiny bit.",
    "Okay. Fine. Maybe the line was too spicy. Don’t gloat.",
  ],
  ride: [
    "SIZE. Slack the line. I knew you had taste.",
    "We added. That’s how winners get bigger. Ignore the red. It’s shy.",
  ],
  fomo: [
    "Buying this dip with BOTH hands. Say nothing. Let me cook.",
    "Line’s still in. I’m swimming to the other side of this dump.",
  ],
};

export const JULES_QUOTES: QuoteBank = {
  idle: [
    "I built a tiny model. It has three cells. That’s a model.",
    "Maya’s loud. Loud isn’t a factor. I’m a factor.",
    "If this is a fakeout my spreadsheet will look so good.",
    "I’m not chasing. I’m re-entering. Totally different verb.",
    "Can we size down. Asking for a friend. The friend is me.",
    "The tape is data. I am also data. We should collaborate.",
    "I muted the group chat. I can still hear it in my bones.",
    "Mean reversion is science until it isn’t. Anyway I’m in.",
  ],
  yank: [
    "You reeled me. My model had one more candle. ONE.",
    "Okay. Locked. I can update the sheet. I guess that’s a process.",
    "I was hedging with hope. You hedged with a yank. Fine.",
  ],
  ride: [
    "Slack. Good. The model wanted more time. The model is me.",
    "We’re letting it breathe. Breathing is a strategy. Allegedly.",
  ],
  fomo: [
    "It’s going up. I was early, which is the same as right, later.",
    "Chasing? No. I’m confirming. Confirmation looks like this.",
  ],
};

export const ACCOUNTANT_QUOTES: QuoteBank = {
  idle: [
    "Size is a privilege. You are on thin ice made of paper.",
    "I capped you. You’re welcome. Please stop making that face.",
    "Overnight drip posted. Do not spend it on conviction.",
    "If it needs a thread, it is not a process.",
    "I filed this day under “vibes, regrettable.”",
    "Flattening is a verb HR allows. YOLO is not in the handbook.",
    "The line is slack because you asked for slack. Live with it.",
    "I will not be in the screenshot. I will be in the P&L.",
  ],
  yank: [
    "A yank. In writing. I’ll allow it.",
    "You used the rod. The handbook weeps with joy.",
  ],
  ride: [
    "Slack on a capped book is still slack. Noted.",
    "You endorsed the hold. I endorsed the cap. We are not friends.",
  ],
  fomo: [
    "That add is not happening. I already filed the cap.",
    "FOMO is not a line item. Sit down.",
  ],
};

export const BANKS: Record<SeatId | "accountant", QuoteBank> = {
  maya: MAYA_QUOTES,
  jules: JULES_QUOTES,
  accountant: ACCOUNTANT_QUOTES,
};

function shuffle<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i]!;
    out[i] = out[j]!;
    out[j] = a;
  }
  return out;
}

/** Shuffle-bag talker: 6–8 lines, never immediately repeats, not a 2-line toy loop. */
export class Talker {
  private bag: string[] = [];
  private last = "";

  constructor(private readonly lines: readonly string[]) {
    this.refill();
  }

  next(from?: readonly string[]): string {
    if (from && from.length) {
      const pool = from.filter((l) => l !== this.last);
      const pick = (pool.length ? pool : [...from])[Math.floor(Math.random() * (pool.length || from.length))]!;
      this.last = pick;
      this.bag = this.bag.filter((l) => l !== pick);
      return pick;
    }
    if (this.bag.length === 0) this.refill();
    const line = this.bag.pop()!;
    this.last = line;
    return line;
  }

  private refill(): void {
    const src = this.lines.length > 1 ? this.lines.filter((l) => l !== this.last) : this.lines;
    this.bag = shuffle(src);
  }
}

export function moodForPnl(pnlPct: number, yanked: boolean, fomo: boolean): Mood {
  if (yanked) return pnlPct < -0.03 ? "mad" : "sweat";
  if (fomo) return "hyped";
  if (pnlPct > 0.06) return "hyped";
  if (pnlPct < -0.08) return "sweat";
  return "smug";
}
