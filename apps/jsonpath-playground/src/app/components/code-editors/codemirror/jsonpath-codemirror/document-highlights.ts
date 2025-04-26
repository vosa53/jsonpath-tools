import { DocumentHighlight } from "@jsonpath-tools/jsonpath";
import { EditorState, Extension, StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { OperationCancelledError } from "./cancellation-token";
import { languageServiceSessionStateField } from "./core";

/**
 * CodeMirror extension adding JSONPath document highlights.
 */
export function documentHighlights(): Extension {
    return [
        documentsHighlightsPlugin,
        documentHighlightsBaseTheme
    ];
}

const setDocumentHighlightsEffect = StateEffect.define<DecorationSet>();

const documentHighlightDecoration = Decoration.mark({ class: "cmjp-document-highlight" });

const documentHighlightsStateField = StateField.define<DecorationSet>({
    create(state) {
        return Decoration.none;
    },

    update(documentHighlights, transaction) {
        for (const effect of transaction.effects) {
            if (effect.is(setDocumentHighlightsEffect))
                return effect.value;
        }

        if (documentHighlights.size > 0) {
            let isInDecoration = false;
            const cursorPosition = transaction.state.selection.main.head;
            documentHighlights.between(cursorPosition, cursorPosition, () => { isInDecoration = true; return false; });
            if (!isInDecoration || transaction.docChanged)
                return Decoration.none;
        }

        return documentHighlights;
    },

    provide: f => EditorView.decorations.from(f, dh => dh)
});

const documentsHighlightsPlugin = ViewPlugin.fromClass(class {
    private timeoutId: number | undefined = undefined;

    constructor(private readonly view: EditorView) { }

    update(update: ViewUpdate) {
        const wasChange = update.docChanged || update.transactions.some(t => t.startState.selection.main.head !== t.state.selection.main.head);
        if (wasChange)
            this.scheduleDocumentHighlightsUpdate();
    }

    private async updateDocumentHighlights(state: EditorState): Promise<void> {
        const languageServiceSession = state.field(languageServiceSessionStateField);
        try {
            const documentHighlights = await languageServiceSession.getDocumentHighlights(state.selection.main.head);
            const decorations = this.createDecorations(documentHighlights);
            this.view.dispatch({ effects: setDocumentHighlightsEffect.of(decorations) });
        }
        catch (error) {
            if (!(error instanceof OperationCancelledError))
                throw error;
        }
    }

    private scheduleDocumentHighlightsUpdate() {
        if (this.timeoutId !== undefined) window.clearTimeout(this.timeoutId);
        this.timeoutId = window.setTimeout(() => {
            this.updateDocumentHighlights(this.view.state);
        }, 400);
    }

    private createDecorations(documentHighlights: DocumentHighlight[]): DecorationSet {
        return Decoration.set(documentHighlights.map(dh => documentHighlightDecoration.range(dh.range.position, dh.range.position + dh.range.length)));
    }
}, {
    provide: v => documentHighlightsStateField
});

const documentHighlightsBaseTheme = EditorView.baseTheme({
    "& .cmjp-document-highlight": { background: "#328c8252" }
});
