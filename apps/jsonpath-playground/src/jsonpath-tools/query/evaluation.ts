import { Diagnostics } from "../diagnostics";
import { QueryOptions } from "../options";
import { FilterValue, JSONValue } from "../types";
import { FilterExpression } from "./filter-expression/filter-expression";
import { Node } from "./located-node";
import { SubQuery } from "./query";
import { Segment } from "./segment";
import { Selector } from "./selectors/selector";

export interface QueryContext {
    readonly rootNode: JSONValue;
    readonly options: QueryOptions;
    readonly queryInstrumentationCallback?: (query: SubQuery, input: Node, outputArray: IndexOnlyArray<Node>, outputStartIndex: number, outputLength: number) => void;
    readonly segmentInstrumentationCallback?: (segment: Segment, input: Node, outputArray: IndexOnlyArray<Node>, outputStartIndex: number, outputLength: number) => void;
    readonly selectorInstrumentationCallback?: (selector: Selector, input: Node, outputArray: IndexOnlyArray<Node>, outputStartIndex: number, outputLength: number) => void;
    readonly filterExpressionInstrumentationCallback?: (filterExpression: FilterExpression, output: FilterValue) => void;
    readonly reportDiagnosticsCallback?: (diagnostics: Diagnostics) => void;
}

export interface FilterExpressionContext {
    readonly currentNode: JSONValue;
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