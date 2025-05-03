# Get Started with a JSONPath Evaluation

## Installation

```sh
npm install @jsonpath-tools/jsonpath
```

## Selecting JSON Values

```ts
import { JSONPath } from "@jsonpath-tools/jsonpath";

const queryArgument = {
    books: [
        { title: "1984", author: "George Orwell" },
        { title: "Epic of Gilgamesh", author: null },
        { title: "The Old Man and the Sea", author: "Ernest Hemingway" }
    ]
};

const nodes = JSONPath.select(`$.books[?@.author != null].title`, queryArgument);
```

Getting the selected values:
```ts
const values = nodes.toValues();
```

Getting paths to the selected values:
```ts
const paths = nodes.toNormalizedPaths();
```

## Transforming JSON Values

Replacing values:
```ts
const replaced = JSONPath.replace(`$.books[?@.author != null].title`, queryArgument, "New title");
```

With a function:
```ts
const replaced = JSONPath.replace(`$.books[?@.author != null].title`, queryArgument, v => (v as string).toUpperCase());
```

Removing values:
```ts
const removed = JSONPath.remove(`$.books[?@.author != null].title`, queryArgument);
```

## Parsing a Query

```ts
const query = JSONPath.parse(`$.books[?@.title == "1984", 3141]`);
```

The result syntax tree will look like this:

![Syntax tree example](images/syntax-tree-example.svg)