import { DiagnosticsSeverity } from "@jsonpath-tools/jsonpath";
import { LintSource } from "@codemirror/lint";
import { ViewUpdate } from "@codemirror/view";
import { OperationCancelledError } from "./cancellation-token";
import { diagnosticsCreatedFacet, languageServiceSessionStateField, updateOptionsEffect, updateQueryArgumentEffect } from "./core";

/**
 * CodeMirror lint source for JSONPath.
 */
export function lintSource(): LintSource {
    return async view => {
        const languageServiceSession = view.state.field(languageServiceSessionStateField);
        const onDiagnosticsCreated = view.state.facet(diagnosticsCreatedFacet);
        try {
            const diagnostics = await languageServiceSession.getDiagnostics();
            for (const onDiagnosticsCreatedHadler of onDiagnosticsCreated)
                onDiagnosticsCreatedHadler(diagnostics);

            return diagnostics.map(d => ({
                from: d.textRange.position,
                to: d.textRange.position + d.textRange.length,
                severity: d.severity === DiagnosticsSeverity.error ? "error" : "warning",
                message: d.message
            }));
        }
        catch (error) {
            if (error instanceof OperationCancelledError) return [];
            else throw error;
        }
    }
}

/**
 * CodeMirror lint source `needsRefresh` for {@link lintSource}.
 */
export const lintSourceNeedsRefresh = (update: ViewUpdate): boolean => {
    for (const transaction of update.transactions) {
        if (transaction.effects.some(e => e.is(updateOptionsEffect) || e.is(updateQueryArgumentEffect))) 
            return true;
    }
    return false;
};
