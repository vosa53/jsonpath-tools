import { ApplicationState } from "../models/application-state";
import { DataTypeRaw, DataTypeRawFormat } from "../models/data-type-raw";
import { examples } from "../models/examples";
import { OperationType, OperationReplacementType, Operation } from "../models/operation";
import { PathType } from "../models/path-type";
import { Settings } from "../models/settings";

/**
 * Loads the application state or returns its initial value.
 */
export function loadApplicationState(): ApplicationState {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (serializedState === null)
        return initialApplicationState;
    else
        return JSON.parse(serializedState);
}

/**
 * Saves the application state.
 * @param state Application state.
 */
export function saveApplicationState(state: ApplicationState) {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
}

const LOCAL_STORAGE_KEY = "state";

const initialSettings: Settings = {
    autoRun: true,
    autoSave: true
};
const initialQueryText = `$..inventory[?@.features[?@ == "Bluetooth"] && match(@.make, "[tT].+")]`;
const initialQueryArgumentTypeRaw: DataTypeRaw = {
    format: DataTypeRawFormat.jsonSchema,
    jsonSchemaText: examples[0].jsonSchemaText,
    jsonTypeDefinitionText: examples[0].jsonTypeDefinitionText
};
const initialOperation: Operation = {
    type: OperationType.select,
    replacement: {
        type: OperationReplacementType.jsonValue,
        jsonValueText: "{}",
        jsonPatchText: "[]"
    }
};
const initialApplicationState: ApplicationState = {
    customFunctions: [],
    settings: initialSettings,
    queryText: initialQueryText,
    queryArgumentText: examples[0].jsonText,
    queryArgumentTypeRaw: initialQueryArgumentTypeRaw,
    operation: initialOperation,
    pathType: PathType.normalizedPath
};