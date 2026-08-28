import { accountantSvg, lockSvg, mayaSvg } from "./art";
import { DISCLAIMER, type MayaMood } from "./copy";
import type { Roast } from "./copy";
import { money, signedMoney, type DeskSave } from "./state";
import type { PreparedDay } from "./sim";

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
      <p class="subtag">Tiny cartoon prop desk. Trainees with FOMO. Risk is the joke and the lesson.</p>
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
          <p class="who">MAYA · TRAINEE ON THE BOOK</p>
          <p>${escapeHtml(day.mayaTake)}</p>
        </div>
      </div>
      <p class="beats">Today’s tape: ${day.beats.map((b) => b.replace("-", " ")).join(" + ")}</p>
      <button class="btn primary" data-act="floor">OPEN THE FLOOR</button>
      <p class="fine">~24 seconds. Two buttons. Live with it.</p>
    </section>
  `;
}

export function floorScreen(save: DeskSave, day: PreparedDay): string {
  return `
    <section class="screen floor">
      <header class="floor-head">
        <div>
          <div class="clock-label">TAPE</div>
          <div class="clock" id="clock">0:24</div>
        </div>
        <div class="ticker-block">
          <div class="ticker" id="ticker">${escapeHtml(day.ticker)}</div>
          <div class="desk-mini">${escapeHtml(save.deskName)}</div>
        </div>
        <div class="pnl-block">
          <div class="clock-label">MAYA P&amp;L</div>
          <div class="live-pnl" id="live-pnl">$0</div>
        </div>
      </header>
      <div class="maya-row compact">
        <div class="portrait sm" id="maya-port">${mayaSvg("smug")}</div>
        <div class="bubble" id="bubble">
          <p class="who">MAYA</p>
          <p id="maya-line">Don’t you dare hover the yank. I can hear your finger.</p>
        </div>
      </div>
      <canvas id="tape" width="360" height="220"></canvas>
      <div class="pos" id="pos">MAYA LONG · ${money(day.baseNotional)} · ${escapeHtml(day.ticker)}</div>
      <div class="actions">
        <button class="btn gold" data-act="ride" id="btn-ride">LET THEM RIDE</button>
        <button class="btn danger" data-act="yank" id="btn-yank">YANK</button>
      </div>
      ${save.accountantHired ? `<p class="hr-chip">ACCOUNTANT ON DESK · SIZE CAPPED</p>` : ""}
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
}): string {
  const tone = opts.pnl < 0 ? "red" : opts.pnl > 0 ? "green" : "flat";
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
        <p class="tags">${opts.yanked ? "YANKED" : "HELD"} · ${opts.rode ? "RIDE TAPPED" : opts.fomo ? "IDLE FOMO" : "NO ADD"}</p>
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
            <p>Overconfident trainee. FOMO voice. On the book until you yank.</p>
            <span class="chip hot">ACTIVE</span>
          </div>
        </article>
        <article class="hire-card ${accLocked ? "locked" : ""}">
          ${accHired ? accountantSvg() : accLocked ? lockSvg() : accountantSvg()}
          <div>
            <h3>Accountant</h3>
            ${
              accHired
                ? `<p>Size cap on. Overnight drip on. Fewer blowups. Maya is bored and alive.</p>
                   <span class="chip">HIRED</span>`
                : accLocked
                  ? `<p>Unlocks after the first real red day. Boring on purpose.</p>
                     <span class="chip">LOCKED</span>`
                  : `<p>Caps Maya’s size, drips paper cash overnight, mutes blowups.</p>
                     <button class="btn gold sm" data-act="hire">HIRE · FREE UNLOCK</button>`
            }
          </div>
        </article>
      </div>
      ${justUnlocked ? `<p class="unlock-banner">First Red Day logged. HR sent you an Accountant.</p>` : ""}
      <button class="btn primary" data-act="nextday">NEXT MORNING BRIEF</button>
      <button class="btn tiny" data-act="title">title screen</button>
    </section>
  `;
}

export function setMaya(root: HTMLElement, mood: MayaMood, line: string): void {
  const port = root.querySelector("#maya-port");
  const p = root.querySelector("#maya-line");
  if (port) port.innerHTML = mayaSvg(mood);
  if (p) p.textContent = line;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
