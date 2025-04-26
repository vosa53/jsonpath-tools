import { Diagnostics, DiagnosticsSeverity } from "../diagnostics";
import { QueryOptions } from "../options";
import { QueryContext } from "../query/evaluation";
import { Query } from "../query/query";
import { Selector } from "../query/selectors/selector";
import { JSONValue } from "../json/json-types";
import { NodeList } from "../values/node-list";

/**
 * Analyzes a query for mistakes by executing it on concrete data.
 */
export class DynamicAnalyzer {
    constructor(
        /**
         * Query options.
         */
        private readonly options: QueryOptions
    ) { }

    /**
     * Analyzes a query and returns diagnostics with the query result.
     * @param query Query.
     * @param queryArgument Query argument.
     */
    analyze(query: Query, queryArgument: JSONValue): DynamicAnalysisResult {
        const selectorsThatProducedOutput = new Set<Selector>();
        const diagnosticsJSON = new Set<string>();
        const queryContext: QueryContext = {
            argument: queryArgument, 
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
        
        const diagnostics = diagnosticsJSON.values().map(dJSON => {
            const diagnosticsObject = JSON.parse(dJSON) as Diagnostics;
            return new Diagnostics(diagnosticsObject.severity, diagnosticsObject.message, diagnosticsObject.textRange);
        }).toArray();
        query.forEach(t => {
            if (t instanceof Selector && !selectorsThatProducedOutput.has(t))
                diagnostics.push(new Diagnostics(DiagnosticsSeverity.warning, "This selector does not produce any output.", t.textRangeWithoutSkipped));
        });

        return { diagnostics, queryResult };
    }
}

/**
 * Result of dynamic analysis.
 */
export interface DynamicAnalysisResult {
    /**
     * Diagnostics.
     */
    readonly diagnostics: readonly Diagnostics[];

    /**
     * Result of the query.
     */
    readonly queryResult: NodeList;
}