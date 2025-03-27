import { TextRange } from "./text/text-range";

export interface Diagnostics {
    readonly type: DiagnosticsType;
    readonly message: string;
    readonly textRange: TextRange;
}

export enum DiagnosticsType {
    warning = "Warning",
    error = "Error"
}