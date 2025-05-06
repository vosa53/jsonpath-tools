import { ActionIcon, Box, Flex, Title, Tooltip } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { CustomFunction } from "../../models/custom-function";
import { MarkdownView } from "../markdown-view";

/**
 * Displays a custom JSONPath function.
 */
export default function CustomFunctionView({
    customFunction,
    onEditClick,
    onRemoveClick
}: {
    customFunction: CustomFunction,
    onEditClick: () => void,
    onRemoveClick: () => void
}) {
    return (
        <Box mb="sm">
            <Flex align="end">
                <Box flex="1 1 0">
                    <Title order={4}>{customFunction.name}</Title>
                </Box>
                <Tooltip label="Edit Function">
                    <ActionIcon variant="subtle" aria-label="Edit the Function" size="input-sm" onClick={onEditClick}>
                        <IconEdit size={20} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label="Remove Function">
                    <ActionIcon variant="subtle" aria-label="Remove the Function" size="input-sm" onClick={onRemoveClick}>
                        <IconTrash size={20} />
                    </ActionIcon>
                </Tooltip>
            </Flex>
            <MarkdownView markdown={customFunction.description} />
            <Title order={5}>Parameters</Title>
            <ul>
                {customFunction.parameters.map((p, i) => (
                    <li key={i}>
                        <code>{p.name}: {p.type}</code>: <MarkdownView markdown={p.description} />
                    </li>
                ))}
            </ul>
            <Title order={5}>Return Type</Title>
            <ul>
                <li>
                    <code>{customFunction.returnType}</code>
                </li>
            </ul>
        </Box>
    );
}
