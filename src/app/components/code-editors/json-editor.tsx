import { JSONPathNormalizedPath } from "@/jsonpath-tools/transformations";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter } from "@codemirror/lint";
import { StateEffect } from "@codemirror/state";
import { EditorView } from "codemirror";
import { useEffect, useRef } from "react";
import CodeMirrorEditor from "./codemirror/codemirror-editor";
import { getNodeAtPath, matchHighlighter, updateCurrentPathHighlightEffect, updatePathsHighlightEffect } from "./path-highlighter";
import { EMPTY_ARRAY, logPerformance } from "@/jsonpath-tools/utils";

export default function JSONEditor({
    value,
    readonly = false,
    paths = EMPTY_ARRAY,
    currentPath = EMPTY_ARRAY,
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
            editorViewRef.current.dispatch({ effects: updatePathsHighlightEffect.of(paths) });
    }, [paths]);

    useEffect(() => {
        if (editorViewRef.current !== null) {
            logPerformance("Change current highlighted path", () => {
                const effects: StateEffect<any>[] = [updateCurrentPathHighlightEffect.of(currentPath)];
                const node = getNodeAtPath(currentPath, editorViewRef.current!.state);
                if (node !== null) effects.push(EditorView.scrollIntoView(node.from, { y: "center" }));
                editorViewRef.current!.dispatch({ effects });
            });
        }
    }, [currentPath]);

    const onEditorExtensionsRequested = () => {
        return [
            json(),
            linter(jsonParseLinter()), // TODO: Disable in readonly editor.
            matchHighlighter,
            EditorView.baseTheme({
                "& .cm-path": { background: "#fff9db" },
                "& .cm-path-current": { background: "#ffe8cc" }
            })
        ];
    };

    const onEditorViewCreated = (view: EditorView) => {
        view.dispatch({ effects: [updatePathsHighlightEffect.of(paths), updateCurrentPathHighlightEffect.of(currentPath)] });
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
