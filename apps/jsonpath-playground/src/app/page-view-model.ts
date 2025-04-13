import { Diagnostics } from "@/jsonpath-tools/diagnostics";
import { Query } from "@/jsonpath-tools/query/query";
import { removeAtPaths, replaceAtPaths } from "@/jsonpath-tools/transformations";
import { serializedNormalizedPath } from "@/jsonpath-tools/serialization/serialization";
import { NormalizedPath } from "@/jsonpath-tools/normalized-path";
import { Nothing } from "@/jsonpath-tools/values/types";
import { JSONValue } from "@/jsonpath-tools/json/json-types";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { OperationCancelledError } from "./components/code-editors/codemirror/jsonpath-codemirror/cancellation-token";
import { CustomFunction } from "./models/custom-function";
import { Operation, OperationReplacementType, OperationType } from "./models/operation";
import { PathType } from "./models/path-type";
import { Parser } from "@/jsonpath-tools/syntax-analysis/parser";
import { Settings } from "./models/settings";
import { logPerformance } from "@/jsonpath-tools/helpers/utils";
import { defaultQueryOptions, QueryOptions } from "@/jsonpath-tools/options";
import { LanguageService } from "./components/code-editors/codemirror/jsonpath-codemirror/language-service/language-service";
import { CustomLanguageServiceFunction, CustomLanguageServiceWorkerMessage } from "./services/language-service/custom-language-service-worker-mesages";
import { TextRange } from "@/jsonpath-tools/text/text-range";
import { SyntaxTree } from "@/jsonpath-tools/query/syntax-tree";
import { jsonSchemaToType } from "@/jsonpath-tools/data-types/json-schema-data-type-converter";
import { AnyDataType, DataType } from "@/jsonpath-tools/data-types/data-types";
import { DataTypeRaw, DataTypeRawFormat } from "./models/data-type-raw";
import { jsonTypeDefinitionToType } from "@/jsonpath-tools/data-types/json-type-definition-data-type-converter";
import { isValidJSONSchema, isValidJSONTypeDefinition } from "./services/json-schema";
import { JSONPatch, applyJSONPatch } from "./services/json-patch";
import { examples } from "./models/examples";

interface State {
    customFunctions: readonly CustomFunction[];
    settings: Settings;
    queryText: string;
    queryArgumentText: string;
    operation: Operation;
    pathType: PathType;
}

/**
 * ViewModel of the application main page.
 */
