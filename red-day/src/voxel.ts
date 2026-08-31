import * as THREE from "three";
import type { SeatId } from "./quotes";
import type { Pose } from "./office";
import type { FloorUpgrades } from "./state";

const C = {
  navy: 0x1b2744,
  navyMid: 0x243656,
  navyDark: 0x0c1428,
  white: 0xf4f7fb,
  glass: 0x7ec8e8,
  glassDeep: 0x1a3a52,
  gold: 0xf0b429,
  red: 0xe31c3d,
  ink: 0x0a101c,
  maya: 0xff3d7a,
  mayaDark: 0xc2185b,
  jules: 0x1f8a7a,
  julesDark: 0x146056,
  skin: 0xf3c7a1,
  hair: 0x2a1a12,
  green: 0x1f8a4c,
  green2: 0x176b38,
  night: 0x0a1224,
  window: 0xf0b429,
};

const UNIT = new THREE.BoxGeometry(1, 1, 1);
const mats = new Map<number, THREE.MeshLambertMaterial>();

function mat(color: number): THREE.MeshLambertMaterial {
  let m = mats.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true });
    mats.set(color, m);
  }
  return m;
}

function box(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  color: number,
  x: number,
  y: number,
  z: number,
  seat?: SeatId,
): THREE.Mesh {
  const mesh = new THREE.Mesh(UNIT, mat(color));
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (seat) mesh.userData.seat = seat;
  parent.add(mesh);
  return mesh;
}

