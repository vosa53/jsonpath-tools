import { KeyBinding } from "@codemirror/view";
import { indentMore, indentLess } from "@codemirror/commands";
import { acceptCompletion } from "@codemirror/autocomplete";

export const tabKeymap: readonly KeyBinding[] = [
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