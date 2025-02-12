import { JSONPathFilterValue, JSONPathNothing } from "../../types";
import { JSONPathFilterExpression } from "./filter-expression";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { undefined, evaluateAs } from "../helpers";
import { JSONPathFilterExpressionContext } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


export class JSONPathFunctionExpression extends JSONPathFilterExpression {
    constructor(
        readonly nameToken: JSONPathToken,
        readonly openingParanthesisToken: JSONPathToken | null,
        readonly args: readonly { arg: JSONPathFilterExpression | null; commaToken: JSONPathToken | null; }[],
        readonly closingParanthesisToken: JSONPathToken | null,

        readonly name: string
    ) {
        super([nameToken, openingParanthesisToken, ...args.flatMap(a => [a.arg, a.commaToken]), closingParanthesisToken]);
    }

    get type() { return JSONPathSyntaxTreeType.functionExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        const functionDefinition = queryContext.options.functions[this.name];
        if (functionDefinition === undefined) return JSONPathNothing;

        const argValues = [];
        for (let i = 0; i < functionDefinition.parameterTypes.length; i++) {
            const arg = this.args[i]?.arg ?? null;
            const argValue = evaluateAs(arg, functionDefinition.parameterTypes[i], queryContext, filterExpressionContext);
            argValues.push(argValue);
        }
        const result = functionDefinition.handler(...argValues);
        return result;
    }
}
