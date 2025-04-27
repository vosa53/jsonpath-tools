import { Diagnostics } from "@jsonpath-tools/jsonpath";
import { defaultHighlightStyle, Language, LanguageSupport } from "@codemirror/language";
import { linter } from "@codemirror/lint";
import { completionSource } from "./completion-source";
import { documentHighlights } from "./document-highlights";
import { formatKeymap } from "./format";
import { lintSource, lintSourceNeedsRefresh } from "./lint-source";
import { languageFacet, parser } from "./parser";
import { signatureHelp, signatureHelpKeymap } from "./signature-help";
import { languageServiceFacet, core, markdownRendererFacet, diagnosticsCreatedFacet } from "./core";
import { tooltip } from "./tooltip";
import { LanguageService } from "./language-service/language-service";
import { DefaultLanguageServices } from "./language-service/default-language-services";
import { Highlighter } from "@lezer/highlight";
import { MarkdownRenderer } from "./markdown-renderer";

/**
 * CodeMirror JSONPath ([RFC 9535](https://datatracker.ietf.org/doc/rfc9535/)) language support.
 * @param config Configuration.
 */
export function jsonpath(config: {
    languageService?: LanguageService,
    codeHighlighter?: Highlighter,
    onDiagnosticsCreated?: (diagnostics: readonly Diagnostics[]) => void
}): LanguageSupport {
    return new LanguageSupport(jsonpathLanguage, [
        languageServiceFacet.of(config.languageService ?? DefaultLanguageServices.worker),
        markdownRendererFacet.of(new MarkdownRenderer(config.codeHighlighter ?? defaultHighlightStyle)),
        diagnosticsCreatedFacet.of(config.onDiagnosticsCreated ?? (() => {})),
        core(),
        linter(
            lintSource(),
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
        signatureHelpKeymap,
        formatKeymap
    ]);
}

/**
 * CodeMirror JSONPath language.
 */
export const jsonpathLanguage = new Language(languageFacet, parser);