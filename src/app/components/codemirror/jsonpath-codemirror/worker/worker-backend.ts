import { CompletionProvider } from "@/jsonpath-tools/editor-services/completion-provider";
import { defaultJSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPathQueryContext } from "@/jsonpath-tools/query/evaluation";
import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { TypeChecker } from "@/jsonpath-tools/semantic-analysis/type-checker";
import { JSONPathParser } from "@/jsonpath-tools/syntax-analysis/parser";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { DisconnectWorkerMessage, GetCompletionsWorkerMessage, GetCompletionsWorkerMessageResponse, GetDiagnosticsWorkerMessage, GetDiagnosticsWorkerMessageResponse, GetResultWorkerMessage, GetResultWorkerMessageResponse, UpdateOptionsWorkerMessage, UpdateQueryArgumentWorkerMessage, UpdateQueryWorkerMessage } from "./worker-messages";
import { WebWorkerRPCTopic } from "./worker-rpc";

export class WorkerBackend {
    private readonly parser: JSONPathParser;
    private checker: TypeChecker;
    private completionProvider: CompletionProvider;
    private jsonPath: JSONPath;
    private queryArgument: JSONPathJSONValue;

    constructor(private readonly rpcTopic: WebWorkerRPCTopic) {
        this.parser = new JSONPathParser();
        this.checker = new TypeChecker(defaultJSONPathOptions);
        this.completionProvider = new CompletionProvider(defaultJSONPathOptions);
        this.jsonPath = this.parser.parse("$"); // Replace with "",
        this.queryArgument = {};
    }

    updateOptions(message: UpdateOptionsWorkerMessage) {
        this.checker = new TypeChecker(message.newOptions);
        this.completionProvider = new CompletionProvider(message.newOptions);
    }

    updateQuery(message: UpdateQueryWorkerMessage) {
        this.jsonPath = this.parser.parse(message.newQuery);
    }

    updateQueryArgument(message: UpdateQueryArgumentWorkerMessage) {
        this.queryArgument = message.newQueryArgument;
    }

    getCompletions(message: GetCompletionsWorkerMessage): GetCompletionsWorkerMessageResponse {
        const completions = this.completionProvider.provideCompletions(this.jsonPath, this.queryArgument, message.position);

        return {
            completions: completions
        };
    }

    getDiagnostics(message: GetDiagnosticsWorkerMessage): GetDiagnosticsWorkerMessageResponse {
        const syntaxDiagnostics = this.jsonPath.syntaxDiagnostics;
        const typeCheckerDiagnostics = this.checker.check(this.jsonPath, defaultJSONPathOptions);
        const diagnostics = [...syntaxDiagnostics, ...typeCheckerDiagnostics];
        diagnostics.sort((a, b) => a.textRange.position - b.textRange.position);

        return {
            diagnostics: diagnostics
        };
    }

    getResult(message: GetResultWorkerMessage): GetResultWorkerMessageResponse {
        const context: JSONPathQueryContext = { rootNode: this.queryArgument, options: defaultJSONPathOptions };
        const result = this.jsonPath.select(context);

        return {
            nodes: result.nodes.map(n => n.value),
            paths: result.nodes.map(n => n.buildPath())
        };
    }

    disconnect(message: DisconnectWorkerMessage) {
        this.rpcTopic.dispose();
    }

    /*private runQuery() {
        const context: JSONPathQueryContext = { rootNode: this.queryArgument, options: this.options };
        const result = this.jsonPath.select(context);
    }*/
}