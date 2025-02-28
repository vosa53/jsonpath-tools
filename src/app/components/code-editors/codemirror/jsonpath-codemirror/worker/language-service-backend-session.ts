import { DynamicAnalysisResult, DynamicAnalyzer } from "@/jsonpath-tools/dynamic-analysis/dynamic-analyzer";
import { CompletionProvider } from "@/jsonpath-tools/editor-services/completion-provider";
import { defaultJSONPathOptions, JSONPathFunctionHandler, JSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { TypeChecker } from "@/jsonpath-tools/semantic-analysis/type-checker";
import { JSONPathParser } from "@/jsonpath-tools/syntax-analysis/parser";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { logPerformance } from "@/jsonpath-tools/utils";
import { DisconnectLanguageServiceMessage, GetCompletionsLanguageServiceMessage, GetCompletionsLanguageServiceMessageResponse, GetDiagnosticsLanguageServiceMessage, GetDiagnosticsLanguageServiceMessageResponse, GetResultLanguageServiceMessage, GetResultLanguageServiceMessageResponse, UpdateOptionsLanguageServiceMessage, UpdateQueryArgumentLanguageServiceMessage, UpdateQueryLanguageServiceMessage } from "./language-service-messages";
import { SimpleRPCTopic } from "./simple-rpc";

export class LanguageServiceBackendSession {
    private readonly parser: JSONPathParser;
    private options: JSONPathOptions;
    private typeChecker: TypeChecker;
    private completionProvider: CompletionProvider;
    private dynamicAnalyzer: DynamicAnalyzer;
    private query: JSONPath;
    private queryArgument: JSONPathJSONValue;
    private dynamicAnalysisResult: DynamicAnalysisResult | null;

    constructor(private readonly rpcTopic: SimpleRPCTopic, private readonly resolveFunctionHandler: (functionName: string) => JSONPathFunctionHandler) {
        this.parser = new JSONPathParser();
        this.options = defaultJSONPathOptions;
        this.typeChecker = new TypeChecker(this.options);
        this.completionProvider = new CompletionProvider(this.options);
        this.dynamicAnalyzer = new DynamicAnalyzer(this.options);
        this.query = this.parser.parse("$"); // Replace with "",
        this.queryArgument = {};
        this.dynamicAnalysisResult = null;
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
        this.typeChecker = new TypeChecker(this.options);
        this.completionProvider = new CompletionProvider(this.options);
        this.dynamicAnalyzer = new DynamicAnalyzer(this.options);
        this.dynamicAnalysisResult = null;
    }

    updateQuery(message: UpdateQueryLanguageServiceMessage) {
        this.query = this.parser.parse(message.newQuery);
        this.dynamicAnalysisResult = null;
    }

    updateQueryArgument(message: UpdateQueryArgumentLanguageServiceMessage) {
        this.queryArgument = message.newQueryArgument;
        this.dynamicAnalysisResult = null;
    }

    getCompletions(message: GetCompletionsLanguageServiceMessage): GetCompletionsLanguageServiceMessageResponse {
        const completions = this.completionProvider.provideCompletions(this.query, this.queryArgument, message.position);

        return {
            completions: completions
        };
    }

    getDiagnostics(message: GetDiagnosticsLanguageServiceMessage): GetDiagnosticsLanguageServiceMessageResponse {
        const syntaxDiagnostics = this.query.syntaxDiagnostics;
        const typeCheckerDiagnostics = this.typeChecker.check(this.query);
        const dynamicAnalysisDiagnostics = this.getDynamicAnalysisResult().diagnostics;
        const diagnostics = [...syntaxDiagnostics, ...typeCheckerDiagnostics, ...dynamicAnalysisDiagnostics];
        diagnostics.sort((a, b) => a.textRange.position - b.textRange.position);

        return {
            diagnostics: diagnostics
        };
    }

    getResult(message: GetResultLanguageServiceMessage): GetResultLanguageServiceMessageResponse {
        const result = this.getDynamicAnalysisResult().queryResult;

        return {
            nodes: result.nodes.map(n => n.value),
            paths: result.nodes.map(n => n.buildPath())
        };
    }

    disconnect(message: DisconnectLanguageServiceMessage) {
        this.rpcTopic.dispose();
    }

    private getDynamicAnalysisResult(): DynamicAnalysisResult {
        if (this.dynamicAnalysisResult === null)
            this.dynamicAnalysisResult = logPerformance("Execute query and anylyze (on worker)", () => this.dynamicAnalyzer.analyze(this.query, this.queryArgument));
        return this.dynamicAnalysisResult;
    }
}