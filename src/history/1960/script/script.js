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
// Speaker: click to play / stop the anthem
// ---------------------------------------------
const audio = document.querySelector("#audio");
const speaker = document.querySelector(".speaker");
const speakerBtn = document.querySelector(".speaker-btn");

speakerBtn.addEventListener("click", () => {
  if (audio.paused) audio.play();
  else audio.pause();
});

audio.addEventListener("play", () => {
  speaker.classList.add("is-playing");
  speakerBtn.setAttribute("aria-pressed", "true");
});

audio.addEventListener("pause", () => {
  speaker.classList.remove("is-playing");
  speakerBtn.setAttribute("aria-pressed", "false");
});
