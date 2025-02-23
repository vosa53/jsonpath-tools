import { Operation, OperationType } from "@/app/models/operation";
import { Button, Group, Modal, Select } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { memo } from "react";
import JSONEditor from "../code-editors/json-editor";
import PanelShell from "../panel-shell";

const ResultPanel = memo(({
    resultText,
    operation,
    onOperationChanged
}: {
    resultText: string,
    operation: Operation,
    onOperationChanged: (operation: Operation) => void
}) => {
    const [modalOpened, { open, close }] = useDisclosure(false);

    return (
        <PanelShell
            toolbar={
                <Group gap="xs">
                    <Modal opened={modalOpened} onClose={close} title={"Edit replacement value"} size="xl">
                        <JSONEditor value={""} onValueChanged={() => { }} />
                        <Button>Save</Button>
                    </Modal>
                    <Select
                        size="xs"
                        allowDeselect={false}
                        data={[
                            { label: "Select", value: OperationType.select },
                            { label: "Replace", value: OperationType.replace },
                            { label: "Delete", value: OperationType.delete }
                        ]}
                        value={operation.type}
                        onChange={value => onOperationChanged({ ...operation, type: value as OperationType })}
                    />
                    {operation.type === OperationType.replace && <Button variant="subtle" size="compact-sm" onClick={() => open()}>Edit Replacement</Button>}
                </Group>
            }
        >
            <JSONEditor value={resultText} readonly onValueChanged={() => { }} />
        </PanelShell>
    );
});
export default ResultPanel;