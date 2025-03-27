import { LogicalTrue } from "../../types";
import { FilterExpressionContext, QueryContext, PushOnlyArray } from "../evaluation";
import { FilterExpression } from "../filter-expression/filter-expression";
import { evaluateAsLogicalType } from "../helpers";
import { Node } from "../../node";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { Selector } from "./selector";


export class FilterSelector extends Selector {
    constructor(
        readonly questionMarkToken: SyntaxTreeToken,
        readonly expression: FilterExpression
    ) {
        super([questionMarkToken, expression]);
    }

    get type() { return SyntaxTreeType.filterSelector; }

    select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void {
        if (Array.isArray(input.value)) {
            for (let i = 0; i < input.value.length; i++) {
                const filterExpressionContext: FilterExpressionContext = { currentNode: input.value[i] };
                const filterResult = evaluateAsLogicalType(this.expression, queryContext, filterExpressionContext);
                if (filterResult === LogicalTrue)
                    output.push(new Node(input.value[i], i, input));
            }
        }
        else if (typeof input.value === "object" && input.value !== null) {
            for (const entry of Object.entries(input.value)) {
                const filterExpressionContext: FilterExpressionContext = { currentNode: entry[1] };
                const filterResult = evaluateAsLogicalType(this.expression, queryContext, filterExpressionContext);
                if (filterResult === LogicalTrue)
                    output.push(new Node(entry[1], entry[0], input));
            }
        }
    }
}
