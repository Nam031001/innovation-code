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
// Cassette tapes: only the top eight play the song
// ---------------------------------------------
const audio = document.querySelector("#audio");
const tapes = document.querySelector(".tapes");
const playableTapes = document.querySelectorAll(".tape.is-playable");

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

playableTapes.forEach((tape) => {
  tape.addEventListener("click", () => playSong(tape));
});

audio.addEventListener("play", () => {
  tapes.classList.add("is-playing");
  playableTapes.forEach((t) => t.setAttribute("aria-pressed", String(t === currentEl)));
});

audio.addEventListener("pause", () => {
  tapes.classList.remove("is-playing");
  playableTapes.forEach((t) => t.setAttribute("aria-pressed", "false"));
});
