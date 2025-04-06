import markdownit from "markdown-it";
import { Highlighter } from "@lezer/highlight";
import { highlightCode } from "@lezer/highlight";
import { parser as jsonParser } from "@lezer/json";
import { parser as jsonPathDataTypeParser } from "./data-type/data-type-parser"
import { Parser } from "@lezer/common";
import { applicationHighlightStyle } from "../application-highlight-style";
import MarkdownIt from "markdown-it";

/**
 * Renders Markdown code to HTML code.
 */
export class MarkdownRenderer {
    private static readonly md = markdownit({
        linkify: true,
        highlight: function (code, language) {
            const parser = parserMap.get(language);
            if (parser === undefined)
                return code;
            else
                return highlightCodeToHTML(code, parser, applicationHighlightStyle);
        }
    })
        .use(markdownItLinksTargetBlank);

    /**
     * Renders Markdown code to HTML code.
     * @param markdown Markdown code.
     * @returns Rendered HTML code.
     */
    static renderToHTML(markdown: string): string {
        return this.md.render(markdown);
    }

    private constructor() { }
}

const parserMap = new Map<string, Parser>([
    ["json", jsonParser],
    ["jsonpath-data-type", jsonPathDataTypeParser]
]);

/**
 * Highlights the given code using the provided Lezer parser and highlighter and returns result as HTML code.
 * @param code Code.
 * @param parser Parser.
 * @param highlighter Highlighter.
 */
export function highlightCodeToHTML(code: string, parser: Parser, highlighter: Highlighter): string {
    const highlightedContainer = document.createElement("pre");
    const tree = parser.parse(code);

    highlightCode(
        code,
        tree,
        highlighter,
        (text: string, classes: string) => {
            let node: Node = document.createTextNode(text);
            if (classes.length !== 0) {
                const span = document.createElement("span");
                span.className = classes;
                span.appendChild(node);
                node = span;
            }
            highlightedContainer.appendChild(node);
        },
        () => {
            const node = document.createTextNode("\n");
            highlightedContainer.appendChild(node);
        }
    );

    return highlightedContainer.innerHTML;
}

/**
 * markdown-it plugin that adds `target="_blank"` to all links.
 */
export function markdownItLinksTargetBlank(md: MarkdownIt) {
    // Adapted from: https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer

    const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        tokens[idx].attrSet("target", "_blank");
        return defaultLinkOpen(tokens, idx, options, env, self);
    };
};