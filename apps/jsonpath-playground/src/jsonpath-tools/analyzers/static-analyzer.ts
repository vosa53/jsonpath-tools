import { DataType, isSubtypeOf, NeverDataType } from "../data-types/data-types";
import { QueryOptions } from "../options";
import { Query } from "../query/query";
import { Diagnostics, DiagnosticsType } from "../diagnostics";
import { Selector } from "../query/selectors/selector";
import { DataTypeAnalyzer } from "../data-types/data-type-analyzer";

export class StaticAnalyzer {
    constructor(
        private readonly options: QueryOptions
    ) { }

    analyze(query: Query, queryArgumentType: DataType): Diagnostics[] {
        const typeAnalyzer = new DataTypeAnalyzer(queryArgumentType, this.options);
        const diagnostics: Diagnostics[] = [];
        query.forEach(t => {
            if (t instanceof Selector && isSubtypeOf(typeAnalyzer.getType(t), NeverDataType.create()))
                diagnostics.push({
                    message: "This selector can not produce any output.",
                    textRange: t.textRangeWithoutSkipped,
                    type: DiagnosticsType.warning
                });
        });
        return diagnostics;
    }
}
