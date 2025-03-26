import { Parser } from "@lezer/common";
import { parser as jsonParser } from "@lezer/json";
import { parser as javaScriptParser } from "@lezer/javascript";
import markdownit from "markdown-it";
import { highlight, markdownItLinksTargetBlank } from "../components/code-editors/codemirror/jsonpath-codemirror/markdown-renderer";
import { highlightStyle } from "../components/code-editors/codemirror/highlight-style";
import { jsonPathParser } from "../components/code-editors/codemirror/jsonpath-codemirror/jsonpath-parser";

const md = markdownit({
    linkify: true,
    highlight: function (code, language) {
        const parser = parserMap.get(language);
        if (parser === undefined)
            return code;
        else
            return highlight(code, parser, highlightStyle);
    }
})
    .use(markdownItLinksTargetBlank);

const parserMap = new Map<string, Parser>([
    ["json", jsonParser],
    ["jsonpath", jsonPathParser],
    ["javascript", javaScriptParser],
    ["typescript", javaScriptParser.configure({ dialect: "ts" })]
]);

export function renderMarkdownToHTML(markdown: string): string {
    return md.render(markdown);
}
