import { acceptCompletion } from "@codemirror/autocomplete";
import { indentLess, indentMore } from "@codemirror/commands";
import { KeyBinding } from "@codemirror/view";

/**
 * Application CodeMirror keymap.
 */
export const applicationKeymap: readonly KeyBinding[] = [
    {
        key: "Tab",
        run: acceptCompletion,
        preventDefault: true
    },
    {
        key: "Tab",
        run: indentMore,
        preventDefault: true
    },
    {
        key: "Shift-Tab",
        run: indentLess,
        preventDefault: true
    }
];