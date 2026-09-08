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

scoresBtn.addEventListener("click", () => {
  if (audio.paused) audio.play();
  else audio.pause();
});

audio.addEventListener("play", () => {
  scores.classList.add("is-playing");
  scoresBtn.setAttribute("aria-pressed", "true");
});

audio.addEventListener("pause", () => {
  scores.classList.remove("is-playing");
  scoresBtn.setAttribute("aria-pressed", "false");
});
