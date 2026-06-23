/**
 * Bundle size checker — verifies that production build output
 * stays within the configured performance budget.
 *
 * Limits:
 *   - Initial JS ≤ 150KB
 *   - Initial CSS ≤ 50KB
 */
import { readdirSync, statSync } from "fs";
import { join } from "path";

const DIST_DIR = join(import.meta.dirname, "..", "dist", "assets");

const JS_LIMIT = 150 * 1024; // 150KB
const CSS_LIMIT = 50 * 1024; // 50KB

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

let jsFiles = getFiles(DIST_DIR, ".js");
let cssFiles = getFiles(DIST_DIR, ".css");

let totalJs = jsFiles.reduce((sum, f) => sum + f.size, 0);
let totalCss = cssFiles.reduce((sum, f) => sum + f.size, 0);

let passed = true;

console.log("Bundle size check:");
console.log("  JS:  " + (totalJs / 1024).toFixed(1) + "KB (limit: " + (JS_LIMIT / 1024) + "KB)");
console.log("  CSS: " + (totalCss / 1024).toFixed(1) + "KB (limit: " + (CSS_LIMIT / 1024) + "KB)");

if (totalJs > JS_LIMIT) {
  console.error("  FAIL: JS bundle exceeds " + (JS_LIMIT / 1024) + "KB limit");
  passed = false;
}
if (totalCss > CSS_LIMIT) {
  console.error("  FAIL: CSS bundle exceeds " + (CSS_LIMIT / 1024) + "KB limit");
  passed = false;
}

if (passed) {
  console.log("  All checks passed!");
  process.exit(0);
} else {
  process.exit(1);
}