/** Unlit voxel — city windows and the jumbotron stay bright in the night pit. */
function glow(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  color: number,
  x: number,
  y: number,
  z: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(UNIT, new THREE.MeshBasicMaterial({ color }));
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

export type SeatSync = {
  id: SeatId;
  pose: Pose;
  selected: boolean;
  yanked: boolean;
  slack: boolean;
  yanking: boolean;
};

type SeatRig = {
  id: SeatId;
  root: THREE.Group;
  pose: THREE.Group;
  tip: THREE.Object3D;
  bobber: THREE.Mesh;
  beads: THREE.Mesh[];
  lineColor: number;
  deskPad: THREE.Mesh;
  yankT: number;
  tile: THREE.Vector3;
};

const BEADS = 14;

/** Navy / glass high-rise floor. Jumbotron on the back wall. */
export class VoxelOffice {
  private host: HTMLElement;
  private scene = new THREE.Scene();
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private sun: THREE.DirectionalLight;
  private ray = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private jumboTex: THREE.CanvasTexture | null = null;
  private jumboGlass: THREE.Mesh;
  private jumboOrigin = new THREE.Vector3(0, 2.55, -4.42);
  private jumboSize = { w: 4.55, h: 1.95 };
  private seats = new Map<SeatId, SeatRig>();
  private ro: ResizeObserver;
  private onSelect: (id: SeatId) => void;
  private onPanic: () => void;
  private disposed = false;
  private tmpA = new THREE.Vector3();
  private tmpB = new THREE.Vector3();
  private tmpM = new THREE.Vector3();
  private duo: boolean;

  constructor(
    host: HTMLElement,
    opts: {
      seats: SeatId[];
      upgrades: FloorUpgrades;
      onSelect: (id: SeatId) => void;
      onPanic: () => void;
    },
  ) {
    this.host = host;
    this.onSelect = opts.onSelect;
    this.onPanic = opts.onPanic;
    this.duo = opts.seats.length > 1;
    this.scene.background = new THREE.Color(C.night);

    const view = 6.8;
    this.camera = new THREE.OrthographicCamera(-view, view, view, -view, 0.1, 90);
    const focus = new THREE.Vector3(0.1, 1.55, 0.55);
    const dist = 18;
    this.camera.position.set(focus.x + dist, focus.y + dist, focus.z + dist);
    this.camera.lookAt(focus);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, failIfMajorPerformanceCaveat: false });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(C.night, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = "voxel-canvas";
    host.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xb8c4e0, 0.62));
    this.sun = new THREE.DirectionalLight(0xe8f0ff, 1.12);
    this.sun.position.set(-6, 16, 6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = -11;
    this.sun.shadow.camera.right = 11;
    this.sun.shadow.camera.top = 11;
    this.sun.shadow.camera.bottom = -11;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 42;
    this.scene.add(this.sun);

    this.buildRoom(opts.upgrades);
    this.jumboGlass = this.buildJumbo(opts.upgrades.research);

    for (const id of opts.seats) {
      const pos =
        id === "maya"
          ? this.duo
            ? new THREE.Vector3(1.4, 0, 2.5)
            : new THREE.Vector3(0.25, 0, 2.4)
          : new THREE.Vector3(-1.5, 0, 1.45);
      const tile = this.tilePos(id, opts.seats.length);
      this.seats.set(id, this.buildSeat(id, pos, id === "jules" ? 1.02 : this.duo ? 1.08 : 1.28, tile));
    }

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    host.addEventListener("pointerdown", this.onPointer);
  }

  splash(): void {
    /* yank-from-chair is the splash now */
  }

  sync(opts: {
    seats: SeatSync[];
    jumbo: HTMLCanvasElement | null;
  }): void {
    if (this.disposed) return;
    if (opts.jumbo) this.paintJumbo(opts.jumbo);
    const t = performance.now();

    for (const seat of opts.seats) {
      const rig = this.seats.get(seat.id);
      if (!rig) continue;
      if ((seat.yanked || seat.yanking) && rig.yankT === 0) rig.yankT = t;
      if (!seat.yanked && !seat.yanking) rig.yankT = 0;

      const yanked = seat.pose === "reeled" || seat.yanking;
      const glued = seat.pose === "lean" || seat.slack;
      const k = yanked && rig.yankT ? Math.min(1, (t - rig.yankT) / 280) : 0;
      const bob = seat.pose === "swim" ? Math.sin(t / 220) * 0.05 : 0;

      if (yanked) {
        rig.pose.position.y += (0.95 * k + bob - rig.pose.position.y) * 0.22;
        rig.pose.position.z += (1.55 * k - rig.pose.position.z) * 0.22;
        rig.pose.rotation.x += (0.95 * k - rig.pose.rotation.x) * 0.2;
        rig.pose.rotation.z += (0.28 * k - rig.pose.rotation.z) * 0.2;
      } else if (glued) {
        rig.pose.position.y += (bob - rig.pose.position.y) * 0.2;
        rig.pose.position.z += (-0.16 - rig.pose.position.z) * 0.18;
        rig.pose.rotation.x += (-0.42 - rig.pose.rotation.x) * 0.16;
        rig.pose.rotation.z += (0 - rig.pose.rotation.z) * 0.16;
      } else {
        rig.pose.position.y += (bob - rig.pose.position.y) * 0.2;
        rig.pose.position.z += (0 - rig.pose.position.z) * 0.16;
        rig.pose.rotation.x += (0 - rig.pose.rotation.x) * 0.16;
        rig.pose.rotation.z += (0 - rig.pose.rotation.z) * 0.16;
      }
      rig.deskPad.visible = seat.selected;
      this.updateLine(rig, seat);
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.ro.disconnect();
    this.host.removeEventListener("pointerdown", this.onPointer);
    this.jumboTex?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private tilePos(id: SeatId, count: number): THREE.Vector3 {
    const { w, h } = this.jumboSize;
    const y = this.jumboOrigin.y;
    const z = this.jumboOrigin.z + 0.22;
    if (count < 2) return new THREE.Vector3(this.jumboOrigin.x, y, z);
    const x = id === "maya" ? this.jumboOrigin.x - w * 0.24 : this.jumboOrigin.x + w * 0.24;
    return new THREE.Vector3(x, y - h * 0.08, z);
  }

  private onPointer = (ev: PointerEvent): void => {
    if (this.disposed) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    this.pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    this.ray.setFromCamera(this.pointer, this.camera);
    const hits = this.ray.intersectObjects(this.scene.children, true);
    for (const hit of hits) {
      let o: THREE.Object3D | null = hit.object;
      while (o) {
        if (o.userData.panic) {
          this.onPanic();
          return;
        }
        const seat = o.userData.seat as SeatId | undefined;
        if (seat === "maya" || seat === "jules") {
          this.onSelect(seat);
          return;
        }
        o = o.parent;
      }
    }
  };

  private resize(): void {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    const aspect = w / h;
    const viewH = 6.7;
    this.camera.left = -viewH * aspect;
    this.camera.right = viewH * aspect;
    this.camera.top = viewH;
    this.camera.bottom = -viewH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.renderer.render(this.scene, this.camera);
  }

  private paintJumbo(canvas: HTMLCanvasElement): void {
    if (!this.jumboTex) {
      this.jumboTex = new THREE.CanvasTexture(canvas);
      this.jumboTex.colorSpace = THREE.SRGBColorSpace;
      this.jumboTex.minFilter = THREE.LinearFilter;
      this.jumboTex.magFilter = THREE.LinearFilter;
      const mats = this.jumboGlass.material as THREE.MeshBasicMaterial[];
      mats[4].map = this.jumboTex;
      mats[4].color.set(0xffffff);
      mats[4].needsUpdate = true;
    }
    this.jumboTex.needsUpdate = true;
  }

  private buildRoom(upgrades: FloorUpgrades): void {
    const root = new THREE.Group();
    this.scene.add(root);

    for (let z = -4; z <= 4; z++) {
      for (let x = -3; x <= 3; x++) {
        const light = (x + z) % 2 === 0;
        box(root, 0.92, 0.28, 0.92, light ? C.white : C.navyMid, x, 0.14, z);
      }
    }

    this.skyline(root);

    box(root, 0.95, 4.8, 0.36, C.navy, -3.35, 2.45, -4.78);
    box(root, 0.95, 4.8, 0.36, C.navy, 3.35, 2.45, -4.78);
    box(root, 7.6, 0.42, 0.36, C.navy, 0, 4.62, -4.78);
    box(root, 7.6, 0.28, 0.42, C.gold, 0, 0.3, -4.78);
    box(root, 0.42, 4.6, 9.4, C.navyDark, -3.72, 2.35, 0);
    box(root, 0.48, 0.28, 9.4, C.ink, -3.72, 0.32, 0);
    box(root, 0.42, 4.6, 1.7, C.navy, 3.72, 2.35, -3.85);
    box(root, 0.48, 0.28, 1.7, C.ink, 3.72, 0.32, -3.85);

    box(root, 0.12, 2.4, 1.8, C.glass, -3.48, 2.5, -1.6);
    box(root, 0.08, 2.4, 0.08, C.gold, -3.44, 2.5, -1.6);
    box(root, 0.08, 0.08, 1.8, C.gold, -3.44, 2.5, -1.6);

    box(root, 0.55, 0.55, 0.55, C.green, -2.9, 0.85, -3.55);
    box(root, 0.4, 0.4, 0.4, C.green2, -2.7, 1.2, -3.4);
    box(root, 0.48, 0.28, 0.48, C.white, -2.9, 0.42, -3.55);

    box(root, 0.55, 0.55, 0.55, C.green, 2.85, 0.85, -3.4);
    box(root, 0.38, 0.38, 0.38, C.green2, 3.05, 1.18, -3.25);
    box(root, 0.48, 0.28, 0.48, C.white, 2.85, 0.42, -3.4);

    const panic = box(root, 1.15, 1.05, 1.15, C.red, 2.55, 0.66, 3.35);
    panic.userData.panic = true;
    box(root, 1.28, 0.12, 1.28, C.gold, 2.55, 0.14, 3.35).userData.panic = true;
    glow(root, 0.32, 0.22, 0.32, C.white, 2.55, 1.28, 3.35).userData.panic = true;

    if (upgrades.compliance) {
      box(root, 0.08, 1.1, 0.7, C.white, -3.48, 2.4, 1.4);
      box(root, 0.1, 0.18, 0.7, C.red, -3.46, 2.85, 1.4);
      box(root, 0.08, 0.9, 0.55, C.white, -3.48, 2.2, 2.3);
      box(root, 0.1, 0.14, 0.55, C.gold, -3.46, 2.55, 2.3);
    }
    if (upgrades.espresso) {
      box(root, 0.7, 0.85, 0.55, C.navy, -2.85, 0.62, 2.55);
      box(root, 0.35, 0.35, 0.35, C.gold, -2.85, 1.22, 2.55);
      box(root, 0.18, 0.28, 0.18, C.white, -2.62, 0.7, 2.55);
    } else {
      box(root, 0.5, 1.05, 0.5, C.navyMid, -2.85, 0.7, 2.55);
      box(root, 0.32, 0.22, 0.32, C.glass, -2.85, 1.32, 2.55);
    }
  }

  private skyline(parent: THREE.Object3D): void {
    const z = -5.7;
    const towers = [
      [-3.5, 4.2, 1.05],
      [-2.2, 6.1, 1.25],
      [-0.7, 3.6, 1.0],
      [0.8, 5.6, 1.2],
      [2.2, 4.0, 1.05],
      [3.55, 5.2, 1.0],
    ] as const;
    for (const [x, h, w] of towers) {
      box(parent, w, h, 0.95, C.navyDark, x, h / 2, z);
      for (let wy = 0.55; wy < h - 0.25; wy += 0.42) {
        for (let wx = -w / 2 + 0.18; wx < w / 2 - 0.08; wx += 0.3) {
          glow(parent, 0.13, 0.16, 0.08, C.window, x + wx, wy, z + 0.52);
        }
      }
    }
  }

  private buildJumbo(research: boolean): THREE.Mesh {
    const g = new THREE.Group();
    this.scene.add(g);
    const { w, h } = this.jumboSize;
    const z = this.jumboOrigin.z;
    const y = this.jumboOrigin.y;
    const frame = research ? C.gold : C.navy;
    box(g, w + 0.28, 0.16, 0.36, frame, 0, y + h / 2 + 0.08, z);
    box(g, w + 0.28, 0.16, 0.36, frame, 0, y - h / 2 - 0.08, z);
    box(g, 0.16, h + 0.16, 0.36, frame, -w / 2 - 0.08, y, z);
    box(g, 0.16, h + 0.16, 0.36, frame, w / 2 + 0.08, y, z);
    box(g, w, 0.1, 0.2, C.gold, 0, y + h / 2 + 0.22, z + 0.04);

    const glassMats = [
      mat(C.navyDark),
      mat(C.navyDark),
      mat(C.navyDark),
      mat(C.navyDark),
      new THREE.MeshBasicMaterial({ color: 0x101828 }),
      mat(C.navyDark),
    ];
    const glass = new THREE.Mesh(UNIT, glassMats);
    glass.scale.set(w, h, 0.08);
    glass.position.set(0, y, z + 0.14);
    g.add(glass);

    const count = this.duo ? 2 : 1;
    const ids: SeatId[] = this.duo ? ["maya", "jules"] : ["maya"];
    ids.forEach((id) => {
      const p = this.tilePos(id, count);
      const hit = new THREE.Mesh(
        UNIT,
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false }),
      );
      hit.scale.set(count > 1 ? w * 0.46 : w * 0.92, h * 0.9, 0.18);
      hit.position.set(p.x, p.y, p.z);
      hit.userData.seat = id;
      g.add(hit);
    });
    return glass;
  }

  private buildSeat(id: SeatId, pos: THREE.Vector3, scale: number, tile: THREE.Vector3): SeatRig {
    const hoodie = id === "maya" ? C.maya : C.jules;
    const hoodieDark = id === "maya" ? C.mayaDark : C.julesDark;
    const root = new THREE.Group();
    root.position.copy(pos);
    root.scale.setScalar(scale);
    root.userData.seat = id;
    this.scene.add(root);

    const deskPad = box(root, 1.35, 0.06, 1.15, C.gold, 0, 0.04, -0.12, id);
    deskPad.visible = false;

    box(root, 1.28, 0.12, 0.82, C.white, 0, 0.78, -0.28, id);
    box(root, 0.1, 0.7, 0.1, C.navy, -0.5, 0.38, -0.52, id);
    box(root, 0.1, 0.7, 0.1, C.navy, 0.5, 0.38, -0.52, id);
    box(root, 0.1, 0.7, 0.1, C.navy, -0.5, 0.38, 0.02, id);
    box(root, 0.1, 0.7, 0.1, C.navy, 0.5, 0.38, 0.02, id);
    box(root, 0.48, 0.42, 0.1, C.navyDark, 0.22, 1.12, -0.52, id);
    box(root, 0.4, 0.28, 0.06, C.glassDeep, 0.22, 1.12, -0.44, id);

    box(root, 0.7, 0.12, 0.55, C.navy, 0, 0.42, 0.32, id);
    box(root, 0.16, 0.55, 0.16, C.navyDark, -0.22, 0.28, 0.42, id);
    box(root, 0.16, 0.55, 0.16, C.navyDark, 0.22, 0.28, 0.42, id);
    box(root, 0.62, 0.5, 0.12, C.navy, 0, 0.82, 0.52, id);

    const pose = new THREE.Group();
    pose.position.set(0, 0, 0.3);
    pose.userData.seat = id;
    root.add(pose);

    box(pose, 0.18, 0.4, 0.18, hoodieDark, -0.16, 0.55, 0.04, id);
    box(pose, 0.18, 0.4, 0.18, hoodieDark, 0.16, 0.55, 0.04, id);
    box(pose, 0.7, 0.72, 0.42, hoodie, 0, 1.05, 0, id);
    box(pose, 0.18, 0.55, 0.18, hoodie, -0.48, 0.98, 0.02, id);
    box(pose, 0.18, 0.55, 0.18, hoodie, 0.48, 0.94, -0.02, id);
    box(pose, 0.62, 0.62, 0.62, C.skin, 0, 1.68, 0.02, id);
    if (id === "maya") {
      box(pose, 0.68, 0.22, 0.68, C.hair, 0, 2.02, 0, id);
      box(pose, 0.22, 0.22, 0.22, C.hair, -0.32, 1.94, 0.18, id);
      box(pose, 0.22, 0.22, 0.22, C.hair, 0.32, 1.94, 0.18, id);
      box(pose, 0.16, 0.16, 0.16, C.gold, 0.4, 1.7, 0.18, id);
      box(pose, 0.08, 0.08, 0.08, C.red, 0.4, 1.7, 0.28, id);
    } else {
      box(pose, 0.66, 0.18, 0.66, C.hair, 0, 2.0, 0, id);
      box(pose, 0.7, 0.1, 0.18, C.ink, 0, 1.68, 0.28, id);
    }
    box(pose, 0.1, 0.1, 0.06, C.ink, -0.14, 1.7, 0.32, id);
    box(pose, 0.1, 0.1, 0.06, C.ink, 0.14, 1.7, 0.32, id);

    box(pose, 0.14, 0.14, 0.28, C.gold, 0.55, 1.2, -0.22, id);
    box(pose, 0.12, 0.85, 0.12, C.gold, 0.55, 1.68, -0.42, id);
    box(pose, 0.12, 0.12, 0.7, C.gold, 0.55, 2.08, -0.82, id);
    box(pose, 0.16, 0.16, 0.16, C.red, 0.55, 2.08, -1.18, id);

    const tip = new THREE.Object3D();
    tip.position.set(0.55, 2.08, -1.22);
    pose.add(tip);

    const bobber = box(this.scene, 0.2, 0.2, 0.2, id === "maya" ? C.red : C.jules, tile.x, tile.y, tile.z);
    bobber.castShadow = false;
    const beads: THREE.Mesh[] = [];
    const lineColor = id === "maya" ? C.mayaDark : C.julesDark;
    for (let i = 0; i < BEADS; i++) {
      beads.push(box(this.scene, 0.1, 0.1, 0.1, lineColor, 0, 2, -2));
    }

    return { id, root, pose, tip, bobber, beads, lineColor, deskPad, yankT: 0, tile };
  }

  private updateLine(rig: SeatRig, seat: SeatSync): void {
    rig.tip.getWorldPosition(this.tmpA);
    const hooked = !seat.yanked;
    if (hooked) {
      this.tmpB.copy(rig.tile);
    } else {
      this.tmpB.copy(this.tmpA);
      this.tmpB.y += 0.2;
      this.tmpB.z += 0.7;
    }
    rig.bobber.position.copy(this.tmpB);
    rig.bobber.visible = hooked;
    const sag = hooked ? (seat.slack ? 1.35 : 0.22) : 0.04;
    this.tmpM.lerpVectors(this.tmpA, this.tmpB, 0.5);
    this.tmpM.y -= sag;
    const color = seat.selected ? C.gold : rig.lineColor;
    for (let i = 0; i < BEADS; i++) {
      const t = i / (BEADS - 1);
      const mt = 1 - t;
      const bead = rig.beads[i]!;
      bead.position.set(
        mt * mt * this.tmpA.x + 2 * mt * t * this.tmpM.x + t * t * this.tmpB.x,
        mt * mt * this.tmpA.y + 2 * mt * t * this.tmpM.y + t * t * this.tmpB.y,
        mt * mt * this.tmpA.z + 2 * mt * t * this.tmpM.z + t * t * this.tmpB.z,
      );
      bead.material = mat(color);
      bead.visible = hooked || i > BEADS * 0.55;
      const fat = seat.selected ? 0.12 : 0.09;
      bead.scale.setScalar(seat.slack && hooked ? fat * 0.85 : fat);
    }
  }
}
