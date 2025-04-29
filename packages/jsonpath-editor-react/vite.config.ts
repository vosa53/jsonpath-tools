import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react-swc";
import { libInjectCss } from "vite-plugin-lib-inject-css";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    base: "./",
    plugins: [
        dts({
            include: ["lib"],
            rollupTypes: true
        }),
        react(),
        libInjectCss()
    ],
    build: {
        lib: {
            entry: resolve(__dirname, "lib/index.ts"),
            fileName: "index",
            name: "jsonpath-editor-react"
        },
        rollupOptions: {
            external: [
                "@codemirror/search",
                "@codemirror/commands",
                "@codemirror/autocomplete",
                "@codemirror/language",
                "@codemirror/lint",
                "@codemirror/state",
                "@codemirror/view",
                "@lezer/highlight",
                "@jsonpath-tools/codemirror-lang-jsonpath",
                "@jsonpath-tools/jsonpath",
                "react",
                "react/jsx-runtime"
            ]
        },
        copyPublicDir: false
    }
});