# Red Day (v0 smoke)

TikTok Mini Game smoke test. **Browser first. No TikTok SDK.** A later port targets Cocos / TikTok Mini Games.

You are the desk lead of a tiny cartoon prop firm. You do not trade. You babysit Maya, an overconfident trainee, and live with the risk. Teaching is surviving her decisions.

Fictional tickers only (`CHAI`, `NBL`, `BLND`). Satire. Not financial advice.

## Run

```bash
cd red-day
npm install
npm run dev
```

Then open the local URL (Vite prints it). Use phone-width or the on-screen 9:16 frame.

```bash
npm test          # sim + roast unit tests
npm run build     # production bundle in dist/
npm run preview   # serve the build
```

## Loop (under ~45s)

1. **Cold start** — optional desk name (default Paper Hands LLC).
2. **Morning brief** — one headline + Maya’s hot take.
3. **The Floor** — ~24s seeded tape. Two actions: Let them ride / Yank.
4. **Bell** — day’s P&L + roast card. Fake “Watch to replay the day” button (disabled).
5. **Desk** — cash, Maya, unlock Accountant after the first real red day. Next morning.

If you freeze, Maya often rides a loser too long (FOMO add). Yank locks P&L immediately. The Accountant caps size, drips overnight paper cash, and mutes blowups.

## Out of scope (v0)

Real market data, multiplayer, IAP, TikTok login, ads, upgrade mazes, desktop-only layout.
