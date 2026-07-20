document.querySelector(".topbar__back").addEventListener("click", () => {
  history.back();
});

const tracks = [{ title: "촛불의 노래", src: "../../../music/애국가%20제창(1절).mp3" }];

const audio = document.querySelector("#audio");
const trackEls = document.querySelectorAll(".player__track");
const toggleBtn = document.querySelector(".player__toggle");
const prevBtn = document.querySelector(".player__prev");
const nextBtn = document.querySelector(".player__next");
const seek = document.querySelector(".player__seek");

let current = 0;
let isSeeking = false;

function loadTrack(index, autoplay) {
  current = (index + tracks.length) % tracks.length;
  audio.src = tracks[current].src;
  trackEls.forEach((el, i) => el.classList.toggle("is-active", i === current));
  seek.value = 0;
  if (autoplay) audio.play();
}

trackEls.forEach((el, i) => {
  el.addEventListener("click", () => loadTrack(i, true));
  el.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      loadTrack(i, true);
    }
  });
});

toggleBtn.addEventListener("click", () => {
  if (!audio.src) loadTrack(current, false);
  if (audio.paused) audio.play();
  else audio.pause();
});

prevBtn.addEventListener("click", () => loadTrack(current - 1, true));
nextBtn.addEventListener("click", () => loadTrack(current + 1, true));

audio.addEventListener("play", () => toggleBtn.classList.add("is-playing"));
audio.addEventListener("pause", () => toggleBtn.classList.remove("is-playing"));
audio.addEventListener("ended", () => loadTrack(current + 1, true));

audio.addEventListener("timeupdate", () => {
  if (!isSeeking && !Number.isNaN(audio.duration)) {
    seek.value = (audio.currentTime / audio.duration) * 100;
  }
});

seek.addEventListener("input", () => {
  isSeeking = true;
  if (!Number.isNaN(audio.duration)) {
    audio.currentTime = (seek.value / 100) * audio.duration;
  }
});

seek.addEventListener("change", () => {
  isSeeking = false;
});

loadTrack(current, false);
