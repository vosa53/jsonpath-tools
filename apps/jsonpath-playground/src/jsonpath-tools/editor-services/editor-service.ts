import { DynamicAnalysisResult, DynamicAnalyzer } from "../analyzers/dynamic-analyzer";
import { StaticAnalyzer } from "../analyzers/static-analyzer";
import { AnyDataType, DataType } from "../data-types/data-types";
import { JSONPathDiagnostics } from "../diagnostics";
import { defaultJSONPathOptions, JSONPathFunctionHandler, JSONPathOptions } from "../options";
import { JSONPath } from "../query/json-path";
import { TypeChecker } from "../semantic-analysis/type-checker";
import { JSONPathParser } from "../syntax-analysis/parser";
import { TextChange } from "../text-change";
import { JSONPathJSONValue, JSONPathNodeList } from "../types";
import { logPerformance } from "../utils";
import { CompletionItem, CompletionProvider } from "./completion-service";
import { DocumentHighlight, DocumentHighlightsService } from "./document-highlights-service";
import { FormattingService } from "./formatting-service";
import { Signature, SignatureHelpService } from "./signature-help-service";
import { Tooltip, TooltipService } from "./tooltip-service";

export class EditorService {
    private readonly parser: JSONPathParser;
    private options: JSONPathOptions;
    private typeChecker: TypeChecker;
    private completionProvider: CompletionProvider;
    private signatureProvider: SignatureHelpService;
    private documentHighlightsProvider: DocumentHighlightsService;
    private tooltipProvider: TooltipService;
    private staticAnalyzer: StaticAnalyzer;
    private dynamicAnalyzer: DynamicAnalyzer;
    private formatter: FormattingService;
    private query: JSONPath;
    private queryArgument: JSONPathJSONValue | undefined;
    private queryArgumentType: DataType;
    private dynamicAnalysisResult: DynamicAnalysisResult | null;

    constructor() {
        this.parser = new JSONPathParser();
        this.options = defaultJSONPathOptions;
        this.typeChecker = new TypeChecker(this.options);
        this.completionProvider = new CompletionProvider(this.options);
        this.signatureProvider = new SignatureHelpService(this.options);
        this.documentHighlightsProvider = new DocumentHighlightsService(this.options);
        this.tooltipProvider = new TooltipService(this.options);
        this.staticAnalyzer = new StaticAnalyzer(this.options);
        this.dynamicAnalyzer = new DynamicAnalyzer(this.options);
        this.formatter = new FormattingService();
        this.query = this.parser.parse("");
        this.queryArgument = undefined;
        this.queryArgumentType = AnyDataType.create();
        this.dynamicAnalysisResult = null;
    }

    updateOptions(newOptions: JSONPathOptions) {
        this.options = newOptions;
        this.typeChecker = new TypeChecker(this.options);
        this.completionProvider = new CompletionProvider(this.options);
        this.signatureProvider = new SignatureHelpService(this.options);
        this.documentHighlightsProvider = new DocumentHighlightsService(this.options);
        this.tooltipProvider = new TooltipService(this.options);
        this.staticAnalyzer = new StaticAnalyzer(this.options);
        this.dynamicAnalyzer = new DynamicAnalyzer(this.options);
        this.dynamicAnalysisResult = null;
    }

    updateQuery(newQuery: string) {
        this.query = this.parser.parse(newQuery);
        this.dynamicAnalysisResult = null;
    }

    updateQueryArgument(newQueryArgument: JSONPathJSONValue | undefined) {
        this.queryArgument = newQueryArgument;
        this.dynamicAnalysisResult = null;
    }

    updateQueryArgumentType(newQueryArgumentType: DataType) {
        this.queryArgumentType = newQueryArgumentType;
    }

    getCompletions(position: number): CompletionItem[] {
        return logPerformance("Get completions", () => this.completionProvider.provideCompletions(this.query, this.queryArgument, this.queryArgumentType, position));
    }

    getSignature(position: number): Signature | null {
        return this.signatureProvider.provideSignature(this.query, position);
    }

    getDocumentHighlights(position: number): DocumentHighlight[] {
        return this.documentHighlightsProvider.provideHighlights(this.query, position);
    }

    getTooltip(position: number): Tooltip | null {
        return this.tooltipProvider.provideTooltip(this.query, this.queryArgument, this.queryArgumentType, position);
    }

    getDiagnostics(): JSONPathDiagnostics[] {
        const syntaxDiagnostics = this.query.syntaxDiagnostics;
        const typeCheckerDiagnostics = this.typeChecker.check(this.query);
        const analysisDiagnostics = this.queryArgument === undefined
            ? this.staticAnalyzer.analyze(this.query, this.queryArgumentType)
            : this.getDynamicAnalysisResult().diagnostics;
        const diagnostics = [...syntaxDiagnostics, ...typeCheckerDiagnostics, ...analysisDiagnostics];
        diagnostics.sort((a, b) => a.textRange.position - b.textRange.position);

        return diagnostics;
    }

    getFormattingEdits(): TextChange[] {
        return this.formatter.getFormattingEdits(this.query);
    }

    getResult(): JSONPathNodeList {
        return this.getDynamicAnalysisResult().queryResult;
    }

    private getDynamicAnalysisResult(): DynamicAnalysisResult {
        if (this.dynamicAnalysisResult === null) {
            if (this.queryArgument !== undefined)
                this.dynamicAnalysisResult = logPerformance("Execute query and analyze (on worker)", () => this.dynamicAnalyzer.analyze(this.query, this.queryArgument!));
            else
                this.dynamicAnalysisResult = { diagnostics: [], queryResult: new JSONPathNodeList([]) };
        }
        return this.dynamicAnalysisResult;
    }
}