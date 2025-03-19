import { VitePWAOptions } from "vite-plugin-pwa";

export const pwaOptions: Partial<VitePWAOptions> = {
    manifest: {
        name: "JSONPath Playground",
        description: "Playground for JSONPath query language.",
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
        // Comment to disable PWA functionality in development.
        enabled: true
    }
};