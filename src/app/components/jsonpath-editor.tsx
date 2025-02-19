import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { syntaxTree } from "@codemirror/language";
import { linter } from "@codemirror/lint";
import { EditorView } from "codemirror";
import { JSONPathDiagnostics } from "../../jsonpath-tools/diagnostics";
import CodeMirrorEditor from "./codemirror/codemirror-editor";
import { getJSONPath, jsonPathLanguage, updateOptionsEffect, updateQueryArgumentEffect } from "./codemirror/jsonpath/jsonpath-language";
import { jsonPathLintSource } from "./codemirror/jsonpath/jsonpath-lint-source";
import { jsonPathTooltips } from "./codemirror/jsonpath/jsonpath-tooltips";
import { useEffect, useRef } from "react";
import { defaultJSONPathOptions, JSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";

export default function JSONPathEditor({value, options = defaultJSONPathOptions, queryArgument = {}, readonly = false, onValueChanged, onParsed, onDiagnosticsCreated}: 
    { value: string, options?: JSONPathOptions, queryArgument?: JSONPathJSONValue, readonly?: boolean, onValueChanged: (value: string) => void, onParsed?: (jsonPath: JSONPath) => void, onDiagnosticsCreated?: (diagnostics: readonly JSONPathDiagnostics[]) => void }) {

    const editorViewRef = useRef<EditorView>(null);

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
            jsonPathLanguage,
            jsonPathTooltips,
            linter(jsonPathLintSource({ onDiagnosticsCreated })),
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
    };

    return (
        <CodeMirrorEditor 
            value={value} 
            readonly={readonly} 
            onValueChanged={onValueChanged} 
            onExtensionsRequested={onEditorExtensionsRequested}
            onEditorViewCreated={onEditorViewCreated}
            style={{maxHeight: "150px"}} />
    );
}
