import type { MayaMood } from "./copy";

export function mayaSvg(mood: MayaMood): string {
  const brow =
    mood === "mad"
      ? `<path d="M68 86 L94 76" stroke="#140c08" stroke-width="6" stroke-linecap="round"/>
         <path d="M116 76 L144 86" stroke="#140c08" stroke-width="6" stroke-linecap="round"/>`
      : mood === "sweat"
        ? `<path d="M70 84 L96 88" stroke="#140c08" stroke-width="6" stroke-linecap="round"/>
           <path d="M114 88 L142 84" stroke="#140c08" stroke-width="6" stroke-linecap="round"/>`
        : `<path d="M68 86 Q88 74 100 86" stroke="#140c08" stroke-width="6" fill="none" stroke-linecap="round"/>
           <path d="M110 86 Q124 74 144 86" stroke="#140c08" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  const mouth =
    mood === "mad"
      ? `<path d="M90 136 Q106 124 122 136" stroke="#140c08" stroke-width="6" fill="none" stroke-linecap="round"/>`
      : mood === "sweat"
        ? `<ellipse cx="106" cy="136" rx="16" ry="10" fill="#f3c7a1" stroke="#140c08" stroke-width="5"/>`
        : `<path d="M88 128 Q106 152 126 128" stroke="#140c08" stroke-width="6" fill="#140c08"/>
           <path d="M96 132 Q106 144 116 132" fill="#ff5b7a"/>`;
  const sweat =
    mood === "sweat"
      ? `<path d="M164 92 q10 16 0 26" fill="#7ec8ff" stroke="#140c08" stroke-width="3"/>
         <path d="M172 110 q8 12 0 20" fill="#7ec8ff" stroke="#140c08" stroke-width="3"/>`
      : "";
  const spark =
    mood === "hyped"
      ? `<text x="170" y="64" font-size="24">🔥</text>`
      : mood === "smug"
        ? `<text x="168" y="66" font-size="20">💅</text>`
        : "";

  return `<svg class="char-svg" viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="110" cy="248" rx="72" ry="10" fill="rgba(20,12,8,0.18)"/>
    <path d="M44 252 L54 148 Q110 122 166 148 L176 252 Z" fill="#ff3d7a" stroke="#140c08" stroke-width="6"/>
    <path d="M70 168 Q110 158 150 168 L148 252 L72 252 Z" fill="#c2185b" stroke="#140c08" stroke-width="5"/>
    <text x="110" y="214" text-anchor="middle" font-family="Bangers, cursive" font-size="26" fill="#fff6e8" stroke="#140c08" stroke-width="5" paint-order="stroke">LFG</text>
    <line x1="86" y1="156" x2="78" y2="188" stroke="#140c08" stroke-width="4" stroke-linecap="round"/>
    <line x1="134" y1="156" x2="142" y2="188" stroke="#140c08" stroke-width="4" stroke-linecap="round"/>
    <circle cx="110" cy="112" r="56" fill="#f3c7a1" stroke="#140c08" stroke-width="6"/>
    <path d="M52 118 Q48 38 110 28 Q174 38 168 118 Q156 48 110 42 Q66 50 52 118" fill="#2a1a12" stroke="#140c08" stroke-width="5"/>
    <ellipse cx="78" cy="70" rx="22" ry="16" fill="#2a1a12"/>
    <ellipse cx="142" cy="70" rx="22" ry="16" fill="#2a1a12"/>
    <circle cx="124" cy="30" r="18" fill="#ffd166" stroke="#140c08" stroke-width="5"/>
    <circle cx="124" cy="30" r="6" fill="#e31c3d"/>
    <circle cx="36" cy="122" r="8" fill="#fff6e8" stroke="#140c08" stroke-width="4"/>
    <circle cx="184" cy="122" r="8" fill="#fff6e8" stroke="#140c08" stroke-width="4"/>
    ${brow}
    <circle cx="86" cy="108" r="9" fill="#140c08"/>
    <circle cx="124" cy="108" r="9" fill="#140c08"/>
    <circle cx="88" cy="105" r="3" fill="#fff"/>
    <circle cx="126" cy="105" r="3" fill="#fff"/>
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
