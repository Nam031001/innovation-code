// Global cursors: drop the `wait` state once the page is fully loaded.
(function () {
  var done = function () { document.documentElement.classList.add("is-loaded"); };
  if (document.readyState === "complete") done();
  else window.addEventListener("load", done);
})();

// ---------------------------------------------
// Hamburger nav: same click-to-toggle as the other section pages
// (hover / focus-within open it via CSS alone).
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
// Magnifier lens: the sharp circle follows the cursor. Only the two
// CSS custom properties move; the mask + backdrop-filter do the rest.
// ---------------------------------------------
const root = document.documentElement;
let lensX = window.innerWidth / 2;
let lensY = window.innerHeight * 0.44;
let pending = false;

function applyLens() {
  pending = false;
  root.style.setProperty("--lx", `${lensX}px`);
  root.style.setProperty("--ly", `${lensY}px`);
}
applyLens();

window.addEventListener(
  "pointermove",
  (event) => {
    lensX = event.clientX;
    lensY = event.clientY;
    if (!pending) {
      pending = true;
      requestAnimationFrame(applyLens);
    }
  },
  { passive: true },
);