export function usePageViewModel() {
    const [customFunctions, setCustomFunctions] = useState<readonly CustomFunction[]>([]);
    const [settings, setSettings] = useState<Settings>(testSettings);
    const [queryText, setQueryText] = useState<string>(testQueryText);
    const [queryArgumentText, setQueryArgumentText] = useState<string>(examples[0].jsonText);
    const [queryArgumentTypeRaw, setQueryArgumentTypeRaw] = useState<DataTypeRaw>(testQueryArgumentTypeRaw);
    const [operation, setOperation] = useState<Operation>(testOperation);
    const operationReplacementJSONValue = useMemo<JSONValue | undefined>(() => {
        try {
            return JSON.parse(operation.replacement.jsonValueText);
        }
        catch {
            return undefined;
        }
    }, [operation.replacement.jsonValueText]);
    const operationReplacementJSONPatch = useMemo<JSONPatch | undefined>(() => {
        try {
            return JSON.parse(operation.replacement.jsonPatchText);
        }
        catch {
            return undefined;
        }
    }, [operation.replacement.jsonPatchText]);
    const [pathType, setPathType] = useState<PathType>(PathType.normalizedPath);
    const [query, setQuery] = useState<Query>(testQuery);
    const [queryArgument, isQueryArgumentValid] = useMemo<[JSONValue | undefined, boolean]>(() => {
        try {
            return [logPerformance("Parse query argument", () => JSON.parse(queryArgumentText)), true];
        }
        catch {
            return [undefined, false];
        }
    }, [queryArgumentText]);
    const [queryArgumentType, isQueryArgumentTypeValid] = useMemo<[DataType, boolean]>(() => {
        let json: JSONValue;
        const jsonText = queryArgumentTypeRaw.format === DataTypeRawFormat.jsonSchema
            ? queryArgumentTypeRaw.jsonSchemaText
            : queryArgumentTypeRaw.jsonTypeDefinitionText;
        try {
            json = logPerformance("Parse query argument type raw", () => JSON.parse(jsonText));
        }
        catch {
            return [AnyDataType.create(), false];
        }

        if (queryArgumentTypeRaw.format === DataTypeRawFormat.jsonSchema) {
            if (!isValidJSONSchema(json)) return [AnyDataType.create(), false];
            else return [jsonSchemaToType({ schema: json }), true];
        }
        else {
            if (!isValidJSONTypeDefinition(json)) return [AnyDataType.create(), false];
            else return [jsonTypeDefinitionToType(json), true];
        }
    }, [queryArgumentTypeRaw]);
    const options = useMemo<QueryOptions>(() => {
        return {
            ...defaultQueryOptions,
            functions: {
                ...defaultQueryOptions.functions,
                ...Object.fromEntries(customFunctions.map(f => [f.name, { description: f.description, parameters: f.parameters.map(p => ({ name: p.name, description: p.description, type: p.type, dataType: AnyDataType.create() })), returnType: f.returnType, returnDataType: AnyDataType.create(), handler: () => Nothing }]))
            }
        };
    }, [customFunctions]);
    const [result, setResult] = useState<readonly JSONValue[]>([]);
    const [resultPaths, setResultPaths] = useState<readonly NormalizedPath[]>([]);
    const resultText = useMemo(() => {
        if (queryArgument === undefined) return "";
        const operationResult = logPerformance("Execute operation on result", () => {
            return executeOperation(operation, queryArgument, result as JSONValue[], resultPaths, operationReplacementJSONValue, operationReplacementJSONPatch);
        });
        if (operationResult === undefined) return "";
        else return logPerformance("Stringify result", () => JSON.stringify(operationResult, undefined, 4));
    }, [result, operation, operationReplacementJSONValue, operationReplacementJSONPatch, queryArgument, resultPaths]);
    const resultPathsText = useMemo(() => {
        const resultPathsTransformed = logPerformance("Transform result paths", () => {
            return pathType === PathType.normalizedPath
                ? resultPaths.map(p => serializedNormalizedPath(p))
                : resultPaths.map(p => toJSONPointer(p));
        });
        return logPerformance("Stringify result paths", () => JSON.stringify(resultPathsTransformed, undefined, 4));
    }, [resultPaths, pathType]);
    const [currentResultPathIndex, setCurrentResultPathIndex] = useState<number>(0);
    const [diagnostics, setDiagnostics] = useState<readonly Diagnostics[]>([]);
    const [highlightedRange, setHighlightedRange] = useState<TextRange | null>(null);
    const getResultRef = useRef<() => Promise<{ nodes: readonly JSONValue[], paths: readonly NormalizedPath[] }>>(null);
    const resultTimeoutRef = useRef<number | null>(null);

    const onCustomFunctionsChanged = useCallback((customFunctions: readonly CustomFunction[]) => {
        const customFunctionsForWorker = customFunctions.map(f => ({
            name: f.name,
            parameterNames: f.parameters.map(p => p.name),
            code: f.code
        } as CustomLanguageServiceFunction));
        worker.postMessage({ type: "updateCustomFunctions", customFunctions: customFunctionsForWorker } as CustomLanguageServiceWorkerMessage);
        setCustomFunctions(customFunctions);
    }, []);

    const onSettingsChanged = useCallback((settings: Settings) => {
        setSettings(settings);
    }, []);

    const onQueryTextChanged = useCallback((queryText: string) => {
        setQueryText(queryText);
    }, []);

    const onQueryArgumentTextChanged = useCallback((queryArgumentText: string) => {
        setQueryArgumentText(queryArgumentText);
    }, []);

    const onQueryArgumentTypeRawChanged = useCallback((queryArgumentTypeRaw: DataTypeRaw) => {
        setQueryArgumentTypeRaw(queryArgumentTypeRaw);
    }, []);

    const onOperationChanged = useCallback((operation: Operation) => {
        setOperation(operation);
    }, []);

    const onPathTypeChanged = useCallback((pathType: PathType) => {
        setPathType(pathType);
    }, []);

    const onQueryParsed = useCallback((query: Query) => {
        setQuery(query);
    }, []);

    const onCurrentResultPathIndexChanged = useCallback((currentResultPathIndex: number) => {
        setCurrentResultPathIndex(currentResultPathIndex);
    }, []);

    const onDiagnosticsPublished = useCallback((diagnostics: readonly Diagnostics[]) => {
        setDiagnostics(diagnostics);
    }, []);

    const onGetResultAvailable = useCallback((getResult: () => Promise<{ nodes: readonly JSONValue[], paths: readonly NormalizedPath[] }>) => {
        getResultRef.current = getResult;
    }, []);

    const onSelectedDiagnosticsChanged = useCallback((diagnostics: Diagnostics | null) => {
        setHighlightedRange(diagnostics === null ? null : diagnostics.textRange);
    }, []);

    const onSelectedNodeChanged = useCallback((tree: SyntaxTree | null) => {
        setHighlightedRange(tree === null ? null : tree.textRangeWithoutSkipped);
    }, []);

    const onRun = useCallback(() => {
        if (!settings.autoRun)
            run();
    }, [settings]);

    useEffect(() => {
        if (getResultRef.current === null || !settings.autoRun) return;
        if (resultTimeoutRef.current !== null) window.clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = window.setTimeout(async () => {
            await run();
        }, 500);
    }, [queryText, queryArgument, settings.autoRun]);

    async function run() {
        try {
            const result = await getResultRef.current!();
            setResultPaths(result.paths);
            setResult(result.nodes);
            setCurrentResultPathIndex(0);
        }
        catch (error) {
            if (!(error instanceof OperationCancelledError)) throw error;
        }
    }

    return {
        onCustomFunctionsChanged,
        onSettingsChanged,
        onQueryTextChanged,
        onQueryArgumentTextChanged,
        onQueryArgumentTypeRawChanged,
        onOperationChanged,
        onPathTypeChanged,
        onQueryParsed,
        onCurrentResultPathIndexChanged,
        onDiagnosticsPublished,
        onGetResultAvailable,
        onSelectedDiagnosticsChanged,
        onSelectedNodeChanged,
        onRun,
        customFunctions,
        settings,
        queryText,
        queryArgumentText,
        queryArgumentTypeRaw,
        operation,
        pathType,
        query,
        queryArgument,
        queryArgumentType,
        isQueryArgumentValid,
        isQueryArgumentTypeValid,
        options,
        resultPaths,
        resultText,
        resultPathsText,
        currentResultPathIndex,
        diagnostics,
        highlightedRange,
        languageService
    };
}

