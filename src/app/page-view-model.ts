import { JSONPathDiagnostics } from "@/jsonpath-tools/diagnostics";
import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { JSONPathNormalizedPath, remove, replace, toJSONPointer, toNormalizedPath } from "@/jsonpath-tools/transformations";
import { JSONPathJSONValue, JSONPathNothing } from "@/jsonpath-tools/types";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { OperationCancelledError } from "./components/code-editors/codemirror/jsonpath-codemirror/cancellation-token";
import { CustomFunction } from "./models/custom-function";
import { Operation, OperationType } from "./models/operation";
import { PathType } from "./models/path-type";
import { JSONPathParser } from "@/jsonpath-tools/syntax-analysis/parser";
import { Settings } from "./models/settings";
import { logPerformance } from "@/jsonpath-tools/utils";
import { defaultJSONPathOptions, JSONPathOptions } from "@/jsonpath-tools/options";
import { LanguageService } from "./components/code-editors/codemirror/jsonpath-codemirror/worker/language-service";
import { CustomLanguageServiceFunction, CustomLanguageServiceWorkerMessage } from "./custom-language-service-worker-mesages";
import { TextRange } from "@/jsonpath-tools/text-range";
import { JSONPathSyntaxTree } from "@/jsonpath-tools/query/syntax-tree";

interface State {
    customFunctions: readonly CustomFunction[];
    settings: Settings;
    queryText: string;
    queryArgumentText: string;
    operation: Operation;
    pathType: PathType;
}

