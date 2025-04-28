import { DiagnosticsSeverity, TextRange } from "@jsonpath-tools/jsonpath";

/**
 * Custom JSONPath diagnostics with line based positions.
 */
export class CustomDiagnostics {
    constructor(
        /**
         * Severity.
         */
        readonly severity: DiagnosticsSeverity,

        /**
         * Message.
         */
        readonly message: string,

        /**
         * Range in the text of the query to which the diagnostic relates.
         */
        readonly textRange: TextRange,

        /**
         * Line to which the diagnostic relates (starts at 1).
         */
        readonly line: number,

        /**
         * Column on the line to which the diagnostic relates (starts at 1).
         */
        readonly column: number
    ) { }
}