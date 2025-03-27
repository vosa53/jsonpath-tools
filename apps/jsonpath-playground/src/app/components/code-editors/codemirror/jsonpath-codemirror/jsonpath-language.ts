import { Diagnostics } from "@/jsonpath-tools/diagnostics";
import { Language, LanguageSupport } from "@codemirror/language";
import { linter } from "@codemirror/lint";
import { jsonPathCompletionSource } from "./jsonpath-completion-source";
import { jsonPathDocumentHighlights } from "./jsonpath-document-highlights";
import { jsonPathFormatKeyMap } from "./jsonpath-format";
import { jsonPathLintSource, jsonPathLintSourceNeedsRefresh } from "./jsonpath-lint-source";
import { jsonPathLanguageFacet, jsonPathParser } from "./jsonpath-parser";
import { jsonPathSignatureHelp } from "./jsonpath-signature-help";
import { jsonPathConfigFacet, jsonPathState } from "./jsonpath-state";
import { jsonPathTooltip } from "./jsonpath-tooltip";
import { LanguageService } from "./worker/language-service";
import { LanguageServices } from "./worker/language-services";


export const jsonPathLanguage = new Language(jsonPathLanguageFacet, jsonPathParser);

export function jsonPath(options: {
    languageService?: LanguageService,
    onDiagnosticsCreated?: (diagnostics: readonly Diagnostics[]) => void
}): LanguageSupport {
    return new LanguageSupport(jsonPathLanguage, [
        jsonPathConfigFacet.of({
            languageService: options.languageService ?? LanguageServices.workerLanguageService
        }),
        jsonPathState(),
        linter(
            jsonPathLintSource({
                onDiagnosticsCreated: options.onDiagnosticsCreated
            }),
            {
                needsRefresh: jsonPathLintSourceNeedsRefresh
            }
        ),
        jsonPathLanguageFacet.of({
            autocomplete: jsonPathCompletionSource()
        }),
        jsonPathTooltip(),
        jsonPathSignatureHelp(),
        jsonPathDocumentHighlights(),
        jsonPathFormatKeyMap
    ]);
}