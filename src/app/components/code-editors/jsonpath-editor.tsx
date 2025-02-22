import { defaultJSONPathOptions, JSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { syntaxTree } from "@codemirror/language";
import { EditorView } from "codemirror";
import { useEffect, useRef } from "react";
import { JSONPathDiagnostics } from "../../../jsonpath-tools/diagnostics";
import CodeMirrorEditor from "./codemirror/codemirror-editor";
import { jsonPath } from "./codemirror/jsonpath-codemirror/jsonpath-language";
import { getJSONPath } from "./codemirror/jsonpath-codemirror/jsonpath-parser";
import { getResult, updateOptionsEffect, updateQueryArgumentEffect } from "./codemirror/jsonpath-codemirror/jsonpath-state";

export default function JSONPathEditor({
    value,
    options = defaultJSONPathOptions,
    queryArgument = {},
    readonly = false,
    onValueChanged,
    onParsed,
    onDiagnosticsCreated,
    onGetResultAvailable
}: {
    value: string,
    options?: JSONPathOptions,
    queryArgument?: JSONPathJSONValue,
    readonly?: boolean,
    onValueChanged: (value: string) => void,
    onParsed?: (jsonPath: JSONPath) => void,
    onDiagnosticsCreated?: (diagnostics: readonly JSONPathDiagnostics[]) => void,
    onGetResultAvailable?: (getResult: () => Promise<{ nodes: readonly JSONPathJSONValue[], paths: readonly (string | number)[][] }>) => void
}) {
    const editorViewRef = useRef<EditorView>(null);
    //const resultSetTimeoutRef = useRef<number>(null);

    /*useEffect(() => {
        if (resultSetTimeoutRef.current !== null) window.clearTimeout(resultSetTimeoutRef.current);
        resultSetTimeoutRef.current = window.setTimeout(async () => {
            if (onResultCreated === undefined || editorViewRef.current === null) return;
            try {
                const result = await getResult(editorViewRef.current.state);
                onResultCreated(result);
            }
            catch (error) {
                if (!(error instanceof OperationCancelledError)) throw error;
            }
        }, 500);
    }, [value, options, queryArgument]);*/


    useEffect(() => {
        if (editorViewRef.current !== null)
            editorViewRef.current.dispatch({ effects: updateOptionsEffect.of(options) });
    }, [options]);

    useEffect(() => {
        if (editorViewRef.current !== null)
            editorViewRef.current.dispatch({ effects: updateQueryArgumentEffect.of(queryArgument) });
    }, [queryArgument]);

    const onEditorExtensionsRequested = () => {
        return [
            jsonPath({ onDiagnosticsCreated }),
            EditorView.theme({
                "&": { fontSize: "18px !important" },
                "& .cm-content": { padding: "10px 0" }
            }),
            EditorView.updateListener.of(u => {
                if (u.docChanged) {
                    const jsonPath = getJSONPath(syntaxTree(u.view.state));
                    onParsed?.(jsonPath);
                }
            }),
        ];
    };

    const onEditorViewCreated = (view: EditorView) => {
        view.dispatch({ effects: [updateOptionsEffect.of(options), updateQueryArgumentEffect.of(queryArgument)] });
        editorViewRef.current = view;
        onGetResultAvailable?.(() => getResult(view.state));
    };

    return (
        <CodeMirrorEditor
            value={value}
            readonly={readonly}
            onValueChanged={onValueChanged}
            onExtensionsRequested={onEditorExtensionsRequested}
            onEditorViewCreated={onEditorViewCreated}
            style={{ maxHeight: "150px" }} />
    );
}
