import { NormalizedPath, NormalizedPathSegment } from "../normalized-path";
import { NodeList } from "../values/node-list";
import { FilterExpressionContext, QueryContext } from "./evaluation";
import { Node } from "../values/node";
import { SyntaxTreeNode } from "./syntax-tree-node";
import { Segment, SegmentType } from "./segment";
import { IndexSelector } from "./selectors/index-selector";
import { NameSelector } from "./selectors/name-selector";
import { SyntaxTreeType } from "./syntax-tree-type";
import { SyntaxTreeToken } from "./syntax-tree-token";

/**
 * Query.
 */
export class SubQuery extends SyntaxTreeNode {
    constructor(
        /**
         * Preceding root or current identifier.
         */
        readonly identifierToken: SyntaxTreeToken,

        /**
         * Segments.
         */
        readonly segments: readonly Segment[],

        /**
         * Whether it is an absolute query or a relative query.
         */
        readonly queryType: QueryType
    ) {
        super([identifierToken, ...segments]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.subQuery; }

    /**
     * Whether it is a singular query as per the JSONPath specification.
     */
    get isSingular() {
        return this.segments.every(s => {
            if (s.segmentType === SegmentType.descendant || s.selectors.length !== 1) 
                return false;
            const selector = s.selectors[0].selector;
            if (!(selector instanceof NameSelector || selector instanceof IndexSelector))
                return false;
            if (selector.skippedTextBefore !== "")
                return false;
            if (s.closingBracketToken !== null && s.closingBracketToken.skippedTextBefore !== "")
                return false;
            return true;
        });
    }

    /**
     * Selects nodes from the given query argument.
     * @param queryContext Query context.
     * @param filterExpressionContext Filter expression context for a relative query or `null` for an absolute query.
     */
    select(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext | null): NodeList {
        if (this.queryType === QueryType.relative && filterExpressionContext === null)
            return NodeList.empty;
        const inputValue = this.queryType === QueryType.absolute ? queryContext.argument : filterExpressionContext!.current;
        const input = new Node(inputValue, "", null);
        let inputs = [input];
        let outputs: Node[] = [];
        for (const segment of this.segments) {
            for (const input of inputs)
                segment.select(input, outputs, queryContext);
            [inputs, outputs] = [outputs, inputs];
            outputs.length = 0;
        }

        queryContext.queryInstrumentationCallback?.(this, input, inputs, 0, inputs.length);
        return new NodeList(inputs);
    }

    /**
     * Converts the query to {@link NormalizedPath}. Returns `null` when the query does not represent a normalized path.
     */
    toNormalizedPath(): NormalizedPath | null {
        const segments: NormalizedPathSegment[] = [];
        for (const segment of this.segments) {
            if (segment.segmentType === SegmentType.descendant || segment.selectors.length !== 1)
                return null;
            const selector = segment.selectors[0].selector;
            if (selector instanceof NameSelector)
                segments.push(selector.name);
            else if (selector instanceof IndexSelector) {
                if (selector.index < 0)
                    return null;
                segments.push(selector.index);
            }
            else
                return null;
        }
        return segments;
    }
}

/**
 * Type of a query.
 */
export enum QueryType {
    /**
     * Absolute query.
     */
    absolute,

    /**
     * Relative query.
     */
    relative
}