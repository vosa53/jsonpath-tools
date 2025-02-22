import { JSONPathDiagnostics } from "@/jsonpath-tools/diagnostics";
import { Box, Checkbox, Group, List, Table, ThemeIcon } from "@mantine/core";
import { IconExclamationCircle } from "@tabler/icons-react";
import PanelShell from "../panel-shell";
import { memo } from "react";

const DiagnosticsPanel = memo(({ 
    diagnostics 
}: { 
    diagnostics: readonly JSONPathDiagnostics[] 
}) => {
    return (
        <PanelShell
            toolbar={
                <Group gap="xs">
                    <Checkbox
                        variant="outline"
                        defaultChecked
                        label="Errors"
                    />
                    <Checkbox
                        variant="outline"
                        defaultChecked
                        label="Warnings"
                    />
                </Group>
            }
        >
            <DiagnosticsView diagnostics={diagnostics} />
        </PanelShell>
    );
});
export default DiagnosticsPanel;

function DiagnosticsView({ diagnostics }: { diagnostics: readonly JSONPathDiagnostics[] }) {
    return (
        <Table>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Message</Table.Th>
                    <Table.Th>Line</Table.Th>
                    <Table.Th>Column</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{diagnostics.map((d, i) => (
                <Table.Tr key={i}>
                    <Table.Td>
                        {
                            <ThemeIcon color="red.7" size={24} radius="xl">
                                <IconExclamationCircle size={16} />
                            </ThemeIcon>
                        }
                    </Table.Td>
                    <Table.Td>{d.message}</Table.Td>
                    <Table.Td>{d.textRange.position}</Table.Td>
                    <Table.Td>{d.textRange.length}</Table.Td>
                </Table.Tr>
            ))}</Table.Tbody>
        </Table>
    );
}
