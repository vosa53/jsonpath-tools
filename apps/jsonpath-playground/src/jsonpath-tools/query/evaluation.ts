import { JSONPathDiagnostics } from "../diagnostics";
import { JSONPathOptions } from "../options";
import { JSONPathFilterValue, JSONPathJSONValue } from "../types";
import { JSONPathFilterExpression } from "./filter-expression/filter-expression";
import { LocatedNode } from "./located-node";
import { JSONPathQuery } from "./query";
import { JSONPathSegment } from "./segment";
import { JSONPathSelector } from "./selectors/selector";

export interface JSONPathQueryContext {
    readonly rootNode: JSONPathJSONValue;
    readonly options: JSONPathOptions;
    readonly queryInstrumentationCallback?: (query: JSONPathQuery, input: LocatedNode, outputArray: IndexOnlyArray<LocatedNode>, outputStartIndex: number, outputLength: number) => void;
    readonly segmentInstrumentationCallback?: (segment: JSONPathSegment, input: LocatedNode, outputArray: IndexOnlyArray<LocatedNode>, outputStartIndex: number, outputLength: number) => void;
    readonly selectorInstrumentationCallback?: (selector: JSONPathSelector, input: LocatedNode, outputArray: IndexOnlyArray<LocatedNode>, outputStartIndex: number, outputLength: number) => void;
    readonly filterExpressionInstrumentationCallback?: (filterExpression: JSONPathFilterExpression, output: JSONPathFilterValue) => void;
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