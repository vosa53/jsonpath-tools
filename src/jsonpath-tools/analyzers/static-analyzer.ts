import { Diagnostics } from "next/dist/build/swc/types";
import { DataType } from "../data-types/data-types";
import { JSONPathOptions } from "../options";
import { JSONPath } from "../query/json-path";

export class StaticAnalyzer {
    constructor(
        private readonly options: JSONPathOptions
    ) { }

    analyze(query: JSONPath, queryArgumentType: DataType): Diagnostics[] {
        return [];
    }
}
