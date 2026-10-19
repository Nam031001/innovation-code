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
// Candle playlist: click a track to play / stop
// ---------------------------------------------
const audio = document.querySelector("#audio");
const candle = document.querySelector(".candle");
const trackEls = document.querySelectorAll(".player-track");

let current = 0;

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

function selectTrack(index) {
  current = index;
  trackEls.forEach((el, i) => el.classList.toggle("is-active", i === current));
}

trackEls.forEach((el, i) => {
  const activate = () => {
    selectTrack(i);
    playSong(el);
  };
  el.addEventListener("click", activate);
  el.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  });
});

audio.addEventListener("play", () => candle.classList.add("is-playing"));
audio.addEventListener("pause", () => candle.classList.remove("is-playing"));
