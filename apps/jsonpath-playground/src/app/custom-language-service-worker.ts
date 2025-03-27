import { defaultQueryOptions, FunctionHandler } from "@/jsonpath-tools/options";
import { LanguageServiceBackend } from "./components/code-editors/codemirror/jsonpath-codemirror/worker/language-service-backend";
import { CustomLanguageServiceFunction, CustomLanguageServiceWorkerMessage } from "./custom-language-service-worker-mesages";
import { LogicalFalse, LogicalTrue, Nothing } from "@/jsonpath-tools/types";
import { NodeList } from "@/jsonpath-tools/node-list";
import { Node } from "@/jsonpath-tools/node";

const customFunctions = new Map<string, FunctionHandler>();

const backend = new LanguageServiceBackend(
    d => postMessage({ type: "languageServiceData", data: d } as CustomLanguageServiceWorkerMessage), 
    resolveFunction
);
addEventListener("message", e => {
    const mesage = e.data as CustomLanguageServiceWorkerMessage;
    if (mesage.type === "languageServiceData")
        backend.receiveFromFrontend(mesage.data);
    else if (mesage.type === "updateCustomFunctions") {
        customFunctions.clear();
        for (const customFunction of mesage.customFunctions) {
            const compiledCustomFunction = compileCustomFunction(customFunction);
            customFunctions.set(customFunction.name, compiledCustomFunction);
        }        
    }
});

function resolveFunction(functionName: string): FunctionHandler {
    if (Object.hasOwn(defaultQueryOptions.functions, functionName)) 
        return defaultQueryOptions.functions[functionName].handler;

    const customFunctionHandler = customFunctions.get(functionName);
    if (customFunctionHandler !== undefined) 
        return customFunctionHandler;

    throw new Error(`Function '${functionName}' not found.`);
}

function compileCustomFunction(customFunction: CustomLanguageServiceFunction): FunctionHandler {
    try {
        const compiledCustomFunction = new Function("jp", "context", ...customFunction.parameterNames, customFunction.code) as FunctionHandler;
        return createJSONPathFunctionHandler(compiledCustomFunction, customFunction.name);
    }
    catch (e) {
        return (context) => {
            context.reportWarning(`Compilation of custom function '${customFunction.name}' failed: ${e}`);
            return Nothing;
        };
    }
}

function createJSONPathFunctionHandler(customFunction: Function, functionName: string): FunctionHandler {
    return (context, ...args) => {
        try {
            const result = customFunction(JSONPATH_LIBRARY, context, ...args);
            return result;
        }
        catch(e) {
            context.reportWarning(`Error while executing custom function '${functionName}': ${e}`);
            return Nothing;
        }
    }
}

// TODO: Probably pass the whole library to custom functions (import *).
const JSONPATH_LIBRARY = {
    Nothing,
    LogicalFalse,
    LogicalTrue,
    NodeList,
    Node
};