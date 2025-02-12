import { JSONPathOptions } from "../options";
import { JSONPathJSONValue } from "../types";
import { JSONPathSegment } from "./segment";

export interface JSONPathQueryContext {
    readonly rootNode: JSONPathJSONValue;
    readonly options: JSONPathOptions;
    readonly segmentInstrumentationCallback?: (segment: JSONPathSegment, input: JSONPathJSONValue) => void;
}

export interface JSONPathFilterExpressionContext {
    readonly currentNode: JSONPathJSONValue;
}

export interface PushOnlyArray<T> {
    push(...value: T[]): void;
}

