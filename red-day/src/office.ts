import { isoAccountantSvg, isoSeatSvg, type Pose } from "./art";
import type { SeatId } from "./quotes";
import type { LiveBook } from "./sim";

export function officeMarkup(opts: {
  seats: { id: SeatId; name: string }[];
  accountant: boolean;
  ticker: string;
}): string {
  const stacked = opts.seats.length > 1 ? "stacked" : "solo";
  const seats = opts.seats
    .map(
      (seat, i) => `
      <button type="button" class="desk-seat ${i === 0 ? "selected" : ""}" data-act="select" data-seat="${seat.id}" id="seat-${seat.id}">
        ${isoSeatSvg(seat.id, "swim", i === 0)}
        <span class="rod-tip" id="rod-${seat.id}"></span>
        <span class="seat-pnl" id="pnl-${seat.id}">$0</span>
      </button>`,
    )
    .join("");
  return `
    <div class="office ${stacked}" id="office">
      <div class="wall">
        <div class="plant" aria-hidden="true"></div>
        <div class="tank">
          <div class="tank-label">TAPE TANK · ${opts.ticker} · PAPER FISH ONLY</div>
          <canvas id="tape" width="360" height="160"></canvas>
        </div>
        <div class="clock-face" aria-hidden="true">9:31</div>
      </div>
      <svg class="line-layer" id="line-layer" preserveAspectRatio="none">
        ${opts.seats
          .map(
            (seat) =>
              `<path id="line-${seat.id}" class="fish-line ${seat.id}" d="" fill="none" />
               <circle id="bobber-${seat.id}" class="bobber ${seat.id}" r="5" />`,
          )
          .join("")}
      </svg>
      <div class="aisle ${stacked}">
        ${seats}
        ${
          opts.accountant
            ? `<div class="hr-nook" id="hr-nook">${isoAccountantSvg()}<p class="hr-bubble" id="hr-line"></p></div>`
            : ""
        }
      </div>
    </div>
  `;
}

export function poseFor(book: LiveBook): Pose {
  if (book.yankedAt != null) return "reeled";
  if (book.rode || book.fomo) return "lean";
  return "swim";
}

export function paintSeat(root: HTMLElement, book: LiveBook, selected: boolean, pnlText: string, pose: Pose): void {
  const btn = root.querySelector(`#seat-${book.seatId}`);
  if (!btn) return;
  btn.classList.toggle("selected", selected);
  btn.classList.toggle("reeled", pose === "reeled");
  btn.classList.toggle("lean", pose === "lean");
  const pnl = btn.querySelector(".seat-pnl");
  if (pnl) pnl.textContent = pnlText;
  const current = btn.getAttribute("data-pose");
  if (current === pose && btn.getAttribute("data-sel") === String(selected)) return;
  btn.setAttribute("data-pose", pose);
  btn.setAttribute("data-sel", String(selected));
  const tip = btn.querySelector(".rod-tip");
  const pnlEl = btn.querySelector(".seat-pnl");
  btn.innerHTML = isoSeatSvg(book.seatId, pose, selected);
  if (tip) btn.appendChild(tip);
  else {
    const n = document.createElement("span");
    n.className = "rod-tip";
    n.id = `rod-${book.seatId}`;
    btn.appendChild(n);
  }
  if (pnlEl) btn.appendChild(pnlEl);
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
    const tip = root.querySelector(`#rod-${book.seatId}`) as HTMLElement | null;
    const path = root.querySelector(`#line-${book.seatId}`) as SVGPathElement | null;
    const bobber = root.querySelector(`#bobber-${book.seatId}`) as SVGCircleElement | null;
    if (!tip || !path || !bobber) return;
    const t = tip.getBoundingClientRect();
    const x1 = t.left + t.width / 2 - o.left;
    const y1 = t.top + t.height / 2 - o.top;
    const hooked = book.yankedAt == null;
    const x2 = hooked
      ? tank.left - o.left + (hook?.x ?? tank.width * (0.72 + i * 0.08))
      : x1 + 18;
    const y2 = hooked ? tank.top - o.top + (hook?.y ?? tank.height * 0.55) : y1 - 12;
    const slack = hooked ? (book.rode || book.fomo ? 64 : 28) : 6;
    const mx = (x1 + x2) / 2 + (book.seatId === "jules" ? 18 : -10);
    const my = Math.max(y1, y2) + slack;
    path.setAttribute("d", `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`);
    path.classList.toggle("selected", selected === book.seatId);
    path.classList.toggle("slack", Boolean(book.rode || book.fomo) && hooked);
    path.classList.toggle("reeled", !hooked);
    bobber.setAttribute("cx", String(x2));
    bobber.setAttribute("cy", String(y2));
    bobber.classList.toggle("off", !hooked);
  });
}
