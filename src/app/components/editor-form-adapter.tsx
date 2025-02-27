import { Input, Paper } from "@mantine/core";
import { useUncontrolled } from "@mantine/hooks";
import { CSSProperties, FocusEvent, ReactNode } from "react";

export function EditorFormAdapter({
    editor,
    style,
    label,
    value,
    defaultValue,
    onChange,
    onFocus,
    onBlur,
    error,
}: {
    editor: (value: string, onValueChange: (value: string) => void) => ReactNode,
    style?: CSSProperties,
    label?: ReactNode,
    value?: string,
    defaultValue?: string,
    onChange?: (value: string) => void,
    onFocus?: (event: FocusEvent<HTMLInputElement>) => void,
    onBlur?: (event: FocusEvent<HTMLInputElement>) => void,
    error?: string
}) {
    const [_value, handleChange] = useUncontrolled({
        value,
        defaultValue,
        finalValue: 'Final',
        onChange,
    });

    return (
        <Input.Wrapper label={label} error={error} style={style}>
            <Paper withBorder p="3px 0" style={{ maxHeight: "200px", overflow: "auto" }}>
                {editor(_value, handleChange)}
            </Paper>
        </Input.Wrapper>
    );
}