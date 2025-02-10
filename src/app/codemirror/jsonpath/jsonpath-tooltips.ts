import { syntaxTree } from "@codemirror/language";
import { Decoration, hoverTooltip } from "@codemirror/view";
import { EditorView } from "codemirror";
import { getJSONPath } from "./jsonpath-language";
import { TooltipProvider } from "@/app/parser/tooltip-provider";

const hoveredRangeDecoration = Decoration.mark({ class: "cm-hovered-range" });

const tooltip = hoverTooltip((view, pos, side) => {
    const jsonPath = getJSONPath(syntaxTree(view.state));
    const tooltip = TooltipProvider.provideTooltip(jsonPath, pos);
    if (tooltip === null) 
        return null;

    return {
        pos: tooltip.range.position,
        end: tooltip.range.position + tooltip.range.length,
        create(view) {
            const containerElement = document.createElement("div");
            const titleElement = document.createElement("strong");
            const textElement = document.createElement("div");
            containerElement.style.padding = "5px";
            titleElement.textContent = tooltip.title;
            textElement.textContent = tooltip.text;
            containerElement.appendChild(titleElement);
            containerElement.appendChild(textElement);
            return { dom: containerElement };
        }
    };
});

export const jsonPathTooltips = [
    tooltip,
    EditorView.baseTheme({
        "& .cm-hovered-range": { background: "rgba(0, 0, 0, 0.07)", outline: "solid 2px lightgray" }
    }),
    EditorView.decorations.from(tooltip.active, t => {
        return Decoration.set(t.map(t => hoveredRangeDecoration.range(t.pos, t.end)));
    }),
];