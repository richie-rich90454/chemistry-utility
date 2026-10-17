#!/usr/bin/env node
/**
 * Wails task runner.
 *
 * Runs the Wails CLI against the Go wrapper in `core/` and adds the handful of
 * things the wrapper needs to be usable from the root npm project:
 *
 *   doctor   report the local Wails toolchain
 *   version  print the Wails CLI version
 *   dev      run the desktop app with live reload
 *   build    build the native binary
 *   start    launch the built binary
 *   package  build and archive a distributable
 *
 * The runner builds and stages the frontend itself, then compiles with the
 * CLI's own frontend step skipped. Letting the CLI run `frontend:build` is not
 * safe here: it clears the directory it is told to embed afterwards, so the
 * binary would be compiled against a bundle that has already been removed and
 * would ship the placeholder marker instead of the app. Doing the build here
 * means the staged bundle is verified to be on disk immediately before the
 * compiler runs.
 *
 * Usage: node scripts/wails.mjs <command> [wails flags...]
 */
import {spawn, spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readdirSync, statSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {arch, platform} from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const coreDir = join(root, "core");
const binDir = join(coreDir, "build", "bin");
const packageDir = join(coreDir, "build", "package");
const distDir = join(coreDir, "dist");
const embedPlaceholder = join(distDir, ".gitkeep");
const embedPlaceholderContent = "Placeholder so go:embed has a file to embed. Contents are replaced by `npm run desktop:stage`.\n";

const isWindows = platform() === "win32";
const isMac = platform() === "darwin";
const isLinux = platform() === "linux";
const appName = "chemistry-utility";
const binaryName = isWindows ? appName + ".exe" : appName;
const appBundle = appName + ".app";
const goos = isWindows ? "windows" : isMac ? "darwin" : "linux";
const goarch = arch() === "arm64" ? "arm64" : arch() === "ia32" ? "386" : "amd64";

function log(message) {
    process.stdout.write(message + "\n");
}

function fail(message) {
    process.stderr.write("\n" + message + "\n");
    process.exit(1);
}

/** True when a command is on the PATH. */
function commandExists(name) {
    let probe = spawnSync((isWindows ? "where " : "which ") + name, {"stdio": "ignore", "shell": true});
    return probe.status === 0;
}

/** Resolves the Wails CLI, preferring the PATH and falling back to GOPATH/bin. */
function findWails() {
    if (commandExists("wails")) {
        return "wails";
    }
    let goPath = spawnSync("go env GOPATH", {"encoding": "utf8", "shell": true});
    if (goPath.status === 0) {
        let candidate = join(goPath.stdout.trim(), "bin", isWindows ? "wails.exe" : "wails");
        if (existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

function requireWails() {
    let wails = findWails();
    if (wails === null) {
        fail("The Wails CLI was not found on your PATH or in GOPATH/bin.\n" +
            "Install it with:\n" +
            "  go install github.com/wailsapp/wails/v2/cmd/wails@latest");
    }
    return wails;
}

/** Runs a shell command line in a given directory and returns its exit code. */
function runShell(commandLine, options = {}) {
    let result = spawnSync(commandLine, {
        "cwd": options.cwd ?? root,
        "stdio": "inherit",
        "shell": true
    });
    return result.status === null ? 1 : result.status;
}

/** Runs a long-lived process, forwarding stdio and the exit code. */
function runLive(commandLine, options = {}) {
    let child = spawn(commandLine, {
        "cwd": options.cwd ?? root,
        "stdio": "inherit",
        "shell": true
    });
    child.on("exit", function (code, signal) {
        process.exit(signal === null ? (code ?? 0) : 0);
    });
}

/** True when the directory contains at least one file, at any depth. */
function hasFiles(dir) {
    let entries = readdirSync(dir, {"withFileTypes": true});
    let i;
    for (i = 0; i < entries.length; i++) {
        if (entries[i].isFile()) {
            return true;
        }
        if (entries[i].isDirectory() && hasFiles(join(dir, entries[i].name))) {
            return true;
        }
    }
    return false;
}

/**
 * `go:embed all:dist` fails when the directory has no files, which is the
 * state of a fresh clone. Make sure at least one file is present before the
 * compiler is invoked; the real site replaces it during the frontend build.
 */
function ensureEmbedDir() {
    if (!existsSync(distDir)) {
        mkdirSync(distDir, {"recursive": true});
    }
    if (!hasFiles(distDir)) {
        writeFileSync(embedPlaceholder, embedPlaceholderContent, "utf8");
    }
}

/**
 * Builds the web bundle and stages it into the embed directory, then checks
 * the staged entry point really is on disk. The desktop binary is only as
 * complete as this directory, so a silent staging failure has to be a hard
 * error rather than a binary that renders nothing.
 */
function buildFrontend() {
    ensureEmbedDir();
    log("Building and staging the frontend bundle...");
    if (runShell("npm run build:desktop") !== 0) {
        fail("The frontend build failed. Run `npm run build:desktop` to see why.");
    }
    if (!existsSync(join(distDir, "index.html"))) {
        fail("The frontend bundle was not staged into " + distDir + ".");
    }
}

function humanSize(bytes) {
    if (bytes >= 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }
    return Math.ceil(bytes / 1024) + " KB";
}

/** The platform-appropriate build tags, matching what CI uses on Linux. */
function linuxTags(extra) {
    let hasTags = extra.some(function (arg) {
        return arg === "-tags" || arg === "--tags" || arg.startsWith("-tags=") || arg.startsWith("--tags=");
    });
    if (isLinux && !hasTags) {
        return ["-tags", "webkit2_41"];
    }
    return [];
}

function wailsLine(wails, subcommand, flags) {
    return ["\"" + wails + "\"", subcommand].concat(flags).join(" ");
}

/** Packages whatever the build produced into one archive under core/build/package. */
function archiveArtifacts() {
    if (!existsSync(binDir)) {
        fail("Nothing to package: " + binDir + " does not exist.\n" +
            "Run `npm run wails:build` first (or let `npm run wails:package` build it).");
    }
    // Wails writes the dev binary alongside the release binary; only the
    // release artifacts belong in a distributable.
    let contents = readdirSync(binDir).filter(function (name) {
        return name.indexOf("-dev") === -1;
    });
    if (contents.length === 0) {
        fail("Nothing to package: " + binDir + " holds no release artifacts.\n" +
            "Run `npm run wails:build` first (or let `npm run wails:package` build it).");
    }
    mkdirSync(packageDir, {"recursive": true});
    let extension = isWindows ? ".zip" : ".tar.gz";
    let archivePath = join(packageDir, appName + "-" + goos + "-" + goarch + extension);
    let quoted = contents.map(function (name) {
        return "\"" + name + "\"";
    }).join(" ");
    // bsdtar (Windows 10+, macOS, Linux) writes a zip with -a and a gzipped
    // tarball otherwise. Archiving from inside bin/ puts the artifacts at the
    // root of the archive.
    let line = isWindows
        ? "tar -a -c -f \"" + archivePath + "\" -C \"" + binDir + "\" " + quoted
        : "tar -c -z -f \"" + archivePath + "\" -C \"" + binDir + "\" " + quoted;
    if (runShell(line) !== 0) {
        fail("Packaging failed while creating " + archivePath);
    }
    log("");
    log("Packaged " + contents.join(", "));
    log("  -> " + archivePath.replace(root + "\\", "").replace(root + "/", "") +
        "  (" + humanSize(statSync(archivePath).size) + ")");
}

/**
 * The flags every build and dev run uses.
 *
 * `-skipbindings` keeps generated modules out of the tree (the app reads
 * `window.go` at runtime), and `-nosyncgomod` stops the CLI from rewriting the
 * pinned Wails version in go.mod to whatever CLI happens to be installed, so a
 * build never mutates the module file.
 */
function baseFlags(extra) {
    return ["-skipbindings", "-nosyncgomod"].concat(linuxTags(extra)).concat(extra);
}

function buildCommand(wails, extra, nsis) {
    let flags = baseFlags(extra);
    let skipFrontend = extra.some(function (arg) {
        return arg === "-s" || arg === "--skipfrontend";
    });
    if (!skipFrontend) {
        flags.push("-s");
    }
    if (nsis && !extra.includes("-nsis")) {
        flags.push("-nsis");
    }
    return wailsLine(wails, "build", flags);
}

function builtBinaryPath() {
    if (isMac) {
        return join(binDir, appBundle);
    }
    return join(binDir, binaryName);
}

function usage() {
    log("Wails task runner for the Chemistry Utility desktop wrapper.");
    log("");
    log("Usage: node scripts/wails.mjs <command> [wails flags...]");
    log("");
    log("Commands:");
    log("  doctor    Report the local Wails toolchain and platform support");
    log("  version   Print the Wails CLI version");
    log("  dev       Run the desktop app with live reload");
    log("  build     Build the native binary");
    log("  start     Launch the built binary");
    log("  package   Build and archive a distributable under core/build/package");
    log("  help      Show this message");
    log("");
    log("Every command after the subcommand is forwarded to the Wails CLI, so");
    log("for example `node scripts/wails.mjs dev -- --browser` opens the dev app");
    log("in a browser instead of a native window.");
}

function main() {
    let args = process.argv.slice(2);
    let command = args[0] ?? "help";
    let extra = args.slice(1);

    if (command === "help" || command === "-h" || command === "--help") {
        usage();
        return;
    }

    let wails = requireWails();

    if (command === "doctor") {
        process.exit(runShell(wailsLine(wails, "doctor", extra), {"cwd": coreDir}));
    }
    if (command === "version") {
        process.exit(runShell(wailsLine(wails, "version", extra), {"cwd": coreDir}));
    }
    if (command === "dev") {
        ensureEmbedDir();
        log("Starting the desktop app with live reload (Ctrl+C to stop)...");
        runLive(wailsLine(wails, "dev", baseFlags(extra)), {"cwd": coreDir});
        return;
    }
    if (command === "build") {
        buildFrontend();
        process.exit(runShell(buildCommand(wails, extra, false), {"cwd": coreDir}));
    }
    if (command === "package") {
        buildFrontend();
        // An NSIS installer needs makensis; when it is missing, the portable
        // archive is still produced and the reason is reported.
        let wantNsis = isWindows && commandExists("makensis");
        if (isWindows && !wantNsis) {
            log("makensis was not found, so no installer will be produced;");
            log("packaging the portable binary instead. Install NSIS and re-run to get one.");
        }
        let status = runShell(buildCommand(wails, extra, wantNsis), {"cwd": coreDir});
        if (status !== 0) {
            process.exit(status);
        }
        archiveArtifacts();
        return;
    }
    if (command === "start") {
        let target = builtBinaryPath();
        if (!existsSync(target)) {
            fail("The desktop app has not been built yet (" + target + " is missing).\n" +
                "Run `npm run wails:build` first.");
        }
        log("Launching " + target.replace(root + "\\", "").replace(root + "/", ""));
        if (isMac) {
            runLive("open \"" + target + "\"");
            return;
        }
        runLive("\"" + target + "\"");
        return;
    }

    fail("Unknown command: " + command + "\nRun `node scripts/wails.mjs help` for the list.");
}

main();
