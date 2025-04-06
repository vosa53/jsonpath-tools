import markdownit from "markdown-it";
import { Highlighter } from "@lezer/highlight";
import { highlightCode } from "@lezer/highlight";
import { parser as jsonParser } from "@lezer/json";
import { parser as jsonPathDataTypeParser } from "./data-type/data-type-parser"
import { Parser } from "@lezer/common";
import { applicationHighlightStyle } from "../application-highlight-style";
import MarkdownIt from "markdown-it";

export class MarkdownRenderer {
    private static readonly md = markdownit({
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

    static renderToHTML(markdown: string): string {
        return this.md.render(markdown);
    }
}

const parserMap = new Map<string, Parser>([
    ["json", jsonParser],
    ["jsonpath-data-type", jsonPathDataTypeParser]
]);

export function highlight(code: string, parser: Parser, highlighter: Highlighter): string {
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

// Adapted from: https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
export function markdownItLinksTargetBlank(md: MarkdownIt) {
    const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        tokens[idx].attrSet("target", "_blank");
        return defaultLinkOpen(tokens, idx, options, env, self);
    };
};