import { JSONPath } from "../lib";

/**
 * JSONPath library testing entry point.
 */

const queryArgument = {
    books: [
        { title: "1984", author: "George Orwell" },
        { title: "Epic of Gilgamesh", author: null },
        { title: "The Old Man and the Sea", author: "Ernest Hemingway" }
    ]
};

const nodes = JSONPath.select(`$.books[?@.author != null].title`, queryArgument);
const values = nodes.toValues();
const paths = nodes.toNormalizedPaths();

console.log(values);
console.log(paths);
