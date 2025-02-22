import { LintSource } from "@codemirror/lint";
import { ViewUpdate } from "@codemirror/view";
import { OperationCancelledError } from "./cancellation-token";
import { updateOptionsEffect, updateQueryArgumentEffect, workerStateField } from "./jsonpath-state";
import { JSONPathDiagnostics, JSONPathDiagnosticsType } from "@/jsonpath-tools/diagnostics";


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
        try {
            const diagnostics = await worker.getDiagnostics();
            options.onDiagnosticsCreated?.(diagnostics);

            return diagnostics.map(d => ({
                from: d.textRange.position,
                to: d.textRange.position + d.textRange.length,
                severity: d.type === JSONPathDiagnosticsType.error ? "error" : "warning",
                message: d.message
            }));
        }
        catch (error) {
            if (error instanceof OperationCancelledError) return [];
            else throw error;
        }
    }
}

export const jsonPathLintSourceNeedsRefresh = (update: ViewUpdate): boolean => {
    for (const transaction of update.transactions) {
        if (transaction.effects.some(e => e.is(updateOptionsEffect) || e.is(updateQueryArgumentEffect))) 
            return true;
    }
    return false;
};