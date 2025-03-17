import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    worker: {
        plugins: () => [tsconfigPaths()],
    },
    resolve: {
        alias: [
            { find: "@tabler/icons-react", replacement: "@tabler/icons-react/dist/esm/icons/index.mjs" }
        ]
    }
})
