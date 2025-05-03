# Editor Services

The core library also contains features allowing it to serve as a backend of a JSONPath editor. They can be used like this:
```ts
import { defaultQueryOptions, EditorService } from "@jsonpath-tools/jsonpath";

const editorService = new EditorService();

// Initial synchronization.
editorService.updateQuery("$.books[?@.author != null]");
editorService.updateQueryOptions(defaultQueryOptions);
editorService.updateQueryArgument(queryArgument);
editorService.updateQueryArgumentType(queryArgumentType);

// Get diagnostics.
const diagnostics = editorService.getDiagnostics();

// Write a dot.
editorService.updateQuery("$.books[?@.author != null].");

// Get completions after the dot position.
const completionItems = editorService.getCompletions(27);

// ...
```