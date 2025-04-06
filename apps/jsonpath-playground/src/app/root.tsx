import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "./styles/globals.css";
import { applicationTheme, applicationCSSVariablesResolver } from "./theme";
import Page from "./page";

export default function Root() {
    return (
        <MantineProvider
            theme={applicationTheme}
            cssVariablesResolver={applicationCSSVariablesResolver}
            defaultColorScheme="auto">
            <Page />
        </MantineProvider>
    );
}
