import { Command, EditorView, keymap } from "@codemirror/view"
import { languageServiceSessionStateField } from "./jsonpath-state";
import { OperationCancelledError } from "./cancellation-token";

export const format: Command = view => {
    formatAsync(view);
    return true;
};

async function formatAsync(view: EditorView) {
    const languageServiceSession = view.state.field(languageServiceSessionStateField);
    try {
        const formattingEdits = await languageServiceSession.getFormattingEdits();
        debugger;
        view.dispatch({
            changes: formattingEdits.map(fe => ({ from: fe.range.position, to: fe.range.position + fe.range.length, insert: fe.newText })),
        });
    }
    catch (error) {
        if (error instanceof OperationCancelledError) return [];
        else throw error;
    }
}

export const formatKeyMap = keymap.of([
    { key: "Alt-Shift-f", run: format }
]);