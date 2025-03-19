import { Input, InputWrapper, Paper } from "@mantine/core";
import { useUncontrolled } from "@mantine/hooks";
import { CSSProperties, FocusEvent, ReactNode } from "react";
import classes from "./editor-form-adapter.module.css";

export function EditorFormAdapter({
    editor,
    style,
    label,
    description,
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
    description?: ReactNode,
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
        <InputWrapper label={label} description={description} error={error} style={style}>
            <Paper withBorder p="3px 0" className={classes.input}>
                {editor(_value, handleChange)}
            </Paper>
        </InputWrapper>
    );
}