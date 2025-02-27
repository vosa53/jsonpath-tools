import { IconEdit, IconTrash } from "@tabler/icons-react";
import { CustomFunction } from "../models/custom-function";
import { ActionIcon, Flex, Title, Text, Box } from "@mantine/core";

export default function CustomFunctionView({
    customFunction,
    onEditClick
}: {
    customFunction: CustomFunction,
    onEditClick: () => void
}) {
    return (
        <Box mb="sm">
            <Flex align="end">
                <Box flex="1 1 0">
                    <Title order={4}>{customFunction.name}</Title>
                </Box>
                <ActionIcon variant="subtle" size="input-sm" onClick={onEditClick}>
                    <IconEdit size={20} />
                </ActionIcon>
                <ActionIcon variant="subtle" size="input-sm">
                    <IconTrash size={20} />
                </ActionIcon>
            </Flex>
            <div>{customFunction.description}</div>
            <strong>Parameters</strong>
            <Box ml="md">
                {customFunction.parameters.map((p, i) => (
                    <div key={i}>
                        <strong>{p.name}: {p.type}</strong>{" " + p.description}
                    </div>
                ))}
            </Box>
            <strong>Returns: {customFunction.returnType}</strong>
        </Box>
    );
}
