import { defineConfig } from "vitepress";
import typedocSidebar from "../api/typedoc-sidebar.json";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "JSONPath Tools",
    description: "Tools for JSONPath query language.",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "Documentation", link: "/introduction/overview" },
            { text: "API Reference", link: "/api" },
            { text: "JSONPath Playground", link: "https://jsonpath-playground.pages.dev", target: "_blank" }
        ],

        sidebar: [
            {
                text: "Introduction",
                items: [
                    { text: "Overview", link: "/introduction/overview" }
                ]
            },
            {
                text: "Evaluator",
                items: [
                    { text: "Get Started", link: "/evaluator/get-started" }
                ]
            },
            {
                text: "Editor",
                items: [
                    { text: "Get Started", link: "/editor/get-started" },
                    { text: "React", link: "/editor/react-component" },
                    { text: "CodeMirror", link: "/editor/codemirror-plugin" }
                ]
            },
            {
                text: "API Reference",
                items: typedocSidebar
            }
        ],

        socialLinks: [
            { icon: "github", link: "https://github.com/vosa53/jsonpath-tools" }
        ]
    },
    base: "/jsonpath-tools/"
})
