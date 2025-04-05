import { TextChange } from "./text-change";

/**
 * Returns a new text with applied changes.
 * @param text The text to which the changes are to be applied.
 * @param changes Changes to apply. Ranges of the changes can not overlap and must be contained in the input text.
 */
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