import { List, ThemeIcon } from "@mantine/core";
import { JSONPathDiagnostics } from "../parser/diagnostics";
import { IconError404, IconExclamationCircle } from "@tabler/icons-react";

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