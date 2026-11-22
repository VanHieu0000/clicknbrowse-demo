/* Click n Browse - "One Device, Three Lives" 3D story
   Box (sealed)  -> Buy: unboxed, screen clicks on
                 -> Repair: screen cracks, shatters, heals in mint light
                 -> Sell: scan line values the phone (price mirrors the form)
                 -> Loop: three coloured arcs close the circle                     */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const CNB = window.CNB;
const canvas = document.getElementById('stage');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { CNB.finishLoad(); throw e; }

const isMobile = () => innerWidth < 900;
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile() ? 1.6 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
camera.position.set(0, 0, 11);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

const COL = { buy: new THREE.Color('#3D6BFF'), repair: new THREE.Color('#2EE6A8'), sell: new THREE.Color('#FF6A1F') };
const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(3, 5, 6); scene.add(key);
const rimA = new THREE.PointLight(COL.buy.clone(), 40, 20); rimA.position.set(-4, 2, 2); scene.add(rimA);
const rimB = new THREE.PointLight(COL.buy.clone(), 30, 20); rimB.position.set(4, -3, 1); scene.add(rimB);

/* ================= phone ================= */
const W = 1.52, H = 3.12, D = .17, SW = W - .12, SH = H - .12;
const rig = new THREE.Group(); scene.add(rig);
const phone = new THREE.Group(); rig.add(phone);

const metal = new THREE.MeshPhysicalMaterial({ color: 0x2b3352, metalness: .9, roughness: .26, clearcoat: 1, clearcoatRoughness: .12 });
phone.add(new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 8, .2), metal));
const glass = new THREE.Mesh(new RoundedBoxGeometry(W - .03, H - .03, .012, 4, .19),
  new THREE.MeshPhysicalMaterial({ color: 0x030408, metalness: 0, roughness: .04, clearcoat: 1 }));
glass.position.z = D / 2; phone.add(glass);
// camera module
const camMod = new THREE.Mesh(new RoundedBoxGeometry(.66, .66, .06, 4, .14), metal);
camMod.position.set(-W / 2 + .44, H / 2 - .44, -D / 2 - .02); phone.add(camMod);
const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x05070d, metalness: .3, roughness: .05, clearcoat: 1 });
[[-.14, .14], [.14, .14], [-.14, -.14]].forEach(([x, y]) => {
  const l = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .05, 32), lensMat);
  l.rotation.x = Math.PI / 2; l.position.set(camMod.position.x + x, camMod.position.y + y, -D / 2 - .06); phone.add(l);
});
[[.62, .5], [.95, .3]].forEach(([y, h]) => {
  const b = new THREE.Mesh(new RoundedBoxGeometry(.03, h, .06, 2, .012), metal);
  b.position.set(W / 2 + .008, y, 0); phone.add(b);
});

/* ---------- screen canvas ---------- */
const sc = document.createElement('canvas'); sc.width = 600; sc.height = Math.round(600 * SH / SW);
const g = sc.getContext('2d');
const tex = new THREE.CanvasTexture(sc);
tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
const screenMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false });

const imgs = {};
['phone-dark', 'laptop', 'tv', 'unbox'].forEach(n => { const i = new Image(); i.src = `assets/${n}.jpg`; i.onload = () => { needDraw = true; }; imgs[n] = i; });

