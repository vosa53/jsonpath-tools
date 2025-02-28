import { Language, LanguageSupport } from "@codemirror/language";
import { linter } from "@codemirror/lint";
import { jsonPathLanguageFacet, jsonPathParser } from "./jsonpath-parser";
import { jsonPathConfigFacet, jsonPathPlugin } from "./jsonpath-state";
import { jsonPathTooltip } from "./jsonpath-tooltip";
import { jsonPathLintSource, jsonPathLintSourceNeedsRefresh } from "./jsonpath-lint-source";
import { JSONPathDiagnostics } from "@/jsonpath-tools/diagnostics";
import { jsonPathCompletionSource } from "./jsonpath-completion-source";
import { LanguageServices } from "./worker/language-services";
import { LanguageService } from "./worker/language-service";


export const jsonPathLanguage = new Language(jsonPathLanguageFacet, jsonPathParser);

export function jsonPath(options: {
    languageService?: LanguageService,
    onDiagnosticsCreated?: (diagnostics: readonly JSONPathDiagnostics[]) => void 
}): LanguageSupport {
    return new LanguageSupport(jsonPathLanguage, [
        jsonPathConfigFacet.of({
            languageService: options.languageService ?? LanguageServices.workerLanguageService
        }),
        jsonPathPlugin,
        linter(jsonPathLintSource({ onDiagnosticsCreated: options.onDiagnosticsCreated }), {
            needsRefresh: jsonPathLintSourceNeedsRefresh
        }),
        jsonPathLanguageFacet.of({
            autocomplete: jsonPathCompletionSource
        }),
        jsonPathTooltip
    ]);
}