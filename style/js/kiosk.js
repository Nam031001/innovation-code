// Exhibition helpers, loaded on every page. Always on, no setup needed.
//
// 1. Offline cache: registers sw.js and has it download the whole site up
//    front, so every page keeps working when the venue Wi-Fi drops.
// 2. Idle reset: after IDLE_MS without input the page returns to the start
//    screen, which also clears memory the previous visitor's session built
//    up. It waits while audio or video is playing.
(function () {
  var IDLE_MS = 2 * 60 * 1000;

  var scriptUrl = document.currentScript && document.currentScript.src;
  if (!scriptUrl) return;
  var siteRoot = new URL("../../", scriptUrl);

  // Old kiosk on/off switch (?kiosk=1 / ?kiosk=0) is gone; drop its leftover.
  try {
    localStorage.removeItem("kiosk");
  } catch (e) {}

  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker
      .register(new URL("sw.js", siteRoot).href)
      .then(function () {
        return navigator.serviceWorker.ready.then(function (reg) {
          if (reg.active) reg.active.postMessage("precache-all");
        });
      })
      .catch(function () {});
  }

  var home = new URL("index.html", siteRoot).href;
  var timer;

  function isPlaying() {
    var media = document.querySelectorAll("audio, video");
    for (var i = 0; i < media.length; i++) {
      if (!media[i].paused && !media[i].ended) return true;
    }
    return false;
  }

  function onIdle() {
    if (isPlaying()) return arm();
    // The start screen reloads itself too, so it never runs for hours.
    if (location.href.split(/[?#]/)[0] === home) location.reload();
    else location.href = home;
  }

  function arm() {
    clearTimeout(timer);
    timer = setTimeout(onIdle, IDLE_MS);
  }

  ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"].forEach(function (type) {
    window.addEventListener(type, arm, { passive: true, capture: true });
  });
  arm();
})();
