/**
 * @module @jsonpath-tools/codemirror-lang-jsonpath
 */

import { completionSource } from "./completion-source";
import { documentHighlights } from "./document-highlights";
import { format, formatKeymap } from "./format";
import { jsonpath, jsonpathLanguage } from "./jsonpath";
import { DefaultLanguageServices } from "./language-service/default-language-services";
import { LanguageService } from "./language-service/language-service";
import { LanguageServiceBackend } from "./language-service/language-service-backend";
import { lintSource, lintSourceNeedsRefresh } from "./lint-source";
import { parser } from "./parser";
import { signatureHelp } from "./signature-help";
import { tooltip } from "./tooltip";

export {
    jsonpath,
    jsonpathLanguage,
    parser,
    completionSource,
    lintSource,
    lintSourceNeedsRefresh,
    tooltip,
    signatureHelp,
    documentHighlights,
    format,
    formatKeymap,
    LanguageService,
    LanguageServiceBackend,
    DefaultLanguageServices
};