import { TextRange } from "./text/text-range";

/**
 * Diagnostics related to the query.
 */
export class Diagnostics {
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
        readonly textRange: TextRange
    ) { }

    /**
     * Converts the diagnostics to a text representation.
     */
    toString(): string {
        return `${this.severity} at ${this.textRange.position}:${this.textRange.length}: ${this.message}`;
    }
}

/**
 * Severity of the diagnostics.
 */
export enum DiagnosticsSeverity {
    /**
     * Something that is allowed, but maybe is not intentional.
     */
    warning = "Warning",

    /**
     * Something that is forbidden.
     */
    error = "Error"
}