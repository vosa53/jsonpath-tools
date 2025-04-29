import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    base: "./",
    plugins: [
        dts({
            include: ["lib"],
            rollupTypes: true
        })
    ],
    build: {
        lib: {
            entry: resolve(__dirname, "lib/index.ts"),
            fileName: "index",
            name: "codemirror-lang-jsonpath"
        },
        rollupOptions: {
            external: [/node_modules/, /@jsonpath-tools/]
        },
        copyPublicDir: false
    }
});