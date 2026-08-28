import type { Candle } from "./sim";

export function drawChart(
  canvas: HTMLCanvasElement,
  candles: Candle[],
  revealed: number,
  opts: {
    entry: number;
    yankedAt: number | null;
    yanks?: { at: number; label: string; color: string }[];
    embedded?: boolean;
    ink: string;
    paper: string;
    red: string;
    green: string;
    gold: string;
  },
): { hook: { x: number; y: number } | null } {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { hook: null };
  const useCss = canvas.clientWidth >= 2 && canvas.clientHeight >= 2;
  const dpr = opts.embedded || !useCss ? 1 : Math.max(1, window.devicePixelRatio || 1);
  const cssW = useCss ? canvas.clientWidth : canvas.width || 256;
  const cssH = useCss ? canvas.clientHeight : canvas.height || 128;
  if (cssW < 2 || cssH < 2) return { hook: null };
  if (opts.embedded) {
    if (canvas.width !== cssW) canvas.width = cssW;
    if (canvas.height !== cssH) canvas.height = cssH;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  } else {
    if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  ctx.clearRect(0, 0, cssW, cssH);

  if (opts.embedded) {
    ctx.fillStyle = "#1a4a52";
    ctx.fillRect(0, 0, cssW, cssH);
  } else {
    roundRect(ctx, 0, 0, cssW, cssH, 16);
    ctx.fillStyle = opts.paper;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = opts.ink;
    ctx.stroke();
  }

  const pad = opts.embedded
    ? { l: 8, r: 36, t: 8, b: 8 }
    : { l: 14, r: 52, t: 16, b: 18 };
  const vis = candles.slice(0, Math.max(1, revealed));
  let min = Math.min(opts.entry, ...vis.map((c) => c.l));
  let max = Math.max(opts.entry, ...vis.map((c) => c.h));
  const span = Math.max(0.8, max - min);
  min -= span * 0.08;
  max += span * 0.08;

  const innerW = cssW - pad.l - pad.r;
  const innerH = cssH - pad.t - pad.b;
  const yOf = (p: number) => pad.t + ((max - p) / (max - min)) * innerH;
  const slot = innerW / candles.length;

  // grid
  ctx.save();
  ctx.strokeStyle = "rgba(20,12,8,0.12)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  for (let g = 0; g < 4; g++) {
    const y = pad.t + (innerH / 3) * g;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(cssW - pad.r, y);
    ctx.stroke();
  }
  ctx.restore();

  // entry line
  const ey = yOf(opts.entry);
  ctx.save();
  ctx.strokeStyle = opts.gold;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(pad.l, ey);
  ctx.lineTo(cssW - pad.r, ey);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = opts.gold;
  ctx.font = "800 11px Nunito, sans-serif";
  ctx.fillText("ENTRY", cssW - pad.r + 6, ey + 4);

  // line under candles for comic motion
  ctx.beginPath();
  vis.forEach((c, i) => {
    const x = pad.l + i * slot + slot / 2;
    const y = yOf(c.c);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "rgba(20,12,8,0.28)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const bodyW = Math.max(4, slot * 0.62);
  vis.forEach((c, i) => {
    const x = pad.l + i * slot + slot / 2;
    const up = c.c >= c.o;
    const color = up ? opts.green : opts.red;
    ctx.strokeStyle = opts.ink;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, yOf(c.h));
    ctx.lineTo(x, yOf(c.l));
    ctx.stroke();
    const top = yOf(Math.max(c.o, c.c));
    const bot = yOf(Math.min(c.o, c.c));
    const h = Math.max(3, bot - top);
    ctx.fillRect(x - bodyW / 2, top, bodyW, h);
    ctx.strokeRect(x - bodyW / 2, top, bodyW, h);
  });

  const yanks = opts.yanks ?? (opts.yankedAt != null ? [{ at: opts.yankedAt, label: "YANK", color: opts.red }] : []);
  yanks.forEach((yank) => {
    if (yank.at >= vis.length) return;
    const x = pad.l + yank.at * slot + slot / 2;
    ctx.save();
    ctx.strokeStyle = yank.color;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x, pad.t);
    ctx.lineTo(x, cssH - pad.b);
    ctx.stroke();
    ctx.fillStyle = yank.color;
    ctx.font = "800 10px Nunito, sans-serif";
    ctx.fillText(yank.label, x + 4, pad.t + 12);
    ctx.restore();
  });

  const last = vis[vis.length - 1]!;
  const ly = yOf(last.c);
  ctx.fillStyle = last.c >= opts.entry ? opts.green : opts.red;
  roundRect(ctx, cssW - pad.r + 2, ly - 11, 48, 22, 6);
  ctx.fill();
  ctx.strokeStyle = opts.ink;
  ctx.lineWidth = 2;
  roundRect(ctx, cssW - pad.r + 2, ly - 11, 48, 22, 6);
  ctx.stroke();
  ctx.fillStyle = "#fff6e8";
  ctx.font = "800 11px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(last.c.toFixed(1), cssW - pad.r + 26, ly + 4);
  ctx.textAlign = "left";
  const lastX = pad.l + (vis.length - 1) * slot + slot / 2;
  return { hook: { x: lastX, y: ly } };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
