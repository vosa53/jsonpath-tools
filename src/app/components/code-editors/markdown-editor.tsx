import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "codemirror";
import CodeMirrorEditor from "./codemirror/codemirror-editor";

export default function MarkdownEditor({
    value,
    onValueChanged
}: {
    value: string,
    onValueChanged: (value: string) => void
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
            readonly={false} 
            onValueChanged={onValueChanged} 
            onExtensionsRequested={onEditorExtensionsRequested} 
            style={{ height: "100%" }} />
    );
}
