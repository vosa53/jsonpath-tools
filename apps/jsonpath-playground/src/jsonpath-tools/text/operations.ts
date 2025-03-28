import { TextChange } from "./text-change";

export function applyTextChanges(text: string, changes: readonly TextChange[]): string {
    const sortedChanges = changes.toSorted((a, b) => a.range.position - b.range.position);
    let newText = "";
    let previousChangeEnd = 0;
    for (const change of sortedChanges) {
        const changeEnd = change.range.position + change.range.length;
        if (previousChangeEnd > change.range.position)
            throw new Error("Change ranges can not overlap.");
        if (changeEnd > text.length)
            throw new Error("Change range must be contained in the input text.");
        newText += text.substring(previousChangeEnd, change.range.position);
        newText += change.newText;
        previousChangeEnd = changeEnd;
    }
    newText += text.substring(previousChangeEnd);
    return newText;
}