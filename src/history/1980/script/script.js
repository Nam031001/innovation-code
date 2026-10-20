// Global cursors: drop the `wait` state once the page is fully loaded.
(function () {
  var done = function () { document.documentElement.classList.add("is-loaded"); };
  if (document.readyState === "complete") done();
  else window.addEventListener("load", done);
})();

// history.back() does nothing when this page was opened on its own (new
// tab, typed address, preview, kiosk restart), so go to the list instead.
document.querySelector(".topbar-back").addEventListener("click", () => {
  const cameFromSite = document.referrer.startsWith(location.origin);
  if (cameFromSite && history.length > 1) history.back();
  else location.href = "../index.html";
});

// ---------------------------------------------
// Cassette tapes: only the top two play the song
// ---------------------------------------------
const audio = document.querySelector("#audio");
const tapes = document.querySelector(".tapes");
const playableTapes = document.querySelectorAll(".tape.is-playable");

// Each playable element carries its own song in data-song (a path into
// /music). Only clicking the element that is playing stops it; clicking any
// other element switches the single <audio> over to that element's song.
let currentEl = null;

function playSong(el) {
  const src = el.dataset.song;
  if (!src) return;
  const url = new URL(src, document.baseURI).href;
  if (el === currentEl && !audio.paused) {
    audio.pause();
    return;
  }
  if (el !== currentEl) {
    // A different element always starts its own song from the top, even
    // when it shares the file with the element that was playing.
    if (audio.src !== url) audio.src = url;
    audio.currentTime = 0;
  }
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
