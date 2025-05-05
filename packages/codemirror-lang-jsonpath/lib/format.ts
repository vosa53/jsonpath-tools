import { Command, EditorView, keymap } from "@codemirror/view";
import { OperationCancelledError } from "./cancellation-token";
import { languageServiceSessionStateField } from "./core";

/**
 * CodeMirror command to format a JSONPath query.
 */
export const format: Command = view => {
    formatAsync(view);
    return true;
};

/**
 * Default CodeMirror keymap for JSONPath formatting using `Alt+Shift+F`.
 */
export const formatKeymap = keymap.of([
    { key: "Alt-Shift-f", run: format }
]);

async function formatAsync(view: EditorView) {
    const languageServiceSession = view.state.field(languageServiceSessionStateField);
    try {
        const formattingEdits = await languageServiceSession.getFormattingEdits();
        view.dispatch({
            changes: formattingEdits.map(fe => ({ from: fe.range.position, to: fe.range.position + fe.range.length, insert: fe.newText })),
        });
    }
    catch (error) {
        if (!(error instanceof OperationCancelledError)) throw error;
    }
}
