/**
 * Stages the built web bundle for the desktop embed.
 *
 * Go cannot embed a directory above its own module root, so core/main.go
 * embeds core/dist. This script builds nothing; it copies the existing
 * dist/ into core/dist so the desktop build picks it up without a
 * separate build step in wails.json.
 *
 * The embed file marker is preserved across staging. go:embed fails when the
 * embedded directory has no files, so core/dist carries a committed marker
 * that a fresh clone needs before the site has ever been built. Staging
 * replaces the directory's contents but keeps that marker, so the module still
 * compiles and the working tree stays clean.
 */
import {rmSync, mkdirSync, cpSync, existsSync, readdirSync, writeFileSync} from "node:fs";
import {join, dirname} from "node:path";
import {fileURLToPath} from "node:url";

const EMBED_MARKER = ".gitkeep";
const EMBED_MARKER_CONTENT = "Placeholder so go:embed has a file to embed. Contents are replaced by `npm run desktop:stage`.\n";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "dist");
const target = join(root, "core", "dist");

if (!existsSync(source)) {
    process.stderr.write("dist/ not found. Run `npm run build:web` first.\n");
    process.exit(1);
}

mkdirSync(target, { recursive: true });
// Drop everything from the previous build except the embed marker, so stale
// route directories cannot survive into the next bundle.
for (const entry of readdirSync(target)) {
    if (entry !== EMBED_MARKER) {
        rmSync(join(target, entry), { recursive: true, force: true });
    }
}
cpSync(source, target, { recursive: true });
// Always rewritten with the canonical text: the marker is committed, so an
// idempotent write keeps the working tree clean and repairs the file if
// anything ever truncates it.
writeFileSync(join(target, EMBED_MARKER), EMBED_MARKER_CONTENT, "utf8");
// The desktop binary embeds this directory, so an empty or partial stage would
// ship an app that renders nothing. Fail loudly instead of building on it.
if (!existsSync(join(target, "index.html"))) {
    process.stderr.write("staging failed: " + join(target, "index.html") + " was not written.\n");
    process.exit(1);
}
process.stdout.write("staged dist -> core/dist\n");
