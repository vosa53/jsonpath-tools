# Get Started with a JSONPath Evaluation

## Installation

```sh
npm install @jsonpath-tools/jsonpath
```

## Selecting JSON Values

```ts
import { JSONPath } from "@jsonpath-tools/jsonpath";

const queryArgument = {

};

const result = JSONPath.select(`$.abc.def`, queryArgument);
const resultValues = result.createValues();
```

Getting paths to the selected values:
```ts
const resultPaths = result.createNormalizedPaths();
```

## Transforming JSON Values

Replacing values:

```ts
const replaced = JSONPath.replace(`$.abc.def`, queryArgument, "New value");
```

With a function:

```ts
const replaced = JSONPath.replace(`$.abc.def`, queryArgument, v => v * 2);
```

Removing values:

```ts
const removed = JSONPath.remove(`$.abc.def`, queryArgument);
```

## Parsing a Query

```ts
const query = JSONPath.parse(`$.abc.def`);
```