/**
 * Saves the given text file to the user's device.
 * @param fileName Name of the file.
 * @param mimeType MIME type of the file.
 * @param extension File extension (including the `.`).
 * @param text Text content of the file.
 */
export async function saveTextFile(fileName: string, mimeType: string, extension: string, text: string): Promise<void> {
    const blob = new Blob([text], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}

/**
 * Gets a text file from the user's device.
 * @param extension Required file extension.
 * @returns File text content or `null` when the operation was cancelled.
 */
export async function openTextFile(extension: string): Promise<string | null> {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = extension;
        input.addEventListener("change", () => {
            const files = input.files!;
            if (files.length !== 1) resolve(null);

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsText(files[0]);
        });
        input.click();
    });
}