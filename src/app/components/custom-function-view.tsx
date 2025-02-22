import { CustomFunction } from "../models/custom-function";
import { Button, Title } from "@mantine/core";

export default function CustomFunctionView({
    customFunction,
    onEditClick
}: {
    customFunction: CustomFunction,
    onEditClick: () => void
}) {
    return (
        <div>
            <Title order={4}>{customFunction.name}</Title>
            <div>{customFunction.description}</div>
            <Button onClick={onEditClick} variant="subtle">Edit</Button>
        </div>
    );
}
