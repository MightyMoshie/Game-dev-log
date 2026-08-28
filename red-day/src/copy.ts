import type { SeatId } from "./quotes";

export type Beat = "gap-up" | "dump" | "fakeout" | "squeeze" | "bleed";

export interface BriefCopy {
  ticker: string;
  headline: string;
  mayaTake: string;
  julesTake: string;
}

export const TICKERS = ["CHAI", "NBL", "BLND"] as const;

export const BRIEFS: BriefCopy[] = [
  {
    ticker: "CHAI",
    headline: "CHAI gaps on a leaked Notes screenshot titled “alpha (do not share).”",
    mayaTake: "If you’re not sized, you’re not serious. I’m serious. I’m so serious.",
    julesTake: "I put the gap in a sheet. Sheet says fade. I’m short.",
  },
  {
    ticker: "NBL",
    headline: "NBL “community” insists yesterday’s dump was a liquidity event for believers.",
    mayaTake: "My group chat just sent fourteen rockets. That’s due diligence.",
    julesTake: "Believers aren’t a factor. I’m fading believers. Short.",
  },
  {
    ticker: "BLND",
    headline: "BLND listed on a meme venue that definitely exists. Volume: vibes.",
    mayaTake: "I watched three recap videos. I am an expert now. Load it.",
    julesTake: "Volume: vibes is not a number. I’m shorting the vibes.",
  },
  {
    ticker: "CHAI",
    headline: "Overnight: a guy named Braxton said CHAI is “so back it hurts.”",
    mayaTake: "Don’t fade this. I will personally be annoying if you fade this.",
    julesTake: "Braxton is not in the model. The model is short. I’m short.",
  },
  {
    ticker: "NBL",
    headline: "Unverified “analyst” upgrades NBL from speculative to destiny.",
    mayaTake: "This is the one they write threads about. I can feel the thread.",
    julesTake: "Destiny isn’t a rating. I’m fading destiny. Short.",
  },
  {
    ticker: "BLND",
    headline: "BLND opens after a 2am Space where nobody said a number, just “trust.”",
    mayaTake: "Stop looking with your eyes. Feel the tape. The tape owes me.",
    julesTake: "Trust is not a cell I can format. Fade the Space. Short.",
  },
  {
    ticker: "CHAI",
    headline: "CHAI holders posting “we risk-managed by not looking.”",
    mayaTake: "If it dips I’m adding. That’s called conviction, desk lead.",
    julesTake: "Not looking is not a hedge. I looked. I’m short.",
  },
  {
    ticker: "NBL",
    headline: "Rumor mill: NBL “insiders” are three interns and a shared Spotify.",
    mayaTake: "Institutional. Basically. Spiritually. Anyway I’m long.",
    julesTake: "Interns aren’t insiders. I would know. I’m fading them. Short.",
  },
];

export interface Roast {
  id: string;
  stamp: string;
  body: string;
  lesson: string;
}

