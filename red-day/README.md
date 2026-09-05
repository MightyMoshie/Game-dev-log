# Red Day (v0 smoke)

TikTok Mini Game smoke test. **Browser first. No TikTok SDK.** A later port targets Cocos / TikTok Mini Games.

You are the desk lead. **You don’t trade. You approve who sits.** Trainees bring a premade book (ticker + side are theirs). You Seat / Reject / Cut size, then slack the line (**Let them ride**) or reel them off (**Yank**). Teaching is surviving their decisions.

Fictional tickers only (`CHAI`, `NBL`, `BLND`). Satire. Not financial advice.

Phone playtest: https://mightymoshie.github.io/Game-dev-log/

## Run

```bash
cd red-day
npm install
npm run dev
```

Then open the local URL (Vite prints it). Use phone-width or the on-screen 9:16 frame.

```bash
npm test          # sim, quotes, roast, unlock/scar/pitch tests
npm run build     # production bundle in dist/
npm run preview   # serve the build (uses /Game-dev-log/ base)
```

Local `npm run dev` serves at `/`. Production / Pages uses `/Game-dev-log/`.

## Loop

1. **Cold start** — optional desk name (default Paper Hands LLC).
2. **Pitch Gate** — 1–2 morning pitches (Day 1: Maya only). Each pitch: trainee, bias tag (`ALWAYS LONG` / `ALWAYS SHORT`), fictional ticker, trainee-owned side (you cannot flip it), size band (Full/Half), one-line thesis. Actions: **Seat / Reject / Cut size**. Day 1 forces at least one Seat.
3. **Morning Mandate** (optional) — one desk rule: `NO FOMO` / `HALF SIZE` / `YANK GREEN`. Breaking feeds a roast, not a hard fail. `NO FOMO` is hard before Compliance — FOMO still fires without it.
4. **The Floor** — voxel high-rise. Jumbotron on the back wall. Let {name} ride / Yank {name} / Panic. ~28s (20s with Espresso).
5. **Bell** — day’s P&L + roast. Disabled “Coming · Watch to replay” placeholder.
6. **Desk** — paper cash, **Scars**, floor kit, roster. Next open.

## Unlock + Scars

Jules (seat 2) and the shop open on **whichever comes first**:

- `save.day >= 3` after finishing Day 2 (entering Day 3), or
- first real red day (`pnl < -25`)

Existing saves that already have `hasSeat2` are left alone. If they don’t, and `day >= 3`, the grant fires on the next finish / desk visit.

**Scars** (`DeskSave.scars`):

- Shop open grants `scars = max(scars, 2)` so one upgrade is immediately buyable. **Starter Scars = 2.**
- Earn: real red +2, recovered-after-yank +1 (cap 1/day), panic +1 (additive).
- Floor kit (Compliance / Espresso / Research) costs **2 Scars** each. Each item hits everyone.

After seat 2: two desks. Tap a desk to select, then yank or slack that line. The other trainee keeps swimming.

## Out of scope (v0)

Player direction trading, real market data, art redo, Pages settings, multiplayer, IAP, TikTok login / SDK, ads, a third seat, desktop-only layout.
