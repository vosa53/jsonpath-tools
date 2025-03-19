import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "codemirror";
import CodeMirrorEditor from "./codemirror/codemirror-editor";
import { FocusEventHandler } from "react";

export default function MarkdownEditor({
    value,
    onValueChanged,
    onFocus,
    onBlur
}: {
    value: string,
    onValueChanged: (value: string) => void,
    onFocus?: FocusEventHandler<HTMLElement>,
    onBlur?: FocusEventHandler<HTMLElement>
}) {
    const onEditorExtensionsRequested = () => {
        return [
            markdown(),
            EditorView.lineWrapping,
            EditorView.theme({
                "& .cm-content": { fontFamily: "var(--mantine-font-family) !important" }
            }),
        ];
    };

    return (
        <CodeMirrorEditor
            value={value}
            style={{ height: "100%" }}
            onValueChanged={onValueChanged}
            onExtensionsRequested={onEditorExtensionsRequested} 
            onFocus={onFocus}
            onBlur={onBlur} />
    );
}
