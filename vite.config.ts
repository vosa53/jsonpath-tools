import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";
import { pwaOptions } from "./pwa-options";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(), 
        tsconfigPaths(),
        VitePWA(pwaOptions)
    ],
    worker: {
        plugins: () => [tsconfigPaths()],
    },
    resolve: {
        alias: [
            { find: "@tabler/icons-react", replacement: "@tabler/icons-react/dist/esm/icons/index.mjs" }
        ]
    }
})
