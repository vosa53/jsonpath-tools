import { CompletionProvider } from "@/jsonpath-tools/editor-services/completion-provider";
import { defaultJSONPathOptions, JSONPathFunctionHandler, JSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPathQueryContext } from "@/jsonpath-tools/query/evaluation";
import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { TypeChecker } from "@/jsonpath-tools/semantic-analysis/type-checker";
import { JSONPathParser } from "@/jsonpath-tools/syntax-analysis/parser";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { DisconnectLanguageServiceMessage, GetCompletionsLanguageServiceMessage, GetCompletionsLanguageServiceMessageResponse, GetDiagnosticsLanguageServiceMessage, GetDiagnosticsLanguageServiceMessageResponse, GetResultLanguageServiceMessage, GetResultLanguageServiceMessageResponse, UpdateOptionsLanguageServiceMessage, UpdateQueryArgumentLanguageServiceMessage, UpdateQueryLanguageServiceMessage } from "./language-service-messages";
import { SimpleRPCTopic } from "./simple-rpc";
import { logPerformance } from "@/jsonpath-tools/utils";

export class LanguageServiceBackendSession {
    private readonly parser: JSONPathParser;
    private options: JSONPathOptions;
    private checker: TypeChecker;
    private completionProvider: CompletionProvider;
    private jsonPath: JSONPath;
    private queryArgument: JSONPathJSONValue;

    constructor(private readonly rpcTopic: SimpleRPCTopic, private readonly resolveFunctionHandler: (functionName: string) => JSONPathFunctionHandler) {
        this.parser = new JSONPathParser();
        this.options = defaultJSONPathOptions;
        this.checker = new TypeChecker(this.options);
        this.completionProvider = new CompletionProvider(this.options);
        this.jsonPath = this.parser.parse("$"); // Replace with "",
        this.queryArgument = {};
    }

    updateOptions(message: UpdateOptionsLanguageServiceMessage) {
        const functions = Object.entries(message.newOptions.functions).map(([name, f]) => [
            name,
            {
                returnType: f.returnType,
                parameterTypes: f.parameterTypes,
                handler: this.resolveFunctionHandler(name)
            }
        ]);
        this.options = {
            functions: Object.fromEntries(functions)
        };
        this.checker = new TypeChecker(this.options);
        this.completionProvider = new CompletionProvider(this.options);
    }

    updateQuery(message: UpdateQueryLanguageServiceMessage) {
        this.jsonPath = this.parser.parse(message.newQuery);
    }

    updateQueryArgument(message: UpdateQueryArgumentLanguageServiceMessage) {
        this.queryArgument = message.newQueryArgument;
    }

    getCompletions(message: GetCompletionsLanguageServiceMessage): GetCompletionsLanguageServiceMessageResponse {
        const completions = this.completionProvider.provideCompletions(this.jsonPath, this.queryArgument, message.position);

        return {
            completions: completions
        };
    }

    getDiagnostics(message: GetDiagnosticsLanguageServiceMessage): GetDiagnosticsLanguageServiceMessageResponse {
        const syntaxDiagnostics = this.jsonPath.syntaxDiagnostics;
        const typeCheckerDiagnostics = this.checker.check(this.jsonPath);
        const diagnostics = [...syntaxDiagnostics, ...typeCheckerDiagnostics];
        diagnostics.sort((a, b) => a.textRange.position - b.textRange.position);

        return {
            diagnostics: diagnostics
        };
    }

    getResult(message: GetResultLanguageServiceMessage): GetResultLanguageServiceMessageResponse {
        const context: JSONPathQueryContext = { rootNode: this.queryArgument, options: this.options };
        const result = logPerformance("Execute query (on worker)", () => this.jsonPath.select(context));

        return {
            nodes: result.nodes.map(n => n.value),
            paths: result.nodes.map(n => n.buildPath())
        };
    }

    disconnect(message: DisconnectLanguageServiceMessage) {
        this.rpcTopic.dispose();
    }

    /*private runQuery() {
        const context: JSONPathQueryContext = { rootNode: this.queryArgument, options: this.options };
        const result = this.jsonPath.select(context);
    }*/
}