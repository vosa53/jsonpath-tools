import { countFunction } from "./functions/functions";
import { Function } from "./functions/function";
import { lengthFunction } from "./functions/functions";
import { matchFunction } from "./functions/functions";
import { searchFunction } from "./functions/functions";
import { valueFunction } from "./functions/functions";

/**
 * Defines an environment in which the JSONPath query is executed.
 */
export interface QueryOptions {
    /**
     * Defined functions.
     */
    readonly functions: { [name: string]: Function };
}

/**
 * Query options with functions from the JSONPath standard. 
 */
export const defaultQueryOptions: QueryOptions = {
    functions: {
        "length": lengthFunction,
        "count": countFunction,
        "match": matchFunction,
        "search": searchFunction,
        "value": valueFunction
    }
};