const testQueryArgumentTypeRaw: DataTypeRaw = {
    format: DataTypeRawFormat.jsonSchema,
    jsonSchemaText: examples[0].jsonSchemaText,
    jsonTypeDefinitionText: examples[0].jsonTypeDefinitionText
};

const testSettings: Settings = {
    autoRun: true,
    autoSave: true
};
const testOperation: Operation = {
    type: OperationType.select,
    replacement: {
        type: OperationReplacementType.jsonValue,
        jsonValueText: "{}",
        jsonPatchText: "[]"
    }
};
const testQueryText = `$..inventory[?@.features[?@ == "Bluetooth"] && match(@.make, "[tT].+")]`;
const testQuery = new Parser().parse(testQueryText);

function executeOperation(
    operation: Operation,
    queryArgument: JSONValue,
    result: JSONValue[],
    resultPaths: readonly NormalizedPath[],
    replacementJSONValue: JSONValue | undefined,
    replacementJSONPatch: JSONPatch | undefined
): JSONValue | undefined {
    if (operation.type === OperationType.select)
        return result;
    else if (operation.type === OperationType.replace) {
        const replacer = operation.replacement.type === OperationReplacementType.jsonValue
            ? (v: JSONValue) => replacementJSONValue!
            : (v: JSONValue) => applyJSONPatch(v, replacementJSONPatch!);
        return replaceAtPaths(queryArgument, resultPaths, replacer);
    }
    else if (operation.type === OperationType.delete)
        return removeAtPaths(queryArgument, resultPaths);
    else
        throw new Error(`Unknown operation type: ${operation.type}.`);
}

function toJSONPointer(path: NormalizedPath): string {
    if (path.length === 0) return "/";
    return "/" + path.join("/"); // TODO: Escaping.
}

const worker = new Worker(new URL("./services/language-service/custom-language-service-worker.ts", import.meta.url), { type: "module" });
const languageService = new LanguageService(data => worker.postMessage({ type: "languageServiceData", data } as CustomLanguageServiceWorkerMessage));
worker.addEventListener("message", e => {
    const message = e.data as CustomLanguageServiceWorkerMessage;
    if (message.type === "languageServiceData")
        languageService.receiveFromBackend(message.data);
    else
        throw new Error(`Unexpected message type.`);
});