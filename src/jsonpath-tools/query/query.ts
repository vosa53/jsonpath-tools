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
        const inputNode = this.isRelative && filterExpressionContext !== null ? filterExpressionContext.currentNode : queryContext.rootNode;
        let inputNodes = [new LocatedNode(inputNode, "", null)];
        let outputNodes: LocatedNode[] = [];
        for (const segment of this.segments) {
            for (const inputNode of inputNodes)
                segment.select(inputNode, outputNodes, queryContext);
            [inputNodes, outputNodes] = [outputNodes, inputNodes];
            outputNodes.length = 0;
        }
        return new JSONPathNodeList(inputNodes);
    }
}
