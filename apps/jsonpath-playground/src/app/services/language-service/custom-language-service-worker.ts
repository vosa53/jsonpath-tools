import { defaultQueryOptions } from "@/jsonpath-tools/options";
import { FunctionContext, FunctionHandler } from "@/jsonpath-tools/functions/function";
import { LanguageServiceBackend } from "../../components/code-editors/codemirror/jsonpath-codemirror/language-service/language-service-backend";
import { CustomLanguageServiceFunction, CustomLanguageServiceWorkerMessage } from "./custom-language-service-worker-mesages";
import { FilterValue, LogicalFalse, LogicalTrue, Nothing } from "@/jsonpath-tools/values/types";
import { NodeList } from "@/jsonpath-tools/values/node-list";
import { Node } from "@/jsonpath-tools/values/node";

/**
 * Application specific language service worker.
 * In addition to the default language service worker it handles custom functions.
 */

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
        const compiledCustomFunction = new Function("jp", "context", ...customFunction.parameterNames, customFunction.code) as CustomFunctionHandler;
        return createJSONPathFunctionHandler(compiledCustomFunction, customFunction.name);
    }
    catch (e) {
        return (context) => {
            context.reportWarning(`Compilation of custom function '${customFunction.name}' failed: ${e}`);
            return Nothing;
        };
    }
}

function createJSONPathFunctionHandler(customFunction: CustomFunctionHandler, functionName: string): FunctionHandler {
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

// Later we will maybe pass the whole library to custom functions (import *). 
// But for now we will just stick with this basic API. We can always expand it but not the other way around.
const JSONPATH_LIBRARY = {
    Nothing,
    LogicalFalse,
    LogicalTrue,
    NodeList,
    Node
};

type CustomFunctionHandler = (jp: typeof JSONPATH_LIBRARY, context: FunctionContext, ...args: FilterValue[]) => FilterValue;