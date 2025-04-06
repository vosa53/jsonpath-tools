# Get started with a JSONPath evaluation

## Installation

```sh
npm install @jsonpath-tools/jsonpath
```

## Selecting JSON values

```typescript
import { JSONPath } from "@jsonpath-tools/jsonpath";

const queryArgument = {

};

const result = JSONPath.select(`$.abc.def`, queryArgument);
const resultValues = result.createValues();
```

Getting paths to the selected values:
```typescript
const resultPaths = result.createNormalizedPaths();
```

## Transforming JSON values

Replacing values:

```typescript
const replaced = JSONPath.replace(`$.abc.def`, queryArgument, "New value");
```

With a function:

```typescript
const replaced = JSONPath.replace(`$.abc.def`, queryArgument, v => v * 2);
```

Removing values:

```typescript
const removed = JSONPath.remove(`$.abc.def`, queryArgument);
```

## Parsing a query

```typescript
const query = JSONPath.parse(`$.abc.def`);
```