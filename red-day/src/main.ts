import "./style.css";
import * as audio from "./audio";
import { drawJumbo } from "./jumbo";
import { BANKS, Talker, type SeatId } from "./quotes";
import { poseFor } from "./office";
import { VoxelOffice } from "./voxel";
import {
  applyMandate,
  applyPitchDecisions,
  mandateBroken,
  pitchCards,
  type PitchCard,
  type PitchDecision,
} from "./pitch";
import { applyCurriculumUnlock, isRealRedDay, scarsEarned, tryBuyUpgrade } from "./progress";
import {
  bellScreen,
  bootScreen,
  deskScreen,
  floorScreen,
  pitchScreen,
  setBubble,
} from "./screens";
import {
  blowupTell,
  buildDay,
  closeDay,
  maybeIdleFomo,
  newBooks,
  recoveredAfterYank,
  tryRide,
  tryYank,
  tryYankAll,
  unrealized,
  type LiveBook,
  type Mandate,
  type PreparedDay,
} from "./sim";
import {
  DRIP_FLAT,
  DRIP_PCT,
  CANDLE_COUNT,
  clearSave,
  loadSave,
  money,
  newDesk,
  signedMoney,
  upgradesFrom,
  writeSave,
  type DeskSave,
  type UpgradeId,
} from "./state";

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
  private panicked = false;
  private pitchList: PitchCard[] = [];
  private pitchIndex = 0;
  private pitchDecisions: Record<string, PitchDecision> = {};
  private mandate: Mandate | null = null;
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
    else if (act === "seat") this.decidePitch("seat");
    else if (act === "cut") this.decidePitch("cut");
    else if (act === "reject") this.decidePitch("reject");
    else if (act === "mandate") {
      const id = btn.getAttribute("data-mandate");
      this.pickMandate(id === "NO_FOMO_ADDS" || id === "HALF_SIZE" || id === "YANK_GREEN" ? id : null);
    }
    else if (act === "ride") this.ride();
    else if (act === "yank") this.yank();
    else if (act === "panic") this.panic();
    else if (act === "desk") this.showDesk();
    else if (act === "upgrade") {
      const id = btn.getAttribute("data-upgrade");
      if (id === "compliance" || id === "espresso" || id === "research") this.placeUpgrade(id);
    }
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
    if (applyCurriculumUnlock(this.save)) {
      this.justUnlocked = true;
      writeSave(this.save);
    } else {
      this.justUnlocked = false;
    }
    this.day = buildDay({
      runSeed: this.save.runSeed,
      day: this.save.day,
      cash: this.save.cash,
      accountantHired: this.save.upgradeCompliance || this.save.accountantHired,
      seat2: this.save.hasSeat2,
      upgrades: upgradesFrom(this.save),
    });
    this.books = [];
    this.selected = "maya";
    this.pitchList = pitchCards(this.day.seats);
    this.pitchIndex = 0;
    this.pitchDecisions = {};
    this.mandate = null;
    this.renderPitch();
  }

  private seatedSpecs() {
    if (!this.save || !this.day) return [];
    return applyMandate(
      applyPitchDecisions(this.day.seats, this.pitchDecisions, this.save.day),
      this.mandate,
    );
  }

  private renderPitch(): void {
    if (!this.save || !this.day) return;
    const total = this.pitchList.length;
    if (this.pitchIndex < total) {
      this.root.innerHTML = pitchScreen({
        save: this.save,
        day: this.day,
        phase: "pitch",
        card: this.pitchList[this.pitchIndex]!,
        forceSeat: this.save.day <= 1,
        mandate: this.mandate,
        seated: this.seatedSpecs(),
        index: this.pitchIndex,
        total,
      });
      return;
    }
    this.root.innerHTML = pitchScreen({
      save: this.save,
      day: this.day,
      phase: "gate",
      card: null,
      forceSeat: this.save.day <= 1,
      mandate: this.mandate,
      seated: this.seatedSpecs(),
      index: total,
      total,
    });
  }

  private decidePitch(decision: PitchDecision): void {
    if (!this.save || !this.day) return;
    const card = this.pitchList[this.pitchIndex];
    if (!card) return;
    if (decision === "reject" && this.save.day <= 1) return;
    this.pitchDecisions[card.spec.id] = decision;
    this.pitchIndex += 1;
    this.renderPitch();
  }

  private pickMandate(id: Mandate | null): void {
    this.mandate = this.mandate === id ? null : id;
    this.renderPitch();
  }

  private openFloor(): void {
    if (!this.save || !this.day) return;
    this.day.seats = this.seatedSpecs();
    this.books = newBooks(this.day, this.save.cash);
    this.selected = this.books[0]?.seatId ?? "maya";
    if (!this.books.length) {
      this.finishEmptyDay();
      return;
    }
    this.voxel?.dispose();
    this.voxel = null;
    this.root.innerHTML = floorScreen(this.save, this.day);
    const host = this.root.querySelector<HTMLElement>("#voxel-host");
    if (host) {
      this.voxel = new VoxelOffice(host, {
        seats: this.day.seats.map((s) => s.id),
        upgrades: upgradesFrom(this.save),
        onSelect: (id) => this.select(id),
        onPanic: () => this.panic(),
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
    this.panicked = false;
    this.syncButtons();
    this.loop();
  }

  private floorMs(): number {
    return this.day?.floorMs ?? 28_000;
  }

  private loop = (): void => {
    if (!this.day) return;
    const floorMs = this.floorMs();
    const elapsed = Math.min(floorMs, performance.now() - this.floorStart);
    const t = elapsed / floorMs;
    const index = Math.min(CANDLE_COUNT - 1, Math.floor(t * CANDLE_COUNT));

    for (const book of this.books) {
      if (maybeIdleFomo(this.day, book, index)) {
        audio.ride();
        this.flashPos(`${book.name.toUpperCase()} FOMO`);
        if (this.selected === book.seatId) this.speak(book.seatId, "fomo");
      }
    }

    this.paintFloor(index, elapsed);

    if (elapsed >= floorMs) {
      this.finishDay();
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private paintFloor(index: number, elapsed: number): void {
    if (!this.day) return;
    const canvas = this.root.querySelector<HTMLCanvasElement>("#jumbo");
    const research = Boolean(this.save?.upgradeResearch);
    let liveTell: string | null = null;
    if (canvas) {
      drawJumbo(
        canvas,
        this.books.map((book) => {
          const warn = research ? blowupTell(book, index) : null;
          if (warn && book.yankedAt == null) {
            book.warned = true;
            if (!liveTell) liveTell = warn;
          }
          return {
            id: book.seatId,
            name: book.name,
            ticker: book.ticker,
            side: book.side,
            pnl: unrealized(this.day!, book, index),
            notional: book.notional,
            candles: book.candles,
            index,
            selected: book.seatId === this.selected,
            yanked: book.yankedAt != null,
            warn,
          };
        }),
        { research },
      );
    }
    this.paintInquiry(liveTell);

    this.voxel?.sync({
      jumbo: canvas,
      seats: this.books.map((book) => ({
        id: book.seatId,
        pose: poseFor(book),
        selected: book.seatId === this.selected,
        yanked: book.yankedAt != null,
        slack: Boolean(book.rode || book.fomo),
        yanking: this.lastYankId === book.seatId,
      })),
    });

    const left = Math.max(0, Math.ceil((this.floorMs() - elapsed) / 1000));
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
      const side = sel.side === "short" ? "SHORT" : "LONG";
      const state = sel.yankedAt != null ? "FLAT" : sel.rode || sel.fomo ? "GLUED" : "IN CHAIR";
      pos.textContent = `${sel.name.toUpperCase()} ${side} ${state} · ${money(sel.notional)} · ${sel.ticker}`;
    }

    if (index !== this.lastTickCandle) {
      this.lastTickCandle = index;
      if (index % 3 === 0) audio.tick();
    }

    const now = performance.now();
    const quoteMs = this.day.quoteMs;
    if (now - this.lastLineAt > quoteMs) {
      this.lastLineAt = now;
      this.speakSelected("idle");
    }
    if ((this.save?.upgradeCompliance || this.save?.accountantHired) && now - this.lastHrAt > 8200) {
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
    this.flashPos(this.day.hasAccountant ? "HOLD" : `${book.name.toUpperCase()} GLUED`);
    this.speak(book.seatId, "ride");
    this.syncButtons();
  }

  private candleIndex(): number {
    const floorMs = this.floorMs();
    const elapsed = Math.min(floorMs, performance.now() - this.floorStart);
    return Math.min(CANDLE_COUNT - 1, Math.floor((elapsed / floorMs) * CANDLE_COUNT));
  }

  private yank(): void {
    if (!this.day) return;
    const book = this.book(this.selected);
    if (!book) return;
    const index = this.candleIndex();
    if (!tryYank(this.day, book, index)) return;
    audio.yank();
    this.lastYankId = book.seatId;
    this.voxel?.splash();
    this.flashPos(`${book.name.toUpperCase()} OFF CHAIR`);
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
    rideBtn.textContent = book.rode ? `${who} · GLUED` : `LET ${who} RIDE`;
    yankBtn.textContent = flat ? `${who} · YANKED` : `YANK ${who}`;
    const panicBtn = this.root.querySelector<HTMLButtonElement>("#btn-panic");
    if (panicBtn) panicBtn.disabled = this.books.every((b) => b.yankedAt != null);
  }

  private panic(): void {
    if (!this.day) return;
    const index = this.candleIndex();
    const n = tryYankAll(this.day, this.books, index);
    if (n === 0 && this.books.every((b) => b.yankedAt != null)) return;
    this.panicked = true;
    audio.yank();
    this.lastYankId = this.books[0]?.seatId ?? null;
    this.flashPos("PANIC · WHOLE FLOOR");
    const still = this.books.find((b) => b.yankedAt == null);
    if (still) this.selected = still.seatId;
    this.syncButtons();
    this.speak(this.selected, "yank");
  }

  private flashPos(label: string): void {
    const pos = this.root.querySelector("#pos");
    if (!pos) return;
    pos.classList.add("flash");
    pos.setAttribute("data-flash", label);
    window.setTimeout(() => pos.classList.remove("flash"), 500);
  }

  private finishEmptyDay(): void {
    if (!this.save || !this.day) return;
    this.panicked = false;
    const { pnl, roast } = closeDay(this.day, [], { emptyFloor: true });
    this.settleDay(pnl, roast);
  }

  private finishDay(): void {
    this.stopFloor();
    if (!this.save || !this.day) return;
    const last = this.day.candles.length - 1;
    const pnls = this.books.map((b) => unrealized(this.day!, b, last));
    const broke = mandateBroken(this.mandate, this.books, pnls);
    const { pnl, roast } = closeDay(this.day, this.books, {
      panic: this.panicked,
      mandateBroken: broke,
    });
    this.settleDay(pnl, roast);
  }

  private settleDay(pnl: number, roast: ReturnType<typeof closeDay>["roast"]): void {
    if (!this.save || !this.day) return;
    audio.bell();
    this.lastPnl = pnl;
    this.save.cash = Math.round(this.save.cash + pnl);
    this.save.bestDay = Math.max(this.save.bestDay, pnl);
    this.save.worstDay = Math.min(this.save.worstDay, pnl);
    this.save.day += 1;
    const recoveredYank = this.books.some((b) => recoveredAfterYank(this.day!, b) > 0);
    this.save.scars += scarsEarned({ pnl, recoveredYank, panic: this.panicked });
    if (isRealRedDay(pnl)) this.save.redDays += 1;
    this.justUnlocked = applyCurriculumUnlock(this.save, pnl);
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

  private paintInquiry(liveTell: string | null): void {
    const chip = this.root.querySelector('[data-stat="research"]');
    const val = this.root.querySelector("#stat-inquiry-v");
    const hint = chip?.querySelector(".stat-h");
    if (!chip || !val) return;
    if (liveTell) {
      val.textContent = liveTell;
      if (hint) hint.textContent = "tell live";
      chip.classList.add("on", "alert");
      chip.classList.remove("dim");
    } else if (this.day?.research) {
      val.textContent = "ON";
      if (hint) hint.textContent = "blowup warn";
      chip.classList.add("on");
      chip.classList.remove("dim", "alert");
    }
  }

  private showDesk(): void {
    if (!this.save) return;
    if (applyCurriculumUnlock(this.save)) {
      this.justUnlocked = true;
      writeSave(this.save);
    }
    this.root.innerHTML = deskScreen(this.save, this.lastPnl, this.justUnlocked);
  }

  private placeUpgrade(id: UpgradeId): void {
    if (!this.save) return;
    if (!tryBuyUpgrade(this.save, id)) return;
    writeSave(this.save);
    this.justUnlocked = false;
    this.root.innerHTML = deskScreen(this.save, this.lastPnl, false, id);
  }

  private nextDay(): void {
    if (!this.save) return;
    if (this.save.upgradeCompliance || this.save.accountantHired) {
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
