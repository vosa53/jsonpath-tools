import { Diagnostics } from "@/jsonpath-tools/diagnostics";
import { Language, LanguageSupport } from "@codemirror/language";
import { linter } from "@codemirror/lint";
import { completionSource } from "./completion-source";
import { documentHighlights } from "./document-highlights";
import { jsonPathFormatKeyMap } from "./format";
import { lintSource, lintSourceNeedsRefresh } from "./lint-source";
import { languageFacet, parser } from "./parser";
import { signatureHelp } from "./signature-help";
import { jsonPathConfigFacet, state } from "./state";
import { tooltip } from "./tooltip";
import { LanguageService } from "./language-service/language-service";
import { LanguageServices } from "./language-service/language-services";


export const jsonpathLanguage = new Language(languageFacet, parser);

export function jsonpath(options: {
    languageService?: LanguageService,
    onDiagnosticsCreated?: (diagnostics: readonly Diagnostics[]) => void
}): LanguageSupport {
    return new LanguageSupport(jsonpathLanguage, [
        jsonPathConfigFacet.of({
            languageService: options.languageService ?? LanguageServices.workerLanguageService
        }),
        state(),
        linter(
            lintSource({
                onDiagnosticsCreated: options.onDiagnosticsCreated
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
        jsonPathFormatKeyMap
    ]);
}