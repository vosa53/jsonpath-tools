import { DataType, NeverDataType } from "../data-types/data-types";
import { isSubtypeOf } from "../data-types/operations";
import { QueryOptions } from "../options";
import { Query } from "../query/query";
import { Diagnostics, DiagnosticsSeverity } from "../diagnostics";
import { Selector } from "../query/selectors/selector";
import { DataTypeAnalyzer } from "../data-types/data-type-analyzer";

/**
 * Analyzes a query for mistakes by static analysis with a type.
 */
export class StaticAnalyzer {
    constructor(
        private readonly options: QueryOptions
    ) { }

    /**
     * Analyzes a query and returns diagnostics.
     * @param query Query.
     * @param queryArgumentType Query argument type. 
     */
    analyze(query: Query, queryArgumentType: DataType): Diagnostics[] {
        const typeAnalyzer = new DataTypeAnalyzer(queryArgumentType, this.options);
        const diagnostics: Diagnostics[] = [];
        query.forEach(t => {
            if (t instanceof Selector && isSubtypeOf(typeAnalyzer.getType(t), NeverDataType.create()))
                diagnostics.push(new Diagnostics(DiagnosticsSeverity.warning, "This selector can not produce any output.", t.textRangeWithoutSkipped));
        });
        return diagnostics;
    }
}
