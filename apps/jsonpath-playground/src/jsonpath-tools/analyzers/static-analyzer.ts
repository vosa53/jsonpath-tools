import { DataType, isSubtypeOf, NeverDataType } from "../data-types/data-types";
import { JSONPathOptions } from "../options";
import { JSONPath } from "../query/json-path";
import { JSONPathDiagnostics, JSONPathDiagnosticsType } from "../diagnostics";
import { JSONPathSelector } from "../query/selectors/selector";
import { DataTypeAnalyzer } from "../data-types/data-type-analyzer";

export class StaticAnalyzer {
    constructor(
        private readonly options: JSONPathOptions
    ) { }

    analyze(query: JSONPath, queryArgumentType: DataType): JSONPathDiagnostics[] {
        const typeAnalyzer = new DataTypeAnalyzer(queryArgumentType, this.options);
        const diagnostics: JSONPathDiagnostics[] = [];
        query.forEach(t => {
            if (t instanceof JSONPathSelector && isSubtypeOf(typeAnalyzer.getType(t), NeverDataType.create()))
                diagnostics.push({
                    message: "This selector can not produce any output.",
                    textRange: t.textRangeWithoutSkipped,
                    type: JSONPathDiagnosticsType.warning
                });
        });
        return diagnostics;
    }
}
