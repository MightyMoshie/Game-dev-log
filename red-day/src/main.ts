import "./style.css";
import * as audio from "./audio";
import { drawChart } from "./chart";
import { mayaLine } from "./copy";
import {
  bellScreen,
  briefScreen,
  bootScreen,
  deskScreen,
  floorScreen,
  setMaya,
} from "./screens";
import {
  buildDay,
  closeDay,
  maybeIdleFomo,
  newBook,
  tryRide,
  tryYank,
  unrealized,
  type LiveBook,
  type PreparedDay,
} from "./sim";
import {
  DRIP_FLAT,
  DRIP_PCT,
  FLOOR_MS,
  CANDLE_COUNT,
  clearSave,
  loadSave,
  money,
  newDesk,
  signedMoney,
  writeSave,
  type DeskSave,
} from "./state";

const INK = "#140c08";
const PAPER = "#f7edd4";
const RED = "#e31c3d";
const GREEN = "#1f8a4c";
const GOLD = "#f0b429";

class RedDay {
  private root: HTMLElement;
  private save: DeskSave | null;
  private day: PreparedDay | null = null;
  private book: LiveBook | null = null;
  private lastPnl: number | null = null;
  private justUnlocked = false;
  private raf = 0;
  private floorStart = 0;
  private lastLineAt = 0;
  private lastTickCandle = -1;

  constructor(root: HTMLElement) {
    this.root = root;
    this.save = loadSave();
    this.root.addEventListener("click", (e) => this.onClick(e));
    this.showBoot();
  }

  private onClick(e: Event): void {
    const t = e.target as HTMLElement | null;
    const btn = t?.closest?.("[data-act]") as HTMLElement | null;
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (!act || btn.hasAttribute("disabled")) return;
    audio.unlockAudio();
    audio.click();
    if (act === "open") this.openDesk(false);
    else if (act === "continue") this.openDesk(true);
    else if (act === "reset") this.reset();
    else if (act === "floor") this.openFloor();
    else if (act === "ride") this.ride();
    else if (act === "yank") this.yank();
    else if (act === "desk") this.showDesk();
    else if (act === "hire") this.hire();
    else if (act === "nextday") this.nextDay();
    else if (act === "title") this.showBoot();
  }

