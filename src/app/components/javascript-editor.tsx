import { javascript } from "@codemirror/lang-javascript";
import CodeMirrorEditor from "./codemirror/codemirror-editor";

export default function JavaScriptEditor({
    value,
    onValueChanged
}: {
    value: string,
    onValueChanged: (value: string) => void
}) {
    const onEditorExtensionsRequested = () => {
        return [
            javascript()
        ];
    };

    return (
        <CodeMirrorEditor value={value} readonly={false} onValueChanged={onValueChanged} onExtensionsRequested={onEditorExtensionsRequested} style={{ height: "100%" }} />
    );
}
