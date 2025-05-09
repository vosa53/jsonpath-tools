import { defineConfig } from "vitepress";
import typedocSidebar from "../api/typedoc-sidebar.json";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "JSONPath Tools",
    description: "Tools for JSONPath query language.",
    cleanUrls: true,
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "Documentation", link: "/documentation/introduction/overview" },
            { text: "API Reference", link: "/api" },
            { text: "JSONPath Playground", link: "https://jsonpath.dev", target: "_blank" }
        ],

        sidebar: {
            "/documentation/": [
                {
                    text: "Introduction",
                    items: [
                        { text: "Overview", link: "/documentation/introduction/overview" }
                    ]
                },
                {
                    text: "Core",
                    items: [
                        { text: "Get Started", link: "/documentation/core/get-started" },
                        { text: "Custom Functions", link: "/documentation/core/custom-functions" },
                        { text: "Editor Services", link: "/documentation/core/editor-services" }
                    ]
                },
                {
                    text: "Editor",
                    items: [
                        { text: "Get Started", link: "/documentation/editor/get-started" },
                        { text: "React", link: "/documentation/editor/react-component" },
                        { text: "CodeMirror", link: "/documentation/editor/codemirror-extension" }
                    ]
                }
            ],
            "/api/": [
                {
                    text: "API Reference",
                    items: typedocSidebar
                }
            ]
        },

        outline: {
            level: [2, 3]
        },

        socialLinks: [
            { icon: "github", link: "https://github.com/vosa53/jsonpath-tools" }
        ]
    },
    base: "/jsonpath-tools/"
});
