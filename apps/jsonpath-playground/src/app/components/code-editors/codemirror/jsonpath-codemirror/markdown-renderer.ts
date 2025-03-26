import markdownit from "markdown-it";
import { Highlighter } from "@lezer/highlight";
import { highlightCode } from "@lezer/highlight";
import { parser as jsonParser } from "@lezer/json";
import { parser as jsonPathDataTypeParser } from "./data-type/data-type-parser"
import { Parser } from "@lezer/common";
import { highlightStyle } from "../highlight-style";

export class MarkdownRenderer {
    private static readonly md = markdownit({
        linkify: true,
        highlight: function (code, language) {
            const parser = parserMap.get(language);
            if (parser === undefined)
                return code;
            else
                return highlight(code, parser, highlightStyle);
        }
    });

    static renderToHTML(markdown: string): string {
        return this.md.render(markdown);
    }
}

const parserMap = new Map<string, Parser>([
    ["json", jsonParser],
    ["jsonpath-data-type", jsonPathDataTypeParser]
]);

function highlight(code: string, parser: Parser, highlighter: Highlighter): string {
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