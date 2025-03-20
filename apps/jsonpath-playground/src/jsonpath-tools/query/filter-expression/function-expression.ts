import { JSONPathDiagnostics, JSONPathDiagnosticsType } from "@/jsonpath-tools/diagnostics";
import { JSONPathFunctionContext } from "@/jsonpath-tools/options";
import { JSONPathFilterValue, JSONPathNothing } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { evaluateAs } from "../helpers";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpression } from "./filter-expression";


export class JSONPathFunctionExpression extends JSONPathFilterExpression {
    constructor(
        readonly nameToken: JSONPathToken,
        readonly openingParanthesisToken: JSONPathToken,
        readonly args: readonly { arg: JSONPathFilterExpression; commaToken: JSONPathToken | null; }[],
        readonly closingParanthesisToken: JSONPathToken,

        readonly name: string
    ) {
        super([nameToken, openingParanthesisToken, ...args.flatMap(a => [a.arg, a.commaToken]), closingParanthesisToken]);
    }

    get type() { return JSONPathSyntaxTreeType.functionExpression; }

    protected evaluateImplementation(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        const functionDefinition = queryContext.options.functions[this.name];
        if (functionDefinition === undefined) return JSONPathNothing;
        
        const argValues = [];
        for (let i = 0; i < Math.min(this.args.length, functionDefinition.parameters.length); i++) {
            const arg = this.args[i].arg;
            const argValue = evaluateAs(arg, functionDefinition.parameters[i].type, queryContext, filterExpressionContext);
            argValues.push(argValue);
        }

        if (this.args.length < functionDefinition.parameters.length) return JSONPathNothing;
        
        const functionContext = queryContext.reportDiagnosticsCallback === undefined 
            ? nullFunctionContext 
            : new QueryContextFunctionContext(queryContext.reportDiagnosticsCallback, this);
        const result = functionDefinition.handler(functionContext, ...argValues);
        return result;
    }
}

class QueryContextFunctionContext implements JSONPathFunctionContext {
    constructor(
        private readonly reportDiagnosticsCallback: (diagnostics: JSONPathDiagnostics) => void,
        private readonly functionExpression: JSONPathFunctionExpression
    ) { }

    reportParameterWarning(parameterIndex: number, message: string): void {
        const warning: JSONPathDiagnostics = { 
            type: JSONPathDiagnosticsType.warning, 
            message, 
            textRange: this.functionExpression.args[parameterIndex].arg.textRangeWithoutSkipped 
        };
        this.reportDiagnosticsCallback(warning);
    }

    reportWarning(message: string): void {
        const warning: JSONPathDiagnostics = { 
            type: JSONPathDiagnosticsType.warning, 
            message, 
            textRange: this.functionExpression.nameToken.textRangeWithoutSkipped 
        };
        this.reportDiagnosticsCallback(warning);
    }
}

const nullFunctionContext: JSONPathFunctionContext = {
    reportParameterWarning(parameterIndex, message) { },
    reportWarning(message) { }
};