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
// Sheet music: click the stack to play / stop
// ---------------------------------------------
const audio = document.querySelector("#audio");
const scores = document.querySelector(".scores");
const scoresBtn = document.querySelector(".scores-btn");

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

// The four sheets share one button; whichever sheet was clicked picks the
// song. A click between sheets toggles the last song (or the first sheet).
scoresBtn.addEventListener("click", (event) => {
  const score = event.target.closest(".score");
  if (score) return playSong(score);
  if (!audio.paused) audio.pause();
  else playSong(currentEl || scoresBtn.querySelector(".score"));
});

audio.addEventListener("play", () => {
  scores.classList.add("is-playing");
  scoresBtn.setAttribute("aria-pressed", "true");
});

audio.addEventListener("pause", () => {
  scores.classList.remove("is-playing");
  scoresBtn.setAttribute("aria-pressed", "false");
});
