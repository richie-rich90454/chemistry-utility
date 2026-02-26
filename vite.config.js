import {defineConfig} from "vite";
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {createHtmlPlugin} from "vite-plugin-html";
let __dirname=path.dirname(fileURLToPath(import.meta.url));
let terserConfig={};
try{
    let terserConfigPath=path.join(__dirname, "terser.config.json");
    if (fs.existsSync(terserConfigPath)){
        terserConfig=JSON.parse(fs.readFileSync(terserConfigPath, "utf-8"));
        console.log("Loaded terser.config.json");
    }
    else{
        console.warn("terser.config.json not found, using default Terser options");
    }
}
catch (err){
    console.error("Error reading terser.config.json:", err);
}
export default defineConfig({
    base: "/",
    server:{
        port: 3000,
        proxy:{
            "/api": "http://localhost:6005",
        },
        open: true,
    },
    build:{
        minify: "terser",
        terserOptions: terserConfig,
        cssMinify: true,
        target: "es6",
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
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                minifyCSS: true,
                minifyJS: true,
            },
        }),
    ],
    preview:{
        port: 5000,
        open: true,
    },
});