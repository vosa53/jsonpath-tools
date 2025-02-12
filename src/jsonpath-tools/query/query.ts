import { JSONPathNodeList, JSONPathJSONValue } from "../types";
import { JSONPathNode } from "./node";
import { JSONPathSyntaxTreeType } from "./syntax-tree-type";
import { JSONPathToken } from "./token";
import { JSONPathFilterExpressionContext } from "./evaluation";
import { JSONPathQueryContext } from "./evaluation";
import { JSONPathIndexSelector } from "./selectors/index-selector";
import { JSONPathNameSelector } from "./selectors/name-selector";
import { JSONPathSegment } from "./segment";


export class JSONPathQuery extends JSONPathNode {
    constructor(
        readonly identifierToken: JSONPathToken | null,
        readonly segments: readonly JSONPathSegment[],

        readonly isRelative: boolean
    ) {
        super([identifierToken, ...segments]);
    }

    get type() { return JSONPathSyntaxTreeType.query; }

    get isSingular() {
        // TODO: Disallow spaces 
        return this.segments.every(s => s.selectors.length === 1 && (s.selectors[0].selector instanceof JSONPathNameSelector || s.selectors[0].selector instanceof JSONPathIndexSelector));
    }

    select(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext | null): JSONPathNodeList {
        let inputNodes = [this.isRelative && filterExpressionContext !== null ? filterExpressionContext.currentNode : queryContext.rootNode];
        let outputNodes: JSONPathJSONValue[] = [];
        for (const segment of this.segments) {
            for (const inputNode of inputNodes)
                segment.select(inputNode, outputNodes, queryContext);
            [inputNodes, outputNodes] = [outputNodes, inputNodes];
            outputNodes.length = 0;
        }
        return new JSONPathNodeList(inputNodes);
    }
}
