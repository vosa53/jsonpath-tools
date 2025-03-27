import { Diagnostics } from "@/jsonpath-tools/diagnostics";
import { Language, LanguageSupport } from "@codemirror/language";
import { linter } from "@codemirror/lint";
import { jsonPathCompletionSource } from "./completion-source";
import { jsonPathDocumentHighlights } from "./document-highlights";
import { jsonPathFormatKeyMap } from "./format";
import { jsonPathLintSource, jsonPathLintSourceNeedsRefresh } from "./lint-source";
import { jsonPathLanguageFacet, jsonPathParser } from "./parser";
import { jsonPathSignatureHelp } from "./signature-help";
import { jsonPathConfigFacet, jsonPathState } from "./state";
import { jsonPathTooltip } from "./tooltip";
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