import { DataTypeAnnotation } from "../data-types/data-types";

export class AnalysisDescriptionService {
    provideDescription(type?: string, annotations?: DataTypeAnnotation[]): string {
        let text = "";
        if (type !== undefined) {
            text += `\n\n---\n\n##### Type`;
            if (type.length < 50 && type.indexOf("\n") === -1)
                text += ": `" + type + "`";
            else {
                text += "\n\n```jsonpath-data-type\n";
                text += type;
                text += "\n```";
            }
        }

        if (annotations !== undefined) {
            for (const annotation of annotations) {
                text += "\n\n---";
                if (annotation.title !== "")
                    text += `\n\n##### ${annotation.title}`;
                const flags: string[] = [];
                if (annotation.deprecated) flags.push("deprecated");
                if (annotation.readOnly) flags.push("read-only");
                if (annotation.writeOnly) flags.push("write-only");
                const flagsText = flags.join(", ");
                if (flagsText !== "")
                    text += `\n\n*${flagsText}*`;
                if (annotation.description !== "")
                    text += `\n\n${annotation.description}`;
                if (annotation.defaultValue !== undefined) {
                    text += "\n\n###### Default Value";
                    text += "\n\n```json\n";
                    text += JSON.stringify(annotation.defaultValue, null, 4);
                    text += "\n```";
                }
                if (annotation.exampleValues.length > 0) {
                    text += "\n\n###### Examples";
                    for (const example of annotation.exampleValues) {
                        text += "\n\n```json\n";
                        text += JSON.stringify(example, null, 4);
                        text += "\n```";
                    }
                }
            }
        }
        return text;
    }
}