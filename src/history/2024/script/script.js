// Global cursors: drop the `wait` state once the page is fully loaded.
(function () {
  var done = function () { document.documentElement.classList.add("is-loaded"); };
  if (document.readyState === "complete") done();
  else window.addEventListener("load", done);
})();

document.querySelector(".topbar-back").addEventListener("click", () => {
  history.back();
});

// ---------------------------------------------
// Flags: click any flag to play / stop the anthem
// ---------------------------------------------
const audio = document.querySelector("#audio");
const flags = document.querySelector(".flags");
const flagBtns = document.querySelectorAll(".flag-btn");

// Each playable element carries its own song in data-song (a path into
// /music). Clicking the element that is playing stops it; clicking another
// switches the single <audio> over to that element's song.
let currentEl = null;

function playSong(el) {
  const src = el.dataset.song;
  if (!src) return;
  const url = new URL(src, document.baseURI).href;
  if (el === currentEl && !audio.paused) {
    audio.pause();
    return;
  }
  if (audio.src !== url) audio.src = url;
  currentEl = el;
  audio.play();
}

flagBtns.forEach((btn) => {
  btn.addEventListener("click", () => playSong(btn));
});

audio.addEventListener("play", () => flags.classList.add("is-playing"));
audio.addEventListener("pause", () => flags.classList.remove("is-playing"));
