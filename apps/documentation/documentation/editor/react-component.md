# React Editor Component

## Installation

```sh
npm install @jsonpath-tools/jsonpath-editor-react
```

## Example Usage

```tsx
export default function Example() {
    const [value, setValue] = useState(`$..inventory.*`);
    return (
        <JSONPathEditor
            value={value}
            onValueChange={setValue}
            queryOptions={defaultQueryOptions}
            queryArgument={queryArgument}
            queryArgumentType={queryArgumentType} />
    );
}
```