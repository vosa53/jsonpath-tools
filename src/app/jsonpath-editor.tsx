import { linter } from "@codemirror/lint";
import { EditorView } from "codemirror";
import { useState } from "react";
import CodeMirrorEditor from "./codemirror/codemirror-editor";
import { getJSONPath, jsonPathLanguage } from "./codemirror/jsonpath/jsonpath-language";
import { jsonPathLintSource } from "./codemirror/jsonpath/jsonpath-lint-source";
import { jsonPathTooltips } from "./codemirror/jsonpath/jsonpath-tooltips";
import { JSONPathParser } from "./parser/parser";
import { createSyntaxTree } from "./parser/utils";
import { JSONPath } from "./parser/syntax-tree";
import { JSONPathDiagnostics } from "./parser/diagnostics";
import { syntaxTree } from "@codemirror/language";

export default function JSONPathEditor({value, onValueChanged, onParsed, onDiagnosticsCreated}: 
    { value: string, onValueChanged: (value: string) => void, onParsed?: (jsonPath: JSONPath) => void, onDiagnosticsCreated?: (diagnostics: readonly JSONPathDiagnostics[]) => void }) {

    const onEditorExtensionsRequested = () => {
        return [
            jsonPathLanguage,
            jsonPathTooltips,
            linter(jsonPathLintSource({ onDiagnosticsCreated })),
            EditorView.theme({
                "&": { fontSize: "18px" }
            }),
            EditorView.updateListener.of(u => {
                if (u.docChanged) {
                    const jsonPath = getJSONPath(syntaxTree(u.view.state));
                    onParsed?.(jsonPath);
                }
            }),
        ];
    };

    return (
        <CodeMirrorEditor value={value} onValueChanged={onValueChanged} onExtensionsRequested={onEditorExtensionsRequested} style={{maxHeight: "150px"}} />
    );
}
