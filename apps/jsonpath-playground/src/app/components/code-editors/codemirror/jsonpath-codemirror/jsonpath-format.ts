import { Command, EditorView, keymap } from "@codemirror/view";
import { OperationCancelledError } from "./cancellation-token";
import { languageServiceSessionStateField } from "./jsonpath-state";

export const jsonPathFormat: Command = view => {
    formatAsync(view);
    return true;
};

export const jsonPathFormatKeyMap = keymap.of([
    { key: "Alt-Shift-f", run: jsonPathFormat }
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
        if (error instanceof OperationCancelledError) return [];
        else throw error;
    }
}
