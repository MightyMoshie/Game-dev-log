export type Beat = "gap-up" | "dump" | "fakeout" | "squeeze" | "bleed";

export interface BriefCopy {
  ticker: string;
  headline: string;
  mayaTake: string;
}

export const TICKERS = ["CHAI", "NBL", "BLND"] as const;

export const BRIEFS: BriefCopy[] = [
  {
    ticker: "CHAI",
    headline: "CHAI gaps on a leaked Notes screenshot titled “alpha (do not share).”",
    mayaTake: "If you’re not sized, you’re not serious. I’m serious. I’m so serious.",
  },
  {
    ticker: "NBL",
    headline: "NBL “community” insists yesterday’s dump was a liquidity event for believers.",
    mayaTake: "My group chat just sent fourteen rockets. That’s due diligence.",
  },
  {
    ticker: "BLND",
    headline: "BLND listed on a meme venue that definitely exists. Volume: vibes.",
    mayaTake: "I watched three recap videos. I am an expert now. Load it.",
  },
  {
    ticker: "CHAI",
    headline: "Overnight: a guy named Braxton said CHAI is “so back it hurts.”",
    mayaTake: "Don’t fade this. I will personally be annoying if you fade this.",
  },
  {
    ticker: "NBL",
    headline: "Unverified “analyst” upgrades NBL from speculative to destiny.",
    mayaTake: "This is the one they write threads about. I can feel the thread.",
  },
  {
    ticker: "BLND",
    headline: "BLND opens after a 2am Space where nobody said a number, just “trust.”",
    mayaTake: "Stop looking with your eyes. Feel the tape. The tape owes me.",
  },
  {
    ticker: "CHAI",
    headline: "CHAI holders posting “we risk-managed by not looking.”",
    mayaTake: "If it dips I’m adding. That’s called conviction, desk lead.",
  },
  {
    ticker: "NBL",
    headline: "Rumor mill: NBL “insiders” are three interns and a shared Spotify.",
    mayaTake: "Institutional. Basically. Spiritually. Anyway I’m long.",
  },
];

export type MayaMood = "hyped" | "sweat" | "mad" | "smug";

export function mayaLine(
  pnlPct: number,
  yanked: boolean,
  rode: boolean,
  fomo: boolean,
  moodHint?: MayaMood,
): { text: string; mood: MayaMood } {
  if (yanked) {
    if (pnlPct > 0.04) {
      return { text: "Okay. Fine. Maybe you’re useful. Don’t let it go to your head.", mood: "mad" };
    }
    if (pnlPct < -0.03) {
      return { text: "WAIT I WAS ABOUT TO BE RIGHT. You yanked the bottom. Unreal.", mood: "mad" };
    }
    return { text: "Flattened. Coward speedrun. I respect the cowardice a tiny bit.", mood: "sweat" };
  }
  if (fomo) {
    return { text: "Buying this dip with BOTH hands. Say nothing. Let me cook.", mood: "hyped" };
  }
  if (rode && pnlPct > 0) {
    return { text: "SIZE. I knew you had taste. We are so ridiculously back.", mood: "hyped" };
  }
  if (rode && pnlPct < 0) {
    return { text: "We added. That’s how winners get bigger. Ignore the red. It’s shy.", mood: "sweat" };
  }
  if (moodHint === "hyped" || pnlPct > 0.06) {
    return pickLine(
      [
        "WE ARE SO BACK. Desk lead. Look at me. LOOK.",
        "This is free. This is charity. Thank you tape.",
        "I will not be humble about this. I refuse.",
      ],
      "hyped",
    );
  }
  if (pnlPct < -0.1) {
    return pickLine(
      [
        "Okay but if we sell we lock it in so we DON’T.",
        "Thesis still intact. The thesis is vibes. Vibes are eternal.",
        "This is where cowards leave. We are not cowards. Right?",
      ],
      "sweat",
    );
  }
  if (pnlPct < -0.02) {
    return pickLine(
      [
        "Healthy dip. They’re shaking us out. I will not be shaken.",
        "Textbook accumulation if you squint and believe.",
        "My cousin’s roommate is still long. That’s a signal.",
      ],
      "sweat",
    );
  }
  return pickLine(
    [
      "Tape’s being weird on purpose. I speak weird.",
      "Don’t you dare hover the yank. I can hear your finger.",
      "Trust the process. The process is me. Hi.",
    ],
    "smug",
  );
}

