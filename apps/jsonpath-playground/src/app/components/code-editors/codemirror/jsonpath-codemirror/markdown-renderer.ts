import markdownit from "markdown-it";

export class MarkdownRenderer {
    private static readonly md = markdownit({ linkify: true });

    static renderToHTML(markdown: string): string {
        return this.md.render(markdown);
    }
}