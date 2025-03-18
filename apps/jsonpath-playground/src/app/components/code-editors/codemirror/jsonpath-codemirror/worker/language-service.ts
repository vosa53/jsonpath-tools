import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { LanguageServiceSession } from "./language-service-session";
import { SimpleRPC } from "./simple-rpc";

export class LanguageService {
    private readonly rpc: SimpleRPC<LanguageServiceSession>;

    constructor(readonly sendToBackend: (data: JSONPathJSONValue) => void) {
        this.rpc = new SimpleRPC<LanguageServiceSession>(d => sendToBackend(d), t => new LanguageServiceSession(t));
    }

    receiveFromBackend(data: JSONPathJSONValue) {
        this.rpc.receive(data);
    }

    createSession(): LanguageServiceSession {
        return this.rpc.createHandler();
    }
}