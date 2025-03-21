import { CompletionItem } from "@/jsonpath-tools/editor-services/completion-service";
import { EditorService } from "@/jsonpath-tools/editor-services/editor-service";
import { JSONPathFunction, JSONPathFunctionHandler } from "@/jsonpath-tools/options";
import { logPerformance } from "@/jsonpath-tools/utils";
import { deserializeDataType } from "./data-type-serializer";
import { DisconnectLanguageServiceMessage, GetCompletionsLanguageServiceMessage, GetCompletionsLanguageServiceMessageResponse, GetDiagnosticsLanguageServiceMessage, GetDiagnosticsLanguageServiceMessageResponse, GetDocumentHighlightsLanguageServiceMessage, GetDocumentHighlightsLanguageServiceMessageResponse, GetFormattingEditsLanguageServiceMessage, GetFormattingEditsLanguageServiceMessageResponse, GetResultLanguageServiceMessage, GetResultLanguageServiceMessageResponse, GetSignatureLanguageServiceMessage, GetSignatureLanguageServiceMessageResponse, GetTooltipLanguageServiceMessage, GetTooltipLanguageServiceMessageResponse, ResolveCompletionLanguageServiceMessage, ResolveCompletionLanguageServiceMessageResponse, UpdateOptionsLanguageServiceMessage, UpdateQueryArgumentLanguageServiceMessage, UpdateQueryArgumentTypeLanguageServiceMessage, UpdateQueryLanguageServiceMessage } from "./language-service-messages";
import { SimpleRPCTopic } from "./simple-rpc";

export class LanguageServiceBackendSession {
    private readonly editorService = new EditorService();
    private lastCompletions: readonly CompletionItem[] = [];

    constructor(
        private readonly rpcTopic: SimpleRPCTopic, 
        private readonly resolveFunctionHandler: (functionName: string) => JSONPathFunctionHandler
    ) { }

    updateOptions(message: UpdateOptionsLanguageServiceMessage) {
        const functions: [string, JSONPathFunction][] = Object.entries(message.newOptions.functions).map(([name, f]) => [
            name,
            {
                description: f.description,
                parameters: f.parameters.map(p => ({
                    name: p.name,
                    description: p.description,
                    type: p.type,
                    dataType: deserializeDataType(p.dataType)
                })),
                returnType: f.returnType,
                returnDataType: deserializeDataType(f.returnDataType),
                handler: this.resolveFunctionHandler(name)
            }
        ]);
        const newOptions = {
            functions: Object.fromEntries(functions)
        };
        this.editorService.updateOptions(newOptions);
    }

    updateQuery(message: UpdateQueryLanguageServiceMessage) {
        this.editorService.updateQuery(message.newQuery);
    }

    updateQueryArgument(message: UpdateQueryArgumentLanguageServiceMessage) {
        this.editorService.updateQueryArgument(message.newQueryArgument);
    }

    updateQueryArgumentType(message: UpdateQueryArgumentTypeLanguageServiceMessage) {
        const newQueryArgumentType = deserializeDataType(message.newQueryArgumentTypeSerialized);
        this.editorService.updateQueryArgumentType(newQueryArgumentType);
    }

    getCompletions(message: GetCompletionsLanguageServiceMessage): GetCompletionsLanguageServiceMessageResponse {
        const completions = this.editorService.getCompletions(message.position);
        this.lastCompletions = completions;

        return {
            completions: completions.map(c => ({ type: c.type, text: c.text, detail: c.detail, isSnippet: c.isSnippet }))
        };
    }

    resolveCompletion(message: ResolveCompletionLanguageServiceMessage): ResolveCompletionLanguageServiceMessageResponse {
        const completion = this.lastCompletions[message.index];
        const description = logPerformance("Resolve completion", () => completion?.resolveDescription?.() ?? "");

        return {
            description: description
        };
    }

    getSignature(message: GetSignatureLanguageServiceMessage): GetSignatureLanguageServiceMessageResponse {
        return {
            signature: this.editorService.getSignature(message.position)
        };
    }

    getDocumentHighlights(message: GetDocumentHighlightsLanguageServiceMessage): GetDocumentHighlightsLanguageServiceMessageResponse {
        return {
            documentHighlights: this.editorService.getDocumentHighlights(message.position)
        };
    }

    getTooltip(message: GetTooltipLanguageServiceMessage): GetTooltipLanguageServiceMessageResponse {
        return {
            tooltip: this.editorService.getTooltip(message.position)
        };
    }

    getDiagnostics(message: GetDiagnosticsLanguageServiceMessage): GetDiagnosticsLanguageServiceMessageResponse {
        return {
            diagnostics: this.editorService.getDiagnostics()
        };
    }

    getFormattingEdits(message: GetFormattingEditsLanguageServiceMessage): GetFormattingEditsLanguageServiceMessageResponse {
        return {
            formattingEdits: this.editorService.getFormattingEdits()
        };
    }

    getResult(message: GetResultLanguageServiceMessage): GetResultLanguageServiceMessageResponse {
        const result = this.editorService.getResult();
        return {
            nodes: result.nodes.map(n => n.value),
            paths: result.nodes.map(n => n.buildPath())
        };
    }

    disconnect(message: DisconnectLanguageServiceMessage) {
        this.rpcTopic.dispose();
    }
}