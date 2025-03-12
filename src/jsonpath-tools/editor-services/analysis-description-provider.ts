import { TypeAnnotation } from "./helpers/types";

export class AnalysisDescriptionProvider {
    provideDescription(type?: string, annotations?: TypeAnnotation[]): string {
        let text = "";
        if (type !== undefined)
            text += `\n\n---\n\n##### Type: \`${type}\``;

        if (annotations !== undefined) {
            for (const annotation of annotations) {
                text += "\n\n---\n";
                if (annotation.title !== "")
                    text += `\n##### ${annotation.title}`;
                if (annotation.description !== "")
                    text += `\n${annotation.description}`;
                if (annotation.exampleValues.length > 0) {
                    text += "\n###### Examples";
                    for (const example of annotation.exampleValues) {
                        text += "\n```json\n";
                        text += JSON.stringify(example, null, 4);
                        text += "\n```";
                    }
                }
            }
        }
        return text;
    }
}