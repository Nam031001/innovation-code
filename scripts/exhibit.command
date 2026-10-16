#!/bin/bash
# Exhibition launcher (macOS): double-click in Finder.
# Serves the site from this folder (no Wi-Fi needed) and opens Chrome
# full-screen in kiosk mode. Quit Chrome with Cmd+Q, then close this window.
cd "$(dirname "$0")/.." || exit 1
PORT=8080
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --kiosk --user-data-dir="$HOME/.exhibit-chrome" \
  --no-first-run --disable-session-crashed-bubble --disable-infobars \
  --autoplay-policy=no-user-gesture-required \
  "http://127.0.0.1:$PORT/index.html?kiosk=1"
