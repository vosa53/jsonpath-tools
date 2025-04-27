import { LanguageServiceBackend } from "./language-service-backend";

/**
 * Language service worker script.
 */

const backend = new LanguageServiceBackend(d => postMessage(d));
addEventListener("message", e => backend.receiveFromFrontend(e.data));
