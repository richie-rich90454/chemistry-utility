import {defineConfig} from "vite";
import path from "path";
import {fileURLToPath} from "url";
import {createHtmlPlugin} from "vite-plugin-html";
const __dirname=path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
	base: "/",
	server:{
		port: 6005,
		proxy:{
			"/api": "http://localhost:6005",
		},
		open: false,
	},
	build:{
		minify: "oxc",
		cssMinify: true,
		target: "es2015",
		sourcemap: false,
		rollupOptions:{
			output:{
				manualChunks(id){
					if (id.includes("node_modules")){
						if (id.includes("katex")){
							return "vendor-katex";
						}
						return "vendor";
					}
				},
			},
		},
		reportCompressedSize: true,
		chunkSizeWarningLimit: 1000,
		emptyOutDir: true,
		commonjsOptions:{
			include: [/node_modules/],
		},
	},
	optimizeDeps:{
		include: ["katex"],
	},
	css:{
		modules: false,
		postcss: path.join(__dirname, "postcss.config.js"),
	},
	plugins: [
		createHtmlPlugin({
			minify:{
				collapseWhitespace: true,
				removeComments: true,
				removeRedundantAttributes: false,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true,
				useShortDoctype: true,
				minifyCSS: false,
				minifyJS: false,
			},
		}),
	],
	preview:{
		port: 6005,
		open: false,
	},
});