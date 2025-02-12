import { JSONPathJSONValue } from "../types";
import { JSONPathNode } from "./node";
import { JSONPathSyntaxTreeType } from "./syntax-tree-type";
import { JSONPathToken } from "./token";
import { PushOnlyArray } from "./evaluation";
import { JSONPathQueryContext } from "./evaluation";
import { JSONPathSelector } from "./selectors/selector";


export class JSONPathSegment extends JSONPathNode {
    constructor(
        readonly dotToken: JSONPathToken | null,
        readonly openingBracketToken: JSONPathToken | null,
        readonly selectors: readonly { selector: JSONPathSelector | null; commaToken: JSONPathToken | null; }[],
        readonly closingBracketToken: JSONPathToken | null,

        readonly isRecursive: boolean
    ) {
        super([dotToken, openingBracketToken, ...selectors.flatMap(s => [s.selector, s.commaToken]), closingBracketToken]);
    }

    get type() { return JSONPathSyntaxTreeType.segment; }

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext) {
        queryContext.segmentInstrumentationCallback?.(this, input);

        for (const selector of this.selectors) {
            if (selector.selector != null)
                selector.selector.select(input, output, queryContext);
        }

        if (this.isRecursive) {
            const isObjectOrArray = typeof input === "object" && input !== null;
            if (isObjectOrArray) {
                for (const value of Object.values(input)) {
                    this.select(value, output, queryContext);
                }
            }
        }
    }
}
