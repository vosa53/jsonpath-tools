import { TooltipProvider } from "@/jsonpath-tools/editor-services/tooltip-provider";
import { syntaxTree } from "@codemirror/language";
import { Decoration, hoverTooltip } from "@codemirror/view";
import { EditorView } from "codemirror";
import { getJSONPath } from "./jsonpath-parser";
import { defaultJSONPathOptions } from "@/jsonpath-tools/options";

const tooltip = hoverTooltip((view, pos, side) => {
    // TODO: Pass actual options.
    const tooltipProvider = new TooltipProvider(defaultJSONPathOptions);
    const jsonPath = getJSONPath(syntaxTree(view.state));
    const tooltip = tooltipProvider.provideTooltip(jsonPath, pos);
    if (tooltip === null)
        return null;

    return {
        pos: tooltip.range.position,
        end: tooltip.range.position + tooltip.range.length,
        create(view) {
            const containerElement = document.createElement("div");
            const titleElement = document.createElement("strong");
            const textElement = document.createElement("div");
            containerElement.style.padding = "10px";
            titleElement.textContent = tooltip.title;
            textElement.textContent = tooltip.text;
            containerElement.appendChild(titleElement);
            containerElement.appendChild(textElement);
            return { dom: containerElement };
        }
    };
});

const hoveredRangeDecoration = Decoration.mark({ class: "cm-hovered-range" });

export const jsonPathTooltip = [
    tooltip,
    EditorView.baseTheme({
        "& .cm-hovered-range": { background: "rgba(0, 0, 0, 0.07)", outline: "solid 2px lightgray" }
    }),
    EditorView.decorations.from(tooltip.active, t => {
        return Decoration.set(t.map(t => hoveredRangeDecoration.range(t.pos, t.end)));
    }),
];