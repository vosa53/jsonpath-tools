import { DynamicAnalysisResult, DynamicAnalyzer } from "@/jsonpath-tools/dynamic-analysis/dynamic-analyzer";
import { CompletionItem, CompletionProvider } from "@/jsonpath-tools/editor-services/completion-provider";
import { defaultJSONPathOptions, JSONPathFunctionHandler, JSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { TypeChecker } from "@/jsonpath-tools/semantic-analysis/type-checker";
import { JSONPathParser } from "@/jsonpath-tools/syntax-analysis/parser";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { logPerformance } from "@/jsonpath-tools/utils";
import { DisconnectLanguageServiceMessage, GetCompletionsLanguageServiceMessage, GetCompletionsLanguageServiceMessageResponse, GetDiagnosticsLanguageServiceMessage, GetDiagnosticsLanguageServiceMessageResponse, GetDocumentHighlightsLanguageServiceMessage, GetDocumentHighlightsLanguageServiceMessageResponse, GetResultLanguageServiceMessage, GetResultLanguageServiceMessageResponse, GetSignatureLanguageServiceMessage, GetSignatureLanguageServiceMessageResponse, GetTooltipLanguageServiceMessage, GetTooltipLanguageServiceMessageResponse, ResolveCompletionLanguageServiceMessage, ResolveCompletionLanguageServiceMessageResponse, UpdateOptionsLanguageServiceMessage, UpdateQueryArgumentLanguageServiceMessage, UpdateQueryLanguageServiceMessage } from "./language-service-messages";
import { SimpleRPCTopic } from "./simple-rpc";
import { SignatureProvider } from "@/jsonpath-tools/editor-services/signature-provider";
import { TooltipProvider } from "@/jsonpath-tools/editor-services/tooltip-provider";
import { DocumentHighlightsProvider } from "@/jsonpath-tools/editor-services/document-highlights-provider";

export class LanguageServiceBackendSession {
    private readonly parser: JSONPathParser;
    private options: JSONPathOptions;
    private typeChecker: TypeChecker;
    private completionProvider: CompletionProvider;
    private signatureProvider: SignatureProvider;
    private documentHighlightsProvider: DocumentHighlightsProvider;
    private tooltipProvider: TooltipProvider;
    private dynamicAnalyzer: DynamicAnalyzer;
    private query: JSONPath;
    private queryArgument: JSONPathJSONValue;
    private dynamicAnalysisResult: DynamicAnalysisResult | null;
    private lastCompletions: readonly CompletionItem[];

    constructor(private readonly rpcTopic: SimpleRPCTopic, private readonly resolveFunctionHandler: (functionName: string) => JSONPathFunctionHandler) {
        this.parser = new JSONPathParser();
        this.options = defaultJSONPathOptions;
        this.typeChecker = new TypeChecker(this.options);
        this.completionProvider = new CompletionProvider(this.options);
        this.signatureProvider = new SignatureProvider(this.options);
        this.documentHighlightsProvider = new DocumentHighlightsProvider(this.options);
        this.tooltipProvider = new TooltipProvider(this.options);
        this.dynamicAnalyzer = new DynamicAnalyzer(this.options);
        this.query = this.parser.parse("");
        this.queryArgument = {};
        this.dynamicAnalysisResult = null;
        this.lastCompletions = [];
    }

    updateOptions(message: UpdateOptionsLanguageServiceMessage) {
        const functions = Object.entries(message.newOptions.functions).map(([name, f]) => [
            name,
            {
                description: f.description,
                parameters: f.parameters,
                returnType: f.returnType,
                handler: this.resolveFunctionHandler(name)
            }
        ]);
        this.options = {
            functions: Object.fromEntries(functions)
        };
        this.typeChecker = new TypeChecker(this.options);
        this.completionProvider = new CompletionProvider(this.options);
        this.signatureProvider = new SignatureProvider(this.options);
        this.documentHighlightsProvider = new DocumentHighlightsProvider(this.options);
        this.tooltipProvider = new TooltipProvider(this.options);
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
        this.lastCompletions = completions;

        return {
            completions: completions.map(c => ({ type: c.type, text: c.text, detail: c.detail }))
        };
    }

    resolveCompletion(message: ResolveCompletionLanguageServiceMessage): ResolveCompletionLanguageServiceMessageResponse {
        const completion = this.lastCompletions[message.index];
        const description = completion?.resolveDescription?.() ?? "";

        return {
            description: description
        };
    }

    getSignature(message: GetSignatureLanguageServiceMessage): GetSignatureLanguageServiceMessageResponse {
        const signature = this.signatureProvider.provideSignature(this.query, message.position);

        return {
            signature: signature
        };
    }

    getDocumentHighlights(message: GetDocumentHighlightsLanguageServiceMessage): GetDocumentHighlightsLanguageServiceMessageResponse {
        const documentHighlights = this.documentHighlightsProvider.provideHighlights(this.query, message.position);

        return {
            documentHighlights: documentHighlights
        };
    }

    getTooltip(message: GetTooltipLanguageServiceMessage): GetTooltipLanguageServiceMessageResponse {
        const tooltip = this.tooltipProvider.provideTooltip(this.query, message.position);

        return {
            tooltip: tooltip
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