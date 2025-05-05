import { DynamicAnalysisResult, DynamicAnalyzer } from "../analyzers/dynamic-analyzer";
import { StaticAnalyzer } from "../analyzers/static-analyzer";
import { AnyDataType, DataType } from "../data-types/data-types";
import { Diagnostics } from "../diagnostics";
import { defaultQueryOptions, QueryOptions } from "../query-options";
import { Query } from "../query/query";
import { Checker } from "../semantic-analysis/checker";
import { Parser } from "../syntax-analysis/parser";
import { TextChange } from "../text/text-change";
import { JSONValue } from "../json/json-types";
import { NodeList } from "../values/node-list";
import { CompletionItem, CompletionService } from "./completion-service";
import { DocumentHighlight, DocumentHighlightsService } from "./document-highlights-service";
import { FormattingService } from "./formatting-service";
import { Signature, SignatureHelpService } from "./signature-help-service";
import { Tooltip, TooltipService } from "./tooltip-service";
import { logPerformance } from "../../../../shared/utils";
import { applyTextChanges } from "../text/operations";

/**
 * Provides services for JSONPath editors.
 */
export class EditorService {
    private readonly parser: Parser;
    private queryOptions: QueryOptions;
    private checker: Checker;
    private completionService: CompletionService;
    private signatureHelpService: SignatureHelpService;
    private documentHighlightsService: DocumentHighlightsService;
    private tooltipService: TooltipService;
    private staticAnalyzer: StaticAnalyzer;
    private dynamicAnalyzer: DynamicAnalyzer;
    private formattingService: FormattingService;
    private queryText: string;
    private query: Query;
    private queryArgument: JSONValue | undefined;
    private queryArgumentType: DataType;
    private dynamicAnalysisResult: DynamicAnalysisResult | null;

    constructor() {
        this.parser = new Parser();
        this.queryOptions = defaultQueryOptions;
        this.checker = new Checker(this.queryOptions);
        this.completionService = new CompletionService(this.queryOptions);
        this.signatureHelpService = new SignatureHelpService(this.queryOptions);
        this.documentHighlightsService = new DocumentHighlightsService(this.queryOptions);
        this.tooltipService = new TooltipService(this.queryOptions);
        this.staticAnalyzer = new StaticAnalyzer(this.queryOptions);
        this.dynamicAnalyzer = new DynamicAnalyzer(this.queryOptions);
        this.formattingService = new FormattingService();
        this.queryText = "";
        this.query = this.parser.parse(this.queryText);
        this.queryArgument = undefined;
        this.queryArgumentType = AnyDataType.create();
        this.dynamicAnalysisResult = null;
    }

    /**
     * Updates query options.
     * @param newQueryOptions New query options.
     */
    updateQueryOptions(newQueryOptions: QueryOptions) {
        this.queryOptions = newQueryOptions;
        this.checker = new Checker(this.queryOptions);
        this.completionService = new CompletionService(this.queryOptions);
        this.signatureHelpService = new SignatureHelpService(this.queryOptions);
        this.documentHighlightsService = new DocumentHighlightsService(this.queryOptions);
        this.tooltipService = new TooltipService(this.queryOptions);
        this.staticAnalyzer = new StaticAnalyzer(this.queryOptions);
        this.dynamicAnalyzer = new DynamicAnalyzer(this.queryOptions);
        this.dynamicAnalysisResult = null;
    }

    /**
     * Updates edited query text.
     * 
     * @param newQuery New text of the edited query.
     * @see updateQueryPartial for partial update.
     */
    updateQuery(newQuery: string) {
        this.queryText = newQuery;
        this.query = this.parser.parse(this.queryText);
        this.dynamicAnalysisResult = null;
    }

    /**
     * Updates **part** of edited query text.
     * @param queryTextChanges Text changes that should be applied to the edited query text.
     * @see updateQuery for full update.
     */
    updateQueryPartial(queryTextChanges: readonly TextChange[]) {
        const newQuery = applyTextChanges(this.queryText, queryTextChanges);
        this.updateQuery(newQuery);
    }

    /**
     * Updates query argument.
     * @param newQueryArgument New query argument. 
     */
    updateQueryArgument(newQueryArgument: JSONValue | undefined) {
        this.queryArgument = newQueryArgument;
        this.dynamicAnalysisResult = null;
    }

    /**
     * Updates query argument type.
     * @param newQueryArgumentType New query argument type.
     */
    updateQueryArgumentType(newQueryArgumentType: DataType) {
        this.queryArgumentType = newQueryArgumentType;
    }

    /**
     * Provides completion items at the given caret position in the query text.
     * @param position Caret position in the query text (starts with 0).
     */
    getCompletions(position: number): CompletionItem[] {
        return logPerformance("Get completions", () => this.completionService.provideCompletions(this.query, this.queryArgument, this.queryArgumentType, position));
    }

    /**
     * Provides a signature at the given caret position in the query text. When no signature is available it returns `null`.
     * @param position Caret position in the query text (starts with 0).
     */
    getSignature(position: number): Signature | null {
        return this.signatureHelpService.provideSignature(this.query, position);
    }

    /**
     * Provides document highlights at the given caret position in the query text.
     * @param position Caret position in the query text (starts with 0).
     */
    getDocumentHighlights(position: number): DocumentHighlight[] {
        return this.documentHighlightsService.provideHighlights(this.query, position);
    }

    /**
     * Provides a tooltip at the given position in the query text.
     * @param position Position in the query text (character index).
     */
    getTooltip(position: number): Tooltip | null {
        return this.tooltipService.provideTooltip(this.query, this.queryArgument, this.queryArgumentType, position);
    }

    /**
     * Provides the query errors and warnings.
     */
    getDiagnostics(): Diagnostics[] {
        const syntaxDiagnostics = this.query.syntaxDiagnostics;
        const typeCheckerDiagnostics = this.checker.check(this.query);
        const analysisDiagnostics = this.queryArgument === undefined
            ? this.staticAnalyzer.analyze(this.query, this.queryArgumentType)
            : this.getDynamicAnalysisResult().diagnostics;
        const diagnostics = [...syntaxDiagnostics, ...typeCheckerDiagnostics, ...analysisDiagnostics];
        diagnostics.sort((a, b) => a.textRange.position - b.textRange.position);

        return diagnostics;
    }

    /**
     * Provides text changes that can be used to format the query text.
     */
    getFormattingEdits(): TextChange[] {
        return this.formattingService.provideFormattingEdits(this.query);
    }

    /**
     * Returns the query result (selected nodes).
     */
    getResult(): NodeList {
        return this.getDynamicAnalysisResult().queryResult;
    }

    private getDynamicAnalysisResult(): DynamicAnalysisResult {
        if (this.dynamicAnalysisResult === null) {
            if (this.queryArgument !== undefined)
                this.dynamicAnalysisResult = logPerformance("Execute query and analyze (on worker)", () => this.dynamicAnalyzer.analyze(this.query, this.queryArgument!));
            else
                this.dynamicAnalysisResult = { diagnostics: [], queryResult: new NodeList([]) };
        }
        return this.dynamicAnalysisResult;
    }
}