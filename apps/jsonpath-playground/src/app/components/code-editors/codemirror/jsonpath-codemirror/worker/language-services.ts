import { JSONValue } from "@/jsonpath-tools/json/json-types";
import { LanguageService } from "./language-service";
import { LanguageServiceBackend } from "./language-service-backend";

export class LanguageServices {
    private static _localLanguageService: LanguageService | undefined;
    private static _workerLanguageService: LanguageService | undefined;

    static get localLanguageService(): LanguageService {
        this._localLanguageService ??= this.createLocalLanguageService();
        return this._localLanguageService;
    }

    static get workerLanguageService(): LanguageService {
        this._workerLanguageService ??= this.createWorkerLanguageService();
        return this._workerLanguageService;
    }

    private static createLocalLanguageService(): LanguageService {
        // TODO: Queue.
        let backend: LanguageServiceBackend;
        const sendToBackend = (data: JSONValue) => backend!.receiveFromFrontend(data);
        const languageService = new LanguageService(sendToBackend);
        backend = new LanguageServiceBackend(data => languageService.receiveFromBackend(data));
        return languageService;
    }
    
    private static createWorkerLanguageService(): LanguageService {
        const worker = new Worker(new URL("./language-service-worker.ts", import.meta.url), { type: "module" });
        const languageService = new LanguageService(data => worker.postMessage(data));
        worker.addEventListener("message", e => languageService.receiveFromBackend(e.data));
        return languageService;
    }
}

