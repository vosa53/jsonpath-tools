import { useMemo } from "react";
import { renderMarkdownToHTML } from "../services/markdown";

export function MarkdownView({ markdown, withSpacing = false }: { markdown: string, withSpacing?: boolean }) {
    const markdownHTML = useMemo(() => renderMarkdownToHTML(markdown), [markdown]);
    return (
        <div className={withSpacing ? "with-spacing" : undefined} dangerouslySetInnerHTML={{ __html: markdownHTML }}></div>
    );
}