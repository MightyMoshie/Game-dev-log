import type { Mood } from "./quotes";
import type { SeatId } from "./quotes";

export type Pose = "swim" | "lean" | "reeled";

export function mayaSvg(mood: Mood = "smug"): string {
  return portrait("maya", mood);
}

export function julesSvg(mood: Mood = "smug"): string {
  return portrait("jules", mood);
}

export function accountantSvg(mood: Mood = "dry"): string {
  void mood;
  return `<svg class="char-svg" viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="110" cy="248" rx="70" ry="10" fill="rgba(20,12,8,0.18)"/>
    <path d="M50 250 L58 150 Q110 136 162 150 L170 250 Z" fill="#2c3e6b" stroke="#140c08" stroke-width="6"/>
    <rect x="100" y="150" width="18" height="86" fill="#e31c3d" stroke="#140c08" stroke-width="4"/>
    <circle cx="110" cy="108" r="50" fill="#e8c4a0" stroke="#140c08" stroke-width="6"/>
    <path d="M64 96 Q110 70 156 96 L156 78 Q110 52 64 78 Z" fill="#3d3a36" stroke="#140c08" stroke-width="4"/>
    <rect x="68" y="96" width="84" height="14" rx="7" fill="none" stroke="#140c08" stroke-width="5"/>
    <line x1="110" y1="96" x2="110" y2="110" stroke="#140c08" stroke-width="4"/>
    <circle cx="90" cy="102" r="6" fill="#140c08"/>
    <circle cx="126" cy="102" r="6" fill="#140c08"/>
    <path d="M96 128 L124 128" stroke="#140c08" stroke-width="5" stroke-linecap="round"/>
    <rect x="148" y="168" width="50" height="62" rx="6" fill="#fff6e8" stroke="#140c08" stroke-width="4"/>
    <path d="M158 186 H188 M158 198 H188 M158 210 H176" stroke="#140c08" stroke-width="3"/>
    <text x="173" y="178" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="800">CAP</text>
  </svg>`;
}

export function lockSvg(): string {
  return `<svg class="char-svg dim" viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="110" cy="248" rx="70" ry="10" fill="rgba(20,12,8,0.18)"/>
    <rect x="58" y="118" width="104" height="90" rx="14" fill="#cfc3a8" stroke="#140c08" stroke-width="6"/>
    <path d="M78 118 V90 a32 32 0 0 1 64 0 v28" fill="none" stroke="#140c08" stroke-width="10" stroke-linecap="round"/>
    <circle cx="110" cy="158" r="10" fill="#140c08"/>
    <rect x="106" y="158" width="8" height="22" rx="2" fill="#140c08"/>
  </svg>`;
}

function portrait(who: SeatId, mood: Mood): string {
  const hoodie = who === "maya" ? "#ff3d7a" : "#1f8a7a";
  const hoodieDark = who === "maya" ? "#c2185b" : "#146056";
  const label = who === "maya" ? "LFG" : "TBD";
  const hair = who === "maya"
    ? `<path d="M52 118 Q48 38 110 28 Q174 38 168 118 Q156 48 110 42 Q66 50 52 118" fill="#2a1a12" stroke="#140c08" stroke-width="5"/>
       <ellipse cx="78" cy="70" rx="22" ry="16" fill="#2a1a12"/>
       <ellipse cx="142" cy="70" rx="22" ry="16" fill="#2a1a12"/>
       <circle cx="124" cy="30" r="18" fill="#ffd166" stroke="#140c08" stroke-width="5"/>
       <circle cx="124" cy="30" r="6" fill="#e31c3d"/>`
    : `<path d="M58 100 Q62 42 110 38 Q158 42 162 100 Q150 58 110 54 Q72 58 58 100" fill="#1a1410" stroke="#140c08" stroke-width="5"/>
       <rect x="68" y="96" width="84" height="12" rx="6" fill="none" stroke="#140c08" stroke-width="5"/>
       <line x1="110" y1="96" x2="110" y2="108" stroke="#140c08" stroke-width="4"/>`;
  const extra = who === "maya"
    ? `<circle cx="36" cy="122" r="8" fill="#fff6e8" stroke="#140c08" stroke-width="4"/>
       <circle cx="184" cy="122" r="8" fill="#fff6e8" stroke="#140c08" stroke-width="4"/>`
    : "";
  return `<svg class="char-svg" viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="110" cy="248" rx="72" ry="10" fill="rgba(20,12,8,0.18)"/>
    <path d="M44 252 L54 148 Q110 122 166 148 L176 252 Z" fill="${hoodie}" stroke="#140c08" stroke-width="6"/>
    <path d="M70 168 Q110 158 150 168 L148 252 L72 252 Z" fill="${hoodieDark}" stroke="#140c08" stroke-width="5"/>
    <text x="110" y="214" text-anchor="middle" font-family="Bangers, cursive" font-size="26" fill="#fff6e8" stroke="#140c08" stroke-width="5" paint-order="stroke">${label}</text>
    <circle cx="110" cy="112" r="56" fill="#f3c7a1" stroke="#140c08" stroke-width="6"/>
    ${hair}
    ${face(mood)}
    ${extra}
  </svg>`;
}

