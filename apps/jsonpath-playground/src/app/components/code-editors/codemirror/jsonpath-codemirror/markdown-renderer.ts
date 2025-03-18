import markdownit from "markdown-it"

export class MarkdownRenderer {
    private static readonly md = markdownit();

    static renderToHTML(markdown: string): string {
        // TODO: Make sure that XSS is checked.
        return this.md.render(markdown);
    }
}