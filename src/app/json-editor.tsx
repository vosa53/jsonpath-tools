import { json, jsonLanguage, jsonParseLinter } from "@codemirror/lang-json";
import CodeMirrorEditor from "./codemirror/codemirror-editor";
import { useState } from "react";
import { linter } from "@codemirror/lint";

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
