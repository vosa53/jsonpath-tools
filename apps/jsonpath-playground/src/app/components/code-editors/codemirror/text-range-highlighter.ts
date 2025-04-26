import { TextRange } from "@jsonpath-tools/jsonpath";
import { Extension, StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";

/**
 * CodeMirror extension to highlight a given text range.
 */
export function textRangeHighlighter(): Extension {
    return [
        highlightedRangeStateField,
        rangeHighlighterBaseTheme
    ];
}

/**
 * State effect to set the current highlighted range.
 */
export const setHighlightedRangeEffect = StateEffect.define<TextRange | null>({
    map: (textRange, change) => {
        if (textRange === null) return null;
        const mappedPosition = change.mapPos(textRange.position);
        return new TextRange(
            mappedPosition,
            change.mapPos(textRange.position + textRange.length) - mappedPosition
        );
    }
});

const highlightedRangeStateField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },
    update(highlightedRanges, transaction) {
        highlightedRanges = highlightedRanges.map(transaction.changes);
        for (const effect of transaction.effects) {
            if (effect.is(setHighlightedRangeEffect)) {
                if (effect.value === null || effect.value.length === 0)
                    highlightedRanges = Decoration.none;
                else
                    highlightedRanges = Decoration.set(highlightedRangeDecoration.range(effect.value.position, effect.value.position + effect.value.length));
            }
        }
        return highlightedRanges;
    },
    provide: f => EditorView.decorations.from(f)
})

const highlightedRangeDecoration = Decoration.mark({ class: "cmjpp-highlighted-range" });

const rangeHighlighterBaseTheme = EditorView.baseTheme({
    "& .cmjpp-highlighted-range": { background: "orange" }
});
