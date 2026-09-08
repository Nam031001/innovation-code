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
// Cassette tapes: only the top two play the song
// ---------------------------------------------
const audio = document.querySelector("#audio");
const tapes = document.querySelector(".tapes");
const playableTapes = document.querySelectorAll(".tape.is-playable");

playableTapes.forEach((tape) => {
  tape.addEventListener("click", () => {
    if (audio.paused) audio.play();
    else audio.pause();
  });
});

audio.addEventListener("play", () => {
  tapes.classList.add("is-playing");
  playableTapes.forEach((t) => t.setAttribute("aria-pressed", "true"));
});

audio.addEventListener("pause", () => {
  tapes.classList.remove("is-playing");
  playableTapes.forEach((t) => t.setAttribute("aria-pressed", "false"));
});
