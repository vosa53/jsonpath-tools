import { syntaxTree } from "@codemirror/language";
import { LintSource } from "@codemirror/lint";
import { JSONPathDiagnosticsType } from "../../parser/jsonpath-diagnostics";
import { getJSONPath } from "./jsonpath-language";

export const jsonPathLintSource: LintSource = view => {
    const jsonPath = getJSONPath(syntaxTree(view.state));
    return jsonPath.syntaxDiagnostics.map(d => ({
        from: d.textRange.position,
        to: d.textRange.position + d.textRange.length,
        severity: d.type === JSONPathDiagnosticsType.error ? "error" : "warning",
        message: d.message
    }));
}