/* ---------- shards: the screen is built from pieces so it can break ---------- */
const shards = [];
(function buildShards() {
  const cols = 5, rows = 10, pts = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  for (let j = 0; j <= rows; j++) {
    pts[j] = [];
    for (let i = 0; i <= cols; i++) {
      let x = -SW / 2 + SW * i / cols, y = -SH / 2 + SH * j / rows;
      if (i > 0 && i < cols) x += rnd(-.09, .09);
      if (j > 0 && j < rows) y += rnd(-.09, .09);
      pts[j][i] = new THREE.Vector2(x, y);
    }
  }
  const make = (a, b, c) => {
    const cx = (a.x + b.x + c.x) / 3, cy = (a.y + b.y + c.y) / 3;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([a.x - cx, a.y - cy, 0, b.x - cx, b.y - cy, 0, c.x - cx, c.y - cy, 0], 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([a.x / SW + .5, a.y / SH + .5, b.x / SW + .5, b.y / SH + .5, c.x / SW + .5, c.y / SH + .5], 2));
    const m = new THREE.Mesh(geo, screenMat);
    m.position.set(cx, cy, D / 2 + .01);
    m.userData = { cx, cy, dx: cx * 1.1 + rnd(-.35, .35), dy: cy * .55 + rnd(-.35, .35), dz: rnd(.8, 2.2), rx: rnd(-3, 3), ry: rnd(-3, 3), rz: rnd(-2, 2), delay: Math.hypot(cx - .3, cy - .5) * .12 };
    phone.add(m); shards.push(m);
  };
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const p00 = pts[j][i], p10 = pts[j][i + 1], p01 = pts[j + 1][i], p11 = pts[j + 1][i + 1];
    if ((i + j) % 2) { make(p00, p10, p11); make(p00, p11, p01); } else { make(p00, p10, p01); make(p10, p11, p01); }
  }
})();

/* heal sweep + scan line */
const add = (color, opacity = 0) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
const healGlow = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), add(COL.repair)); healGlow.position.z = D / 2 + .03; phone.add(healGlow);
const healLine = new THREE.Mesh(new THREE.PlaneGeometry(SW * 1.3, .05), add(0xbfffea)); healLine.position.z = D / 2 + .04; phone.add(healLine);
const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(SW * 1.35, .035), add(0xffc7a8)); scanLine.position.z = D / 2 + .05; phone.add(scanLine);
const scanBand = new THREE.Mesh(new THREE.PlaneGeometry(SW * 1.2, .5), add(COL.sell)); scanBand.position.z = D / 2 + .04; phone.add(scanBand);

/* ================= the box (sleeve) ================= */
const BW = 1.86, BH = 3.5, BD = .46, T = .03;
const sleeve = new THREE.Group(); rig.add(sleeve);
const lc = document.createElement('canvas'); lc.width = 512; lc.height = Math.round(512 * BH / BW);
const boxTex = new THREE.CanvasTexture(lc); boxTex.colorSpace = THREE.SRGBColorSpace;
function drawBox() {
  const c = lc.getContext('2d'), w = lc.width, h = lc.height;
  const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#111a3a'); gr.addColorStop(1, '#070a16');
  c.fillStyle = gr; c.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * .42, r = 92;
  c.lineWidth = 18; c.lineCap = 'round';
  [['#3D6BFF', 0], ['#2EE6A8', 1], ['#FF6A1F', 2]].forEach(([col, i]) => {
    c.strokeStyle = col; c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2 + i * 2.094 + .18, -Math.PI / 2 + (i + 1) * 2.094 - .18); c.stroke();
  });
  c.fillStyle = '#EEF1FA'; c.beginPath(); c.arc(cx, cy, 24, 0, 7); c.fill();
  c.textAlign = 'center'; c.fillStyle = '#EEF1FA';
  c.font = '700 54px "Space Grotesk", sans-serif'; c.fillText('Click n Browse', cx, cy + 190);
  c.font = '500 24px "JetBrains Mono", monospace'; c.fillStyle = '#8D96B0'; c.fillText('BUY  /  REPAIR  /  SELL', cx, cy + 240);
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; c.strokeRect(24, 24, w - 48, h - 48);
  boxTex.needsUpdate = true;
}
const boxMat = new THREE.MeshStandardMaterial({ color: 0x0c1226, roughness: .55, metalness: .25, transparent: true });
const boxFront = new THREE.MeshStandardMaterial({ map: boxTex, roughness: .45, metalness: .1, transparent: true });
const wall = (w, h, d, x, y, z, m = boxMat) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); sleeve.add(o); return o; };
wall(BW, BH, T, 0, 0, BD / 2, [boxMat, boxMat, boxMat, boxMat, boxFront, boxMat]);
wall(BW, BH, T, 0, 0, -BD / 2); wall(T, BH, BD, -BW / 2, 0, 0); wall(T, BH, BD, BW / 2, 0, 0); wall(BW, T, BD, 0, -BH / 2, 0);
const lid = new THREE.Mesh(new THREE.BoxGeometry(BW + .04, .2, BD + .04), boxMat); lid.position.y = BH / 2 + .08; sleeve.add(lid);
const edge = new THREE.Mesh(new THREE.BoxGeometry(BW + .05, .012, BD + .05), add(COL.buy, .9)); edge.position.y = BH / 2 - .03; sleeve.add(edge);

