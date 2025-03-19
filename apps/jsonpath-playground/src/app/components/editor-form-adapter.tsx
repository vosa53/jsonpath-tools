import { InputWrapper, Paper } from "@mantine/core";
import { useUncontrolled } from "@mantine/hooks";
import { CSSProperties, FocusEventHandler, ReactNode } from "react";
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
    editor: (value: string, onValueChange: (value: string) => void, onFocus?: FocusEventHandler<HTMLElement>, onBlur?: FocusEventHandler<HTMLElement>) => ReactNode,
    style?: CSSProperties,
    label?: ReactNode,
    description?: ReactNode,
    value?: string,
    defaultValue?: string,
    onChange?: (value: string) => void,
    onFocus?: FocusEventHandler<HTMLElement>,
    onBlur?: FocusEventHandler<HTMLElement>,
    error?: string
}) {
    const [_value, handleChange] = useUncontrolled({
        value,
        defaultValue,
        finalValue: "Final",
        onChange,
    });

    return (
        <InputWrapper label={label} description={description} error={error} style={style}>
            <Paper 
                className={classes.input} 
                withBorder 
                style={{ borderColor: error !== undefined ? "var(--mantine-color-error)" : undefined }}
                mb={error !== undefined ? "calc(var(--mantine-spacing-xs) / 2)" : undefined}>
                {editor(_value, handleChange, onFocus, onBlur)}
            </Paper>
        </InputWrapper>
    );
}