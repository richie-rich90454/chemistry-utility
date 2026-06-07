import {defineConfig} from "vite";
import path from "path";
import {fileURLToPath} from "url";
import {createHtmlPlugin} from "vite-plugin-html";
const __dirname=path.dirname(fileURLToPath(import.meta.url));
export default defineConfig(({mode})=>({
	base: "/",
	server:{
		port: 5173,
		open: false,
	},
	build:{
		minify: "oxc",
		cssMinify: true,
		target: "es2015",
		sourcemap: false,
		rollupOptions:{
			input: mode==="app"
				?{index: path.resolve(__dirname, "index-app.html")}
				:{main: path.resolve(__dirname, "index.html"), app: path.resolve(__dirname, "index-app.html")},
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
}));