/* ================= the loop ring ================= */
class Arc extends THREE.Curve {
  constructor(r, a0, len) { super(); this.r = r; this.a0 = a0; this.len = len; }
  getPoint(t, o = new THREE.Vector3()) { const a = this.a0 + t * this.len; return o.set(Math.cos(a) * this.r, Math.sin(a) * this.r, 0); }
}
const ring = new THREE.Group(); scene.add(ring);
const arcs = [];
[COL.buy, COL.repair, COL.sell].forEach((c, i) => {
  const a0 = Math.PI / 2 - i * (Math.PI * 2 / 3) - .12, len = -(Math.PI * 2 / 3 - .24);
  const core = new THREE.Mesh(new THREE.TubeGeometry(new Arc(2.35, a0, len), 120, .035, 12), new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
  const glow = new THREE.Mesh(new THREE.TubeGeometry(new Arc(2.35, a0, len), 120, .16, 12), add(c, .22));
  ring.add(core, glow); arcs.push([core, glow]);
});

/* ================= screen drawing ================= */
const crackPaths = (() => {
  const paths = [], ix = sc.width * .63, iy = sc.height * .33;
  for (let k = 0; k < 13; k++) {
    let a = k / 13 * Math.PI * 2 + Math.random() * .4, x = ix, y = iy; const p = [[x, y]];
    const L = 250 + Math.random() * 750;
    for (let s = 0; s < L; s += 30 + Math.random() * 40) { a += (Math.random() - .5) * .5; x += Math.cos(a) * 40; y += Math.sin(a) * 40; p.push([x, y]); }
    paths.push(p);
  }
  [38, 86].forEach(r => { const p = []; for (let a = 0; a <= 6.4; a += .4) p.push([ix + Math.cos(a) * r * (0.8 + Math.random() * .4), iy + Math.sin(a) * r * (0.8 + Math.random() * .4)]); paths.push(p); });
  return paths;
})();

function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function cover(img, x, y, w, h, r) {
  g.save(); rr(x, y, w, h, r); g.clip();
  if (img && img.complete && img.naturalWidth) {
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * s, ih = img.naturalHeight * s;
    g.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  } else { g.fillStyle = '#1a2240'; g.fillRect(x, y, w, h); }
  g.restore();
}
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const F = (w, s, f = 'Inter') => `${w} ${s}px "${f}", sans-serif`;

function statusBar(dark = true) {
  g.fillStyle = dark ? '#EEF1FA' : '#0b1020';
  g.font = F(600, 26); g.textAlign = 'left'; g.fillText('9:41', 52, 62);
  g.textAlign = 'right'; g.fillText('5G  100%', sc.width - 52, 62);
  g.fillStyle = '#000'; rr(sc.width / 2 - 70, 26, 140, 42, 21); g.fill();
}
function logo(x, y, r, lw) {
  g.lineWidth = lw; g.lineCap = 'round';
  ['#3D6BFF', '#2EE6A8', '#FF6A1F'].forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(x, y, r, -1.57 + i * 2.094 + .2, -1.57 + (i + 1) * 2.094 - .2); g.stroke(); });
}

