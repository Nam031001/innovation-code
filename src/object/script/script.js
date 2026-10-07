// Global cursors: drop the `wait` state once the page is fully loaded.
(function () {
  var done = function () { document.documentElement.classList.add("is-loaded"); };
  if (document.readyState === "complete") done();
  else window.addEventListener("load", done);
})();

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
// 3D coordinate map:
//   left-drag                → pan
//   right-drag / shift-drag  → orbit left–right (yaw)
//   wheel                    → zoom toward the cursor
// #objectWorld is the flat map; it sits centred in #objectScene, so its
// screen offset from centre is  worldPoint * z + pan. At rest every
// value is identity, so the map is the plain flat design.
// ---------------------------------------------
const scene = document.getElementById("objectScene");
const world = document.getElementById("objectWorld");

if (scene && world) {
  const MIN_Z = 0.55;
  const MAX_Z = 3;
  const MAX_RY = 60; // degrees each way
  const HOME = { px: 0, py: 0, z: 1, ry: 0 };

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  let px = HOME.px;
  let py = HOME.py;
  let z = HOME.z;
  let ry = HOME.ry;

  const render = () => {
    world.style.setProperty("--px", `${px}px`);
    world.style.setProperty("--py", `${py}px`);
    world.style.setProperty("--z", `${z}`);
    world.style.setProperty("--ry", `${ry}deg`);
  };
  render();

  // ---- idle reset: back to the home view after a minute untouched ----
  // Animated (world picks up the .is-homing transition below) so it
  // reads as the map settling back, not a jump cut. Any interaction
  // cancels a scheduled reset and, if one was mid-flight, stops it
  // exactly where it was so a fresh drag never fights the animation.
  const IDLE_MS = 60000;
  let idleTimer = null;

  const goHome = (animate) => {
    if (animate) {
      world.classList.add("is-homing");
      world.addEventListener(
        "transitionend",
        () => world.classList.remove("is-homing"),
        { once: true },
      );
    }
    px = HOME.px;
    py = HOME.py;
    z = HOME.z;
    ry = HOME.ry;
    render();
  };

  const scheduleIdleReset = () => {
    world.classList.remove("is-homing");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => goHome(true), IDLE_MS);
  };
  scheduleIdleReset();

  // ---- drag: pan (left) or orbit (right / shift+left) ----
  // `armed` is the intent set on pointerdown; `mode` only turns on once
  // the pointer has moved past DRAG_SLOP. Capturing the pointer on every
  // pointerdown re-targets the follow-up `click` to the scene, so clicks
  // on the tool links would never navigate.
  const DRAG_SLOP = 6;
  let armed = null; // "pan" | "rotate" | null
  let mode = null; // "pan" | "rotate" | null
  let captured = false;
  let lastX = 0;
  let lastY = 0;
  let travelled = 0;

  scene.addEventListener("pointerdown", (event) => {
    scheduleIdleReset();
    if (event.button === 2 || (event.button === 0 && event.shiftKey)) {
      armed = "rotate";
      event.preventDefault();
    } else if (event.button === 0) {
      armed = "pan";
    } else {
      return;
    }
    mode = null;
    travelled = 0;
    lastX = event.clientX;
    lastY = event.clientY;
  });

  scene.addEventListener("pointermove", (event) => {
    if (!armed) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    travelled += Math.abs(dx) + Math.abs(dy);
    lastX = event.clientX;
    lastY = event.clientY;

    if (!mode) {
      if (travelled <= DRAG_SLOP) return;
      mode = armed;
      scene.classList.add(mode === "rotate" ? "is-rotating" : "is-panning");
      try {
        scene.setPointerCapture(event.pointerId);
        captured = true;
      } catch (_) {
        /* capture unsupported / pointer already gone */
      }
    }

    if (mode === "rotate") {
      ry = clamp(ry + dx * 0.35, -MAX_RY, MAX_RY);
    } else {
      px += dx;
      py += dy;
    }
    scheduleIdleReset();
    render();
  });

  const endDrag = (event) => {
    armed = null;
    if (!mode) return;
    mode = null;
    scene.classList.remove("is-panning", "is-rotating");
    if (captured) {
      captured = false;
      try {
        scene.releasePointerCapture(event.pointerId);
      } catch (_) {
        /* capture already gone */
      }
    }
  };
  scene.addEventListener("pointerup", endDrag);
  scene.addEventListener("pointercancel", endDrag);
  scene.addEventListener("contextmenu", (event) => event.preventDefault());

  // A drag that moved the map must not also open the tool link.
  scene.addEventListener(
    "click",
    (event) => {
      if (travelled > DRAG_SLOP) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );

  // ---- zoom toward the cursor ----
  const zoomAt = (clientX, clientY, factor) => {
    const rect = scene.getBoundingClientRect();
    const ox = clientX - rect.left - rect.width / 2;
    const oy = clientY - rect.top - rect.height / 2;
    const next = clamp(z * factor, MIN_Z, MAX_Z);
    const k = next / z;
    px = ox - (ox - px) * k;
    py = oy - (oy - py) * k;
    z = next;
    render();
  };

  scene.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      scheduleIdleReset();
      zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * 0.0016));
    },
    { passive: false },
  );

  // Double-click empty space to snap back home.
  scene.addEventListener("dblclick", (event) => {
    if (event.target.closest(".object-link")) return;
    scheduleIdleReset();
    goHome(false);
  });
}
