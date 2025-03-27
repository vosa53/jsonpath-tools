import { NormalizedPath } from "../transformations";
import { NodeList } from "../types";
import { FilterExpressionContext, QueryContext } from "./evaluation";
import { Node } from "../node";
import { SyntaxTreeNode } from "./syntax-tree-node";
import { Segment } from "./segment";
import { IndexSelector } from "./selectors/index-selector";
import { NameSelector } from "./selectors/name-selector";
import { SyntaxTreeType } from "./syntax-tree-type";
import { SyntaxTreeToken } from "./syntax-tree-token";


export class SubQuery extends SyntaxTreeNode {
    constructor(
        readonly identifierToken: SyntaxTreeToken,
        readonly segments: readonly Segment[],

        readonly isRelative: boolean
    ) {
        super([identifierToken, ...segments]);
    }

    get type() { return SyntaxTreeType.query; }

    get isSingular() {
        return this.segments.every(s => {
            if (s.isDescendant || s.selectors.length !== 1) 
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

    select(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext | null): NodeList {
        if (this.isRelative && filterExpressionContext === null)
            return NodeList.empty;
        const inputValue = this.isRelative ? filterExpressionContext!.currentNode : queryContext.rootNode;
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

    toNormalizedPath(): NormalizedPath | null {
        const segments: (string | number)[] = [];
        for (const segment of this.segments) {
            if (segment.isDescendant || segment.selectors.length !== 1)
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
