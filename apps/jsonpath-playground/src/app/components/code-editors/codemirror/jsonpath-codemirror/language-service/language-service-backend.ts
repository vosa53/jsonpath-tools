import { JSONValue } from "@/jsonpath-tools/json/json-types";
import { SimpleRPC } from "./simple-rpc";
import { LanguageServiceBackendSession } from "./language-service-backend-session";
import { UpdateOptionsLanguageServiceMessage, UpdateQueryLanguageServiceMessage, UpdateQueryArgumentLanguageServiceMessage, GetCompletionsLanguageServiceMessage, GetDiagnosticsLanguageServiceMessage, GetResultLanguageServiceMessage, DisconnectLanguageServiceMessage, GetSignatureLanguageServiceMessage, GetTooltipLanguageServiceMessage, ResolveCompletionLanguageServiceMessage, GetDocumentHighlightsLanguageServiceMessage, GetFormattingEditsLanguageServiceMessage, UpdateQueryArgumentTypeLanguageServiceMessage as UpdateQueryArgumentTypeLanguageServiceMessage } from "./language-service-messages";
import { defaultQueryOptions } from "@/jsonpath-tools/options";
import { FunctionHandler } from "@/jsonpath-tools/functions/function";

export class LanguageServiceBackend {
    private readonly rpc: SimpleRPC<LanguageServiceBackendSession>;

    constructor(sendToFrontend: (data: JSONValue) => void, resolveFunctionHandler?: (functionName: string) => FunctionHandler) {
        resolveFunctionHandler ??= fn => {
            const exists = Object.hasOwn(defaultQueryOptions.functions, fn);
            if (!exists) throw new Error(`Function '${fn}' not found.`);
            else return defaultQueryOptions.functions[fn].handler;
        };
        this.rpc = new SimpleRPC<LanguageServiceBackendSession>(
            i => sendToFrontend(i), 
            t => new LanguageServiceBackendSession(t, resolveFunctionHandler)
        );

        this.rpc.registerHandlerAction("updateOptions", (h, message: UpdateOptionsLanguageServiceMessage) => h.updateOptions(message));
        this.rpc.registerHandlerAction("updateQuery", (h, message: UpdateQueryLanguageServiceMessage) => h.updateQuery(message));
        this.rpc.registerHandlerAction("updateQueryArgument", (h, message: UpdateQueryArgumentLanguageServiceMessage) => h.updateQueryArgument(message));
        this.rpc.registerHandlerAction("updateQueryArgumentType", (h, message: UpdateQueryArgumentTypeLanguageServiceMessage) => h.updateQueryArgumentType(message));
        this.rpc.registerHandlerAction("getCompletions", (h, message: GetCompletionsLanguageServiceMessage) => h.getCompletions(message));
        this.rpc.registerHandlerAction("resolveCompletion", (h, message: ResolveCompletionLanguageServiceMessage) => h.resolveCompletion(message));
        this.rpc.registerHandlerAction("getSignature", (h, message: GetSignatureLanguageServiceMessage) => h.getSignature(message));
        this.rpc.registerHandlerAction("getDocumentHighlights", (h, message: GetDocumentHighlightsLanguageServiceMessage) => h.getDocumentHighlights(message));
        this.rpc.registerHandlerAction("getTooltip", (h, message: GetTooltipLanguageServiceMessage) => h.getTooltip(message));
        this.rpc.registerHandlerAction("getDiagnostics", (h, message: GetDiagnosticsLanguageServiceMessage) => h.getDiagnostics(message));
        this.rpc.registerHandlerAction("getFormattingEdits", (h, message: GetFormattingEditsLanguageServiceMessage) => h.getFormattingEdits(message));
        this.rpc.registerHandlerAction("getResult", (h, message: GetResultLanguageServiceMessage) => h.getResult(message));
        this.rpc.registerHandlerAction("disconnect", (h, message: DisconnectLanguageServiceMessage) => h.disconnect(message));
    }

    receiveFromFrontend(data: JSONValue) {
        this.rpc.receive(data);
    }
}