  private showBoot(): void {
    this.stopFloor();
    this.root.innerHTML = bootScreen(this.save);
    const input = this.root.querySelector<HTMLInputElement>("#desk-name");
    input?.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        audio.unlockAudio();
        this.openDesk(false);
      }
    });
  }

  private reset(): void {
    clearSave();
    this.save = null;
    this.day = null;
    this.book = null;
    this.lastPnl = null;
    this.justUnlocked = false;
    this.showBoot();
  }

  private openDesk(continueSave: boolean): void {
    const input = this.root.querySelector<HTMLInputElement>("#desk-name");
    if (!continueSave || !this.save) {
      this.save = newDesk(input?.value || "Paper Hands LLC");
      writeSave(this.save);
    }
    this.startBrief();
  }

  private startBrief(): void {
    if (!this.save) return;
    this.justUnlocked = false;
    this.day = buildDay({
      runSeed: this.save.runSeed,
      day: this.save.day,
      cash: this.save.cash,
      accountantHired: this.save.accountantHired,
    });
    this.book = newBook(this.day);
    this.root.innerHTML = briefScreen(this.save, this.day);
  }

  private openFloor(): void {
    if (!this.save || !this.day || !this.book) return;
    this.root.innerHTML = floorScreen(this.save, this.day);
    this.floorStart = performance.now();
    this.lastLineAt = 0;
    this.lastTickCandle = -1;
    this.loop();
  }

  private loop = (): void => {
    if (!this.day || !this.book) return;
    const elapsed = Math.min(FLOOR_MS, performance.now() - this.floorStart);
    const t = elapsed / FLOOR_MS;
    const index = Math.min(CANDLE_COUNT - 1, Math.floor(t * CANDLE_COUNT));

    if (!this.book.yankedAt && maybeIdleFomo(this.day, this.book, index)) {
      audio.ride();
      this.flashPos("FOMO ADD");
    }

    this.paintFloor(index, elapsed);

    if (elapsed >= FLOOR_MS) {
      this.finishDay();
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private paintFloor(index: number, elapsed: number): void {
    if (!this.day || !this.book) return;
    const canvas = this.root.querySelector<HTMLCanvasElement>("#tape");
    if (canvas) {
      drawChart(canvas, this.day.candles, index + 1, {
        entry: this.day.entry,
        yankedAt: this.book.yankedAt,
        ink: INK,
        paper: PAPER,
        red: RED,
        green: GREEN,
        gold: GOLD,
      });
    }

    const left = Math.max(0, Math.ceil((FLOOR_MS - elapsed) / 1000));
    const clock = this.root.querySelector("#clock");
    if (clock) clock.textContent = `0:${String(left).padStart(2, "0")}`;

    const pnl = unrealized(this.day, this.book, index);
    const live = this.root.querySelector("#live-pnl");
    if (live) {
      live.textContent = signedMoney(pnl);
      live.classList.toggle("up", pnl > 0);
      live.classList.toggle("down", pnl < 0);
    }

    const pos = this.root.querySelector("#pos");
    if (pos) {
      const state = this.book.yankedAt != null ? "FLAT" : "LONG";
      pos.textContent = `MAYA ${state} · ${money(this.book.notional)} · ${this.day.ticker}`;
    }

    if (index !== this.lastTickCandle) {
      this.lastTickCandle = index;
      if (index % 3 === 0) audio.tick();
    }

    const now = performance.now();
    if (now - this.lastLineAt > 2100) {
      this.lastLineAt = now;
      const pct = this.day.entry ? pnl / this.book.notional : 0;
      const line = mayaLine(
        pct,
        this.book.yankedAt != null,
        this.book.rode,
        this.book.fomo,
      );
      setMaya(this.root, line.mood, line.text);
    }
  }

  private ride(): void {
    if (!this.day || !this.book) return;
    if (!tryRide(this.day, this.book)) return;
    audio.ride();
    const rideBtn = this.root.querySelector<HTMLButtonElement>("#btn-ride");
    if (rideBtn) {
      rideBtn.disabled = true;
      rideBtn.textContent = this.day.hasAccountant
        ? "RIDING (CAPPED)"
        : this.book.fomo
          ? "RIDING · SHE ALREADY ADDED"
          : "RIDING · SIZED UP";
    }
    this.flashPos(this.day.hasAccountant ? "HOLD" : "YOLO ADD");
    const line = this.day.hasAccountant
      ? { mood: "mad" as const, text: "HR says I can’t add. Fine. We HOLD what we have. Boring." }
      : mayaLine(0.08, false, true, false);
    setMaya(this.root, line.mood, line.text);
  }

  private yank(): void {
    if (!this.day || !this.book) return;
    const elapsed = Math.min(FLOOR_MS, performance.now() - this.floorStart);
    const index = Math.min(CANDLE_COUNT - 1, Math.floor((elapsed / FLOOR_MS) * CANDLE_COUNT));
    if (!tryYank(this.day, this.book, index)) return;
    audio.yank();
    const rideBtn = this.root.querySelector<HTMLButtonElement>("#btn-ride");
    const yankBtn = this.root.querySelector<HTMLButtonElement>("#btn-yank");
    if (rideBtn) rideBtn.disabled = true;
    if (yankBtn) {
      yankBtn.disabled = true;
      yankBtn.textContent = "YANKED · P&L LOCKED";
    }
    this.flashPos("LOCKED");
    const pnl = unrealized(this.day, this.book, index);
    const pct = this.book.notional ? pnl / this.book.notional : 0;
    const line = mayaLine(pct, true, this.book.rode, this.book.fomo);
    setMaya(this.root, line.mood, line.text);
  }

  private flashPos(label: string): void {
    const pos = this.root.querySelector("#pos");
    if (!pos) return;
    pos.classList.add("flash");
    pos.setAttribute("data-flash", label);
    window.setTimeout(() => pos.classList.remove("flash"), 500);
  }

  private finishDay(): void {
    this.stopFloor();
    if (!this.save || !this.day || !this.book) return;
    audio.bell();
    const { pnl, roast } = closeDay(this.day, this.book);
    this.lastPnl = pnl;
    this.save.cash = Math.round(this.save.cash + pnl);
    this.save.bestDay = Math.max(this.save.bestDay, pnl);
    this.save.worstDay = Math.min(this.save.worstDay, pnl);
    if (pnl < -25) {
      this.save.redDays += 1;
      if (!this.save.hasAccountant) {
        this.save.hasAccountant = true;
        this.justUnlocked = true;
      }
    }
    this.save.day += 1;
    writeSave(this.save);
    this.root.innerHTML = bellScreen({
      save: this.save,
      day: this.day,
      pnl,
      roast,
      yanked: this.book.yankedAt != null,
      rode: this.book.rode,
      fomo: this.book.fomo,
    });
  }

  private showDesk(): void {
    if (!this.save) return;
    this.root.innerHTML = deskScreen(this.save, this.lastPnl, this.justUnlocked);
  }

  private hire(): void {
    if (!this.save || !this.save.hasAccountant) return;
    this.save.accountantHired = true;
    writeSave(this.save);
    this.justUnlocked = false;
    this.showDesk();
  }

  private nextDay(): void {
    if (!this.save) return;
    if (this.save.accountantHired) {
      this.save.cash = Math.round(this.save.cash + DRIP_FLAT + this.save.cash * DRIP_PCT);
    }
    writeSave(this.save);
    this.startBrief();
  }

  private stopFloor(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}

const screen = document.querySelector<HTMLElement>("#screen");
if (!screen) throw new Error("missing #screen");
new RedDay(screen);
