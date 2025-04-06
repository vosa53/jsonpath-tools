import { Extension } from "@codemirror/state";
import { Decoration, hoverTooltip } from "@codemirror/view";
import { EditorView } from "codemirror";
import { OperationCancelledError } from "./cancellation-token";
import { languageServiceSessionStateField } from "./core";
import { MarkdownRenderer } from "./markdown-renderer";

/**
 * CodeMirror extension adding JSONPath hover tooltips.
 */
export function tooltip(): Extension {
    return [
        jsonPathHoverTooltip,
        jsonPathTooltipDecorations,
        jsonPathTooltipBaseTheme
    ];
}

const jsonPathHoverTooltip = hoverTooltip(async (view, pos, side) => {
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

const jsonPathTooltipRangeDecoration = Decoration.mark({ class: "cmjp-tooltip-range" });

const jsonPathTooltipDecorations = EditorView.decorations.from(jsonPathHoverTooltip.active, t => {
    return Decoration.set(t.map(t => jsonPathTooltipRangeDecoration.range(t.pos, t.end)));
});

const jsonPathTooltipBaseTheme = EditorView.baseTheme({
    "& .cmjp-tooltip-range": { background: "orange" }
});
