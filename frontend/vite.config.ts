import {defineConfig} from "vite";
import path from "path";
import {fileURLToPath} from "url";
import {renameSync, rmSync} from "fs";
import solid from "vite-plugin-solid";
const __dirname=path.dirname(fileURLToPath(import.meta.url));
// Vite names the emitted HTML after the source shell file, so both modes
// would end up as index.web.html / index.app.html. The Wails asset server
// and every static host expect dist/index.html, so move the shell there.
function emitIndexHtml() {
	return {
		name: "chemutil-emit-index-html",
		writeBundle(options: {dir?: string}, bundle: Record<string, {type: string}>) {
			const dir = options.dir;
			if (dir === undefined) {
				return;
			}
			for (const key of Object.keys(bundle)) {
				if (bundle[key].type === "asset" && key.endsWith(".html")) {
					renameSync(path.join(dir, key), path.join(dir, "index.html"));
				}
			}
		},
	};
}
// The desktop binary embeds dist, so the PWA files public/ copies in are
// dropped from the app build. The web build keeps them (entry.web.tsx
// registers the worker, index.web.html links the manifest). public/ is copied
// to disk rather than emitted into the bundle, so remove them after the write.
function stripPwaAssets() {
	return {
		name: "chemutil-strip-pwa",
		writeBundle(options: {dir?: string}) {
			if (options.dir === undefined) {
				return;
			}
			for (const name of ["sw.js", "manifest.webmanifest"]) {
				rmSync(path.join(options.dir, name), {force: true});
			}
		},
	};
}
export default defineConfig(({mode})=>{
	// "web" is the anonymous, SEO-optimised, hydrated build; "app" is the
	// CSR-only shell embedded in the desktop binary.
	const isWeb = mode !== "app";
	const shell = isWeb ? "index.web.html" : "index.app.html";
	return {
		base: "/",
		server:{
			port: 5173,
			open: false,
		},
		build:{
			minify: "oxc",
			cssMinify: true,
			target: "es2020",
			sourcemap: false,
			modulePreload: { polyfill: false },
			cssCodeSplit: true,
			rollupOptions:{
				// Object input so both modes emit dist/index.html regardless of
				// which shell file they were built from.
				input: {index: path.resolve(__dirname, shell)},
				output:{
					manualChunks(id){
						if (id.includes("node_modules")){
							if (id.includes("katex")) return "vendor-katex";
							if (id.includes("gsap")) return "vendor-gsap";
							if (id.includes("chart.js") || id.includes("chartjs")) return "vendor-chart";
							if (id.includes("fast-balance") || id.includes("chemparse")) return "vendor-chemistry";
							if (id.includes("solid-js") || id.includes("@solidjs")) return "vendor-solid";
							return "vendor";
						}
					},
				},
			},
			reportCompressedSize: true,
			chunkSizeWarningLimit: 500,
			emptyOutDir: true,
			commonjsOptions:{
				include: [/node_modules/],
			},
		},
		optimizeDeps:{
			include: ["katex","fast-balance"],
		},
		css:{
			modules:{
				localsConvention: "camelCaseOnly",
			},
			devSourcemap: false,
		},
		plugins: [
			// ssr: true keeps the client templates hydratable so entry.web.tsx
			// can adopt the markup renderToString emits in entrySsr.tsx.
			solid({ssr: true}),
			emitIndexHtml(),
			...(isWeb ? [] : [stripPwaAssets()]),
			// The dev server only ever looks for /index.html, so point it at
			// the shell the current mode builds from.
			{
				name: "chemutil-dev-shell",
				configureServer(server: {middlewares: {use: (fn: (req: {url?: string}, res: unknown, next: () => void) => void) => void}}) {
					server.middlewares.use(function (req: {url?: string}, _res: unknown, next: () => void): void {
						const url = (req.url ?? "").split("?")[0];
						if (url === "/" || url === "/index.html") {
							req.url = "/" + shell + (req.url ?? "").slice(url.length);
						}
						next();
					});
				},
			},
		],
	};
});
