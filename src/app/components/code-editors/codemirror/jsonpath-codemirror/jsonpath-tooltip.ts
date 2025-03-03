import { Decoration, hoverTooltip } from "@codemirror/view";
import { EditorView } from "codemirror";
import { OperationCancelledError } from "./cancellation-token";
import { languageServiceSessionStateField } from "./jsonpath-state";
import { MarkdownRenderer } from "./markdown-renderer";

const tooltip = hoverTooltip(async (view, pos, side) => {
    const languageServiceSession = view.state.field(languageServiceSessionStateField);
    try {
        const tooltip = await languageServiceSession.getTooltip(pos);
        if (tooltip === null)
            return null;
        return {
            pos: tooltip.range.position,
            end: tooltip.range.position + tooltip.range.length,
            create(view) {
                const containerElement = document.createElement("div");
                containerElement.style.padding = "10px";
                containerElement.innerHTML = MarkdownRenderer.renderToHTML(tooltip.text);
                return { dom: containerElement };
            }
        };
    }
    catch (error) {
        if (error instanceof OperationCancelledError) return null;
        else throw error;
    }
});

const hoveredRangeDecoration = Decoration.mark({ class: "cm-hovered-range" });

export const jsonPathTooltip = [
    tooltip,
    EditorView.baseTheme({
        "& .cm-hovered-range": { background: "#ff922b30" /*background: "rgba(0, 0, 0, 0.07)", outline: "solid 2px lightgray"*/ }
    }),
    EditorView.decorations.from(tooltip.active, t => {
        return Decoration.set(t.map(t => hoveredRangeDecoration.range(t.pos, t.end)));
    }),
];