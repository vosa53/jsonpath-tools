import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { SimpleRPC } from "./simple-rpc";
import { LanguageServiceBackendSession } from "./language-service-backend-session";
import { UpdateOptionsLanguageServiceMessage, UpdateQueryLanguageServiceMessage, UpdateQueryArgumentLanguageServiceMessage, GetCompletionsLanguageServiceMessage, GetDiagnosticsLanguageServiceMessage, GetResultLanguageServiceMessage, DisconnectLanguageServiceMessage, GetSignatureLanguageServiceMessage, GetTooltipLanguageServiceMessage, ResolveCompletionLanguageServiceMessage, GetDocumentHighlightsLanguageServiceMessage } from "./language-service-messages";
import { defaultJSONPathOptions, JSONPathFunctionHandler } from "@/jsonpath-tools/options";

export class LanguageServiceBackend {
    private readonly rpc: SimpleRPC<LanguageServiceBackendSession>;

    constructor(sendToFrontend: (data: JSONPathJSONValue) => void, resolveFunctionHandler?: (functionName: string) => JSONPathFunctionHandler) {
        resolveFunctionHandler ??= fn => {
            const exists = Object.hasOwn(defaultJSONPathOptions.functions, fn);
            if (!exists) throw new Error(`Function '${fn}' not found.`);
            else return defaultJSONPathOptions.functions[fn].handler;
        };
        this.rpc = new SimpleRPC<LanguageServiceBackendSession>(
            i => sendToFrontend(i), 
            t => new LanguageServiceBackendSession(t, resolveFunctionHandler)
        );

        this.rpc.addHandlerAction("updateOptions", (h, message: UpdateOptionsLanguageServiceMessage) => h.updateOptions(message));
        this.rpc.addHandlerAction("updateQuery", (h, message: UpdateQueryLanguageServiceMessage) => h.updateQuery(message));
        this.rpc.addHandlerAction("updateQueryArgument", (h, message: UpdateQueryArgumentLanguageServiceMessage) => h.updateQueryArgument(message));
        this.rpc.addHandlerAction("getCompletions", (h, message: GetCompletionsLanguageServiceMessage) => h.getCompletions(message));
        this.rpc.addHandlerAction("resolveCompletion", (h, message: ResolveCompletionLanguageServiceMessage) => h.resolveCompletion(message));
        this.rpc.addHandlerAction("getSignature", (h, message: GetSignatureLanguageServiceMessage) => h.getSignature(message));
        this.rpc.addHandlerAction("getDocumentHighlights", (h, message: GetDocumentHighlightsLanguageServiceMessage) => h.getDocumentHighlights(message));
        this.rpc.addHandlerAction("getTooltip", (h, message: GetTooltipLanguageServiceMessage) => h.getTooltip(message));
        this.rpc.addHandlerAction("getDiagnostics", (h, message: GetDiagnosticsLanguageServiceMessage) => h.getDiagnostics(message));
        this.rpc.addHandlerAction("getResult", (h, message: GetResultLanguageServiceMessage) => h.getResult(message));
        this.rpc.addHandlerAction("disconnect", (h, message: DisconnectLanguageServiceMessage) => h.disconnect(message));
    }

    receiveFromFrontend(data: JSONPathJSONValue) {
        this.rpc.receive(data);
    }
}