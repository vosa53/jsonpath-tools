import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter } from "@codemirror/lint";
import CodeMirrorEditor from "./codemirror/codemirror-editor";

export default function JSONEditor({value, onValueChanged}: { value: string, onValueChanged: (value: string) => void }) {
    const onEditorExtensionsRequested = () => {
        return [
            json(),
            linter(jsonParseLinter())
        ];
    };

    return (
        <CodeMirrorEditor value={value} onValueChanged={onValueChanged} onExtensionsRequested={onEditorExtensionsRequested} style={{height: "100%"}} />
    );
}
