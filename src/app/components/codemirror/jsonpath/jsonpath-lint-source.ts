import { defaultJSONPathOptions } from "@/jsonpath-tools/options";
import { TypeChecker } from "@/jsonpath-tools/semantic-analysis/type-checker";
import { syntaxTree } from "@codemirror/language";
import { LintSource } from "@codemirror/lint";
import { JSONPathDiagnostics, JSONPathDiagnosticsType } from "../../../../jsonpath-tools/diagnostics";
import { getJSONPath, workerStateField } from "./jsonpath-language";

export function jsonPathLintSource(options: { onDiagnosticsCreated?: (diagnostics: readonly JSONPathDiagnostics[]) => void } = {}): LintSource {
    return async view => {
        /*const jsonPath = getJSONPath(syntaxTree(view.state));
        const typeChecker = new TypeChecker();
        const diagnostics = [
            ...jsonPath.syntaxDiagnostics,
            ...typeChecker.check(jsonPath, defaultJSONPathOptions)
        ];
        options.onDiagnosticsCreated?.(diagnostics);*/

        const worker = view.state.field(workerStateField);
        debugger;
        const diagnostics = await worker.getDiagnostics();
        options.onDiagnosticsCreated?.(diagnostics);

        return diagnostics.map(d => ({
            from: d.textRange.position,
            to: d.textRange.position + d.textRange.length,
            severity: d.type === JSONPathDiagnosticsType.error ? "error" : "warning",
            message: d.message
        }));
    }
}