import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter } from "@codemirror/lint";
import CodeMirrorEditor from "./codemirror/codemirror-editor";
import { matchHighlighter, updatePathsHighlightEffect } from "./path-highlighter";
import { EditorView } from "codemirror";
import { useEffect, useRef } from "react";
import { JSONPathNormalizedPath } from "@/jsonpath-tools/transformations";

export default function JSONEditor({
    value,
    readonly = false,
    paths = [],
    currentPath = [],
    onValueChanged
}: {
    value: string,
    readonly?: boolean,
    paths?: readonly JSONPathNormalizedPath[],
    currentPath?: JSONPathNormalizedPath,
    onValueChanged: (value: string) => void
}) {
    const editorViewRef = useRef<EditorView>(null);

    useEffect(() => {
        if (editorViewRef.current !== null)
            editorViewRef.current.dispatch({ effects: updatePathsHighlightEffect.of({ paths: paths, currentPath: currentPath }) });
    }, [paths, currentPath]);

    const onEditorExtensionsRequested = () => {
        return [
            json(),
            linter(jsonParseLinter()), // TODO: Disable in readonly editor.
            matchHighlighter,
            EditorView.baseTheme({
                "& .cm-path": { background: "#fff3bf" },
                "& .cm-path-current": { background: "#ffc078" }
            })
        ];
    };

    const onEditorViewCreated = (view: EditorView) => {
        view.dispatch({ effects: updatePathsHighlightEffect.of({ paths: paths, currentPath: currentPath }) });
        editorViewRef.current = view;
    };

    return (
        <CodeMirrorEditor
            value={value}
            readonly={readonly}
            onValueChanged={onValueChanged}
            onExtensionsRequested={onEditorExtensionsRequested}
            onEditorViewCreated={onEditorViewCreated}
            style={{ height: "100%" }} />
    );
}
