const menu = document.querySelector(".menu");
const toggle = document.querySelector(".menu__toggle");
const scribble = document.querySelector(".hero__scribble");
const hotspot = document.querySelector(".hero__hotspot");

const SCRIBBLE_SRC = "asset/움짤.gif";
const SCRIBBLE_HOVER_SRC = "asset/GifPeople.png";

hotspot.addEventListener("mouseenter", () => {
  scribble.src = SCRIBBLE_HOVER_SRC;
});

hotspot.addEventListener("mouseleave", () => {
  scribble.src = SCRIBBLE_SRC;
});

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
