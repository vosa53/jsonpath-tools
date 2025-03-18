import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "./styles/globals.css";
import { applicationTheme, applicationCSSVariablesResolver } from "./theme";
import Home from "./page";

export default function RootLayout() {
    return (
        <MantineProvider
            theme={applicationTheme}
            cssVariablesResolver={applicationCSSVariablesResolver}
            defaultColorScheme="auto">
            <Home />
        </MantineProvider>
    );
}
