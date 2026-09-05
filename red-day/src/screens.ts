import { julesSvg, lockSvg, mayaSvg } from "./art";
import { DISCLAIMER } from "./copy";
import type { Roast } from "./copy";
import { officeMarkup } from "./office";
import { MANDATES, type PitchCard } from "./pitch";
import { SCAR_COST } from "./progress";
import { pitViewFromSave, statStrip } from "./stats";
import { money, signedMoney, type DeskSave, type UpgradeId } from "./state";
import type { LiveBook, Mandate, PreparedDay, SeatSpec } from "./sim";

export function bootScreen(existing: DeskSave | null): string {
  const named = existing?.deskName ?? "Paper Hands LLC";
  return `
    <section class="screen boot">
      <div class="tape" aria-hidden="true">CHAI · NBL · BLND · PAPER ONLY · CHAI · NBL · BLND · PAPER ONLY · CHAI · NBL · BLND · PAPER ONLY · </div>
      <div class="wordmark">
        <span class="splat">RED</span>
        <span class="day">DAY</span>
      </div>
      <p class="tag">You don’t trade. You approve who sits.</p>
      <p class="subtag">High-rise voxel floor. You don’t pick the ticker or the side.</p>
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
  return pitchScreen({
    save,
    day,
    phase: "pitch",
    card: {
      spec: day.seats[0]!,
      name: day.seats[0]!.name,
      bias: day.seats[0]!.side === "short" ? "ALWAYS SHORT" : "ALWAYS LONG",
      ticker: day.seats[0]!.ticker,
      side: day.seats[0]!.side,
      sizeBand: day.seats[0]!.sizeBand ?? "full",
      thesis: day.seats[0]!.take,
    },
    forceSeat: day.day <= 1,
    mandate: null,
    seated: [],
    index: 0,
    total: day.seats.length,
  });
}

export function pitchScreen(opts: {
  save: DeskSave;
  day: PreparedDay;
  phase: "pitch" | "gate";
  card: PitchCard | null;
  forceSeat: boolean;
  mandate: Mandate | null;
  seated: SeatSpec[];
  index: number;
  total: number;
}): string {
  const { save, day } = opts;
  if (opts.phase === "gate") {
    const names = opts.seated.map((s) => s.name).join(" · ") || "nobody";
    return `
    <section class="screen brief pitch">
      <header class="topbar">
        <span class="pill">${escapeHtml(save.deskName)}</span>
        <span class="pill alt">DAY ${day.day}</span>
      </header>
      <p class="kicker">DESK RULE</p>
      <p class="beats">You don’t trade. You approve who sits.</p>
      <article class="headline-card">
        <div class="badge">${escapeHtml(names.toUpperCase())}</div>
        <h2>${opts.seated.length ? "One optional rule. Break it and we roast you." : "Empty chairs. Open anyway — idle roast incoming."}</h2>
      </article>
      <div class="mandate-row">
        ${MANDATES.map(
          (m) =>
            `<button class="chip-btn ${opts.mandate === m.id ? "on" : ""}" data-act="mandate" data-mandate="${m.id}">${m.label}</button>`,
        ).join("")}
      </div>
      <button class="btn tiny" data-act="mandate" data-mandate="">skip rule</button>
      <button class="btn primary" data-act="floor">OPEN THE FLOOR</button>
      <p class="fine">${opts.seated.length ? `~${Math.round(day.floorMs / 1000)}s floor. Side is theirs.` : "No seats. No tape. Still a day."}</p>
    </section>`;
  }

  const card = opts.card!;
  const side = card.side === "short" ? "SHORT" : "LONG";
  const portrait = card.spec.id === "jules" ? julesSvg("smug") : mayaSvg("hyped");
  return `
    <section class="screen brief pitch">
      <header class="topbar">
        <span class="pill">${escapeHtml(save.deskName)}</span>
        <span class="pill alt">DAY ${day.day} · ${opts.index + 1}/${Math.max(1, opts.total)}</span>
      </header>
      <p class="kicker">WHO SITS</p>
      <p class="beats">You don’t trade. You approve who sits.</p>
      <article class="headline-card">
        <div class="badge ${card.side === "short" ? "short" : ""}">${escapeHtml(card.ticker)} · ${side}</div>
        <p class="who">${escapeHtml(card.bias)} · ${escapeHtml(card.sizeBand.toUpperCase())} SIZE</p>
        <h2>${escapeHtml(card.spec.headline)}</h2>
      </article>
      <div class="maya-row compact">
        <div class="portrait sm">${portrait}</div>
        <div class="bubble">
          <p class="who">${escapeHtml(card.name.toUpperCase())} · ${side} ${escapeHtml(card.ticker)}</p>
          <p>${escapeHtml(card.thesis)}</p>
        </div>
      </div>
      <p class="beats">Their book. You cannot flip the side.</p>
      <div class="pitch-actions">
        <button class="btn gold" data-act="cut">CUT SIZE</button>
        <button class="btn primary" data-act="seat">SEAT</button>
      </div>
      ${
        opts.forceSeat
          ? `<p class="fine">Day 1: seat someone. Reject is locked.</p>`
          : `<button class="btn ghost" data-act="reject">REJECT</button>`
      }
    </section>
  `;
}

export function floorScreen(save: DeskSave, day: PreparedDay): string {
  const floorTickers = [...new Set(day.seats.map((s) => s.ticker))].join(" · ");
  const view = pitViewFromSave(save);
  return `
    <section class="screen floor">
      ${officeMarkup({
        seats: day.seats.map((s) => ({ id: s.id, name: s.name })),
        ticker: floorTickers,
        compliance: save.upgradeCompliance || save.accountantHired,
        floorMs: day.floorMs,
      })}
      <div class="floor-dock">
        ${statStrip(view, { tone: "floor" })}
        <div class="pos" id="pos">MAYA LONG · ${money(day.seats[0] ? save.cash * day.seats[0].size : 0)} · ${escapeHtml(day.seats[0]?.ticker ?? day.ticker)}</div>
        <div class="actions">
          <button class="btn gold" data-act="ride" id="btn-ride">LET THEM RIDE</button>
          <button class="btn danger" data-act="yank" id="btn-yank">YANK</button>
        </div>
        <button class="btn panic" data-act="panic" id="btn-panic">PANIC · YANK ALL</button>
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
        <span>DAY ${opts.day.day} · FLOOR</span>
        </div>
        <p class="roast-pnl">${signedMoney(opts.pnl)}</p>
        <h2 class="stamp">${escapeHtml(opts.roast.stamp)}</h2>
        <p class="roast-body">${escapeHtml(opts.roast.body)}</p>
        <p class="lesson"><strong>LESSON</strong> ${escapeHtml(opts.roast.lesson)}</p>
        <p class="tags">${escapeHtml(tags || (opts.yanked ? "YANKED" : "HELD"))}</p>
        <p class="card-disc">${DISCLAIMER}</p>
      </article>
      <button class="btn fake" data-act="ad" disabled title="Placeholder. No ads in v0.">Coming · Watch to replay</button>
      <p class="fake-note">Ad placeholder · not hooked up · never real money</p>
      <button class="btn primary" data-act="desk">BACK TO THE DESK</button>
    </section>
  `;
}

export function deskScreen(
  save: DeskSave,
  lastPnl: number | null,
  justUnlocked: boolean,
  justPlaced: UpgradeId | null = null,
): string {
  const shop = save.hasUpgrades;
  const seat2 = save.hasSeat2;
  const c = save.upgradeCompliance || save.accountantHired;
  const e = save.upgradeEspresso;
  const r = save.upgradeResearch;
  const view = pitViewFromSave(save);
  const broke = shop && save.scars < SCAR_COST;
  const kit = (id: "compliance" | "espresso" | "research", title: string, blurb: string, placed: boolean) => `
    <article class="kit-card ${shop ? "" : "locked"}">
      <div>
        <h3>${title}</h3>
        <p>${!shop ? "Opens Day 3, or after your first real red day. Spend Scars." : placed ? blurb : `One item, whole floor. Costs ${SCAR_COST} Scars.`}</p>
      </div>
      ${
        !shop
          ? `<span class="chip">LOCKED</span>`
          : placed
            ? `<span class="chip">PLACED</span>`
            : broke
              ? `<span class="chip">NEED ${SCAR_COST} SCARS</span>`
              : `<button class="btn gold sm" data-act="upgrade" data-upgrade="${id}">PLACE · ${SCAR_COST} SCARS</button>`
      }
    </article>`;
  return `
    <section class="screen desk">
      <header class="topbar">
        <span class="pill">${escapeHtml(save.deskName)}</span>
        <span class="pill scar">SCARS ${save.scars}</span>
        <span class="pill alt">DAY ${Math.max(1, save.day - 1)} DONE</span>
      </header>
      <div class="cash-hero">
        <p class="clock-label">PAPER CASH</p>
        <p class="cash">${money(save.cash)}</p>
        ${lastPnl == null ? "" : `<p class="last ${lastPnl < 0 ? "down" : "up"}">last print ${signedMoney(lastPnl)}</p>`}
      </div>
      ${justUnlocked ? `<p class="unlock-banner">Jules took seat 2. Shop is open. Starter Scars: 2. Each upgrade hits EVERYONE.</p>` : ""}
      ${statStrip(view, { tone: "desk", flash: justPlaced })}
      <p class="kicker kit-kicker">FLOOR KIT</p>
      ${kit("compliance", "Compliance posters", `${view.sizeText} size · drip on. Whole floor.`, c)}
      ${kit("espresso", "Espresso machine", `${view.speedText} day · ${view.speedHint}.`, e)}
      ${kit("research", "Research glass", `Inquiry ${view.inquiryText}. Tell before a blowup.`, r)}
      <div class="roster compact">
        <article class="hire-card">
          ${mayaSvg("smug")}
          <div>
            <h3>Maya</h3>
            <p>Always long. Oversized. FOMO.</p>
            <span class="chip hot">SEAT 1 · LONG</span>
          </div>
        </article>
        <article class="hire-card ${seat2 ? "" : "locked"}">
          ${seat2 ? julesSvg("smug") : lockSvg()}
          <div>
            <h3>Jules</h3>
            ${
              seat2
                ? `<p>Shorts strength. Fades green.</p><span class="chip teal">SEAT 2 · SHORT</span>`
                : `<p>Opens Day 3, or after your first real red day.</p><span class="chip">LOCKED</span>`
            }
          </div>
        </article>
      </div>
      <button class="btn primary" data-act="nextday">NEXT OPEN — WHO SITS</button>
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