function drawScreen(mode, crack, heal) {
  const w = sc.width, h = sc.height;
  g.clearRect(0, 0, w, h);
  g.save(); rr(0, 0, w, h, 66); g.clip();
  if (mode === 'off') {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0a0d18'); gr.addColorStop(.5, '#03040a'); gr.addColorStop(1, '#0a0d18');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  if (mode === 'buy') {
    g.fillStyle = '#070A14'; g.fillRect(0, 0, w, h); statusBar();
    logo(70, 128, 18, 6); g.fillStyle = '#EEF1FA'; g.font = F(700, 34, 'Space Grotesk'); g.textAlign = 'left'; g.fillText('Click n Browse', 104, 140);
    g.fillStyle = '#141A2E'; rr(40, 176, w - 80, 66, 33); g.fill();
    g.fillStyle = '#8D96B0'; g.font = F(500, 24); g.fillText('Search mobiles, laptops, TVs...', 76, 218);
    [['Buy', '#3D6BFF', 1], ['Sell', '#FF6A1F', 0], ['Repair', '#2EE6A8', 0]].forEach(([t, c, on], i) => {
      const x = 40 + i * 176; g.fillStyle = on ? c : 'transparent'; g.strokeStyle = on ? c : 'rgba(255,255,255,.18)'; g.lineWidth = 2;
      rr(x, 266, 164, 56, 28); g.fill(); g.stroke(); g.fillStyle = on ? '#fff' : c; g.font = F(600, 24); g.textAlign = 'center'; g.fillText(t, x + 82, 303);
    });
    const bg = g.createLinearGradient(40, 350, w - 40, 560); bg.addColorStop(0, '#3D6BFF'); bg.addColorStop(1, '#7a3dff');
    g.fillStyle = bg; rr(40, 348, w - 80, 220, 30); g.fill();
    g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = F(700, 40, 'Space Grotesk'); g.fillText('Mega Electronics', 72, 420); g.fillText('Days', 72, 466);
    g.font = F(500, 24); g.fillText('Up to 40% off + no-cost EMI', 72, 520);
    const cards = [['phone-dark', 'Galaxy S24 FE', 38999], ['laptop', 'Ultrabook 14"', 54490], ['tv', '55" 4K Smart TV', 41990], ['unbox', 'Redmi Note 13', 17999]];
    cards.forEach(([im, n, p], i) => {
      const cw = (w - 100) / 2, x = 40 + (i % 2) * (cw + 20), y = 600 + Math.floor(i / 2) * 330;
      g.fillStyle = '#10162a'; rr(x, y, cw, 310, 24); g.fill();
      cover(imgs[im], x + 10, y + 10, cw - 20, 180, 16);
      g.fillStyle = '#EEF1FA'; g.font = F(600, 23); g.fillText(n, x + 18, y + 228);
      g.fillStyle = '#3D6BFF'; g.font = F(700, 26, 'JetBrains Mono'); g.fillText(inr(p), x + 18, y + 270);
    });
    g.fillStyle = '#0d1222'; g.fillRect(0, h - 110, w, 110);
    ['Home', 'Deals', 'Cart', 'Me'].forEach((t, i) => { g.fillStyle = i ? '#8D96B0' : '#3D6BFF'; g.font = F(600, 22); g.textAlign = 'center'; g.fillText(t, w / 8 + i * w / 4, h - 48); });
  }
  if (mode === 'repair') {
    g.fillStyle = '#04130e'; g.fillRect(0, 0, w, h); statusBar();
    g.textAlign = 'left'; g.fillStyle = '#2EE6A8'; g.font = F(500, 24, 'JetBrains Mono'); g.fillText('REPAIR  #CNB-R2041', 52, 140);
    g.fillStyle = '#EEF1FA'; g.font = F(700, 52, 'Space Grotesk'); g.fillText('Good as new.', 52, 212);
    const cx = w / 2, cy = 420; g.strokeStyle = 'rgba(46,230,168,.18)'; g.lineWidth = 16; g.beginPath(); g.arc(cx, cy, 120, 0, 7); g.stroke();
    g.strokeStyle = '#2EE6A8'; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy, 120, -1.57, -1.57 + 6.283 * Math.min(1, heal)); g.stroke();
    g.lineWidth = 14; g.beginPath(); g.moveTo(cx - 48, cy + 4); g.lineTo(cx - 12, cy + 40); g.lineTo(cx + 54, cy - 36); g.stroke();
    ['Picked up', 'Diagnosed', 'Repaired', 'Delivered'].forEach((t, i) => {
      const y = 640 + i * 108, done = heal > (i + 1) / 5;
      g.fillStyle = done ? '#2EE6A8' : 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(82, y, 16, 0, 7); g.fill();
      if (i < 3) { g.fillRect(80, y + 16, 4, 76); }
      g.fillStyle = done ? '#EEF1FA' : '#5d6a80'; g.font = F(600, 30); g.fillText(t, 124, y + 10);
    });
    g.fillStyle = 'rgba(46,230,168,.12)'; rr(40, h - 190, w - 80, 120, 26); g.fill();
    g.fillStyle = '#2EE6A8'; g.font = F(600, 26); g.textAlign = 'center'; g.fillText('90-day warranty active', w / 2, h - 120);
  }
  if (mode === 'sell') {
    g.fillStyle = '#120804'; g.fillRect(0, 0, w, h); statusBar();
    const bg = g.createRadialGradient(w / 2, h * .38, 10, w / 2, h * .38, w); bg.addColorStop(0, 'rgba(255,106,31,.35)'); bg.addColorStop(1, 'transparent');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.fillStyle = '#FF6A1F'; g.font = F(500, 24, 'JetBrains Mono'); g.fillText('INSTANT VALUATION', w / 2, 170);
    g.fillStyle = '#EEF1FA'; g.font = F(600, 34); g.fillText(CNB.model + '  /  ' + CNB.cond, w / 2, 236);
    g.fillStyle = '#8D96B0'; g.font = F(500, 26); g.fillText('We pay you', w / 2, 420);
    g.fillStyle = '#FF6A1F'; g.font = F(700, 92, 'JetBrains Mono'); g.fillText(inr(CNB.shown), w / 2, 520);
    [['IMEI check', 'Verified'], ['Body', CNB.cond], ['Payment', 'UPI, same day']].forEach(([a, b], i) => {
      const y = 650 + i * 96; g.fillStyle = 'rgba(255,255,255,.05)'; rr(40, y, w - 80, 78, 20); g.fill();
      g.textAlign = 'left'; g.fillStyle = '#8D96B0'; g.font = F(500, 24); g.fillText(a, 70, y + 48);
      g.textAlign = 'right'; g.fillStyle = '#EEF1FA'; g.font = F(600, 24); g.fillText(b, w - 70, y + 48);
    });
    g.fillStyle = '#FF6A1F'; rr(40, h - 180, w - 80, 96, 48); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = F(700, 30); g.fillText('Sell now', w / 2, h - 120);
  }
  if (mode === 'loop') {
    g.fillStyle = '#070A14'; g.fillRect(0, 0, w, h); statusBar();
    logo(w / 2, h * .36, 130, 26);
    g.fillStyle = '#EEF1FA'; g.beginPath(); g.arc(w / 2, h * .36, 30, 0, 7); g.fill();
    g.textAlign = 'center'; g.font = F(700, 50, 'Space Grotesk'); g.fillText('Exchange done', w / 2, h * .6);
    g.fillStyle = '#8D96B0'; g.font = F(500, 28); g.fillText('Old phone sold, new phone on the way', w / 2, h * .6 + 56);
    g.fillStyle = '#FF6A1F'; g.font = F(700, 40, 'JetBrains Mono'); g.fillText('You saved ' + inr(14200), w / 2, h * .6 + 150);
  }
  if (crack > .01) {
    g.lineJoin = 'round';
    crackPaths.forEach((p, k) => {
      const n = Math.max(2, Math.floor(p.length * Math.min(1, crack * 1.4 - k * .02)));
      g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < n && i < p.length; i++) g.lineTo(p[i][0], p[i][1]);
      g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 6; g.stroke();
      g.strokeStyle = `rgba(255,255,255,${.85 * crack})`; g.lineWidth = 2.2; g.stroke();
    });
    g.fillStyle = `rgba(0,0,0,${.35 * crack})`; g.fillRect(0, 0, w, h);
  }
  g.restore();
  tex.needsUpdate = true;
}

