// Global cursors: drop the `wait` state once the page is fully loaded.
(function () {
  var done = function () { document.documentElement.classList.add("is-loaded"); };
  if (document.readyState === "complete") done();
  else window.addEventListener("load", done);
})();

const menu = document.querySelector(".topbar-menu");
const toggle = document.querySelector(".topbar-menu-toggle");

// Finished pages have the fan menu; pages still using the placeholder
// template only have a plain back link, so this wiring is optional.
if (toggle) {
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
}

// The side nav lists every tool in order and scrolls; make sure the
// current one is in view on load rather than off the bottom.
const navCurrent = document.querySelector('.doc-nav-list a[aria-current="page"]');
if (navCurrent) {
  navCurrent.scrollIntoView({ block: "center" });
}

const popup = document.querySelector("#popup");
const popupCard = popup?.querySelector(".popup-card");
const popupClose = document.querySelector(".popup-close");
const popupDrag = popup?.querySelector(".popup-drag");

// Drop any dragged position and re-centre (run on every open).
const centrePopup = () => {
  if (!popupCard) return;
  popupCard.style.left = "50%";
  popupCard.style.top = "50%";
  popupCard.style.transform = "translate(-50%, -50%)";
};

// Placeholder pages don't render a popup at all.
if (popupClose) {
  popupClose.addEventListener("click", () => {
    popup.setAttribute("hidden", "");
  });
}

// Pages that start with the popup hidden (e.g. 손글씨 대자보) open it
// from a marked element; pages without the marker keep showing it on
// load as before.
const popupOpen = document.querySelector("[data-popup-open]");
if (popupOpen && popup) {
  const open = () => {
    centrePopup();
    popup.removeAttribute("hidden");
  };
  popupOpen.addEventListener("click", open);
  popupOpen.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });
}

// Drag the card around by its title bar, like a real window.
if (popupCard && popupDrag) {
  let originX = 0;
  let originY = 0;
  let baseX = 0;
  let baseY = 0;
  let dragging = false;

  const onMove = (event) => {
    if (!dragging) return;
    const width = popupCard.offsetWidth;
    // Keep a strip of the card on screen so it can never be lost.
    const margin = 60;
    const x = Math.min(
      Math.max(baseX + event.clientX - originX, margin - width),
      window.innerWidth - margin,
    );
    const y = Math.min(
      Math.max(baseY + event.clientY - originY, 0),
      window.innerHeight - margin,
    );
    popupCard.style.left = `${x}px`;
    popupCard.style.top = `${y}px`;
  };

  const onUp = () => {
    dragging = false;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  };

  popupDrag.addEventListener("pointerdown", (event) => {
    // Pin the card to its current pixels, drop the centring transform.
    const rect = popupCard.getBoundingClientRect();
    popupCard.style.transform = "none";
    popupCard.style.left = `${rect.left}px`;
    popupCard.style.top = `${rect.top}px`;
    baseX = rect.left;
    baseY = rect.top;
    originX = event.clientX;
    originY = event.clientY;
    dragging = true;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    event.preventDefault();
  });
}
