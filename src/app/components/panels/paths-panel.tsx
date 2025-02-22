import { PathType } from "@/app/models/path-type";
import { Group, Select } from "@mantine/core";
import { memo } from "react";
import JSONEditor from "../code-editors/json-editor";
import PanelShell from "../panel-shell";

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
                <Group gap="xs">
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
                </Group>
            }
        >
            <JSONEditor value={pathsText} readonly onValueChanged={() => { }} />
        </PanelShell>
    );
});
export default PathsPanel;