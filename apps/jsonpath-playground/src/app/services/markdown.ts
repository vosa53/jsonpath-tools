import markdownit from "markdown-it";

const md = markdownit();

export function renderMarkdownToHTML(markdown: string): string {
    return md.render(markdown);
}