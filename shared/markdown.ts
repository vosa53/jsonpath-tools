import { Highlighter } from "@lezer/highlight";
import { highlightCode } from "@lezer/highlight";
import { Parser } from "@lezer/common";
import MarkdownIt from "markdown-it";

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