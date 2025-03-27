import { Diagnostics, DiagnosticsType } from "@/jsonpath-tools/diagnostics";
import { LintSource } from "@codemirror/lint";
import { ViewUpdate } from "@codemirror/view";
import { OperationCancelledError } from "./cancellation-token";
import { languageServiceSessionStateField, updateOptionsEffect, updateQueryArgumentEffect } from "./state";


export function lintSource(options: { onDiagnosticsCreated?: (diagnostics: readonly Diagnostics[]) => void } = {}): LintSource {
    return async view => {
        const languageServiceSession = view.state.field(languageServiceSessionStateField);
        try {
            const diagnostics = await languageServiceSession.getDiagnostics();
            options.onDiagnosticsCreated?.(diagnostics);

            return diagnostics.map(d => ({
                from: d.textRange.position,
                to: d.textRange.position + d.textRange.length,
                severity: d.type === DiagnosticsType.error ? "error" : "warning",
                message: d.message
            }));
        }
        catch (error) {
            if (error instanceof OperationCancelledError) return [];
            else throw error;
        }
    }
}

export const lintSourceNeedsRefresh = (update: ViewUpdate): boolean => {
    for (const transaction of update.transactions) {
        if (transaction.effects.some(e => e.is(updateOptionsEffect) || e.is(updateQueryArgumentEffect))) 
            return true;
    }
    return false;
};