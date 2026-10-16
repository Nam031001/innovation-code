// Regenerates the precache list in sw.js: every page, stylesheet, script,
// and every asset/font/music file that some page actually references
// (unused originals, e.g. PNGs replaced by WebP, are left out).
// Run after changing site files:  npm run build:sw
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const SKIP_DIRS = new Set(["node_modules", ".git", "scripts", ".claude", ".vscode"]);
const CODE = /\.(html|css|js)$/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const all = walk(root);
// NFC: git (and so GitHub Pages) stores Korean filenames precomposed.
const rel = (f) => path.relative(root, f).split(path.sep).join("/").normalize("NFC");
const code = all.filter((f) => CODE.test(f) && rel(f) !== "sw.js");
// Every quoted/url() path ending in a media or font extension.
const REF = /["'(]([^"'()<>\n]+?\.(?:png|webp|jpe?g|gif|svg|woff2?|ttf|otf|mp3|mp4|webm|wav|ogg))["')?#]/gi;
const refs = new Set();
for (const f of code) {
  for (const m of fs.readFileSync(f, "utf8").matchAll(REF)) {
    let r = m[1];
    try {
      r = decodeURIComponent(r);
    } catch {}
    refs.add(r.replace(/^(\.{1,2}\/)+/, "").normalize("NFC"));
  }
}

const assets = all.filter((f) => /^(asset|font|music)\//.test(rel(f)) && !CODE.test(f));
// Refs are relative, so a file counts as used when some ref is a path suffix of it.
const used = assets.filter((f) => {
  const r = rel(f);
  for (const ref of refs) if (r === ref || r.endsWith("/" + ref)) return true;
  return false;
});

const urls = [...code.map(rel), ...used.map(rel)].sort().map((u) => encodeURI(u));
const hash = crypto.createHash("sha1");
for (const u of urls) hash.update(u + fs.statSync(path.join(root, decodeURI(u))).mtimeMs);
const version = hash.digest("hex").slice(0, 10);

const swPath = path.join(root, "sw.js");
const sw = fs.readFileSync(swPath, "utf8")
  .replace(/const VERSION = ".*?";/, `const VERSION = "${version}";`)
  .replace(/const PRECACHE = \[[\s\S]*?\];/, `const PRECACHE = ${JSON.stringify(urls, null, 2)};`);
fs.writeFileSync(swPath, sw);

const bytes = [...code, ...used].reduce((n, f) => n + fs.statSync(f).size, 0);
console.log(`sw.js: ${urls.length} files, ${(bytes / 1e6).toFixed(1)}MB, version ${version}`);
