import { List, ThemeIcon } from "@mantine/core";
import { IconExclamationCircle } from "@tabler/icons-react";
import { JSONPathDiagnostics } from "../../jsonpath-tools/diagnostics";

export default function DiagnosticsView({ diagnostics }: { diagnostics: readonly JSONPathDiagnostics[] }) {
    return (
        <List
            p="xs"
            spacing="xs"
            size="sm"
            center
            icon={
                <ThemeIcon color="red.7" size={24} radius="xl">
                    <IconExclamationCircle size={16} />
                </ThemeIcon>
            }>
            {diagnostics.map((diagnostic, index) => (
                <List.Item key={index}>
                    ({diagnostic.type} {diagnostic.textRange.position}:{diagnostic.textRange.length}): {diagnostic.message}
                </List.Item>
            ))}
        </List>
    );

}