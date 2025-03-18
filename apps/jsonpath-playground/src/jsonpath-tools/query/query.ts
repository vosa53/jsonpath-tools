import { JSONPathNormalizedPath } from "../transformations";
import { JSONPathNodeList } from "../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "./evaluation";
import { LocatedNode } from "./located-node";
import { JSONPathNode } from "./node";
import { JSONPathSegment } from "./segment";
import { JSONPathIndexSelector } from "./selectors/index-selector";
import { JSONPathNameSelector } from "./selectors/name-selector";
import { JSONPathSyntaxTreeType } from "./syntax-tree-type";
import { JSONPathToken } from "./token";


export class JSONPathQuery extends JSONPathNode {
    constructor(
        readonly identifierToken: JSONPathToken,
        readonly segments: readonly JSONPathSegment[],

        readonly isRelative: boolean
    ) {
        super([identifierToken, ...segments]);
    }

    get type() { return JSONPathSyntaxTreeType.query; }

    get isSingular() {
        // TODO: Disallow spaces 
        return this.segments.every(s => !s.isRecursive && s.selectors.length === 1 && (s.selectors[0].selector instanceof JSONPathNameSelector || s.selectors[0].selector instanceof JSONPathIndexSelector));
    }

    select(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext | null): JSONPathNodeList {
        const inputValue = this.isRelative && filterExpressionContext !== null ? filterExpressionContext.currentNode : queryContext.rootNode;
        const input = new LocatedNode(inputValue, "", null);
        let inputs = [input];
        let outputs: LocatedNode[] = [];
        for (const segment of this.segments) {
            for (const input of inputs)
                segment.select(input, outputs, queryContext);
            [inputs, outputs] = [outputs, inputs];
            outputs.length = 0;
        }

        queryContext.queryInstrumentationCallback?.(this, input, inputs, 0, inputs.length);
        return new JSONPathNodeList(inputs);
    }

    toNormalizedPath(): JSONPathNormalizedPath | null {
        const segments: (string | number)[] = [];
        for (const segment of this.segments) {
            if (segment.selectors.length !== 1)
                return null;
            const selector = segment.selectors[0].selector;
            if (selector instanceof JSONPathNameSelector)
                segments.push(selector.name);
            else if (selector instanceof JSONPathIndexSelector) {
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
