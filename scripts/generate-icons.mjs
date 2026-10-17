#!/usr/bin/env node
/**
 * Renders the favicon raster set from the two SVG masters.
 *
 * Browsers that do not support SVG favicons fall back to favicon.ico, iOS
 * uses apple-touch-icon, Android and installable PWAs use the manifest
 * icons, and the desktop wrapper uses a full-bleed app icon. Every one of
 * those is derived here so the raster files never drift from the vectors.
 *
 * `public/favicon.svg` is the rounded mark used in browser tabs.
 * `assets/favicon-maskable.svg` is the full-bleed version for anything that
 * masks or crops its icon (Android adaptive icons, iOS, OS app icons); it
 * lives outside public/ because it is a raster source, not a served asset.
 *
 * Usage: node scripts/generate-icons.mjs
 */
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, statSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const assetsDir = join(root, "assets");
const buildDir = join(root, "core", "build");
const windowsDir = join(buildDir, "windows");
const scratch = join(root, "node_modules", ".cache", "icons");

const rounded = join(publicDir, "favicon.svg");
const maskable = join(assetsDir, "favicon-maskable.svg");

function magick(args) {
    let result = spawnSync("magick", args, {"stdio": "inherit"});
    if (result.error) {
        process.stderr.write("Could not run ImageMagick (magick). Install it and retry.\n");
        process.exit(1);
    }
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

/** Rasterises one SVG at a high resolution, then downsamples to each size. */
function render(svg, size, out) {
    mkdirSync(dirname(out), {"recursive": true});
    magick(["-background", "none", "-density", "384", svg, "-resize", size + "x" + size,
        "-depth", "8", "-strip", "-define", "png:compression-level=9", out]);
}

if (!existsSync(rounded) || !existsSync(maskable)) {
    process.stderr.write("source SVGs are missing\n");
    process.exit(1);
}

mkdirSync(scratch, {"recursive": true});

const pages = [
    [rounded, 512, join(publicDir, "favicon.png")],
    [maskable, 512, join(publicDir, "icon-512.png")],
    [maskable, 192, join(publicDir, "icon-192.png")],
    [maskable, 180, join(publicDir, "apple-touch-icon.png")]
];
for (const entry of pages) {
    render(entry[0], entry[1], entry[2]);
}

// Multi-resolution .ico for the browser tab, and a full-bleed one for the
// Windows shell and desktop wrapper.
let icoSourceRaw = join(scratch, "rounded.png");
let icoSourceFlat = join(scratch, "maskable.png");
magick(["-background", "none", "-density", "384", rounded, "-resize", "256x256", "-depth", "8", "-strip", icoSourceRaw]);
magick(["-background", "none", "-density", "384", maskable, "-resize", "256x256", "-depth", "8", "-strip", icoSourceFlat]);
magick([icoSourceRaw, "-depth", "8", "-define", "icon:auto-resize=256,128,64,48,32,24,16", join(publicDir, "favicon.ico")]);
mkdirSync(windowsDir, {"recursive": true});
magick([icoSourceFlat, "-depth", "8", "-define", "icon:auto-resize=256,128,64,48,32,24,16", join(windowsDir, "icon.ico")]);
magick([icoSourceFlat, "-resize", "1024x1024", "-depth", "8", "-strip", "-define", "png:compression-level=9", join(buildDir, "appicon.png")]);
// macOS app icons bake their own rounded square, so this one comes from the
// rounded master rather than the full-bleed variant.
magick(["-background", "none", "-density", "384", rounded, "-resize", "1024x1024",
    "-depth", "8", "-strip", join(assetsDir, "favicon.icns")]);

const outputs = [
    "public/favicon.svg",
    "assets/favicon-maskable.svg",
    "public/favicon.png",
    "public/favicon.ico",
    "public/icon-192.png",
    "public/icon-512.png",
    "public/apple-touch-icon.png",
    "assets/favicon.icns",
    "core/build/appicon.png",
    "core/build/windows/icon.ico"
];

// Every output must exist and decode as an image; a silent ImageMagick
// failure that leaves a truncated file behind is the failure worth catching.
for (const rel of outputs) {
    let full = join(root, rel);
    if (!existsSync(full) || statSync(full).size === 0) {
        process.stderr.write("icon was not written: " + rel + "\n");
        process.exit(1);
    }
    let probe = spawnSync("magick", ["identify", full], {"stdio": "ignore"});
    if (probe.status !== 0) {
        process.stderr.write("icon does not decode: " + rel + "\n");
        process.exit(1);
    }
    process.stdout.write(rel.padEnd(32) + Math.ceil(statSync(full).size / 1024) + " KB\n");
}
process.stdout.write("icons regenerated\n");
