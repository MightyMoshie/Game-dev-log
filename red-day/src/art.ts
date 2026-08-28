import type { MayaMood } from "./copy";

export function mayaSvg(mood: MayaMood): string {
  const brow =
    mood === "mad"
      ? `<path d="M70 78 L92 70" stroke="#140c08" stroke-width="5" stroke-linecap="round"/>
         <path d="M118 70 L140 78" stroke="#140c08" stroke-width="5" stroke-linecap="round"/>`
      : mood === "sweat"
        ? `<path d="M72 76 L94 80" stroke="#140c08" stroke-width="5" stroke-linecap="round"/>
           <path d="M116 80 L138 76" stroke="#140c08" stroke-width="5" stroke-linecap="round"/>`
        : `<path d="M70 80 Q88 72 98 80" stroke="#140c08" stroke-width="5" fill="none" stroke-linecap="round"/>
           <path d="M112 80 Q122 72 140 80" stroke="#140c08" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  const mouth =
    mood === "mad"
      ? `<path d="M92 128 Q105 118 120 128" stroke="#140c08" stroke-width="5" fill="none" stroke-linecap="round"/>`
      : mood === "sweat"
        ? `<path d="M96 124 Q106 136 118 124" stroke="#140c08" stroke-width="5" fill="none"/>`
        : `<path d="M90 122 Q106 142 124 122" stroke="#140c08" stroke-width="5" fill="#140c08"/>
           <path d="M98 126 Q106 136 114 126" fill="#ff5b7a"/>`;
  const sweat =
    mood === "sweat"
      ? `<path d="M156 96 q8 14 0 22" fill="#7ec8ff" stroke="#140c08" stroke-width="3"/>`
      : "";
  const spark =
    mood === "hyped"
      ? `<text x="168" y="72" font-size="22">✨</text>`
      : mood === "smug"
        ? `<text x="166" y="74" font-size="18">💅</text>`
        : "";

  return `<svg class="char-svg" viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="110" cy="248" rx="70" ry="10" fill="rgba(20,12,8,0.18)"/>
    <path d="M48 250 L56 150 Q110 128 164 150 L172 250 Z" fill="#ff3d7a" stroke="#140c08" stroke-width="6"/>
    <text x="110" y="208" text-anchor="middle" font-family="Bangers, cursive" font-size="22" fill="#fff6e8" stroke="#140c08" stroke-width="4" paint-order="stroke">LFG</text>
    <circle cx="110" cy="108" r="52" fill="#f3c7a1" stroke="#140c08" stroke-width="6"/>
    <path d="M58 108 Q54 48 110 40 Q168 48 162 110 Q150 58 110 52 Q72 60 58 108" fill="#2a1a12" stroke="#140c08" stroke-width="4"/>
    <circle cx="118" cy="36" r="16" fill="#ffd166" stroke="#140c08" stroke-width="4"/>
    <circle cx="42" cy="118" r="7" fill="#fff6e8" stroke="#140c08" stroke-width="3"/>
    <circle cx="178" cy="118" r="7" fill="#fff6e8" stroke="#140c08" stroke-width="3"/>
    ${brow}
    <circle cx="88" cy="100" r="8" fill="#140c08"/>
    <circle cx="122" cy="100" r="8" fill="#140c08"/>
    <circle cx="90" cy="98" r="2.5" fill="#fff"/>
    <circle cx="124" cy="98" r="2.5" fill="#fff"/>
    ${mouth}
    ${sweat}
    ${spark}
  </svg>`;
}

export function accountantSvg(): string {
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
