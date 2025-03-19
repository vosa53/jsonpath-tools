import { defaultJSONPathOptions, JSONPathFunctionHandler } from "@/jsonpath-tools/options";
import { LanguageServiceBackend } from "./components/code-editors/codemirror/jsonpath-codemirror/worker/language-service-backend";
import { CustomLanguageServiceFunction, CustomLanguageServiceWorkerMessage } from "./custom-language-service-worker-mesages";
import { JSONPathLogicalFalse, JSONPathLogicalTrue, JSONPathNodeList, JSONPathNothing } from "@/jsonpath-tools/types";

const customFunctions = new Map<string, JSONPathFunctionHandler>();

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

function resolveFunction(functionName: string): JSONPathFunctionHandler {
    if (Object.hasOwn(defaultJSONPathOptions.functions, functionName)) 
        return defaultJSONPathOptions.functions[functionName].handler;

    const customFunctionHandler = customFunctions.get(functionName);
    if (customFunctionHandler !== undefined) 
        return customFunctionHandler;

    throw new Error(`Function '${functionName}' not found.`);
}

function compileCustomFunction(customFunction: CustomLanguageServiceFunction): JSONPathFunctionHandler {
    try {
        const compiledCustomFunction = new Function("jp", "context", ...customFunction.parameterNames, customFunction.code) as JSONPathFunctionHandler;
        return createJSONPathFunctionHandler(compiledCustomFunction, customFunction.name);
    }
    catch (e) {
        return (context) => {
            context.reportWarning(`Compilation of custom function '${customFunction.name}' failed: ${e}`);
            return JSONPathNothing;
        };
    }
}

function createJSONPathFunctionHandler(customFunction: Function, functionName: string): JSONPathFunctionHandler {
    return (context, ...args) => {
        try {
            const result = customFunction(JSONPATH_LIBRARY, context, ...args);
            return result;
        }
        catch(e) {
            context.reportWarning(`Error while executing custom function '${functionName}': ${e}`);
            return JSONPathNothing;
        }
    }
}

// TODO: Probably pass the whole library to custom functions (import *).
const JSONPATH_LIBRARY = {
    JSONPathNothing: JSONPathNothing,
    JSONPathLogicalFalse: JSONPathLogicalFalse,
    JSONPathLogicalTrue: JSONPathLogicalTrue,
    JSONPathNodeList: JSONPathNodeList
};