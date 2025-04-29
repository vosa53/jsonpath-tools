import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import basicSsl from "@vitejs/plugin-basic-ssl";
//import { VitePWA } from "vite-plugin-pwa";
//import { pwaOptions } from "./pwa-options";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        //VitePWA(pwaOptions),
        basicSsl()
    ],
    server: {
        port: 3000
    },
    preview: {
        port: 3000
    },
    resolve: {
        alias: [
            { find: "@tabler/icons-react", replacement: "@tabler/icons-react/dist/esm/icons/index.mjs" }
        ]
    },
    define: {
        JSONPATH_TOOLS_VERSION: JSON.stringify(process.env.npm_package_version)
    }
})
