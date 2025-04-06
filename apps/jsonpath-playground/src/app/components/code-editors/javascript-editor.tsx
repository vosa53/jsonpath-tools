import { javascript } from "@codemirror/lang-javascript";
import CodeMirrorEditor from "./codemirror/codemirror-editor";
import { FocusEventHandler } from "react";

/**
 * JavaScript editor component.
 */
export default function JavaScriptEditor({
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
            javascript()
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
