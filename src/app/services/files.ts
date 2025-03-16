export async function saveTextFile(fileName: string, mimeType: string, extension: string, text: string): Promise<void> {
    const blob = new Blob([text], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}

export async function openTextFile(extension: string): Promise<string | null> {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = extension;
        input.addEventListener("change", () => {
            const file = input!.files![0];
            if (!file) resolve(null);

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsText(file);
        });
        input.click();
    });
}