export function usePageViewModel() {
    const [customFunctions, setCustomFunctions] = useState<readonly CustomFunction[]>([]);
    const [settings, setSettings] = useState<Settings>(testSettings);
    const [queryText, setQueryText] = useState<string>(testQueryText);
    const [queryArgumentText, setQueryArgumentText] = useState<string>(testJson);
    const [queryArgumentSchemaText, setQueryArgumentSchemaText] = useState<string>(testJsonSchema);
    const [operation, setOperation] = useState<Operation>(testOperation);
    const [pathType, setPathType] = useState<PathType>(PathType.normalizedPath);
    const [query, setQuery] = useState<JSONPath>(testQuery);
    const queryArgument = useMemo<JSONPathJSONValue>(() => {
        try {
            return logPerformance("Parse query argument", () => JSON.parse(queryArgumentText));
        }
        catch {
            return null;
        }
    }, [queryArgumentText]);
    const queryArgumentSchema = useMemo<JSONPathJSONValue | undefined>(() => {
        try {
            return logPerformance("Parse query argument schema", () => JSON.parse(queryArgumentSchemaText));
        }
        catch {
            return undefined;
        }
    }, [queryArgumentSchemaText]);
    const options = useMemo<JSONPathOptions>(() => {
        return {
            ...defaultJSONPathOptions,
            functions: {
                ...defaultJSONPathOptions.functions,
                ...Object.fromEntries(customFunctions.map(f => [f.name, { description: f.description, parameters: f.parameters.map(p => ({ name: p.name, description: p.description, type: p.type })), returnType: f.returnType, handler: () => JSONPathNothing }]))
            }
        };
    }, [customFunctions]);
    const [result, setResult] = useState<readonly JSONPathJSONValue[]>([]);
    const [resultPaths, setResultPaths] = useState<readonly JSONPathNormalizedPath[]>([]);
    const resultText = useMemo(() => {
        const operationResult = logPerformance("Execute operation on result", () => {
            return executeOperation(operation, queryArgument, result as JSONPathJSONValue[], resultPaths);
        });
        if (operationResult === undefined) return "";
        else return logPerformance("Stringify result", () => JSON.stringify(operationResult, undefined, 4));
    }, [result, operation]);
    const resultPathsText = useMemo(() => {
        const resultPathsTransformed = logPerformance("Transform result paths", () => {
            return pathType === PathType.normalizedPath
                ? resultPaths.map(p => toNormalizedPath(p))
                : resultPaths.map(p => toJSONPointer(p));
        });
        return logPerformance("Stringify result paths", () => JSON.stringify(resultPathsTransformed, undefined, 4));
    }, [resultPaths, pathType]);
    const [currentResultPathIndex, setCurrentResultPathIndex] = useState<number>(0);
    const [diagnostics, setDiagnostics] = useState<readonly JSONPathDiagnostics[]>([]);
    const [highlightedRange, setHighlightedRange] = useState<TextRange | null>(null);
    const getResultRef = useRef<() => Promise<{ nodes: readonly JSONPathJSONValue[], paths: readonly (string | number)[][] }>>(null);
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

    const onQueryArgumentSchemaTextChanged = useCallback((queryArgumentSchemaText: string) => {
        setQueryArgumentSchemaText(queryArgumentSchemaText);
    }, []);

    const onOperationChanged = useCallback((operation: Operation) => {
        setOperation(operation);
    }, []);

    const onPathTypeChanged = useCallback((pathType: PathType) => {
        setPathType(pathType);
    }, []);

    const onQueryParsed = useCallback((query: JSONPath) => {
        setQuery(query);
    }, []);

    const onCurrentResultPathIndexChanged = useCallback((currentResultPathIndex: number) => {
        setCurrentResultPathIndex(currentResultPathIndex);
    }, []);

    const onDiagnosticsPublished = useCallback((diagnostics: readonly JSONPathDiagnostics[]) => {
        setDiagnostics(diagnostics);
    }, []);

    const onGetResultAvailable = useCallback((getResult: () => Promise<{ nodes: readonly JSONPathJSONValue[], paths: readonly (string | number)[][] }>) => {
        getResultRef.current = getResult;
    }, []);

    const onSelectedDiagnosticsChanged = useCallback((diagnostics: JSONPathDiagnostics | null) => {
        setHighlightedRange(diagnostics === null ? null : diagnostics.textRange);
    }, []);

    const onSelectedNodeChanged = useCallback((tree: JSONPathSyntaxTree | null) => {
        setHighlightedRange(tree === null ? null : tree.textRangeWithoutSkipped);
    }, []);

    useEffect(() => {
        /*if (getResultRef.current === null) return;
        if (resultTimeoutRef.current !== null) window.clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = window.setTimeout(async () => {
            try {
                const result = await getResultRef.current!();
                setResultPaths(result.paths);
                setResult(result.nodes);
                setCurrentResultPathIndex(0);
            }
            catch (error) {
                if (!(error instanceof OperationCancelledError)) throw error;
            }
        }, 500);*/
    }, [queryText, queryArgument, getResultRef.current]);

    return {
        onCustomFunctionsChanged,
        onSettingsChanged,
        onQueryTextChanged,
        onQueryArgumentTextChanged,
        onQueryArgumentSchemaTextChanged,
        onOperationChanged,
        onPathTypeChanged,
        onQueryParsed,
        onCurrentResultPathIndexChanged,
        onDiagnosticsPublished,
        onGetResultAvailable,
        onSelectedDiagnosticsChanged,
        onSelectedNodeChanged,
        customFunctions,
        settings,
        queryText,
        queryArgumentText,
        queryArgumentSchemaText,
        operation,
        pathType,
        query,
        queryArgument,
        queryArgumentSchema,
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

export const testJson = `{
    "store": {
        "books": [
            {
                "category": "reference",
                "author": "Nigel Rees",
                "title": "Sayings of the Century",
                "price": 8.95
            },
            {
                "category": "fiction",
                "author": "Evelyn Waugh",
                "title": "Sword of Honour",
                "price": 12.99
            },
            {
                "category": "fiction",
                "author": "Herman Melville",
                "title": "Moby Dick",
                "isbn": "0-553-21311-3",
                "price": 8.99
            },
            {
                "category": "fiction",
                "author": "J. R. R. Tolkien",
                "title": "The Lord of the Rings",
                "isbn": "0-395-19395-8",
                "price": 22.99
            }
        ],
        "bicycle": {
            "color": "red",
            "price": 399
        }
    }
}`;

export const testJsonSchema = `{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Store Schema",
    "description": "Schema for a store containing books and a bicycle.",
    "type": "object",
    "properties": {
        "store": {
            "title": "Store",
            "description": "The main store object containing books and a bicycle.",
            "type": "object",
            "properties": {
                "books": {
                    "title": "Books",
                    "description": "A collection of books available in the store.",
                    "type": "array",
                    "items": {
                        "title": "Book",
                        "description": "Details of a single book.",
                        "type": "object",
                        "properties": {
                            "category": { "title": "Category", "description": "The category of the book.", "type": "string" },
                            "author": { "title": "Author", "description": "The author of the book.", "type": "string" },
                            "title": { "title": "Title", "description": "The title of the book.", "type": "string" },
                            "isbn": { "title": "ISBN", "description": "The ISBN identifier of the book.", "type": "string" },
                            "price": { "title": "Price", "description": "The price of the book.", "type": "number" }
                        },
                        "required": ["category", "author", "title", "price"]
                    }
                },
                "bicycle": {
                    "title": "Bicycle",
                    "description": "Details of a bicycle available in the store.",
                    "type": "object",
                    "properties": {
                        "color": { "title": "Color", "description": "The color of the bicycle.", "type": "string" },
                        "price": { "title": "Price", "description": "The price of the bicycle.", "type": "number" }
                    },
                    "required": ["color", "price"]
                }
            },
            "required": ["books", "bicycle"]
        }
    },
    "required": ["store"]
}`;

const testSettings: Settings = {
    autoRun: true,
    autoSave: true
};
const testOperation: Operation = {
    type: OperationType.select,
    replacement: {
        replacement: {},
        replacementText: "{}"
    }
};
const testQueryText = "$.books[?@.author == \"George Orwell\" && count(true, 25) > 42].title";
const testQuery = new JSONPathParser().parse(testQueryText);

function executeOperation(operation: Operation, queryArgument: JSONPathJSONValue, result: JSONPathJSONValue[], resultPaths: readonly JSONPathNormalizedPath[]): JSONPathJSONValue | undefined {
    if (operation.type === OperationType.select)
        return result;
    else if (operation.type === OperationType.replace)
        return replace(queryArgument, resultPaths, operation.replacement.replacement);
    else if (operation.type === OperationType.delete)
        return remove(queryArgument, resultPaths);
    else
        throw new Error(`Unknown operation type: ${operation.type}.`);
}

const worker = new Worker(new URL("./custom-language-service-worker.ts", import.meta.url));
const languageService = new LanguageService(data => worker.postMessage({ type: "languageServiceData", data } as CustomLanguageServiceWorkerMessage));
worker.addEventListener("message", e => {
    const message = e.data as CustomLanguageServiceWorkerMessage;
    if (message.type === "languageServiceData")
        languageService.receiveFromBackend(message.data);
    else
        throw new Error(`Unexpected message type.`);
});