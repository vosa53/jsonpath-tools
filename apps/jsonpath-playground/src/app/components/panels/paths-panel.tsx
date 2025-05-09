import { ActionIcon, Select, Tooltip } from "@mantine/core";
import { memo } from "react";
import JSONEditor from "../code-editors/json-editor";
import PanelShell from "../panel-shell";
import { IconFileDownload } from "@tabler/icons-react";
import { PathType } from "../../models/path-type";
import { saveTextFile } from "../../services/files";

/**
 * Panel displaying JSONPath query result paths.
 */
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
                <>
                    <Tooltip label="Path Format">
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
                    </Tooltip>
                    <Tooltip label="Save To File">
                        <ActionIcon variant="default" aria-label="Save To a File" ml="auto" onClick={async () => await saveTextFile("paths.json", "application/json", ".json", pathsText)}>
                            <IconFileDownload style={{ width: "70%", height: "70%" }} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                </>
            }
        >
            <JSONEditor value={pathsText} readonly onValueChanged={() => { }} />
        </PanelShell>
    );
});
export default PathsPanel;