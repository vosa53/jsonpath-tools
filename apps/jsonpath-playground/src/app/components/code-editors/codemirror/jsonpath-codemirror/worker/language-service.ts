import { JSONValue } from "@/jsonpath-tools/types";
import { LanguageServiceSession } from "./language-service-session";
import { SimpleRPC } from "./simple-rpc";

export class LanguageService {
    private readonly rpc: SimpleRPC<LanguageServiceSession>;

    constructor(readonly sendToBackend: (data: JSONValue) => void) {
        this.rpc = new SimpleRPC<LanguageServiceSession>(d => sendToBackend(d), t => new LanguageServiceSession(t));
    }

    receiveFromBackend(data: JSONValue) {
        this.rpc.receive(data);
    }

    createSession(): LanguageServiceSession {
        return this.rpc.createHandler();
    }
}