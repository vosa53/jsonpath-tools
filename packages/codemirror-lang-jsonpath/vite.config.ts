import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        dts({
            include: ["lib"],
            rollupTypes: true
        })
    ],
    build: {
        lib: {
            entry: resolve(__dirname, "lib/index.ts"),
            fileName: "index.js",
            name: "codemirror-lang-jsonpath"
        },
        rollupOptions: {
            external: [
                "@codemirror/autocomplete",
                "@codemirror/language",
                "@codemirror/lint",
                "@codemirror/state",
                "@codemirror/view",
                "@lezer/common",
                "@lezer/highlight",
                "markdown-it",
                "@jsonpath-tools/jsonpath"
            ]
        },
        copyPublicDir: false
    }
});