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

flagBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (audio.paused) audio.play();
    else audio.pause();
  });
});

audio.addEventListener("play", () => flags.classList.add("is-playing"));
audio.addEventListener("pause", () => flags.classList.remove("is-playing"));