/* ================= story states ================= */
const DEF = { x: 0, y: 0, rx: 0, ry: 0, rz: 0, s: 1, sleeve: 0, screen: 0, crack: 0, explode: 0, heal: 0, scan: 0, ring: 0, fade: 1 };
const KEYS = Object.keys(DEF);
let segments = [], P = { ...DEF };

function buildStory() {
  segments.forEach(s => s.st.kill());
  const m = isMobile(), R = m ? 0 : 2.2, L = m ? 0 : -2.2, Y = m ? 1.05 : 0;
  const hero = { ...DEF, x: m ? 0 : 2.4, y: m ? 1.25 : -.05, rx: .2, ry: -.62, rz: .06 };
  const buy = { ...DEF, x: R, y: Y, rx: .06, ry: -.34, sleeve: 1, screen: 1 };
  const r0 = { ...buy, x: L, ry: .34 };
  const r1 = { ...r0, crack: 1, rz: -.04 };
  const r2 = { ...r1, explode: 1, rx: .2, ry: .05 };
  const r3 = { ...r2, explode: 0, crack: 0, heal: 1, rx: .05, ry: .34, rz: 0 };
  const s0 = { ...r3, x: R, ry: -.34, scan: 1 };
  const l0 = { ...s0, x: 0, y: m ? .1 : -.3, ry: -.34 + Math.PI * 2, scan: 0, ring: 1, s: m ? .85 : .74 };
  const out = { ...l0, fade: 0, s: .7, y: l0.y + .8 };
  const seg = (trigger, start, end, keys, endTrigger) => {
    const st = ScrollTrigger.create({ trigger, start, end, endTrigger });
    segments.push({ st, keys });
  };
  segments = [];
  seg('#buy', 'top bottom', 'top 25%', [[hero], [buy, 1]]);
  seg('#repair', 'top bottom', m ? 'top -25%' : 'bottom bottom', [[buy], [r0, 1], [r1, .7], [r2, 1], [r3, 1.2], [r3, .4]]);
  seg('#sell', 'top bottom', 'top 25%', [[r3], [s0, 1]]);
  seg('#loop', 'top bottom', 'center center', [[s0], [l0, 1]]);
  seg('#plus', 'top bottom', 'top 35%', [[l0], [out, 1]]);
  segments.hero = hero;
}
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function evalStory(y) {
  let seg = null;
  for (const s of segments) if (y >= s.st.start) seg = s;
  if (!seg) { Object.assign(P, segments.hero); return; }
  const p = Math.min(1, Math.max(0, (y - seg.st.start) / Math.max(1, seg.st.end - seg.st.start)));
  const ks = seg.keys, total = ks.slice(1).reduce((a, k) => a + k[1], 0);
  let t = p * total, i = 1;
  while (i < ks.length - 1 && t > ks[i][1]) { t -= ks[i][1]; i++; }
  const a = ks[i - 1][0], b = ks[i][0], k = ease(Math.min(1, t / ks[i][1]));
  for (const n of KEYS) P[n] = a[n] + (b[n] - a[n]) * k;
}

