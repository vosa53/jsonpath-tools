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
            { text: "JSONPath Playground", link: "https://jsonpath-playground.pages.dev", target: "_blank" }
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
                    text: "Evaluator",
                    items: [
                        { text: "Get Started", link: "/documentation/evaluator/get-started" }
                    ]
                },
                {
                    text: "Editor",
                    items: [
                        { text: "Get Started", link: "/documentation/editor/get-started" },
                        { text: "React", link: "/documentation/editor/react-component" },
                        { text: "CodeMirror", link: "/documentation/editor/codemirror-plugin" }
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
