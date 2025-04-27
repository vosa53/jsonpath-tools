import { JSONValue } from "@jsonpath-tools/jsonpath";
import { LanguageServiceSession } from "./language-service-session";
import { SimpleRPC } from "./simple-rpc";

/**
 * Serves as a frontend for a language service providing services for editors.
 */
export class LanguageService {
    private readonly rpc: SimpleRPC<LanguageServiceSession>;

    /**
     * @param sendToBackend Callback that sends a given data to the backend.
     */
    constructor(sendToBackend: (data: JSONValue) => void) {
        this.rpc = new SimpleRPC<LanguageServiceSession>(d => sendToBackend(d), t => new LanguageServiceSession(t));
    }

    /**
     * Receives the given data from the backend.
     * @param data Data.
     */
    receiveFromBackend(data: JSONValue) {
        this.rpc.receive(data);
    }

    /**
     * Creates a new language service session.
     * @internal
     */
    createSession(): LanguageServiceSession {
        return this.rpc.createHandler();
    }
}