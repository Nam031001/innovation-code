// Exhibition helpers, loaded on every page.
//
// 1. Offline cache: registers sw.js so pages already visited keep working
//    when the venue Wi-Fi drops.
// 2. Kiosk mode (exhibition PC only): open any page once with `?kiosk=1`
//    and this browser remembers it. In kiosk mode the service worker
//    downloads the whole site up front, and after IDLE_MS without input
//    the page returns to the start screen, which also clears memory the
//    previous visitor's session built up. `?kiosk=0` turns it off again.
//    Visitors browsing on their own phones are never affected.
(function () {
  var IDLE_MS = 3 * 60 * 1000;

  var scriptUrl = document.currentScript && document.currentScript.src;
  if (!scriptUrl) return;
  var siteRoot = new URL("../../", scriptUrl);

  var kiosk = false;
  try {
    var flag = new URLSearchParams(location.search).get("kiosk");
    if (flag === "1") localStorage.setItem("kiosk", "1");
    if (flag === "0") localStorage.removeItem("kiosk");
    kiosk = localStorage.getItem("kiosk") === "1";
  } catch (e) {}

  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker
      .register(new URL("sw.js", siteRoot).href)
      .then(function () {
        if (!kiosk) return;
        return navigator.serviceWorker.ready.then(function (reg) {
          if (reg.active) reg.active.postMessage("precache-all");
        });
      })
      .catch(function () {});
  }

  if (!kiosk) return;

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
