import { defaultJSONPathOptions, JSONPathFunctionHandler } from "@/jsonpath-tools/options";
import { LanguageServiceBackend } from "./components/code-editors/codemirror/jsonpath-codemirror/worker/language-service-backend";
import { CustomLanguageServiceFunction, CustomLanguageServiceWorkerMessage } from "./custom-language-service-worker-mesages";
import { JSONPathNothing } from "@/jsonpath-tools/types";

const EMPTY_FUNCTION_HANDLER: JSONPathFunctionHandler = () => JSONPathNothing;
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
        const compiledFunction = new Function(...customFunction.parameterNames, customFunction.code) as JSONPathFunctionHandler;
        return wrapWithTryCatch(compiledFunction);
    }
    catch {
        console.log("Cannot compile");
        return EMPTY_FUNCTION_HANDLER;
    }
}

function wrapWithTryCatch(functionHandler: JSONPathFunctionHandler): JSONPathFunctionHandler {
    return (...args) => {
        try {
            const result = functionHandler(...args);
            console.log("Executing function: ", result);
            return result;
        }
        catch {
            console.log("Function error.");
            return JSONPathNothing;
        }
    }
}