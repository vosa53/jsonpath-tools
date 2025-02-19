import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter } from "@codemirror/lint";
import CodeMirrorEditor from "./codemirror/codemirror-editor";

export default function JSONEditor({
    value,
    readonly = false,
    onValueChanged
}: {
    value: string,
    readonly?: boolean,
    onValueChanged: (value: string) => void
}) {
    const onEditorExtensionsRequested = () => {
        return [
            json(),
            linter(jsonParseLinter())
        ];
    };

    return (
        <CodeMirrorEditor value={value} readonly={readonly} onValueChanged={onValueChanged} onExtensionsRequested={onEditorExtensionsRequested} style={{ height: "100%" }} />
    );
}
