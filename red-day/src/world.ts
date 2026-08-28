import type { SeatId } from "./quotes";

const INK = "#140c08";
const PAPER = "#f4e4c1";
const PAPER2 = "#ead4a8";
const FOAM = "#fff6e8";
const GOLD = "#f0b429";
const RED = "#e31c3d";
const GREEN = "#1f8a4c";
const NAVY = "#1b2744";

function diamond(cx: number, cy: number, w: number, h: number, fill: string, sw = 4): string {
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
  sw = 4,
): string {
  const hx = w / 2;
  const hy = d / 2;
  const leftP = `M${cx - hx} ${cy} L${cx} ${cy + hy} L${cx} ${cy + hy + h} L${cx - hx} ${cy + h} Z`;
  const rightP = `M${cx + hx} ${cy} L${cx} ${cy + hy} L${cx} ${cy + hy + h} L${cx + hx} ${cy + h} Z`;
  const topP = `M${cx} ${cy - hy} L${cx + hx} ${cy} L${cx} ${cy + hy} L${cx - hx} ${cy} Z`;
  return `<path d="${leftP}" fill="${left}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>
    <path d="${rightP}" fill="${right}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>
    <path d="${topP}" fill="${top}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

/** Chunky diamonds clipped to the floor trapezoid so the ROOM fills 9:16. */
function floorTiles(): string {
  const bits: string[] = [];
  const tw = 96;
  const th = 48;
  const ox = 180;
  const oy = 208;
  for (let row = 0; row < 20; row++) {
    for (let col = -3; col < 16; col++) {
      const x = ox + (col - row) * (tw / 2);
      const y = oy + (col + row) * (th / 2);
      if (y < oy - 24 || y > 700) continue;
      if (x < -80 || x > 440) continue;
      const fill = (col + row) % 2 === 0 ? PAPER : PAPER2;
      bits.push(diamond(x, y, tw, th, fill, 4));
    }
  }
  return bits.join("\n");
}

function plant(cx: number, cy: number, scale = 1): string {
  return `<g class="deco-plant" transform="translate(${cx} ${cy}) scale(${scale})">
    ${isoBox(0, 22, 36, 22, 22, "#8a6a3e", "#5a4024", "#c4a574")}
    <circle cx="-12" cy="-10" r="20" fill="${GREEN}" stroke="${INK}" stroke-width="5"/>
    <circle cx="14" cy="-4" r="17" fill="#2d9a58" stroke="${INK}" stroke-width="5"/>
    <circle cx="2" cy="-28" r="16" fill="#176b38" stroke="${INK}" stroke-width="5"/>
  </g>`;
}

function clock(cx: number, cy: number): string {
  return `<g class="deco-clock">
    <circle cx="${cx}" cy="${cy}" r="32" fill="${FOAM}" stroke="${INK}" stroke-width="6"/>
    <circle cx="${cx}" cy="${cy}" r="24" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>
    <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 16}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${cx + 12}" y2="${cy + 5}" stroke="${RED}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="${INK}"/>
  </g>`;
}

function windowPanes(cx: number, cy: number): string {
  return `<g class="deco-window">
    <path d="M${cx - 38} ${cy - 28} L${cx + 42} ${cy - 34} L${cx + 46} ${cy + 28} L${cx - 34} ${cy + 34} Z" fill="#7ec8e8" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M${cx - 38} ${cy - 28} L${cx + 42} ${cy - 34} L${cx + 46} ${cy + 28} L${cx - 34} ${cy + 34} Z" fill="none" stroke="${INK}" stroke-width="4"/>
    <line x1="${cx - 2}" y1="${cy - 31}" x2="${cx + 6}" y2="${cy + 31}" stroke="${INK}" stroke-width="4"/>
    <line x1="${cx - 36}" y1="${cy + 2}" x2="${cx + 44}" y2="${cy - 4}" stroke="${INK}" stroke-width="4"/>
    <path d="M${cx - 28} ${cy - 18} L${cx - 8} ${cy - 22} L${cx - 4} ${cy - 6} L${cx - 24} ${cy - 2} Z" fill="${FOAM}" opacity="0.45"/>
  </g>`;
}

function waterCooler(cx: number, cy: number): string {
  return `<g class="deco-cooler">
    ${isoBox(cx, cy, 34, 22, 52, NAVY, "#12182c", "#2c3e6b")}
    <ellipse cx="${cx}" cy="${cy - 18}" rx="16" ry="12" fill="#7ec8e8" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="${cx}" cy="${cy - 22}" rx="10" ry="7" fill="#c8f0f8" stroke="${INK}" stroke-width="3"/>
    <rect x="${cx - 6}" y="${cy + 8}" width="10" height="14" rx="3" fill="${GOLD}" stroke="${INK}" stroke-width="3"/>
  </g>`;
}

function filingCabinet(cx: number, cy: number): string {
  return `<g class="deco-files">
    ${isoBox(cx, cy, 48, 30, 64, "#c4a574", "#6a4e2c", "#8a6a3e")}
    <path d="M${cx - 16} ${cy + 8} L${cx + 4} ${cy + 18} L${cx + 4} ${cy + 28} L${cx - 16} ${cy + 18} Z" fill="${PAPER2}" stroke="${INK}" stroke-width="3"/>
    <path d="M${cx - 16} ${cy + 32} L${cx + 4} ${cy + 42} L${cx + 4} ${cy + 52} L${cx - 16} ${cy + 42} Z" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
    <circle cx="${cx - 6}" cy="${cy + 18}" r="3" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>
    <circle cx="${cx - 6}" cy="${cy + 42}" r="3" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>
  </g>`;
}

function actor(who: SeatId, tx: number, ty: number, scale: number): string {
  const hoodie = who === "maya" ? "#ff3d7a" : "#1f8a7a";
  const hoodieDark = who === "maya" ? "#c2185b" : "#146056";
  const deskTop = who === "maya" ? "#d4b896" : "#c4a574";
  const name = who === "maya" ? "MAYA" : "JULES";
  const tag = who === "maya" ? "LFG" : "TBD";
  const hair =
    who === "maya"
      ? `<path d="M-42 -6 Q0 -54 42 -6 Q30 -44 0 -40 Q-30 -44 -42 -6" fill="#2a1a12" stroke="${INK}" stroke-width="6"/>
         <ellipse cx="-24" cy="-16" rx="18" ry="14" fill="#2a1a12"/>
         <ellipse cx="24" cy="-16" rx="18" ry="14" fill="#2a1a12"/>
         <circle cx="20" cy="-46" r="16" fill="${GOLD}" stroke="${INK}" stroke-width="5"/>
         <circle cx="20" cy="-46" r="6" fill="${RED}"/>`
      : `<path d="M-34 -4 Q0 -44 34 -4 Q24 -30 0 -26 Q-24 -30 -34 -4" fill="#1a1410" stroke="${INK}" stroke-width="6"/>
         <rect x="-30" y="-2" width="60" height="12" rx="6" fill="none" stroke="${INK}" stroke-width="5"/>
         <line x1="0" y1="-2" x2="0" y2="10" stroke="${INK}" stroke-width="5"/>`;

  return `<g class="actor-slot" transform="translate(${tx} ${ty}) scale(${scale})">
    <g id="actor-${who}" class="actor swim" data-seat="${who}">
    <ellipse cx="0" cy="128" rx="86" ry="18" fill="rgba(20,12,8,0.28)"/>
    ${isoBox(-4, 86, 132, 72, 38, deskTop, "#5a4024", "#8a6a3e", 5)}
    ${isoBox(22, 70, 40, 24, 28, NAVY, "#12182c", "#2c3e6b", 4)}
    <rect x="10" y="42" width="28" height="20" rx="3" fill="#163a44" stroke="${INK}" stroke-width="4"/>
    ${isoBox(-8, 100, 54, 32, 46, hoodie, hoodieDark, hoodie, 5)}
    <circle cx="8" cy="4" r="52" fill="#f3c7a1" stroke="${INK}" stroke-width="8"/>
    ${hair}
    <circle cx="-10" cy="10" r="7" fill="${INK}"/>
    <circle cx="14" cy="10" r="7" fill="${INK}"/>
    <circle cx="-8" cy="8" r="2.4" fill="#fff"/>
    <circle cx="16" cy="8" r="2.4" fill="#fff"/>
    <path d="M-8 26 Q10 42 26 24" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <text x="6" y="86" text-anchor="middle" font-family="Bangers, cursive" font-size="20" fill="${FOAM}" stroke="${INK}" stroke-width="5" paint-order="stroke">${tag}</text>
    <g class="rod">
      <path d="M42 32 C 70 -20, 78 -110, 52 -210" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
      <path d="M42 32 C 70 -20, 78 -110, 52 -210" fill="none" stroke="${GOLD}" stroke-width="10" stroke-linecap="round"/>
      <circle cx="42" cy="32" r="12" fill="${RED}" stroke="${INK}" stroke-width="5"/>
      <circle id="rod-${who}" class="rod-tip" cx="52" cy="-210" r="9" fill="${RED}" stroke="${INK}" stroke-width="4"/>
    </g>
    <g class="nameplate">
      ${diamond(0, 142, 96, 30, GOLD, 5)}
      <text x="0" y="148" text-anchor="middle" font-family="Bangers, cursive" font-size="22" fill="${INK}">${name}</text>
    </g>
    <text id="pnl-${who}" class="seat-pnl-svg" x="0" y="168" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="14" font-weight="800" fill="${INK}">$0</text>
  </g>
  </g>`;
}

function accountantNook(): string {
  return `<g id="actor-accountant" class="acc">
    ${isoBox(46, 318, 50, 32, 44, NAVY, "#12182c", "#2c3e6b", 4)}
    <circle cx="46" cy="272" r="22" fill="#e8c4a0" stroke="${INK}" stroke-width="5"/>
    <rect x="28" y="268" width="36" height="8" rx="3" fill="none" stroke="${INK}" stroke-width="4"/>
    ${isoBox(78, 334, 28, 18, 24, FOAM, "#cfc3a8", PAPER, 3)}
    <text x="46" y="368" text-anchor="middle" font-family="Nunito,sans-serif" font-size="12" font-weight="800" fill="${INK}">HR</text>
    <text id="hr-line" x="46" y="384" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" font-weight="800" fill="${INK}"></text>
  </g>`;
}

/** Full 9:16 isometric office. The ROOM is the screen. */
export function officeWorldSvg(opts: {
  duo: boolean;
  accountant: boolean;
  ticker: string;
}): string {
  const maya = opts.duo ? actor("maya", 112, 455, 1.08) : actor("maya", 168, 438, 1.42);
  const jules = opts.duo ? actor("jules", 248, 400, 0.96) : "";
  const floorClip = "M8 214 L352 188 L390 640 L-30 640 Z";
  return `<svg class="room-svg" id="room-svg" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6a4430"/>
        <stop offset="1" stop-color="#3a2418"/>
      </linearGradient>
      <linearGradient id="ceilGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4a3224"/>
        <stop offset="1" stop-color="#2a1a12"/>
      </linearGradient>
      <clipPath id="floorClip"><path d="${floorClip}"/></clipPath>
    </defs>
    <rect x="0" y="0" width="360" height="640" fill="#2a1a12"/>
    <path d="M0 0 L360 0 L360 36 L0 48 Z" fill="url(#ceilGrad)"/>
    <path d="M18 44 L342 28 L352 188 L8 214 Z" fill="url(#wallGrad)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M18 44 L8 214 L0 48 Z" fill="#5a3824"/>
    <path d="M342 28 L360 36 L352 188 Z" fill="#2a1810"/>
    <path d="M0 48 L8 214 L-30 640 L0 640 Z" fill="#3d2918" stroke="${INK}" stroke-width="5"/>
    <path d="M360 36 L352 188 L390 640 L360 640 Z" fill="#24140e" stroke="${INK}" stroke-width="5"/>
    <g clip-path="url(#floorClip)">${floorTiles()}</g>
    <path d="${floorClip}" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M18 168 L342 152 L352 188 L8 214 Z" fill="#5a3a24" stroke="${INK}" stroke-width="4"/>
    <text x="180" y="26" text-anchor="middle" font-family="Bangers, cursive" font-size="24" fill="${GOLD}" stroke="${INK}" stroke-width="6" paint-order="stroke">PAPER HANDS LLC</text>
    ${windowPanes(64, 108)}
    ${clock(318, 96)}
    <g id="tank-frame">
      ${isoBox(180, 78, 214, 28, 18, GOLD, "#b8860b", "#d4a017", 5)}
      <rect id="tank-glass" x="86" y="86" width="188" height="78" rx="8" fill="#163a44" stroke="${INK}" stroke-width="6"/>
      <path d="M92 92 H268" stroke="#7ec8c8" stroke-width="4" opacity="0.5"/>
      <path d="M90 152 H270" fill="none" stroke="#8a6a3e" stroke-width="10" stroke-linecap="round"/>
      <circle cx="112" cy="148" r="5" fill="#7ec8c8" opacity="0.75"/>
      <circle cx="132" cy="140" r="4" fill="#7ec8c8" opacity="0.55"/>
      <circle cx="248" cy="150" r="4.5" fill="#7ec8c8" opacity="0.65"/>
      <text x="180" y="72" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="900" fill="${INK}">TAPE TANK · ${opts.ticker}</text>
      <g id="splash" class="splash">
        <ellipse cx="180" cy="118" rx="30" ry="12" fill="${FOAM}" opacity="0"/>
      </g>
    </g>
    ${plant(28, 236, 1.05)}
    ${plant(332, 250, 0.92)}
    ${waterCooler(48, 520)}
    ${filingCabinet(318, 470)}
    ${opts.accountant ? accountantNook() : ""}
    ${jules}
    ${maya}
  </svg>`;
}