function face(mood: Mood): string {
  const brow =
    mood === "mad"
      ? `<path d="M68 86 L94 76" stroke="#140c08" stroke-width="6" stroke-linecap="round"/>
         <path d="M116 76 L144 86" stroke="#140c08" stroke-width="6" stroke-linecap="round"/>`
      : mood === "sweat" || mood === "dry"
        ? `<path d="M70 84 L96 88" stroke="#140c08" stroke-width="6" stroke-linecap="round"/>
           <path d="M114 88 L142 84" stroke="#140c08" stroke-width="6" stroke-linecap="round"/>`
        : `<path d="M68 86 Q88 74 100 86" stroke="#140c08" stroke-width="6" fill="none" stroke-linecap="round"/>
           <path d="M110 86 Q124 74 144 86" stroke="#140c08" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  const mouth =
    mood === "mad"
      ? `<path d="M90 136 Q106 124 122 136" stroke="#140c08" stroke-width="6" fill="none" stroke-linecap="round"/>`
      : mood === "sweat" || mood === "dry"
        ? `<ellipse cx="106" cy="136" rx="16" ry="10" fill="#f3c7a1" stroke="#140c08" stroke-width="5"/>`
        : `<path d="M88 128 Q106 152 126 128" stroke="#140c08" stroke-width="6" fill="#140c08"/>
           <path d="M96 132 Q106 144 116 132" fill="#ff5b7a"/>`;
  const sweat = mood === "sweat"
    ? `<path d="M164 92 q10 16 0 26" fill="#7ec8ff" stroke="#140c08" stroke-width="3"/>`
    : "";
  return `${brow}
    <circle cx="86" cy="108" r="9" fill="#140c08"/>
    <circle cx="124" cy="108" r="9" fill="#140c08"/>
    <circle cx="88" cy="105" r="3" fill="#fff"/>
    <circle cx="126" cy="105" r="3" fill="#fff"/>
    ${mouth}${sweat}`;
}

export function isoSeatSvg(who: SeatId, pose: Pose, selected: boolean): string {
  const hoodie = who === "maya" ? "#ff3d7a" : "#1f8a7a";
  const desk = who === "maya" ? "#c4a574" : "#b08968";
  const label = who === "maya" ? "MAYA" : "JULES";
  const lean = pose === "lean" ? "translate(10,-8)" : pose === "reeled" ? "translate(-6,10) rotate(-12 120 110)" : "";
  const rodEnd = pose === "reeled" ? "M168 92 L186 78" : pose === "lean" ? "M176 78 L210 28" : "M172 82 L206 36";
  return `<svg class="iso-seat-svg" viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="120" cy="186" rx="78" ry="12" fill="rgba(20,12,8,0.18)"/>
    <path d="M28 150 L120 108 L212 150 L120 192 Z" fill="#ead4a8" stroke="#140c08" stroke-width="5"/>
    <path d="M28 150 L120 108 L120 128 L28 170 Z" fill="#d9c396" stroke="#140c08" stroke-width="4"/>
    <g transform="${lean}">
      <path d="M62 128 L150 92 L198 118 L110 154 Z" fill="${desk}" stroke="#140c08" stroke-width="5"/>
      <path d="M110 154 L198 118 L198 142 L110 178 Z" fill="#8a6a3e" stroke="#140c08" stroke-width="4"/>
      <path d="M96 86 L124 74 L148 88 L120 100 Z" fill="#fff6e8" stroke="#140c08" stroke-width="4"/>
      <rect x="108" y="78" width="18" height="14" fill="#1b2744" stroke="#140c08" stroke-width="3"/>
      <circle cx="118" cy="70" r="22" fill="#f3c7a1" stroke="#140c08" stroke-width="5"/>
      ${who === "maya"
        ? `<path d="M96 68 Q118 46 142 66" fill="#2a1a12" stroke="#140c08" stroke-width="4"/>
           <circle cx="132" cy="48" r="8" fill="#ffd166" stroke="#140c08" stroke-width="3"/>`
        : `<path d="M100 62 Q118 48 138 62" fill="#1a1410" stroke="#140c08" stroke-width="4"/>
           <rect x="104" y="66" width="28" height="6" rx="3" fill="none" stroke="#140c08" stroke-width="3"/>`}
      <circle cx="112" cy="70" r="3.5" fill="#140c08"/>
      <circle cx="126" cy="70" r="3.5" fill="#140c08"/>
      <path d="M108 92 Q118 78 132 96" fill="${hoodie}" stroke="#140c08" stroke-width="5"/>
      <path d="${rodEnd}" stroke="#140c08" stroke-width="5" stroke-linecap="round"/>
      <circle class="rod-tip-mark" cx="${pose === "reeled" ? 186 : 206}" cy="${pose === "reeled" ? 78 : pose === "lean" ? 28 : 36}" r="4" fill="#e31c3d" stroke="#140c08" stroke-width="2"/>
    </g>
    <rect x="78" y="8" width="84" height="22" rx="8" fill="${selected ? "#f0b429" : "#fff6e8"}" stroke="#140c08" stroke-width="3"/>
    <text x="120" y="24" text-anchor="middle" font-family="Bangers,cursive" font-size="16" fill="#140c08">${label}</text>
  </svg>`;
}

export function isoAccountantSvg(): string {
  return `<svg class="iso-seat-svg acc" viewBox="0 0 180 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20 100 L90 70 L160 100 L90 130 Z" fill="#d9c396" stroke="#140c08" stroke-width="4"/>
    <path d="M70 86 L110 70 L128 80 L88 96 Z" fill="#2c3e6b" stroke="#140c08" stroke-width="4"/>
    <circle cx="92" cy="58" r="16" fill="#e8c4a0" stroke="#140c08" stroke-width="4"/>
    <rect x="78" y="54" width="28" height="5" rx="2" fill="none" stroke="#140c08" stroke-width="3"/>
    <rect x="118" y="78" width="28" height="34" rx="4" fill="#fff6e8" stroke="#140c08" stroke-width="3"/>
    <text x="90" y="24" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="800">HR</text>
  </svg>`;
}
