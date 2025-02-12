import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { syntaxTree } from "@codemirror/language";
import { linter } from "@codemirror/lint";
import { EditorView } from "codemirror";
import { JSONPathDiagnostics } from "../../jsonpath-tools/diagnostics";
import CodeMirrorEditor from "./codemirror/codemirror-editor";
import { getJSONPath, jsonPathLanguage } from "./codemirror/jsonpath/jsonpath-language";
import { jsonPathLintSource } from "./codemirror/jsonpath/jsonpath-lint-source";
import { jsonPathTooltips } from "./codemirror/jsonpath/jsonpath-tooltips";

export default function JSONPathEditor({value, onValueChanged, onParsed, onDiagnosticsCreated}: 
    { value: string, onValueChanged: (value: string) => void, onParsed?: (jsonPath: JSONPath) => void, onDiagnosticsCreated?: (diagnostics: readonly JSONPathDiagnostics[]) => void }) {

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

    return (
        <CodeMirrorEditor value={value} onValueChanged={onValueChanged} onExtensionsRequested={onEditorExtensionsRequested} style={{maxHeight: "150px"}} />
    );
}
