import { Diagnostics, DiagnosticsType } from "@/jsonpath-tools/diagnostics";
import { Checkbox, DefaultMantineColor, Group, Table, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle, IconAlertTriangleFilled, IconExclamationCircle, IconExclamationCircleFilled } from "@tabler/icons-react";
import { memo, ReactNode, useMemo, useState } from "react";
import PanelShell from "../panel-shell";

const DiagnosticsPanel = memo(({
    diagnostics,
    onSelectedDiagnosticsChanged
}: {
    diagnostics: readonly Diagnostics[],
    onSelectedDiagnosticsChanged: (diagnostics: Diagnostics | null) => void
}) => {
    const [filters, setFilters] = useState<DiagnosticsFilters>({ showErrors: true, showWarnings: true });
    const {filteredDiagnostics, errorCount, warningCount} = useMemo(() => {
        const filteredDiagnostics = diagnostics.filter(d => 
            d.type === DiagnosticsType.error && filters.showErrors || 
            d.type === DiagnosticsType.warning && filters.showWarnings
        );
        const errorCount = diagnostics.filter(d => d.type === DiagnosticsType.error).length;
        const warningCount = diagnostics.filter(d => d.type === DiagnosticsType.warning).length;
        return { filteredDiagnostics, errorCount, warningCount };
    }, [diagnostics, filters]);

    return (
        <PanelShell
            toolbar={
                <Group gap="xs">
                    <Checkbox
                        variant="outline"
                        defaultChecked
                        label={`Errors (${errorCount})`}
                        onChange={e => setFilters({ ...filters, showErrors: e.currentTarget.checked })}
                    />
                    <Checkbox
                        variant="outline"
                        defaultChecked
                        label={`Warnings (${warningCount})`}
                        onChange={e => setFilters({ ...filters, showWarnings: e.currentTarget.checked })}
                    />
                </Group>
            }
        >
            <DiagnosticsView diagnostics={filteredDiagnostics} onSelectedDiagnosticsChanged={onSelectedDiagnosticsChanged} />
        </PanelShell>
    );
});
export default DiagnosticsPanel;

function DiagnosticsView({ 
    diagnostics,
    onSelectedDiagnosticsChanged
}: { 
    diagnostics: readonly Diagnostics[],
    onSelectedDiagnosticsChanged: (diagnostics: Diagnostics | null) => void
}) {
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
                <Table.Tr key={i} onMouseEnter={() => onSelectedDiagnosticsChanged(d)} onMouseLeave={() => onSelectedDiagnosticsChanged(null)}>
                    <Table.Td>
                        <DiagnosticsIcon diagnosticsType={d.type} />
                    </Table.Td>
                    <Table.Td>{d.message}</Table.Td>
                    <Table.Td>{d.textRange.position}</Table.Td>
                    <Table.Td>{d.textRange.length}</Table.Td>
                </Table.Tr>
            ))}</Table.Tbody>
        </Table>
    );
}

function DiagnosticsIcon({ diagnosticsType }: { diagnosticsType: DiagnosticsType }) {
    const ICON_SIZE = 20;
    let iconColor: DefaultMantineColor;
    let icon: ReactNode;
    if (diagnosticsType === DiagnosticsType.error) {
        iconColor = "red.7";
        icon = <IconExclamationCircleFilled size={ICON_SIZE} />;
    }
    else if (diagnosticsType === DiagnosticsType.warning) {
        iconColor = "yellow.4";
        icon = <IconAlertTriangleFilled size={ICON_SIZE} />;
    }
    else
        throw new Error("Unknown diagnostics type.");

    return (
        <ThemeIcon variant="light" color={iconColor} size={28} radius="xl">
            {icon}
        </ThemeIcon>
    );
}

interface DiagnosticsFilters {
    readonly showErrors: boolean;
    readonly showWarnings: boolean;
}