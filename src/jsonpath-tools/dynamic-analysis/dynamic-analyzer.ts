import { JSONPathDiagnostics, JSONPathDiagnosticsType } from "../diagnostics";
import { JSONPathOptions } from "../options";
import { JSONPathQueryContext } from "../query/evaluation";
import { JSONPath } from "../query/json-path";
import { JSONPathSelector } from "../query/selectors/selector";
import { JSONPathJSONValue, JSONPathNodeList } from "../types";

export class DynamicAnalyzer {
    constructor(
        private readonly options: JSONPathOptions
    ) { }

    analyze(query: JSONPath, queryArgument: JSONPathJSONValue): DynamicAnalysisResult {
        const selectorsThatProducedOutput = new Set<JSONPathSelector>();
        const queryContext: JSONPathQueryContext = {
            rootNode: queryArgument, 
            options: this.options, 
            selectorInstrumentationCallback(s, i, oa, osi, ol) {
                if (ol !== 0)
                    selectorsThatProducedOutput.add(s);
            }
        };

        const queryResult = query.select(queryContext);

        const diagnostics: JSONPathDiagnostics[] = [];
        query.forEach(t => {
            if (t instanceof JSONPathSelector && !selectorsThatProducedOutput.has(t))
                diagnostics.push({
                    message: "This selector does not produce any output.",
                    textRange: t.textRangeWithoutSkipped,
                    type: JSONPathDiagnosticsType.warning
                });
        });

        return { diagnostics, queryResult };
    }
}

export interface DynamicAnalysisResult {
    readonly diagnostics: readonly JSONPathDiagnostics[];
    readonly queryResult: JSONPathNodeList;
}