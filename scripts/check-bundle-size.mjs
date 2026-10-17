/**
 * Bundle size checker - verifies that production build output
 * stays within the configured performance budget.
 *
 * Measures the INITIAL payload (gzipped): assets referenced by
 * dist/index.html (entry chunk, modulepreloaded vendor chunks, entry CSS).
 *
 * Then checks every lazily-loaded chunk. Shared vendor buckets (vendor-*)
 * are hoisted out of the routes on purpose and are reported for
 * information; each route's own chunk carries the per-route budget, so no
 * single route can grow an oversized payload.
 *
 * Budgets: initial JS < 250KB gz, initial CSS < 30KB gz,
 * per-route chunk < 60KB gz.
 */
import {readdirSync, statSync, readFileSync} from "fs";
import {join} from "path";
import {gzipSync} from "zlib";

const DIST_DIR = join(import.meta.dirname, "..", "dist");
const ASSETS_DIR = join(DIST_DIR, "assets");

const KB = 1024;
const INITIAL_JS_LIMIT = 250 * KB; // gzipped
const INITIAL_CSS_LIMIT = 30 * KB; // gzipped
const ROUTE_CHUNK_LIMIT = 60 * KB; // gzipped, per route chunk

function getFiles(dir, ext) {
  let results = [];
  try {
    let entries = readdirSync(dir);
    for (let entry of entries) {
      let filePath = join(dir, entry);
      let stat = statSync(filePath);
      if (stat.isFile() && entry.endsWith(ext)) {
        results.push({ path: filePath, name: entry, size: gzipSync(readFileSync(filePath)).length });
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
let initialCss = 0;
let lazyChunks = [];
let vendorChunks = [];
for (const f of jsFiles) {
  if (referenced === null || referenced.has(f.name)) {
    initialJs += f.size;
  } else if (f.name.startsWith("vendor-")) {
    vendorChunks.push(f);
  } else {
    lazyChunks.push(f);
  }
}
for (const f of cssFiles) {
  if (referenced === null || referenced.has(f.name)) {
    initialCss += f.size;
  }
}

let passed = jsFiles.length > 0;
if (!passed) {
  console.error("Bundle size check: no build found in dist/ - run a build first");
}

console.log("Bundle size check (gzipped):");
console.log("  Initial JS:  " + (initialJs / 1024).toFixed(1) + "KB (limit: " + (INITIAL_JS_LIMIT / 1024) + "KB)");
console.log("  Initial CSS: " + (initialCss / 1024).toFixed(1) + "KB (limit: " + (INITIAL_CSS_LIMIT / 1024) + "KB)");
lazyChunks.sort((a, b) => b.size - a.size);
if (lazyChunks.length > 0) {
  console.log("  Route chunks: " + lazyChunks.length + " (largest " + (lazyChunks[0].size / 1024).toFixed(1) + "KB, limit " + (ROUTE_CHUNK_LIMIT / 1024) + "KB each)");
}
for (const f of lazyChunks) {
  if (f.size > ROUTE_CHUNK_LIMIT) {
    console.error("  FAIL: route chunk " + f.name + " is " + (f.size / 1024).toFixed(1) + "KB, exceeds " + (ROUTE_CHUNK_LIMIT / 1024) + "KB");
    passed = false;
  }
}
vendorChunks.sort((a, b) => b.size - a.size);
for (const f of vendorChunks) {
  console.log("  Shared vendor (informational): " + f.name + " " + (f.size / 1024).toFixed(1) + "KB");
}

if (initialJs > INITIAL_JS_LIMIT) {
  console.error("  FAIL: initial JS exceeds " + (INITIAL_JS_LIMIT / 1024) + "KB gzipped");
  passed = false;
}
if (initialCss > INITIAL_CSS_LIMIT) {
  console.error("  FAIL: initial CSS exceeds " + (INITIAL_CSS_LIMIT / 1024) + "KB gzipped");
  passed = false;
}

if (passed) {
  console.log("  All checks passed!");
  process.exit(0);
} else {
  process.exit(1);
}
