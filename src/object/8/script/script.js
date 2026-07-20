const menu = document.querySelector(".topbar__menu");
const toggle = document.querySelector(".topbar__menu-toggle");

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

const popup = document.querySelector("#popup");
const popupClose = document.querySelector(".popup__close");

popupClose.addEventListener("click", () => {
  popup.setAttribute("hidden", "");
});
