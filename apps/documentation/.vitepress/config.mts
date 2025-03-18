import { defineConfig } from "vitepress"

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "JSONPath Tools",
    description: "Tools for JSONPath query language.",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "Documentation", link: "/documentation" },
            { text: "JSONPath Playground", link: "https://jsonpath-playground.pages.dev", target: "_blank" }
        ],

        sidebar: [
            {
                text: "Documentation",
                items: [
                    { text: "Documentation", link: "/documentation" },
                    { text: "Get Started", link: "/api-examples" }
                ]
            },
            {
                text: "API Reference",
                items: [
                    { text: "TODO", link: "/documentation" }
                ]
            }
        ],

        socialLinks: [
            { icon: "github", link: "https://github.com/vosa53/jsonpath-tools" }
        ]
    },
    base: "/jsonpath-tools/"
})
