import { Parser } from "@lezer/common";
import { parser as jsonParser } from "@lezer/json";
import { parser as javaScriptParser } from "@lezer/javascript";
import markdownit from "markdown-it";
import { highlight, markdownItLinksTargetBlank } from "../components/code-editors/codemirror/jsonpath-codemirror/markdown-renderer";
import { applicationHighlightStyle } from "../components/code-editors/codemirror/application-highlight-style";
import { parser } from "../components/code-editors/codemirror/jsonpath-codemirror/parser";

/**
 * Renders Markdown code to HTML code.
 * @param markdown Markdown code.
 * @returns Rendered HTML code.
 */
export function renderMarkdownToHTML(markdown: string): string {
    return md.render(markdown);
}

const md = markdownit({
    linkify: true,
    highlight: function (code, language) {
        const parser = parserMap.get(language);
        if (parser === undefined)
            return code;
        else
            return highlight(code, parser, applicationHighlightStyle);
    }
})
    .use(markdownItLinksTargetBlank);

const parserMap = new Map<string, Parser>([
    ["json", jsonParser],
    ["jsonpath", parser],
    ["javascript", javaScriptParser],
    ["typescript", javaScriptParser.configure({ dialect: "ts" })]
]);
