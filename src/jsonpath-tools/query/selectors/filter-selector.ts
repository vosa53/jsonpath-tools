import { JSONPathJSONValue, JSONPathLogicalTrue } from "../../types";
import { JSONPathSelector } from "./selector";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { evaluateAsLogicalType } from "../helpers";
import { PushOnlyArray } from "../evaluation";
import { JSONPathFilterExpressionContext } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";
import { JSONPathFilterExpression } from "../filter-expression/filter-expression";
import { LocatedNode } from "../located-node";


export class JSONPathFilterSelector extends JSONPathSelector {
    constructor(
        readonly questionMarkToken: JSONPathToken,
        readonly expression: JSONPathFilterExpression
    ) {
        super([questionMarkToken, expression]);
    }

    get type() { return JSONPathSyntaxTreeType.filterSelector; }

    select(input: LocatedNode, output: PushOnlyArray<LocatedNode>, queryContext: JSONPathQueryContext): void {
        if (Array.isArray(input.value)) {
            for (let i = 0; i < input.value.length; i++) {
                const filterExpressionContext: JSONPathFilterExpressionContext = { currentNode: input.value[i] };
                const filterResult = evaluateAsLogicalType(this.expression, queryContext, filterExpressionContext);
                if (filterResult === JSONPathLogicalTrue)
                    output.push(new LocatedNode(input.value[i], i, input));
            }
        }
        else if (typeof input.value === "object" && input.value !== null) {
            for (const entry of Object.entries(input.value)) {
                const filterExpressionContext: JSONPathFilterExpressionContext = { currentNode: entry[1] };
                const filterResult = evaluateAsLogicalType(this.expression, queryContext, filterExpressionContext);
                if (filterResult === JSONPathLogicalTrue)
                    output.push(new LocatedNode(entry[1], entry[0], input));
            }
        }
    }
}
