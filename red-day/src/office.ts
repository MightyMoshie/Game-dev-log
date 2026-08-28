import type { SeatId } from "./quotes";
import type { LiveBook } from "./sim";
import { officeWorldSvg } from "./world";

export type Pose = "swim" | "lean" | "reeled";

export function officeMarkup(opts: {
  seats: { id: SeatId; name: string }[];
  accountant: boolean;
  ticker: string;
}): string {
  const duo = opts.seats.length > 1;
  const hits = opts.seats
    .map(
      (seat) =>
        `<button type="button" class="hit-seat ${seat.id}" data-act="select" data-seat="${seat.id}" id="hit-${seat.id}" aria-label="Select ${seat.name}"></button>`,
    )
    .join("");
  const lines = opts.seats
    .map(
      (seat) =>
        `<path id="line-${seat.id}" class="fish-line ${seat.id}" d="" fill="none"/>
         <circle id="bobber-${seat.id}" class="bobber ${seat.id}" r="11"/>`,
    )
    .join("");
  return `
    <div class="world ${duo ? "duo" : "solo"}" id="office">
      ${officeWorldSvg({ duo, accountant: opts.accountant, ticker: opts.ticker })}
      <div class="tank-slot" id="tank-slot">
        <canvas id="tape" width="320" height="120"></canvas>
        <div class="tank-shine"></div>
      </div>
      <svg class="line-layer" id="line-layer" preserveAspectRatio="none">${lines}</svg>
      <header class="hud">
        <div class="hud-chip"><span class="clock-label">TAPE</span><span class="clock" id="clock">0:28</span></div>
        <div class="hud-chip fat"><span class="ticker" id="ticker">${opts.ticker}</span></div>
        <div class="hud-chip"><span class="clock-label">DESK</span><span class="live-pnl" id="live-pnl">$0</span></div>
      </header>
      <div class="bubble speech-pop" id="bubble">
        <p class="who" id="bubble-who">MAYA</p>
        <p id="maya-line">Don’t you dare hover the yank. I can hear your finger.</p>
      </div>
      ${hits}
    </div>
  `;
}

export function poseFor(book: LiveBook): Pose {
  if (book.yankedAt != null) return "reeled";
  if (book.rode || book.fomo) return "lean";
  return "swim";
}

export function syncTankSlot(root: HTMLElement): void {
  const world = root.querySelector("#office") as HTMLElement | null;
  const glass = root.querySelector("#tank-glass") as SVGGraphicsElement | null;
  const slot = root.querySelector("#tank-slot") as HTMLElement | null;
  if (!world || !glass || !slot) return;
  const wr = world.getBoundingClientRect();
  const g = glass.getBoundingClientRect();
  slot.style.left = `${g.left - wr.left}px`;
  slot.style.top = `${g.top - wr.top}px`;
  slot.style.width = `${Math.max(8, g.width)}px`;
  slot.style.height = `${Math.max(8, g.height)}px`;
}

export function setActorPose(
  root: HTMLElement,
  book: LiveBook,
  selected: boolean,
  pnlText: string,
  pose: Pose,
  yanking = false,
): void {
  const actor = root.querySelector(`#actor-${book.seatId}`);
  if (actor) {
    actor.classList.toggle("selected", selected);
    actor.classList.toggle("swim", pose === "swim");
    actor.classList.toggle("lean", pose === "lean");
    actor.classList.toggle("reeled", pose === "reeled");
    actor.classList.toggle("yanking", yanking);
  }
  const hit = root.querySelector(`#hit-${book.seatId}`);
  if (hit) hit.classList.toggle("selected", selected);
  const pnl = root.querySelector(`#pnl-${book.seatId}`);
  if (pnl) pnl.textContent = pnlText;
}

export function splash(root: HTMLElement): void {
  const el = root.querySelector("#splash");
  if (!el) return;
  el.classList.remove("go");
  void (el as HTMLElement).getBoundingClientRect();
  el.classList.add("go");
}

export function updateLines(
  root: HTMLElement,
  books: LiveBook[],
  selected: SeatId,
  hook: { x: number; y: number } | null,
): void {
  const office = root.querySelector("#office") as HTMLElement | null;
  const layer = root.querySelector("#line-layer") as SVGSVGElement | null;
  const canvas = root.querySelector("#tape") as HTMLCanvasElement | null;
  if (!office || !layer || !canvas) return;
  const o = office.getBoundingClientRect();
  layer.setAttribute("viewBox", `0 0 ${Math.max(1, o.width)} ${Math.max(1, o.height)}`);
  layer.setAttribute("width", String(o.width));
  layer.setAttribute("height", String(o.height));
  const tank = canvas.getBoundingClientRect();

  books.forEach((book, i) => {
    const tip = root.querySelector(`#rod-${book.seatId}`) as SVGGraphicsElement | null;
    const path = root.querySelector(`#line-${book.seatId}`) as SVGPathElement | null;
    const bobber = root.querySelector(`#bobber-${book.seatId}`) as SVGCircleElement | null;
    if (!tip || !path || !bobber) return;
    const t = tip.getBoundingClientRect();
    const x1 = t.left + t.width / 2 - o.left;
    const y1 = t.top + t.height / 2 - o.top;
    const hooked = book.yankedAt == null;
    const x2 = hooked
      ? tank.left - o.left + (hook?.x ?? tank.width * (0.62 + i * 0.12))
      : x1 + 56;
    const y2 = hooked ? tank.top - o.top + (hook?.y ?? tank.height * 0.55) : y1 + 18;
    const slack = hooked ? (book.rode || book.fomo ? 130 : 28) : 6;
    const mx = (x1 + x2) / 2 + (book.seatId === "jules" ? 22 : -14);
    const my = Math.max(y1, y2) + slack;
    path.setAttribute("d", `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`);
    path.classList.toggle("selected", selected === book.seatId);
    path.classList.toggle("slack", Boolean(book.rode || book.fomo) && hooked);
    path.classList.toggle("reeled", !hooked);
    bobber.setAttribute("cx", String(x2));
    bobber.setAttribute("cy", String(y2));
    bobber.classList.toggle("off", !hooked);
    bobber.classList.toggle("flying", !hooked);
  });
}
