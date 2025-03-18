import { LanguageServiceBackend } from "./language-service-backend";

const backend = new LanguageServiceBackend(d => postMessage(d));
addEventListener("message", e => backend.receiveFromFrontend(e.data));
