import { alpha, createTheme, CSSVariablesResolver, Input } from "@mantine/core";

export const applicationTheme = createTheme({
    fontFamily: "Roboto",
    fontFamilyMonospace: "Cascadia Mono",
    primaryColor: "violet",
    breakpoints: {
        xs: "28em",
        sm: "52em",
        md: "66em",
        lg: "74em",
        xl: "90em"
    },
    components: {
        InputWrapper: Input.Wrapper.extend({
            defaultProps: {
                inputWrapperOrder: ["label", "input", "description", "error"]
            }
        })
    }
});

export const applicationCSSVariablesResolver: CSSVariablesResolver = (theme) => ({
    variables: {

    },
    light: {
        "--application-color-text-selection": alpha(theme.colors.violet[6], 0.2),
        "--application-color-code-block": theme.colors.gray[2],
        "--application-color-code-background": "var(--mantine-color-body)",
        "--application-color-code-highlighted": alpha(theme.colors.yellow[3], 0.2),
        "--application-color-code-highlighted-current": alpha(theme.colors.yellow[9], 0.2),
        "--application-color-code-highlighted-match": "#4dabf740",
        "--application-color-code-current-line": theme.colors.gray[1]
    },
    dark: {
        "--application-color-text-selection": alpha(theme.colors.violet[4], 0.3),
        "--application-color-code-block": theme.colors.gray[8],
        "--application-color-code-background": "var(--mantine-color-body)",
        "--application-color-code-highlighted": alpha(theme.colors.yellow[9], 0.2),
        "--application-color-code-highlighted-current": alpha(theme.colors.yellow[3], 0.3),
        "--application-color-code-highlighted-match": "#d0ebff40",
        "--application-color-code-current-line": theme.colors.dark[6]
    },
});