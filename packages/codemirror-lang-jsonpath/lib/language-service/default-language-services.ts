import { JSONValue } from "@jsonpath-tools/jsonpath";
import { LanguageService } from "./language-service";
import { LanguageServiceBackend } from "./language-service-backend";
// @ts-ignore
import LanguageServiceWorker from "./language-service-worker?worker&inline";

/**
 * Default language services.
 */
export class DefaultLanguageServices {
    private static _local: LanguageService | undefined;
    private static _worker: LanguageService | undefined;

    /**
     * A language service working directly on the UI thread. 
     * 
     * **Not recommended, because it can cause UI freezes.** The recommended is {@link worker}.
     */
    static get local(): LanguageService {
        this._local ??= this.createLocalLanguageService();
        return this._local;
    }

    /**
     * A language service working in a web worker.
     * 
     * Recommended over {@link local}.
     */
    static get worker(): LanguageService {
        this._worker ??= this.createWorkerLanguageService();
        return this._worker;
    }

    private static createLocalLanguageService(): LanguageService {
        // TODO: Queue.
        // eslint-disable-next-line prefer-const
        let backend: LanguageServiceBackend;
        const sendToBackend = (data: JSONValue) => backend!.receiveFromFrontend(data);
        const languageService = new LanguageService(sendToBackend);
        backend = new LanguageServiceBackend(data => languageService.receiveFromBackend(data));
        return languageService;
    }
    
    private static createWorkerLanguageService(): LanguageService {
        const worker = new LanguageServiceWorker() as Worker;
        // The following is better, because it generates the worker in a sepearate file. 
        // But problem is that it is difficult for library consumers to properly bundle it.
        //const worker = new Worker(new URL("./language-service-worker.ts", import.meta.url), { type: "module" });
        const languageService = new LanguageService(data => worker.postMessage(data));
        worker.addEventListener("message", e => languageService.receiveFromBackend(e.data));
        return languageService;
    }

    private constructor() { }
}
