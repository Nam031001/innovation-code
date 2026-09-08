// Global cursors: drop the `wait` state once the page is fully loaded.
(function () {
  var done = function () { document.documentElement.classList.add("is-loaded"); };
  if (document.readyState === "complete") done();
  else window.addEventListener("load", done);
})();

/* global Matter */

// ---------------------------------------------
// Top bar fan menu
// ---------------------------------------------
const menu = document.querySelector(".topbar-menu");
const toggle = document.querySelector(".topbar-menu-toggle");

toggle.addEventListener("click", () => {
  const isOpen = menu.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("click", (event) => {
  if (!menu.contains(event.target)) {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

// ---------------------------------------------
// Matter.js "pour and sort" sandbox
//
// On load the nine supplies drop in from above the top edge. Each one
// can be grabbed with the mouse and dragged into the left (필수) or
// right (선택) bin — both are real static enclosures, so items stack
// inside them. The counter tracks how many currently sit in the
// correct bin.
// ---------------------------------------------
const { Engine, Render, Runner, Composite, Bodies, Body, Events, Mouse, MouseConstraint } =
  Matter;

const scene = document.querySelector("#scene");
const binLeft = document.querySelector("#binLeft");
const binRight = document.querySelector("#binRight");
const hintEl = document.querySelector("#hint");
const countEl = document.querySelector("#count");

// `size` : 개별 크기 배수 (1 = 기본).
// `crop` : PNG 안에서 실제 그림이 차지하는 비율 [가로, 세로]. 충돌 박스를
//          그림에 맞춰 물건끼리 틈 없이 쌓이게 함. 브라우저가 픽셀을 읽을
//          수 있으면 자동 측정, 못 읽으면 이 값을 씀.
const ITEMS = [
  { name: "마스크", src: "../../asset/supplies/mask.png", cat: "left", size: 0.8, crop: [0.96, 0.82] },
  { name: "운동화", src: "../../asset/supplies/sneakers.png", cat: "left", size: 1, crop: [0.98, 0.98] },
  { name: "작은 생수", src: "../../asset/supplies/water_color%203.png", cat: "left", size: 0.9, crop: [0.96, 0.85] },
  { name: "방한용품", src: "../../asset/supplies/hotpack.png", cat: "left", size: 0.7, crop: [1, 1] },
  { name: "매트", src: "../../asset/supplies/mat.png", cat: "left", size: 1, crop: [1, 1] },
  { name: "핸드폰 방수팩", src: "../../asset/supplies/phone.png", cat: "right", size: 1.1, crop: [0.91, 0.74] },
  { name: "식염수", src: "../../asset/supplies/saline.png", cat: "right", size: 0.8, crop: [1, 1] },
  { name: "우비", src: "../../asset/supplies/raincoat.png", cat: "right", size: 1.1, crop: [0.84, 0.7] },
  { name: "고글", src: "../../asset/supplies/gogle_color.png", cat: "right", size: 0.9, crop: [0.98, 0.95] },
];

const engine = Engine.create();
engine.world.gravity.y = 1;

const render = Render.create({
  element: scene,
  engine,
  options: {
    width: scene.clientWidth,
    height: scene.clientHeight,
    background: "transparent",
    wireframes: false,
    pixelRatio: 1,
  },
});
Render.run(render);
Runner.run(Runner.create(), engine);

// ---------------------------------------------
// Static geometry: outer bounds + the two bins.
// Rebuilt from the live DOM rects whenever the viewport changes.
// ---------------------------------------------
const statics = Composite.create();
Composite.add(engine.world, statics);
const WALL = { isStatic: true, render: { visible: false } };

function sceneRect(el) {
  const r = el.getBoundingClientRect();
  const s = scene.getBoundingClientRect();
  return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
}

function buildStatics() {
  Composite.clear(statics, false);
  const w = scene.clientWidth;
  const h = scene.clientHeight;
  const t = 140;

  Composite.add(statics, [
    Bodies.rectangle(w / 2, h + t / 2 - 88, w + 600, t, WALL), // floor
    Bodies.rectangle(-t / 2, h / 2, t, h * 4, WALL), // left edge
    Bodies.rectangle(w + t / 2, h / 2, t, h * 4, WALL), // right edge
  ]);

  // Each bin is a real open-top enclosure. The side walls run well
  // above the bin and are thick, so the loose centre pile can't be
  // shoved in along the floor — the only way in is to lift an item
  // over and drop it through the open top.
  for (const el of [binLeft, binRight]) {
    const b = sceneRect(el);
    const s = 22;
    const wallH = b.h + 120;
    Composite.add(statics, [
      Bodies.rectangle(b.x + b.w / 2, b.y + b.h, b.w, s, WALL), // bin floor
      Bodies.rectangle(b.x, b.y + b.h - wallH / 2, s, wallH, WALL), // side wall
      Bodies.rectangle(b.x + b.w, b.y + b.h - wallH / 2, s, wallH, WALL), // side wall
    ]);
  }
}
buildStatics();

// A temporary chute walling off the centre gap from both bins, so the
// initial pour can only pile up in the middle. Removed once everything
// has come to rest — after that the pile can be dragged into the bins.
let funnel = null;

function addFunnel() {
  removeFunnel();
  const lb = sceneRect(binLeft);
  const rb = sceneRect(binRight);
  const h = scene.clientHeight;
  const s = 60;
  funnel = Composite.create();
  Composite.add(funnel, [
    Bodies.rectangle(lb.x + lb.w - s / 2, h / 2, s, h * 3, WALL),
    Bodies.rectangle(rb.x + s / 2, h / 2, s, h * 3, WALL),
  ]);
  Composite.add(engine.world, funnel);
}

function removeFunnel() {
  if (!funnel) return;
  Composite.remove(engine.world, funnel);
  funnel = null;
}

function removeFunnelWhenSettled() {
  const start = Date.now();
  const check = () => {
    const settled = itemBodies.every(
      (b) => b.speed < 0.5 && Math.abs(b.angularSpeed) < 0.06,
    );
    if (settled || Date.now() - start > 6000) {
      removeFunnel();
      return;
    }
    setTimeout(check, 250);
  };
  setTimeout(check, 1200);
}

// ---------------------------------------------
// Items
// ---------------------------------------------
const itemBodies = [];

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// The opaque part of a PNG, as fractions of its full size:
// { fw, fh } = content size, { cx, cy } = content centre. Scans the
// alpha channel when the browser allows pixel readback, otherwise
// falls back to the hand-measured `crop` on the item.
function measureContent(img, crop) {
  const fallback = {
    fw: crop ? crop[0] : 1,
    fh: crop ? crop[1] : 1,
    cx: 0.5,
    cy: 0.5,
  };
  try {
    if (!img || !img.naturalWidth) return fallback;
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, W, H).data;
    let minX = W;
    let minY = H;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        if (data[(y * W + x) * 4 + 3] > 12) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return fallback;
    return {
      fw: (maxX - minX + 1) / W,
      fh: (maxY - minY + 1) / H,
      cx: (minX + maxX + 1) / 2 / W,
      cy: (minY + maxY + 1) / 2 / H,
    };
  } catch {
    return fallback;
  }
}

async function buildItems() {
  const images = await Promise.all(ITEMS.map((it) => loadImage(it.src)));
  // 모든 물건 공통 기본 크기(가로·세로 중 큰 쪽 픽셀). 전체를 키우려면 여기.
  const baseMax = 1.5 * Math.min(170, Math.max(112, scene.clientWidth * 0.1));

  // Aim the pour at the empty gap between the two bins, not the whole
  // width — read the live bin rects so it follows their actual size.
  const lb = sceneRect(binLeft);
  const rb = sceneRect(binRight);
  const gapLeft = lb.x + lb.w;
  const gapRight = rb.x;
  const gapMid = (gapLeft + gapRight) / 2;

  images.forEach((img, i) => {
    const item = ITEMS[i];
    const nw = img ? img.naturalWidth : 300;
    const nh = img ? img.naturalHeight : 300;

    // Size + collide by the *visible* pixels, not the PNG's transparent
    // frame — that transparent margin is what leaves air between the
    // stacked objects.
    const m = measureContent(img, item.crop);
    const contentW = nw * m.fw;
    const contentH = nh * m.fh;
    const scale = (baseMax * (item.size ?? 1)) / Math.max(contentW, contentH);
    const cw = contentW * scale;
    const ch = contentH * scale;

    // Spread across the gap but keep the whole body clear of both bins;
    // if an item is wider than the gap it just drops dead centre.
    const room = Math.max(0, (gapRight - gapLeft - cw) / 2 - 12);
    const spawnX = gapMid + (Math.random() * 2 - 1) * room;

    const body = Bodies.rectangle(spawnX, -80 - Math.random() * 240, cw * 0.94, ch * 0.94, {
      restitution: 0.05,
      friction: 0.9,
      frictionAir: 0.02,
      render: {
        fillStyle: "#d5d5d2",
        sprite: { texture: item.src, xScale: scale, yScale: scale },
      },
    });
    // Draw the sprite so its visible content — not the PNG frame — is
    // centred on the collision box.
    body.render.sprite.xOffset = m.cx;
    body.render.sprite.yOffset = m.cy;

    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12);
    body.plugin = { item, placedIn: null };
    itemBodies.push(body);
  });

  // All nine drop together — one "우르르" pour — into the centre chute.
  addFunnel();
  Composite.add(engine.world, itemBodies);
  removeFunnelWhenSettled();
  updateCount();
}

buildItems();

// ---------------------------------------------
// Drag
// ---------------------------------------------
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: { stiffness: 0.1, damping: 0.1, render: { visible: false } },
});
Composite.add(engine.world, mouseConstraint);
render.mouse = mouse;

// ---------------------------------------------
// Sorting feedback
// ---------------------------------------------
function zoneAt(x, y) {
  for (const [el, cat] of [
    [binLeft, "left"],
    [binRight, "right"],
  ]) {
    const b = sceneRect(el);
    // Horizontally inside the bin, and anywhere from a little above the
    // rim (items can settle stacked past the top edge) down to the
    // floor. The tall side walls mean nothing sits at this x without
    // actually being in the bin.
    if (x >= b.x && x <= b.x + b.w && y >= b.y - 48 && y <= b.y + b.h + 24) return cat;
  }
  return null;
}

// Placement is only ever changed by the user: picking an item up
// clears where it was, dropping it records the bin it was let go over
// (if any). Physics jostling never moves the score on its own.
function updateCount() {
  const n = itemBodies.filter(
    (b) => b.plugin.placedIn && b.plugin.placedIn === b.plugin.item.cat,
  ).length;
  const done = n === itemBodies.length;
  if (countEl) {
    countEl.innerHTML = `제대로 담은 준비물&nbsp;&nbsp;${n} / ${itemBodies.length}`;
  }
  if (hintEl) {
    hintEl.classList.toggle("is-done", done);
    hintEl.textContent = done
      ? "완성! 모든 준비물을 제자리에 담았어요"
      : "위에서 쏟아지는 준비물을 드래그해서 알맞은 칸에 넣어보세요";
  }
}

Events.on(mouseConstraint, "startdrag", ({ body }) => {
  if (body && body.plugin) body.plugin.placedIn = null;
  updateCount();
});

Events.on(mouseConstraint, "enddrag", ({ body }) => {
  if (!body || !body.plugin) return;

  // Score it right away from where it was released...
  body.plugin.placedIn = zoneAt(body.position.x, body.position.y);
  updateCount();

  // ...but an item is often let go in the air just above a bin (you
  // lift it over the wall and drop it in). Follow it until it comes to
  // rest and re-check, so it registers on the first drop instead of
  // needing a second pick-up.
  const target = body;
  const start = Date.now();
  const settle = () => {
    if (mouseConstraint.body === target) return; // re-grabbed — a new enddrag will handle it
    const atRest =
      target.speed < 0.6 && Math.abs(target.angularSpeed) < 0.08;
    if (atRest || Date.now() - start > 2500) {
      const zone = zoneAt(target.position.x, target.position.y);
      if (zone !== target.plugin.placedIn) {
        target.plugin.placedIn = zone;
        updateCount();
      }
      return;
    }
    setTimeout(settle, 120);
  };
  setTimeout(settle, 120);
});

// ---------------------------------------------
// Keep the renderer and geometry synced to the viewport
// ---------------------------------------------
function fit() {
  const w = scene.clientWidth;
  const h = scene.clientHeight;
  render.canvas.width = w;
  render.canvas.height = h;
  render.canvas.style.width = `${w}px`;
  render.canvas.style.height = `${h}px`;
  render.options.width = w;
  render.options.height = h;
  render.bounds.max.x = w;
  render.bounds.max.y = h;
  buildStatics();
}

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fit, 200);
});
