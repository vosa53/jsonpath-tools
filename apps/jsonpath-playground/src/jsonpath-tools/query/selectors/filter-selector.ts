import { LogicalTrue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { PushOnlyArray } from "@/jsonpath-tools/helpers/array";
import { FilterExpression } from "../filter-expression/filter-expression";
import { evaluateAsLogicalType } from "../evaluation";
import { Node } from "../../values/node";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { Selector } from "./selector";

/**
 * Filter selector.
 */
export class FilterSelector extends Selector {
    constructor(
        /**
         * Preceding question mark token.
         */
        readonly questionMarkToken: SyntaxTreeToken,

        /**
         * Filter logical expression.
         */
        readonly expression: FilterExpression
    ) {
        super([questionMarkToken, expression]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.filterSelector; }

    /**
     * @inheritdoc
     */
    select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void {
        if (Array.isArray(input.value)) {
            for (let i = 0; i < input.value.length; i++) {
                const filterExpressionContext: FilterExpressionContext = { current: input.value[i] };
                const filterResult = evaluateAsLogicalType(this.expression, queryContext, filterExpressionContext);
                if (filterResult === LogicalTrue)
                    output.push(new Node(input.value[i], i, input));
            }
        }
        else if (typeof input.value === "object" && input.value !== null) {
            for (const entry of Object.entries(input.value)) {
                const filterExpressionContext: FilterExpressionContext = { current: entry[1] };
                const filterResult = evaluateAsLogicalType(this.expression, queryContext, filterExpressionContext);
                if (filterResult === LogicalTrue)
                    output.push(new Node(entry[1], entry[0], input));
            }
        }
    }
}
