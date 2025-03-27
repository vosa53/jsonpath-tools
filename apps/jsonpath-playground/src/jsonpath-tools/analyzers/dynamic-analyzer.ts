import { Diagnostics, DiagnosticsType } from "../diagnostics";
import { QueryOptions } from "../options";
import { QueryContext } from "../query/evaluation";
import { Query } from "../query/query";
import { Selector } from "../query/selectors/selector";
import { JSONValue } from "../json/json-types";
import { NodeList } from "../values/node-list";

export class DynamicAnalyzer {
    constructor(
        private readonly options: QueryOptions
    ) { }

    analyze(query: Query, queryArgument: JSONValue): DynamicAnalysisResult {
        const selectorsThatProducedOutput = new Set<Selector>();
        const diagnosticsJSON = new Set<string>();
        const queryContext: QueryContext = {
            rootNode: queryArgument, 
            options: this.options, 
            selectorInstrumentationCallback(s, i, oa, osi, ol) {
                if (ol !== 0)
                    selectorsThatProducedOutput.add(s);
            },
            reportDiagnosticsCallback(d) {
                // Far from ideal, ugly workaround because JavaScript doesn't support comparing and hashing objects in set by value.
                const dJSON = JSON.stringify(d);
                diagnosticsJSON.add(dJSON);
            }
        };
        const queryResult = query.select(queryContext);
        
        const diagnostics: Diagnostics[] = Array.from(diagnosticsJSON).map(dJSON => JSON.parse(dJSON));
        query.forEach(t => {
            if (t instanceof Selector && !selectorsThatProducedOutput.has(t))
                diagnostics.push({
                    message: "This selector does not produce any output.",
                    textRange: t.textRangeWithoutSkipped,
                    type: DiagnosticsType.warning
                });
        });

        return { diagnostics, queryResult };
    }
}

export interface DynamicAnalysisResult {
    readonly diagnostics: readonly Diagnostics[];
    readonly queryResult: NodeList;
}