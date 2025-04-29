/**
 * JSONPath (RFC 9535) language support for CodeMirror editor.
 * @module @jsonpath-tools/codemirror-lang-jsonpath
 */

import { OperationCancelledError } from "./cancellation-token";
import { completionSource } from "./completion-source";
import { getResult, updateQueryOptionsEffect, updateQueryArgumentEffect, updateQueryArgumentTypeEffect } from "./core";
import { documentHighlights } from "./document-highlights";
import { format, formatKeymap } from "./format";
import { jsonpath, jsonpathLanguage } from "./jsonpath";
import { DefaultLanguageServices } from "./language-service/default-language-services";
import { LanguageService } from "./language-service/language-service";
import { LanguageServiceBackend } from "./language-service/language-service-backend";
import { lintSource, lintSourceNeedsRefresh } from "./lint-source";
import { getQueryForTree, parser } from "./parser";
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
    DefaultLanguageServices,
    OperationCancelledError,
    getQueryForTree,
    getResult,
    updateQueryOptionsEffect,
    updateQueryArgumentEffect,
    updateQueryArgumentTypeEffect
};
