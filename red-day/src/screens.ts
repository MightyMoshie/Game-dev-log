import { accountantSvg, julesSvg, lockSvg, mayaSvg } from "./art";
import { DISCLAIMER } from "./copy";
import type { Roast } from "./copy";
import { officeMarkup } from "./office";
import { money, signedMoney, type DeskSave } from "./state";
import type { LiveBook, PreparedDay } from "./sim";

export function bootScreen(existing: DeskSave | null): string {
  const named = existing?.deskName ?? "Paper Hands LLC";
  return `
    <section class="screen boot">
      <div class="tape" aria-hidden="true">CHAI · NBL · BLND · PAPER ONLY · CHAI · NBL · BLND · PAPER ONLY · CHAI · NBL · BLND · PAPER ONLY · </div>
      <div class="wordmark">
        <span class="splat">RED</span>
        <span class="day">DAY</span>
      </div>
      <p class="tag">You don’t trade. You babysit.</p>
      <p class="subtag">Tiny cartoon prop office. Trainees on fishing lines. Risk is the joke and the lesson.</p>
      <label class="field">
        <span>Desk name</span>
        <input id="desk-name" maxlength="28" value="${escapeHtml(named)}" autocomplete="off" />
      </label>
      <button class="btn primary" data-act="open">OPEN THE DESK</button>
      ${
        existing
          ? `<button class="btn ghost" data-act="continue">CONTINUE DAY ${existing.day}</button>
             <button class="btn tiny" data-act="reset">new desk (wipe save)</button>`
          : `<p class="hint">Default is Paper Hands LLC. One tap starts day one.</p>`
      }
      <p class="fine">${DISCLAIMER}</p>
    </section>
  `;
}

export function briefScreen(save: DeskSave, day: PreparedDay): string {
  const two = day.seat2;
  return `
    <section class="screen brief">
      <header class="topbar">
        <span class="pill">${escapeHtml(save.deskName)}</span>
        <span class="pill alt">DAY ${day.day}</span>
      </header>
      <p class="kicker">MORNING BRIEF</p>
      <article class="headline-card">
        <div class="badge">${escapeHtml(day.ticker)}</div>
        <h2>${escapeHtml(day.headline)}</h2>
      </article>
      <div class="maya-row">
        <div class="portrait">${mayaSvg("hyped")}</div>
        <div class="bubble">
          <p class="who">MAYA · SEAT 1 · ON THE LINE</p>
          <p>${escapeHtml(day.mayaTake)}</p>
        </div>
      </div>
      ${
        two
          ? `<div class="maya-row">
              <div class="portrait">${julesSvg("smug")}</div>
              <div class="bubble">
                <p class="who">JULES · SEAT 2 · ALSO ON THE LINE</p>
                <p>${escapeHtml(day.julesTake)}</p>
              </div>
            </div>`
          : ""
      }
      <p class="beats">Today’s tape: ${day.beats.map((b) => b.replace("-", " ")).join(" + ")}</p>
      <button class="btn primary" data-act="floor">OPEN THE FLOOR</button>
      <p class="fine">${two ? "Tap a desk to pick a line. Yank one, the other keeps swimming." : "~28 seconds. Slack the line or reel them off."}</p>
    </section>
  `;
}

export function floorScreen(save: DeskSave, day: PreparedDay): string {
  return `
    <section class="screen floor">
      ${officeMarkup({
        seats: day.seats.map((s) => ({ id: s.id, name: s.name })),
        accountant: save.accountantHired,
        ticker: day.ticker,
      })}
      <div class="floor-dock">
        <div class="pos" id="pos">MAYA SWIMMING · ${money(day.seats[0] ? save.cash * day.seats[0].size : 0)} · ${escapeHtml(day.ticker)}</div>
        <div class="actions">
          <button class="btn gold" data-act="ride" id="btn-ride">LET THEM RIDE</button>
          <button class="btn danger" data-act="yank" id="btn-yank">YANK</button>
        </div>
      </div>
    </section>
  `;
}

