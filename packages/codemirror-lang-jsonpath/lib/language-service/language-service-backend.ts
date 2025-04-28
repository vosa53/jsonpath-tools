import { JSONValue } from "@jsonpath-tools/jsonpath";
import { SimpleRPC } from "./simple-rpc";
import { LanguageServiceBackendSession } from "./language-service-backend-session";
import { UpdateQueryOptionsLanguageServiceMessage, UpdateQueryLanguageServiceMessage, UpdateQueryArgumentLanguageServiceMessage, GetCompletionsLanguageServiceMessage, GetDiagnosticsLanguageServiceMessage, GetResultLanguageServiceMessage, DisconnectLanguageServiceMessage, GetSignatureLanguageServiceMessage, GetTooltipLanguageServiceMessage, ResolveCompletionLanguageServiceMessage, GetDocumentHighlightsLanguageServiceMessage, GetFormattingEditsLanguageServiceMessage, UpdateQueryArgumentTypeLanguageServiceMessage, LanguageServiceMessageID } from "./language-service-messages";
import { defaultQueryOptions } from "@jsonpath-tools/jsonpath";
import { FunctionHandler } from "@jsonpath-tools/jsonpath";

/**
 * Serves as a backend for a language service providing services for editors.
 */
export class LanguageServiceBackend {
    private readonly rpc: SimpleRPC<LanguageServiceBackendSession>;

    /**
     * @param sendToFrontend Callback that sends a given data to the frontend.
     * @param resolveFunctionHandler Callback that returns a handler for the given function name.
     */
    constructor(
        sendToFrontend: (data: JSONValue) => void, 
        resolveFunctionHandler?: (functionName: string) => FunctionHandler
    ) {
        resolveFunctionHandler ??= fn => {
            const exists = Object.hasOwn(defaultQueryOptions.functions, fn);
            if (!exists) throw new Error(`Function '${fn}' not found.`);
            else return defaultQueryOptions.functions[fn].handler;
        };
        this.rpc = new SimpleRPC<LanguageServiceBackendSession>(
            i => sendToFrontend(i), 
            t => new LanguageServiceBackendSession(t, resolveFunctionHandler)
        );

        this.rpc.registerHandlerAction(LanguageServiceMessageID.updateQueryOptions, (h, message: UpdateQueryOptionsLanguageServiceMessage) => h.updateQueryOptions(message));
        this.rpc.registerHandlerAction(LanguageServiceMessageID.updateQuery, (h, message: UpdateQueryLanguageServiceMessage) => h.updateQuery(message));
        this.rpc.registerHandlerAction(LanguageServiceMessageID.updateQueryArgument, (h, message: UpdateQueryArgumentLanguageServiceMessage) => h.updateQueryArgument(message));
        this.rpc.registerHandlerAction(LanguageServiceMessageID.updateQueryArgumentType, (h, message: UpdateQueryArgumentTypeLanguageServiceMessage) => h.updateQueryArgumentType(message));
        this.rpc.registerHandlerAction(LanguageServiceMessageID.getCompletions, (h, message: GetCompletionsLanguageServiceMessage) => h.getCompletions(message));
        this.rpc.registerHandlerAction(LanguageServiceMessageID.resolveCompletion, (h, message: ResolveCompletionLanguageServiceMessage) => h.resolveCompletion(message));
        this.rpc.registerHandlerAction(LanguageServiceMessageID.getSignature, (h, message: GetSignatureLanguageServiceMessage) => h.getSignature(message));
        this.rpc.registerHandlerAction(LanguageServiceMessageID.getDocumentHighlights, (h, message: GetDocumentHighlightsLanguageServiceMessage) => h.getDocumentHighlights(message));
        this.rpc.registerHandlerAction(LanguageServiceMessageID.getTooltip, (h, message: GetTooltipLanguageServiceMessage) => h.getTooltip(message));
        this.rpc.registerHandlerAction(LanguageServiceMessageID.getDiagnostics, (h, message: GetDiagnosticsLanguageServiceMessage) => h.getDiagnostics(message));
        this.rpc.registerHandlerAction(LanguageServiceMessageID.getFormattingEdits, (h, message: GetFormattingEditsLanguageServiceMessage) => h.getFormattingEdits(message));
        this.rpc.registerHandlerAction(LanguageServiceMessageID.getResult, (h, message: GetResultLanguageServiceMessage) => h.getResult(message));
        this.rpc.registerHandlerAction(LanguageServiceMessageID.disconnect, (h, message: DisconnectLanguageServiceMessage) => h.disconnect(message));
    }

    /**
     * Receives the given data from the frontend.
     * @param data Data.
     */
    receiveFromFrontend(data: JSONValue) {
        this.rpc.receive(data);
    }
}