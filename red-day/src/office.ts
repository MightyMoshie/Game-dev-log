import type { SeatId } from "./quotes";
import type { LiveBook } from "./sim";

export type Pose = "swim" | "lean" | "reeled";

export function officeMarkup(opts: {
  seats: { id: SeatId; name: string }[];
  ticker: string;
  compliance: boolean;
  floorMs?: number;
}): string {
  const duo = opts.seats.length > 1;
  const secs = Math.round((opts.floorMs ?? 28_000) / 1000);
  return `
    <div class="world ${duo ? "duo" : "solo"}" id="office">
      <div class="voxel-host" id="voxel-host"></div>
      <canvas id="jumbo" class="tank-source jumbo-source" width="960" height="480"></canvas>
      <header class="hud">
        <div class="hud-chip"><span class="clock-label">TAPE</span><span class="clock" id="clock">0:${String(secs).padStart(2, "0")}</span></div>
        <div class="hud-chip fat"><span class="ticker" id="ticker">${opts.ticker}</span></div>
        <div class="hud-chip"><span class="clock-label">DESK</span><span class="live-pnl" id="live-pnl">$0</span></div>
      </header>
      <div class="bubble speech-pop" id="bubble">
        <p class="who" id="bubble-who">MAYA</p>
        <p id="maya-line">Don’t you dare hover the yank. I can hear your finger.</p>
      </div>
      ${opts.compliance ? `<p class="hr-chip overlay" id="hr-line"></p>` : ""}
    </div>
  `;
}

export function poseFor(book: LiveBook): Pose {
  if (book.yankedAt != null) return "reeled";
  if (book.rode || book.fomo) return "lean";
  return "swim";
}
