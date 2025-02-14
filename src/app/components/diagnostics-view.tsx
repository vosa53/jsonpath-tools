import { Box, List, Table, ThemeIcon } from "@mantine/core";
import { IconExclamationCircle } from "@tabler/icons-react";
import { JSONPathDiagnostics } from "../../jsonpath-tools/diagnostics";

export default function DiagnosticsView({ diagnostics }: { diagnostics: readonly JSONPathDiagnostics[] }) {
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
