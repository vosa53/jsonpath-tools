import { CustomFunction } from "./custom-function";
import { DataTypeRaw } from "./data-type-raw";
import { Operation } from "./operation";
import { PathType } from "./path-type";
import { Settings } from "./settings";

/**
 * Independent state of the application (can not be computed from other values).
 */
export interface ApplicationState {
    /**
     * Custom functions.
     */
    readonly customFunctions: readonly CustomFunction[];
    
    /**
     * Settings.
     */
    readonly settings: Settings;

    /**
     * Query text.
     */
    readonly queryText: string;

    /**
     * Query argument.
     */
    readonly queryArgumentText: string;

    /**
     * Query argument type.
     */
    readonly queryArgumentTypeRaw: DataTypeRaw;

    /**
     * Operation.
     */
    readonly operation: Operation;

    /**
     * Path type.
     */
    readonly pathType: PathType;
}