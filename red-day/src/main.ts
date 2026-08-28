import "./style.css";
import * as audio from "./audio";
import { drawChart } from "./chart";
import { BANKS, Talker, type SeatId } from "./quotes";
import { poseFor } from "./office";
import { VoxelOffice } from "./voxel";
import {
  bellScreen,
  briefScreen,
  bootScreen,
  deskScreen,
  floorScreen,
  setBubble,
} from "./screens";
import {
  buildDay,
  closeDay,
  maybeIdleFomo,
  newBooks,
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
const MAYA_PINK = "#ff3d7a";
const JULES_TEAL = "#1f8a7a";

class RedDay {
  private root: HTMLElement;
  private save: DeskSave | null;
  private day: PreparedDay | null = null;
  private books: LiveBook[] = [];
  private selected: SeatId = "maya";
  private lastPnl: number | null = null;
  private justUnlocked = false;
  private raf = 0;
  private floorStart = 0;
  private lastLineAt = 0;
  private lastTickCandle = -1;
  private lastHrAt = 0;
  private lastYankId: string | null = null;
  private talkers = new Map<string, Talker>();
  private voxel: VoxelOffice | null = null;

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
    else if (act === "select") {
      const seat = btn.getAttribute("data-seat");
      if (seat === "maya" || seat === "jules") this.select(seat);
    }
  }

  private book(id: SeatId): LiveBook | undefined {
    return this.books.find((b) => b.seatId === id);
  }

  private select(id: SeatId): void {
    if (!this.book(id)) return;
    this.selected = id;
    this.syncButtons();
    this.speakSelected("idle");
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
    this.books = [];
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
      seat2: this.save.hasSeat2,
    });
    this.books = newBooks(this.day, this.save.cash);
    this.selected = "maya";
    this.root.innerHTML = briefScreen(this.save, this.day);
  }

  private openFloor(): void {
    if (!this.save || !this.day) return;
    this.voxel?.dispose();
    this.voxel = null;
    this.root.innerHTML = floorScreen(this.save, this.day);
    const host = this.root.querySelector<HTMLElement>("#voxel-host");
    if (host) {
      this.voxel = new VoxelOffice(host, {
        seats: this.day.seats.map((s) => s.id),
        accountant: this.save.accountantHired,
        onSelect: (id) => this.select(id),
      });
    }
    this.talkers = new Map([
      ["maya", new Talker(BANKS.maya.idle)],
      ["jules", new Talker(BANKS.jules.idle)],
      ["accountant", new Talker(BANKS.accountant.idle)],
    ]);
    this.floorStart = performance.now();
    this.lastLineAt = 0;
    this.lastHrAt = 0;
    this.lastTickCandle = -1;
    this.lastYankId = null;
    this.syncButtons();
    this.loop();
  }

  private loop = (): void => {
    if (!this.day) return;
    const elapsed = Math.min(FLOOR_MS, performance.now() - this.floorStart);
    const t = elapsed / FLOOR_MS;
    const index = Math.min(CANDLE_COUNT - 1, Math.floor(t * CANDLE_COUNT));

    for (const book of this.books) {
      if (maybeIdleFomo(this.day, book, index)) {
        audio.ride();
        this.flashPos(`${book.name.toUpperCase()} FOMO`);
        if (this.selected === book.seatId) this.speak(book.seatId, "fomo");
      }
    }

    this.paintFloor(index, elapsed);

    if (elapsed >= FLOOR_MS) {
      this.finishDay();
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private paintFloor(index: number, elapsed: number): void {
    if (!this.day) return;
    const canvas = this.root.querySelector<HTMLCanvasElement>("#tape");
    const yanks = this.books
      .filter((b) => b.yankedAt != null)
      .map((b) => ({
        at: b.yankedAt!,
        label: b.seatId === "maya" ? "MAYA" : "JULES",
        color: b.seatId === "maya" ? MAYA_PINK : JULES_TEAL,
      }));
    let hook: { x: number; y: number } | null = null;
    if (canvas) {
      hook = drawChart(canvas, this.day.candles, index + 1, {
        entry: this.day.entry,
        yankedAt: null,
        yanks,
        embedded: true,
        ink: INK,
        paper: PAPER,
        red: RED,
        green: GREEN,
        gold: GOLD,
      }).hook;
    }

    this.voxel?.sync({
      tape: canvas,
      hook,
      seats: this.books.map((book) => ({
        id: book.seatId,
        pose: poseFor(book),
        selected: book.seatId === this.selected,
        yanked: book.yankedAt != null,
        slack: Boolean(book.rode || book.fomo),
        yanking: this.lastYankId === book.seatId,
      })),
    });

    const left = Math.max(0, Math.ceil((FLOOR_MS - elapsed) / 1000));
    const clock = this.root.querySelector("#clock");
    if (clock) clock.textContent = `0:${String(left).padStart(2, "0")}`;

    const deskPnl = this.books.reduce((s, b) => s + unrealized(this.day!, b, index), 0);
    const live = this.root.querySelector("#live-pnl");
    if (live) {
      live.textContent = signedMoney(deskPnl);
      live.classList.toggle("up", deskPnl > 0);
      live.classList.toggle("down", deskPnl < 0);
    }

    const sel = this.book(this.selected);
    const pos = this.root.querySelector("#pos");
    if (pos && sel) {
      const state = sel.yankedAt != null ? "FLAT" : sel.rode || sel.fomo ? "SLACK" : "SWIMMING";
      pos.textContent = `${sel.name.toUpperCase()} ${state} · ${money(sel.notional)} · ${this.day.ticker}`;
    }

    if (index !== this.lastTickCandle) {
      this.lastTickCandle = index;
      if (index % 3 === 0) audio.tick();
    }

    const now = performance.now();
    if (now - this.lastLineAt > 2600) {
      this.lastLineAt = now;
      this.speakSelected("idle");
    }
    if (this.save?.accountantHired && now - this.lastHrAt > 8200) {
      this.lastHrAt = now;
      const hr = this.root.querySelector("#hr-line");
      if (hr) hr.textContent = this.talkers.get("accountant")?.next() ?? "";
    }
  }

  private speakSelected(kind: "idle" | "yank" | "ride" | "fomo"): void {
    this.speak(this.selected, kind);
  }

  private speak(id: SeatId, kind: "idle" | "yank" | "ride" | "fomo"): void {
    const book = this.book(id);
    if (!book || !this.day) return;
    const bank = BANKS[id];
    const talker = this.talkers.get(id);
    if (!talker) return;
    const text =
      kind === "idle"
        ? talker.next()
        : talker.next(bank[kind]);
    setBubble(this.root, `${book.name.toUpperCase()} · ${kind === "idle" ? "ON THE LINE" : kind.toUpperCase()}`, text);
  }

  private ride(): void {
    if (!this.day) return;
    const book = this.book(this.selected);
    if (!book) return;
    if (!tryRide(this.day, book)) return;
    audio.ride();
    this.flashPos(this.day.hasAccountant ? "HOLD" : `${book.name.toUpperCase()} SLACK`);
    this.speak(book.seatId, "ride");
    this.syncButtons();
  }

  private yank(): void {
    if (!this.day) return;
    const book = this.book(this.selected);
    if (!book) return;
    const elapsed = Math.min(FLOOR_MS, performance.now() - this.floorStart);
    const index = Math.min(CANDLE_COUNT - 1, Math.floor((elapsed / FLOOR_MS) * CANDLE_COUNT));
    if (!tryYank(this.day, book, index)) return;
    audio.yank();
    this.lastYankId = book.seatId;
    this.voxel?.splash();
    this.flashPos(`${book.name.toUpperCase()} REELED`);
    this.speak(book.seatId, "yank");
    const other = this.books.find((b) => b.seatId !== book.seatId && b.yankedAt == null);
    if (other) this.selected = other.seatId;
    this.syncButtons();
  }

  private syncButtons(): void {
    const book = this.book(this.selected);
    const rideBtn = this.root.querySelector<HTMLButtonElement>("#btn-ride");
    const yankBtn = this.root.querySelector<HTMLButtonElement>("#btn-yank");
    if (!book || !rideBtn || !yankBtn) return;
    const flat = book.yankedAt != null;
    rideBtn.disabled = flat || book.rode;
    yankBtn.disabled = flat;
    const who = book.name.toUpperCase();
    rideBtn.textContent = book.rode ? `${who} · SLACK` : `LET ${who} RIDE`;
    yankBtn.textContent = flat ? `${who} · REELED` : `YANK ${who}`;
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
    if (!this.save || !this.day) return;
    audio.bell();
    const { pnl, roast } = closeDay(this.day, this.books);
    this.lastPnl = pnl;
    this.save.cash = Math.round(this.save.cash + pnl);
    this.save.bestDay = Math.max(this.save.bestDay, pnl);
    this.save.worstDay = Math.min(this.save.worstDay, pnl);
    if (pnl < -25) {
      this.save.redDays += 1;
      if (!this.save.hasAccountant || !this.save.hasSeat2) {
        this.save.hasAccountant = true;
        this.save.hasSeat2 = true;
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
      yanked: this.books.some((b) => b.yankedAt != null),
      rode: this.books.some((b) => b.rode),
      fomo: this.books.some((b) => b.fomo),
      books: this.books,
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
    this.voxel?.dispose();
    this.voxel = null;
  }
}

const screen = document.querySelector<HTMLElement>("#screen");
if (!screen) throw new Error("missing #screen");
new RedDay(screen);
