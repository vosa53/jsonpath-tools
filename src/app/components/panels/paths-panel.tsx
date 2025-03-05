import { PathType } from "@/app/models/path-type";
import { ActionIcon, Group, Select } from "@mantine/core";
import { memo } from "react";
import JSONEditor from "../code-editors/json-editor";
import PanelShell from "../panel-shell";
import { IconFileDownload } from "@tabler/icons-react";

const PathsPanel = memo(({
    pathsText,
    pathType,
    onPathTypeChanged
}: {
    pathsText: string,
    pathType: PathType,
    onPathTypeChanged: (pathType: PathType) => void
}) => {
    return (
        <PanelShell
            toolbar={
                <Group gap="xs" w="100%">
                    <Select
                        size="xs"
                        allowDeselect={false}
                        data={[
                            { label: "Normalized Path", value: PathType.normalizedPath },
                            { label: "JSON Pointer", value: PathType.jsonPointer }
                        ]}
                        value={pathType}
                        onChange={value => onPathTypeChanged(value as PathType)}
                    />
                    <ActionIcon variant="default" aria-label="Settings" ml="auto">
                        <IconFileDownload style={{ width: '70%', height: '70%' }} stroke={1.5} />
                    </ActionIcon>
                </Group>
            }
        >
            <JSONEditor value={pathsText} readonly onValueChanged={() => { }} />
        </PanelShell>
    );
});
export default PathsPanel;