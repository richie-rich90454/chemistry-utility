/**
 * Bundle size checker - verifies that production build output
 * stays within the configured performance budget.
 *
 * Measures the INITIAL payload: assets referenced by dist/index.html
 * (entry chunk, modulepreloaded vendor chunks, entry CSS). Unreferenced
 * lazy chunks are reported for information only.
 *
 * Baselines at adoption (raw bytes): JS ~941KB (all routes statically
 * imported today - split routes lazily to reduce this), CSS ~110KB.
 */
import { readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";

const DIST_DIR = join(import.meta.dirname, "..", "dist");
const ASSETS_DIR = join(DIST_DIR, "assets");

const JS_LIMIT = 1000 * 1024; // 1000KB initial JS (raw)
const CSS_LIMIT = 120 * 1024; // 120KB initial CSS (raw)

function getFiles(dir, ext) {
  let results = [];
  try {
    let entries = readdirSync(dir);
    for (let entry of entries) {
      let filePath = join(dir, entry);
      let stat = statSync(filePath);
      if (stat.isFile() && entry.endsWith(ext)) {
        results.push({ path: filePath, name: entry, size: stat.size });
      }
    }
  } catch {
    // dist directory doesn't exist yet
  }
  return results;
}

function getReferencedAssets() {
  let names;
  try {
    let html = readFileSync(join(DIST_DIR, "index.html"), "utf8");
    names = new Set();
    const re = /(?:src|href)="\/?(assets\/[^"]+\.(?:js|css))"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      names.add(m[1].replace(/^assets\//, ""));
    }
  } catch {
    names = null; // no index.html - fall back to counting everything
  }
  return names;
}

let jsFiles = getFiles(ASSETS_DIR, ".js");
let cssFiles = getFiles(ASSETS_DIR, ".css");
let referenced = getReferencedAssets();

let initialJs = 0;
let lazyJs = 0;
for (const f of jsFiles) {
  if (referenced === null || referenced.has(f.name)) {
    initialJs += f.size;
  } else {
    lazyJs += f.size;
  }
}
let initialCss = cssFiles.reduce((sum, f) => (referenced === null || referenced.has(f.name) ? sum + f.size : sum), 0);

let passed = true;

console.log("Bundle size check:");
console.log("  Initial JS:  " + (initialJs / 1024).toFixed(1) + "KB (limit: " + (JS_LIMIT / 1024) + "KB)");
console.log("  Initial CSS: " + (initialCss / 1024).toFixed(1) + "KB (limit: " + (CSS_LIMIT / 1024) + "KB)");
if (lazyJs > 0) {
  console.log("  Lazy JS (not counted): " + (lazyJs / 1024).toFixed(1) + "KB");
}

if (initialJs > JS_LIMIT) {
  console.error("  FAIL: initial JS bundle exceeds " + (JS_LIMIT / 1024) + "KB limit");
  passed = false;
}
if (initialCss > CSS_LIMIT) {
  console.error("  FAIL: initial CSS bundle exceeds " + (CSS_LIMIT / 1024) + "KB limit");
  passed = false;
}

if (passed) {
  console.log("  All checks passed!");
  process.exit(0);
} else {
  process.exit(1);
}
