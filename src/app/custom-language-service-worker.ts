import { defaultJSONPathOptions, JSONPathFunctionHandler } from "@/jsonpath-tools/options";
import { LanguageServiceBackend } from "./components/code-editors/codemirror/jsonpath-codemirror/worker/language-service-backend";
import { CustomLanguageServiceFunction, CustomLanguageServiceWorkerMessage } from "./custom-language-service-worker-mesages";
import { JSONPathNothing } from "@/jsonpath-tools/types";

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
        const compiledFunction = new Function("context", ...customFunction.parameterNames, customFunction.code) as JSONPathFunctionHandler;
        return wrapWithTryCatch(compiledFunction, customFunction.name);
    }
    catch (e) {
        console.log("Cannot compile");
        return (context) => {
            context.reportWarning(`Custom function '${customFunction.name}' was compiled with errors: ${e}`);
            return JSONPathNothing;
        };
    }
}

// TODO: Remove console logs.
function wrapWithTryCatch(functionHandler: JSONPathFunctionHandler, functionName: string): JSONPathFunctionHandler {
    return (context, ...args) => {
        try {
            const result = functionHandler(context, ...args);
            console.log("Executing function: ", result);
            return result;
        }
        catch(e) {
            context.reportWarning(`Exception while executing custom function '${functionName}': ${e}`);
            console.log("Function error.");
            return JSONPathNothing;
        }
    }
}