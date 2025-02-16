import { JSONPathJSONValue, JSONPathLogicalTrue } from "../../types";
import { JSONPathSelector } from "./selector";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { evaluateAsLogicalType } from "../helpers";
import { PushOnlyArray } from "../evaluation";
import { JSONPathFilterExpressionContext } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";
import { JSONPathFilterExpression } from "../filter-expression/filter-expression";


export class JSONPathFilterSelector extends JSONPathSelector {
    constructor(
        readonly questionMarkToken: JSONPathToken,
        readonly expression: JSONPathFilterExpression
    ) {
        super([questionMarkToken, expression]);
    }

    get type() { return JSONPathSyntaxTreeType.filterSelector; }

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void {
        const isObjectOrArray = typeof input === "object" && input !== null;
        if (!isObjectOrArray)
            return;

        const values = Object.values(input);
        for (const value of values) {
            const filterExpressionContext: JSONPathFilterExpressionContext = { currentNode: value };
            const filterResult = evaluateAsLogicalType(this.expression, queryContext, filterExpressionContext);
            if (filterResult === JSONPathLogicalTrue)
                output.push(value);
        }
    }
}
