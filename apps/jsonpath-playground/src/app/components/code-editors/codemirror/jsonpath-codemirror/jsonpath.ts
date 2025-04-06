import { Diagnostics } from "@/jsonpath-tools/diagnostics";
import { Language, LanguageSupport } from "@codemirror/language";
import { linter } from "@codemirror/lint";
import { completionSource } from "./completion-source";
import { documentHighlights } from "./document-highlights";
import { formatKeymap } from "./format";
import { lintSource, lintSourceNeedsRefresh } from "./lint-source";
import { languageFacet, parser } from "./parser";
import { signatureHelp } from "./signature-help";
import { jsonPathConfigFacet, core } from "./core";
import { tooltip } from "./tooltip";
import { LanguageService } from "./language-service/language-service";
import { DefaultLanguageServices } from "./language-service/default-language-services";

/**
 * CodeMirror JSONPath ([RFC 9535](https://datatracker.ietf.org/doc/rfc9535/)) language support.
 * @param config Configuration.
 */
export function jsonpath(config: {
    languageService?: LanguageService,
    onDiagnosticsCreated?: (diagnostics: readonly Diagnostics[]) => void
}): LanguageSupport {
    return new LanguageSupport(jsonpathLanguage, [
        jsonPathConfigFacet.of({
            languageService: config.languageService ?? DefaultLanguageServices.worker
        }),
        core(),
        linter(
            lintSource({
                onDiagnosticsCreated: config.onDiagnosticsCreated
            }),
            {
                needsRefresh: lintSourceNeedsRefresh
            }
        ),
        languageFacet.of({
            autocomplete: completionSource()
        }),
        tooltip(),
        signatureHelp(),
        documentHighlights(),
        formatKeymap
    ]);
}

/**
 * CodeMirror JSONPath language.
 */
export const jsonpathLanguage = new Language(languageFacet, parser);