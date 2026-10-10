/**
 * Stages the built frontend for the desktop embed.
 *
 * Go cannot embed a directory above its own module root, so core/main.go
 * embeds core/dist. This script builds nothing; it copies the existing
 * frontend/dist into core/dist so the desktop build picks it up without a
 * separate build step in wails.json.
 */
import {rmSync, mkdirSync, cpSync, existsSync} from "node:fs";
import {join, dirname} from "node:path";
import {fileURLToPath} from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "frontend", "dist");
const target = join(root, "core", "dist");

if (!existsSync(source)) {
    process.stderr.write("frontend/dist not found. Run `npm run build:web` first.\n");
    process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
process.stdout.write("staged frontend/dist -> core/dist\n");

