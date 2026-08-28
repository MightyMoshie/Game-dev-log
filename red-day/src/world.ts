import type { SeatId } from "./quotes";

const INK = "#140c08";
const PAPER = "#f4e4c1";
const PAPER2 = "#ead4a8";
const FOAM = "#fff6e8";
const GOLD = "#f0b429";
const RED = "#e31c3d";
const GREEN = "#1f8a4c";
const NAVY = "#1b2744";

function iso(col: number, row: number, ox = 180, oy = 236, tw = 62, th = 31): { x: number; y: number } {
  return {
    x: ox + (col - row) * (tw / 2),
    y: oy + (col + row) * (th / 2),
  };
}

function diamond(cx: number, cy: number, w: number, h: number, fill: string, sw = 3): string {
  return `<path d="M${cx} ${cy - h / 2} L${cx + w / 2} ${cy} L${cx} ${cy + h / 2} L${cx - w / 2} ${cy} Z" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

function isoBox(
  cx: number,
  cy: number,
  w: number,
  d: number,
  h: number,
  top: string,
  left: string,
  right: string,
): string {
  const hx = w / 2;
  const hy = d / 2;
  const leftP = `M${cx - hx} ${cy} L${cx} ${cy + hy} L${cx} ${cy + hy + h} L${cx - hx} ${cy + h} Z`;
  const rightP = `M${cx + hx} ${cy} L${cx} ${cy + hy} L${cx} ${cy + hy + h} L${cx + hx} ${cy + h} Z`;
  const topP = `M${cx} ${cy - hy} L${cx + hx} ${cy} L${cx} ${cy + hy} L${cx - hx} ${cy} Z`;
  return `<path d="${leftP}" fill="${left}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="${rightP}" fill="${right}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="${topP}" fill="${top}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
}

function floorTiles(): string {
  const bits: string[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 7; col++) {
      const p = iso(col, row);
      if (p.x < -10 || p.x > 370 || p.y > 650) continue;
      const fill = (col + row) % 2 === 0 ? PAPER : PAPER2;
      bits.push(diamond(p.x, p.y, 62, 31, fill, 3));
    }
  }
  return bits.join("\n");
}

function plant(cx: number, cy: number): string {
  return `<g class="deco-plant">
    ${isoBox(cx, cy + 18, 28, 16, 18, "#8a6a3e", "#6a4e2c", "#c4a574")}
    <circle cx="${cx - 10}" cy="${cy - 8}" r="16" fill="${GREEN}" stroke="${INK}" stroke-width="4"/>
    <circle cx="${cx + 12}" cy="${cy - 4}" r="14" fill="#2d9a58" stroke="${INK}" stroke-width="4"/>
    <circle cx="${cx + 2}" cy="${cy - 22}" r="13" fill="#176b38" stroke="${INK}" stroke-width="4"/>
  </g>`;
}

function clock(cx: number, cy: number): string {
  return `<g class="deco-clock">
    <circle cx="${cx}" cy="${cy}" r="28" fill="${FOAM}" stroke="${INK}" stroke-width="5"/>
    <circle cx="${cx}" cy="${cy}" r="22" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
    <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 14}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${cx + 10}" y2="${cy + 4}" stroke="${RED}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="3.5" fill="${INK}"/>
  </g>`;
}

function actor(who: SeatId, tx: number, ty: number, scale: number): string {
  const hoodie = who === "maya" ? "#ff3d7a" : "#1f8a7a";
  const hoodieDark = who === "maya" ? "#c2185b" : "#146056";
  const deskTop = who === "maya" ? "#c4a574" : "#b08968";
  const name = who === "maya" ? "MAYA" : "JULES";
  const tag = who === "maya" ? "LFG" : "TBD";
  const hair =
    who === "maya"
      ? `<path d="M-38 -8 Q0 -48 38 -8 Q28 -40 0 -36 Q-28 -40 -38 -8" fill="#2a1a12" stroke="${INK}" stroke-width="5"/>
         <ellipse cx="-22" cy="-18" rx="16" ry="12" fill="#2a1a12"/>
         <ellipse cx="22" cy="-18" rx="16" ry="12" fill="#2a1a12"/>
         <circle cx="18" cy="-42" r="14" fill="${GOLD}" stroke="${INK}" stroke-width="4"/>
         <circle cx="18" cy="-42" r="5" fill="${RED}"/>`
      : `<path d="M-32 -6 Q0 -40 32 -6 Q22 -28 0 -24 Q-22 -28 -32 -6" fill="#1a1410" stroke="${INK}" stroke-width="5"/>
         <rect x="-28" y="-4" width="56" height="10" rx="5" fill="none" stroke="${INK}" stroke-width="4"/>
         <line x1="0" y1="-4" x2="0" y2="8" stroke="${INK}" stroke-width="4"/>`;

  return `<g class="actor-slot" transform="translate(${tx} ${ty}) scale(${scale})">
    <g id="actor-${who}" class="actor swim" data-seat="${who}">
    <ellipse cx="0" cy="118" rx="78" ry="16" fill="rgba(20,12,8,0.22)"/>
    ${isoBox(-6, 78, 120, 64, 34, deskTop, "#6a4e2c", "#8a6a3e")}
    ${isoBox(-4, 92, 48, 28, 42, hoodie, hoodieDark, hoodie)}
    <circle cx="10" cy="0" r="48" fill="#f3c7a1" stroke="${INK}" stroke-width="7"/>
    ${hair}
    <circle cx="-8" cy="6" r="6" fill="${INK}"/>
    <circle cx="12" cy="6" r="6" fill="${INK}"/>
    <circle cx="-6" cy="4" r="2" fill="#fff"/>
    <circle cx="14" cy="4" r="2" fill="#fff"/>
    <path d="M-6 22 Q10 36 24 20" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <text x="8" y="78" text-anchor="middle" font-family="Bangers, cursive" font-size="18" fill="${FOAM}" stroke="${INK}" stroke-width="4" paint-order="stroke">${tag}</text>
    <g class="rod">
      <path d="M38 28 C 72 -50, 96 -170, 84 -300" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
      <path d="M38 28 C 72 -50, 96 -170, 84 -300" fill="none" stroke="${GOLD}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="38" cy="28" r="10" fill="${RED}" stroke="${INK}" stroke-width="4"/>
      <circle id="rod-${who}" class="rod-tip" cx="84" cy="-300" r="8" fill="${RED}" stroke="${INK}" stroke-width="3"/>
    </g>
    <g class="nameplate">
      ${diamond(0, 132, 88, 28, GOLD, 4)}
      <text x="0" y="138" text-anchor="middle" font-family="Bangers, cursive" font-size="20" fill="${INK}">${name}</text>
    </g>
    <text id="pnl-${who}" class="seat-pnl-svg" x="0" y="158" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" font-weight="800" fill="${INK}">$0</text>
  </g>
  </g>`;
}

