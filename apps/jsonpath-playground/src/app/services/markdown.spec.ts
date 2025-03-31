import { describe, expect, it } from "vitest";
import { renderMarkdownToHTML } from "./markdown";

describe("Markdown", () => {
    it("renderMarkdownToHTML - Renders a simple markdown to HTML", () => {
        expect(renderMarkdownToHTML(`# Heading`).trim()).toBe(`<h1>Heading</h1>`);
    });

    it("renderMarkdownToHTML - Renders links with target='blank'", () => {
        expect(renderMarkdownToHTML(`[Google](https://google.com)`).trim()).toBe(`<p><a href="https://google.com" target="_blank">Google</a></p>`);
    });

    it("renderMarkdownToHTML - Renders a code block with an unknown language as-is", () => {
        expect(renderMarkdownToHTML("```abc\ntest\n```").trim()).toBe(`<pre><code class="language-abc">test\n</code></pre>`);
    });

    it("renderMarkdownToHTML - Renders a 'json' code block highlighted", () => {
        expect(renderMarkdownToHTML("```json\n{ a: 123 }\n```").trim()).toBe(`<pre><code class="language-json"><span class="ͼ11">{</span> a: <span class="ͼv">123</span> <span class="ͼ11">}</span>\n</code></pre>`);
    });

    it("renderMarkdownToHTML - Renders a 'jsonpath' code block highlighted", () => {
        expect(renderMarkdownToHTML("```jsonpath\n$\n```").trim()).toBe(`<pre><code class="language-jsonpath"><span class="ͼu">$</span>\n</code></pre>`);
    });

    it("renderMarkdownToHTML - Renders a 'javascript' code block highlighted", () => {
        expect(renderMarkdownToHTML("```javascript\nconst abc = '';\n```").trim()).toBe(`<pre><code class="language-javascript"><span class="ͼo">const</span> <span class="ͼ1d">abc</span> <span class="ͼr">=</span> <span class="ͼx">''</span>;\n</code></pre>`);
    });

    it("renderMarkdownToHTML - Renders a 'typescript' code block highlighted", () => {
        expect(renderMarkdownToHTML("```typescript\nconst abc: def = '';\n```").trim()).toBe(`<pre><code class="language-typescript"><span class="ͼo">const</span> <span class="ͼ1d">abc</span>: <span class="ͼ1f">def</span> <span class="ͼr">=</span> <span class="ͼx">''</span>;\n</code></pre>`);
    });
});
