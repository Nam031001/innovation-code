// Bottom slogan ticker on the year pages: a seamless, endless loop.
//
// The CSS animation slides .ticker-track left by 50% and starts over, which
// only looks continuous when the track is two identical halves and each half
// is at least a screen wide. The hand-written item lists were neither, so a
// long blank stretch showed up and the text jumped back at the end of every
// cycle. This rebuilds the track to fit the screen: the page's slogans,
// repeated until one copy is wider than the viewport, then that copy twice.
// Scroll speed stays what each page's CSS duration gave the original list.
(function () {
  const track = document.querySelector(".ticker-track");
  if (!track) return;

  const items = [...track.querySelectorAll(".ticker-item")];
  const texts = items.map((el) => el.textContent.trim());

  // The HTML usually repeats its slogan list; keep just one round of it.
  let period = texts.length;
  for (let p = 1; p < texts.length; p += 1) {
    if (texts.every((t, i) => t === texts[i % p])) {
      period = p;
      break;
    }
  }
  const base = items.slice(0, period).map((el) => el.cloneNode(true));

  // Pixels per second of the original layout (half its width per cycle).
  const cssSeconds = parseFloat(getComputedStyle(track).animationDuration) || 30;
  const speed = track.scrollWidth / 2 / cssSeconds;

  function build() {
    track.replaceChildren(...base.map((el) => el.cloneNode(true)));
    const roundWidth = track.scrollWidth || 1;
    const rounds = Math.max(1, Math.ceil((window.innerWidth + 1) / roundWidth));

    const copy = [];
    for (let r = 0; r < rounds; r += 1) base.forEach((el) => copy.push(el.cloneNode(true)));
    track.replaceChildren(...copy, ...copy.map((el) => el.cloneNode(true)));

    track.style.animationDuration = `${(roundWidth * rounds) / speed}s`;
  }

  build();
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    build();
  });
})();