function accountantNook(): string {
  return `<g id="actor-accountant" class="acc">
    ${isoBox(48, 390, 44, 28, 40, NAVY, "#12182c", "#2c3e6b")}
    <circle cx="48" cy="348" r="20" fill="#e8c4a0" stroke="${INK}" stroke-width="4"/>
    <rect x="32" y="344" width="32" height="7" rx="3" fill="none" stroke="${INK}" stroke-width="3"/>
    ${isoBox(78, 404, 26, 16, 22, FOAM, "#cfc3a8", PAPER)}
    <text x="48" y="430" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="800" fill="${INK}">HR</text>
    <text id="hr-line" x="48" y="446" text-anchor="middle" font-family="Nunito,sans-serif" font-size="8" font-weight="800" fill="${INK}"></text>
  </g>`;
}

/** Full 9:16 isometric office. The ROOM is the screen. */
export function officeWorldSvg(opts: {
  duo: boolean;
  accountant: boolean;
  ticker: string;
}): string {
  const maya = opts.duo ? actor("maya", 118, 430, 1.12) : actor("maya", 178, 400, 1.32);
  const jules = opts.duo ? actor("jules", 252, 392, 0.98) : "";
  return `<svg class="room-svg" id="room-svg" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5a3824"/>
        <stop offset="1" stop-color="#2a1a12"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="360" height="640" fill="#2a1a12"/>
    <path d="M0 0 L360 0 L360 228 L0 268 Z" fill="url(#wallGrad)"/>
    <path d="M0 268 L0 640 L70 520 L70 228 Z" fill="#3d2918" stroke="${INK}" stroke-width="4"/>
    <path d="M360 228 L360 640 L290 520 L290 210 Z" fill="#24140e" stroke="${INK}" stroke-width="4"/>
    ${floorTiles()}
    <path d="M18 210 L342 178 L342 28 L18 52 Z" fill="#4a2e1c" stroke="${INK}" stroke-width="5"/>
    <text x="180" y="24" text-anchor="middle" font-family="Bangers, cursive" font-size="22" fill="${GOLD}" stroke="${INK}" stroke-width="5" paint-order="stroke">PAPER HANDS LLC</text>
    ${clock(318, 92)}
    ${plant(42, 168)}
    ${plant(318, 188)}
    <g id="tank-frame">
      <path d="M78 36 L286 28 L298 44 L90 54 Z" fill="${GOLD}" stroke="${INK}" stroke-width="4"/>
      <path d="M286 28 L298 44 L298 138 L286 122 Z" fill="#b8860b" stroke="${INK}" stroke-width="4"/>
      <rect id="tank-glass" x="90" y="52" width="196" height="86" rx="6" fill="#163a44" stroke="${INK}" stroke-width="5"/>
      <path d="M96 58 H280" stroke="#7ec8c8" stroke-width="3" opacity="0.55"/>
      <circle cx="118" cy="118" r="4" fill="#7ec8c8" opacity="0.7"/>
      <circle cx="138" cy="108" r="3" fill="#7ec8c8" opacity="0.55"/>
      <circle cx="252" cy="122" r="3.5" fill="#7ec8c8" opacity="0.6"/>
      <text x="188" y="46" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" font-weight="900" fill="${GOLD}">TAPE TANK · ${opts.ticker}</text>
      <g id="splash" class="splash">
        <ellipse cx="188" cy="90" rx="28" ry="10" fill="${FOAM}" opacity="0"/>
      </g>
    </g>
    ${isoBox(300, 560, 40, 24, 48, "#8a6a3e", "#5a4024", "#c4a574")}
    ${opts.accountant ? accountantNook() : ""}
    ${jules}
    ${maya}
  </svg>`;
}