/* ================= apply + render ================= */
let needDraw = true, lastKey = '', intro = { v: 0 }, sy = scrollY, mx = 0, my = 0, tmx = 0, tmy = 0;
const clock = new THREE.Clock();
addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5; }, { passive: true });

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.position.z = w / h < .8 ? 13.5 : 11;
  camera.updateProjectionMatrix();
}
addEventListener('resize', () => { resize(); buildStory(); ScrollTrigger.refresh(); });

const tmpC = new THREE.Color();
function frame() {
  const dt = Math.min(.5, clock.getDelta()), t = clock.elapsedTime;
  sy += (scrollY - sy) * (1 - Math.exp(-dt * 7));
  evalStory(sy);
  mx += (tmx - mx) * .05; my += (tmy - my) * .05;

  const base = isMobile() ? .74 : 1;
  rig.position.set(P.x, P.y + Math.sin(t * 1.1) * .06, 0);
  rig.rotation.set(P.rx + my * .18, P.ry + mx * .3 + Math.sin(t * .5) * .04, P.rz);
  rig.scale.setScalar(P.s * base * (.55 + .45 * intro.v));
  canvas.style.opacity = P.fade;

  // box opens: lid flies, sleeve drops
  const sv = P.sleeve;
  sleeve.position.y = -sv * 6.5;
  lid.position.y = BH / 2 + .08 + sv * 9.2; lid.rotation.z = sv * .7;
  const bo = 1 - Math.min(1, sv * 1.4);
  boxMat.opacity = bo; boxFront.opacity = bo; edge.material.opacity = .9 * bo;
  sleeve.visible = bo > .01;
  phone.position.y = sv < 1 ? -(1 - sv) * .12 : 0;

  // screen click-on
  screenMat.color.setScalar(.04 + .96 * P.screen);

  // shatter
  const e = P.explode;
  for (const m of shards) {
    const u = m.userData, k = Math.max(0, Math.min(1, e * 1.25 - u.delay)), kk = k * k * (3 - 2 * k);
    m.position.set(u.cx + u.dx * kk, u.cy + u.dy * kk, D / 2 + .01 + u.dz * kk);
    m.rotation.set(u.rx * kk, u.ry * kk, u.rz * kk);
  }
  // heal sweep
  const hs = P.heal;
  healLine.position.y = -SH / 2 + hs * SH;
  healLine.material.opacity = Math.sin(Math.min(1, hs) * Math.PI) * (P.scan < .2 ? 1 : 0);
  healGlow.material.opacity = Math.sin(Math.min(1, hs) * Math.PI) * .35 * (P.scan < .2 ? 1 : 0);
  // scan
  const sp = (t * .45) % 1;
  scanLine.position.y = SH / 2 - sp * SH; scanBand.position.y = scanLine.position.y + .25;
  scanLine.material.opacity = P.scan * (P.ring < .3 ? 1 : 0);
  scanBand.material.opacity = P.scan * .25 * (P.ring < .3 ? 1 : 0);
  // ring
  const rp = P.ring;
  ring.visible = rp > .01;
  ring.position.copy(rig.position); ring.scale.copy(rig.scale);
  ring.rotation.set(.18 + my * .1, mx * .15, -t * .25);
  arcs.forEach(([c, gl], i) => {
    const k = Math.max(0, Math.min(1, rp * 3 - i));
    const n = Math.floor(k * 120) * 12 * 6; c.geometry.setDrawRange(0, n); gl.geometry.setDrawRange(0, n);
  });

  // which life are we in?
  const mode = P.ring > .4 ? 'loop' : P.scan > .4 ? 'sell' : P.heal > .5 ? 'repair' : P.screen > .02 ? 'buy' : 'off';
  const life = mode === 'repair' || P.crack > .3 || P.explode > .1 ? 'repair' : mode === 'sell' ? 'sell' : 'buy';
  tmpC.copy(COL[life]); rimA.color.lerp(tmpC, .06); rimB.color.lerp(tmpC, .06); edge.material.color.copy(COL.buy);

  const keyStr = mode + '|' + P.crack.toFixed(2) + '|' + (mode === 'sell' ? Math.round(CNB.shown) + CNB.model + CNB.cond : '') + '|' + (mode === 'repair' ? P.heal.toFixed(2) : '');
  if (needDraw || keyStr !== lastKey) { drawScreen(mode, P.crack, P.heal); lastKey = keyStr; needDraw = false; }

  if (P.fade > .01) renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

resize();
buildStory();
drawBox();
document.fonts.ready.then(() => { drawBox(); needDraw = true; });
ScrollTrigger.refresh();
requestAnimationFrame(() => {
  frame();
  CNB.finishLoad();
  gsap.to(intro, { v: 1, duration: 1.4, ease: 'back.out(1.6)', delay: .1 });
});
