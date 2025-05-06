import { VitePWAOptions } from "vite-plugin-pwa";

export const pwaOptions: Partial<VitePWAOptions> = {
    manifest: {
        name: "JSONPath Playground",
        short_name: "JSONPath Playground",
        description: "Playground for JSONPath (RFC 9535) query language.",
        start_url: "/",
        display: "standalone",
        icons: [
            {
                src: "/icon.svg",
                type: "image/svg+xml",
                sizes: "any"
            }
        ],
        theme_color: "#7048e8"
    },
    devOptions: {
        // Enables PWA functionality in development.
        enabled: true
    }
};