import {defineConfig} from "vite";
import path from "path";
import {fileURLToPath} from "url";
import {createHtmlPlugin} from "vite-plugin-html";
import solid from "vite-plugin-solid";
const __dirname=path.dirname(fileURLToPath(import.meta.url));
export default defineConfig(({mode})=>({
	base: "/",
	server:{
		port: 5173,
		open: false,
		proxy:{
			"/api":{
				target: "http://localhost:6005",
				changeOrigin: true,
			},
		},
	},
	build:{
		minify: "oxc",
		cssMinify: true,
		target: "es2020",
		sourcemap: false,
		modulePreload: { polyfill: false },
		cssCodeSplit: true,
		rollupOptions:{
			input: path.resolve(__dirname, "index.html"),
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
		solid(),
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
