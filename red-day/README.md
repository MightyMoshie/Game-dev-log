# Red Day (v0 smoke)

TikTok Mini Game smoke test. **Browser first. No TikTok SDK.** A later port targets Cocos / TikTok Mini Games.

You are the desk lead of a tiny cartoon prop office. You do not trade. Trainees fish the tape on visible lines. You slack the line (**Let them ride**) or reel them off (**Yank**). Teaching is surviving their decisions.

Fictional tickers only (`CHAI`, `NBL`, `BLND`). Satire. Not financial advice.

## Run

```bash
cd red-day
npm install
npm run dev
```

Then open the local URL (Vite prints it). Use phone-width or the on-screen 9:16 frame.

```bash
npm test          # sim, quotes, roast tests
npm run build     # production bundle in dist/
npm run preview   # serve the build
```

## Loop (under ~45s for day 1)

1. **Cold start** — optional desk name (default Paper Hands LLC).
2. **Morning brief** — one headline + trainee hot take(s).
3. **The Floor** — a chunky isometric office that fills the phone. Tape lives in a fish tank on the back wall. Maya’s fishing rod is the silhouette. Let them ride / Yank.
4. **Bell** — day’s P&L + roast card. Fake “Watch to replay the day” button (disabled).
5. **Desk** — cash, roster. First real red day unlocks **Jules (seat 2)** and the Accountant. Next morning.

After seat 2: two desks stacked, one line each. Tap a desk to select, then yank or slack that line. The other trainee keeps swimming.

## Out of scope (v0)

Real market data, multiplayer, IAP, TikTok login, ads, a six-desk spreadsheet, desktop-only layout.
