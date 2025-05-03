# CodeMirror Extension

JSONPath ([RFC 9535](https://datatracker.ietf.org/doc/rfc9535/)) extension for [CodeMirror](https://codemirror.net/) code editor.

## Installation

```sh
npm install @jsonpath-tools/codemirror-lang-jsonpath
```

## Basic Usage

:::warning
Note that this way the editor comes completely unstyled. Theming here is a responsibility of the library user.

Or an alternative is to use a provided [React component](react-component.md).
:::

```ts
import { EditorView, basicSetup } from "codemirror";
import { 
    jsonpath, 
    updateQueryOptionsEffect, 
    updateQueryArgumentEffect, 
    updateQueryArgumentTypeEffect
} 
from "@jsonpath-tools/codemirror-lang-jsonpath";
import { defaultQueryOptions, jsonSchemaToType } from "@jsonpath-tools/jsonpath";

// Convert JSON Schema to a type.
const queryArgumentType = jsonSchemaToType({ schema: queryArgumentSchema });

// Create a CodeMirror editor with the `jsonpath` extension.
const editor = new EditorView({
    doc: `$..inventory[?@.features[?@ == "Bluetooth"] && match(@.make, "[tT].+")]`,
    extensions: [
        basicSetup,
        jsonpath()
    ],
    parent: document.getElementById("app")!
});

// Dispatch configuration.
editor.dispatch({
    effects: [
        updateQueryOptionsEffect.of(defaultQueryOptions),
        updateQueryArgumentEffect.of(queryArgument),
        updateQueryArgumentTypeEffect.of(queryArgumentType)
    ] 
});
```