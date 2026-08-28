import * as THREE from "three";
import type { SeatId } from "./quotes";
import type { Pose } from "./office";

/** Crossy Road / Qubicle palette as voxel face colors. */
const C = {
  ink: 0x140c08,
  paper: 0xf4e4c1,
  paper2: 0xc9a56e,
  foam: 0xfff6e8,
  red: 0xe31c3d,
  gold: 0xf0b429,
  maya: 0xff3d7a,
  mayaDark: 0xc2185b,
  jules: 0x1f8a7a,
  julesDark: 0x146056,
  navy: 0x1b2744,
  navyDark: 0x12182c,
  wood: 0xc4a574,
  woodDark: 0x6a4e2c,
  woodMid: 0x8a6a3e,
  wall: 0x5a3824,
  wallDark: 0x3a2418,
  wallDeep: 0x24140e,
  skin: 0xf3c7a1,
  hair: 0x2a1a12,
  green: 0x1f8a4c,
  green2: 0x176b38,
  green3: 0x2d9a58,
  water: 0x163a44,
  sky: 0x7ec8e8,
  sky2: 0xc8f0f8,
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
};

const BEADS = 16;

/** Orthographic vector-voxel office. The playfield is a 3D diorama. */
export class VoxelOffice {
  private host: HTMLElement;
  private scene = new THREE.Scene();
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private sun: THREE.DirectionalLight;
  private ray = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private tankTex: THREE.CanvasTexture | null = null;
  private tankGlass: THREE.Mesh;
  private tankOrigin = new THREE.Vector3(0, 2.55, -4.42);
  private tankSize = { w: 2.6, h: 1.35 };
  private splashMesh: THREE.Mesh;
  private splashUntil = 0;
  private seats = new Map<SeatId, SeatRig>();
  private ro: ResizeObserver;
  private onSelect: (id: SeatId) => void;
  private disposed = false;
  private tmpA = new THREE.Vector3();
  private tmpB = new THREE.Vector3();
  private tmpM = new THREE.Vector3();

