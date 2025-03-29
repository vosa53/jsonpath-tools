import { Diagnostics, DiagnosticsType } from "@/jsonpath-tools/diagnostics";
import { FunctionContext, nullFunctionContext } from "@/jsonpath-tools/functions/function";
import { FilterValue, Nothing } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { evaluateAs } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";


export class FunctionExpression extends FilterExpression {
    constructor(
        readonly nameToken: SyntaxTreeToken,
        readonly openingParanthesisToken: SyntaxTreeToken,
        readonly args: readonly { arg: FilterExpression; commaToken: SyntaxTreeToken | null; }[],
        readonly closingParanthesisToken: SyntaxTreeToken,

        readonly name: string
    ) {
        super([nameToken, openingParanthesisToken, ...args.flatMap(a => [a.arg, a.commaToken]), closingParanthesisToken]);
    }

    get type() { return SyntaxTreeType.functionExpression; }

    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        const functionDefinition = queryContext.options.functions[this.name];
        if (functionDefinition === undefined) return Nothing;
        
        const argValues = [];
        for (let i = 0; i < Math.min(this.args.length, functionDefinition.parameters.length); i++) {
            const arg = this.args[i].arg;
            const argValue = evaluateAs(arg, functionDefinition.parameters[i].type, queryContext, filterExpressionContext);
            argValues.push(argValue);
        }

        if (this.args.length < functionDefinition.parameters.length) return Nothing;
        
        const functionContext = queryContext.reportDiagnosticsCallback === undefined 
            ? nullFunctionContext 
            : new QueryContextFunctionContext(queryContext.reportDiagnosticsCallback, this);
        const result = functionDefinition.handler(functionContext, ...argValues);
        return result;
    }
}

class QueryContextFunctionContext implements FunctionContext {
    constructor(
        private readonly reportDiagnosticsCallback: (diagnostics: Diagnostics) => void,
        private readonly functionExpression: FunctionExpression
    ) { }

    reportParameterWarning(parameterIndex: number, message: string): void {
        const warning = new Diagnostics(DiagnosticsType.warning, message, this.functionExpression.args[parameterIndex].arg.textRangeWithoutSkipped);
        this.reportDiagnosticsCallback(warning);
    }

    reportWarning(message: string): void {
        const warning = new Diagnostics(DiagnosticsType.warning, message, this.functionExpression.nameToken.textRangeWithoutSkipped);
        this.reportDiagnosticsCallback(warning);
    }
}