function pickLine(lines: string[], mood: MayaMood): { text: string; mood: MayaMood } {
  const i = Math.abs(Math.floor(Date.now() / 2200)) % lines.length;
  return { text: lines[i]!, mood };
}

export interface Roast {
  id: string;
  stamp: string;
  body: string;
  lesson: string;
}

export function pickRoast(input: {
  pnl: number;
  cash: number;
  yanked: boolean;
  yankedAt: number | null;
  candlesLeftAfterYankMove: number;
  rode: boolean;
  fomo: boolean;
  recoveredPct: number;
  accountantHired: boolean;
}): Roast {
  const { pnl, cash, yanked, rode, fomo, recoveredPct, accountantHired } = input;
  void input.yankedAt;
  void input.candlesLeftAfterYankMove;
  const pctOfDesk = pnl / Math.max(cash, 1);

  if (yanked && recoveredPct > 0.06) {
    return {
      id: "yanked_bottom",
      stamp: "YANKED THE BOTTOM",
      body: "You flattened Maya at the exact moment the tape decided to be funny. She will mention this until the heat death of the group chat.",
      lesson: "Timing a yank is still a guess. You just guessed spicy.",
    };
  }
  if (!yanked && (rode || fomo) && pnl < -cash * 0.05) {
    return {
      id: "yolo_size",
      stamp: "LET HER YOLO SIZE",
      body: "You let Maya press the big red feeling. Size turned a dip into a personality. The desk felt that one in its paper bones.",
      lesson: "FOMO size is how a bad day becomes a Red Day.",
    };
  }
  if (!yanked && pnl < -cash * 0.03) {
    return {
      id: "held_loser",
      stamp: "HELD THE BAG",
      body: "You froze. Maya rode a loser like it owed her rent. Survival is the tutorial. This was the quiz you didn’t know you sat.",
      lesson: "Doing nothing is still a decision. Usually a sticky one.",
    };
  }
  if (yanked && pnl < 0 && recoveredPct <= 0.06) {
    return {
      id: "yanked_smart",
      stamp: "CUT THE BLEED",
      body: "You yanked a loser before it could write a memoir. Maya called you a coward. The P&L called you a manager.",
      lesson: "Flattening is allowed. It’s the whole job, actually.",
    };
  }
  if (yanked && pnl > cash * 0.03) {
    return {
      id: "cut_winner",
      stamp: "YANKED A WINNER",
      body: "You took the meat and left the myth. Maya wanted the moon. You wanted a desk that still exists tomorrow. Both of you are annoying.",
      lesson: "A locked green is still a green. Live with her sighs.",
    };
  }
  if (!yanked && pnl > cash * 0.04) {
    return {
      id: "lucky_hold",
      stamp: "GOT AWAY WITH IT",
      body: "You let her ride and the tape paid you for the bit. Do not confuse luck with a process. She already did.",
      lesson: "Winning on vibes prints confidence. Confidence prints the next hole.",
    };
  }
  if (accountantHired && Math.abs(pctOfDesk) < 0.03) {
    return {
      id: "accountant_saved",
      stamp: "HR DID THEIR JOB",
      body: "The Accountant’s size cap turned a potential blowup into a shrug. Maya is bored. Boredom is a risk control.",
      lesson: "Caps are unsexy. Caps keep the lights on.",
    };
  }
  if (Math.abs(pnl) < cash * 0.015) {
    return {
      id: "nothing_burger",
      stamp: "NOTHING-BURGER",
      body: "The day happened, barely. No legend. No funeral. Maya is already drafting a thread about a setup that did not occur.",
      lesson: "Most days are noise. The desk still has to clock out.",
    };
  }
  if (pnl < 0) {
    return {
      id: "red_generic",
      stamp: "PAPER CUT",
      body: "Red, but you’re still here. That’s the whole satire: the lesson is the bruise, not a quiz.",
      lesson: "A small red is tuition. A big red is a plot point.",
    };
  }
  return {
    id: "green_generic",
    stamp: "DESK STILL STANDING",
    body: "Green tape, fragile ego, fictional ticker. Take the win off the table and do not let Maya name a yacht.",
    lesson: "Bank the day. Tomorrow she will try again.",
  };
}

export const DISCLAIMER =
  "Satire. Not financial advice. CHAI/NBL/BLND are fake. Don’t YOLO your rent.";