  constructor(
    host: HTMLElement,
    opts: {
      seats: SeatId[];
      accountant: boolean;
      onSelect: (id: SeatId) => void;
    },
  ) {
    this.host = host;
    this.onSelect = opts.onSelect;
    this.scene.background = new THREE.Color(0x2a1a12);

    const view = 6.6;
    this.camera = new THREE.OrthographicCamera(-view, view, view, -view, 0.1, 80);
    const focus = new THREE.Vector3(0.15, 1.45, 0.7);
    const dist = 18;
    this.camera.position.set(focus.x + dist, focus.y + dist, focus.z + dist);
    this.camera.lookAt(focus);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(0x2a1a12, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = "voxel-canvas";
    host.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xf4e4c1, 0.72));
    this.sun = new THREE.DirectionalLight(0xfff6e8, 1.18);
    this.sun.position.set(-7, 16, 5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = -10;
    this.sun.shadow.camera.right = 10;
    this.sun.shadow.camera.top = 10;
    this.sun.shadow.camera.bottom = -10;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 40;
    this.scene.add(this.sun);

    this.buildRoom();
    this.tankGlass = this.buildTank();
    const splashMat = new THREE.MeshLambertMaterial({
      color: C.foam,
      flatShading: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    this.splashMesh = new THREE.Mesh(UNIT, splashMat);
    this.splashMesh.position.set(this.tankOrigin.x, this.tankOrigin.y, this.tankOrigin.z + 0.22);
    this.splashMesh.castShadow = false;
    this.splashMesh.visible = false;
    this.scene.add(this.splashMesh);

    if (opts.accountant) this.buildAccountant();

    const duo = opts.seats.length > 1;
    for (const id of opts.seats) {
      const pos =
        id === "maya"
          ? duo
            ? new THREE.Vector3(1.35, 0, 2.55)
            : new THREE.Vector3(0.35, 0, 2.45)
          : new THREE.Vector3(-1.45, 0, 1.35);
      this.seats.set(id, this.buildSeat(id, pos, id === "jules" ? 1.02 : duo ? 1.1 : 1.32));
    }

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    host.addEventListener("pointerdown", this.onPointer);
  }

  splash(): void {
    this.splashUntil = performance.now() + 380;
    this.splashMesh.visible = true;
    this.splashMesh.scale.set(0.45, 0.16, 0.45);
    (this.splashMesh.material as THREE.MeshLambertMaterial).opacity = 1;
  }

  sync(opts: {
    seats: SeatSync[];
    hook: { x: number; y: number } | null;
    tape: HTMLCanvasElement | null;
  }): void {
    if (this.disposed) return;
    if (opts.tape) this.paintTank(opts.tape);

    const t = performance.now();
    if (this.splashUntil > t) {
      const k = 1 - (this.splashUntil - t) / 380;
      const s = 0.4 + k * 1.6;
      this.splashMesh.visible = true;
      this.splashMesh.scale.set(s, 0.35 + k, s);
      (this.splashMesh.material as THREE.MeshLambertMaterial).opacity = 1 - k;
      (this.splashMesh.material as THREE.MeshLambertMaterial).transparent = true;
    } else {
      this.splashMesh.visible = false;
    }

    for (const seat of opts.seats) {
      const rig = this.seats.get(seat.id);
      if (!rig) continue;
      const bob = seat.pose === "swim" ? Math.sin(t / 220) * 0.06 : 0;
      rig.pose.position.y = bob;
      const targetX = seat.pose === "lean" || seat.slack ? -0.38 : seat.pose === "reeled" || seat.yanking ? 0.48 : 0;
      const targetZ = seat.pose === "lean" || seat.slack ? -0.08 : seat.pose === "reeled" || seat.yanking ? 0.12 : 0;
      rig.pose.rotation.x += (targetX - rig.pose.rotation.x) * 0.18;
      rig.pose.rotation.z += (targetZ - rig.pose.rotation.z) * 0.18;
      rig.deskPad.visible = seat.selected;
      this.updateLine(
        rig,
        seat,
        opts.hook,
        opts.seats.findIndex((s) => s.id === seat.id),
        opts.tape,
      );
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.ro.disconnect();
    this.host.removeEventListener("pointerdown", this.onPointer);
    this.tankTex?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
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
    const viewH = 6.55;
    this.camera.left = -viewH * aspect;
    this.camera.right = viewH * aspect;
    this.camera.top = viewH;
    this.camera.bottom = -viewH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.renderer.render(this.scene, this.camera);
  }

  private paintTank(canvas: HTMLCanvasElement): void {
    if (!this.tankTex) {
      this.tankTex = new THREE.CanvasTexture(canvas);
      this.tankTex.colorSpace = THREE.SRGBColorSpace;
      this.tankTex.minFilter = THREE.LinearFilter;
      this.tankTex.magFilter = THREE.LinearFilter;
      const mats = this.tankGlass.material as THREE.MeshLambertMaterial[];
      mats[4].map = this.tankTex;
      mats[4].color.set(0xffffff);
      mats[4].needsUpdate = true;
    }
    this.tankTex.needsUpdate = true;
  }

  private buildRoom(): void {
    const root = new THREE.Group();
    this.scene.add(root);

    for (let z = -4; z <= 4; z++) {
      for (let x = -3; x <= 3; x++) {
        const light = (x + z) % 2 === 0;
        box(root, 0.92, 0.3, 0.92, light ? C.paper : C.paper2, x, 0.15, z);
      }
    }

    box(root, 7.4, 4.3, 0.42, C.wall, 0, 2.25, -4.72);
    box(root, 7.4, 0.28, 0.48, C.wallDark, 0, 0.36, -4.72);
    box(root, 0.42, 4.3, 9.4, C.wallDark, -3.72, 2.25, 0);
    box(root, 0.48, 0.28, 9.4, C.ink, -3.72, 0.36, 0);
    box(root, 0.42, 4.3, 1.8, C.wallDeep, 3.72, 2.25, -3.8);
    box(root, 0.48, 0.28, 1.8, C.ink, 3.72, 0.36, -3.8);

    box(root, 0.9, 0.9, 0.12, C.sky, -3.48, 2.7, -2.2);
    box(root, 0.9, 0.9, 0.12, C.sky2, -3.48, 2.7, -1.2);
    box(root, 0.9, 0.9, 0.12, C.sky2, -3.48, 1.7, -2.2);
    box(root, 0.9, 0.9, 0.12, C.sky, -3.48, 1.7, -1.2);
    box(root, 0.12, 2.1, 0.12, C.ink, -3.44, 2.2, -1.7);
    box(root, 2.05, 0.12, 0.12, C.ink, -3.44, 2.2, -1.7);

    box(root, 0.7, 0.7, 0.16, C.foam, 2.55, 3.15, -4.48);
    box(root, 0.18, 0.22, 0.08, C.ink, 2.55, 3.28, -4.38);
    box(root, 0.22, 0.08, 0.08, C.red, 2.68, 3.15, -4.38);

    this.plant(root, -2.85, -3.7);
    this.plant(root, 2.9, -3.55);
    this.plant(root, -2.9, 3.4);

    box(root, 0.55, 1.15, 0.55, C.navy, -2.9, 0.7, 2.35);
    box(root, 0.42, 0.38, 0.42, C.sky, -2.9, 1.48, 2.35);
    box(root, 0.22, 0.18, 0.22, C.sky2, -2.9, 1.72, 2.35);
    box(root, 0.16, 0.22, 0.16, C.gold, -2.72, 0.85, 2.35);

    box(root, 0.7, 1.35, 0.7, C.wood, 2.95, 0.8, 2.6);
    box(root, 0.5, 0.16, 0.12, C.paper, 2.95, 1.05, 2.28);
    box(root, 0.5, 0.16, 0.12, C.paper2, 2.95, 0.72, 2.28);
    box(root, 0.1, 0.1, 0.08, C.gold, 2.95, 1.05, 2.22);
    box(root, 0.1, 0.1, 0.08, C.gold, 2.95, 0.72, 2.22);
  }

  private plant(parent: THREE.Object3D, x: number, z: number): void {
    box(parent, 0.48, 0.38, 0.48, C.woodMid, x, 0.31, z);
    box(parent, 0.55, 0.18, 0.55, C.woodDark, x, 0.48, z);
    box(parent, 0.55, 0.55, 0.55, C.green, x, 0.88, z);
    box(parent, 0.4, 0.4, 0.4, C.green2, x + 0.28, 1.12, z);
    box(parent, 0.38, 0.38, 0.38, C.green3, x - 0.22, 1.18, z + 0.18);
    box(parent, 0.32, 0.32, 0.32, C.green, x, 1.42, z - 0.12);
  }

  private buildTank(): THREE.Mesh {
    const g = new THREE.Group();
    this.scene.add(g);
    const { w, h } = this.tankSize;
    const z = this.tankOrigin.z;
    const y = this.tankOrigin.y;
    box(g, w + 0.28, 0.16, 0.42, C.gold, 0, y + h / 2 + 0.08, z);
    box(g, w + 0.28, 0.16, 0.42, C.gold, 0, y - h / 2 - 0.08, z);
    box(g, 0.16, h + 0.16, 0.42, C.gold, -w / 2 - 0.08, y, z);
    box(g, 0.16, h + 0.16, 0.42, C.gold, w / 2 + 0.08, y, z);
    box(g, w, h, 0.28, C.water, 0, y, z - 0.06);
    box(g, w * 0.9, 0.14, 0.2, C.woodMid, 0, y - h / 2 + 0.12, z + 0.04);

    const glassMats = [
      mat(C.navy),
      mat(C.navy),
      mat(C.navy),
      mat(C.navy),
      new THREE.MeshLambertMaterial({ color: 0x1a4a52, flatShading: true }),
      mat(C.navyDark),
    ];
    const glass = new THREE.Mesh(UNIT, glassMats);
    glass.scale.set(w, h, 0.08);
    glass.position.set(0, y, z + 0.16);
    g.add(glass);
    return glass;
  }

  private buildAccountant(): void {
    const g = new THREE.Group();
    g.position.set(-2.55, 0, -2.4);
    this.scene.add(g);
    box(g, 0.7, 0.08, 0.7, C.ink, 0, 0.04, 0);
    box(g, 0.55, 0.7, 0.4, C.navy, 0, 0.55, 0);
    box(g, 0.48, 0.48, 0.48, C.skin, 0, 1.12, 0);
    box(g, 0.52, 0.1, 0.18, C.ink, 0, 1.12, 0.2);
    box(g, 0.45, 0.35, 0.45, C.foam, 0.55, 0.38, 0.15);
  }

  private buildSeat(id: SeatId, pos: THREE.Vector3, scale: number): SeatRig {
    const hoodie = id === "maya" ? C.maya : C.jules;
    const hoodieDark = id === "maya" ? C.mayaDark : C.julesDark;
    const root = new THREE.Group();
    root.position.copy(pos);
    root.scale.setScalar(scale);
    root.userData.seat = id;
    this.scene.add(root);

    const deskPad = box(root, 1.35, 0.06, 1.15, C.gold, 0, 0.04, -0.15, id);
    deskPad.visible = false;

    box(root, 1.25, 0.14, 0.85, C.wood, 0, 0.78, -0.22, id);
    box(root, 0.12, 0.72, 0.12, C.woodDark, -0.48, 0.38, -0.48, id);
    box(root, 0.12, 0.72, 0.12, C.woodDark, 0.48, 0.38, -0.48, id);
    box(root, 0.12, 0.72, 0.12, C.woodDark, -0.48, 0.38, 0.05, id);
    box(root, 0.12, 0.72, 0.12, C.woodDark, 0.48, 0.38, 0.05, id);
    box(root, 0.42, 0.38, 0.12, C.navy, 0.28, 1.08, -0.48, id);
    box(root, 0.34, 0.24, 0.06, C.water, 0.28, 1.08, -0.41, id);
    box(root, 0.16, 0.18, 0.16, C.foam, -0.38, 0.95, -0.05, id);
    box(root, 0.06, 0.12, 0.06, C.foam, -0.48, 0.95, -0.05, id);
    box(root, 0.1, 0.05, 0.1, C.gold, -0.38, 1.07, -0.05, id);

    const pose = new THREE.Group();
    pose.position.set(0, 0, 0.28);
    pose.userData.seat = id;
    root.add(pose);

    box(pose, 0.85, 0.08, 0.55, C.ink, 0, 0.05, 0.02, id);
    box(pose, 0.18, 0.42, 0.18, hoodieDark, -0.16, 0.32, 0.04, id);
    box(pose, 0.18, 0.42, 0.18, hoodieDark, 0.16, 0.32, 0.04, id);
    box(pose, 0.7, 0.72, 0.42, hoodie, 0, 0.88, 0, id);
    box(pose, 0.18, 0.55, 0.18, hoodie, -0.48, 0.82, 0.02, id);
    box(pose, 0.18, 0.55, 0.18, hoodie, 0.48, 0.78, -0.02, id);
    box(pose, 0.62, 0.62, 0.62, C.skin, 0, 1.52, 0.02, id);
    if (id === "maya") {
      box(pose, 0.68, 0.22, 0.68, C.hair, 0, 1.86, 0, id);
      box(pose, 0.22, 0.22, 0.22, C.hair, -0.32, 1.78, 0.18, id);
      box(pose, 0.22, 0.22, 0.22, C.hair, 0.32, 1.78, 0.18, id);
      box(pose, 0.16, 0.16, 0.16, C.gold, 0.4, 1.55, 0.18, id);
      box(pose, 0.08, 0.08, 0.08, C.red, 0.4, 1.55, 0.28, id);
    } else {
      box(pose, 0.66, 0.18, 0.66, C.hair, 0, 1.84, 0, id);
      box(pose, 0.7, 0.1, 0.18, C.ink, 0, 1.52, 0.28, id);
    }
    box(pose, 0.1, 0.1, 0.06, C.ink, -0.14, 1.54, 0.32, id);
    box(pose, 0.1, 0.1, 0.06, C.ink, 0.14, 1.54, 0.32, id);

    box(pose, 0.14, 0.14, 0.28, C.gold, 0.55, 1.05, -0.22, id);
    box(pose, 0.12, 0.85, 0.12, C.gold, 0.55, 1.52, -0.42, id);
    box(pose, 0.12, 0.12, 0.7, C.gold, 0.55, 1.92, -0.82, id);
    box(pose, 0.16, 0.16, 0.16, C.red, 0.55, 1.92, -1.18, id);

    const tip = new THREE.Object3D();
    tip.position.set(0.55, 1.92, -1.22);
    pose.add(tip);

    const bobber = box(this.scene, 0.22, 0.22, 0.22, id === "maya" ? C.red : C.jules, 0, 2.4, -4.2);
    bobber.castShadow = false;
    const beads: THREE.Mesh[] = [];
    const lineColor = id === "maya" ? C.mayaDark : C.julesDark;
    for (let i = 0; i < BEADS; i++) {
      beads.push(box(this.scene, 0.1, 0.1, 0.1, lineColor, 0, 2, -2));
    }

    return { id, root, pose, tip, bobber, beads, lineColor, deskPad };
  }

  private updateLine(
    rig: SeatRig,
    seat: SeatSync,
    hook: { x: number; y: number } | null,
    index: number,
    tape: HTMLCanvasElement | null,
  ): void {
    rig.tip.getWorldPosition(this.tmpA);
    const hooked = !seat.yanked;
    if (hooked) {
      const tw = tape && tape.clientWidth > 2 ? tape.clientWidth : tape?.width || 256;
      const th = tape && tape.clientHeight > 2 ? tape.clientHeight : tape?.height || 128;
      const u = hook ? hook.x / tw : 0.62 + index * 0.12;
      const v = hook ? hook.y / th : 0.55;
      this.tmpB.set(
        this.tankOrigin.x + (u - 0.5) * this.tankSize.w * 0.82,
        this.tankOrigin.y + (0.5 - v) * this.tankSize.h * 0.72,
        this.tankOrigin.z + 0.28,
      );
    } else {
      this.tmpB.copy(this.tmpA);
      this.tmpB.x += 0.35;
      this.tmpB.y -= 0.15;
      this.tmpB.z += 0.55;
    }
    rig.bobber.position.copy(this.tmpB);
    rig.bobber.visible = true;
    rig.bobber.scale.setScalar(hooked ? 1 : 1.25);

    const sag = hooked ? (seat.slack ? 1.45 : 0.28) : 0.05;
    this.tmpM.lerpVectors(this.tmpA, this.tmpB, 0.5);
    this.tmpM.y -= sag;
    const selected = seat.selected;
    const color = selected ? C.gold : rig.lineColor;
    for (let i = 0; i < BEADS; i++) {
      const t = i / (BEADS - 1);
      const mt = 1 - t;
      const x = mt * mt * this.tmpA.x + 2 * mt * t * this.tmpM.x + t * t * this.tmpB.x;
      const y = mt * mt * this.tmpA.y + 2 * mt * t * this.tmpM.y + t * t * this.tmpB.y;
      const z = mt * mt * this.tmpA.z + 2 * mt * t * this.tmpM.z + t * t * this.tmpB.z;
      const bead = rig.beads[i]!;
      bead.position.set(x, y, z);
      bead.material = mat(color);
      const fat = selected ? 0.13 : 0.09;
      bead.scale.set(seat.slack && hooked ? fat : fat * 1.15, fat, fat);
    }
  }
}