export interface RoastLeg {
  seatId: SeatId;
  name: string;
  pnl: number;
  yanked: boolean;
  rode: boolean;
  fomo: boolean;
  recoveredPct: number;
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
  panic?: boolean;
  legs?: RoastLeg[];
}): Roast {
  const { pnl, cash, yanked, rode, fomo, recoveredPct, accountantHired } = input;
  void input.yankedAt;
  void input.candlesLeftAfterYankMove;
  const legs = input.legs ?? [];
  const pctOfDesk = pnl / Math.max(cash, 1);

  if (input.panic) {
    return {
      id: "panic_button",
      stamp: "HIT THE BIG RED",
      body: "You dumped the whole floor into the aisle. Jumbotron blinked. Paper hands, meet actual hands. The tax is the point. Per-desk yank is the job. This was a fire alarm.",
      lesson: "Panic is a decision with a surcharge. Yank one book at a time.",
    };
  }

  if (legs.length === 2) {
    const two = twoSeatRoast(legs, cash, pnl, accountantHired);
    if (two) return two;
  }

  if (yanked && recoveredPct > 0.06) {
    return {
      id: "yanked_bottom",
      stamp: "YANKED THE BOTTOM",
      body: "You reeled Maya at the exact moment the tape decided to be funny. She will mention this until the heat death of the group chat.",
      lesson: "Timing a yank is still a guess. You just guessed spicy.",
    };
  }
  if (!yanked && (rode || fomo) && pnl < -cash * 0.05) {
    return {
      id: "yolo_size",
      stamp: "LET HER YOLO SIZE",
      body: "You let Maya press the big red feeling. Slack on the line turned a dip into a personality. The desk felt that one in its paper bones.",
      lesson: "FOMO size is how a bad day becomes a Red Day.",
    };
  }
  if (!yanked && pnl < -cash * 0.03) {
    return {
      id: "held_loser",
      stamp: "HELD THE BAG",
      body: "You froze. Maya swam a loser like it owed her rent. Survival is the tutorial. This was the quiz you didn’t know you sat.",
      lesson: "Doing nothing is still a decision. Usually a sticky one.",
    };
  }
  if (yanked && pnl < 0 && recoveredPct <= 0.06) {
    return {
      id: "yanked_smart",
      stamp: "CUT THE BLEED",
      body: "You reeled a loser before it could write a memoir. Maya called you a coward. The P&L called you a manager.",
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
      body: "You left the line slack and the tape paid you for the bit. Do not confuse luck with a process. She already did.",
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

function twoSeatRoast(
  legs: RoastLeg[],
  cash: number,
  pnl: number,
  accountantHired: boolean,
): Roast | null {
  const yanked = legs.filter((l) => l.yanked);
  const swimming = legs.filter((l) => !l.yanked);
  const [a, b] = legs;
  if (!a || !b) return null;

  if (yanked.length === 1 && swimming.length === 1) {
    const pulled = yanked[0]!;
    const other = swimming[0]!;
    if (other.pnl < -cash * 0.03 && pulled.pnl > other.pnl + 40) {
      return {
        id: "wrong_line",
        stamp: "WRONG LINE",
        body: `You reeled ${pulled.name} while ${other.name} kept swimming a loser. The skill was which rod to pull. You pulled the one that wasn’t drowning.`,
        lesson: "Two seats means two risks. Yank is a choice, not a vibe.",
      };
    }
    if (pulled.pnl < 0 && other.pnl > cash * 0.02) {
      return {
        id: "split_decision",
        stamp: "SPLIT THE ROOM",
        body: `You yanked ${pulled.name} off a loser. ${other.name} kept the slack and actually got paid. That’s delegation with a pulse.`,
        lesson: "One line can be wrong while the other is fine. That’s the job.",
      };
    }
  }

  if (yanked.length === 2) {
    return {
      id: "reeled_room",
      stamp: "REELED THE ROOM",
      body: "Both lines came out of the tank. Nobody got to be a hero. The office looks like a manager works here. Maya hates that. Jules is updating a sheet.",
      lesson: "Two yanks is still managing. It’s just louder.",
    };
  }

  if (swimming.length === 2 && pnl < -cash * 0.04) {
    return {
      id: "two_bags",
      stamp: "TWO BAGS, ONE DESK",
      body: "You didn’t pull either line. Maya and Jules both swam the dump like it was a personality test. The office learned nothing except gravity.",
      lesson: "Two unsupervised rods is how a red day gets a roommate.",
    };
  }

  if (accountantHired && Math.abs(pnl) < cash * 0.03) {
    return {
      id: "accountant_saved",
      stamp: "HR DID THEIR JOB",
      body: "Caps on two seats turned a possible blowup into office small talk. The Accountant is insufferable and correct.",
      lesson: "Caps are unsexy. Caps keep the lights on.",
    };
  }

  return null;
}

export const DISCLAIMER =
  "Satire. Not financial advice. CHAI/NBL/BLND are fake. Don’t YOLO your rent.";