export function bellScreen(opts: {
  save: DeskSave;
  day: PreparedDay;
  pnl: number;
  roast: Roast;
  yanked: boolean;
  rode: boolean;
  fomo: boolean;
  books: LiveBook[];
}): string {
  const tone = opts.pnl < 0 ? "red" : opts.pnl > 0 ? "green" : "flat";
  const tags = opts.books
    .map((b) => `${b.name} ${b.yankedAt != null ? "REELED" : "SWAM"}`)
    .join(" · ");
  return `
    <section class="screen bell">
      <p class="kicker slam">BELL</p>
      <article class="roast-card ${tone}">
        <div class="roast-meta">
          <span>${escapeHtml(opts.save.deskName)}</span>
          <span>DAY ${opts.day.day} · ${escapeHtml(opts.day.ticker)}</span>
        </div>
        <p class="roast-pnl">${signedMoney(opts.pnl)}</p>
        <h2 class="stamp">${escapeHtml(opts.roast.stamp)}</h2>
        <p class="roast-body">${escapeHtml(opts.roast.body)}</p>
        <p class="lesson"><strong>LESSON</strong> ${escapeHtml(opts.roast.lesson)}</p>
        <p class="tags">${escapeHtml(tags || (opts.yanked ? "YANKED" : "HELD"))}</p>
        <p class="card-disc">${DISCLAIMER}</p>
      </article>
      <button class="btn fake" data-act="ad" disabled title="Placeholder. No ads in v0.">▶ Watch to replay the day</button>
      <p class="fake-note">Ad placeholder · not hooked up · never real money</p>
      <button class="btn primary" data-act="desk">BACK TO THE DESK</button>
    </section>
  `;
}

export function deskScreen(save: DeskSave, lastPnl: number | null, justUnlocked: boolean): string {
  const accLocked = !save.hasAccountant;
  const accHired = save.accountantHired;
  const seat2 = save.hasSeat2;
  return `
    <section class="screen desk">
      <header class="topbar">
        <span class="pill">${escapeHtml(save.deskName)}</span>
        <span class="pill alt">DAY ${Math.max(1, save.day - 1)} DONE</span>
      </header>
      <div class="cash-hero">
        <p class="clock-label">PAPER CASH</p>
        <p class="cash">${money(save.cash)}</p>
        ${lastPnl == null ? "" : `<p class="last ${lastPnl < 0 ? "down" : "up"}">last print ${signedMoney(lastPnl)}</p>`}
      </div>
      <div class="roster">
        <article class="hire-card">
          ${mayaSvg("smug")}
          <div>
            <h3>Maya</h3>
            <p>Overconfident trainee. FOMO voice. One fishing line until you reel her off.</p>
            <span class="chip hot">SEAT 1</span>
          </div>
        </article>
        <article class="hire-card ${seat2 ? "" : "locked"}">
          ${seat2 ? julesSvg("smug") : lockSvg()}
          <div>
            <h3>Jules</h3>
            ${
              seat2
                ? `<p>Second seat. Has a “model.” Chases green. Yank Maya or Jules — the other keeps swimming.</p>
                   <span class="chip hot">SEAT 2 · ON THE FLOOR</span>`
                : `<p>Unlocks after the first real red day. Cap: two seats.</p>
                   <span class="chip">LOCKED</span>`
            }
          </div>
        </article>
        <article class="hire-card ${accLocked ? "locked" : ""}">
          ${accHired ? accountantSvg() : accLocked ? lockSvg() : accountantSvg()}
          <div>
            <h3>Accountant</h3>
            ${
              accHired
                ? `<p>Size cap on. Overnight drip on. Fewer blowups. No fishing line. On purpose.</p>
                   <span class="chip">HIRED</span>`
                : accLocked
                  ? `<p>Unlocks after the first real red day. Boring on purpose.</p>
                     <span class="chip">LOCKED</span>`
                  : `<p>Caps size, drips paper cash overnight, mutes blowups.</p>
                     <button class="btn gold sm" data-act="hire">HIRE · FREE UNLOCK</button>`
            }
          </div>
        </article>
      </div>
      ${justUnlocked ? `<p class="unlock-banner">First Red Day logged. Jules took seat 2. HR sent an Accountant.</p>` : ""}
      <button class="btn primary" data-act="nextday">NEXT MORNING BRIEF</button>
      <button class="btn tiny" data-act="title">title screen</button>
    </section>
  `;
}

export function setBubble(root: HTMLElement, who: string, line: string): void {
  const w = root.querySelector("#bubble-who");
  const p = root.querySelector("#maya-line");
  if (w) w.textContent = who;
  if (p) p.textContent = line;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
