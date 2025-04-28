import { Diagnostics, JSONPath } from "@jsonpath-tools/jsonpath";
import { Query } from "@jsonpath-tools/jsonpath";
import { removeAtPaths, replaceAtPaths } from "@jsonpath-tools/jsonpath";
import { serializedNormalizedPath } from "@jsonpath-tools/jsonpath";
import { NormalizedPath } from "@jsonpath-tools/jsonpath";
import { Nothing } from "@jsonpath-tools/jsonpath";
import { JSONValue } from "@jsonpath-tools/jsonpath";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { OperationCancelledError } from "@jsonpath-tools/codemirror-lang-jsonpath";
import { CustomFunction } from "./models/custom-function";
import { Operation, OperationReplacementType, OperationType } from "./models/operation";
import { PathType } from "./models/path-type";
import { Settings } from "./models/settings";
import { defaultQueryOptions, QueryOptions } from "@jsonpath-tools/jsonpath";
import { LanguageService } from "@jsonpath-tools/codemirror-lang-jsonpath";
import { CustomLanguageServiceFunction, CustomLanguageServiceWorkerMessage } from "./services/language-service/custom-language-service-worker-mesages";
import { TextRange } from "@jsonpath-tools/jsonpath";
import { SyntaxTree } from "@jsonpath-tools/jsonpath";
import { jsonSchemaToType } from "@jsonpath-tools/jsonpath";
import { AnyDataType, DataType } from "@jsonpath-tools/jsonpath";
import { DataTypeRaw, DataTypeRawFormat } from "./models/data-type-raw";
import { jsonTypeDefinitionToType } from "@jsonpath-tools/jsonpath";
import { isValidJSONSchema, isValidJSONTypeDefinition } from "./services/json-schema";
import { JSONPatch, applyJSONPatch } from "./services/json-patch";
import { examples } from "./models/examples";
import { normalizedPathToJSONPointer } from "./services/json-pointer";
import { logPerformance } from "../../../../shared/utils";
import { CustomDiagnostics } from "./models/custom-diagnostics";

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
    const [queryArgument, queryArgumentError] = useMemo<[JSONValue | undefined, string | null]>(() => {
        if (queryArgumentText.trim() === "")
            return [undefined, null];
        try {
            return [logPerformance("Parse query argument", () => JSON.parse(queryArgumentText)), null];
        }
        catch (error: any) {
            return [undefined, error.toString()];
        }
    }, [queryArgumentText]);
    const [queryArgumentType, queryArgumentTypeError] = useMemo<[DataType, string | null]>(() => {
        let json: JSONValue;
        const jsonText = queryArgumentTypeRaw.format === DataTypeRawFormat.jsonSchema
            ? queryArgumentTypeRaw.jsonSchemaText
            : queryArgumentTypeRaw.jsonTypeDefinitionText;
        if (jsonText.trim() === "")
            return [AnyDataType.create(), null];
        try {
            json = logPerformance("Parse query argument type raw", () => JSON.parse(jsonText));
        }
        catch (error: any) {
            return [AnyDataType.create(), error.toString()];
        }

        if (queryArgumentTypeRaw.format === DataTypeRawFormat.jsonSchema) {
            if (!isValidJSONSchema(json)) return [AnyDataType.create(), "Invalid JSON Schema Draft 2020-12"];
            else return [jsonSchemaToType({ schema: json }), null];
        }
        else {
            if (!isValidJSONTypeDefinition(json)) return [AnyDataType.create(), "Invalid JSON Type Definition"];
            else return [jsonTypeDefinitionToType(json), null];
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
                : resultPaths.map(p => normalizedPathToJSONPointer(p));
        });
        return logPerformance("Stringify result paths", () => JSON.stringify(resultPathsTransformed, undefined, 4));
    }, [resultPaths, pathType]);
    const [currentResultPathIndex, setCurrentResultPathIndex] = useState<number>(0);
    const [diagnostics, setDiagnostics] = useState<readonly CustomDiagnostics[]>([]);
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

    const onDiagnosticsPublished = useCallback((diagnostics: readonly CustomDiagnostics[]) => {
        setDiagnostics(diagnostics);
    }, []);

    const onGetResultAvailable = useCallback((getResult: () => Promise<{ nodes: readonly JSONValue[], paths: readonly NormalizedPath[] }>) => {
        getResultRef.current = getResult;
    }, []);

    const onSelectedDiagnosticsChanged = useCallback((diagnostics: CustomDiagnostics | null) => {
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
        queryArgumentError,
        queryArgumentTypeError,
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
const testQuery = JSONPath.parse(testQueryText);

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

const worker = new Worker(new URL("./services/language-service/custom-language-service-worker.ts", import.meta.url), { type: "module" });
const languageService = new LanguageService(data => worker.postMessage({ type: "languageServiceData", data } as CustomLanguageServiceWorkerMessage));
worker.addEventListener("message", e => {
    const message = e.data as CustomLanguageServiceWorkerMessage;
    if (message.type === "languageServiceData")
        languageService.receiveFromBackend(message.data);
    else
        throw new Error(`Unexpected message type.`);
});