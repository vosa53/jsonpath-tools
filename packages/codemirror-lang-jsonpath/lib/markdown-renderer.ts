import markdownit from "markdown-it";
import { Highlighter } from "@lezer/highlight";
import { parser as jsonParser } from "@lezer/json";
import { parser as jsonPathDataTypeParser } from "./data-type/data-type-parser";
import { Parser } from "@lezer/common";
import MarkdownIt from "markdown-it";
import { highlightCodeToHTML, markdownItLinksTargetBlank } from "../../../shared/markdown";

/**
 * Renders Markdown code to HTML code.
 */
export class MarkdownRenderer {
    private readonly md: MarkdownIt;

    constructor(codeHighlighter: Highlighter) {
        this.md = markdownit({
            linkify: true,
            highlight: (code, language) => {
                const parser = parserMap.get(language);
                if (parser === undefined)
                    return code;
                else
                    return highlightCodeToHTML(code, parser, codeHighlighter);
            }
        })
            .use(markdownItLinksTargetBlank);
    }

    /**
     * Renders Markdown code to HTML code.
     * @param markdown Markdown code.
     * @returns Rendered HTML code.
     */
    renderToHTML(markdown: string): string {
        return this.md.render(markdown);
    }
}

const parserMap = new Map<string, Parser>([
    ["json", jsonParser],
    ["jsonpath-data-type", jsonPathDataTypeParser]
]);
