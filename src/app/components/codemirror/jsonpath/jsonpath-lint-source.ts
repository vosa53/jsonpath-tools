import { syntaxTree } from "@codemirror/language";
import { LintSource } from "@codemirror/lint";
import { JSONPathDiagnostics, JSONPathDiagnosticsType } from "../../../../jsonpath-tools/diagnostics";
import { getJSONPath } from "./jsonpath-language";
import { TypeChecker } from "@/jsonpath-tools/semantic-analysis/type-checker";
import { defaultJSONPathOptions, JSONPathOptions, JSONPathType } from "@/jsonpath-tools/options";

export function jsonPathLintSource(options: { onDiagnosticsCreated?: (diagnostics: readonly JSONPathDiagnostics[]) => void } = {}): LintSource {
    return view => {
        const jsonPath = getJSONPath(syntaxTree(view.state));
        const typeChecker = new TypeChecker();
        const diagnostics = [
            ...jsonPath.syntaxDiagnostics,
            ...typeChecker.check(jsonPath, defaultJSONPathOptions)
        ];
        options.onDiagnosticsCreated?.(diagnostics);

        return diagnostics.map(d => ({
            from: d.textRange.position,
            to: d.textRange.position + d.textRange.length,
            severity: d.type === JSONPathDiagnosticsType.error ? "error" : "warning",
            message: d.message
        }));
    }
}