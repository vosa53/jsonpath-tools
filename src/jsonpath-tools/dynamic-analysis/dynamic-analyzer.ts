import { JSONPathDiagnostics } from "../diagnostics";
import { JSONPathOptions } from "../options";
import { JSONPath } from "../query/json-path";
import { JSONPathJSONValue } from "../types";

export class DynamicAnalyzer {
    constructor(
        private readonly options: JSONPathOptions
    ) { }

    analyze(query: JSONPath, queryArgument: JSONPathJSONValue): DynamicAnalysisResult {
        throw new Error("Not implemented.");
    }
}

export interface DynamicAnalysisResult {
    readonly diagnostics: readonly JSONPathDiagnostics[];
    readonly queryResult: NodeList;
}