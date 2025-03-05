import { JSONPathDiagnostics } from "../diagnostics";
import { JSONPathOptions } from "../options";
import { JSONPathJSONValue } from "../types";
import { LocatedNode } from "./located-node";
import { JSONPathSegment } from "./segment";
import { JSONPathSelector } from "./selectors/selector";

export interface JSONPathQueryContext {
    readonly rootNode: JSONPathJSONValue;
    readonly options: JSONPathOptions;
    readonly segmentInstrumentationCallback?: (segment: JSONPathSegment, input: LocatedNode) => void;
    readonly selectorInstrumentationCallback?: (selector: JSONPathSelector, input: LocatedNode, outputArray: IndexOnlyArray<LocatedNode>, outputStartIndex: number, outputLength: number) => void;
    readonly reportDiagnosticsCallback?: (diagnostics: JSONPathDiagnostics) => void;
}

export interface JSONPathFilterExpressionContext {
    readonly currentNode: JSONPathJSONValue;
}

export interface PushOnlyArray<T> {
    push(...value: T[]): void;
    readonly [index: number]: T;
    readonly length: number;
}

export interface IndexOnlyArray<T> {
    readonly [index: number]: T;
    readonly length: number;
}