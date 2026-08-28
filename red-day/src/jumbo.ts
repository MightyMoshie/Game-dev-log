import { signedMoney } from "./state";
import type { Candle } from "./sim";
import type { Side } from "./sheets";
import type { SeatId } from "./quotes";

export interface JumboTile {
  id: SeatId;
  name: string;
  ticker: string;
  side: Side;
  pnl: number;
  notional: number;
  candles: Candle[];
  index: number;
  selected: boolean;
  yanked: boolean;
  warn: string | null;
}

export function drawJumbo(
  canvas: HTMLCanvasElement,
  tiles: JumboTile[],
  opts: { research: boolean },
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width || 960;
  const h = canvas.height || 480;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#0c1428";
  ctx.fillRect(0, 0, w, h);

  const n = Math.max(1, tiles.length);
  const gap = 8;
  const tw = (w - gap * (n + 1)) / n;
  tiles.forEach((tile, i) => {
    const x = gap + i * (tw + gap);
    paintTile(ctx, tile, x, gap, tw, h - gap * 2, opts.research);
  });
}

function paintTile(
  ctx: CanvasRenderingContext2D,
  tile: JumboTile,
  x: number,
  y: number,
  w: number,
  h: number,
  research: boolean,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = tile.selected ? "#152038" : "#101828";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = tile.side === "long" ? "#1f8a4c" : "#e31c3d";
  ctx.fillRect(x, y, 28, h);
  ctx.lineWidth = tile.selected ? 6 : 3;
  ctx.strokeStyle = tile.selected ? "#f0b429" : "#3a4a6a";
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);

  const up = tile.pnl >= 0;
  ctx.fillStyle = "#8aa0c8";
  ctx.font = "800 18px Nunito, sans-serif";
  ctx.fillText(tile.name.toUpperCase(), x + 38, y + 30);

  ctx.fillStyle = "#fff6e8";
  ctx.font = "900 22px Nunito, sans-serif";
  ctx.fillText(tile.side === "long" ? "LONG" : "SHORT", x + 38, y + 56);

  ctx.fillStyle = "#f0b429";
  ctx.font = "800 42px Bangers, Impact, sans-serif";
  ctx.fillText(tile.ticker, x + w - 16 - ctx.measureText(tile.ticker).width, y + 50);

  const pnlY = research ? y + 108 : y + 118;
  ctx.fillStyle = tile.yanked ? "#8aa0c8" : up ? "#3dd68c" : "#ff4d6d";
  ctx.font = research ? "800 52px 'JetBrains Mono', monospace" : "800 40px 'JetBrains Mono', monospace";
  ctx.fillText(signedMoney(tile.pnl), x + 28, pnlY);

  ctx.fillStyle = "#8aa0c8";
  ctx.font = "800 16px 'JetBrains Mono', monospace";
  ctx.fillText(tile.yanked ? "FLAT" : `BOOK ${Math.round(tile.notional).toLocaleString("en-US")}`, x + 28, pnlY + 24);

  spark(ctx, tile, x + 28, y + h - 78, w - 42, 58);

  if (tile.yanked) {
    ctx.fillStyle = "rgba(12,20,40,0.45)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#f0b429";
    ctx.font = "800 32px Bangers, Impact, sans-serif";
    ctx.fillText("YANKED", x + 16, y + h - 18);
  }

  if (research && tile.warn) {
    ctx.fillStyle = "#e31c3d";
    ctx.fillRect(x, y, w, 28);
    ctx.fillStyle = "#fff6e8";
    ctx.font = "900 16px Nunito, sans-serif";
    ctx.fillText(tile.warn, x + 14, y + 20);
  }
  ctx.restore();
}

function spark(
  ctx: CanvasRenderingContext2D,
  tile: JumboTile,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const vis = tile.candles.slice(0, Math.max(1, tile.index + 1));
  if (vis.length < 2) return;
  const prices = vis.map((c) => c.c);
  let min = Math.min(...prices, tile.candles[0]!.o);
  let max = Math.max(...prices, tile.candles[0]!.o);
  if (max - min < 0.2) {
    min -= 0.2;
    max += 0.2;
  }
  ctx.beginPath();
  vis.forEach((c, i) => {
    const px = x + (i / Math.max(1, vis.length - 1)) * w;
    const py = y + h - ((c.c - min) / (max - min)) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = tile.pnl >= 0 ? "#3dd68c" : "#ff4d6d";
  ctx.lineWidth = 3.5;
  ctx.stroke();
}
