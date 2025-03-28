import { countFunction } from "./functions/functions";
import { Function } from "./functions/function";
import { lengthFunction } from "./functions/functions";
import { matchFunction } from "./functions/functions";
import { searchFunction } from "./functions/functions";
import { valueFunction } from "./functions/functions";

export interface QueryOptions {
    readonly functions: { [name: string]: Function };
}

export const defaultQueryOptions: QueryOptions = {
    functions: {
        "length": lengthFunction,
        "count": countFunction,
        "match": matchFunction,
        "search": searchFunction,
        "value": valueFunction
    }
};
